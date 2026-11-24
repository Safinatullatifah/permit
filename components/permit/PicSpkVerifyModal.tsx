"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, FileSpreadsheet, X, XCircle } from "lucide-react"
import type { PermitRow } from "./PermitTable"

interface PicSpkVerifyModalProps {
  permit: PermitRow
  onClose: () => void
}

export default function PicSpkVerifyModal({
  permit,
  onClose,
}: PicSpkVerifyModalProps) {
  const router = useRouter()
  const [decision, setDecision] = useState<"approve" | "reject">("approve")
  const [remark, setRemark] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (decision === "reject" && !remark.trim()) {
      setErrorMsg("Catatan alasan penolakan teknis SPK wajib diisi.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/permits/${permit.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-user",
          decision,
          remark: remark.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal memproses verifikasi teknis SPK.")
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
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Verifikasi Teknis SPK (PIC Area)
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs space-y-1.5 text-gray-700">
            <div>
              <span className="font-semibold text-gray-900">Pekerjaan:</span>{" "}
              {permit.workName}
            </div>
            <div>
              <span className="font-semibold text-gray-900">Lokasi:</span>{" "}
              {permit.location}
            </div>
            <div>
              <span className="font-semibold text-gray-900">Vendor:</span>{" "}
              {permit.vendor.name}
            </div>
            <div>
              <span className="font-semibold text-gray-900">Nomor SPK:</span>{" "}
              <span className="font-mono font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                {permit.spkNumber || "-"}
              </span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">Tahap Alur:</span>{" "}
              Non-PO (SPK) — Verifikasi Teknis Lapangan oleh PIC sebelum persetujuan akhir SHE
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Keputusan Verifikasi Teknis SPK
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision("approve")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition ${
                  decision === "approve"
                    ? "border-green-600 bg-green-50 text-green-700 shadow-sm"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Setujui SPK
              </button>

              <button
                type="button"
                onClick={() => setDecision("reject")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition ${
                  decision === "reject"
                    ? "border-red-600 bg-red-50 text-red-700 shadow-sm"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <XCircle className="w-4 h-4 text-red-600" />
                Tolak SPK
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Catatan / Alasan {decision === "reject" && <span className="text-red-500">*</span>}
            </label>
            <textarea
              rows={3}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder={
                decision === "approve"
                  ? "Catatan teknis SPK (opsional, misal: kesesuaian ruang lingkup kerja telah dikonfirmasi)..."
                  : "Wajib diisi: alasan penolakan teknis SPK..."
              }
              className="w-full text-xs rounded-md border border-gray-300 p-2.5 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
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
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white rounded-md transition disabled:opacity-50 ${
                decision === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              {isSubmitting
                ? "Memproses..."
                : decision === "approve"
                ? "Konfirmasi Setujui SPK"
                : "Konfirmasi Tolak SPK"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
