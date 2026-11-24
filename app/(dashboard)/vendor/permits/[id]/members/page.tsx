import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MemberPermitForm } from "@/components/members/MemberPermitForm";

interface VendorMembersPageProps {
  params: Promise<{ id: string }>;
}

export default async function VendorMembersPage({ params }: VendorMembersPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        Silakan login terlebih dahulu untuk mengakses halaman ini.
      </div>
    );
  }

  // Handle literal placeholder "[id]" from manual URL typing
  if (id === "[id]") {
    const fallbackPermit = await prisma.permit.findFirst({
      where:
        session.user.role === "VENDOR" && session.user.vendorId
          ? { vendorId: session.user.vendorId }
          : {},
      orderBy: { createdAt: "desc" },
    });

    if (fallbackPermit) {
      redirect(`/vendor/permits/${fallbackPermit.id}/members`);
    } else {
      redirect("/vendor");
    }
  }

  const permit = await prisma.permit.findUnique({
    where: { id },
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
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Izin Kerja (Permit) Tidak Ditemukan
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          ID permit yang Anda tuju (<code className="font-mono text-zinc-800 dark:text-zinc-200">{id}</code>) tidak terdaftar dalam sistem. Pastikan Anda membuka halaman pekerja melalui tombol <strong>Pekerja</strong> di Portal Rekanan Vendor.
        </p>
        <div className="pt-2">
          <Link
            href="/vendor"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Portal Vendor
          </Link>
        </div>
      </div>
    );
  }

  if (
    session.user.role === "VENDOR" &&
    session.user.vendorId &&
    session.user.vendorId !== permit.vendorId
  ) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        Anda tidak memiliki akses untuk mengelola pekerja pada permit perusahaan lain.
      </div>
    );
  }

  const serializedMembers = permit.members.map((m) => ({
    id: m.id,
    name: m.name,
    idCardNumber: m.idCardNumber,
    position: m.position,
    phone: m.phone,
    isHealthy: m.isHealthy,
    quizResult: m.quizResult
      ? {
          id: m.quizResult.id,
          score: m.quizResult.score,
          isPassed: m.quizResult.isPassed,
          isCompleted: m.quizResult.isCompleted,
          completedAt: m.quizResult.completedAt?.toISOString() || null,
        }
      : null,
    certificate: m.certificate
      ? {
          id: m.certificate.id,
          nomor: m.certificate.nomor,
          isValid: m.certificate.isValid,
          expiredAt: m.certificate.expiredAt.toISOString(),
        }
      : null,
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <MemberPermitForm
        permit={{
          id: permit.id,
          nomor: permit.nomor,
          workName: permit.workName,
          picVendor: permit.picVendor,
          vendor: permit.vendor,
        }}
        initialMembers={serializedMembers}
      />
    </div>
  );
}
