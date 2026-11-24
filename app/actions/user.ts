"use server"

import prisma from "@/lib/prisma"
import { Prisma, Role } from "@prisma/client"
import { revalidatePath } from "next/cache"

// CREATE: Tambah User (Internal, Pengawas, PIC, dll)
export async function createUser(formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string
  const role = formData.get("role") as Role
  const departmentId = formData.get("departmentId") as string

  if (!username || !password || !fullName || !role) {
    return { error: "Semua kolom wajib diisi" }
  }

  try {
    // 1. Buat kerangka datanya terlebih dahulu
    const userData: Prisma.UserUncheckedCreateInput = {
      username,
      password, // Ingat: di production, password ini wajib di-hash (misal pakai bcrypt)
      full_name: fullName,
      role,
    }

    // 2. Jika user memilih departemen (nilainya tidak kosong), baru kita masukkan ke dalam kerangka
    if (departmentId) {
      userData.departmentId = departmentId
    }

    // 3. Simpan ke database
    await prisma.user.create({
      data: userData
    })

    revalidatePath("/she/users")
    return { success: true }
  } catch {
    return { error: "Gagal menyimpan user. Username mungkin sudah digunakan." }
  }
}

// READ: Ambil semua data User beserta relasi Departemennya
export async function getUsers() {
  try {
    return await prisma.user.findMany({
      include: { department: true },
      orderBy: { id: 'desc' }
    })
  } catch {
    return []
  }
}

// DELETE: Hapus User
export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({
      where: { id }
    })
    revalidatePath("/she/users")
    return { success: true }
  } catch {
    return { error: "Gagal menghapus user" }
  }
}

