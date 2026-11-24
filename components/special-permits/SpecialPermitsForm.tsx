"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  FileCheck2,
  FileText,
  HardHat,
  MapPin,
  Plus,
  Save,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react"

export interface MasterSpecialPermitItem {
  id: string
  name: string
}

export interface MasterSubWorkTypeItem {
  id: string
  name: string
}

export interface MasterWorkTypeItem {
  id: string
  name: string
  subWorkTypes: MasterSubWorkTypeItem[]
}

export interface MasterApdItem {
  id: string
  name: string
}

export interface MasterSafetyCheckItem {
  id: string
  name: string
}

interface SafetyCheckRowState {
  masterSafetyCheckId: string
  status: "YES" | "NO" | "NA"
  notes: string
  documentPath: string
}

interface SelectedSpecialPermitState {
  specialPermitId: string
  workTypeId: string
  subWorkTypeId: string
  informasiLain: string
  checks: SafetyCheckRowState[]
}

interface SpecialPermitsFormProps {
  permit: {
    id: string
    nomor: string
    workName: string
    location: string
    startDate: string
    endDate: string
    poNumber: string | null
    spkNumber: string | null
    isHighRisk: boolean
    vendor: { name: string }
    pic: { full_name: string }
    user: { full_name: string }
  }
  masterSpecialPermits: MasterSpecialPermitItem[]
  masterWorkTypes: MasterWorkTypeItem[]
  masterApd: MasterApdItem[]
  masterSafetyChecks: MasterSafetyCheckItem[]
  initialSpecialPermits?: {
    specialPermitId: string
    workTypeId: string | null
    subWorkTypeId: string | null
    informasiLain: string | null
    checks: {
      masterSafetyCheckId: string
      status: "YES" | "NO" | "NA"
      notes: string | null
      documentPath: string | null
    }[]
  }[]
  initialApdIds?: string[]
  initialCustomApds?: string[]
  returnUrl?: string
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

export default function SpecialPermitsForm({
  permit,
  masterSpecialPermits,
  masterWorkTypes,
  masterApd,
  masterSafetyChecks,
  initialSpecialPermits = [],
  initialApdIds = [],
  initialCustomApds = [],
  returnUrl = "/vendor",
}: SpecialPermitsFormProps) {
  const router = useRouter()

  // State Permit Khusus yang dipilih
  const [selectedSpecialPermits, setSelectedSpecialPermits] = useState<
    SelectedSpecialPermitState[]
  >(() => {
    if (initialSpecialPermits.length > 0) {
      return initialSpecialPermits.map((sp) => ({
        specialPermitId: sp.specialPermitId,
        workTypeId: sp.workTypeId || "",
        subWorkTypeId: sp.subWorkTypeId || "",
        informasiLain: sp.informasiLain || "",
        checks: masterSafetyChecks.map((msc) => {
          const existing = sp.checks.find((c) => c.masterSafetyCheckId === msc.id)
          return {
            masterSafetyCheckId: msc.id,
            status: existing?.status || "NA",
            notes: existing?.notes || "",
            documentPath: existing?.documentPath || "",
          }
        }),
      }))
    }
    return []
  })

  // State APD
  const [selectedApdIds, setSelectedApdIds] = useState<string[]>(initialApdIds)
  const [customApds, setCustomApds] = useState<string[]>(initialCustomApds)
  const [newCustomApd, setNewCustomApd] = useState("")

  // State Upload & UI
  const [uploadingFor, setUploadingFor] = useState<{
    specialPermitId: string
    checkId: string
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // --- Handlers Permit Khusus Checkbox ---
  const toggleSpecialPermit = (specialPermitId: string) => {
    const exists = selectedSpecialPermits.some(
      (s) => s.specialPermitId === specialPermitId
    )
    if (exists) {
      setSelectedSpecialPermits(
        selectedSpecialPermits.filter((s) => s.specialPermitId !== specialPermitId)
      )
    } else {
      setSelectedSpecialPermits([
        ...selectedSpecialPermits,
        {
          specialPermitId,
          workTypeId: "",
          subWorkTypeId: "",
          informasiLain: "",
          checks: masterSafetyChecks.map((msc) => ({
            masterSafetyCheckId: msc.id,
            status: "NA",
            notes: "",
            documentPath: "",
          })),
        },
      ])
    }
  }

  // --- Handlers Work Type / Sub Work Type ---
  const updateWorkType = (specialPermitId: string, workTypeId: string) => {
    setSelectedSpecialPermits((prev) =>
      prev.map((s) =>
        s.specialPermitId === specialPermitId
          ? { ...s, workTypeId, subWorkTypeId: "" }
          : s
      )
    )
  }

  const updateSubWorkType = (specialPermitId: string, subWorkTypeId: string) => {
    setSelectedSpecialPermits((prev) =>
      prev.map((s) =>
        s.specialPermitId === specialPermitId ? { ...s, subWorkTypeId } : s
      )
    )
  }

  const updateInformasiLain = (specialPermitId: string, informasiLain: string) => {
    setSelectedSpecialPermits((prev) =>
      prev.map((s) =>
        s.specialPermitId === specialPermitId ? { ...s, informasiLain } : s
      )
    )
  }

  // --- Handlers Safety Check Status & Notes ---
  const updateCheckStatus = (
    specialPermitId: string,
    checkId: string,
    status: "YES" | "NO" | "NA"
  ) => {
    setSelectedSpecialPermits((prev) =>
      prev.map((sp) => {
        if (sp.specialPermitId !== specialPermitId) return sp
        return {
          ...sp,
          checks: sp.checks.map((chk) =>
            chk.masterSafetyCheckId === checkId ? { ...chk, status } : chk
          ),
        }
      })
    )
  }

  const updateCheckNotes = (
    specialPermitId: string,
    checkId: string,
    notes: string
  ) => {
    setSelectedSpecialPermits((prev) =>
      prev.map((sp) => {
        if (sp.specialPermitId !== specialPermitId) return sp
        return {
          ...sp,
          checks: sp.checks.map((chk) =>
            chk.masterSafetyCheckId === checkId ? { ...chk, notes } : chk
          ),
        }
      })
    )
  }

  // --- Handler Upload Dokumen Bukti Cek Keselamatan ---
  const handleUploadFile = async (
    specialPermitId: string,
    checkId: string,
    file: File
  ) => {
    setUploadingFor({ specialPermitId, checkId })
    setErrorMsg(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload/safety-doc", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || "Gagal mengunggah dokumen bukti")
        return
      }

      setSelectedSpecialPermits((prev) =>
        prev.map((sp) => {
          if (sp.specialPermitId !== specialPermitId) return sp
          return {
            ...sp,
            checks: sp.checks.map((chk) =>
              chk.masterSafetyCheckId === checkId
                ? { ...chk, documentPath: data.fileUrl }
                : chk
            ),
          }
        })
      )
    } catch {
      setErrorMsg("Kesalahan jaringan saat mengunggah dokumen")
    } finally {
      setUploadingFor(null)
    }
  }

  // --- Handlers APD ---
  const toggleApd = (apdId: string) => {
    if (selectedApdIds.includes(apdId)) {
      setSelectedApdIds(selectedApdIds.filter((id) => id !== apdId))
    } else {
      setSelectedApdIds([...selectedApdIds, apdId])
    }
  }

  const addCustomApd = () => {
    const trimmed = newCustomApd.trim()
    if (!trimmed) return
    if (!customApds.includes(trimmed)) {
      setCustomApds([...customApds, trimmed])
    }
    setNewCustomApd("")
  }

  const removeCustomApd = (index: number) => {
    setCustomApds(customApds.filter((_, i) => i !== index))
  }

  // --- Submit Form ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (selectedApdIds.length === 0 && customApds.length === 0) {
      setErrorMsg("Pilih minimal 1 Alat Pelindung Diri (APD) keselamatan.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/permits/${permit.id}/special-permits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialPermits: selectedSpecialPermits,
          apdIds: selectedApdIds,
          customApds,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal menyimpan berkas permit khusus & APD.")
        return
      }

      setSuccessMsg("Checklist Permit Khusus, Cek Keselamatan, dan APD berhasil disimpan!")
      setTimeout(() => {
        router.push(returnUrl)
        router.refresh()
      }, 1200)
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-16">
      {/* Permit Summary Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs bg-slate-800 px-2.5 py-0.5 rounded text-amber-400 font-semibold">
                {permit.nomor}
              </span>
              {permit.poNumber && (
                <span className="text-xs bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 font-mono">
                  PO: {permit.poNumber}
                </span>
              )}
              {permit.spkNumber && (
                <span className="text-xs bg-blue-950 text-blue-400 px-2 py-0.5 rounded border border-blue-800 font-mono">
                  SPK: {permit.spkNumber}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white mt-1.5">{permit.workName}</h2>
          </div>
          <div className="text-xs text-slate-300">
            Periode: <strong>{formatDate(permit.startDate)}</strong> s/d{" "}
            <strong>{formatDate(permit.endDate)}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Vendor: <strong className="text-white">{permit.vendor.name}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Lokasi: <strong className="text-white">{permit.location}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              PIC Area: <strong className="text-white">{permit.pic.full_name}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Bagian 1: Checklist Permit Khusus */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            1. Izin Kerja Khusus / Berbahaya (Special Permit)
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Centang jenis pekerjaan berbahaya yang dilakukan. Setiap izin khusus memerlukan checklist kondisi keselamatan pra-kerja dan bukti pendukung inspeksi.
          </p>
        </div>

        {/* Master Special Permit Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {masterSpecialPermits.map((item) => {
            const isChecked = selectedSpecialPermits.some(
              (s) => s.specialPermitId === item.id
            )
            return (
              <label
                key={item.id}
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs cursor-pointer transition select-none ${
                  isChecked
                    ? "border-red-500 bg-red-50/70 font-semibold text-red-950 shadow-xs"
                    : "border-gray-200 bg-gray-50/50 hover:bg-gray-50 text-gray-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleSpecialPermit(item.id)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <div>
                  <span className="block text-xs font-bold">{item.name}</span>
                </div>
              </label>
            )
          })}
        </div>

        {/* Detail Panel untuk setiap Permit Khusus terpilih */}
        {selectedSpecialPermits.length > 0 && (
          <div className="space-y-6 pt-2">
            {selectedSpecialPermits.map((selectedSp, spIdx) => {
              const spMeta = masterSpecialPermits.find(
                (m) => m.id === selectedSp.specialPermitId
              )
              const selectedWorkType = masterWorkTypes.find(
                (wt) => wt.id === selectedSp.workTypeId
              )

              return (
                <div
                  key={selectedSp.specialPermitId}
                  className="border-2 border-red-200 bg-red-50/20 rounded-xl p-5 space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-red-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                        {spIdx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-red-950">
                        {spMeta?.name || "Izin Khusus"}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSpecialPermit(selectedSp.specialPermitId)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Hapus
                    </button>
                  </div>

                  {/* Klasifikasi Jenis Pekerjaan & Catatan Tambahan */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Jenis Pekerjaan (Kategori Master)
                      </label>
                      <select
                        value={selectedSp.workTypeId}
                        onChange={(e) =>
                          updateWorkType(selectedSp.specialPermitId, e.target.value)
                        }
                        className="w-full rounded border border-gray-300 bg-white p-2 text-xs focus:border-red-600 focus:outline-none"
                      >
                        <option value="">-- Pilih Jenis Pekerjaan --</option>
                        {masterWorkTypes.map((wt) => (
                          <option key={wt.id} value={wt.id}>
                            {wt.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Sub-Jenis Pekerjaan
                      </label>
                      <select
                        value={selectedSp.subWorkTypeId}
                        onChange={(e) =>
                          updateSubWorkType(selectedSp.specialPermitId, e.target.value)
                        }
                        disabled={!selectedWorkType || selectedWorkType.subWorkTypes.length === 0}
                        className="w-full rounded border border-gray-300 bg-white p-2 text-xs focus:border-red-600 focus:outline-none disabled:bg-gray-100"
                      >
                        <option value="">-- Pilih Sub-Jenis --</option>
                        {selectedWorkType?.subWorkTypes.map((swt) => (
                          <option key={swt.id} value={swt.id}>
                            {swt.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Informasi Tambahan Lapangan
                      </label>
                      <input
                        type="text"
                        value={selectedSp.informasiLain}
                        onChange={(e) =>
                          updateInformasiLain(selectedSp.specialPermitId, e.target.value)
                        }
                        placeholder="Misal: Bekerja pada elevasi +12 meter platform tanki..."
                        className="w-full rounded border border-gray-300 bg-white p-2 text-xs focus:border-red-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Checklist Cek Keselamatan Pra-Kerja */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4 text-emerald-600" />
                        Checklist Keselamatan Pra-Kerja &amp; Dokumen Uji:
                      </h5>
                    </div>

                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="px-4 py-2.5 text-left font-semibold">
                              Item Pemeriksaan Keselamatan
                            </th>
                            <th className="px-3 py-2.5 text-center font-semibold w-36">
                              Status
                            </th>
                            <th className="px-3 py-2.5 text-left font-semibold">
                              Catatan Inspeksi
                            </th>
                            <th className="px-3 py-2.5 text-left font-semibold w-48">
                              Dokumen Bukti / Sertifikat
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedSp.checks.map((chk) => {
                            const msc = masterSafetyChecks.find(
                              (m) => m.id === chk.masterSafetyCheckId
                            )
                            const isUploading =
                              uploadingFor?.specialPermitId ===
                                selectedSp.specialPermitId &&
                              uploadingFor?.checkId === chk.masterSafetyCheckId

                            return (
                              <tr key={chk.masterSafetyCheckId} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3 text-gray-800 font-medium">
                                  {msc?.name}
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <div className="inline-flex rounded-md shadow-2xs">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateCheckStatus(
                                          selectedSp.specialPermitId,
                                          chk.masterSafetyCheckId,
                                          "YES"
                                        )
                                      }
                                      className={`px-2.5 py-1 text-[11px] font-bold rounded-l border ${
                                        chk.status === "YES"
                                          ? "bg-emerald-600 text-white border-emerald-600"
                                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                                      }`}
                                    >
                                      Ya
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateCheckStatus(
                                          selectedSp.specialPermitId,
                                          chk.masterSafetyCheckId,
                                          "NO"
                                        )
                                      }
                                      className={`px-2.5 py-1 text-[11px] font-bold border-t border-b ${
                                        chk.status === "NO"
                                          ? "bg-red-600 text-white border-red-600"
                                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                                      }`}
                                    >
                                      Tidak
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateCheckStatus(
                                          selectedSp.specialPermitId,
                                          chk.masterSafetyCheckId,
                                          "NA"
                                        )
                                      }
                                      className={`px-2.5 py-1 text-[11px] font-bold rounded-r border ${
                                        chk.status === "NA"
                                          ? "bg-slate-700 text-white border-slate-700"
                                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                                      }`}
                                    >
                                      N/A
                                    </button>
                                  </div>
                                </td>
                                <td className="px-3 py-3">
                                  <input
                                    type="text"
                                    value={chk.notes}
                                    onChange={(e) =>
                                      updateCheckNotes(
                                        selectedSp.specialPermitId,
                                        chk.masterSafetyCheckId,
                                        e.target.value
                                      )
                                    }
                                    placeholder="Catatan inspeksi..."
                                    className="w-full text-xs rounded border border-gray-200 p-1.5 focus:border-red-600 focus:outline-none"
                                  />
                                </td>
                                <td className="px-3 py-3">
                                  {chk.documentPath ? (
                                    <div className="flex items-center gap-1.5">
                                      <a
                                        href={chk.documentPath}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[11px] font-medium text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[130px]"
                                      >
                                        <FileText className="w-3.5 h-3.5 shrink-0" />
                                        Lihat Berkas
                                      </a>
                                      <label className="text-[10px] text-gray-500 hover:text-gray-800 cursor-pointer underline">
                                        Ganti
                                        <input
                                          type="file"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                              handleUploadFile(
                                                selectedSp.specialPermitId,
                                                chk.masterSafetyCheckId,
                                                file
                                              )
                                            }
                                          }}
                                        />
                                      </label>
                                    </div>
                                  ) : (
                                    <label
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border border-gray-300 text-[11px] font-medium cursor-pointer transition ${
                                        isUploading
                                          ? "bg-gray-100 text-gray-400 pointer-events-none"
                                          : "bg-white text-gray-700 hover:bg-gray-50"
                                      }`}
                                    >
                                      <Upload className="w-3 h-3" />
                                      {isUploading ? "Mengunggah..." : "Upload Bukti"}
                                      <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0]
                                          if (file) {
                                            handleUploadFile(
                                              selectedSp.specialPermitId,
                                              chk.masterSafetyCheckId,
                                              file
                                            )
                                          }
                                        }}
                                      />
                                    </label>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bagian 2: Checklist Alat Pelindung Diri (APD) */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            2. Daftar Alat Pelindung Diri (APD) Wajib &amp; Khusus
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Pilih seluruh APD standar yang wajib digunakan oleh para pekerja vendor saat beraktivitas di lokasi.
          </p>
        </div>

        {/* Master APD Checkbox Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {masterApd.map((apd) => {
            const isChecked = selectedApdIds.includes(apd.id)
            return (
              <label
                key={apd.id}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition select-none ${
                  isChecked
                    ? "border-emerald-600 bg-emerald-50/70 font-semibold text-emerald-950 shadow-xs"
                    : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleApd(apd.id)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>{apd.name}</span>
              </label>
            )
          })}
        </div>

        {/* Input APD Khusus Tambahan */}
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <label className="block text-xs font-semibold text-gray-800">
            Tambah APD Khusus Lainnya (Opsional):
          </label>
          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              value={newCustomApd}
              onChange={(e) => setNewCustomApd(e.target.value)}
              placeholder="Contoh: Apron Kulit, Respirator Gas Kimia A2B2..."
              className="flex-1 rounded border border-gray-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addCustomApd()
                }
              }}
            />
            <button
              type="button"
              onClick={addCustomApd}
              className="px-3.5 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition"
            >
              Tambah
            </button>
          </div>

          {customApds.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {customApds.map((custom, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 text-xs bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full font-medium"
                >
                  {custom}
                  <button
                    type="button"
                    onClick={() => removeCustomApd(idx)}
                    className="p-0.5 hover:text-red-600 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error & Success Alerts */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.push(returnUrl)}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
        >
          Kembali
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition disabled:opacity-50 shadow-sm"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? "Menyimpan Berkas..." : "Simpan Permit Khusus & APD"}
        </button>
      </div>
    </form>
  )
}
