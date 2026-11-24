import Link from "next/link"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  FileSpreadsheet,
  HardHat,
  MapPin,
  MessageSquare,
  Package,
  Plus,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
  Zap,
} from "lucide-react"
import PermitStatusBadge from "@/components/permit/PermitStatusBadge"

function formatDate(iso: Date): string {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return ""
  }
}

export default async function VendorPortalPage() {
  const session = await auth()

  if (!session?.user?.id) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        Silakan login terlebih dahulu untuk mengakses Portal Vendor.
      </div>
    )
  }

  // Filter permit: jika akun VENDOR dengan vendorId terdaftar, ambil permit milik vendor tersebut
  const vendorFilter =
    session.user.role === "VENDOR" && session.user.vendorId
      ? { vendorId: session.user.vendorId }
      : {}

  const permits = await prisma.permit.findMany({
    where: vendorFilter,
    orderBy: { createdAt: "desc" },
    include: {
      vendor: { select: { id: true, name: true } },
      pic: { select: { id: true, full_name: true } },
      user: { select: { id: true, full_name: true } },
      jsa: {
        select: {
          id: true,
          isElectrical: true,
          updatedAt: true,
          _count: {
            select: {
              tahapan: true,
              peralatan: true,
              sambungan: true,
            },
          },
        },
      },
      permitKhusus: {
        select: {
          id: true,
          specialPermit: { select: { name: true } },
          _count: { select: { checks: true } },
        },
      },
      daftarApd: {
        select: {
          id: true,
          masterApd: { select: { name: true } },
          customName: true,
        },
      },
      pinjamEquipment: {
        select: {
          id: true,
          status: true,
          barang: { select: { name: true } },
        },
      },
      barangBawaan: {
        select: {
          id: true,
          nama: true,
        },
      },
      members: {
        select: {
          id: true,
          name: true,
          isHealthy: true,
          quizResult: {
            select: {
              isPassed: true,
              score: true,
            },
          },
        },
      },
    },
  })

  const totalPermits = permits.length
  const jsaCompletedCount = permits.filter((p) => p.jsa !== null).length
  const awaitingJsaCount = permits.filter(
    (p) => p.picVerified === true && p.jsa === null
  ).length

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HardHat className="w-7 h-7 text-amber-600" />
            Portal Rekanan Vendor
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola pengisian Job Safety Analysis (JSA), daftar peralatan kerja, izin khusus, dan anggota teknisi untuk pekerjaan yang ditugaskan.
          </p>
        </div>

        {/* Counter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium">
            <Clock className="w-4 h-4 text-amber-600" />
            Perlu Isi JSA: <strong>{awaitingJsaCount}</strong>
          </div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            JSA Terisi: <strong>{jsaCompletedCount}</strong> / {totalPermits}
          </div>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {permits.map((permit) => {
          const hasJsa = permit.jsa !== null
          const isInitialVerified = permit.picVerified === true

          return (
            <div
              key={permit.id}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs hover:border-gray-300 transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      {permit.nomor}
                    </span>
                    <PermitStatusBadge
                      status={permit.status}
                      isHighRisk={permit.isHighRisk}
                    />
                    {permit.poNumber && (
                      <span className="font-mono text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                        PO: {permit.poNumber}
                      </span>
                    )}
                    {permit.spkNumber && (
                      <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
                        SPK: {permit.spkNumber}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {permit.workName}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/vendor/permits/${permit.id}/jsa`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs ${
                      hasJsa
                        ? "bg-slate-900 hover:bg-slate-800 text-white"
                        : "bg-amber-600 hover:bg-amber-700 text-white"
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    {hasJsa ? "JSA & Peralatan" : "Isi JSA"}
                  </Link>

                  <Link
                    href={`/vendor/permits/${permit.id}/special-permits`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs ${
                      permit.permitKhusus.length > 0 || permit.daftarApd.length > 0
                        ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Permit Khusus &amp; APD
                  </Link>

                  <Link
                    href={`/vendor/permits/${permit.id}/borrowed-equipment`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs ${
                      permit.pinjamEquipment.length > 0
                        ? "bg-amber-700 hover:bg-amber-800 text-white"
                        : "bg-gray-700 hover:bg-gray-800 text-white"
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    Pinjam Alat K3
                  </Link>

                  <Link
                    href={`/vendor/permits/${permit.id}/members`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs ${
                      permit.members.length > 0
                        ? "bg-indigo-700 hover:bg-indigo-800 text-white"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Pekerja ({permit.members.length})
                  </Link>

                  <Link
                    href={`/permits/${permit.id}/chat`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white transition shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Diskusi
                  </Link>
                </div>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>
                    Lokasi: <strong className="text-gray-900">{permit.location}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>
                    Jadwal: {formatDate(permit.startDate)} s/d {formatDate(permit.endDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>
                    PIC Area: <strong className="text-gray-900">{permit.pic.full_name}</strong>
                  </span>
                </div>
              </div>

              {/* Status Bar JSA & Permit Khusus */}
              <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Verifikasi Awal PIC */}
                  {permit.picVerified === true ? (
                    <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Lokasi OK (PIC)
                    </span>
                  ) : permit.picVerified === false ? (
                    <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200 font-medium">
                      Lokasi Ditolak
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 font-medium">
                      <Clock className="w-3.5 h-3.5" /> Menunggu Cek PIC
                    </span>
                  )}

                  {/* Status JSA */}
                  {hasJsa ? (
                    <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      JSA OK ({permit.jsa!._count.tahapan} Tahapan)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      JSA Belum
                    </span>
                  )}

                  {/* Status Permit Khusus & APD */}
                  {permit.permitKhusus.length > 0 ? (
                    <span className="inline-flex items-center gap-1 text-red-800 bg-red-50 px-2.5 py-1 rounded-md border border-red-200 font-medium">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                      {permit.permitKhusus.length} Izin Khusus
                    </span>
                  ) : (
                    <span className="text-gray-400 bg-gray-100 px-2.5 py-1 rounded-md">
                      Izin Standar (Non-Khusus)
                    </span>
                  )}

                  {permit.daftarApd.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 font-medium">
                      {permit.daftarApd.length} APD Dipilih
                    </span>
                  )}

                  {permit.pinjamEquipment.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 font-medium">
                      <Package className="w-3.5 h-3.5 text-amber-600" />
                      {permit.pinjamEquipment.length} Alat K3 Dipinjam
                    </span>
                  )}

                  {permit.members.length > 0 ? (
                    <span className="inline-flex items-center gap-1 text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 font-medium">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      {permit.members.length} Pekerja ({permit.members.filter((m) => m.quizResult?.isPassed).length} Lulus Induction)
                    </span>
                  ) : (
                    <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 font-medium">
                      Pekerja Belum Didaftarkan
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-gray-400">
                  Pemohon: {permit.user.full_name}
                </div>
              </div>
            </div>
          )
        })}

        {permits.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500 text-sm">
            Belum ada permohonan permit yang ditugaskan ke vendor Anda.
          </div>
        )}
      </div>
    </div>
  )
}
