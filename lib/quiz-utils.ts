import { existsSync } from "fs"
import { mkdir, unlink, writeFile } from "fs/promises"
import path from "path"
import { z } from "zod"

export const choiceSchema = z.object({
  text: z.string().trim().min(1, "Teks pilihan jawaban tidak boleh kosong"),
  isCorrect: z.boolean(),
})

export const quizPayloadSchema = z.object({
  question: z.string().trim().min(1, "Pertanyaan soal wajib diisi"),
  choices: z
    .array(choiceSchema)
    .min(2, "Minimal harus memiliki 2 pilihan jawaban")
    .refine(
      (items) => items.filter((item) => item.isCorrect).length === 1,
      "Pilih tepat 1 kunci jawaban yang benar"
    ),
})

export const quizPatchSchema = z.object({
  question: z.string().trim().min(1, "Pertanyaan soal wajib diisi").optional(),
  isActive: z.boolean().optional(),
  choices: z
    .array(choiceSchema)
    .min(2, "Minimal harus memiliki 2 pilihan jawaban")
    .refine(
      (items) => items.filter((item) => item.isCorrect).length === 1,
      "Pilih tepat 1 kunci jawaban yang benar"
    )
    .optional(),
})

/**
 * Menyimpan gambar ilustrasi soal ke folder public/uploads/quizzes.
 */
export async function saveQuizImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File ilustrasi harus berupa gambar (PNG, JPG, WEBP, dll.)")
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "quizzes")
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  const safeName = path.basename(file.name).replace(/[^a-zA-Z0-9.-]/g, "_")
  const filename = `${Date.now()}-${safeName}`
  const filepath = path.join(uploadDir, filename)
  const buffer = Buffer.from(await file.arrayBuffer())

  await writeFile(filepath, buffer)
  return `/uploads/quizzes/${filename}`
}

/**
 * Menghapus file gambar fisik dari folder public jika ada.
 */
export async function removeQuizImage(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl) return
  const relativePath = imageUrl.replace(/^\/+/, "")
  const filepath = path.join(process.cwd(), "public", relativePath)
  if (existsSync(filepath)) {
    await unlink(filepath)
  }
}

/**
 * Mem-parsing JSON string opsi pilihan ganda dari FormData.
 */
export function parseChoicesJson(rawChoices: FormDataEntryValue | null): unknown {
  if (typeof rawChoices !== "string") return null
  try {
    return JSON.parse(rawChoices)
  } catch {
    return null
  }
}
