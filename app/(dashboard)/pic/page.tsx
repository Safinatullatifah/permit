import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getPaginatedPermits, serializePermitRows } from "@/lib/queries/permits"
import PermitDashboardControls from "@/components/permit/PermitDashboardControls"
import PermitTable from "@/components/permit/PermitTable"
import { FileSpreadsheet, ShieldCheck } from "lucide-react"

interface PicDashboardPageProps {
  searchParams?: Promise<{
    tab?: string
    q?: string
    page?: string
    pageSize?: string
    sortBy?: string
    sortOrder?: string
  }>
}

export default async function PicDashboardPage({
  searchParams,
}: PicDashboardPageProps) {
  const session = await auth()

  if (!session?.user?.id || session.user.role !== "PIC") {
    return (
      <div className="bg-white border border-red-200 rounded-lg p-6 text-sm text-red-700">
        Halaman ini khusus untuk role <strong>PIC Area</strong>. Silakan login menggunakan akun PIC (misal: <code>pic_area</code>).
      </div>
    )
  }

  const resolvedParams = (await searchParams) ?? {}

  const [data, awaitingInitialCount, awaitingSpkCount] = await Promise.all([
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
        picId: session.user.id,
        status: "PENDING",
        picVerified: null,
      },
    }),
    prisma.permit.count({
      where: {
        picId: session.user.id,
        status: "PENDING",
        poNumber: null,
        picVerified: true,
        userVerified: null,
      },
    }),
  ])

  const serializedItems = serializePermitRows(data.items)

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Verifikasi Area (PIC)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Periksa kesiapan lokasi kerja dan verifikasi teknis berkas SPK untuk permit yang ditugaskan kepada Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3.5 py-2 rounded-lg text-sm font-medium">
            <ShieldCheck className="w-4 h-4" />
            Menunggu Verifikasi Awal: <strong>{awaitingInitialCount}</strong>
          </div>
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 px-3.5 py-2 rounded-lg text-sm font-medium">
            <FileSpreadsheet className="w-4 h-4" />
            Menunggu Verifikasi SPK: <strong>{awaitingSpkCount}</strong>
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
        viewerRole="PIC"
      />
    </div>
  )
}
