import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { saveSpecialPermitsPayloadSchema } from "@/lib/validations/special-permit"

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

    const [
      masterSpecialPermits,
      masterWorkTypes,
      masterApd,
      masterSafetyChecks,
      currentSpecialPermits,
      currentApd,
    ] = await Promise.all([
      prisma.specialPermit.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.workType.findMany({
        where: { isActive: true },
        include: {
          subWorkTypes: {
            where: { isActive: true },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.masterApd.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.masterSafetyCheck.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.permitKhusus.findMany({
        where: { permitId: id },
        include: {
          checks: {
            include: {
              masterSafetyCheck: true,
            },
          },
        },
      }),
      prisma.daftarApd.findMany({
        where: { permitId: id },
        include: {
          masterApd: true,
        },
      }),
    ])

    return NextResponse.json({
      permit,
      masterSpecialPermits,
      masterWorkTypes,
      masterApd,
      masterSafetyChecks,
      currentSpecialPermits,
      currentApd,
    })
  } catch (error) {
    console.error("GET /api/permits/[id]/special-permits error:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data Permit Khusus dan APD" },
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
        { error: "Anda tidak memiliki wewenang untuk mengisi berkas izin khusus permit ini" },
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
    const parsed = saveSpecialPermitsPayloadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Payload tidak valid" },
        { status: 400 }
      )
    }

    const { specialPermits, apdIds, customApds } = parsed.data

    await prisma.$transaction(async (tx) => {
      // 1. Bersihkan PermitKhusus lama (otomatis cascading delete ke DaftarCheck)
      await tx.permitKhusus.deleteMany({
        where: { permitId: id },
      })

      // 2. Bersihkan DaftarApd lama
      await tx.daftarApd.deleteMany({
        where: { permitId: id },
      })

      // 3. Simpan PermitKhusus baru beserta checks
      for (const sp of specialPermits) {
        await tx.permitKhusus.create({
          data: {
            permitId: id,
            specialPermitId: sp.specialPermitId,
            workTypeId: sp.workTypeId || null,
            subWorkTypeId: sp.subWorkTypeId || null,
            informasiLain: sp.informasiLain || null,
            checks: {
              create: sp.checks.map((chk) => ({
                masterSafetyCheckId: chk.masterSafetyCheckId,
                status: chk.status,
                notes: chk.notes || null,
                documentPath: chk.documentPath || null,
              })),
            },
          },
        })
      }

      // 4. Simpan DaftarApd dari katalog
      if (apdIds.length > 0) {
        await tx.daftarApd.createMany({
          data: apdIds.map((apdId) => ({
            permitId: id,
            masterApdId: apdId,
          })),
        })
      }

      // 5. Simpan custom APDs jika ada
      if (customApds && customApds.length > 0) {
        // Ambil salah satu masterApd sebagai placeholder id atau simpan customName
        const fallbackApd = await tx.masterApd.findFirst({ where: { isActive: true } })
        if (fallbackApd) {
          for (const customName of customApds) {
            if (customName.trim()) {
              await tx.daftarApd.create({
                data: {
                  permitId: id,
                  masterApdId: fallbackApd.id,
                  customName: customName.trim(),
                },
              }).catch(() => null) // abaikan duplikasi jika ada
            }
          }
        }
      }
    })

    return NextResponse.json({
      message: "Checklist Permit Khusus, Cek Keselamatan, dan APD berhasil disimpan!",
    })
  } catch (error) {
    console.error("POST /api/permits/[id]/special-permits error:", error)
    return NextResponse.json(
      { error: "Gagal menyimpan berkas Permit Khusus dan APD" },
      { status: 500 }
    )
  }
}
