import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getPaginatedPermits, serializePermitRows } from "@/lib/queries/permits"
import PermitDashboardControls from "@/components/permit/PermitDashboardControls"
import PermitTable from "@/components/permit/PermitTable"
import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react"

interface SheDashboardPageProps {
  searchParams?: Promise<{
    tab?: string
    q?: string
    page?: string
    pageSize?: string
    sortBy?: string
    sortOrder?: string
  }>
}

export default async function SheDashboardPage({
  searchParams,
}: SheDashboardPageProps) {
  const session = await auth()

  if (!session?.user?.id || session.user.role !== "SHE") {
    return (
      <div className="bg-white border border-red-200 rounded-lg p-6 text-sm text-red-700">
        Halaman ini khusus untuk role <strong>Safety, Health &amp; Environment (SHE)</strong>. Silakan login menggunakan akun admin SHE (misal: <code>admin_she</code>).
      </div>
    )
  }

  const resolvedParams = (await searchParams) ?? {}

  const [data, awaitingSheCount, activeOpenCount, highRiskCount] = await Promise.all([
    getPaginatedPermits({
      tab: resolvedParams.tab,
      q: resolvedParams.q,
      page: resolvedParams.page,
      pageSize: resolvedParams.pageSize,
      sortBy: resolvedParams.sortBy,
      sortOrder: resolvedParams.sortOrder,
      userId: session.user.id,
      role: session.user.role,
    }),
    prisma.permit.count({
      where: {
        status: "PENDING",
        OR: [
          {
            poNumber: { not: null },
            picVerified: true,
            lpVerified: true,
          },
          {
            poNumber: null,
            picVerified: true,
            userVerified: true,
          },
        ],
      },
    }),
    prisma.permit.count({
      where: {
        status: "OPEN",
      },
    }),
    prisma.permit.count({
      where: {
        status: "OPEN",
        isHighRisk: true,
      },
    }),
  ])

  const serializedItems = serializePermitRows(data.items)

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-600" />
            Approval Akhir &amp; Pengawasan Permit (SHE)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tinjau seluruh izin kerja yang telah lolos verifikasi awal/dokumen, tentukan klasifikasi risiko tinggi (High Risk), dan berikan persetujuan akhir penerbitan izin kerja.
          </p>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            Siap Approval SHE: <strong>{awaitingSheCount}</strong>
          </div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Izin Kerja Aktif (OPEN): <strong>{activeOpenCount}</strong>
          </div>
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            High Risk: <strong>{highRiskCount}</strong>
          </div>
        </div>
      </div>

      <PermitDashboardControls
        activeTab={data.activeTab}
        query={data.query}
        pageSize={data.pageSize}
        counts={data.counts}
      />

      <PermitTable
        items={serializedItems}
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        totalPages={data.totalPages}
        sortBy={data.sortBy}
        sortOrder={data.sortOrder}
        activeTab={data.activeTab}
        viewerRole="SHE"
      />
    </div>
  )
}
