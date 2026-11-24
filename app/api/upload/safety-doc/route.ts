import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file")

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "File dokumen wajib diunggah" }, { status: 400 })
    }

    // Maksimal 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran berkas maksimal 10 MB" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const safeName = path.basename(file.name).replace(/[^a-zA-Z0-9.-]/g, "_")
    const filename = `${Date.now()}-${safeName}`
    const uploadDir = path.join(process.cwd(), "public", "uploads", "safety-docs")

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    const fileUrl = `/uploads/safety-docs/${filename}`

    return NextResponse.json({
      success: true,
      message: "Dokumen bukti keselamatan berhasil diunggah",
      fileUrl,
      fileName: file.name,
    })
  } catch (error) {
    console.error("POST /api/upload/safety-doc error:", error)
    return NextResponse.json(
      { error: "Gagal mengunggah dokumen keselamatan" },
      { status: 500 }
    )
  }
}
