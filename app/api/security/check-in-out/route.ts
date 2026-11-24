import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { memberId, action, catatan } = body as {
      memberId: string;
      action: "CHECK_IN" | "CHECK_OUT";
      catatan?: string;
    };

    if (!memberId || !action || !["CHECK_IN", "CHECK_OUT"].includes(action)) {
      return NextResponse.json(
        { message: "Parameter tidak lengkap atau tidak valid" },
        { status: 400 }
      );
    }

    const member = await prisma.memberPermit.findUnique({
      where: { id: memberId },
      include: {
        records: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { message: "Data pekerja tidak ditemukan" },
        { status: 404 }
      );
    }

    const latestRecord = member.records[0] || null;
    const now = new Date();

    if (action === "CHECK_IN") {
      // Check if already checked in and hasn't checked out
      if (latestRecord && latestRecord.jamMasuk && !latestRecord.jamKeluar) {
        return NextResponse.json(
          {
            message: `Pekerja ${member.name} sudah tercatat Check-In pada ${new Date(
              latestRecord.jamMasuk
            ).toLocaleTimeString("id-ID")}`,
            record: latestRecord,
            presenceStatus: "INSIDE",
          },
          { status: 400 }
        );
      }

      const newRecord = await prisma.memberRecord.create({
        data: {
          memberId,
          jamMasuk: now,
          catatan: catatan || "Check-in via Security Gate QR Scanner",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Berhasil Check-In: ${member.name} masuk pabrik pada ${now.toLocaleTimeString("id-ID")}`,
        record: newRecord,
        presenceStatus: "INSIDE",
      });
    } else {
      // CHECK_OUT
      if (latestRecord && latestRecord.jamMasuk && !latestRecord.jamKeluar) {
        // Close the active record
        const updatedRecord = await prisma.memberRecord.update({
          where: { id: latestRecord.id },
          data: {
            jamKeluar: now,
            catatan: catatan
              ? `${latestRecord.catatan || ""} | Out note: ${catatan}`
              : latestRecord.catatan,
          },
        });

        return NextResponse.json({
          success: true,
          message: `Berhasil Check-Out: ${member.name} keluar pabrik pada ${now.toLocaleTimeString("id-ID")}`,
          record: updatedRecord,
          presenceStatus: "CHECKED_OUT",
        });
      } else {
        // No open record found, create a direct check-out record
        const directOutRecord = await prisma.memberRecord.create({
          data: {
            memberId,
            jamKeluar: now,
            catatan: catatan || "Check-out langsung dari gerbang",
          },
        });

        return NextResponse.json({
          success: true,
          message: `Berhasil Check-Out: ${member.name} tercatat keluar pabrik pada ${now.toLocaleTimeString("id-ID")}`,
          record: directOutRecord,
          presenceStatus: "CHECKED_OUT",
        });
      }
    }
  } catch (error) {
    console.error("POST /api/security/check-in-out error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat memproses presensi gerbang" },
      { status: 500 }
    );
  }
}
