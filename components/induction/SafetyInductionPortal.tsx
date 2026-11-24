"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  ShieldCheck,
  BookOpen,
  HelpCircle,
  Award,
  AlertTriangle,
  Printer,
  RotateCcw,
  CheckCircle2,
  HardHat,
  Flame,
  Zap,
  PhoneCall,
  MapPin,
  Building2,
  User,
  Clock,
  ArrowRight,
} from "lucide-react";

interface Choice {
  id: string;
  text: string;
}

interface QuizItem {
  id: string;
  question: string;
  imageUrl?: string | null;
  choices: Choice[];
}

interface MemberData {
  id: string;
  name: string;
  idCardNumber?: string | null;
  position?: string | null;
  phone?: string | null;
  permitId: string;
}

interface PermitData {
  id: string;
  nomor: string;
  workName: string;
  location: string;
  vendorName: string;
}

interface InitialQuizResult {
  score: number;
  isPassed: boolean;
  isCompleted: boolean;
  completedAt?: string | null;
}

interface InitialCertificate {
  id: string;
  nomor: string;
  isValid: boolean;
  expiredAt: string;
  createdAt: string;
}

interface SafetyInductionPortalProps {
  member: MemberData;
  permit: PermitData;
  quizzes: QuizItem[];
  initialQuizResult?: InitialQuizResult | null;
  initialCertificate?: InitialCertificate | null;
}

export function SafetyInductionPortal({
  member,
  permit,
  quizzes,
  initialQuizResult,
  initialCertificate,
}: SafetyInductionPortalProps) {
  // If already passed, open directly on certificate tab; otherwise default to material tab
  const [activeTab, setActiveTab] = useState<"material" | "quiz" | "result">(
    initialQuizResult?.isPassed ? "result" : "material"
  );

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [quizResult, setQuizResult] = useState<InitialQuizResult | null>(
    initialQuizResult || null
  );
  const [certificate, setCertificate] = useState<InitialCertificate | null>(
    initialCertificate || null
  );
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  // Generate QR Code if certificate exists
  useEffect(() => {
    if (certificate?.nomor) {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const verificationUrl = `${origin}/induction/${permit.id}/${member.id}`;
      QRCode.toDataURL(
        verificationUrl,
        {
          width: 160,
          margin: 1,
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
        },
        (err, url) => {
          if (!err && url) {
            setQrCodeUrl(url);
          }
        }
      );
    }
  }, [certificate, permit.id, member.id]);

  const handleSelectChoice = (quizId: string, choiceId: string) => {
    setAnswers((prev) => ({ ...prev, [quizId]: choiceId }));
  };

  const answeredCount = Object.keys(answers).length;
  const isAllAnswered = quizzes.length > 0 && answeredCount === quizzes.length;

  const handleSubmitQuiz = async () => {
    if (!isAllAnswered) {
      setErrorMessage("Harap jawab semua pertanyaan kuis sebelum mengirimkan!");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/induction/${member.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permitId: permit.id,
          answers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal memproses hasil ujian");
      }

      setQuizResult(data.quizResult);
      if (data.certificate) {
        setCertificate(data.certificate);
      }
      setActiveTab("result");
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRetake = () => {
    setAnswers({});
    setErrorMessage("");
    setActiveTab("material");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-sans">
      {/* Top Header / Branding Bar (hidden when printing) */}
      <header className="print:hidden bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight leading-tight">
                E-WP Safety Induction Hub
              </h1>
              <p className="text-xs text-slate-400">
                PT Pabrik Industri Mandiri • Keselamatan Kerja Adalah Prioritas Utama
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-white">{member.name}</span>
            <span className="text-slate-400">({member.position || "Teknisi"})</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Worker & Job Context Card (hidden on print) */}
        <div className="print:hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500 dark:text-zinc-400">Nama Pekerja:</span>
              <p className="font-semibold text-slate-900 dark:text-zinc-100 text-sm">
                {member.name}
              </p>
              {member.idCardNumber && (
                <span className="text-slate-400 text-[11px] block">NIK: {member.idCardNumber}</span>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 dark:text-zinc-400">Perusahaan / Rekanan:</span>
              <p className="font-semibold text-slate-900 dark:text-zinc-100 text-sm flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                {permit.vendorName}
              </p>
              <span className="text-slate-400 text-[11px] block">Peran: {member.position || "Teknisi Lapangan"}</span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 dark:text-zinc-400">Lokasi Penugasan:</span>
              <p className="font-semibold text-slate-900 dark:text-zinc-100 text-sm flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                {permit.location}
              </p>
              <span className="text-slate-400 text-[11px] block">Pekerjaan: {permit.workName}</span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 dark:text-zinc-400">No. Izin Kerja (Permit):</span>
              <p className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                {permit.nomor}
              </p>
              <span className="text-slate-400 text-[11px] block">Status: Wajib Induksi K3</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (hidden on print) */}
        <div className="print:hidden flex border-b border-slate-200 dark:border-zinc-800 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("material")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "material"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            1. Materi Induksi K3
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("quiz")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "quiz"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            2. Kuis Ujian ({answeredCount}/{quizzes.length})
          </button>

          {quizResult?.isCompleted && (
            <button
              type="button"
              onClick={() => setActiveTab("result")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "result"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400"
              }`}
            >
              <Award className="w-4 h-4" />
              3. e-Sertifikat &amp; Hasil
            </button>
          )}
        </div>

        {/* TAB 1: MATERI INDUKSI */}
        {activeTab === "material" && (
          <div className="space-y-6">
            {/* Banner Motivasi K3 */}
            <div className="bg-linear-to-r from-blue-700 to-indigo-800 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
              <div className="relative z-10 max-w-2xl space-y-2">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/20 uppercase tracking-wider">
                  Modul Pembelajaran K3 Mandiri
                </span>
                <h2 className="text-2xl font-black">
                  Zero Accident: Bekerja Selamat, Pulang Selamat
                </h2>
                <p className="text-blue-100 text-sm leading-relaxed">
                  Setiap rekanan kerja dan teknisi wajib memahami regulasi dasar keselamatan pabrik sebelum diizinkan memasuki area kerja. Bacalah poin-poin keselamatan berikut sebelum memulai kuis.
                </p>
              </div>
            </div>

            {/* 5 Golden Rules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                  <HardHat className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100">
                  1. APD Wajib &amp; Standar
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Wajib mengenakan Helm Pengaman (Safety Helmet chinstrap terpasang), Sepatu Safety berkepala baja, Rompi Reflektif, dan APD khusus sesuai risiko pekerjaan (kacamata gerinda, face shield, ear plug).
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 flex items-center justify-center font-bold">
                  <Flame className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100">
                  2. Izin Kerja Panas (Hot Work)
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Pekerjaan las, potong, dan gerinda wajib memiliki Permit Khusus Hot Work. Bersihkan bahan mudah terbakar dalam radius minimal 10-11 meter dan sediakan APAR yang siap pakai di samping titik kerja.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100">
                  3. Isolasi Energi &amp; LOTO
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Setiap pekerjaan perawatan mesin, motor, dan instalasi listrik bertegangan wajib mengaplikasikan gembok pengaman (Lockout) dan label peringatan (Tagout). Uji nol energi sebelum menyentuh mesin.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100">
                  4. Bekerja di Ketinggian (&gt; 1.8 Meter)
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Wajib menggunakan Full Body Harness dengan hook terpasang pada anchor point yang kokoh (100% tie-off). Perancah (scaffolding) harus bertag hijau inspeksi sebelum dinaiki.
                </p>
              </div>
            </div>

            {/* Prosedur Darurat */}
            <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500 text-white">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                    Prosedur Keadaan Darurat &amp; Evakuasi
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Jika mendengar sirine darurat kontinu berbunyi:
                  </p>
                </div>
              </div>

              <ul className="text-xs text-amber-900 dark:text-amber-200/90 list-disc list-inside space-y-1.5 pl-2 leading-relaxed">
                <li>Segera matikan peralatan kerja dan hentikan seluruh aktivitas pekerjaan.</li>
                <li>Tinggalkan lokasi kerja dengan tenang melalui jalur evakuasi hijau bertanda EXIT.</li>
                <li>Jangan gunakan lift; gunakan tangga darurat.</li>
                <li>Berkumpullah di Titik Kumpul (Assembly Point) terdekat untuk absensi regu.</li>
                <li>Nomor Darurat Emergency Pabrik: <strong>Ext. 112 / SHE Hotline: 0811-9988-000</strong></li>
              </ul>
            </div>

            {/* Action button to continue to quiz */}
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setActiveTab("quiz")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
              >
                <span>Saya Paham, Lanjut ke Kuis Evaluasi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: KUIS EVALUASI */}
        {activeTab === "quiz" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xs">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100">
                  Kuis Uji Pemahaman K3
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Jawab seluruh pertanyaan di bawah ini. Syarat kelulusan minimal: <strong>80% Benar</strong>.
                </p>
              </div>
              <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Terjawab: {answeredCount} dari {quizzes.length} Soal
              </div>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Question Cards */}
            <div className="space-y-5">
              {quizzes.map((quiz, qIdx) => (
                <div
                  key={quiz.id}
                  className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {qIdx + 1}
                    </span>
                    <p className="font-medium text-sm text-slate-900 dark:text-zinc-100 leading-relaxed">
                      {quiz.question}
                    </p>
                  </div>

                  {/* Choice Options */}
                  <div className="space-y-2.5 pl-10">
                    {quiz.choices.map((choice) => {
                      const isSelected = answers[quiz.id] === choice.id;
                      return (
                        <label
                          key={choice.id}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200 font-medium shadow-xs"
                              : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/60 text-slate-700 dark:text-zinc-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`quiz-${quiz.id}`}
                            value={choice.id}
                            checked={isSelected}
                            onChange={() => handleSelectChoice(quiz.id, choice.id)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                          />
                          <span className="leading-relaxed">{choice.text}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Quiz Action */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTab("material")}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Baca Ulang Materi
              </button>

              <button
                type="button"
                onClick={handleSubmitQuiz}
                disabled={!isAllAnswered || isSubmitting}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting ? "Memproses Jawaban..." : "Kirim Jawaban &amp; Selesaikan"}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: HASIL & E-SERTIFIKAT K3 */}
        {activeTab === "result" && (
          <div className="space-y-6">
            {quizResult && (
              <>
                {/* Result Announcement Card (hidden on print) */}
                <div
                  className={`print:hidden p-6 rounded-2xl border shadow-sm ${
                    quizResult.isPassed
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                      : "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {quizResult.isPassed ? (
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                          <Award className="w-7 h-7" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-7 h-7" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-extrabold text-lg">
                          {quizResult.isPassed
                            ? "LULUS SAFETY INDUCTION K3!"
                            : "BELUM MEMENUHI SYARAT KELULUSAN"}
                        </h3>
                        <p className="text-xs mt-1 opacity-90 leading-relaxed">
                          {quizResult.isPassed
                            ? "Selamat! Anda telah memenuhi standar kualifikasi keselamatan kerja dan berhak mendapatkan e-Sertifikat Safety Induction resmi."
                            : "Skor Anda belum mencapai ambang batas kelulusan minimum (80%). Silakan pelajari kembali modul materi keselamatan dan coba kembali kuis."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-center px-4 py-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                          Skor Ujian
                        </span>
                        <span
                          className={`text-2xl font-black ${
                            quizResult.isPassed ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {quizResult.score}/100
                        </span>
                      </div>

                      {quizResult.isPassed ? (
                        <button
                          type="button"
                          onClick={handlePrint}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold shadow-xs hover:opacity-90 transition-all cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                          Cetak / Simpan PDF
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRetake}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Ulangi Ujian
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* THE OFFICIAL E-CERTIFICATE (Printed cleanly or shown on screen) */}
                {quizResult.isPassed && certificate && (
                  <div
                    id="certificate-print-area"
                    className="relative bg-white text-slate-900 p-8 sm:p-12 rounded-3xl border-4 border-double border-slate-300 shadow-xl max-w-4xl mx-auto overflow-hidden"
                  >
                    {/* Decorative Corner Ornaments */}
                    <div className="absolute top-3 left-3 w-10 h-10 border-t-2 border-l-2 border-amber-600" />
                    <div className="absolute top-3 right-3 w-10 h-10 border-t-2 border-r-2 border-amber-600" />
                    <div className="absolute bottom-3 left-3 w-10 h-10 border-b-2 border-l-2 border-amber-600" />
                    <div className="absolute bottom-3 right-3 w-10 h-10 border-b-2 border-r-2 border-amber-600" />

                    {/* Certificate Header */}
                    <div className="text-center space-y-2 border-b-2 border-slate-200 pb-6">
                      <div className="inline-flex items-center justify-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <span className="font-extrabold tracking-widest text-xs uppercase text-blue-900">
                          SISTEM ELECTRONIC WORK PERMIT (e-WP)
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-slate-900 uppercase">
                        SERTIFIKAT KESELAMATAN KERJA (K3)
                      </h2>
                      <p className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-widest">
                        Safety Induction &amp; Working Competency Certificate
                      </p>
                      <p className="font-mono text-xs font-bold text-amber-700 pt-1">
                        Nomor Sertifikat: {certificate.nomor}
                      </p>
                    </div>

                    {/* Certificate Body */}
                    <div className="text-center py-8 space-y-4">
                      <p className="text-xs sm:text-sm text-slate-600 italic">
                        Dengan ini menerangkan bahwa teknisi rekanan di bawah ini:
                      </p>

                      <div className="space-y-1 py-2">
                        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
                          {member.name}
                        </h3>
                        {member.idCardNumber && (
                          <p className="text-xs text-slate-500 font-mono">
                            NIK / KTP: {member.idCardNumber}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-slate-700">
                          {member.position || "Teknisi Lapangan"} • {permit.vendorName}
                        </p>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                        Telah mengikuti seluruh rangkaian pembekalan serta dinyatakan{" "}
                        <strong className="text-emerald-700 uppercase font-black">
                          LULUS EVALUASI KESELAMATAN &amp; KESEHATAN KERJA (K3)
                        </strong>{" "}
                        dengan perolehan skor <strong>{quizResult.score}/100</strong>, dan memenuhi
                        syarat untuk bekerja pada area proyek:
                      </p>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 max-w-md mx-auto text-xs space-y-1">
                        <p className="font-semibold text-slate-800">
                          Izin Kerja: {permit.workName}
                        </p>
                        <p className="text-slate-500">
                          Nomor Permit: <span className="font-mono">{permit.nomor}</span> • Lokasi: {permit.location}
                        </p>
                      </div>
                    </div>

                    {/* Certificate Footer / Signatures & QR Code */}
                    <div className="grid grid-cols-3 items-center border-t border-slate-200 pt-6 mt-4">
                      {/* Left: Validity */}
                      <div className="text-left text-xs space-y-1 text-slate-600">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Masa Berlaku
                        </span>
                        <p className="font-semibold text-slate-800">
                          s/d{" "}
                          {new Date(certificate.expiredAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          STATUS: VALID / AKTIF
                        </span>
                      </div>

                      {/* Center: QR Code */}
                      <div className="flex flex-col items-center justify-center">
                        {qrCodeUrl ? (
                          <img
                            src={qrCodeUrl}
                            alt="QR Code Sertifikat"
                            className="w-24 h-24 border border-slate-300 p-1 rounded-lg shadow-2xs"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-slate-100 rounded-lg animate-pulse" />
                        )}
                        <span className="text-[9px] text-slate-400 font-mono mt-1">
                          Scan Verifikasi K3
                        </span>
                      </div>

                      {/* Right: Signature */}
                      <div className="text-right text-xs space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Disahkan Oleh:
                        </span>
                        <div className="h-10 flex items-center justify-end">
                          <span className="font-serif italic text-base text-blue-900 font-bold opacity-80 underline">
                            Safety Health Envt. Dept.
                          </span>
                        </div>
                        <p className="font-bold text-slate-800">SHE Department Head</p>
                        <p className="text-[10px] text-slate-500">PT Pabrik Industri Mandiri</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Print-specific style */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header,
          nav,
          .print\\:hidden {
            display: none !important;
          }
          #certificate-print-area {
            border: 2px solid #000 !important;
            box-shadow: none !important;
            max-width: 100% !important;
            margin: 0 !important;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
