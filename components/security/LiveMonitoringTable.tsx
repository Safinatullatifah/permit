"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  LogOut,
  AlertTriangle,
  Clock,
  FileSpreadsheet,
  Printer,
  ShieldAlert,
  Building2,
  MapPin,
  CheckCircle2,
  UserCheck,
  ShieldCheck,
  Phone,
} from "lucide-react";

export interface ActiveWorker {
  recordId: string;
  memberId: string;
  name: string;
  idCardNumber?: string | null;
  position?: string | null;
  phone?: string | null;
  isHealthy: boolean;
  permitId: string;
  permitNomor: string;
  workName: string;
  location: string;
  isHighRisk: boolean;
  vendorId: string;
  vendorName: string;
  picName: string;
  certNomor: string;
  jamMasuk: string;
  durationHours: number;
  durationMinutes: number;
  durationText: string;
  isOvertime: boolean;
  catatan?: string | null;
}

interface LiveMonitoringTableProps {
  initialWorkers: ActiveWorker[];
  vendors: { id: string; name: string }[];
  locations: string[];
}

export function LiveMonitoringTable({
  initialWorkers,
  vendors,
  locations,
}: LiveMonitoringTableProps) {
  const [workers, setWorkers] = useState<ActiveWorker[]>(initialWorkers);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [onlyOvertime, setOnlyOvertime] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const fetchActiveWorkers = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/security/monitoring");
      if (res.ok) {
        const data = await res.json();
        setWorkers(data.activeWorkers || []);
      }
    } catch (err) {
      console.error("Gagal memperbarui data monitoring:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh interval (15s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchActiveWorkers();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Filtered workers
  const filteredWorkers = workers.filter((w) => {
    const matchSearch =
      searchTerm === "" ||
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.permitNomor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchVendor = selectedVendor === "" || w.vendorId === selectedVendor;
    const matchLocation = selectedLocation === "" || w.location === selectedLocation;
    const matchOvertime = !onlyOvertime || w.isOvertime;

    return matchSearch && matchVendor && matchLocation && matchOvertime;
  });

  const highRiskCount = workers.filter((w) => w.isHighRisk).length;
  const overtimeCount = workers.filter((w) => w.isOvertime).length;
  const activeVendorsCount = new Set(workers.map((w) => w.vendorId)).size;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredWorkers.map((w) => w.recordId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (recordId: string) => {
    setSelectedIds((prev) =>
      prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId]
    );
  };

  const handleCheckOut = async (recordIds: string[], workerName?: string) => {
    const confirmText = workerName
      ? `Konfirmasi Check-Out untuk ${workerName}?`
      : `Konfirmasi Check-Out sekaligus untuk ${recordIds.length} pekerja terpilih?`;

    if (!confirm(confirmText)) return;

    setIsActionLoading(true);
    setToastMsg(null);

    try {
      const res = await fetch("/api/security/monitoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordIds }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal memproses check-out");
      }

      setToastMsg({ type: "success", text: data.message });
      setSelectedIds((prev) => prev.filter((id) => !recordIds.includes(id)));
      await fetchActiveWorkers();
    } catch (err: any) {
      setToastMsg({ type: "error", text: err.message || "Terjadi kesalahan koneksi" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePrintRollCall = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`print:hidden p-4 rounded-2xl border flex items-center justify-between text-sm ${
            toastMsg.type === "success"
              ? "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
              : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMsg.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0" />
            )}
            <span>{toastMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-xs font-semibold underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Top 4 Summary Cards (hidden on print) */}
      <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pekerja Aktif */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
              Pekerja di Dalam Pabrik
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                {workers.length}
              </span>
              <span className="text-xs text-zinc-400">Orang</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Pekerjaan High Risk */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
              Pekerja High Risk
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
                {highRiskCount}
              </span>
              <span className="text-xs text-zinc-400">Orang</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Peringatan Overtime */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
              Pekerja &gt; 8 Jam (Lembur)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
                {overtimeCount}
              </span>
              <span className="text-xs text-zinc-400">Perlu Dicek</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Total Vendor Rekanan */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
              Vendor Rekanan Aktif
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                {activeVendorsCount}
              </span>
              <span className="text-xs text-zinc-400">Perusahaan</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Action Controls (hidden on print) */}
      <div className="print:hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama teknisi, nomor permit, vendor, atau area..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fetchActiveWorkers}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Segarkan Data</span>
            </button>

            <label className="inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded"
              />
              <span>Auto-refresh (15s)</span>
            </label>

            <a
              href="/api/export/attendance"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Download seluruh rekap presensi pekerja ke Excel .xlsx"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Presensi (.xlsx)</span>
            </a>

            <button
              type="button"
              onClick={handlePrintRollCall}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Roll Call Darurat</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
          >
            <option value="">Semua Vendor Rekanan</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
          >
            <option value="">Semua Lokasi / Area</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          <label className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium cursor-pointer select-none ml-auto">
            <input
              type="checkbox"
              checked={onlyOvertime}
              onChange={(e) => setOnlyOvertime(e.target.checked)}
              className="w-3.5 h-3.5 text-amber-600 rounded"
            />
            <span>Hanya yang &gt; 8 Jam (Lembur)</span>
          </label>
        </div>
      </div>

      {/* Batch Action Bar (appears when items are selected) */}
      {selectedIds.length > 0 && (
        <div className="print:hidden p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-4 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-200">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>{selectedIds.length} pekerja terpilih</span>
          </div>
          <button
            type="button"
            disabled={isActionLoading}
            onClick={() => handleCheckOut(selectedIds)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Catat Keluar ({selectedIds.length} Pekerja)</span>
          </button>
        </div>
      )}

      {/* Print-Only Header for Emergency Evacuation Roll Call */}
      <div className="hidden print:block border-b-2 border-black pb-4 mb-4">
        <h2 className="text-xl font-black uppercase text-center">
          DAFTAR PRESENSI &amp; ROLL CALL EVAKUASI DARURAT PABRIK
        </h2>
        <p className="text-xs text-center text-gray-600">
          PT Pabrik Industri Mandiri • Dicetak pada: {new Date().toLocaleString("id-ID")}
        </p>
        <div className="flex justify-between text-xs mt-2 font-semibold">
          <span>Total Pekerja di Dalam: {filteredWorkers.length} Orang</span>
          <span>Status Fasilitas: Siaga Darurat</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 uppercase tracking-wider font-semibold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="print:hidden px-4 py-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      filteredWorkers.length > 0 &&
                      selectedIds.length === filteredWorkers.length
                    }
                    className="w-3.5 h-3.5 text-blue-600 rounded"
                  />
                </th>
                <th className="px-4 py-3.5">Teknisi / Pekerja</th>
                <th className="px-4 py-3.5">Vendor Rekanan</th>
                <th className="px-4 py-3.5">Izin Kerja &amp; Lokasi</th>
                <th className="px-4 py-3.5">Waktu Masuk</th>
                <th className="px-4 py-3.5">Durasi di Dalam</th>
                <th className="print:hidden px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredWorkers.length > 0 ? (
                filteredWorkers.map((w) => {
                  const isSelected = selectedIds.includes(w.recordId);
                  return (
                    <tr
                      key={w.recordId}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-blue-50/60 dark:bg-blue-950/30"
                          : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40"
                      }`}
                    >
                      <td className="print:hidden px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(w.recordId)}
                          className="w-3.5 h-3.5 text-blue-600 rounded"
                        />
                      </td>

                      {/* Info Teknisi */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
                          <span>{w.name}</span>
                        </div>
                        <div className="text-[11px] text-zinc-500 flex items-center gap-2 mt-0.5">
                          <span>{w.position || "Teknisi"}</span>
                          {w.phone && (
                            <span className="flex items-center gap-0.5 text-zinc-400">
                              <Phone className="w-3 h-3" /> {w.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Info Vendor */}
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                          {w.vendorName}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {w.certNomor}
                        </span>
                      </td>

                      {/* Info Permit & Lokasi */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-blue-600">
                            {w.permitNomor}
                          </span>
                          {w.isHighRisk && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              HIGH RISK
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                          <span>{w.location}</span>
                        </div>
                      </td>

                      {/* Jam Masuk */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-zinc-700 dark:text-zinc-300 font-medium block">
                          {new Date(w.jamMasuk).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {new Date(w.jamMasuk).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </td>

                      {/* Durasi di Dalam */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {w.isOvertime ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {w.durationText} (Lembur)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            {w.durationText}
                          </span>
                        )}
                      </td>

                      {/* Aksi Check-Out Cepat (hidden on print) */}
                      <td className="print:hidden px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => handleCheckOut([w.recordId], w.name)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-[11px] transition-colors cursor-pointer"
                          title="Catat pekerja keluar pabrik"
                        >
                          <LogOut className="w-3.5 h-3.5 text-red-600" />
                          <span>Check-Out</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-400 italic">
                    Tidak ada pekerja vendor yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
