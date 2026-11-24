"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, X, XCircle } from "lucide-react"
import type { PermitRow } from "./PermitTable"

interface SheVerifyModalProps {
  permit: PermitRow
  onClose: () => void
}

export default function SheVerifyModal({ permit, onClose }: SheVerifyModalProps) {
  const router = useRouter()
  const [decision, setDecision] = useState<"approve" | "reject">("approve")
  const [isHighRisk, setIsHighRisk] = useState<boolean>(permit.isHighRisk ?? false)
  const [remark, setRemark] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (decision === "reject" && !remark.trim()) {
      setErrorMsg("Catatan alasan penolakan permit oleh SHE wajib diisi.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/permits/${permit.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-she",
          decision,
          isHighRisk: decision === "approve" ? isHighRisk : false,
          remark: remark.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal memproses persetujuan SHE.")
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
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Persetujuan Akhir SHE (Safety)
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Summary Box */}
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
              <span className="font-semibold text-gray-900">Pemohon (User):</span>{" "}
              {permit.user.full_name}
            </div>
            <div>
              <span className="font-semibold text-gray-900">PIC Area:</span>{" "}
              {permit.pic.full_name}
            </div>
            <div>
              <span className="font-semibold text-gray-900">Dokumen:</span>{" "}
              {permit.poNumber ? (
                <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  PO: {permit.poNumber}
                </span>
              ) : (
                <span className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                  SPK: {permit.spkNumber}
                </span>
              )}
            </div>

            {/* Checklist Verifikasi Sebelumnya */}
            <div className="pt-2 border-t border-slate-200 mt-2 flex flex-wrap gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                <CheckCircle2 className="w-3 h-3" /> PIC Awal OK
              </span>
              {permit.poNumber ? (
                <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                  <CheckCircle2 className="w-3 h-3" /> PO LP OK
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                  <CheckCircle2 className="w-3 h-3" /> SPK PIC OK
                </span>
              )}
            </div>
          </div>

          {/* Pilihan Keputusan */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Keputusan Approval SHE
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision("approve")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition ${
                  decision === "approve"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Setujui (Status OPEN)
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
                Tolak Permit
              </button>
            </div>
          </div>

          {/* Penentuan High Risk (hanya jika decision === approve) */}
          {decision === "approve" && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isHighRisk}
                  onChange={(e) => setIsHighRisk(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                    Tetapkan Sebagai Pekerjaan Risiko Tinggi (High Risk)
                  </span>
                  <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                    Centang opsi ini jika pekerjaan melibatkan bahaya khusus: bekerja di ketinggian (&gt;1.8m), ruang terbatas (confined space), pekerjaan panas/api (hot work), tegangan tinggi, atau galian dalam.
                  </p>
                </div>
              </label>

              {isHighRisk && (
                <div className="flex items-center gap-1.5 text-[11px] text-red-700 font-medium bg-red-50 px-2.5 py-1.5 rounded border border-red-200">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Permit ini akan diberi label HIGH RISK dan mewajibkan izin kerja khusus &amp; checklist APD ketat.
                </div>
              )}
            </div>
          )}

          {/* Catatan / Remark */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Catatan / Catatan Keselamatan {decision === "reject" && <span className="text-red-500">*</span>}
            </label>
            <textarea
              rows={3}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder={
                decision === "approve"
                  ? "Instruksi keselamatan tambahan dari SHE (opsional, misal: wajib pasang safety line & sediakan APAR)..."
                  : "Wajib diisi: alasan penolakan permit kerja..."
              }
              className="w-full text-xs rounded-md border border-gray-300 p-2.5 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded bg-red-50 border border-red-200 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          {/* Tombol Aksi */}
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
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {isSubmitting
                ? "Memproses..."
                : decision === "approve"
                ? "Konfirmasi Setujui (OPEN)"
                : "Konfirmasi Tolak Permit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
