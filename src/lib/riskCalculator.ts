/**
 * SIM PASTI v3.0 - Utilitas Kalkulator Otomasi Risiko Aset Tanah
 * Berdasarkan Metodologi & Pembobotan Parameter Prototype Database PASTI
 */

export interface PhysicalRiskInput {
  papanAset: number;        // 0: Ada & Terawat, 1: Rusak/Pudar, 2: Tidak Ada
  batasBidang: number;      // 0: Jelas & Patok BPN, 1: Sebagian Jelas, 2: Belum Jelas
  pagarPengamanan: number;  // 0: Ada Keliling, 1: Sebagian/Rusak, 2: Tidak Ada
  statusPenguasaan: number; // 0: Dikuasai Pemda, 1: Potensi Klaim, 2: Dikuasai Pihak Lain
  pemanfaatan: number;      // 0: Digunakan SKPK, 1: Belum Dimanfaatkan, 2: Dimanfaatkan Pihak Lain
  statusLegalitas?: string; // 'Sertifikat Asli' | 'Dalam Proses BPN' | 'Belum Bersertifikat' | 'Sengketa / Klaim'
  nilaiPerolehan?: number;
}

export interface RiskCalculationResult {
  skorAdministrasi: number;  // 1 - 5
  skorLegal: number;         // 1 - 5
  skorFisik: number;         // 1 - 5
  skorPenguasaan: number;    // 1 - 5
  skorSengketa: number;      // 1 - 5
  skorStrategis: number;     // 1 - 5
  totalSkor: number;         // 6 - 30
  kategoriRisiko: 'Rendah' | 'Sedang' | 'Tinggi' | 'Sangat Tinggi';
  prioritasTindakan: 'Monitoring' | 'Prioritas 1' | 'Prioritas Utama';
  rekomendasiMitigasi: string;
  badgeColor: {
    bg: string;
    text: string;
    border: string;
    dot: string;
  };
}

export function calculateAutomatedRisk(input: PhysicalRiskInput): RiskCalculationResult {
  const pAset = Number(input.papanAset) || 0;
  const bBidang = Number(input.batasBidang) || 0;
  const pPagar = Number(input.pagarPengamanan) || 0;
  const sPenguasaan = Number(input.statusPenguasaan) || 0;
  const pManfaat = Number(input.pemanfaatan) || 0;

  // Konversi Status Legalitas ke bobot (0 - 2)
  let legalWeight = 0;
  const leg = (input.statusLegalitas || "").toLowerCase();
  if (leg.includes("proses") || leg.includes("bpn")) {
    legalWeight = 1;
  } else if (leg.includes("belum") || leg.includes("tidak") || leg.includes("sengketa") || leg.includes("klaim")) {
    legalWeight = 2;
  } else if (leg.includes("sertifikat") || leg.includes("asli")) {
    legalWeight = 0;
  } else {
    legalWeight = 1; // default jika belum pasti
  }

  // 1. Risiko Administrasi (1 - 5): Papan aset (0-2) + Dokumen legalitas (0-2)
  const skorAdministrasi = Math.min(5, Math.max(1, 1 + pAset + legalWeight));

  // 2. Risiko Legal (1 - 5): Ditentukan bobot sertifikasi (0 = 1, 1 = 3, 2 = 5)
  const skorLegal = Math.min(5, Math.max(1, 1 + (legalWeight * 2)));

  // 3. Risiko Fisik (1 - 5): Batas bidang (0-2) + Pagar pengamanan (0-2)
  const skorFisik = Math.min(5, Math.max(1, 1 + bBidang + pPagar));

  // 4. Risiko Penguasaan (1 - 5): Status penguasaan riil (0-2) + Pemanfaatan (0-2)
  const skorPenguasaan = Math.min(5, Math.max(1, 1 + sPenguasaan + pManfaat));

  // 5. Risiko Sengketa (1 - 5): Penguasaan riil (0-2) + Batas bidang (0-2)
  const skorSengketa = Math.min(5, Math.max(1, 1 + sPenguasaan + bBidang));

  // 6. Risiko Strategis (1 - 5): Pemanfaatan (0-2) + Nilai Aset (> 1 Milyar = faktor risiko lebih tinggi)
  const isHighValue = (input.nilaiPerolehan || 0) >= 1000000000 ? 1 : 0;
  const skorStrategis = Math.min(5, Math.max(1, 1 + pManfaat + isHighValue));

  // Total Skor Komprehensif (6 - 30)
  const totalSkor = skorAdministrasi + skorLegal + skorFisik + skorPenguasaan + skorSengketa + skorStrategis;

  // Klasifikasi Tingkat Risiko & Prioritas Tindakan
  let kategoriRisiko: 'Rendah' | 'Sedang' | 'Tinggi' | 'Sangat Tinggi' = 'Rendah';
  let prioritasTindakan: 'Monitoring' | 'Prioritas 1' | 'Prioritas Utama' = 'Monitoring';
  let rekomendasiMitigasi = "Pemeriksaan berkala dan pengawasan tertib administrasi KIB.";
  let badgeColor = {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  };

  if (totalSkor >= 21) {
    kategoriRisiko = 'Sangat Tinggi';
    prioritasTindakan = 'Prioritas Utama';
    rekomendasiMitigasi = "Eskalasi Bupati/TAPD: Pengamanan fisik darurat (pagar/plang) dan langkah penanganan hukum.";
    badgeColor = {
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
      dot: "bg-rose-600",
    };
  } else if (totalSkor >= 16) {
    kategoriRisiko = 'Tinggi';
    prioritasTindakan = 'Prioritas 1';
    rekomendasiMitigasi = "Penelusuran warkah dokumen, percepatan sertifikasi BPN, dan penegasan batas bidang.";
    badgeColor = {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
      dot: "bg-orange-500",
    };
  } else if (totalSkor >= 11) {
    kategoriRisiko = 'Sedang';
    prioritasTindakan = 'Monitoring';
    rekomendasiMitigasi = "Pemantauan rutin 180 hari dan perbaikan kelengkapan fisik/papan pengamanan.";
    badgeColor = {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      dot: "bg-amber-500",
    };
  }

  return {
    skorAdministrasi,
    skorLegal,
    skorFisik,
    skorPenguasaan,
    skorSengketa,
    skorStrategis,
    totalSkor,
    kategoriRisiko,
    prioritasTindakan,
    rekomendasiMitigasi,
    badgeColor,
  };
}
