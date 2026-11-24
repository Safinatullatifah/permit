"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  Box,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Package,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Wrench,
} from "lucide-react"

export interface MasterBorrowedItemOption {
  id: string
  name: string
}

interface EquipmentRowState {
  barangId: string
  jumlah: number
  catatan: string
  status?: string
}

interface MaterialRowState {
  nama: string
  jumlah: number
  satuan: string
  catatan: string
}

interface BorrowedEquipmentFormProps {
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
  masterBorrowedItems: MasterBorrowedItemOption[]
  initialEquipment?: EquipmentRowState[]
  initialMaterial?: MaterialRowState[]
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

export default function BorrowedEquipmentForm({
  permit,
  masterBorrowedItems,
  initialEquipment = [],
  initialMaterial = [],
  returnUrl = "/vendor",
}: BorrowedEquipmentFormProps) {
  const router = useRouter()

  const [equipmentList, setEquipmentList] = useState<EquipmentRowState[]>(() => {
    if (initialEquipment.length > 0) {
      return initialEquipment
    }
    return []
  })

  const [materialList, setMaterialList] = useState<MaterialRowState[]>(() => {
    if (initialMaterial.length > 0) {
      return initialMaterial
    }
    return []
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // --- Handlers Equipment ---
  const addEquipmentRow = () => {
    if (masterBorrowedItems.length === 0) return
    setEquipmentList([
      ...equipmentList,
      {
        barangId: masterBorrowedItems[0].id,
        jumlah: 1,
        catatan: "",
        status: "PENDING",
      },
    ])
  }

  const removeEquipmentRow = (index: number) => {
    setEquipmentList(equipmentList.filter((_, i) => i !== index))
  }

  const updateEquipmentRow = (
    index: number,
    field: keyof EquipmentRowState,
    value: string | number
  ) => {
    const updated = [...equipmentList]
    updated[index] = { ...updated[index], [field]: value }
    setEquipmentList(updated)
  }

  // --- Handlers Material ---
  const addMaterialRow = () => {
    setMaterialList([
      ...materialList,
      {
        nama: "",
        jumlah: 1,
        satuan: "unit",
        catatan: "",
      },
    ])
  }

  const removeMaterialRow = (index: number) => {
    setMaterialList(materialList.filter((_, i) => i !== index))
  }

  const updateMaterialRow = (
    index: number,
    field: keyof MaterialRowState,
    value: string | number
  ) => {
    const updated = [...materialList]
    updated[index] = { ...updated[index], [field]: value }
    setMaterialList(updated)
  }

  // --- Submit Handler ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    // Validasi baris equipment
    const hasInvalidEquipment = equipmentList.some(
      (item) => !item.barangId || item.jumlah < 1
    )
    if (hasInvalidEquipment) {
      setErrorMsg("Seluruh pilihan alat K3 pabrik dan jumlah wajib diisi dengan benar.")
      return
    }

    // Validasi material bawaan jika ada
    const hasInvalidMaterial = materialList.some(
      (mat) => !mat.nama.trim() || mat.jumlah < 1
    )
    if (hasInvalidMaterial) {
      setErrorMsg("Nama material bawaan dan jumlah unit wajib diisi.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/permits/${permit.id}/borrowed-equipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipment: equipmentList,
          materialBawaan: materialList,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal menyimpan pengajuan peminjaman alat K3.")
        return
      }

      setSuccessMsg("Daftar peminjaman alat K3 dan material bawaan berhasil disimpan!")
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

      {/* Bagian 1: Peminjaman Alat K3 Milik Pabrik */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 pb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              1. Peminjaman Peralatan K3 Milik Pabrik
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Vendor dapat mengajukan peminjaman alat keselamatan bersertifikasi milik gudang SHE pabrik (Gas detector, Tripod rescue, Blower ruang terbatas, SCBA, dll.).
            </p>
          </div>
          <button
            type="button"
            onClick={addEquipmentRow}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition shadow-sm w-fit"
          >
            <Plus className="w-4 h-4" /> Ajukan Pinjam Alat
          </button>
        </div>

        {equipmentList.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-500 space-y-2">
            <p className="font-medium text-gray-700">
              Tidak ada peralatan K3 pabrik yang dipinjam untuk pekerjaan ini.
            </p>
            <p>
              Klik tombol <strong>&ldquo;Ajukan Pinjam Alat&rdquo;</strong> jika pekerjaan vendor memerlukan alat keselamatan standar SHE pabrik.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {equipmentList.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50/70 items-center text-xs"
              >
                <div className="md:col-span-5">
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Peralatan K3 Pabrik <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={row.barangId}
                    onChange={(e) => updateEquipmentRow(idx, "barangId", e.target.value)}
                    className="w-full rounded border border-gray-300 bg-white p-2 text-xs focus:border-slate-900 focus:outline-none"
                    required
                  >
                    {masterBorrowedItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Jumlah Unit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={row.jumlah}
                    onChange={(e) =>
                      updateEquipmentRow(idx, "jumlah", parseInt(e.target.value) || 1)
                    }
                    className="w-full rounded border border-gray-300 bg-white p-2 text-xs text-center focus:border-slate-900 focus:outline-none"
                    required
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Catatan Keperluan / Durasi
                  </label>
                  <input
                    type="text"
                    value={row.catatan}
                    onChange={(e) => updateEquipmentRow(idx, "catatan", e.target.value)}
                    placeholder="Misal: Digunakan saat inspeksi confined space tanki..."
                    className="w-full rounded border border-gray-300 bg-white p-2 text-xs focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-1 flex justify-end md:justify-center pt-2 md:pt-4">
                  <button
                    type="button"
                    onClick={() => removeEquipmentRow(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded transition"
                    title="Hapus Alat Pinjam"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bagian 2: Daftar Material & Barang Bawaan Vendor ke Area Pabrik */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 pb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Box className="w-5 h-5 text-blue-600" />
              2. Daftar Material &amp; Barang Bawaan Masuk Pabrik
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Daftarkan bahan baku, material konstruksi, atau spare part yang dibawa masuk ke area pabrik untuk keperluan verifikasi gerbang oleh petugas Security.
            </p>
          </div>
          <button
            type="button"
            onClick={addMaterialRow}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition shadow-sm w-fit"
          >
            <Plus className="w-4 h-4" /> Tambah Material
          </button>
        </div>

        {materialList.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-500 space-y-2">
            <p className="font-medium text-gray-700">
              Belum ada material / barang bawaan yang didaftarkan.
            </p>
            <p>
              Klik <strong>&ldquo;Tambah Material&rdquo;</strong> jika ada material proyek (misal: pipa, kawat las, kabel, cat) yang dibawa masuk.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {materialList.map((mat, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50/70 items-center text-xs"
              >
                <div className="md:col-span-5">
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Nama Material / Barang Bawaan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={mat.nama}
                    onChange={(e) => updateMaterialRow(idx, "nama", e.target.value)}
                    placeholder="Contoh: Pipa Seamless 4 Inch, Plat Baja 5mm, Cat Epoxy..."
                    className="w-full rounded border border-gray-300 bg-white p-2 text-xs focus:border-slate-900 focus:outline-none"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Jumlah <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={mat.jumlah}
                    onChange={(e) =>
                      updateMaterialRow(idx, "jumlah", parseInt(e.target.value) || 1)
                    }
                    className="w-full rounded border border-gray-300 bg-white p-2 text-xs text-center focus:border-slate-900 focus:outline-none"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    value={mat.satuan}
                    onChange={(e) => updateMaterialRow(idx, "satuan", e.target.value)}
                    placeholder="batang, roll, dus, unit"
                    className="w-full rounded border border-gray-300 bg-white p-2 text-xs focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Catatan
                  </label>
                  <input
                    type="text"
                    value={mat.catatan}
                    onChange={(e) => updateMaterialRow(idx, "catatan", e.target.value)}
                    placeholder="Keterangan..."
                    className="w-full rounded border border-gray-300 bg-white p-2 text-xs focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-1 flex justify-end md:justify-center pt-2 md:pt-4">
                  <button
                    type="button"
                    onClick={() => removeMaterialRow(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded transition"
                    title="Hapus Material"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
          {isSubmitting ? "Menyimpan Data..." : "Simpan Peminjaman & Material"}
        </button>
      </div>
    </form>
  )
}
