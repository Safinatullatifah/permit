"use client"

import { useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { PermitStatus } from "@prisma/client"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileCheck,
  FileSpreadsheet,
  RotateCcw,
  ShieldCheck,
} from "lucide-react"
import PermitStatusBadge from "./PermitStatusBadge"
import PicInitialVerifyModal from "./PicInitialVerifyModal"
import PicSpkVerifyModal from "./PicSpkVerifyModal"
import LpVerifyModal from "./LpVerifyModal"
import SheVerifyModal from "./SheVerifyModal"
import ReapproveModal from "./ReapproveModal"
import PermitDetailModal from "./PermitDetailModal"
import type { PermitSortField, PermitTabKey, SortOrder } from "@/lib/queries/permits"

export interface PermitRow {
  id: string
  nomor: string
  workName: string
  location: string
  startDate: string
  endDate: string
  poNumber: string | null
  spkNumber: string | null
  isHighRisk: boolean
  picVerified: boolean | null
  picVerifiedAt: string | null
  lpVerified: boolean | null
  userVerified: boolean | null
  sheVerifiedAt: string | null
  status: PermitStatus
  remarkPic: string | null
  remarkLp: string | null
  remarkUser: string | null
  remarkShe: string | null
  vendor: { id: string; name: string }
  pic: { id: string; full_name: string }
  user: { id: string; full_name: string }
}

interface PermitTableProps {
  items: PermitRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  sortBy: PermitSortField
  sortOrder: SortOrder
  activeTab: PermitTabKey
  viewerRole?: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function getRejectionRemark(item: PermitRow): string | null {
  return item.remarkShe || item.remarkLp || item.remarkUser || item.remarkPic || null
}

function getStageLabel(item: PermitRow): string {
  if (item.status === "OPEN") return "Disetujui penuh oleh SHE"
  if (item.status === "CLOSED") return "Izin kerja ditutup / selesai"
  if (item.status === "REJECTED") return "Ditolak — perlu revisi"
  if (item.picVerified === null) return "Menunggu Verifikasi Awal PIC"
  if (item.poNumber && item.lpVerified === null) return "Menunggu Verifikasi Legal/PO (LP)"
  if (!item.poNumber && item.userVerified === null) return "Menunggu Verifikasi Teknis PIC (SPK)"
  return "Menunggu Approval Akhir SHE"
}

export default function PermitTable({
  items,
  total,
  page,
  pageSize,
  totalPages,
  sortBy,
  sortOrder,
  activeTab,
  viewerRole,
}: PermitTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [selectedForPicVerify, setSelectedForPicVerify] = useState<PermitRow | null>(null)
  const [selectedForPicSpkVerify, setSelectedForPicSpkVerify] = useState<PermitRow | null>(null)
  const [selectedForLpVerify, setSelectedForLpVerify] = useState<PermitRow | null>(null)
  const [selectedForSheVerify, setSelectedForSheVerify] = useState<PermitRow | null>(null)
  const [selectedForReapprove, setSelectedForReapprove] = useState<PermitRow | null>(null)
  const [selectedForDetail, setSelectedForDetail] = useState<PermitRow | null>(null)

  const showActionColumn =
    viewerRole === "PIC" || viewerRole === "LP" || viewerRole === "SHE" || viewerRole === "USER"

  const navigateWithParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      params.set(key, value)
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const handleSort = (field: PermitSortField) => {
    const nextOrder: SortOrder =
      sortBy === field && sortOrder === "asc" ? "desc" : "asc"
    navigateWithParams({ sortBy: field, sortOrder: nextOrder, page: "1" })
  }

  const renderSortIcon = (field: PermitSortField) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-slate-900" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-slate-900" />
    )
  }

  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, total)

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <button
                    type="button"
                    onClick={() => handleSort("nomor")}
                    className="inline-flex items-center gap-1 hover:text-gray-900"
                  >
                    No. Permit {renderSortIcon("nomor")}
                  </button>
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <button
                    type="button"
                    onClick={() => handleSort("workName")}
                    className="inline-flex items-center gap-1 hover:text-gray-900"
                  >
                    Nama Pekerjaan {renderSortIcon("workName")}
                  </button>
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <button
                    type="button"
                    onClick={() => handleSort("location")}
                    className="inline-flex items-center gap-1 hover:text-gray-900"
                  >
                    Lokasi {renderSortIcon("location")}
                  </button>
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <button
                    type="button"
                    onClick={() => handleSort("vendor")}
                    className="inline-flex items-center gap-1 hover:text-gray-900"
                  >
                    Vendor {renderSortIcon("vendor")}
                  </button>
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <button
                    type="button"
                    onClick={() => handleSort("startDate")}
                    className="inline-flex items-center gap-1 hover:text-gray-900"
                  >
                    Jadwal Kerja {renderSortIcon("startDate")}
                  </button>
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  PIC Area
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status & Tahapan
                </th>
                {showActionColumn && (
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody
              className={`bg-white divide-y divide-gray-200 transition-opacity ${
                isPending ? "opacity-60" : "opacity-100"
              }`}
            >
              {items.map((permit) => {
                const rejectionRemark =
                  activeTab === "rejected" ? getRejectionRemark(permit) : null

                return (
                  <tr key={permit.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedForDetail(permit)}
                        className="text-sm font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1.5 group text-left cursor-pointer hover:underline"
                        title="Klik untuk membuka detail izin kerja & ruang diskusi"
                      >
                        <span>{permit.nomor}</span>
                        <Eye className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
                      </button>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {permit.poNumber
                          ? `PO: ${permit.poNumber}`
                          : `SPK: ${permit.spkNumber || "-"}`}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedForDetail(permit)}
                        className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-blue-600" />
                        <span>Lihat Detail</span>
                      </button>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-900">
                      <div className="font-medium">{permit.workName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Pemohon: {permit.user.full_name}
                      </div>
                      {rejectionRemark && (
                        <p className="text-xs text-red-600 mt-1">
                          Alasan ditolak: {rejectionRemark}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{permit.location}</td>
                    <td className="px-5 py-4 text-sm text-gray-700 font-medium">
                      {permit.vendor.name}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-600">
                      <div>{formatDate(permit.startDate)}</div>
                      <div className="text-gray-400">s/d {formatDate(permit.endDate)}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {permit.pic.full_name}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <PermitStatusBadge
                        status={permit.status}
                        isHighRisk={permit.isHighRisk}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {getStageLabel(permit)}
                      </div>
                    </td>
                    {viewerRole === "PIC" && (
                      <td className="px-5 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedForDetail(permit)}
                            className="inline-flex items-center gap-1 border border-gray-300 hover:bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer shadow-2xs"
                            title="Lihat detail izin kerja & ruang diskusi"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>Detail</span>
                          </button>

                          {permit.status === "PENDING" && permit.picVerified === null ? (
                            <button
                              type="button"
                              onClick={() => setSelectedForPicVerify(permit)}
                              className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-slate-800 transition"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Verifikasi Awal
                            </button>
                          ) : !permit.poNumber &&
                            permit.picVerified === true &&
                            permit.status === "PENDING" &&
                            permit.userVerified === null ? (
                            <button
                              type="button"
                              onClick={() => setSelectedForPicSpkVerify(permit)}
                              className="inline-flex items-center gap-1.5 bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-800 transition shadow-sm"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              Verifikasi SPK
                            </button>
                          ) : !permit.poNumber && permit.userVerified === true ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> SPK OK
                            </span>
                          ) : !permit.poNumber && permit.userVerified === false ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                              SPK Ditolak
                            </span>
                          ) : permit.picVerified === true ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {permit.poNumber ? "Awal OK" : "Terverifikasi"}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                    )}
                    {viewerRole === "LP" && (
                      <td className="px-5 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedForDetail(permit)}
                            className="inline-flex items-center gap-1 border border-gray-300 hover:bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer shadow-2xs"
                            title="Lihat detail izin kerja & ruang diskusi"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>Detail</span>
                          </button>

                          {!permit.poNumber ? (
                            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-md">
                              Non-PO (SPK)
                            </span>
                          ) : permit.picVerified === null ? (
                            <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                              Tunggu PIC
                            </span>
                          ) : permit.status === "PENDING" && permit.lpVerified === null ? (
                            <button
                              type="button"
                              onClick={() => setSelectedForLpVerify(permit)}
                              className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-slate-800 transition"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              Verifikasi PO
                            </button>
                          ) : permit.lpVerified === true ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> PO OK
                            </span>
                          ) : permit.lpVerified === false ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                              PO Ditolak
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                    )}
                    {viewerRole === "SHE" && (
                      <td className="px-5 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedForDetail(permit)}
                            className="inline-flex items-center gap-1 border border-gray-300 hover:bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer shadow-2xs"
                            title="Buka detail izin kerja & ruang obrolan"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>Detail</span>
                          </button>

                          {(() => {
                            const isReadyForShe =
                              permit.status === "PENDING" &&
                              ((permit.poNumber && permit.picVerified === true && permit.lpVerified === true) ||
                                (!permit.poNumber && permit.picVerified === true && permit.userVerified === true))

                            if (isReadyForShe) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => setSelectedForSheVerify(permit)}
                                  className="inline-flex items-center gap-1.5 bg-emerald-700 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-emerald-800 transition shadow-sm"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Approval SHE
                                </button>
                              )
                            }

                            if (permit.status === "PENDING") {
                              return (
                                <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                                  {permit.poNumber ? "Menunggu LP / PIC" : "Menunggu PIC SPK"}
                                </span>
                              )
                            }

                            if (permit.status === "OPEN") {
                              return (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui SHE
                                </span>
                              )
                            }

                            if (permit.status === "REJECTED") {
                              return (
                                <button
                                  type="button"
                                  onClick={() => setSelectedForReapprove(permit)}
                                  className="inline-flex items-center gap-1.5 bg-amber-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-amber-700 transition shadow-sm"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  Re-Approve
                                </button>
                              )
                            }

                            return null
                          })()}
                        </div>
                      </td>
                    )}
                    {viewerRole === "USER" && (
                      <td className="px-5 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedForDetail(permit)}
                            className="inline-flex items-center gap-1 border border-gray-300 hover:bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer shadow-2xs"
                            title="Lihat detail izin kerja & ruang diskusi"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>Detail</span>
                          </button>

                          {permit.status === "REJECTED" ? (
                            <button
                              type="button"
                              onClick={() => setSelectedForReapprove(permit)}
                              className="inline-flex items-center gap-1.5 bg-amber-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-amber-700 transition shadow-sm"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Ajukan Ulang
                            </button>
                          ) : permit.status === "PENDING" ? (
                            <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                              Dalam Review
                            </span>
                          ) : permit.status === "OPEN" ? (
                            <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                              Aktif (OPEN)
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={showActionColumn ? 8 : 7}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    Tidak ada data permit pada tab <strong>{activeTab.toUpperCase()}</strong>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-t border-gray-200 bg-gray-50/70 text-sm">
          <p className="text-xs text-gray-600">
            Menampilkan <strong>{startIndex}</strong>–<strong>{endIndex}</strong> dari{" "}
            <strong>{total}</strong> permit
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1 || isPending}
              onClick={() => navigateWithParams({ page: String(page - 1) })}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
            </button>

            <span className="px-3 py-1 text-xs font-medium text-gray-700">
              Hal {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages || isPending}
              onClick={() => navigateWithParams({ page: String(page + 1) })}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none"
            >
              Berikutnya <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {selectedForPicVerify && (
        <PicInitialVerifyModal
          permit={selectedForPicVerify}
          onClose={() => setSelectedForPicVerify(null)}
        />
      )}

      {selectedForPicSpkVerify && (
        <PicSpkVerifyModal
          permit={selectedForPicSpkVerify}
          onClose={() => setSelectedForPicSpkVerify(null)}
        />
      )}

      {selectedForLpVerify && (
        <LpVerifyModal
          permit={selectedForLpVerify}
          onClose={() => setSelectedForLpVerify(null)}
        />
      )}

      {selectedForSheVerify && (
        <SheVerifyModal
          permit={selectedForSheVerify}
          onClose={() => setSelectedForSheVerify(null)}
        />
      )}

      {selectedForReapprove && (
        <ReapproveModal
          permit={selectedForReapprove}
          onClose={() => setSelectedForReapprove(null)}
        />
      )}

      {selectedForDetail && (
        <PermitDetailModal
          permit={selectedForDetail}
          onClose={() => setSelectedForDetail(null)}
        />
      )}
    </>
  )
}
