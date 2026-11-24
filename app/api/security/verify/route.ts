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
    const { code } = body as { code: string };

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { message: "Kode QR atau nomor identitas wajib diisi" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim();

    // 1. Check if the code is a URL (e.g., http://.../induction/[permitId]/[memberId])
    let extractedMemberId: string | null = null;
    let extractedCertNumber: string | null = null;

    if (cleanCode.includes("/induction/")) {
      const parts = cleanCode.split("/induction/")[1]?.split("/");
      if (parts && parts.length >= 2) {
        extractedMemberId = parts[1].split("?")[0].split("#")[0];
      }
    } else if (cleanCode.includes("/verify-certificate/")) {
      const parts = cleanCode.split("/verify-certificate/")[1]?.split("/");
      if (parts && parts.length >= 1) {
        extractedCertNumber = parts[0].split("?")[0].split("#")[0];
      }
    } else if (cleanCode.startsWith("CERT-")) {
      extractedCertNumber = cleanCode;
    }

    // 2. Query member based on extracted or direct codes
    const member = await prisma.memberPermit.findFirst({
      where: {
        OR: [
          extractedMemberId ? { id: extractedMemberId } : { id: cleanCode },
          extractedCertNumber ? { certificate: { nomor: extractedCertNumber } } : undefined,
          { certificate: { nomor: cleanCode } },
          { idCardNumber: cleanCode },
        ].filter(Boolean) as any,
      },
      include: {
        permit: {
          include: {
            vendor: { select: { id: true, name: true } },
            pic: { select: { id: true, full_name: true } },
            user: { select: { id: true, full_name: true } },
          },
        },
        certificate: true,
        quizResult: true,
        records: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          message: "Data pekerja atau sertifikat K3 tidak ditemukan dalam sistem",
        },
        { status: 404 }
      );
    }

    // 3. Automated 3-Point Safety Validation
    const now = new Date();
    const issues: string[] = [];

    // Check 1: Permit Status
    const isPermitOpen = member.permit.status === "OPEN";
    if (!isPermitOpen) {
      issues.push(`Izin kerja (${member.permit.nomor}) berstatus "${member.permit.status}" (belum OPEN/aktif)`);
    }

    // Check 2: Certificate Validity & Expiry
    const hasCertificate = !!member.certificate;
    const isCertValid = member.certificate?.isValid === true;
    const isCertNotExpired = member.certificate ? new Date(member.certificate.expiredAt) > now : false;

    if (!hasCertificate) {
      issues.push("Pekerja belum memiliki e-Sertifikat Safety Induction K3");
    } else if (!isCertValid) {
      issues.push("Sertifikat K3 pekerja berstatus TIDAK VALID / Dicabut");
    } else if (!isCertNotExpired) {
      issues.push(
        `Sertifikat K3 telah kedaluwarsa pada ${new Date(
          member.certificate!.expiredAt
        ).toLocaleDateString("id-ID")}`
      );
    }

    // Check 3: Health Status
    const isHealthy = member.isHealthy === true;
    if (!isHealthy) {
      issues.push("Kondisi kesehatan pekerja tercatat Kurang Sehat / Tidak Siap Bekerja");
    }

    const canEnter = isPermitOpen && hasCertificate && isCertValid && isCertNotExpired && isHealthy;

    // Determine current presence status
    const latestRecord = member.records[0] || null;
    let presenceStatus: "INSIDE" | "CHECKED_OUT" | "NOT_CHECKED_IN" = "NOT_CHECKED_IN";

    if (latestRecord) {
      if (latestRecord.jamMasuk && !latestRecord.jamKeluar) {
        presenceStatus = "INSIDE";
      } else if (latestRecord.jamMasuk && latestRecord.jamKeluar) {
        presenceStatus = "CHECKED_OUT";
      }
    }

    return NextResponse.json({
      success: true,
      canEnter,
      issues,
      presenceStatus,
      member: {
        id: member.id,
        name: member.name,
        idCardNumber: member.idCardNumber,
        position: member.position,
        phone: member.phone,
        isHealthy: member.isHealthy,
      },
      permit: {
        id: member.permit.id,
        nomor: member.permit.nomor,
        workName: member.permit.workName,
        location: member.permit.location,
        status: member.permit.status,
        vendorName: member.permit.vendor.name,
        picName: member.permit.pic?.full_name,
        startDate: member.permit.startDate.toISOString(),
        endDate: member.permit.endDate.toISOString(),
      },
      certificate: member.certificate
        ? {
            id: member.certificate.id,
            nomor: member.certificate.nomor,
            isValid: member.certificate.isValid,
            expiredAt: member.certificate.expiredAt.toISOString(),
          }
        : null,
      quizResult: member.quizResult
        ? {
            score: member.quizResult.score,
            isPassed: member.quizResult.isPassed,
          }
        : null,
      latestRecord: latestRecord
        ? {
            id: latestRecord.id,
            jamMasuk: latestRecord.jamMasuk?.toISOString() || null,
            jamKeluar: latestRecord.jamKeluar?.toISOString() || null,
            catatan: latestRecord.catatan,
          }
        : null,
    });
  } catch (error) {
    console.error("POST /api/security/verify error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan internal saat memverifikasi identitas" },
      { status: 500 }
    );
  }
}
