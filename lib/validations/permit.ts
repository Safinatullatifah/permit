import { z } from "zod"

export const createPermitSchema = z
  .object({
    workName: z.string().trim().min(1, "Nama pekerjaan wajib diisi"),
    location: z.string().trim().min(1, "Lokasi kerja wajib diisi"),
    startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
    endDate: z.string().min(1, "Tanggal selesai wajib diisi"),
    vendorId: z.string().min(1, "Vendor pelaksana wajib dipilih"),
    picId: z.string().min(1, "PIC Area wajib dipilih"),
    pengawasId: z.string().min(1, "Pengawas kerja wajib dipilih"),
    poNumber: z.string().trim().optional().or(z.literal("")),
    spkNumber: z.string().trim().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true
      return new Date(data.endDate) >= new Date(data.startDate)
    },
    {
      message: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => Boolean(data.poNumber?.trim() || data.spkNumber?.trim()),
    {
      message: "Wajib mengisi minimal salah satu: Nomor PO atau Nomor SPK",
      path: ["poNumber"],
    }
  )

export type CreatePermitInput = z.infer<typeof createPermitSchema>

export const verifyPermitSchema = z
  .object({
    action: z.enum(["verify-pic-initial", "verify-lp", "verify-user", "verify-she"]),
    decision: z.enum(["approve", "reject"]),
    remark: z.string().trim().optional().or(z.literal("")),
    isHighRisk: z.boolean().optional(),
  })
  .refine(
    (data) => data.decision !== "reject" || Boolean(data.remark?.trim()),
    {
      message: "Catatan alasan penolakan wajib diisi",
      path: ["remark"],
    }
  )

export type VerifyPermitInput = z.infer<typeof verifyPermitSchema>

export const reapprovePermitSchema = z
  .object({
    workName: z.string().trim().min(1, "Nama pekerjaan wajib diisi").optional(),
    location: z.string().trim().min(1, "Lokasi kerja wajib diisi").optional(),
    startDate: z.string().min(1, "Tanggal mulai wajib diisi").optional(),
    endDate: z.string().min(1, "Tanggal selesai wajib diisi").optional(),
    poNumber: z.string().trim().optional().or(z.literal("")),
    spkNumber: z.string().trim().optional().or(z.literal("")),
    revisionNote: z.string().trim().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true
      return new Date(data.endDate) >= new Date(data.startDate)
    },
    {
      message: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai",
      path: ["endDate"],
    }
  )

export type ReapprovePermitInput = z.infer<typeof reapprovePermitSchema>
