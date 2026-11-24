import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { verifyPermitSchema } from "@/lib/validations/permit"

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
    const body = await req.json()
    const parsed = verifyPermitSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Payload verifikasi tidak valid" },
        { status: 400 }
      )
    }

    const permit = await prisma.permit.findUnique({ where: { id } })
    if (!permit) {
      return NextResponse.json({ error: "Permit tidak ditemukan" }, { status: 404 })
    }

    const { action, decision, remark } = parsed.data
    const cleanRemark = remark?.trim() || null

    if (action === "verify-pic-initial") {
      if (session.user.role !== "PIC") {
        return NextResponse.json(
          { error: "Hanya akun dengan role PIC yang dapat melakukan verifikasi awal" },
          { status: 403 }
        )
      }

      if (permit.picId !== session.user.id) {
        return NextResponse.json(
          { error: "Anda bukan PIC Area yang ditugaskan untuk permit ini" },
          { status: 403 }
        )
      }

      if (permit.status !== "PENDING" || permit.picVerified !== null) {
        return NextResponse.json(
          { error: "Permit ini sudah melewati tahap verifikasi awal PIC" },
          { status: 400 }
        )
      }

      const isApproved = decision === "approve"
      const updated = await prisma.permit.update({
        where: { id },
        data: {
          picVerified: isApproved,
          picVerifiedAt: new Date(),
          remarkPic: cleanRemark,
          ...(isApproved ? {} : { status: "REJECTED" }),
        },
        include: {
          vendor: { select: { id: true, name: true } },
          pic: { select: { id: true, full_name: true } },
        },
      })

      return NextResponse.json({
        message: isApproved
          ? "Verifikasi awal PIC disetujui. Vendor dapat mulai melengkapi berkas."
          : "Permohonan permit ditolak pada tahap verifikasi awal PIC.",
        permit: updated,
      })
    }

    if (action === "verify-lp") {
      if (session.user.role !== "LP") {
        return NextResponse.json(
          { error: "Hanya akun dengan role LP yang dapat melakukan verifikasi aspek legal/PO" },
          { status: 403 }
        )
      }

      if (!permit.poNumber) {
        return NextResponse.json(
          { error: "Permit ini tidak memiliki Nomor PO (alur verifikasi LP hanya untuk permit berbasis PO)" },
          { status: 400 }
        )
      }

      if (permit.picVerified !== true) {
        return NextResponse.json(
          { error: "Permit ini belum disetujui pada tahap verifikasi awal PIC" },
          { status: 400 }
        )
      }

      if (permit.status !== "PENDING" || permit.lpVerified !== null) {
        return NextResponse.json(
          { error: "Permit ini sudah diverifikasi oleh LP atau tidak berstatus PENDING" },
          { status: 400 }
        )
      }

      const isApproved = decision === "approve"
      const updated = await prisma.permit.update({
        where: { id },
        data: {
          lpVerified: isApproved,
          lpVerifiedAt: new Date(),
          remarkLp: cleanRemark,
          ...(isApproved ? {} : { status: "REJECTED" }),
        },
        include: {
          vendor: { select: { id: true, name: true } },
          pic: { select: { id: true, full_name: true } },
          user: { select: { id: true, full_name: true } },
        },
      })

      return NextResponse.json({
        message: isApproved
          ? "Verifikasi aspek PO oleh LP berhasil disetujui. Berkas diteruskan ke tahap persetujuan SHE."
          : "Permohonan permit ditolak pada tahap verifikasi aspek legal & PO oleh LP.",
        permit: updated,
      })
    }

    if (action === "verify-user") {
      if (session.user.role !== "PIC") {
        return NextResponse.json(
          { error: "Hanya akun dengan role PIC yang dapat melakukan verifikasi teknis SPK" },
          { status: 403 }
        )
      }

      if (permit.picId !== session.user.id) {
        return NextResponse.json(
          { error: "Anda bukan PIC Area yang ditugaskan untuk permit ini" },
          { status: 403 }
        )
      }

      if (permit.poNumber) {
        return NextResponse.json(
          { error: "Permit ini berbasis PO (alur verifikasi tahap kedua dilakukan oleh LP)" },
          { status: 400 }
        )
      }

      if (permit.picVerified !== true) {
        return NextResponse.json(
          { error: "Permit ini belum disetujui pada tahap verifikasi awal PIC" },
          { status: 400 }
        )
      }

      if (permit.status !== "PENDING" || permit.userVerified !== null) {
        return NextResponse.json(
          { error: "Permit ini sudah diverifikasi akhir oleh PIC atau tidak berstatus PENDING" },
          { status: 400 }
        )
      }

      const isApproved = decision === "approve"
      const updated = await prisma.permit.update({
        where: { id },
        data: {
          userVerified: isApproved,
          userVerifiedAt: new Date(),
          remarkUser: cleanRemark,
          ...(isApproved ? {} : { status: "REJECTED" }),
        },
        include: {
          vendor: { select: { id: true, name: true } },
          pic: { select: { id: true, full_name: true } },
          user: { select: { id: true, full_name: true } },
        },
      })

      return NextResponse.json({
        message: isApproved
          ? "Verifikasi teknis akhir (SPK) oleh PIC disetujui. Berkas diteruskan ke tahap persetujuan SHE."
          : "Permohonan permit tipe SPK ditolak pada tahap verifikasi teknis akhir oleh PIC.",
        permit: updated,
      })
    }

    if (action === "verify-she") {
      if (session.user.role !== "SHE") {
        return NextResponse.json(
          { error: "Hanya akun dengan role SHE yang berwenang melakukan persetujuan akhir permit" },
          { status: 403 }
        )
      }

      if (permit.status !== "PENDING") {
        return NextResponse.json(
          { error: "Permit ini tidak dalam status PENDING untuk diverifikasi" },
          { status: 400 }
        )
      }

      // Verifikasi kelengkapan prasyarat alur verifikasi
      if (permit.poNumber) {
        if (permit.picVerified !== true || permit.lpVerified !== true) {
          return NextResponse.json(
            { error: "Permit alur PO harus disetujui terlebih dahulu oleh PIC dan LP sebelum persetujuan SHE" },
            { status: 400 }
          )
        }
      } else {
        if (permit.picVerified !== true || permit.userVerified !== true) {
          return NextResponse.json(
            { error: "Permit alur SPK harus lolos verifikasi awal dan verifikasi teknis PIC sebelum persetujuan SHE" },
            { status: 400 }
          )
        }
      }

      const isApproved = decision === "approve"
      const isHighRiskDecision = isApproved ? Boolean(parsed.data.isHighRisk) : permit.isHighRisk

      const updated = await prisma.permit.update({
        where: { id },
        data: {
          status: isApproved ? "OPEN" : "REJECTED",
          isHighRisk: isHighRiskDecision,
          sheVerifiedAt: new Date(),
          remarkShe: cleanRemark,
        },
        include: {
          vendor: { select: { id: true, name: true } },
          pic: { select: { id: true, full_name: true } },
          user: { select: { id: true, full_name: true } },
        },
      })

      return NextResponse.json({
        message: isApproved
          ? `Permit berhasil disetujui penuh oleh SHE (Status: OPEN). Kategori: ${
              isHighRiskDecision ? "Risiko Tinggi (High Risk)" : "Risiko Standar"
            }. Izin kerja siap diberlakukan.`
          : "Permohonan permit kerja ditolak oleh SHE.",
        permit: updated,
      })
    }

    return NextResponse.json({ error: "Aksi verifikasi tidak dikenali" }, { status: 400 })
  } catch (error) {
    console.error("POST /api/permits/[id]/verify error:", error)
    return NextResponse.json(
      { error: "Gagal memproses verifikasi permit" },
      { status: 500 }
    )
  }
}
