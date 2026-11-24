import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { jsaPayloadSchema } from "@/lib/validations/jsa"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params

    const permit = await prisma.permit.findUnique({
      where: { id },
      include: {
        vendor: { select: { id: true, name: true, email: true, phone: true } },
        pic: { select: { id: true, full_name: true } },
        user: { select: { id: true, full_name: true } },
      },
    })

    if (!permit) {
      return NextResponse.json({ error: "Permit tidak ditemukan" }, { status: 404 })
    }

    const [jsa, availableElectrical] = await Promise.all([
      prisma.jobSafetyAnalysis.findUnique({
        where: { permitId: id },
        include: {
          tahapan: {
            orderBy: { urutan: "asc" },
            include: {
              bahaya: {
                orderBy: { urutan: "asc" },
                include: {
                  pengendalian: {
                    orderBy: { urutan: "asc" },
                  },
                },
              },
            },
          },
          peralatan: {
            orderBy: { createdAt: "asc" },
          },
          sambungan: {
            include: {
              masterElectrical: true,
            },
          },
        },
      }),
      prisma.masterElectrical.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
    ])

    return NextResponse.json({
      permit,
      jsa,
      availableElectrical,
    })
  } catch (error) {
    console.error("GET /api/permits/[id]/jsa error:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data Job Safety Analysis" },
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
      include: { vendor: true },
    })

    if (!permit) {
      return NextResponse.json({ error: "Permit tidak ditemukan" }, { status: 404 })
    }

    // Role check: Vendor rekanan, Admin SHE, atau User internal pembuat permit
    const isVendor = session.user.role === "VENDOR"
    const isShe = session.user.role === "SHE"
    const isOwner = session.user.id === permit.userId

    if (!isVendor && !isShe && !isOwner) {
      return NextResponse.json(
        { error: "Anda tidak memiliki akses untuk mengisi atau mengubah JSA permit ini" },
        { status: 403 }
      )
    }

    // Jika akun vendor memiliki vendorId spesifik, pastikan permit ditugaskan ke vendor tersebut
    if (isVendor && session.user.vendorId && session.user.vendorId !== permit.vendorId) {
      return NextResponse.json(
        { error: "Permit ini tidak ditugaskan ke perusahaan vendor Anda" },
        { status: 403 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const parsed = jsaPayloadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Payload JSA tidak valid" },
        { status: 400 }
      )
    }

    const { isElectrical, tahapan, peralatan, electricalIds, electricalNotes } = parsed.data

    // Simpan JSA secara transaksional
    const result = await prisma.$transaction(async (tx) => {
      // 1. Upsert JSA utama
      const jsa = await tx.jobSafetyAnalysis.upsert({
        where: { permitId: id },
        create: {
          permitId: id,
          isElectrical,
        },
        update: {
          isElectrical,
        },
      })

      // 2. Bersihkan data anak sebelumnya untuk update bersih
      await tx.deskripsiPekerjaan.deleteMany({
        where: { jsaId: jsa.id },
      })
      await tx.peralatan.deleteMany({
        where: { jsaId: jsa.id },
      })
      await tx.jSASambungan.deleteMany({
        where: { jsaId: jsa.id },
      })

      // 3. Simpan Pohon Analisis Bahaya (Tahapan -> Bahaya -> Pengendalian)
      for (let tIdx = 0; tIdx < tahapan.length; tIdx++) {
        const t = tahapan[tIdx]
        const createdTahapan = await tx.deskripsiPekerjaan.create({
          data: {
            jsaId: jsa.id,
            text: t.text.trim(),
            urutan: tIdx + 1,
          },
        })

        for (let bIdx = 0; bIdx < t.bahaya.length; bIdx++) {
          const b = t.bahaya[bIdx]
          const createdBahaya = await tx.bahaya.create({
            data: {
              deskripsiId: createdTahapan.id,
              text: b.text.trim(),
              urutan: bIdx + 1,
            },
          })

          for (let pIdx = 0; pIdx < b.pengendalian.length; pIdx++) {
            const p = b.pengendalian[pIdx]
            await tx.pengendalian.create({
              data: {
                bahayaId: createdBahaya.id,
                text: p.text.trim(),
                urutan: pIdx + 1,
              },
            })
          }
        }
      }

      // 4. Simpan Daftar Peralatan Kerja yang dibawa vendor
      if (peralatan.length > 0) {
        await tx.peralatan.createMany({
          data: peralatan.map((alat) => ({
            jsaId: jsa.id,
            nama: alat.nama.trim(),
            itemSafety: alat.itemSafety?.trim() || null,
            jumlah: Number(alat.jumlah) || 1,
            imageUrl: alat.imageUrl?.trim() || null,
          })),
        })
      }

      // 5. Simpan Sambungan Elektrikal jika isElectrical === true
      if (isElectrical && electricalIds.length > 0) {
        await tx.jSASambungan.createMany({
          data: electricalIds.map((elecId) => ({
            jsaId: jsa.id,
            masterElectricalId: elecId,
            notes: electricalNotes?.trim() || null,
          })),
        })
      }

      return jsa
    })

    return NextResponse.json({
      message: "Job Safety Analysis (JSA) berhasil disimpan!",
      jsaId: result.id,
    })
  } catch (error) {
    console.error("POST /api/permits/[id]/jsa error:", error)
    return NextResponse.json(
      { error: "Gagal menyimpan Job Safety Analysis" },
      { status: 500 }
    )
  }
}
