"use client";

import { useMemo } from "react";
import { 
  calculateAutomatedRisk, 
  RiskCalculationResult 
} from "@/lib/riskCalculator";
import { 
  ShieldAlert, 
  Activity, 
  AlertTriangle, 
  Info,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface LiveRiskCardProps {
  papanAset: number;
  batasBidang: number;
  pagarPengamanan: number;
  statusPenguasaan: number;
  pemanfaatan: number;
  statusLegalitas?: string;
  nilaiPerolehan?: number;
}

export default function LiveRiskCard({
  papanAset,
  batasBidang,
  pagarPengamanan,
  statusPenguasaan,
  pemanfaatan,
  statusLegalitas,
  nilaiPerolehan,
}: LiveRiskCardProps) {
  const riskResult: RiskCalculationResult = useMemo(() => {
    return calculateAutomatedRisk({
      papanAset,
      batasBidang,
      pagarPengamanan,
      statusPenguasaan,
      pemanfaatan,
      statusLegalitas,
      nilaiPerolehan,
    });
  }, [papanAset, batasBidang, pagarPengamanan, statusPenguasaan, pemanfaatan, statusLegalitas, nilaiPerolehan]);

  // Dimension details with descriptions
  const dimensions = [
    { label: "1. Administrasi", score: riskResult.skorAdministrasi, desc: "Papan Aset & Warkah KIB" },
    { label: "2. Legalitas", score: riskResult.skorLegal, desc: "Sertifikasi BPN & Dokumen Hak" },
    { label: "3. Fisik Lapangan", score: riskResult.skorFisik, desc: "Batas Patok & Pagar Keliling" },
    { label: "4. Penguasaan", score: riskResult.skorPenguasaan, desc: "Penguasaan Fisik Riil Pemkab" },
    { label: "5. Sengketa", score: riskResult.skorSengketa, desc: "Potensi Klaim Warga / Pihak Ke-3" },
    { label: "6. Strategis", score: riskResult.skorStrategis, desc: "Fungsi Layanan & Nilai Aset" },
  ];

  // Percentage for the total progress bar (6 is min, 30 is max)
  const scorePercent = Math.round(((riskResult.totalSkor - 6) / 24) * 100);

  const getScoreColor = (score: number) => {
    if (score <= 2) return "bg-emerald-500 text-emerald-700";
    if (score === 3) return "bg-amber-500 text-amber-700";
    if (score === 4) return "bg-orange-500 text-orange-700";
    return "bg-rose-500 text-rose-700";
  };

  const getScoreBg = (score: number) => {
    if (score <= 2) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (score === 3) return "bg-amber-50 text-amber-700 border-amber-200";
    if (score === 4) return "bg-orange-50 text-orange-700 border-orange-200";
    return "bg-rose-50 text-rose-700 border-rose-200";
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl relative overflow-hidden space-y-5">
      {/* Background glowing gradient */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
          </div>
          <span className="text-xs font-bold tracking-wide uppercase text-slate-300">
            Live Risk Preview
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
          Metodologi PASTI
        </span>
      </div>

      {/* Main Score & Risk Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <div>
          <span className="text-xs text-slate-400 font-medium">Total Skor Risiko (6 - 30)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {riskResult.totalSkor}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ 30 poin</span>
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-1.5">
          <span className={`px-3 py-1 rounded-lg text-xs font-bold border tracking-wide uppercase flex items-center gap-1.5 ${riskResult.badgeColor.bg} ${riskResult.badgeColor.text} ${riskResult.badgeColor.border}`}>
            {riskResult.kategoriRisiko === "Sangat Tinggi" && <ShieldAlert className="w-3.5 h-3.5" />}
            {riskResult.kategoriRisiko === "Tinggi" && <AlertTriangle className="w-3.5 h-3.5" />}
            {riskResult.kategoriRisiko === "Sedang" && <AlertCircle className="w-3.5 h-3.5" />}
            {riskResult.kategoriRisiko === "Rendah" && <CheckCircle2 className="w-3.5 h-3.5" />}
            Risiko: {riskResult.kategoriRisiko}
          </span>
          <span className="text-[11px] text-slate-300 font-medium">
            Tindakan: <strong className="text-blue-400">{riskResult.prioritasTindakan}</strong>
          </span>
        </div>
      </div>

      {/* Progress Meter */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>Tingkat Kerentanan</span>
          <span className="font-mono">{scorePercent}%</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
          <div 
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              riskResult.totalSkor >= 21 ? 'bg-gradient-to-r from-orange-500 to-rose-600' :
              riskResult.totalSkor >= 16 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
              riskResult.totalSkor >= 11 ? 'bg-gradient-to-r from-emerald-500 to-amber-500' :
              'bg-emerald-500'
            }`}
            style={{ width: `${Math.max(5, scorePercent)}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-slate-500 px-0.5">
          <span>Rendah (6)</span>
          <span>Sedang (11)</span>
          <span>Tinggi (16)</span>
          <span>Sangat Tinggi (21-30)</span>
        </div>
      </div>

      {/* 6 Dimensions Breakdown */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          Rincian 6 Dimensi Penilaian
        </h4>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {dimensions.map((dim, idx) => (
            <div 
              key={idx} 
              className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-semibold text-slate-200 block truncate">
                  {dim.label}
                </span>
                <span className="text-[9px] text-slate-400 block truncate">
                  {dim.desc}
                </span>
              </div>

              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-700/40">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getScoreBg(dim.score)}`}>
                  {dim.score} / 5
                </span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div 
                      key={lvl} 
                      className={`w-1.5 h-3 rounded-xs ${
                        lvl <= dim.score ? getScoreColor(dim.score).split(' ')[0] : 'bg-slate-700'
                      }`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rekomendasi Otomatis */}
      <div className="bg-blue-950/40 border border-blue-900/50 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-200">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-blue-300 block mb-0.5">Rekomendasi Tindakan Lapangan:</span>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {riskResult.rekomendasiMitigasi}
          </p>
        </div>
      </div>
    </div>
  );
}
