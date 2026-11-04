"use client";

import { motion } from "framer-motion";
import { 
  BarChart3, FileText, Scale, Fence, Home, 
  AlertTriangle, TrendingUp, ArrowUpRight 
} from "lucide-react";
import Link from "next/link";

export interface DimensionMetric {
  key: string;
  label: string;
  sublabel: string;
  iconName: "admin" | "legal" | "fisik" | "penguasaan" | "sengketa" | "strategis";
  avgScore: number; // 1.0 - 5.0
  lowCount: number;
  medCount: number;
  highCount: number;
}

interface SixDimensionRiskChartProps {
  dimensions: DimensionMetric[];
  totalAset: number;
}

export default function SixDimensionRiskChart({
  dimensions,
}: SixDimensionRiskChartProps) {
  // Singkatan nama dimensi untuk label sumbu X
  const shortLabels: Record<string, string> = {
    administrasi: "Admin",
    legal: "Legal",
    fisik: "Fisik",
    penguasaan: "Kuasa",
    sengketa: "Sengketa",
    strategis: "Strategis",
  };

  const overallAvg = dimensions.length > 0 
    ? (dimensions.reduce((acc, d) => acc + d.avgScore, 0) / dimensions.length).toFixed(1)
    : "1.0";

  const getScoreColor = (score: number) => {
    if (score >= 4.0) return { bar: "from-rose-500 to-red-600", text: "text-rose-600", badge: "bg-rose-50 text-rose-700 border-rose-200" };
    if (score >= 3.0) return { bar: "from-orange-500 to-amber-500", text: "text-orange-600", badge: "bg-orange-50 text-orange-700 border-orange-200" };
    if (score >= 2.0) return { bar: "from-amber-400 to-yellow-500", text: "text-amber-600", badge: "bg-amber-50 text-amber-700 border-amber-200" };
    return { bar: "from-emerald-500 to-teal-400", text: "text-emerald-600", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "admin": return <FileText className="w-3.5 h-3.5 text-blue-600" />;
      case "legal": return <Scale className="w-3.5 h-3.5 text-indigo-600" />;
      case "fisik": return <Fence className="w-3.5 h-3.5 text-emerald-600" />;
      case "penguasaan": return <Home className="w-3.5 h-3.5 text-cyan-600" />;
      case "sengketa": return <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />;
      case "strategis": return <TrendingUp className="w-3.5 h-3.5 text-purple-600" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-full min-h-[380px]">
      {/* Header Card */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 truncate">
              Profil Risiko 6 Dimensi
            </h4>
          </div>

          <Link
            href="/dashboard/tanah?dimensi=all"
            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5 shrink-0"
            title="Lihat seluruh aset beserta rincian skor 6 dimensi"
          >
            Sumber Data <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
          <p className="text-[11px] text-slate-400 truncate">
            Klik balok dimensi untuk melihat data aset sumber
          </p>
          <span className="font-mono font-bold text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[10px]">
            Rata-rata: {overallAvg}
          </span>
        </div>
      </div>

      {/* Chart Area: Balok Berdiri (Vertical Columns) */}
      <div className="relative flex-1 flex flex-col justify-end pt-4 pb-1">
        {/* Y-Axis Grid Lines (5, 4, 3, 2, 1) */}
        <div className="absolute inset-x-0 inset-y-4 flex flex-col justify-between pointer-events-none opacity-40">
          {[5, 4, 3, 2, 1].map((val) => (
            <div key={val} className="w-full flex items-center gap-2">
              <span className="text-[9px] font-mono text-slate-400 w-3 text-right shrink-0">
                {val}
              </span>
              <div className="w-full border-t border-slate-200 border-dashed" />
            </div>
          ))}
        </div>

        {/* 6 Standing Columns (Balok Berdiri) */}
        <div className="relative pl-6 pr-2 h-44 flex items-end justify-between gap-2 z-10">
          {dimensions.map((dim, idx) => {
            const colors = getScoreColor(dim.avgScore);
            // Skala 0 s.d 5 -> Persentase tinggi balok (skor 1 = 20%, skor 5 = 100%)
            const heightPercent = Math.min(100, Math.max(12, (dim.avgScore / 5) * 100));

            return (
              <Link
                key={dim.key}
                href={`/dashboard/tanah?dimensi=${encodeURIComponent(dim.key)}`}
                className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer focus:outline-none"
                title={`Klik untuk melihat rincian aset pada ${dim.label}`}
              >
                {/* Score floating on top of column */}
                <motion.span 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.08 + 0.3 }}
                  className={`text-[11px] font-mono font-extrabold mb-1.5 transition-transform group-hover:scale-110 ${colors.text}`}
                >
                  {dim.avgScore.toFixed(1)}
                </motion.span>

                {/* Vertical Column Bar */}
                <div className="w-full max-w-[36px] bg-slate-100 group-hover:bg-blue-50/80 rounded-t-lg overflow-hidden flex flex-col justify-end h-36 p-0.5 relative transition-colors ring-0 group-hover:ring-2 group-hover:ring-blue-400/50">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.08, ease: "easeOut" }}
                    className={`w-full rounded-t-md bg-gradient-to-t ${colors.bar} shadow-xs group-hover:brightness-110 transition-all cursor-pointer`}
                  />
                </div>

                {/* Hover Tooltip Popup */}
                <div className="absolute bottom-full mb-8 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none w-48">
                  <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-center border border-slate-800 space-y-1 w-full">
                    <p className="font-bold text-xs">{dim.label}</p>
                    <p className="text-[10px] text-slate-300 font-mono">
                      Skor Rata-Rata: <strong className="text-white">{dim.avgScore.toFixed(1)} / 5.0</strong>
                    </p>
                    <p className="text-[9px] text-slate-400 leading-tight">
                      {dim.sublabel}
                    </p>
                    <p className="text-[9px] font-bold text-blue-400 pt-1 border-t border-slate-800 flex items-center justify-center gap-0.5">
                      Klik untuk lihat daftar aset <ArrowUpRight className="w-2.5 h-2.5" />
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
                </div>

                {/* X-Axis Label */}
                <div className="mt-2 text-center flex flex-col items-center">
                  <span className="p-1 rounded bg-slate-50 border border-slate-100 mb-0.5 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                    {getIcon(dim.iconName)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-700 group-hover:text-blue-600 block truncate max-w-[48px] transition-colors">
                    {shortLabels[dim.key] || dim.key}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Legend Ringkas (Satu Baris Kompak & Bisa Diklik) */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
        <Link
          href="/dashboard/tanah?risiko=aman"
          className="flex items-center gap-1 hover:text-emerald-700 hover:underline px-1.5 py-0.5 rounded hover:bg-emerald-50 transition-colors"
          title="Filter aset dengan tingkat risiko Rendah / Aman"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Aman (1-2)</span>
        </Link>
        <Link
          href="/dashboard/tanah?risiko=sedang"
          className="flex items-center gap-1 hover:text-amber-700 hover:underline px-1.5 py-0.5 rounded hover:bg-amber-50 transition-colors"
          title="Filter aset dengan tingkat risiko Sedang"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Sedang (3)</span>
        </Link>
        <Link
          href="/dashboard/tanah?risiko=kritis"
          className="flex items-center gap-1 hover:text-rose-700 hover:underline px-1.5 py-0.5 rounded hover:bg-rose-50 transition-colors"
          title="Filter aset dengan tingkat risiko Tinggi / Sangat Tinggi"
        >
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Kritis (4-5)</span>
        </Link>
      </div>
    </div>
  );
}
