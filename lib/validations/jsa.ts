import { z } from "zod"

export const pengendalianSchema = z.object({
  id: z.string().optional(),
  text: z.string().trim().min(1, "Langkah mitigasi / pengendalian bahaya wajib diisi"),
  urutan: z.number().int().default(1),
})

export const bahayaSchema = z.object({
  id: z.string().optional(),
  text: z.string().trim().min(1, "Potensi bahaya wajib diisi"),
  urutan: z.number().int().default(1),
  pengendalian: z
    .array(pengendalianSchema)
    .min(1, "Setiap potensi bahaya wajib memiliki minimal 1 langkah mitigasi / pengendalian"),
})

export const tahapanSchema = z.object({
  id: z.string().optional(),
  text: z.string().trim().min(1, "Deskripsi tahapan kerja wajib diisi"),
  urutan: z.number().int().default(1),
  bahaya: z
    .array(bahayaSchema)
    .min(1, "Setiap tahapan kerja wajib memiliki minimal 1 identifikasi potensi bahaya"),
})

export const peralatanSchema = z.object({
  id: z.string().optional(),
  nama: z.string().trim().min(1, "Nama mesin / alat kerja wajib diisi"),
  itemSafety: z.string().trim().optional().or(z.literal("")),
  jumlah: z.coerce.number().int().min(1, "Jumlah alat minimal 1"),
  imageUrl: z.string().trim().optional().or(z.literal("")),
})

export const jsaPayloadSchema = z.object({
  isElectrical: z.boolean().default(false),
  tahapan: z
    .array(tahapanSchema)
    .min(1, "Wajib mengisi minimal 1 tahapan kerja dalam JSA"),
  peralatan: z
    .array(peralatanSchema)
    .min(1, "Wajib mendaftarkan minimal 1 mesin/alat kerja yang dibawa vendor"),
  electricalIds: z.array(z.string()).optional().default([]),
  electricalNotes: z.string().trim().optional().or(z.literal("")),
})

export type PengendalianInput = z.infer<typeof pengendalianSchema>
export type BahayaInput = z.infer<typeof bahayaSchema>
export type TahapanInput = z.infer<typeof tahapanSchema>
export type PeralatanInput = z.infer<typeof peralatanSchema>
export type JsaPayloadInput = z.infer<typeof jsaPayloadSchema>
