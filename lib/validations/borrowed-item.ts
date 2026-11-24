import { z } from "zod"

export const pinjamEquipmentItemSchema = z.object({
  barangId: z.string().min(1, "Alat K3 wajib dipilih"),
  jumlah: z.coerce.number().int().min(1, "Jumlah minimal 1"),
  catatan: z.string().trim().optional().or(z.literal("")),
})

export const barangBawaanItemSchema = z.object({
  nama: z.string().trim().min(1, "Nama material/barang bawaan wajib diisi"),
  jumlah: z.coerce.number().int().min(1, "Jumlah minimal 1"),
  satuan: z.string().trim().optional().or(z.literal("")),
  catatan: z.string().trim().optional().or(z.literal("")),
})

export const saveBorrowedEquipmentPayloadSchema = z.object({
  equipment: z.array(pinjamEquipmentItemSchema).default([]),
  materialBawaan: z.array(barangBawaanItemSchema).default([]),
})

export type PinjamEquipmentItemInput = z.infer<typeof pinjamEquipmentItemSchema>
export type BarangBawaanItemInput = z.infer<typeof barangBawaanItemSchema>
export type SaveBorrowedEquipmentPayloadInput = z.infer<typeof saveBorrowedEquipmentPayloadSchema>
