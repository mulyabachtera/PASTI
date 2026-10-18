"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ShieldCheck, DollarSign, ArrowUpRight, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface RiskBarProps {
  extremeCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  teranggarkanRp?: number;
  diusulkanRp?: number;
}

export default function RiskBarChart({
  extremeCount,
  highCount,
  mediumCount,
  lowCount,
  teranggarkanRp = 150000000,
  diusulkanRp = 350000000,
}: RiskBarProps) {
  const totalRisks = extremeCount + highCount + mediumCount + lowCount;

  const riskLevels = [
    {
      label: "EXTREME (16-25)",
      count: extremeCount,
      color: "bg-rose-500",
      textColor: "text-rose-600",
      bgLight: "bg-rose-50",
      desc: "Tindakan wajib <= 7 hari",
    },
    {
      label: "HIGH (10-15)",
      count: highCount,
      color: "bg-orange-500",
      textColor: "text-orange-600",
      bgLight: "bg-orange-50",
      desc: "Mitigasi prioritas pimpinan",
    },
    {
      label: "MEDIUM (5-9)",
      count: mediumCount,
      color: "bg-amber-500",
      textColor: "text-amber-600",
      bgLight: "bg-amber-50",
      desc: "Pemantauan tiap 180 hari",
    },
    {
      label: "LOW (1-4)",
      count: lowCount,
      color: "bg-emerald-500",
      textColor: "text-emerald-600",
      bgLight: "bg-emerald-50",
      desc: "Risiko aman & terkendali",
    },
  ];

  const totalBiaya = teranggarkanRp + diusulkanRp;
  const persenTeranggarkan = totalBiaya > 0 ? Math.round((teranggarkanRp / totalBiaya) * 100) : 0;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="min-w-0 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0 text-rose-500 shadow-2xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 truncate">
              Profil Risiko & Mitigasi
            </h4>
          </div>

          <Link
            href="/dashboard/risk"
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex-shrink-0 whitespace-nowrap"
            title="Buka Pangkalan Data Risk Register Lengkap"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-blue-200 group-hover:text-white transition-colors" />
            <span>Lihat Risk</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-200 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          Distribusi keparahan risiko dan alokasi anggaran penanganan aset.
        </p>

        {/* Horizontal Stacked Bars for Risk Levels */}
        <div className="space-y-3.5">
          {riskLevels.map((lvl, idx) => {
            const percent = totalRisks > 0 ? Math.round((lvl.count / totalRisks) * 100) : 0;

            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 min-w-0" title={lvl.desc}>
                    <span className={`w-2 h-2 rounded-full ${lvl.color} flex-shrink-0`} />
                    <span className="font-bold text-slate-700 truncate">{lvl.label}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-extrabold text-slate-800">{lvl.count} Kasus</span>
                    <span className="text-[11px] text-slate-400 w-8 text-right font-medium">{percent}%</span>
                  </div>
                </div>

                {/* Progress bar container */}
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                    className={`h-full rounded-full ${lvl.color}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Estimasi Biaya Mitigasi (Teranggarkan vs Diusulkan) as specified in PRD */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Kebutuhan Biaya Mitigasi
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            {persenTeranggarkan}% Teranggarkan
          </span>
        </div>

        {/* Biaya progress track */}
        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${persenTeranggarkan}%` }}
            transition={{ duration: 0.8 }}
            className="h-full bg-emerald-500"
            title={`Teranggarkan: Rp ${teranggarkanRp.toLocaleString('id-ID')}`}
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${100 - persenTeranggarkan}%` }}
            transition={{ duration: 0.8 }}
            className="h-full bg-amber-400"
            title={`Diusulkan: Rp ${diusulkanRp.toLocaleString('id-ID')}`}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 pt-1 text-xs">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
            <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Teranggarkan (APBD)</p>
            <p className="font-extrabold text-emerald-900 mt-0.5">Rp {teranggarkanRp.toLocaleString('id-ID')}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
            <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Diusulkan (TAPD)</p>
            <p className="font-extrabold text-amber-900 mt-0.5">Rp {diusulkanRp.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Matriks 5x5 Permendagri 19/2016</span>
          <Link
            href="/dashboard/risk"
            className="text-blue-600 hover:text-blue-700 font-bold hover:underline inline-flex items-center gap-1"
          >
            Matriks Lengkap →
          </Link>
        </div>
      </div>
    </div>
  );
}
