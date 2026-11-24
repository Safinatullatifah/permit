import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { reapprovePermitSchema } from "@/lib/validations/permit"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const body = await req.json().catch(() => ({}))
    const parsed = reapprovePermitSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Payload revisi permit tidak valid" },
        { status: 400 }
      )
    }

    const permit = await prisma.permit.findUnique({
      where: { id },
    })

    if (!permit) {
      return NextResponse.json({ error: "Permit tidak ditemukan" }, { status: 404 })
    }

    // Hanya pemohon permit (USER) atau Admin SHE yang berwenang mengajukan ulang permit yang ditolak
    const isOwner = permit.userId === session.user.id
    const isShe = session.user.role === "SHE"
    if (!isOwner && !isShe) {
      return NextResponse.json(
        { error: "Anda tidak memiliki wewenang untuk mengajukan ulang permit ini" },
        { status: 403 }
      )
    }

    if (permit.status !== "REJECTED") {
      return NextResponse.json(
        { error: "Hanya permit dengan status REJECTED yang dapat diajukan ulang (Re-Approve)" },
        { status: 400 }
      )
    }

    const {
      workName,
      location,
      startDate,
      endDate,
      poNumber,
      spkNumber,
    } = parsed.data

    // Validasi bahwa minimal salah satu PO atau SPK tetap tersedia
    const finalPo = poNumber !== undefined ? (poNumber?.trim() || null) : permit.poNumber
    const finalSpk = spkNumber !== undefined ? (spkNumber?.trim() || null) : permit.spkNumber

    if (!finalPo && !finalSpk) {
      return NextResponse.json(
        { error: "Permit wajib memiliki minimal salah satu: Nomor PO atau Nomor SPK" },
        { status: 400 }
      )
    }

    // Reset status permit menjadi PENDING dan bersihkan kolom verifikasi sebelumnya
    const updated = await prisma.permit.update({
      where: { id },
      data: {
        status: "PENDING",
        workName: workName?.trim() || permit.workName,
        location: location?.trim() || permit.location,
        startDate: startDate ? new Date(startDate) : permit.startDate,
        endDate: endDate ? new Date(endDate) : permit.endDate,
        poNumber: finalPo,
        spkNumber: finalSpk,
        // Reset seluruh verifikasi ke awal alur
        picVerified: null,
        picVerifiedAt: null,
        remarkPic: null,
        lpVerified: null,
        lpVerifiedAt: null,
        remarkLp: null,
        userVerified: null,
        userVerifiedAt: null,
        remarkUser: null,
        sheVerifiedAt: null,
        remarkShe: null,
      },
      include: {
        vendor: { select: { id: true, name: true } },
        pic: { select: { id: true, full_name: true } },
        user: { select: { id: true, full_name: true } },
      },
    })

    return NextResponse.json({
      message: `Permit ${updated.nomor} berhasil diajukan ulang (Re-Approve). Status dikembalikan ke PENDING dan riwayat verifikasi di-reset untuk memulai alur review kembali.`,
      permit: updated,
    })
  } catch (error) {
    console.error("POST /api/permits/[id]/reapprove error:", error)
    return NextResponse.json(
      { error: "Gagal memproses pengajuan ulang permit" },
      { status: 500 }
    )
  }
}
