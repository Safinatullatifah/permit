import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { mkdir, writeFile } from "fs/promises"
import path from "path"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const title = formData.get("title")

    if (!(file instanceof File) || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "File dan judul wajib diisi" }, { status: 400 })
    }

    // Ubah file menjadi buffer agar bisa disimpan oleh Node.js
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Pastikan direktori public/uploads ada
    const uploadDir = path.join(process.cwd(), "public/uploads")
    await mkdir(uploadDir, { recursive: true })

    // Buat nama file unik (mencegah bentrok jika nama file sama)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const filename = uniqueSuffix + '-' + path.basename(file.name).replace(/\s+/g, '_')
    const filepath = path.join(uploadDir, filename)

    // Simpan file ke folder public/uploads
    await writeFile(filepath, buffer)

    // Tentukan jenis file berdasarkan MIME type
    const fileType = file.type.includes("video") ? "VIDEO" : "PDF"
    const fileUrl = `/uploads/${filename}`

    // Simpan data metadata ke database
    await prisma.k3Material.create({
      data: {
        title: title.trim(),
        fileUrl,
        fileType,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error upload:", error)
    return NextResponse.json({ error: "Gagal mengunggah file" }, { status: 500 })
  }
}