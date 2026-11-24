import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.notification.count({
        where: {
          userId: session.user.id,
          isRead: false,
        },
      }),
    ]);

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        link: n.link,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { message: "Gagal memuat notifikasi" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId, markAll } = body as {
      notificationId?: string;
      markAll?: boolean;
    };

    const now = new Date();

    if (markAll) {
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: now,
        },
      });

      return NextResponse.json({ success: true, message: "Semua notifikasi ditandai dibaca" });
    }

    if (notificationId) {
      await prisma.notification.update({
        where: {
          id: notificationId,
          userId: session.user.id,
        },
        data: {
          isRead: true,
          readAt: now,
        },
      });

      return NextResponse.json({ success: true, message: "Notifikasi ditandai dibaca" });
    }

    return NextResponse.json({ message: "Parameter tidak valid" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui status notifikasi" },
      { status: 500 }
    );
  }
}
