import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendorId");
    const location = searchParams.get("location");
    const search = searchParams.get("search");

    // Query active records (jamMasuk exists and jamKeluar is null)
    const activeRecords = await prisma.memberRecord.findMany({
      where: {
        jamMasuk: { not: null },
        jamKeluar: null,
        member: {
          name: search ? { contains: search, mode: "insensitive" } : undefined,
          permit: {
            vendorId: vendorId ? vendorId : undefined,
            location: location ? { contains: location, mode: "insensitive" } : undefined,
          },
        },
      },
      include: {
        member: {
          include: {
            permit: {
              include: {
                vendor: { select: { id: true, name: true } },
                pic: { select: { id: true, full_name: true } },
              },
            },
            certificate: {
              select: { nomor: true, isValid: true, expiredAt: true },
            },
          },
        },
      },
      orderBy: { jamMasuk: "desc" },
    });

    // Grouping stats
    const vendorCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};

    activeRecords.forEach((rec) => {
      const vName = rec.member.permit.vendor.name;
      const loc = rec.member.permit.location;
      vendorCounts[vName] = (vendorCounts[vName] || 0) + 1;
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    });

    const formattedList = activeRecords.map((rec) => {
      const entryTime = rec.jamMasuk ? new Date(rec.jamMasuk) : new Date(rec.createdAt);
      const diffMs = Math.max(0, new Date().getTime() - entryTime.getTime());
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      return {
        recordId: rec.id,
        memberId: rec.member.id,
        name: rec.member.name,
        idCardNumber: rec.member.idCardNumber,
        position: rec.member.position,
        phone: rec.member.phone,
        isHealthy: rec.member.isHealthy,
        permitId: rec.member.permit.id,
        permitNomor: rec.member.permit.nomor,
        workName: rec.member.permit.workName,
        location: rec.member.permit.location,
        isHighRisk: rec.member.permit.isHighRisk,
        vendorId: rec.member.permit.vendor.id,
        vendorName: rec.member.permit.vendor.name,
        picName: rec.member.permit.pic?.full_name || "-",
        certNomor: rec.member.certificate?.nomor || "-",
        jamMasuk: entryTime.toISOString(),
        durationHours: hours,
        durationMinutes: minutes,
        durationText: `${hours} jam ${minutes} menit`,
        isOvertime: hours >= 8, // More than 8 hours inside
        catatan: rec.catatan,
      };
    });

    return NextResponse.json({
      activeWorkers: formattedList,
      totalActive: formattedList.length,
      vendorCounts,
      locationCounts,
    });
  } catch (error) {
    console.error("GET /api/security/monitoring error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan internal saat mengambil data monitoring" },
      { status: 500 }
    );
  }
}

// POST endpoint for quick check-out (single or batch)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { recordIds, catatan } = body as {
      recordIds: string[];
      catatan?: string;
    };

    if (!Array.isArray(recordIds) || recordIds.length === 0) {
      return NextResponse.json(
        { message: "Pilih minimal 1 record presensi pekerja" },
        { status: 400 }
      );
    }

    const now = new Date();

    const updated = await prisma.memberRecord.updateMany({
      where: {
        id: { in: recordIds },
        jamKeluar: null,
      },
      data: {
        jamKeluar: now,
        catatan: catatan
          ? `Check-out cepat via Monitoring: ${catatan}`
          : "Check-out cepat via Live Monitoring Dashboard",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil mencatat Check-Out untuk ${updated.count} pekerja`,
      count: updated.count,
    });
  } catch (error) {
    console.error("POST /api/security/monitoring error:", error);
    return NextResponse.json(
      { message: "Gagal memproses check-out cepat" },
      { status: 500 }
    );
  }
}
