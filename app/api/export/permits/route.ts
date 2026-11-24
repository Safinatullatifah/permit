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
    const status = searchParams.get("status");
    const vendorId = searchParams.get("vendorId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build filter
    const whereClause: any = {};

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (session.user.role === "VENDOR" && session.user.vendorId) {
      whereClause.vendorId = session.user.vendorId;
    } else if (vendorId) {
      whereClause.vendorId = vendorId;
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Fetch permits
    const permits = await prisma.permit.findMany({
      where: whereClause,
      include: {
        vendor: { select: { id: true, name: true } },
        user: { select: { id: true, full_name: true } },
        pic: { select: { id: true, full_name: true } },
        jsa: {
          include: {
            _count: { select: { tahapan: true } },
          },
        },
        pinjamEquipment: true,
        permitKhusus: true,
        members: {
          include: {
            quizResult: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform into flat rows for Excel
    const rows = permits.map((p, idx) => {
      const passedInductionCount = p.members.filter(
        (m) => m.quizResult?.isPassed
      ).length;

      return {
        No: idx + 1,
        "Nomor Permit": p.nomor,
        "Nama Pekerjaan": p.workName,
        "Kategori Risiko": p.isHighRisk ? "HIGH RISK" : "STANDAR",
        "Vendor Pelaksana": p.vendor.name,
        "Lokasi Kerja": p.location,
        "Tanggal Mulai": new Date(p.startDate).toLocaleDateString("id-ID"),
        "Tanggal Selesai": new Date(p.endDate).toLocaleDateString("id-ID"),
        "Pemohon (User)": p.user.full_name,
        "PIC Area": p.pic.full_name,
        "Dasar Dokumen": p.poNumber ? `PO: ${p.poNumber}` : `SPK: ${p.spkNumber || "-"}`,
        "Verifikasi PIC Awal":
          p.picVerified === true ? "DISETUJUI" : p.picVerified === false ? "DITOLAK" : "MENUNGGU",
        "Verifikasi LP / SPK": p.poNumber
          ? p.lpVerified === true
            ? "DISETUJUI"
            : p.lpVerified === false
            ? "DITOLAK"
            : "MENUNGGU"
          : p.userVerified === true
          ? "DISETUJUI"
          : p.userVerified === false
          ? "DITOLAK"
          : "MENUNGGU",
        "Approval SHE":
          p.status === "OPEN"
            ? "DISETUJUI (OPEN)"
            : p.status === "REJECTED"
            ? "DITOLAK"
            : "MENUNGGU",
        "Status Permit": p.status,
        "PIC Vendor Lapangan": p.picVendor || "-",
        "Tahapan JSA": p.jsa?._count.tahapan || 0,
        "Izin Khusus": p.permitKhusus.length > 0 ? `${p.permitKhusus.length} Izin Khusus` : "Standar",
        "Alat K3 Dipinjam": p.pinjamEquipment.length,
        "Total Pekerja": p.members.length,
        "Lulus Safety Induction": `${passedInductionCount} / ${p.members.length}`,
        "Tanggal Pengajuan": new Date(p.createdAt).toLocaleDateString("id-ID"),
      };
    });

    // Create Worksheet & Workbook
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto-fit column widths
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Permit e-WP");

    // Write to buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const fileName = `Laporan_Permit_eWP_${nowStr}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("GET /api/export/permits error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat mengekspor laporan permit" },
      { status: 500 }
    );
  }
}
