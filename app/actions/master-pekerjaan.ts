"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const PATH = "/she/master-pekerjaan"

// ==========================================
// 1. MASTER PERMIT KHUSUS
// ==========================================
export async function getSpecialPermits() {
  try {
    return await prisma.specialPermit.findMany({ orderBy: { created_at: 'desc' } })
  } catch { return [] }
}

export async function createSpecialPermit(formData: FormData) {
  const name = formData.get("name") as string
  if (!name) return { error: "Nama permit wajib diisi" }
  try {
    await prisma.specialPermit.create({ data: { name } })
    revalidatePath(PATH)
  } catch { return { error: "Gagal menyimpan permit" } }
}

export async function deleteSpecialPermit(id: string) {
  await prisma.specialPermit.delete({ where: { id } })
  revalidatePath(PATH)
}

// ==========================================
// 2. MASTER JENIS PEKERJAAN
// ==========================================
export async function getWorkTypes() {
  try {
    return await prisma.workType.findMany({ orderBy: { created_at: 'desc' } })
  } catch { return [] }
}

export async function createWorkType(formData: FormData) {
  const name = formData.get("name") as string
  if (!name) return { error: "Nama jenis pekerjaan wajib diisi" }
  try {
    await prisma.workType.create({ data: { name } })
    revalidatePath(PATH)
  } catch { return { error: "Gagal menyimpan jenis pekerjaan" } }
}

export async function deleteWorkType(id: string) {
  await prisma.workType.delete({ where: { id } })
  revalidatePath(PATH)
}

// ==========================================
// 3. MASTER SUB-JENIS PEKERJAAN
// ==========================================
export async function getSubWorkTypes() {
  try {
    return await prisma.subWorkType.findMany({
      include: { workType: true },
      orderBy: { created_at: 'desc' }
    })
  } catch { return [] }
}

export async function createSubWorkType(formData: FormData) {
  const name = formData.get("name") as string
  const workTypeId = formData.get("workTypeId") as string
  
  if (!name || !workTypeId) return { error: "Semua kolom wajib diisi" }
  try {
    await prisma.subWorkType.create({
      data: {
        name,
        workType: { connect: { id: workTypeId } }
      }
    })
    revalidatePath(PATH)
  } catch { return { error: "Gagal menyimpan sub-jenis pekerjaan" } }
}

export async function deleteSubWorkType(id: string) {
  await prisma.subWorkType.delete({ where: { id } })
  revalidatePath(PATH)
}