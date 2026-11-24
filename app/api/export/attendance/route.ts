import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendorId");
    const permitId = searchParams.get("permitId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const whereClause: any = {};

    if (session.user.role === "VENDOR" && session.user.vendorId) {
      whereClause.member = { permit: { vendorId: session.user.vendorId } };
    } else if (vendorId) {
      whereClause.member = { permit: { vendorId } };
    }

    if (permitId) {
      whereClause.member = { ...whereClause.member, permitId };
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const records = await prisma.memberRecord.findMany({
      where: whereClause,
      include: {
        member: {
          include: {
            permit: {
              include: {
                vendor: { select: { id: true, name: true } },
              },
            },
            certificate: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();

    const rows = records.map((r, idx) => {
      const entryTime = r.jamMasuk ? new Date(r.jamMasuk) : null;
      const exitTime = r.jamKeluar ? new Date(r.jamKeluar) : null;

      let durationText = "-";
      let isOvertime = false;

      if (entryTime) {
        const endTime = exitTime || now;
        const diffMs = Math.max(0, endTime.getTime() - entryTime.getTime());
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        durationText = `${hours} jam ${minutes} menit`;
        isOvertime = hours >= 8;
      }

      const presenceStatus =
        entryTime && !exitTime
          ? "SEDANG DI DALAM"
          : entryTime && exitTime
          ? "SUDAH KELUAR"
          : "LOG LAINNYA";

      return {
        No: idx + 1,
        Tanggal: entryTime
          ? entryTime.toLocaleDateString("id-ID")
          : new Date(r.createdAt).toLocaleDateString("id-ID"),
        "Nama Pekerja": r.member.name,
        "No. KTP / NIK": r.member.idCardNumber || "-",
        "Posisi / Peran": r.member.position || "Teknisi",
        "No. Telepon": r.member.phone || "-",
        "Kondisi Sehat": r.member.isHealthy ? "SEHAT" : "KURANG SEHAT",
        "Vendor Rekanan": r.member.permit.vendor.name,
        "Nomor Permit": r.member.permit.nomor,
        "Nama Pekerjaan": r.member.permit.workName,
        "Lokasi Proyek": r.member.permit.location,
        "Jam Masuk": entryTime
          ? entryTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
          : "-",
        "Jam Keluar": exitTime
          ? exitTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
          : "-",
        "Durasi di Pabrik": durationText,
        "Status Kehadiran": presenceStatus,
        "Status Lembur (>8 Jam)": isOvertime ? "LEMBUR" : "NORMAL",
        "Nomor Sertifikat K3": r.member.certificate?.nomor || "BELUM ADA",
        "Masa Berlaku K3": r.member.certificate
          ? new Date(r.member.certificate.expiredAt).toLocaleDateString("id-ID")
          : "-",
        "Catatan Gerbang": r.catatan || "-",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    const columnWidths = Object.keys(rows[0] || {}).map((key) => {
      let maxLen = key.length;
      rows.forEach((r: any) => {
        const valStr = String(r[key] || "");
        if (valStr.length > maxLen) maxLen = valStr.length;
      });
      return { wch: Math.min(Math.max(maxLen + 2, 10), 45) };
    });
    worksheet["!cols"] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Presensi Gerbang");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const fileName = `Rekap_Presensi_Pekerja_eWP_${nowStr}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("GET /api/export/attendance error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat mengekspor rekap presensi" },
      { status: 500 }
    );
  }
}
