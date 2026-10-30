"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// CREATE: Tambah departemen baru
export async function createDepartment(formData: FormData) {
  const name = formData.get("name") as string
  
  if (!name) return { error: "Nama departemen wajib diisi" }

  try {
    await prisma.department.create({
      data: { name }
    })
    revalidatePath("/she/master") // Refresh data di halaman master
    return { success: true }
  } catch (error) {
    return { error: "Gagal menyimpan departemen" }
  }
}

// READ: Ambil semua data departemen
export async function getDepartments() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return departments
  } catch (error) {
    return []
  }
}

// DELETE: Hapus departemen (atau set non-aktif)
export async function deleteDepartment(id: string) {
  try {
    await prisma.department.delete({
      where: { id }
    })
    revalidatePath("/she/master")
    return { success: true }
  } catch (error) {
    return { error: "Gagal menghapus departemen" }
  }
}