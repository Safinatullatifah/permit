import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { memberPermitSchema } from "@/lib/validations/member-permit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: permitId } = await params;

    const permit = await prisma.permit.findUnique({
      where: { id: permitId },
      include: {
        vendor: { select: { id: true, name: true } },
        members: {
          include: {
            quizResult: true,
            certificate: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!permit) {
      return NextResponse.json(
        { message: "Permit tidak ditemukan" },
        { status: 404 }
      );
    }

    // Role check: if VENDOR, verify ownership
    if (session.user.role === "VENDOR" && permit.vendorId !== session.user.vendorId) {
      return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });
    }

    return NextResponse.json({
      permit: {
        id: permit.id,
        nomor: permit.nomor,
        workName: permit.workName,
        picVendor: permit.picVendor,
        vendor: permit.vendor,
      },
      members: permit.members,
    });
  } catch (error) {
    console.error("GET /api/permits/[id]/members error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan internal server" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: permitId } = await params;

    const permit = await prisma.permit.findUnique({
      where: { id: permitId },
      include: { members: true },
    });

    if (!permit) {
      return NextResponse.json(
        { message: "Permit tidak ditemukan" },
        { status: 404 }
      );
    }

    if (session.user.role === "VENDOR" && permit.vendorId !== session.user.vendorId) {
      return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = memberPermitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validasi gagal", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { picVendor, members } = parsed.data;

    // Execute in transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Update PIC Vendor on permit
      await tx.permit.update({
        where: { id: permitId },
        data: { picVendor },
      });

      // 2. Identify existing vs incoming members
      const existingMemberIds = new Set(permit.members.map((m: { id: string }) => m.id));
      const incomingIds = new Set(members.map((m) => m.id).filter(Boolean) as string[]);

      // Members to delete (existing in DB but not in incoming)
      const toDelete = permit.members.filter((m: { id: string }) => !incomingIds.has(m.id));
      if (toDelete.length > 0) {
        await tx.memberPermit.deleteMany({
          where: { id: { in: toDelete.map((m: { id: string }) => m.id) } },
        });
      }

      // 3. Upsert / update members
      for (const m of members) {
        if (m.id && existingMemberIds.has(m.id)) {
          await tx.memberPermit.update({
            where: { id: m.id },
            data: {
              name: m.name,
              idCardNumber: m.idCardNumber || null,
              position: m.position || null,
              phone: m.phone || null,
              isHealthy: m.isHealthy ?? true,
            },
          });
        } else {
          await tx.memberPermit.create({
            data: {
              permitId,
              name: m.name,
              idCardNumber: m.idCardNumber || null,
              position: m.position || null,
              phone: m.phone || null,
              isHealthy: m.isHealthy ?? true,
            },
          });
        }
      }

      // Return updated members
      return tx.memberPermit.findMany({
        where: { permitId },
        include: {
          quizResult: true,
          certificate: true,
        },
        orderBy: { createdAt: "asc" },
      });
    });

    return NextResponse.json({
      message: "Data anggota pekerja berhasil disimpan",
      members: result,
    });
  } catch (error) {
    console.error("POST /api/permits/[id]/members error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat menyimpan data pekerja" },
      { status: 500 }
    );
  }
}
