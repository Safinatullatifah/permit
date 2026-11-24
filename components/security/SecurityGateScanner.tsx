"use client";

import { useState, useEffect, useRef } from "react";
import {
  Camera,
  Search,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  User,
  Building2,
  MapPin,
  Calendar,
  AlertTriangle,
  RefreshCw,
  QrCode,
  HeartPulse,
  Award,
  FileText,
  Clock,
} from "lucide-react";

interface VerificationData {
  success: boolean;
  canEnter: boolean;
  issues: string[];
  presenceStatus: "INSIDE" | "CHECKED_OUT" | "NOT_CHECKED_IN";
  member: {
    id: string;
    name: string;
    idCardNumber?: string | null;
    position?: string | null;
    phone?: string | null;
    isHealthy: boolean;
  };
  permit: {
    id: string;
    nomor: string;
    workName: string;
    location: string;
    status: string;
    vendorName: string;
    picName?: string;
    startDate: string;
    endDate: string;
  };
  certificate?: {
    id: string;
    nomor: string;
    isValid: boolean;
    expiredAt: string;
  } | null;
  quizResult?: {
    score: number;
    isPassed: boolean;
  } | null;
  latestRecord?: {
    id: string;
    jamMasuk: string | null;
    jamKeluar: string | null;
    catatan: string | null;
  } | null;
}

interface RecentActivity {
  id: string;
  workerName: string;
  vendorName: string;
  permitNomor: string;
  action: "CHECK_IN" | "CHECK_OUT";
  time: string;
  note?: string;
}

export function SecurityGateScanner({
  initialRecentActivities = [],
}: {
  initialRecentActivities?: RecentActivity[];
}) {
  const [manualCode, setManualCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [gateNote, setGateNote] = useState("");
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    initialRecentActivities
  );

  // Scanner state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef<any>(null);
  const scannerContainerId = "html5-qr-gate-scanner";

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch((err: any) => console.warn("Failed to clear scanner on unmount", err));
      }
    };
  }, []);

  const startCamera = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // Dynamic import to avoid SSR issues
      const { Html5QrcodeScanner } = await import("html5-qrcode");

      setIsCameraActive(true);

      // Timeout to ensure DOM element is mounted
      setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
          scannerContainerId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
          },
          /* verbose= */ false
        );

        scannerRef.current = scanner;

        scanner.render(
          (decodedText: string) => {
            // Play a small beep audio using Web Audio API
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.frequency.setValueAtTime(800, audioCtx.currentTime);
              gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.15);
            } catch {
              // Ignore audio errors
            }

            handleVerifyCode(decodedText);
          },
          (errorMessage: string) => {
            // Frame parse error (ignore continuous scan errors)
          }
        );
      }, 300);
    } catch (err: any) {
      setErrorMsg("Gagal mengakses modul kamera scanner: " + err.message);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scannerRef.current) {
      scannerRef.current
        .clear()
        .then(() => {
          setIsCameraActive(false);
          scannerRef.current = null;
        })
        .catch((err: any) => {
          console.warn("Failed to stop scanner", err);
          setIsCameraActive(false);
        });
    } else {
      setIsCameraActive(false);
    }
  };

  const handleVerifyCode = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) return;

    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/security/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToVerify.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal memverifikasi identitas pekerja");
      }

      setVerification(data);
      setSuccessMsg("Identitas pekerja berhasil diverifikasi.");
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat verifikasi");
      setVerification(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode) {
      handleVerifyCode(manualCode);
    }
  };

  const handlePresenceAction = async (action: "CHECK_IN" | "CHECK_OUT") => {
    if (!verification?.member) return;

    setIsActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/security/check-in-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: verification.member.id,
          action,
          catatan: gateNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal memproses presensi gerbang");
      }

      setSuccessMsg(data.message);
      setGateNote("");

      // Update verification presence status
      setVerification((prev) =>
        prev
          ? {
              ...prev,
              presenceStatus: data.presenceStatus,
              latestRecord: {
                id: data.record.id,
                jamMasuk: data.record.jamMasuk,
                jamKeluar: data.record.jamKeluar,
                catatan: data.record.catatan,
              },
            }
          : null
      );

      // Append to recent activities
      const newAct: RecentActivity = {
        id: data.record.id,
        workerName: verification.member.name,
        vendorName: verification.permit.vendorName,
        permitNomor: verification.permit.nomor,
        action,
        time: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        note: gateNote || undefined,
      };

      setRecentActivities((prev) => [newAct, ...prev.slice(0, 9)]);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mencatat presensi");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alert / Messages */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid: Scanner & Manual Input (Left) + Verification Result (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: QR Scanner & Manual Search (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card Kamera QR Scanner */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    Pemindai QR Sertifikat
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Kamera Web / Tablet Security Gate
                  </p>
                </div>
              </div>

              {isCameraActive ? (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3.5 py-1.5 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 hover:bg-red-200 text-xs font-semibold transition-colors"
                >
                  Tutup Kamera
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startCamera}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Buka Kamera
                </button>
              )}
            </div>

            {/* Kamera Viewport */}
            {isCameraActive ? (
              <div className="rounded-2xl overflow-hidden border-2 border-blue-500 bg-black min-h-[280px] relative">
                <div id={scannerContainerId} className="w-full" />
                <p className="text-[11px] text-center text-zinc-400 py-2 bg-zinc-950">
                  Arahkan kamera ke QR Code pada e-Sertifikat K3 pekerja
                </p>
              </div>
            ) : (
              <div
                onClick={startCamera}
                className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500 transition-colors bg-zinc-50/50 dark:bg-zinc-800/20"
              >
                <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                  <Camera className="w-7 h-7" />
                </div>
                <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
                  Kamera Sedang Tidak Aktif
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
                  Klik di sini untuk mengaktifkan kamera pemindai QR Code presensi pekerja vendor.
                </p>
              </div>
            )}
          </div>

          {/* Card Pencarian Manual */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-600" />
              Input Manual (Jika Scanner Terkendala)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Masukkan Nomor Sertifikat (misal: <code>CERT-K3-202611-XXXX</code>) atau Nomor KTP pekerja:
            </p>

            <form onSubmit={handleManualSearch} className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Contoh: CERT-K3-202611-... atau NIK KTP"
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isLoading || !manualCode.trim()}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Periksa"}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Verification Details & Action (7 Cols) */}
        <div className="lg:col-span-7">
          {verification ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-6">
              {/* Header Status Decision Badge */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                  verification.canEnter
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                    : "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  {verification.canEnter ? (
                    <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-bold tracking-wider uppercase opacity-80 block">
                      Keputusan Akses Gerbang
                    </span>
                    <h3 className="text-base font-extrabold">
                      {verification.canEnter
                        ? "MEMENUHI SYARAT MASUK PABRIK"
                        : "AKSES DITOLAK / DILARANG MASUK"}
                    </h3>
                  </div>
                </div>

                {/* Current Presence Status Badge */}
                <div>
                  {verification.presenceStatus === "INSIDE" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-300 dark:border-blue-800">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                      SEDANG DI DALAM
                    </span>
                  ) : verification.presenceStatus === "CHECKED_OUT" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                      SUDAH KELUAR
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                      BELUM MASUK
                    </span>
                  )}
                </div>
              </div>

              {/* Warning box if issues exist */}
              {verification.issues.length > 0 && (
                <div className="p-4 rounded-2xl bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 space-y-1.5">
                  <h4 className="text-xs font-bold text-red-800 dark:text-red-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Penyebab Akses Tidak Diizinkan:
                  </h4>
                  <ul className="text-xs text-red-700 dark:text-red-300 list-disc list-inside space-y-1 pl-1">
                    {verification.issues.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Detail Identitas Pekerja & Permit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Info Pekerja */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                    Data Anggota Teknisi
                  </span>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {verification.member.name}
                    </span>
                  </div>
                  <p className="text-zinc-500">
                    NIK: <span className="font-mono">{verification.member.idCardNumber || "-"}</span>
                  </p>
                  <p className="text-zinc-500">
                    Posisi: <span className="font-medium text-zinc-700 dark:text-zinc-300">{verification.member.position || "Teknisi"}</span>
                  </p>
                  <p className="text-zinc-500">
                    Kontak: <span className="font-medium">{verification.member.phone || "-"}</span>
                  </p>
                </div>

                {/* Info Vendor & Permit */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                    Izin Kerja (Permit) Terkait
                  </span>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {verification.permit.vendorName}
                    </span>
                  </div>
                  <p className="text-zinc-500">
                    No. Permit: <span className="font-mono font-bold text-blue-600">{verification.permit.nomor}</span>
                  </p>
                  <p className="text-zinc-500">
                    Pekerjaan: <span className="font-medium text-zinc-700 dark:text-zinc-300">{verification.permit.workName}</span>
                  </p>
                  <p className="text-zinc-500">
                    Lokasi: <span className="font-medium text-zinc-700 dark:text-zinc-300">{verification.permit.location}</span>
                  </p>
                </div>
              </div>

              {/* 3 Parameter Utama K3 */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                  Hasil 3 Poin Cek Keselamatan
                </span>

                <div className="space-y-2 text-xs">
                  {/* Parameter 1: Status Permit Induk */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Status Izin Kerja Induk</span>
                    </div>
                    {verification.permit.status === "OPEN" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                        <CheckCircle2 className="w-4 h-4" /> STATUS OPEN (AKTIF)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                        <XCircle className="w-4 h-4" /> {verification.permit.status} (BELUM AKTIF)
                      </span>
                    )}
                  </div>

                  {/* Parameter 2: Sertifikat Induksi K3 */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-600" />
                      <span>Sertifikat Safety Induction</span>
                    </div>
                    {verification.certificate && verification.certificate.isValid ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                        <CheckCircle2 className="w-4 h-4" /> VALID (s/d {new Date(verification.certificate.expiredAt).toLocaleDateString("id-ID")})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                        <XCircle className="w-4 h-4" /> TIDAK ADA / EXPIRED
                      </span>
                    )}
                  </div>

                  {/* Parameter 3: Status Sehat */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="flex items-center gap-2">
                      <HeartPulse className="w-4 h-4 text-rose-600" />
                      <span>Status Fisik / Kesehatan</span>
                    </div>
                    {verification.member.isHealthy ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                        <CheckCircle2 className="w-4 h-4" /> SEHAT &amp; SIAP KERJA
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                        <XCircle className="w-4 h-4" /> KURANG SEHAT
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Input Catatan & Tombol Presensi Check-In / Check-Out */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Catatan Petugas Gerbang (Opsional)
                  </label>
                  <input
                    type="text"
                    value={gateNote}
                    onChange={(e) => setGateNote(e.target.value)}
                    placeholder="Contoh: APD lengkap diperiksa, membawa box toolkit"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isActionLoading || !verification.canEnter || verification.presenceStatus === "INSIDE"}
                    onClick={() => handlePresenceAction("CHECK_IN")}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Catat Masuk (Check-In)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isActionLoading || verification.presenceStatus !== "INSIDE"}
                    onClick={() => handlePresenceAction("CHECK_OUT")}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Catat Keluar (Check-Out)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Placeholder when no member scanned yet */
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[420px] space-y-3">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-base text-zinc-800 dark:text-zinc-200">
                Belum Ada Data yang Dipindai
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
                Pindai QR Code e-Sertifikat K3 pekerja menggunakan kamera di sebelah kiri, atau ketik Nomor Sertifikat / NIK pekerja secara manual.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION: Log Aktivitas Presensi Hari Ini */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Riwayat Presensi Terbaru di Pos Gerbang
            </h3>
          </div>
          <span className="text-xs text-zinc-500">
            {recentActivities.length} Aktivitas Terkini
          </span>
        </div>

        {recentActivities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 uppercase tracking-wider font-semibold border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Nama Pekerja</th>
                  <th className="px-4 py-3">Vendor / Rekanan</th>
                  <th className="px-4 py-3">Nomor Permit</th>
                  <th className="px-4 py-3">Aktivitas</th>
                  <th className="px-4 py-3">Catatan Gerbang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {recentActivities.map((act) => (
                  <tr key={act.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <td className="px-4 py-3 font-mono text-zinc-500 whitespace-nowrap">
                      {act.time}
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      {act.workerName}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {act.vendorName}
                    </td>
                    <td className="px-4 py-3 font-mono text-blue-600">
                      {act.permitNomor}
                    </td>
                    <td className="px-4 py-3">
                      {act.action === "CHECK_IN" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <LogIn className="w-3 h-3" /> Check-In Masuk
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          <LogOut className="w-3 h-3" /> Check-Out Keluar
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 italic">
                      {act.note || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-zinc-400 italic text-center py-6">
            Belum ada aktivitas presensi gerbang tercatat hari ini.
          </p>
        )}
      </div>
    </div>
  );
}
