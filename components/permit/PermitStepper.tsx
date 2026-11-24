"use client"

import {
  CheckCircle2,
  Clock,
  FileCheck2,
  FilePlus2,
  HardHat,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import type { PermitRow } from "./PermitTable"

interface PermitStepperProps {
  permit: PermitRow
  compact?: boolean
}

type StepStatus = "completed" | "current" | "upcoming" | "rejected"

interface StepItem {
  number: number
  title: string
  subtitle: string
  status: StepStatus
  date?: string | null
  details?: string
  icon: typeof FilePlus2
}

export default function PermitStepper({ permit, compact = false }: PermitStepperProps) {
  // Hitung status setiap step berdasarkan data permit
  const isRejected = permit.status === "REJECTED"
  const isSheApproved = permit.status === "OPEN" || permit.status === "CLOSED"

  // Step 1: Permit Created
  const step1Status: StepStatus = "completed"

  // Step 2: In Verification (PIC Awal -> LP / PIC SPK)
  let step2Status: StepStatus = "upcoming"
  if (permit.picVerified === false || permit.lpVerified === false || permit.userVerified === false) {
    step2Status = "rejected"
  } else if (
    (permit.poNumber && permit.picVerified === true && permit.lpVerified === true) ||
    (!permit.poNumber && permit.picVerified === true && permit.userVerified === true) ||
    isSheApproved
  ) {
    step2Status = "completed"
  } else if (permit.status === "PENDING") {
    step2Status = "current"
  }

  // Step 3: Approval Decision (SHE)
  let step3Status: StepStatus = "upcoming"
  if (isSheApproved) {
    step3Status = "completed"
  } else if (isRejected && (permit.remarkShe || (!permit.remarkPic && !permit.remarkLp && !permit.remarkUser))) {
    step3Status = "rejected"
  } else if (step2Status === "completed" && permit.status === "PENDING") {
    step3Status = "current"
  }

  // Step 4: Induction & Execution
  let step4Status: StepStatus = "upcoming"
  if (permit.status === "CLOSED") {
    step4Status = "completed"
  } else if (permit.status === "OPEN") {
    step4Status = "current"
  }

  const steps: StepItem[] = [
    {
      number: 1,
      title: "Permit Created",
      subtitle: `Dibuat oleh ${permit.user.full_name}`,
      status: step1Status,
      date: permit.startDate,
      details: permit.poNumber ? `PO: ${permit.poNumber}` : `SPK: ${permit.spkNumber}`,
      icon: FilePlus2,
    },
    {
      number: 2,
      title: "In Verification",
      subtitle: permit.poNumber ? "Verifikasi PIC & Legal/PO LP" : "Verifikasi Awal & Teknis PIC",
      status: step2Status,
      details:
        step2Status === "rejected"
          ? "Penolakan pada berkas verifikasi"
          : step2Status === "completed"
          ? "Lolos seluruh verifikasi dokumen"
          : permit.picVerified === null
          ? "Menunggu verifikasi awal lokasi oleh PIC"
          : permit.poNumber
          ? "Menunggu verifikasi aspek PO oleh LP"
          : "Menunggu verifikasi teknis SPK oleh PIC",
      icon: FileCheck2,
    },
    {
      number: 3,
      title: "Approval Decision",
      subtitle: "Persetujuan Akhir Otoritas SHE",
      status: step3Status,
      date: permit.sheVerifiedAt,
      details:
        step3Status === "completed"
          ? `Disetujui (Status OPEN) — ${permit.isHighRisk ? "Risiko Tinggi (High Risk)" : "Risiko Standar"}`
          : step3Status === "rejected"
          ? "Permit ditolak"
          : step3Status === "current"
          ? "Siap diputuskan oleh Tim Safety SHE"
          : "Menunggu tahap verifikasi selesai",
      icon: permit.isHighRisk ? ShieldAlert : ShieldCheck,
    },
    {
      number: 4,
      title: "Induction & Execution",
      subtitle: "Ujian K3 & Eksekusi Lapangan",
      status: step4Status,
      details:
        permit.status === "CLOSED"
          ? "Izin kerja telah selesai & ditutup"
          : permit.status === "OPEN"
          ? "Pekerja vendor induksi & pekerjaan berjalan"
          : "Akses gerbang dibuka setelah status OPEN",
      icon: HardHat,
    },
  ]

  const getStatusStyles = (status: StepStatus) => {
    switch (status) {
      case "completed":
        return {
          circle: "bg-emerald-600 text-white ring-4 ring-emerald-100",
          bar: "bg-emerald-500",
          textTitle: "text-emerald-950 font-semibold",
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
          label: "Selesai",
        }
      case "current":
        return {
          circle: "bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse",
          bar: "bg-gray-200",
          textTitle: "text-blue-950 font-semibold",
          badge: "bg-blue-50 text-blue-700 border-blue-200",
          label: "Sedang Berjalan",
        }
      case "rejected":
        return {
          circle: "bg-red-600 text-white ring-4 ring-red-100",
          bar: "bg-red-300",
          textTitle: "text-red-950 font-semibold",
          badge: "bg-red-50 text-red-700 border-red-200",
          label: "Ditolak",
        }
      case "upcoming":
      default:
        return {
          circle: "bg-gray-200 text-gray-500 ring-4 ring-gray-50",
          bar: "bg-gray-200",
          textTitle: "text-gray-500 font-medium",
          badge: "bg-gray-50 text-gray-500 border-gray-200",
          label: "Menunggu",
        }
    }
  }

  if (compact) {
    return (
      <div className="flex items-center justify-between w-full gap-2">
        {steps.map((step, idx) => {
          const style = getStatusStyles(step.status)
          const isLast = idx === steps.length - 1

          return (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${style.circle}`}
                  title={`${step.title} (${style.label})`}
                >
                  {step.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : step.status === "rejected" ? (
                    <XCircle className="w-4 h-4" />
                  ) : step.status === "current" ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    step.number
                  )}
                </div>
                <div className="hidden lg:block text-left">
                  <div className={`text-xs ${style.textTitle}`}>{step.title}</div>
                  <div className="text-[10px] text-gray-400 truncate max-w-[110px]">
                    {style.label}
                  </div>
                </div>
              </div>
              {!isLast && (
                <div className={`flex-1 h-0.5 mx-2 rounded ${style.bar}`} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <h4 className="text-sm font-bold text-gray-900 tracking-tight">
            Tracking Progres Izin Kerja (4-Step Lifecycle)
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Siklus hidup dokumen permit kerja dari pembuatan hingga eksekusi lapangan.
          </p>
        </div>
        <div className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-200">
          {permit.nomor}
        </div>
      </div>

      {/* Stepper Graphic */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {steps.map((step, idx) => {
          const style = getStatusStyles(step.status)
          const Icon = step.icon

          return (
            <div
              key={step.number}
              className={`p-4 rounded-xl border transition-all ${
                step.status === "current"
                  ? "bg-blue-50/40 border-blue-200 shadow-sm"
                  : step.status === "completed"
                  ? "bg-emerald-50/20 border-emerald-200/70"
                  : step.status === "rejected"
                  ? "bg-red-50/30 border-red-200"
                  : "bg-gray-50/50 border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${style.circle}`}
                >
                  {step.status === "completed" ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : step.status === "rejected" ? (
                    <XCircle className="w-5 h-5" />
                  ) : step.status === "current" ? (
                    <Icon className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>

                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${style.badge}`}
                >
                  {style.label}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-gray-400 font-medium">Langkah {step.number}</div>
                <h5 className={`text-sm ${style.textTitle}`}>{step.title}</h5>
                <p className="text-xs text-gray-600 leading-snug">{step.subtitle}</p>
                {step.details && (
                  <p className="text-[11px] text-gray-500 pt-1 leading-snug border-t border-gray-100 mt-2">
                    {step.details}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
