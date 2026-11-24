import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { saveBorrowedEquipmentPayloadSchema } from "@/lib/validations/borrowed-item"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params

    const permit = await prisma.permit.findUnique({
      where: { id },
      include: {
        vendor: { select: { id: true, name: true } },
        pic: { select: { id: true, full_name: true } },
        user: { select: { id: true, full_name: true } },
      },
    })

    if (!permit) {
      return NextResponse.json({ error: "Permit tidak ditemukan" }, { status: 404 })
    }

    const [masterBorrowedItems, currentPinjam, currentMaterial] = await Promise.all([
      prisma.masterBorrowedItem.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.pinjamEquipment.findMany({
        where: { permitId: id },
        include: {
          barang: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.barangBawaan.findMany({
        where: { permitId: id },
        orderBy: { createdAt: "asc" },
      }),
    ])

    return NextResponse.json({
      permit,
      masterBorrowedItems,
      currentPinjam,
      currentMaterial,
    })
  } catch (error) {
    console.error("GET /api/permits/[id]/borrowed-equipment error:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data peminjaman peralatan K3" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const permit = await prisma.permit.findUnique({
      where: { id },
    })

    if (!permit) {
      return NextResponse.json({ error: "Permit tidak ditemukan" }, { status: 404 })
    }

    const isVendor = session.user.role === "VENDOR"
    const isShe = session.user.role === "SHE"
    const isOwner = session.user.id === permit.userId

    if (!isVendor && !isShe && !isOwner) {
      return NextResponse.json(
        { error: "Anda tidak memiliki wewenang untuk mengajukan peminjaman alat pada permit ini" },
        { status: 403 }
      )
    }

    if (isVendor && session.user.vendorId && session.user.vendorId !== permit.vendorId) {
      return NextResponse.json(
        { error: "Permit ini tidak ditugaskan ke vendor Anda" },
        { status: 403 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const parsed = saveBorrowedEquipmentPayloadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Payload peminjaman tidak valid" },
        { status: 400 }
      )
    }

    const { equipment, materialBawaan } = parsed.data

    await prisma.$transaction(async (tx) => {
      // 1. Bersihkan permohonan peminjaman sebelumnya
      await tx.pinjamEquipment.deleteMany({
        where: { permitId: id },
      })

      // 2. Bersihkan daftar barang bawaan sebelumnya
      await tx.barangBawaan.deleteMany({
        where: { permitId: id },
      })

      // 3. Simpan pengajuan peminjaman alat K3 pabrik
      if (equipment.length > 0) {
        await tx.pinjamEquipment.createMany({
          data: equipment.map((item) => ({
            permitId: id,
            barangId: item.barangId,
            jumlah: Number(item.jumlah) || 1,
            catatan: item.catatan?.trim() || null,
            status: "PENDING",
          })),
        })
      }

      // 4. Simpan daftar material/barang bawaan vendor
      if (materialBawaan.length > 0) {
        await tx.barangBawaan.createMany({
          data: materialBawaan.map((mat) => ({
            permitId: id,
            nama: mat.nama.trim(),
            jumlah: Number(mat.jumlah) || 1,
            satuan: mat.satuan?.trim() || "unit",
            catatan: mat.catatan?.trim() || null,
          })),
        })
      }
    })

    return NextResponse.json({
      message: "Daftar peminjaman alat K3 pabrik dan material bawaan berhasil disimpan!",
    })
  } catch (error) {
    console.error("POST /api/permits/[id]/borrowed-equipment error:", error)
    return NextResponse.json(
      { error: "Gagal memproses peminjaman alat K3" },
      { status: 500 }
    )
  }
}
