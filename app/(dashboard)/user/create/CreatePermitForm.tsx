"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createPermitSchema, type CreatePermitInput } from "@/lib/validations/permit"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, FileText, Info } from "lucide-react"

type OptionItem = {
  id: string
  label: string
  subLabel?: string | null
}

interface CreatePermitFormProps {
  vendors: OptionItem[]
  pics: OptionItem[]
  pengawasList: OptionItem[]
}

export default function CreatePermitForm({
  vendors,
  pics,
  pengawasList,
}: CreatePermitFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [createdNomor, setCreatedNomor] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreatePermitInput>({
    resolver: zodResolver(createPermitSchema),
    defaultValues: {
      workName: "",
      location: "",
      startDate: "",
      endDate: "",
      vendorId: "",
      picId: "",
      pengawasId: "",
      poNumber: "",
      spkNumber: "",
    },
  })

  const poValue = watch("poNumber")?.trim() || ""
  const spkValue = watch("spkNumber")?.trim() || ""
  const hasPoOrSpk = Boolean(poValue || spkValue)

  const onSubmit = async (data: CreatePermitInput) => {
    setServerError(null)
    setCreatedNomor(null)

    try {
      const res = await fetch("/api/permits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()
      if (!res.ok) {
        setServerError(result.error || "Gagal menyimpan permohonan permit.")
        return
      }

      setCreatedNomor(result.permit?.nomor || null)
      router.push("/user")
      router.refresh()
    } catch {
      setServerError("Terjadi kesalahan jaringan saat mengirim permohonan permit.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {createdNomor && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Permohonan permit <strong>{createdNomor}</strong> berhasil dibuat! Mengalihkan ke dashboard...
          </span>
        </div>
      )}

      {/* Informasi Pekerjaan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="workName" className="text-gray-700">
            Nama Pekerjaan <span className="text-red-500">*</span>
          </Label>
          <Input
            id="workName"
            placeholder="Contoh: Pengelasan Pipa Steam Line 2"
            {...register("workName")}
          />
          {errors.workName && (
            <p className="text-xs text-red-600">{errors.workName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="text-gray-700">
            Lokasi Kerja <span className="text-red-500">*</span>
          </Label>
          <Input
            id="location"
            placeholder="Contoh: Area Boiler Gedung B"
            {...register("location")}
          />
          {errors.location && (
            <p className="text-xs text-red-600">{errors.location.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-gray-700">
            Tanggal Mulai <span className="text-red-500">*</span>
          </Label>
          <Input id="startDate" type="date" {...register("startDate")} />
          {errors.startDate && (
            <p className="text-xs text-red-600">{errors.startDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-gray-700">
            Tanggal Selesai <span className="text-red-500">*</span>
          </Label>
          <Input id="endDate" type="date" {...register("endDate")} />
          {errors.endDate && (
            <p className="text-xs text-red-600">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      {/* Pilihan Vendor, PIC Area, Pengawas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 border-t border-gray-100">
        <div className="space-y-2">
          <Label htmlFor="vendorId" className="text-gray-700">
            Vendor Pelaksana <span className="text-red-500">*</span>
          </Label>
          <select
            id="vendorId"
            {...register("vendorId")}
            className="flex h-9 w-full rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/20"
          >
            <option value="">- Pilih Vendor -</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
          {errors.vendorId && (
            <p className="text-xs text-red-600">{errors.vendorId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="picId" className="text-gray-700">
            PIC Area <span className="text-red-500">*</span>
          </Label>
          <select
            id="picId"
            {...register("picId")}
            className="flex h-9 w-full rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/20"
          >
            <option value="">- Pilih PIC Area -</option>
            {pics.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
                {p.subLabel ? ` (${p.subLabel})` : ""}
              </option>
            ))}
          </select>
          {errors.picId && (
            <p className="text-xs text-red-600">{errors.picId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pengawasId" className="text-gray-700">
            Pengawas Kerja <span className="text-red-500">*</span>
          </Label>
          <select
            id="pengawasId"
            {...register("pengawasId")}
            className="flex h-9 w-full rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/20"
          >
            <option value="">- Pilih Pengawas Kerja -</option>
            {pengawasList.map((pg) => (
              <option key={pg.id} value={pg.id}>
                {pg.label}
                {pg.subLabel ? ` (${pg.subLabel})` : ""}
              </option>
            ))}
          </select>
          {errors.pengawasId && (
            <p className="text-xs text-red-600">{errors.pengawasId.message}</p>
          )}
        </div>
      </div>

      {/* Nomor PO / Nomor SPK */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-700" />
              Dokumen Referensi Pekerjaan (No. PO / No. SPK)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Isi minimal salah satu: <strong>Nomor PO</strong> (alur verifikasi LP) atau{" "}
              <strong>Nomor SPK</strong> (alur verifikasi teknis akhir oleh PIC).
            </p>
          </div>
          {hasPoOrSpk ? (
            <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium bg-green-100 text-green-800 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {poValue ? "Alur PO" : "Alur SPK"}
            </span>
          ) : (
            <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
              <Info className="w-3.5 h-3.5" /> Wajib isi salah satu
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="poNumber" className="text-gray-700">
              Nomor PO (Opsional jika ada SPK)
            </Label>
            <Input
              id="poNumber"
              placeholder="Contoh: PO-2026-00142"
              className="bg-white"
              {...register("poNumber")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="spkNumber" className="text-gray-700">
              Nomor SPK (Opsional jika ada PO)
            </Label>
            <Input
              id="spkNumber"
              placeholder="Contoh: SPK-MNT-2026-08"
              className="bg-white"
              {...register("spkNumber")}
            />
          </div>
        </div>

        {errors.poNumber && (
          <p className="text-xs font-medium text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.poNumber.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/user")}
          className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-slate-900 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-slate-800 disabled:bg-gray-400 transition"
        >
          {isSubmitting ? "Mengirim Permohonan..." : "Ajukan Permit"}
        </button>
      </div>
    </form>
  )
}
