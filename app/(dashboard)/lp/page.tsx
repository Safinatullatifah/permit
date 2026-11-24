import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getPaginatedPermits, serializePermitRows } from "@/lib/queries/permits"
import PermitDashboardControls from "@/components/permit/PermitDashboardControls"
import PermitTable from "@/components/permit/PermitTable"
import { FileCheck } from "lucide-react"

interface LpDashboardPageProps {
  searchParams?: Promise<{
    tab?: string
    q?: string
    page?: string
    pageSize?: string
    sortBy?: string
    sortOrder?: string
  }>
}

export default async function LpDashboardPage({
  searchParams,
}: LpDashboardPageProps) {
  const session = await auth()

  if (!session?.user?.id || session.user.role !== "LP") {
    return (
      <div className="bg-white border border-red-200 rounded-lg p-6 text-sm text-red-700">
        Halaman ini khusus untuk role <strong>Legal &amp; Procurement (LP)</strong>. Silakan login menggunakan akun LP (misal: <code>lp_legal</code>).
      </div>
    )
  }

  const resolvedParams = (await searchParams) ?? {}

  const [data, awaitingLpCount] = await Promise.all([
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
        poNumber: { not: null },
        picVerified: true,
        lpVerified: null,
        status: "PENDING",
      },
    }),
  ])

  const serializedItems = serializePermitRows(data.items)

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Verifikasi Legalitas &amp; PO (LP)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Verifikasi kesesuaian aspek komersial dan nomor Purchase Order (PO) pada izin kerja rekanan vendor sebelum diteruskan ke tahap persetujuan SHE.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 px-3.5 py-2 rounded-lg text-sm font-medium w-fit">
          <FileCheck className="w-4 h-4" />
          Menunggu Verifikasi LP: <strong>{awaitingLpCount}</strong>
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
        viewerRole="LP"
      />
    </div>
  )
}
