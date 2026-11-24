import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getPaginatedPermits } from "@/lib/queries/permits"
import { createPermitSchema } from "@/lib/validations/permit"
import { Prisma } from "@prisma/client"

/**
 * Menghasilkan nomor permit berurutan harian dengan format WP-YYYYMMDD-XXXX.
 */
async function generatePermitNumber(): Promise<string> {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, "0")
  const dd = String(now.getDate()).padStart(2, "0")
  const prefix = `WP-${yyyy}${mm}${dd}-`

  const latestPermit = await prisma.permit.findFirst({
    where: { nomor: { startsWith: prefix } },
    orderBy: { nomor: "desc" },
    select: { nomor: true },
  })

  let nextSeq = 1
  if (latestPermit?.nomor) {
    const seqPart = latestPermit.nomor.slice(prefix.length)
    const parsedSeq = Number.parseInt(seqPart, 10)
    if (!Number.isNaN(parsedSeq)) {
      nextSeq = parsedSeq + 1
    }
  }

  return `${prefix}${String(nextSeq).padStart(4, "0")}`
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const result = await getPaginatedPermits({
      tab: searchParams.get("tab") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortOrder: searchParams.get("sortOrder") ?? undefined,
      userId: session.user.id,
      role: session.user.role,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("GET /api/permits error:", error)
    return NextResponse.json(
      { error: "Gagal mengambil daftar permit" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = createPermitSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Data permohonan permit tidak valid",
          issues: parsed.error.issues,
        },
        { status: 400 }
      )
    }

    const {
      workName,
      location,
      startDate,
      endDate,
      vendorId,
      picId,
      pengawasId,
      poNumber,
      spkNumber,
    } = parsed.data

    const [vendor, picUser] = await Promise.all([
      prisma.vendor.findUnique({ where: { id: vendorId }, select: { id: true } }),
      prisma.user.findUnique({ where: { id: picId }, select: { id: true } }),
    ])

    if (!vendor) {
      return NextResponse.json({ error: "Vendor yang dipilih tidak ditemukan" }, { status: 400 })
    }
    if (!picUser) {
      return NextResponse.json({ error: "PIC Area yang dipilih tidak ditemukan" }, { status: 400 })
    }

    const cleanPo = poNumber?.trim() || null
    const cleanSpk = spkNumber?.trim() || null

    // Retry jika terjadi bentrok nomor unik pada request bersamaan
    for (let attempt = 0; attempt < 3; attempt++) {
      const nomor = await generatePermitNumber()
      try {
        const permit = await prisma.permit.create({
          data: {
            nomor,
            workName,
            location,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            userId: session.user.id,
            vendorId,
            picId,
            pengawasId,
            poNumber: cleanPo,
            spkNumber: cleanSpk,
            status: "PENDING",
          },
          include: {
            vendor: true,
            pic: { select: { id: true, full_name: true } },
            user: { select: { id: true, full_name: true } },
          },
        })

        return NextResponse.json(
          { message: "Permohonan permit berhasil dibuat", permit },
          { status: 201 }
        )
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002" &&
          attempt < 2
        ) {
          continue
        }
        throw err
      }
    }

    return NextResponse.json(
      { error: "Gagal menghasilkan nomor permit unik" },
      { status: 500 }
    )
  } catch (error) {
    console.error("POST /api/permits error:", error)
    return NextResponse.json(
      { error: "Gagal membuat permohonan permit" },
      { status: 500 }
    )
  }
}
