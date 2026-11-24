import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PermitChatBox } from "@/components/chat/PermitChatBox";
import { ArrowLeft, MessageSquare, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface PermitChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function PermitChatPage({ params }: PermitChatPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  // Handle literal "[id]" fallback
  if (id === "[id]") {
    const fallbackPermit = await prisma.permit.findFirst({
      where:
        session.user.role === "VENDOR" && session.user.vendorId
          ? { vendorId: session.user.vendorId }
          : {},
      orderBy: { createdAt: "desc" },
    });
    if (fallbackPermit) {
      redirect(`/permits/${fallbackPermit.id}/chat`);
    } else {
      redirect("/user");
    }
  }

  const permit = await prisma.permit.findUnique({
    where: { id },
    include: {
      vendor: { select: { id: true, name: true } },
    },
  });

  if (!permit) {
    notFound();
  }

  if (
    session.user.role === "VENDOR" &&
    session.user.vendorId &&
    session.user.vendorId !== permit.vendorId
  ) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        Anda tidak memiliki akses ke ruang diskusi permit perusahaan lain.
      </div>
    );
  }

  const backLink =
    session.user.role === "VENDOR"
      ? "/vendor"
      : session.user.role === "PIC"
      ? "/pic"
      : session.user.role === "LP"
      ? "/lp"
      : session.user.role === "SHE"
      ? "/she"
      : "/user";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 mb-2">
            <MessageSquare className="w-3.5 h-3.5" />
            Ruang Komunikasi &amp; Klarifikasi Permit
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            Diskusi Permit {permit.nomor}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {permit.workName} • Vendor: {permit.vendor.name}
          </p>
        </div>

        <Link
          href={backLink}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard</span>
        </Link>
      </div>

      {/* Chat Component */}
      <PermitChatBox
        permitId={permit.id}
        permitNomor={permit.nomor}
        workName={permit.workName}
      />
    </div>
  );
}
