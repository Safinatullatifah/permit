import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { LiveMonitoringTable, ActiveWorker } from "@/components/security/LiveMonitoringTable";
import { Users, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function SecurityLiveMonitoringPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        Silakan login terlebih dahulu untuk mengakses halaman monitoring.
      </div>
    );
  }

  // Fetch active workers in plant
  const [activeRecords, vendors, distinctPermits] = await Promise.all([
    prisma.memberRecord.findMany({
      where: {
        jamMasuk: { not: null },
        jamKeluar: null,
      },
      include: {
        member: {
          include: {
            permit: {
              include: {
                vendor: { select: { id: true, name: true } },
                pic: { select: { id: true, full_name: true } },
              },
            },
            certificate: {
              select: { nomor: true, isValid: true, expiredAt: true },
            },
          },
        },
      },
      orderBy: { jamMasuk: "desc" },
    }),

    prisma.vendor.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),

    prisma.permit.findMany({
      select: { location: true },
      distinct: ["location"],
    }),
  ]);

  const now = new Date();

  const formattedWorkers: ActiveWorker[] = activeRecords.map((rec) => {
    const entryTime = rec.jamMasuk ? new Date(rec.jamMasuk) : new Date(rec.createdAt);
    const diffMs = Math.max(0, now.getTime() - entryTime.getTime());
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      recordId: rec.id,
      memberId: rec.member.id,
      name: rec.member.name,
      idCardNumber: rec.member.idCardNumber,
      position: rec.member.position,
      phone: rec.member.phone,
      isHealthy: rec.member.isHealthy,
      permitId: rec.member.permit.id,
      permitNomor: rec.member.permit.nomor,
      workName: rec.member.permit.workName,
      location: rec.member.permit.location,
      isHighRisk: rec.member.permit.isHighRisk,
      vendorId: rec.member.permit.vendor.id,
      vendorName: rec.member.permit.vendor.name,
      picName: rec.member.permit.pic?.full_name || "-",
      certNomor: rec.member.certificate?.nomor || "-",
      jamMasuk: entryTime.toISOString(),
      durationHours: hours,
      durationMinutes: minutes,
      durationText: `${hours} jam ${minutes} menit`,
      isOvertime: hours >= 8,
      catatan: rec.catatan,
    };
  });

  const locations = distinctPermits.map((p) => p.location).filter(Boolean);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Plant Workforce Monitoring
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Monitoring Pekerja Vendor Aktif di Pabrik
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Daftar seluruh teknisi kontraktor yang saat ini berada di dalam area fasilitas untuk keselamatan dan kesiapan evakuasi darurat.
          </p>
        </div>

        <Link
          href="/security"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Pos Gerbang (Scan QR)</span>
        </Link>
      </div>

      {/* Main Monitoring Table */}
      <LiveMonitoringTable
        initialWorkers={formattedWorkers}
        vendors={vendors}
        locations={locations}
      />
    </div>
  );
}
