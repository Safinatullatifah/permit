import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
      },
    });

    if (!permit) {
      return NextResponse.json(
        { message: "Permit tidak ditemukan" },
        { status: 404 }
      );
    }

    // Access control: if VENDOR, verify permit belongs to their company
    if (session.user.role === "VENDOR" && session.user.vendorId !== permit.vendorId) {
      return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });
    }

    // 1. Update or create current user's read status
    await prisma.chatReadStatus.upsert({
      where: {
        permitId_userId: {
          permitId,
          userId: session.user.id,
        },
      },
      update: {
        lastReadAt: new Date(),
      },
      create: {
        permitId,
        userId: session.user.id,
        lastReadAt: new Date(),
      },
    });

    // 2. Fetch messages
    const messages = await prisma.chatMessage.findMany({
      where: { permitId },
      include: {
        sender: {
          select: {
            id: true,
            full_name: true,
            role: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 3. Fetch read statuses for read receipts
    const readStatuses = await prisma.chatReadStatus.findMany({
      where: { permitId },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      permit: {
        id: permit.id,
        nomor: permit.nomor,
        workName: permit.workName,
        vendorName: permit.vendor.name,
        status: permit.status,
      },
      messages: messages.map((m) => ({
        id: m.id,
        message: m.message,
        attachmentUrl: m.attachmentUrl,
        attachmentName: m.attachmentName,
        createdAt: m.createdAt.toISOString(),
        sender: m.sender,
        isMe: m.senderId === session.user.id,
      })),
      readStatuses: readStatuses.map((r) => ({
        userId: r.userId,
        userName: r.user.full_name,
        role: r.user.role,
        lastReadAt: r.lastReadAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/permits/[id]/chat error:", error);
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
      include: {
        vendor: true,
        user: true,
        pic: true,
      },
    });

    if (!permit) {
      return NextResponse.json(
        { message: "Permit tidak ditemukan" },
        { status: 404 }
      );
    }

    if (session.user.role === "VENDOR" && session.user.vendorId !== permit.vendorId) {
      return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const { message, attachmentUrl, attachmentName } = body as {
      message: string;
      attachmentUrl?: string;
      attachmentName?: string;
    };

    if (!message || !message.trim()) {
      return NextResponse.json(
        { message: "Pesan tidak boleh kosong" },
        { status: 400 }
      );
    }

    const now = new Date();

    // 1. Create chat message & update sender read status
    const newMsg = await prisma.$transaction(async (tx) => {
      const chat = await tx.chatMessage.create({
        data: {
          permitId,
          senderId: session.user.id,
          message: message.trim(),
          attachmentUrl: attachmentUrl || null,
          attachmentName: attachmentName || null,
          createdAt: now,
        },
        include: {
          sender: {
            select: {
              id: true,
              full_name: true,
              role: true,
              username: true,
            },
          },
        },
      });

      await tx.chatReadStatus.upsert({
        where: {
          permitId_userId: {
            permitId,
            userId: session.user.id,
          },
        },
        update: { lastReadAt: now },
        create: {
          permitId,
          userId: session.user.id,
          lastReadAt: now,
        },
      });

      return chat;
    });

    // 2. Dispatch notifications to other stakeholders asynchronously
    // Determine recipient user IDs:
    const recipientUserIds = new Set<string>();

    if (permit.userId && permit.userId !== session.user.id) {
      recipientUserIds.add(permit.userId);
    }
    if (permit.picId && permit.picId !== session.user.id) {
      recipientUserIds.add(permit.picId);
    }

    // If sent by internal user, also notify vendor user(s)
    if (session.user.role !== "VENDOR") {
      const vendorUsers = await prisma.user.findMany({
        where: {
          vendorId: permit.vendorId,
          id: { not: session.user.id },
        },
        select: { id: true },
      });
      vendorUsers.forEach((u) => recipientUserIds.add(u.id));
    }

    // Create notifications for recipients
    if (recipientUserIds.size > 0) {
      const notifData = Array.from(recipientUserIds).map((uId) => ({
        userId: uId,
        permitId: permit.id,
        title: `Pesan baru di Permit ${permit.nomor}`,
        message: `${session.user.name || "Seseorang"} (${session.user.role}): ${
          message.length > 60 ? message.substring(0, 57) + "..." : message
        }`,
        type: "CHAT_MESSAGE",
        link: `/permits/${permit.id}`,
      }));

      await prisma.notification.createMany({
        data: notifData,
      });
    }

    return NextResponse.json({
      success: true,
      message: {
        id: newMsg.id,
        message: newMsg.message,
        attachmentUrl: newMsg.attachmentUrl,
        attachmentName: newMsg.attachmentName,
        createdAt: newMsg.createdAt.toISOString(),
        sender: newMsg.sender,
        isMe: true,
      },
    });
  } catch (error) {
    console.error("POST /api/permits/[id]/chat error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat mengirim pesan" },
      { status: 500 }
    );
  }
}
