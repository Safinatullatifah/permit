import type { PermitStatus } from "@prisma/client"

const STATUS_STYLES: Record<PermitStatus, { label: string; className: string }> = {
  OPEN: {
    label: "OPEN",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  PENDING: {
    label: "PENDING",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  REJECTED: {
    label: "REJECTED",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  CLOSED: {
    label: "CLOSED",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
}

export default function PermitStatusBadge({
  status,
  isHighRisk = false,
}: {
  status: PermitStatus
  isHighRisk?: boolean
}) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.PENDING

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.className}`}
      >
        {style.label}
      </span>
      {isHighRisk && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700 border border-rose-200">
          High Risk
        </span>
      )}
    </div>
  )
}
