"use client";

import React from "react";
import Link from "next/link";
import { 
  FileSpreadsheet, 
  ShieldAlert, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Layers, 
  MapPin,
  FilePlus,
  AlertTriangle
} from "lucide-react";

interface FasePlaceholderProps {
  type: "tanah" | "risk" | "form-tanah" | "form-risk";
}

export default function FasePlaceholder({ type }: FasePlaceholderProps) {
  const isTanah = type === "tanah" || type === "form-tanah";
  const isForm = type === "form-tanah" || type === "form-risk";

  let config = {
    title: "",
    tag: "",
    icon: FileSpreadsheet,
    accentColor: "blue",
    description: "",
    milestones: [] as { label: string; status: "completed" | "in-progress" | "upcoming" }[],
    primaryBack: { label: "Kembali ke Dashboard Spasial", href: "/dashboard" },
    secondaryBack: null as { label: string; href: string } | null,
  };

  if (type === "form-tanah") {
    config = {
      title: "Formulir Perekaman Aset Tanah Baru",
      tag: "MODUL INPUT DATA • TAHAP PEMBUATAN",
      icon: FilePlus,
      accentColor: "blue",
      description:
        "Formulir input data tanah baru, integrasi poligon spasial interaktif, dan upload dokumen digital saat ini sedang dalam tahap penyempurnaan alur validasi. Anda dapat meninjau inventarisasi aset yang telah terdaftar pada menu Master Data Tanah atau Dashboard Utama.",
      milestones: [
        { label: "Validasi Skema Data KIB A & Standar Permendagri", status: "completed" },
        { label: "Otomasi Kalkulasi Poligon & Upload Berkas Dokumen", status: "in-progress" },
        { label: "Sinkronisasi Validasi Lapangan & Integrasi Koordinat BPN", status: "upcoming" },
      ],
      primaryBack: { label: "Kembali ke Master Data Tanah", href: "/dashboard/tanah" },
      secondaryBack: { label: "Dashboard Spasial", href: "/dashboard" },
    };
  } else if (type === "form-risk") {
    config = {
      title: "Formulir Identifikasi Risiko Aset Baru",
      tag: "MODUL ANALISIS RISIKO • TAHAP PEMBUATAN",
      icon: AlertTriangle,
      accentColor: "rose",
      description:
        "Formulir identifikasi risiko baru dan pembobotan matriks 6-dimensi ISO 31000 saat ini sedang dalam proses penyelarasan skala probabilitas serta dampak instansi. Anda dapat memantau risiko aset yang sedang berjalan melalui menu Risk Register atau Dashboard Utama.",
      milestones: [
        { label: "Penetapan Matriks 6-Dimensi Risiko Aset", status: "completed" },
        { label: "Otomasi Penilaian Skor Dampak & PIC Lapangan", status: "in-progress" },
        { label: "Workflow Eskalasi Satgas Penanganan Aset", status: "upcoming" },
      ],
      primaryBack: { label: "Kembali ke Risk Register", href: "/dashboard/risk" },
      secondaryBack: { label: "Dashboard Spasial", href: "/dashboard" },
    };
  } else if (type === "tanah") {
    config = {
      title: "Master Inventarisasi & Digitalisasi Tanah",
      tag: "MODUL OPERASIONAL • FASE 2",
      icon: FileSpreadsheet,
      accentColor: "blue",
      description:
        "Modul pengelolaan tabular data tanah, digitalisasi sertifikat warkah, dan riwayat mutasi saat ini sedang disiapkan untuk integrasi operasional. Seluruh ringkasan analitik dan sebaran spasial dapat Anda tinjau langsung pada Dashboard Utama.",
      milestones: [
        { label: "Validasi Struktur KIB A & Parameter Spasial", status: "completed" },
        { label: "Penyusunan Form Input Terpadu & Upload Dokumen", status: "in-progress" },
        { label: "Sinkronisasi Layer Koordinat & Validasi Lapangan", status: "upcoming" },
      ],
      primaryBack: { label: "Kembali ke Dashboard Spasial", href: "/dashboard" },
      secondaryBack: null,
    };
  } else {
    config = {
      title: "Risk Register & Matriks Pengendalian Risiko",
      tag: "AUDIT & ANALISIS • FASE 2",
      icon: ShieldAlert,
      accentColor: "rose",
      description:
        "Modul pencatatan audit rinci, rencana aksi mitigasi per bidang, dan log penanganan risiko hukum/sosial sedang dalam tahap kalibrasi matriks bobot. Parameter risiko real-time dan peringkat aset kritis saat ini dapat ditinjau melalui Dashboard Utama.",
      milestones: [
        { label: "Konsep Matriks 6-Dimensi Risiko Aset", status: "completed" },
        { label: "Kalibrasi Bobot Dampak, Kemungkinan & Audit Trail", status: "in-progress" },
        { label: "Otomasi Tindak Lanjut & Monitoring Satgas", status: "upcoming" },
      ],
      primaryBack: { label: "Kembali ke Dashboard Spasial", href: "/dashboard" },
      secondaryBack: null,
    };
  }

  const IconComponent = config.icon;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden relative">
        {/* Top Decorative Header Accent */}
        <div className={`h-2.5 w-full ${isTanah ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500" : "bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500"}`} />

        <div className="p-8 sm:p-12 text-center flex flex-col items-center">
          {/* Badge Status */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-slate-100 text-slate-700 border border-slate-200 mb-6">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isTanah ? "bg-blue-400" : "bg-rose-400"} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isTanah ? "bg-blue-500" : "bg-rose-500"}`}></span>
            </span>
            {config.tag}
          </div>

          {/* Center Visual Icon */}
          <div className="relative mb-6">
            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg ${isTanah ? "bg-blue-50 text-blue-600 border border-blue-100 shadow-blue-500/10" : "bg-rose-50 text-rose-600 border border-rose-100 shadow-rose-500/10"}`}>
              <IconComponent className="w-12 h-12" />
            </div>
            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center shadow-md font-bold text-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            {config.title}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-500 max-w-2xl leading-relaxed">
            {config.description}
          </p>

          {/* Roadmap / Progress Box */}
          <div className="w-full mt-8 p-6 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-left">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" /> Tahapan Pengembangan:
            </h4>
            
            <div className="space-y-3">
              {config.milestones.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs sm:text-sm p-3 rounded-xl bg-white border border-slate-200/60 shadow-xs">
                  <div className="flex items-center gap-3">
                    {m.status === "completed" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    {m.status === "in-progress" && (
                      <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin shrink-0" />
                    )}
                    {m.status === "upcoming" && (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                    )}
                    <span className={`font-medium ${m.status === "completed" ? "text-slate-800" : m.status === "in-progress" ? "text-blue-700 font-semibold" : "text-slate-400"}`}>
                      {m.label}
                    </span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                    m.status === "completed"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : m.status === "in-progress"
                      ? "bg-blue-50 text-blue-700 border border-blue-200 animate-pulse"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}>
                    {m.status === "completed" ? "Selesai Disepakati" : m.status === "in-progress" ? "Dalam Penyiapan" : "Fase Selanjutnya"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href={config.primaryBack.href}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 hover:scale-[1.02]"
            >
              <ArrowLeft className="w-4 h-4" /> {config.primaryBack.label}
            </Link>

            {config.secondaryBack && (
              <Link
                href={config.secondaryBack.href}
                className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              >
                {config.secondaryBack.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
