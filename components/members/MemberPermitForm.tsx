"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Copy,
  Check,
  Award,
  ExternalLink,
  HeartPulse,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface QuizResult {
  id: string;
  score: number;
  isPassed: boolean;
  isCompleted: boolean;
  completedAt?: string | null;
}

interface Certificate {
  id: string;
  nomor: string;
  isValid: boolean;
  expiredAt: string;
}

interface MemberItem {
  id?: string;
  name: string;
  idCardNumber?: string | null;
  position?: string | null;
  phone?: string | null;
  isHealthy: boolean;
  quizResult?: QuizResult | null;
  certificate?: Certificate | null;
}

interface PermitInfo {
  id: string;
  nomor: string;
  workName: string;
  picVendor?: string | null;
  vendor?: { id: string; name: string };
}

interface MemberPermitFormProps {
  permit: PermitInfo;
  initialMembers: MemberItem[];
}

export function MemberPermitForm({
  permit,
  initialMembers,
}: MemberPermitFormProps) {
  const router = useRouter();

  const [picVendor, setPicVendor] = useState(permit.picVendor || "");
  const [members, setMembers] = useState<MemberItem[]>(
    initialMembers.length > 0
      ? initialMembers
      : [
          {
            name: "",
            idCardNumber: "",
            position: "",
            phone: "",
            isHealthy: true,
          },
        ]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const addMemberRow = () => {
    setMembers((prev) => [
      ...prev,
      {
        name: "",
        idCardNumber: "",
        position: "",
        phone: "",
        isHealthy: true,
      },
    ]);
  };

  const removeMemberRow = (index: number) => {
    if (members.length === 1) {
      alert("Minimal harus ada 1 anggota pekerja");
      return;
    }
    setMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMember = <K extends keyof MemberItem>(
    index: number,
    field: K,
    val: MemberItem[K]
  ) => {
    setMembers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleCopyLink = (memberId: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/induction/${permit.id}/${memberId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(memberId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!picVendor.trim()) {
      setErrorMessage("Nama PIC Vendor / Penanggung Jawab Lapangan wajib diisi");
      return;
    }

    for (let i = 0; i < members.length; i++) {
      if (!members[i].name.trim()) {
        setErrorMessage(`Nama pekerja pada baris ke-${i + 1} wajib diisi`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/permits/${permit.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          picVendor,
          members: members.map((m) => ({
            id: m.id,
            name: m.name,
            idCardNumber: m.idCardNumber || null,
            position: m.position || null,
            phone: m.phone || null,
            isHealthy: m.isHealthy,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal menyimpan data pekerja");
      }

      setSuccessMessage("Data anggota pekerja dan PIC berhasil disimpan!");
      if (data.members) {
        setMembers(data.members);
      }
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm flex items-center gap-3">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header Info Permit */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 mb-2">
              <Users className="w-3.5 h-3.5" />
              Modul Tenaga Kerja & Safety Induction
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {permit.workName}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Nomor Permit: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{permit.nomor}</span>
              {permit.vendor?.name && ` • Vendor: ${permit.vendor.name}`}
            </p>
          </div>
          <Link
            href="/vendor"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Vendor Hub
          </Link>
        </div>
      </div>

      {/* Section PIC Vendor */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-1">
          <UserCheck className="w-5 h-5 text-blue-600" />
          Penanggung Jawab / PIC Vendor di Lapangan
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          Masukkan nama penanggung jawab atau supervisor teknis dari pihak vendor yang bertanggung jawab langsung di lokasi kerja.
        </p>

        <div className="max-w-md">
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Nama PIC Vendor <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={picVendor}
            onChange={(e) => setPicVendor(e.target.value)}
            placeholder="Contoh: Budi Santoso (Site Supervisor)"
            className="w-full px-4 py-2.5 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Section Anggota Pekerja */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Daftar Tenaga Kerja / Teknisi Lapangan ({members.length} Orang)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Daftarkan seluruh teknisi atau helper yang akan bekerja. Setiap pekerja wajib mengikuti Kuis Safety Induction mandiri.
            </p>
          </div>
          <button
            type="button"
            onClick={addMemberRow}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Pekerja
          </button>
        </div>

        <div className="space-y-4 mt-4">
          {members.map((member, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 relative space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {idx + 1}
                </span>

                <div className="flex items-center gap-2">
                  {/* Induction Status Badge if member has been saved */}
                  {member.id && (
                    <>
                      {member.quizResult?.isCompleted ? (
                        member.quizResult.isPassed ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <Award className="w-3.5 h-3.5" />
                            Lulus Induction ({member.quizResult.score}/100)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border border-red-300 dark:border-red-800">
                            Tidak Lulus ({member.quizResult.score}/100)
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          Belum Induction
                        </span>
                      )}
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => removeMemberRow(idx)}
                    className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    title="Hapus pekerja ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Form Input Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={member.name}
                    onChange={(e) => updateMember(idx, "name", e.target.value)}
                    placeholder="Nama pekerja"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    No. KTP / NIK
                  </label>
                  <input
                    type="text"
                    value={member.idCardNumber || ""}
                    onChange={(e) => updateMember(idx, "idCardNumber", e.target.value)}
                    placeholder="16 digit NIK KTP"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Posisi / Peran
                  </label>
                  <input
                    type="text"
                    value={member.position || ""}
                    onChange={(e) => updateMember(idx, "position", e.target.value)}
                    placeholder="Contoh: Welder, Fitter, Helper"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    No. Telepon / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={member.phone || ""}
                    onChange={(e) => updateMember(idx, "phone", e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Status Sehat & Induction Share Link */}
              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={member.isHealthy}
                    onChange={(e) => updateMember(idx, "isHealthy", e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-zinc-300 dark:border-zinc-700"
                  />
                  <HeartPulse className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    Kondisi Sehat, Bebas Narkoba & Siap Bekerja
                  </span>
                </label>

                {member.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(member.id!)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
                    >
                      {copiedId === member.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Tautan Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Tautan Induction</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`/induction/${permit.id}/${member.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-medium transition-colors"
                    >
                      <span>Buka Ujian</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <span className="text-zinc-400 italic">
                    Simpan formulir terlebih dahulu untuk menghasilkan tautan ujian induction pekerja ini.
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <Link
          href="/vendor"
          className="px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Kembali
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm shadow-xs transition-colors"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? "Menyimpan..." : "Simpan Data Pekerja"}
        </button>
      </div>
    </form>
  );
}
