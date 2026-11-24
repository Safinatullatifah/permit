"use client"

import { useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  FileCheck,
  FileSpreadsheet,
  MapPin,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
  XCircle,
} from "lucide-react"
import type { PermitRow } from "./PermitTable"
import PermitStepper from "./PermitStepper"
import PermitStatusBadge from "./PermitStatusBadge"
import { PermitChatBox } from "@/components/chat/PermitChatBox"

interface PermitDetailModalProps {
  permit: PermitRow
  onClose: () => void
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

export default function PermitDetailModal({ permit, onClose }: PermitDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"detail" | "chat">("detail")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-lg">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">{permit.nomor}</h3>
                <PermitStatusBadge status={permit.status} isHighRisk={permit.isHighRisk} />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{permit.workName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50/60 px-6 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("detail")}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === "detail"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Detail Permit &amp; Stepper
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "chat"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ruang Diskusi (Chat)</span>
          </button>
        </div>

        {/* Content */}
        {activeTab === "chat" ? (
          <div className="p-4 flex-1 overflow-hidden bg-gray-50/30">
            <PermitChatBox
              permitId={permit.id}
              permitNomor={permit.nomor}
              workName={permit.workName}
            />
          </div>
        ) : (
          <div className="p-6 space-y-6 overflow-y-auto">
          {/* 4-Step Stepper Component */}
          <PermitStepper permit={permit} />

          {/* Grid Informasi Utama */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Box 1: Detail Pekerjaan & Lokasi */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5">
              <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] pb-1 border-b border-gray-200">
                Informasi Pekerjaan &amp; Lokasi
              </h4>
              <div className="flex items-start gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-gray-400">Lokasi Kerja:</div>
                  <div className="font-semibold text-gray-900">{permit.location}</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-gray-700">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-gray-400">Periode Pelaksanaan:</div>
                  <div className="font-medium text-gray-900">
                    {formatDate(permit.startDate)} s/d {formatDate(permit.endDate)}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-gray-700">
                <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-gray-400">Vendor Pelaksana:</div>
                  <div className="font-semibold text-gray-900">{permit.vendor.name}</div>
                </div>
              </div>
              {permit.isHighRisk && (
                <div className="flex items-center gap-1.5 p-2 bg-red-50 border border-red-200 rounded text-red-700 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  Kategori Pekerjaan: Risiko Tinggi (High Risk)
                </div>
              )}
            </div>

            {/* Box 2: Dokumen & Stakeholder */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5">
              <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] pb-1 border-b border-gray-200">
                Dokumen Komersial &amp; PIC
              </h4>
              <div className="space-y-1">
                <div className="text-gray-400">Dasar Pengadaan / Dokumen:</div>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {permit.poNumber && (
                    <span className="font-mono bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded font-medium">
                      PO: {permit.poNumber}
                    </span>
                  )}
                  {permit.spkNumber && (
                    <span className="font-mono bg-blue-100 text-blue-800 px-2.5 py-1 rounded font-medium">
                      SPK: {permit.spkNumber}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2 text-gray-700 pt-1">
                <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-gray-400">Pemohon Internal (User):</div>
                  <div className="font-semibold text-gray-900">{permit.user.full_name}</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-gray-700">
                <ShieldCheck className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-gray-400">PIC Area / Penanggung Jawab:</div>
                  <div className="font-semibold text-gray-900">{permit.pic.full_name}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Verifikasi & Catatan */}
          <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-3 text-xs">
            <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] pb-1 border-b border-gray-200">
              Riwayat Verifikasi Bertingkat
            </h4>

            <div className="space-y-2">
              {/* Verifikasi Awal PIC */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50/70">
                <div className="space-y-0.5">
                  <div className="font-semibold text-gray-900">1. Verifikasi Awal Kelayakan Area (PIC)</div>
                  {permit.remarkPic && (
                    <div className="text-gray-600 italic">&ldquo;{permit.remarkPic}&rdquo;</div>
                  )}
                </div>
                <div>
                  {permit.picVerified === true ? (
                    <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2.5 py-1 rounded border border-green-200 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui
                    </span>
                  ) : permit.picVerified === false ? (
                    <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2.5 py-1 rounded border border-red-200 font-medium">
                      <XCircle className="w-3.5 h-3.5" /> Ditolak
                    </span>
                  ) : (
                    <span className="text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Menunggu</span>
                  )}
                </div>
              </div>

              {/* Verifikasi Tahap 2: LP (PO) atau PIC Teknis (SPK) */}
              {permit.poNumber ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50/70">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-gray-900">2. Verifikasi Legalitas &amp; PO (LP)</div>
                    {permit.remarkLp && (
                      <div className="text-gray-600 italic">&ldquo;{permit.remarkLp}&rdquo;</div>
                    )}
                  </div>
                  <div>
                    {permit.lpVerified === true ? (
                      <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2.5 py-1 rounded border border-green-200 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui
                      </span>
                    ) : permit.lpVerified === false ? (
                      <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2.5 py-1 rounded border border-red-200 font-medium">
                        <XCircle className="w-3.5 h-3.5" /> Ditolak
                      </span>
                    ) : (
                      <span className="text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Menunggu</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50/70">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-gray-900">2. Verifikasi Teknis Lapangan SPK (PIC)</div>
                    {permit.remarkUser && (
                      <div className="text-gray-600 italic">&ldquo;{permit.remarkUser}&rdquo;</div>
                    )}
                  </div>
                  <div>
                    {permit.userVerified === true ? (
                      <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2.5 py-1 rounded border border-green-200 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui
                      </span>
                    ) : permit.userVerified === false ? (
                      <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2.5 py-1 rounded border border-red-200 font-medium">
                        <XCircle className="w-3.5 h-3.5" /> Ditolak
                      </span>
                    ) : (
                      <span className="text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Menunggu</span>
                    )}
                  </div>
                </div>
              )}

              {/* Verifikasi Tahap 3: Approval Akhir SHE */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50/70">
                <div className="space-y-0.5">
                  <div className="font-semibold text-gray-900">3. Persetujuan Akhir Otoritas Keselamatan (SHE)</div>
                  {permit.remarkShe && (
                    <div className="text-gray-600 italic">&ldquo;{permit.remarkShe}&rdquo;</div>
                  )}
                </div>
                <div>
                  {permit.status === "OPEN" || permit.status === "CLOSED" ? (
                    <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2.5 py-1 rounded border border-green-200 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui (OPEN)
                    </span>
                  ) : permit.status === "REJECTED" ? (
                    <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2.5 py-1 rounded border border-red-200 font-medium">
                      <XCircle className="w-3.5 h-3.5" /> Ditolak
                    </span>
                  ) : (
                    <span className="text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Menunggu</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-200 bg-gray-50">
          <Link
            href={`/vendor/permits/${permit.id}/jsa`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Buka Dokumen JSA &amp; Peralatan
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 rounded-md border border-gray-300 bg-white hover:bg-gray-100 transition shadow-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
