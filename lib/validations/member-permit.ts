import { z } from "zod";

export const memberItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nama pekerja wajib diisi minimal 2 karakter"),
  idCardNumber: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  isHealthy: z.boolean().default(true),
});

export const memberPermitSchema = z.object({
  picVendor: z.string().min(2, "Nama PIC Vendor wajib diisi minimal 2 karakter"),
  members: z.array(memberItemSchema).min(1, "Minimal harus mendaftarkan 1 pekerja"),
});

export type MemberItemInput = z.infer<typeof memberItemSchema>;
export type MemberPermitInput = z.infer<typeof memberPermitSchema>;
