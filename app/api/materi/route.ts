import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const title = formData.get("title");

    if (!(file instanceof File) || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "File dan judul wajib diisi" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Amankan nama file dari spasi dan karakter aneh
    const safeName = path.basename(file.name).replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${Date.now()}-${safeName}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "materi");

    // Buat folder jika belum ada
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const fileUrl = `/uploads/materi/${filename}`;

    const materi = await prisma.materi.create({
      data: {
        title: title.trim(),
        fileUrl,
        fileType: file.type, // contoh: application/pdf, video/mp4
      },
    });

    return NextResponse.json({ message: "Materi berhasil diunggah", materi }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Gagal mengunggah materi" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const materi = await prisma.materi.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(materi);
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data materi" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });

    const materi = await prisma.materi.findUnique({ where: { id } });
    if (materi) {
      // Hapus file fisik dari public folder
      const filepath = path.join(process.cwd(), "public", materi.fileUrl.replace(/^\/+/, ""));
      if (existsSync(filepath)) {
        await unlink(filepath);
      }
      // Hapus data dari database
      await prisma.materi.delete({ where: { id } });
    }

    return NextResponse.json({ message: "Materi berhasil dihapus" });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Gagal menghapus materi" }, { status: 500 });
  }
}