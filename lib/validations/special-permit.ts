import { z } from "zod"

export const safetyCheckItemSchema = z.object({
  masterSafetyCheckId: z.string().min(1),
  status: z.enum(["YES", "NO", "NA"]).default("NA"),
  notes: z.string().trim().optional().or(z.literal("")),
  documentPath: z.string().trim().optional().or(z.literal("")),
})

export const permitKhususItemSchema = z.object({
  specialPermitId: z.string().min(1, "Special permit ID wajib dipilih"),
  workTypeId: z.string().optional().or(z.literal("")),
  subWorkTypeId: z.string().optional().or(z.literal("")),
  informasiLain: z.string().trim().optional().or(z.literal("")),
  checks: z.array(safetyCheckItemSchema).default([]),
})

export const saveSpecialPermitsPayloadSchema = z.object({
  specialPermits: z.array(permitKhususItemSchema),
  apdIds: z.array(z.string()).min(1, "Wajib memilih minimal 1 Alat Pelindung Diri (APD) keselamatan"),
  customApds: z.array(z.string()).optional().default([]),
})

export type SafetyCheckItemInput = z.infer<typeof safetyCheckItemSchema>
export type PermitKhususItemInput = z.infer<typeof permitKhususItemSchema>
export type SaveSpecialPermitsPayloadInput = z.infer<typeof saveSpecialPermitsPayloadSchema>
