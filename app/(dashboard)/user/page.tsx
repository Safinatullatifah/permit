import Link from "next/link"
import { auth } from "@/lib/auth"
import { getPaginatedPermits, serializePermitRows } from "@/lib/queries/permits"
import PermitDashboardControls from "@/components/permit/PermitDashboardControls"
import PermitTable from "@/components/permit/PermitTable"
import { AlertCircle, Plus } from "lucide-react"

interface UserDashboardPageProps {
  searchParams?: Promise<{
    tab?: string
    q?: string
    page?: string
    pageSize?: string
    sortBy?: string
    sortOrder?: string
  }>
}

export default async function UserDashboardPage({
  searchParams,
}: UserDashboardPageProps) {
  const session = await auth()
  const resolvedParams = (await searchParams) ?? {}

  const data = await getPaginatedPermits({
    tab: resolvedParams.tab,
    q: resolvedParams.q,
    page: resolvedParams.page,
    pageSize: resolvedParams.pageSize,
    sortBy: resolvedParams.sortBy,
    sortOrder: resolvedParams.sortOrder,
    userId: session?.user?.id,
    role: session?.user?.role,
  })

  const serializedItems = serializePermitRows(data.items)

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Dashboard Permohonan Izin Kerja
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pantau status izin kerja berdasarkan tab Open, Pending, Rejected, dan Archived.
          </p>
        </div>
        <Link
          href="/user/create"
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition w-fit"
        >
          <Plus className="w-4 h-4" /> Buat Permit Baru
        </Link>
      </div>

      {data.counts.rejected > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              Terdapat <strong>{data.counts.rejected}</strong> permohonan permit ditolak. Anda dapat meninjau catatan penolakan dan mengajukan ulang (Re-Approve) pada tab <strong>Rejected</strong>.
            </span>
          </div>
          <Link
            href="/user?tab=rejected"
            className="font-medium underline hover:text-red-950 shrink-0 ml-3"
          >
            Lihat Tab Rejected &rarr;
          </Link>
        </div>
      )}

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
        viewerRole="USER"
      />
    </div>
  )
}
