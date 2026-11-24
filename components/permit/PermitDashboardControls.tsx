"use client"

import { useEffect, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Download, FileSpreadsheet, Search, X } from "lucide-react"
import type { PermitTabKey } from "@/lib/queries/permits"

interface PermitDashboardControlsProps {
  activeTab: PermitTabKey
  query: string
  pageSize: number
  counts: Record<PermitTabKey, number>
}

const TABS: { key: PermitTabKey; label: string; activeClass: string; badgeClass: string }[] = [
  {
    key: "open",
    label: "Open",
    activeClass: "border-green-600 text-green-700 bg-green-50/70",
    badgeClass: "bg-green-100 text-green-800",
  },
  {
    key: "pending",
    label: "Pending",
    activeClass: "border-amber-600 text-amber-700 bg-amber-50/70",
    badgeClass: "bg-amber-100 text-amber-800",
  },
  {
    key: "rejected",
    label: "Rejected",
    activeClass: "border-red-600 text-red-700 bg-red-50/70",
    badgeClass: "bg-red-100 text-red-800",
  },
  {
    key: "archived",
    label: "Archived",
    activeClass: "border-slate-700 text-slate-800 bg-slate-100",
    badgeClass: "bg-slate-200 text-slate-700",
  },
]

export default function PermitDashboardControls({
  activeTab,
  query,
  pageSize,
  counts,
}: PermitDashboardControlsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(query)

  useEffect(() => {
    setSearchValue(query)
  }, [query])

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    const qs = params.toString()
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    })
  }

  // Pencarian server-side dengan debounce 350ms
  useEffect(() => {
    const trimmed = searchValue.trim()
    if (trimmed === query) return

    const timer = setTimeout(() => {
      updateParams({ q: trimmed || null, page: "1" })
    }, 350)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, query])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
      {/* Tab Status Permit */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => updateParams({ tab: tab.key, page: "1" })}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium border transition ${
                isActive
                  ? tab.activeClass
                  : "border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isActive ? tab.badgeClass : "bg-gray-100 text-gray-600"
                }`}
              >
                {counts[tab.key]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Pencarian & Ukuran Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Cari no. permit, nama pekerjaan, vendor, atau lokasi..."
            className="pl-9 pr-9"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => {
                setSearchValue("")
                updateParams({ q: null, page: "1" })
              }}
              aria-label="Hapus pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-600">
          {isPending && (
            <span className="text-xs text-slate-500 animate-pulse">Memuat data...</span>
          )}
          <label htmlFor="pageSize" className="text-xs font-medium text-gray-500">
            Tampilkan:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => updateParams({ pageSize: e.target.value, page: "1" })}
            className="h-9 rounded-md border border-gray-300 bg-white px-2.5 text-sm outline-none focus:border-slate-900"
          >
            <option value="5">5 / halaman</option>
            <option value="10">10 / halaman</option>
            <option value="20">20 / halaman</option>
            <option value="50">50 / halaman</option>
          </select>

          <a
            href={`/api/export/permits?status=${activeTab.toUpperCase()}`}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold shadow-2xs transition"
            title="Download laporan permit ke file Excel .xlsx"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </a>
        </div>
      </div>
    </div>
  )
}
