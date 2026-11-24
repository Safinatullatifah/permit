"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, RotateCcw, X } from "lucide-react"
import type { PermitRow } from "./PermitTable"

interface ReapproveModalProps {
  permit: PermitRow
  onClose: () => void
}

function toInputDate(iso: string): string {
  try {
    return new Date(iso).toISOString().split("T")[0]
  } catch {
    return ""
  }
}

export default function ReapproveModal({ permit, onClose }: ReapproveModalProps) {
  const router = useRouter()
  const [workName, setWorkName] = useState(permit.workName)
  const [location, setLocation] = useState(permit.location)
  const [startDate, setStartDate] = useState(toInputDate(permit.startDate))
  const [endDate, setEndDate] = useState(toInputDate(permit.endDate))
  const [poNumber, setPoNumber] = useState(permit.poNumber || "")
  const [spkNumber, setSpkNumber] = useState(permit.spkNumber || "")
  const [revisionNote, setRevisionNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Identifikasi siapa yang menolak dan catatan penolakannya
  const rejectionSource = permit.remarkShe
    ? "Otoritas Keselamatan (SHE)"
    : permit.remarkLp
    ? "Legal & Procurement (LP)"
    : permit.remarkUser
    ? "PIC Area (Verifikasi Teknis SPK)"
    : permit.remarkPic
    ? "PIC Area (Verifikasi Awal Lokasi)"
    : "Reviewer"

  const rejectionRemark =
    permit.remarkShe ||
    permit.remarkLp ||
    permit.remarkUser ||
    permit.remarkPic ||
    "Tidak ada catatan penolakan spesifik."

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!workName.trim() || !location.trim()) {
      setErrorMsg("Nama pekerjaan dan lokasi kerja wajib diisi.")
      return
    }

    if (!poNumber.trim() && !spkNumber.trim()) {
      setErrorMsg("Wajib mengisi minimal salah satu: Nomor PO atau Nomor SPK.")
      return
    }

    if (new Date(endDate) < new Date(startDate)) {
      setErrorMsg("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/permits/${permit.id}/reapprove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workName: workName.trim(),
          location: location.trim(),
          startDate,
          endDate,
          poNumber: poNumber.trim() || undefined,
          spkNumber: spkNumber.trim() || undefined,
          revisionNote: revisionNote.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal mengajukan ulang permit.")
        return
      }

      onClose()
      router.refresh()
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              Pengajuan Ulang Permit (Re-Approve)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{permit.nomor}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Kotak Catatan Penolakan Sebelumnya */}
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg space-y-1 text-xs text-red-900">
            <div className="flex items-center gap-1.5 font-semibold text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Alasan Penolakan oleh {rejectionSource}:
            </div>
            <p className="text-red-800 bg-white/70 p-2 rounded border border-red-100 italic">
              &ldquo;{rejectionRemark}&rdquo;
            </p>
            <p className="text-[11px] text-red-600 pt-0.5">
              * Silakan sesuaikan data permohonan di bawah ini berdasarkan alasan penolakan di atas sebelum mengajukan ulang.
            </p>
          </div>

          {/* Form Perbaikan Data */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Nama Pekerjaan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={workName}
                onChange={(e) => setWorkName(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Lokasi Pekerjaan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Tanggal Mulai <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 text-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Tanggal Selesai <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 text-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Nomor PO (Opsional)</label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="PO-XXXXX"
                  className="w-full rounded-md border border-gray-300 p-2 text-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Nomor SPK (Opsional)</label>
                <input
                  type="text"
                  value={spkNumber}
                  onChange={(e) => setSpkNumber(e.target.value)}
                  placeholder="SPK-XXXXX"
                  className="w-full rounded-md border border-gray-300 p-2 text-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Catatan Revisi / Penjelasan Perbaikan
              </label>
              <textarea
                rows={2}
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="Jelaskan perbaikan yang telah dilakukan (misal: Tanggal pelaksanaan dan nomor PO sudah dikoreksi)..."
                className="w-full rounded-md border border-gray-300 p-2 text-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded bg-red-50 border border-red-200 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 rounded-md border border-gray-300 hover:bg-gray-50 transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md transition disabled:opacity-50 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isSubmitting ? "Mengajukan Ulang..." : "Ajukan Ulang (Re-Approve)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
