"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const PATH = "/she/master-keselamatan"

// ==========================================
// 1. MASTER APD
// ==========================================
export async function getApds() {
  try { return await prisma.masterApd.findMany({ orderBy: { created_at: 'desc' } }) } 
  catch { return [] }
}
export async function createApd(formData: FormData) {
  const name = formData.get("name") as string
  if (!name) return { error: "Wajib diisi" }
  await prisma.masterApd.create({ data: { name } })
  revalidatePath(PATH)
}
export async function deleteApd(id: string) {
  await prisma.masterApd.delete({ where: { id } })
  revalidatePath(PATH)
}

// ==========================================
// 2. MASTER CEK KESELAMATAN
// ==========================================
export async function getSafetyChecks() {
  try { return await prisma.masterSafetyCheck.findMany({ orderBy: { created_at: 'desc' } }) } 
  catch { return [] }
}
export async function createSafetyCheck(formData: FormData) {
  const name = formData.get("name") as string
  if (!name) return { error: "Wajib diisi" }
  await prisma.masterSafetyCheck.create({ data: { name } })
  revalidatePath(PATH)
}
export async function deleteSafetyCheck(id: string) {
  await prisma.masterSafetyCheck.delete({ where: { id } })
  revalidatePath(PATH)
}

// ==========================================
// 3. MASTER BARANG PINJAM
// ==========================================
export async function getBorrowedItems() {
  try { return await prisma.masterBorrowedItem.findMany({ orderBy: { created_at: 'desc' } }) } 
  catch { return [] }
}
export async function createBorrowedItem(formData: FormData) {
  const name = formData.get("name") as string
  if (!name) return { error: "Wajib diisi" }
  await prisma.masterBorrowedItem.create({ data: { name } })
  revalidatePath(PATH)
}
export async function deleteBorrowedItem(id: string) {
  await prisma.masterBorrowedItem.delete({ where: { id } })
  revalidatePath(PATH)
}

// ==========================================
// 4. MASTER SAMBUNGAN ELEKTRIKAL
// ==========================================
export async function getElectricals() {
  try { return await prisma.masterElectrical.findMany({ orderBy: { created_at: 'desc' } }) } 
  catch { return [] }
}
export async function createElectrical(formData: FormData) {
  const name = formData.get("name") as string
  if (!name) return { error: "Wajib diisi" }
  await prisma.masterElectrical.create({ data: { name } })
  revalidatePath(PATH)
}
export async function deleteElectrical(id: string) {
  await prisma.masterElectrical.delete({ where: { id } })
  revalidatePath(PATH)
}