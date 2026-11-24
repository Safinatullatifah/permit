"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  MapPin,
  Plus,
  Save,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Wrench,
  Zap,
} from "lucide-react"

interface MasterElectricalItem {
  id: string
  name: string
}

interface PengendalianState {
  id?: string
  text: string
}

interface BahayaState {
  id?: string
  text: string
  pengendalian: PengendalianState[]
}

interface TahapanState {
  id?: string
  text: string
  bahaya: BahayaState[]
}

interface PeralatanState {
  id?: string
  nama: string
  itemSafety: string
  jumlah: number
  imageUrl: string
}

interface JsaFormProps {
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
  initialJsa?: {
    isElectrical: boolean
    tahapan: {
      text: string
      bahaya: {
        text: string
        pengendalian: { text: string }[]
      }[]
    }[]
    peralatan: {
      nama: string
      itemSafety: string | null
      jumlah: number
      imageUrl: string | null
    }[]
    sambungan: {
      masterElectricalId: string
      notes: string | null
    }[]
  } | null
  availableElectrical: MasterElectricalItem[]
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

export default function JsaForm({
  permit,
  initialJsa,
  availableElectrical,
  returnUrl = "/vendor",
}: JsaFormProps) {
  const router = useRouter()

  // State Pohon Bahaya (Tahapan -> Bahaya -> Pengendalian)
  const [tahapanList, setTahapanList] = useState<TahapanState[]>(() => {
    if (initialJsa?.tahapan && initialJsa.tahapan.length > 0) {
      return initialJsa.tahapan.map((t) => ({
        text: t.text,
        bahaya: t.bahaya.map((b) => ({
          text: b.text,
          pengendalian: b.pengendalian.map((p) => ({ text: p.text })),
        })),
      }))
    }
    return [
      {
        text: "",
        bahaya: [
          {
            text: "",
            pengendalian: [{ text: "" }],
          },
        ],
      },
    ]
  })

  // State Peralatan Kerja
  const [peralatanList, setPeralatanList] = useState<PeralatanState[]>(() => {
    if (initialJsa?.peralatan && initialJsa.peralatan.length > 0) {
      return initialJsa.peralatan.map((a) => ({
        nama: a.nama,
        itemSafety: a.itemSafety || "",
        jumlah: a.jumlah,
        imageUrl: a.imageUrl || "",
      }))
    }
    return [
      {
        nama: "",
        itemSafety: "",
        jumlah: 1,
        imageUrl: "",
      },
    ]
  })

  // State Sambungan Elektrikal
  const [isElectrical, setIsElectrical] = useState<boolean>(
    initialJsa?.isElectrical ?? false
  )
  const [selectedElectricalIds, setSelectedElectricalIds] = useState<string[]>(
    () => (initialJsa?.sambungan ? initialJsa.sambungan.map((s) => s.masterElectricalId) : [])
  )
  const [electricalNotes, setElectricalNotes] = useState<string>(
    () => initialJsa?.sambungan?.[0]?.notes || ""
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // --- Handlers Tahapan ---
  const addTahapan = () => {
    setTahapanList([
      ...tahapanList,
      {
        text: "",
        bahaya: [{ text: "", pengendalian: [{ text: "" }] }],
      },
    ])
  }

  const removeTahapan = (tIndex: number) => {
    if (tahapanList.length <= 1) return
    setTahapanList(tahapanList.filter((_, i) => i !== tIndex))
  }

  const updateTahapanText = (tIndex: number, text: string) => {
    const updated = [...tahapanList]
    updated[tIndex].text = text
    setTahapanList(updated)
  }

  // --- Handlers Bahaya ---
  const addBahaya = (tIndex: number) => {
    const updated = [...tahapanList]
    updated[tIndex].bahaya.push({
      text: "",
      pengendalian: [{ text: "" }],
    })
    setTahapanList(updated)
  }

  const removeBahaya = (tIndex: number, bIndex: number) => {
    const updated = [...tahapanList]
    if (updated[tIndex].bahaya.length <= 1) return
    updated[tIndex].bahaya = updated[tIndex].bahaya.filter((_, i) => i !== bIndex)
    setTahapanList(updated)
  }

  const updateBahayaText = (tIndex: number, bIndex: number, text: string) => {
    const updated = [...tahapanList]
    updated[tIndex].bahaya[bIndex].text = text
    setTahapanList(updated)
  }

  // --- Handlers Pengendalian ---
  const addPengendalian = (tIndex: number, bIndex: number) => {
    const updated = [...tahapanList]
    updated[tIndex].bahaya[bIndex].pengendalian.push({ text: "" })
    setTahapanList(updated)
  }

  const removePengendalian = (tIndex: number, bIndex: number, pIndex: number) => {
    const updated = [...tahapanList]
    if (updated[tIndex].bahaya[bIndex].pengendalian.length <= 1) return
    updated[tIndex].bahaya[bIndex].pengendalian = updated[tIndex].bahaya[
      bIndex
    ].pengendalian.filter((_, i) => i !== pIndex)
    setTahapanList(updated)
  }

  const updatePengendalianText = (
    tIndex: number,
    bIndex: number,
    pIndex: number,
    text: string
  ) => {
    const updated = [...tahapanList]
    updated[tIndex].bahaya[bIndex].pengendalian[pIndex].text = text
    setTahapanList(updated)
  }

  // --- Handlers Peralatan ---
  const addPeralatan = () => {
    setPeralatanList([
      ...peralatanList,
      { nama: "", itemSafety: "", jumlah: 1, imageUrl: "" },
    ])
  }

  const removePeralatan = (index: number) => {
    if (peralatanList.length <= 1) return
    setPeralatanList(peralatanList.filter((_, i) => i !== index))
  }

  const updatePeralatan = (
    index: number,
    field: keyof PeralatanState,
    value: string | number
  ) => {
    const updated = [...peralatanList]
    updated[index] = { ...updated[index], [field]: value }
    setPeralatanList(updated)
  }

  // --- Handler Sambungan Elektrikal ---
  const toggleElectrical = (id: string) => {
    if (selectedElectricalIds.includes(id)) {
      setSelectedElectricalIds(selectedElectricalIds.filter((item) => item !== id))
    } else {
      setSelectedElectricalIds([...selectedElectricalIds, id])
    }
  }

  // --- Submit Form ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    // Validasi Sederhana
    const hasEmptyTahapan = tahapanList.some((t) => !t.text.trim())
    if (hasEmptyTahapan) {
      setErrorMsg("Seluruh deskripsi tahapan kerja wajib diisi.")
      return
    }

    const hasEmptyBahaya = tahapanList.some((t) =>
      t.bahaya.some((b) => !b.text.trim())
    )
    if (hasEmptyBahaya) {
      setErrorMsg("Seluruh identifikasi potensi bahaya wajib diisi.")
      return
    }

    const hasEmptyPengendalian = tahapanList.some((t) =>
      t.bahaya.some((b) => b.pengendalian.some((p) => !p.text.trim()))
    )
    if (hasEmptyPengendalian) {
      setErrorMsg("Seluruh langkah mitigasi / pengendalian wajib diisi.")
      return
    }

    const hasEmptyAlat = peralatanList.some((a) => !a.nama.trim())
    if (hasEmptyAlat) {
      setErrorMsg("Nama mesin / alat kerja wajib diisi.")
      return
    }

    if (isElectrical && selectedElectricalIds.length === 0) {
      setErrorMsg(
        "Anda menandai pekerjaan melibatkan listrik. Pilih minimal 1 tipe sambungan elektrikal yang digunakan."
      )
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/permits/${permit.id}/jsa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isElectrical,
          tahapan: tahapanList,
          peralatan: peralatanList,
          electricalIds: isElectrical ? selectedElectricalIds : [],
          electricalNotes: isElectrical ? electricalNotes : "",
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal menyimpan dokumen JSA.")
        return
      }

      setSuccessMsg("Dokumen Job Safety Analysis (JSA) berhasil disimpan!")
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

      {/* Bagian 1: Pohon Analisis Bahaya (3-Level Hierarchy) */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 pb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              1. Pohon Analisis Bahaya (Job Safety Analysis)
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Pecah pekerjaan ke dalam urutan langkah logis, identifikasi potensi bahaya di tiap langkah, dan tentukan tindakan pencegahan/mitigasi terukur.
            </p>
          </div>
          <button
            type="button"
            onClick={addTahapan}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition shadow-sm w-fit"
          >
            <Plus className="w-4 h-4" /> Tambah Tahapan Kerja
          </button>
        </div>

        <div className="space-y-6">
          {tahapanList.map((tahapan, tIdx) => (
            <div
              key={tIdx}
              className="border border-slate-300 bg-slate-50/50 rounded-xl p-5 space-y-4"
            >
              {/* Level 1: Tahapan Kerja */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 w-full">
                  <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center shrink-0">
                    {tIdx + 1}
                  </span>
                  <div className="w-full">
                    <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
                      Deskripsi Tahapan Pekerjaan {tIdx + 1}
                    </label>
                    <input
                      type="text"
                      value={tahapan.text}
                      onChange={(e) => updateTahapanText(tIdx, e.target.value)}
                      placeholder="Contoh: 1. Persiapan area kerja dan pemindahan material yang mudah terbakar..."
                      className="w-full text-xs font-medium rounded-lg border border-gray-300 bg-white p-2.5 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      required
                    />
                  </div>
                </div>

                {tahapanList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTahapan(tIdx)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded transition shrink-0 mt-5"
                    title="Hapus Tahapan Ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Level 2 & 3: Bahaya & Pengendalian */}
              <div className="pl-4 sm:pl-9 space-y-4 border-l-2 border-slate-300 ml-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Potensi Bahaya &amp; Pengendalian pada Tahap {tIdx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => addBahaya(tIdx)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded hover:bg-amber-100 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Bahaya
                  </button>
                </div>

                {tahapan.bahaya.map((bahaya, bIdx) => (
                  <div
                    key={bIdx}
                    className="bg-white border border-amber-200/80 rounded-lg p-4 space-y-3 shadow-xs"
                  >
                    {/* Level 2: Potensi Bahaya */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-full space-y-1">
                        <label className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Potensi Bahaya {tIdx + 1}.{bIdx + 1}
                        </label>
                        <input
                          type="text"
                          value={bahaya.text}
                          onChange={(e) => updateBahayaText(tIdx, bIdx, e.target.value)}
                          placeholder="Contoh: Percikan api las mengenai kabel atau bahan mudah terbakar..."
                          className="w-full text-xs rounded-md border border-amber-200 bg-amber-50/20 p-2 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                          required
                        />
                      </div>
                      {tahapan.bahaya.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBahaya(tIdx, bIdx)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded mt-4"
                          title="Hapus Bahaya Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Level 3: Tindakan Mitigasi / Pengendalian */}
                    <div className="pl-4 space-y-2 border-l-2 border-emerald-300">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Langkah Pengendalian / Mitigasi
                        </span>
                        <button
                          type="button"
                          onClick={() => addPengendalian(tIdx, bIdx)}
                          className="text-[10px] text-emerald-700 hover:underline flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" /> Tambah Mitigasi
                        </button>
                      </div>

                      {bahaya.pengendalian.map((pengendalian, pIdx) => (
                        <div key={pIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={pengendalian.text}
                            onChange={(e) =>
                              updatePengendalianText(tIdx, bIdx, pIdx, e.target.value)
                            }
                            placeholder="Contoh: Tutup area dengan fire blanket dan siapkan APAR 6kg dalam jangkauan 3m..."
                            className="w-full text-xs rounded border border-gray-200 bg-gray-50/50 p-1.5 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                            required
                          />
                          {bahaya.pengendalian.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePengendalian(tIdx, bIdx, pIdx)}
                              className="p-1 text-gray-300 hover:text-red-500 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bagian 2: Daftar Peralatan Kerja (Mesin / Alat Vendor) */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 pb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-600" />
              2. Daftar Peralatan &amp; Mesin Kerja
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Daftarkan seluruh peralatan, mesin portabel, atau perkakas kerja yang dibawa vendor ke dalam lokasi pabrik beserta spesifikasi keselamatannya.
            </p>
          </div>
          <button
            type="button"
            onClick={addPeralatan}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition shadow-sm w-fit"
          >
            <Plus className="w-4 h-4" /> Tambah Alat Kerja
          </button>
        </div>

        <div className="space-y-3">
          {peralatanList.map((alat, aIdx) => (
            <div
              key={aIdx}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3.5 rounded-lg border border-gray-200 bg-gray-50/60 items-center text-xs"
            >
              <div className="md:col-span-4">
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Nama Alat / Mesin <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={alat.nama}
                  onChange={(e) => updatePeralatan(aIdx, "nama", e.target.value)}
                  placeholder="Contoh: Mesin Gerinda Tangan 4 Inch"
                  className="w-full rounded border border-gray-300 bg-white p-2 text-xs focus:border-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Kondisi Safety / Pelindung
                </label>
                <input
                  type="text"
                  value={alat.itemSafety}
                  onChange={(e) => updatePeralatan(aIdx, "itemSafety", e.target.value)}
                  placeholder="Cover terpasang, kabel isolasi utuh, grounding OK"
                  className="w-full rounded border border-gray-300 bg-white p-2 text-xs focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-[11px] font-medium text-gray-700 mb-1">Jumlah</label>
                <input
                  type="number"
                  min={1}
                  value={alat.jumlah}
                  onChange={(e) =>
                    updatePeralatan(aIdx, "jumlah", parseInt(e.target.value) || 1)
                  }
                  className="w-full rounded border border-gray-300 bg-white p-2 text-xs text-center focus:border-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Foto / URL Alat (Opsional)
                </label>
                <input
                  type="text"
                  value={alat.imageUrl}
                  onChange={(e) => updatePeralatan(aIdx, "imageUrl", e.target.value)}
                  placeholder="https://... atau nomor seri"
                  className="w-full rounded border border-gray-300 bg-white p-2 text-xs focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="md:col-span-1 flex justify-end md:justify-center pt-2 md:pt-4">
                {peralatanList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePeralatan(aIdx)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded transition"
                    title="Hapus Alat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bagian 3: Inspeksi Sambungan Elektrikal */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            3. Inspeksi Sambungan Elektrikal
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Jika pekerjaan membutuhkan sambungan daya listrik pabrik, tentukan tipe konektor industri dan langkah keselamatan kelistrikan.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isElectrical}
              onChange={(e) => setIsElectrical(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <div>
              <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                Pekerjaan Menggunakan Sambungan Arus Listrik / Daya Pabrik
              </span>
              <p className="text-[11px] text-gray-600 mt-0.5">
                Centang jika vendor menggunakan trafo las listrik, mesin potong bertenaga listrik, blower ventilasi, atau alat portable beraliran arus.
              </p>
            </div>
          </label>

          {isElectrical && (
            <div className="pt-3 border-t border-amber-200/70 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-2">
                  Pilih Jenis Sambungan Industri yang Sesuai Standar Pabrik:{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {availableElectrical.map((item) => {
                    const isChecked = selectedElectricalIds.includes(item.id)
                    return (
                      <label
                        key={item.id}
                        className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition ${
                          isChecked
                            ? "border-amber-600 bg-amber-100/70 font-semibold text-amber-950"
                            : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleElectrical(item.id)}
                          className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span>{item.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  Catatan Tambahan Kelistrikan (Daya Maksimal / Lokasi Sumber Stop Kontak)
                </label>
                <textarea
                  rows={2}
                  value={electricalNotes}
                  onChange={(e) => setElectricalNotes(e.target.value)}
                  placeholder="Contoh: Beban daya maksimal 2.2 kW, menggunakan stop kontak 1-phase dekat pilar B-3..."
                  className="w-full text-xs rounded-md border border-gray-300 bg-white p-2.5 focus:border-amber-600 focus:outline-none"
                />
              </div>
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
          {isSubmitting ? "Menyimpan JSA..." : "Simpan Dokumen JSA"}
        </button>
      </div>
    </form>
  )
}
