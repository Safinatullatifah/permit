import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SecurityGateScanner } from "@/components/security/SecurityGateScanner";
import { ShieldCheck, Users, LogIn, LogOut, Activity } from "lucide-react";
import Link from "next/link";

export default async function SecurityGatePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        Silakan login terlebih dahulu untuk mengakses Pos Keamanan.
      </div>
    );
  }

  // Calculate today's start date
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Parallel queries for statistics & recent activities
  const [activeInsideCount, totalCheckInToday, totalCheckOutToday, recentRecords] =
    await Promise.all([
      // 1. Workers currently inside (jamMasuk today and jamKeluar is null)
      prisma.memberRecord.count({
        where: {
          jamMasuk: { gte: startOfToday },
          jamKeluar: null,
        },
      }),

      // 2. Total check-ins today
      prisma.memberRecord.count({
        where: {
          jamMasuk: { gte: startOfToday },
        },
      }),

      // 3. Total check-outs today
      prisma.memberRecord.count({
        where: {
          jamKeluar: { gte: startOfToday },
        },
      }),

      // 4. Recent records for gate log
      prisma.memberRecord.findMany({
        take: 10,
        orderBy: { updatedAt: "desc" },
        include: {
          member: {
            include: {
              permit: {
                include: {
                  vendor: true,
                },
              },
            },
          },
        },
      }),
    ]);

  const initialRecentActivities = recentRecords.map((r) => {
    const isOut = !!r.jamKeluar;
    const timeDate = isOut ? r.jamKeluar! : r.jamMasuk || r.createdAt;

    return {
      id: r.id,
      workerName: r.member.name,
      vendorName: r.member.permit.vendor.name,
      permitNomor: r.member.permit.nomor,
      action: (isOut ? "CHECK_OUT" : "CHECK_IN") as "CHECK_IN" | "CHECK_OUT",
      time: new Date(timeDate).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      note: r.catatan || undefined,
    };
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Sistem Kontrol Akses Gerbang (Access Gate Control)
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Pos Keamanan &amp; Verifikasi Presensi QR
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Pindai QR Code e-Sertifikat K3 untuk memverifikasi izin masuk pekerja vendor dan mencatat jam kehadiran.
          </p>
        </div>

        {/* Live Indicator & Monitoring Link */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/security/monitoring"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Live Monitoring Pekerja ({activeInsideCount})</span>
          </Link>
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Security Gate Live Active</span>
          </div>
        </div>
      </div>

      {/* Quick Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Sedang di dalam pabrik */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
              Pekerja di Dalam Pabrik
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                {activeInsideCount}
              </span>
              <span className="text-xs text-zinc-400">Orang Aktif</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Check-In Hari Ini */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
              Total Check-In Masuk
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {totalCheckInToday}
              </span>
              <span className="text-xs text-zinc-400">Kunjungan</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <LogIn className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Total Check-Out Hari Ini */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
              Total Check-Out Keluar
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-zinc-700 dark:text-zinc-300">
                {totalCheckOutToday}
              </span>
              <span className="text-xs text-zinc-400">Pekerja Pulang</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center">
            <LogOut className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Scanner & Verification UI */}
      <SecurityGateScanner initialRecentActivities={initialRecentActivities} />
    </div>
  );
}
