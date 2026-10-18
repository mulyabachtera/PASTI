"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { 
  TrendingUp, AlertTriangle, Activity, Map as MapIcon, 
  ShieldAlert, ArrowUpRight, Landmark, Layers
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import DonutChart, { DonutSlice } from "@/components/dashboard/DonutChart";
import SixDimensionRiskChart, { DimensionMetric } from "@/components/dashboard/SixDimensionRiskChart";

const MapComponent = dynamic(() => import("@/components/MapComponent"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 rounded-2xl min-h-[440px]">
      <Activity className="w-8 h-8 text-blue-500 animate-pulse mb-3" />
      <p className="text-slate-500 font-medium text-sm">Memuat Modul Peta Spasial Live...</p>
    </div>
  )
});

interface UrgentAction {
  id: string;
  idTanah: string;
  namaBarang: string;
  nibar: string;
  kategoriRisiko: string;
  deskripsiRisiko: string;
  skorTotal: number;
  tingkatRisiko: string;
}

interface DashboardClientProps {
  totalAset: number;
  totalLuas: number;
  totalNilai: number;
  totalRisiko: number;
  legalitasData: DonutSlice[];
  hakData: DonutSlice[];
  riskLevels: {
    extreme: number;
    high: number;
    medium: number;
    low: number;
  };
  sixDimensions: DimensionMetric[];
  urgentActions: UrgentAction[];
}

export default function DashboardClient({
  totalAset,
  totalLuas,
  totalNilai,
  totalRisiko,
  legalitasData,
  hakData,
  riskLevels,
  sixDimensions,
  urgentActions,
}: DashboardClientProps) {
  const { data: session } = useSession();

  const stats = [
    { 
      title: "Total Aset Lahan", 
      value: totalAset.toString(), 
      sub: "Bidang tanah terdata", 
      icon: MapIcon, 
      color: "text-blue-600", 
      bg: "bg-blue-100",
      href: "/dashboard/tanah"
    },
    { 
      title: "Risiko Extreme", 
      value: riskLevels.extreme.toString(), 
      sub: riskLevels.extreme > 0 ? "Memerlukan eskalasi segera" : "Semua aset dalam mitigasi", 
      icon: AlertTriangle, 
      color: "text-rose-600", 
      bg: "bg-rose-100",
      href: "/dashboard/risk"
    },
    { 
      title: "Total Luas Lahan", 
      value: totalLuas > 10000 ? `${(totalLuas / 10000).toFixed(1)} Ha` : `${totalLuas.toLocaleString("id-ID")} m²`, 
      sub: `${totalLuas.toLocaleString("id-ID")} m² terdaftar`, 
      icon: Layers, 
      color: "text-emerald-600", 
      bg: "bg-emerald-100",
      href: "/dashboard/tanah"
    },
    { 
      title: "Estimasi Nilai Aset", 
      value: totalNilai > 0 ? `Rp ${(totalNilai / 1000000000).toFixed(1)} M` : "Rp 0", 
      sub: "Berdasarkan KIB A", 
      icon: Landmark, 
      color: "text-indigo-600", 
      bg: "bg-indigo-100",
      href: "/dashboard/tanah"
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. WELCOME HEADER BANNER */}
      <div className="bg-white p-4 sm:p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6 relative overflow-hidden">
        <div className="flex items-center gap-3.5 sm:gap-4 md:gap-5 min-w-0">
          <div className="relative shrink-0">
            <img 
              src="/pasti-logo.png" 
              alt="Logo PASTI" 
              className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-2xl object-contain p-1 bg-gradient-to-br from-slate-50 to-emerald-50/50 border border-slate-200/80 shadow-md shadow-emerald-500/5 hover:scale-105 transition-transform" 
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg md:text-xl xl:text-2xl font-extrabold text-slate-800 tracking-tight whitespace-nowrap flex items-center gap-1.5">
              <span>Selamat datang kembali,</span>
              <span className="text-slate-900">{session?.user?.name || "Super Admin PASTI"}!</span>
              <span className="inline-block hover:scale-110 transition-transform text-lg md:text-xl">👋</span>
            </h3>
            <p className="text-slate-500 mt-1 text-xs sm:text-sm leading-relaxed">
              Ringkasan analitik komposisi aset, pemetaan spasial terintegrasi, dan pemantauan risiko real-time.
            </p>
          </div>
        </div>

        {/* Kontrol Kanan: Toggle/Status Koneksi Spasial di Atas + Identifikasi Risiko */}
        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
          <div className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-[10px] font-semibold flex items-center gap-1.5 shadow-xs shrink-0 whitespace-nowrap">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            Koneksi Spasial Aktif
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-nowrap">
            <Link
              href="/dashboard/tanah/new"
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs whitespace-nowrap"
            >
              + Tambah Aset Baru
            </Link>
            <Link
              href="/dashboard/risk/new"
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              + Identifikasi Risiko
            </Link>
          </div>
        </div>
      </div>

      {/* 2. STATS KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            key={i} 
          >
            <Link 
              href={stat.href}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all block group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{stat.title}</p>
                  <h4 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">{stat.value}</h4>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform shadow-xs`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">{stat.sub}</span>
                <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
                  Detail <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* 3. PETA SPASIAL LIVE & TINDAKAN MENDESAK (Tepat di Bawah KPI Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Peta Spasial Live (2 Kolom) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[500px] flex flex-col relative z-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-blue-600" /> Peta Spasial Geografis Aset (Live WebGIS)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Visualisasi batas poligon tanah terdaftar di atas citra satelit resolusi tinggi.
              </p>
            </div>
            <Link
              href="/dashboard/tanah"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              Lihat Master Aset <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex-1 w-full rounded-2xl overflow-hidden relative border border-slate-100 min-h-[400px]">
            <MapComponent />
          </div>
        </div>
        
        {/* Tindakan Mendesak (Urgent Escalation) & Aktivitas (1 Kolom) */}
        <div className="space-y-6">
          {/* Tindakan Mendesak Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <ShieldAlert className="w-4 h-4 text-rose-600" /> Tindakan Mendesak Pimpinan
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                Prioritas
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Kasus sengketa dan risiko level Extreme/High yang memerlukan persetujuan Action Plan.
            </p>

            {urgentActions.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center text-xs text-emerald-800">
                <span className="font-bold">Tidak ada risiko kritis!</span> Seluruh aset dalam status aman terkendali.
              </div>
            ) : (
              <div className="space-y-3">
                {urgentActions.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-black tracking-wide uppercase">
                          {item.tingkatRisiko} (Skor {item.skorTotal})
                        </span>
                        <h5 className="font-bold text-slate-900 text-xs mt-1.5">{item.namaBarang}</h5>
                        <p className="text-[11px] text-slate-400 font-mono">{item.nibar}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 italic">
                      "{item.deskripsiRisiko}"
                    </p>
                    <div className="pt-2 border-t border-rose-200/50 flex justify-end">
                      <Link
                        href={`/dashboard/tanah/${item.idTanah}`}
                        className="text-[11px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 hover:underline"
                      >
                        Tinjau Lokasi & Mitigasi <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Log Aktivitas Terkini */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-600" /> Log Aktivitas Sistem
            </h3>
            <div className="space-y-3.5">
              <div className="flex gap-3 text-xs">
                <div className="w-2 h-2 mt-1 rounded-full bg-emerald-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800">Kalkulasi Otomatis Luas & Risiko</p>
                  <p className="text-slate-400 text-[11px]">Integrasi koordinat poligon PostGIS aktif</p>
                </div>
              </div>
              <div className="flex gap-3 text-xs">
                <div className="w-2 h-2 mt-1 rounded-full bg-rose-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800">Sinkronisasi Parameter Lapangan</p>
                  <p className="text-slate-400 text-[11px]">Metodologi Prototype PASTI v3.0</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ANALITIK KOMPOSISI & PROFIL RISIKO 6 DIMENSI (Baris 3 Kolom Kompak) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" /> Analitik Profil Risiko & Komposisi Aset
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Grafik balok berdiri 6 dimensi risiko, status sertifikasi BPN, dan kepemilikan jenis hak tanah.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Kolom 1: Chart Balok Berdiri Profil Risiko 6 Dimensi */}
          <SixDimensionRiskChart
            dimensions={sixDimensions}
            totalAset={totalAset}
          />

          {/* Kolom 2: Grafik Donat Status Legalitas */}
          <DonutChart
            title="Komposisi Status Legalitas"
            subtitle="Distribusi kepemilikan sertifikat resmi tanah"
            data={legalitasData}
            centerLabel="Aset Tanah"
          />

          {/* Kolom 3: Grafik Donat Jenis Hak Atas Tanah */}
          <DonutChart
            title="Komposisi Jenis Hak"
            subtitle="Proporsi hak pakai, pengelolaan, & hak milik"
            data={hakData}
            centerLabel="Total Bidang"
          />
        </div>
      </div>

    </div>
  );
}
