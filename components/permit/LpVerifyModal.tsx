"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, FileCheck, X, XCircle } from "lucide-react"
import type { PermitRow } from "./PermitTable"

interface LpVerifyModalProps {
  permit: PermitRow
  onClose: () => void
}

export default function LpVerifyModal({ permit, onClose }: LpVerifyModalProps) {
  const router = useRouter()
  const [decision, setDecision] = useState<"approve" | "reject">("approve")
  const [remark, setRemark] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (decision === "reject" && !remark.trim()) {
      setErrorMsg("Catatan alasan penolakan wajib diisi.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/permits/${permit.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-lp",
          decision,
          remark: remark.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal memproses verifikasi LP.")
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
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-slate-800" />
              Verifikasi Legalitas & PO (LP)
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
              <span className="font-semibold text-gray-900">Nomor PO:</span>{" "}
              <span className="font-bold text-slate-900">{permit.poNumber || "-"}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">Pekerjaan:</span>{" "}
              {permit.workName}
            </div>
            <div>
              <span className="font-semibold text-gray-900">Lokasi:</span>{" "}
              {permit.location}
            </div>
            <div>
              <span className="font-semibold text-gray-900">Vendor Pelaksana:</span>{" "}
              {permit.vendor.name}
            </div>
            <div>
              <span className="font-semibold text-gray-900">Pemohon Internal:</span>{" "}
              {permit.user.full_name}
            </div>
            <div>
              <span className="font-semibold text-gray-900">Status Verifikasi Awal PIC:</span>{" "}
              <span className="text-green-700 font-semibold">
                ✓ Disetujui ({permit.pic.full_name})
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Keputusan Verifikasi Aspek PO
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision("approve")}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition ${
                  decision === "approve"
                    ? "border-green-600 bg-green-50 text-green-800"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> Setujui PO
              </button>
              <button
                type="button"
                onClick={() => setDecision("reject")}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition ${
                  decision === "reject"
                    ? "border-red-600 bg-red-50 text-red-800"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <XCircle className="w-4 h-4" /> Tolak Permit
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="lp-remark" className="block text-sm font-medium text-gray-700">
              Catatan LP {decision === "reject" ? "(Wajib diisi)" : "(Opsional)"}
            </label>
            <textarea
              id="lp-remark"
              rows={3}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder={
                decision === "approve"
                  ? "Contoh: Nomor PO valid dan sesuai lingkup kerja rekanan vendor."
                  : "Jelaskan alasan ketidaksesuaian nomor PO atau aspek legalitas..."
              }
              required={decision === "reject"}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/20"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-md text-sm font-medium text-white transition disabled:opacity-50 ${
                decision === "approve"
                  ? "bg-green-700 hover:bg-green-800"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isSubmitting
                ? "Memproses..."
                : decision === "approve"
                ? "Konfirmasi Setujui"
                : "Konfirmasi Tolak"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
