import prisma from "@/lib/prisma";
import DashboardClient from "./DashboardClient";
import { calculateAutomatedRisk } from "@/lib/riskCalculator";
import { DimensionMetric } from "@/components/dashboard/SixDimensionRiskChart";

export default async function DashboardPage() {
  const [tanahList, riskList, aggTanah] = await Promise.all([
    prisma.tanah.findMany({
      select: {
        id: true,
        namaBarang: true,
        nibar: true,
        statusHak: true,
        statusLegalitas: true,
        luas: true,
        nilaiPerolehan: true,
        papanAset: true,
        batasBidang: true,
        pagarPengamanan: true,
        statusPenguasaan: true,
        pemanfaatan: true,
        skorAdministrasi: true,
        skorLegal: true,
        skorFisik: true,
        skorPenguasaan: true,
        skorSengketa: true,
        skorStrategis: true,
        totalSkorRisiko: true,
        kategoriRisiko: true,
        prioritasTindakan: true,
      },
    }),
    prisma.riskRegister.findMany({
      include: {
        tanah: {
          select: {
            namaBarang: true,
            nibar: true,
          },
        },
      },
      orderBy: { skorTotal: "desc" },
    }),
    prisma.tanah.aggregate({
      _sum: {
        luas: true,
        nilaiPerolehan: true,
      },
      _count: {
        id: true,
      },
    }),
  ]);

  const totalAset = aggTanah._count.id;
  const totalLuas = aggTanah._sum.luas || 0;
  const totalNilai = aggTanah._sum.nilaiPerolehan || 0;

  // 1. Status Legalitas (Selaras dengan Indikator Peta Spasial WebGIS)
  const legalitasMap: Record<string, number> = {
    "Sudah Bersertifikat": 0,
    "Dalam Proses BPN": 0,
    "Belum Bersertifikat": 0,
    "Sengketa / Klaim": 0,
  };

  tanahList.forEach((t) => {
    const leg = (t.statusLegalitas || "").toLowerCase().trim();
    if (leg.includes("proses") || leg.includes("urus") || leg.includes("pengurusan")) {
      legalitasMap["Dalam Proses BPN"]++;
    } else if (leg.includes("sengketa") || leg.includes("klaim") || leg.includes("masalah")) {
      legalitasMap["Sengketa / Klaim"]++;
    } else if (leg.includes("belum") || leg.includes("tidak") || !leg) {
      legalitasMap["Belum Bersertifikat"]++;
    } else if (leg.includes("asli") || leg.includes("sertifikat") || leg.includes("pemda")) {
      legalitasMap["Sudah Bersertifikat"]++;
    } else {
      legalitasMap["Belum Bersertifikat"]++;
    }
  });

  // 2. Jenis Hak Atas Tanah (Hak Pakai, Hak Pengelolaan, Hak Milik, Lainnya)
  const hakMap: Record<string, number> = {
    "Hak Pakai": 0,
    "Hak Pengelolaan": 0,
    "Hak Milik": 0,
    "Lainnya": 0,
  };

  tanahList.forEach((t) => {
    const hak = t.statusHak?.trim() || "";
    if (hak.toLowerCase().includes("pakai")) {
      hakMap["Hak Pakai"]++;
    } else if (hak.toLowerCase().includes("pengelolaan")) {
      hakMap["Hak Pengelolaan"]++;
    } else if (hak.toLowerCase().includes("milik")) {
      hakMap["Hak Milik"]++;
    } else {
      hakMap["Lainnya"]++;
    }
  });

  // 3. Distribusi Risiko (EXTREME, HIGH, MEDIUM, LOW)
  const riskLevels = {
    extreme: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  riskList.forEach((r) => {
    const t = r.tingkatRisiko?.toUpperCase() || "";
    if (t === "EXTREME") riskLevels.extreme++;
    else if (t === "HIGH") riskLevels.high++;
    else if (t === "MEDIUM") riskLevels.medium++;
    else riskLevels.low++;
  });

  // 4. Kalkulasi Profil Risiko 6 Dimensi Komprehensif
  let sumAdmin = 0, sumLegal = 0, sumFisik = 0, sumPenguasaan = 0, sumSengketa = 0, sumStrategis = 0;
  let lowAdmin = 0, medAdmin = 0, highAdmin = 0;
  let lowLegal = 0, medLegal = 0, highLegal = 0;
  let lowFisik = 0, medFisik = 0, highFisik = 0;
  let lowPenguasaan = 0, medPenguasaan = 0, highPenguasaan = 0;
  let lowSengketa = 0, medSengketa = 0, highSengketa = 0;
  let lowStrategis = 0, medStrategis = 0, highStrategis = 0;

  tanahList.forEach((t) => {
    let sAdmin = t.skorAdministrasi;
    let sLegal = t.skorLegal;
    let sFisik = t.skorFisik;
    let sPenguasaan = t.skorPenguasaan;
    let sSengketa = t.skorSengketa;
    let sStrategis = t.skorStrategis;

    // Fallback jika belum terkalkulasi
    if (sAdmin == null || sLegal == null || sFisik == null) {
      const calc = calculateAutomatedRisk({
        papanAset: Number(t.papanAset ?? 0),
        batasBidang: Number(t.batasBidang ?? 0),
        pagarPengamanan: Number(t.pagarPengamanan ?? 0),
        statusPenguasaan: Number(t.statusPenguasaan ?? 0),
        pemanfaatan: Number(t.pemanfaatan ?? 0),
        statusLegalitas: t.statusLegalitas || undefined,
        nilaiPerolehan: Number(t.nilaiPerolehan || 0),
      });
      sAdmin = calc.skorAdministrasi;
      sLegal = calc.skorLegal;
      sFisik = calc.skorFisik;
      sPenguasaan = calc.skorPenguasaan;
      sSengketa = calc.skorSengketa;
      sStrategis = calc.skorStrategis;
    }

    const adminScore = sAdmin ?? 1;
    const legalScore = sLegal ?? 1;
    const fisikScore = sFisik ?? 1;
    const penguasaanScore = sPenguasaan ?? 1;
    const sengketaScore = sSengketa ?? 1;
    const strategisScore = sStrategis ?? 1;

    sumAdmin += adminScore;
    sumLegal += legalScore;
    sumFisik += fisikScore;
    sumPenguasaan += penguasaanScore;
    sumSengketa += sengketaScore;
    sumStrategis += strategisScore;

    const categorize = (val: number) => val >= 4 ? "high" : val === 3 ? "med" : "low";

    if (categorize(adminScore) === "high") highAdmin++; else if (categorize(adminScore) === "med") medAdmin++; else lowAdmin++;
    if (categorize(legalScore) === "high") highLegal++; else if (categorize(legalScore) === "med") medLegal++; else lowLegal++;
    if (categorize(fisikScore) === "high") highFisik++; else if (categorize(fisikScore) === "med") medFisik++; else lowFisik++;
    if (categorize(penguasaanScore) === "high") highPenguasaan++; else if (categorize(penguasaanScore) === "med") medPenguasaan++; else lowPenguasaan++;
    if (categorize(sengketaScore) === "high") highSengketa++; else if (categorize(sengketaScore) === "med") medSengketa++; else lowSengketa++;
    if (categorize(strategisScore) === "high") highStrategis++; else if (categorize(strategisScore) === "med") medStrategis++; else lowStrategis++;
  });

  const count = tanahList.length || 1;

  const sixDimensions: DimensionMetric[] = [
    {
      key: "administrasi",
      label: "Risiko Administrasi",
      sublabel: "Papan Nama Aset & Warkah KIB A",
      iconName: "admin",
      avgScore: Math.round((sumAdmin / count) * 10) / 10,
      lowCount: lowAdmin,
      medCount: medAdmin,
      highCount: highAdmin,
    },
    {
      key: "legal",
      label: "Risiko Legalitas",
      sublabel: "Sertifikasi BPN & Hak Pakai Pemkab",
      iconName: "legal",
      avgScore: Math.round((sumLegal / count) * 10) / 10,
      lowCount: lowLegal,
      medCount: medLegal,
      highCount: highLegal,
    },
    {
      key: "fisik",
      label: "Risiko Fisik Lapangan",
      sublabel: "Patok Batas BPN & Pagar Keliling",
      iconName: "fisik",
      avgScore: Math.round((sumFisik / count) * 10) / 10,
      lowCount: lowFisik,
      medCount: medFisik,
      highCount: highFisik,
    },
    {
      key: "penguasaan",
      label: "Risiko Penguasaan",
      sublabel: "Penguasaan Fisik Riil Pemkab",
      iconName: "penguasaan",
      avgScore: Math.round((sumPenguasaan / count) * 10) / 10,
      lowCount: lowPenguasaan,
      medCount: medPenguasaan,
      highCount: highPenguasaan,
    },
    {
      key: "sengketa",
      label: "Risiko Sengketa",
      sublabel: "Potensi Klaim Warga / Pihak Ketiga",
      iconName: "sengketa",
      avgScore: Math.round((sumSengketa / count) * 10) / 10,
      lowCount: lowSengketa,
      medCount: medSengketa,
      highCount: highSengketa,
    },
    {
      key: "strategis",
      label: "Risiko Strategis",
      sublabel: "Nilai Aset & Manfaat Layanan SKPK",
      iconName: "strategis",
      avgScore: Math.round((sumStrategis / count) * 10) / 10,
      lowCount: lowStrategis,
      medCount: medStrategis,
      highCount: highStrategis,
    },
  ];

  // Urgent Actions: Risiko Extreme / High
  const urgentActions = riskList
    .filter(
      (r) =>
        r.tingkatRisiko.toUpperCase() === "EXTREME" ||
        r.tingkatRisiko.toUpperCase() === "HIGH"
    )
    .slice(0, 5);

  return (
    <DashboardClient
      totalAset={totalAset}
      totalLuas={totalLuas}
      totalNilai={totalNilai}
      totalRisiko={riskList.length}
      legalitasData={[
        { label: "Sudah Bersertifikat", value: legalitasMap["Sudah Bersertifikat"], color: "#10B981", href: "/dashboard/tanah?legalitas=Sudah+Bersertifikat" },
        { label: "Dalam Proses BPN", value: legalitasMap["Dalam Proses BPN"], color: "#F59E0B", href: "/dashboard/tanah?legalitas=Dalam+Proses+BPN" },
        { label: "Belum Bersertifikat", value: legalitasMap["Belum Bersertifikat"], color: "#EF4444", href: "/dashboard/tanah?legalitas=Belum+Bersertifikat" },
        { label: "Sengketa / Klaim", value: legalitasMap["Sengketa / Klaim"], color: "#DC2626", href: "/dashboard/tanah?legalitas=Sengketa" },
      ]}
      hakData={[
        { label: "Hak Pakai", value: hakMap["Hak Pakai"], color: "#6366F1", href: "/dashboard/tanah?hak=Hak+Pakai" },
        { label: "Hak Pengelolaan", value: hakMap["Hak Pengelolaan"], color: "#06B6D4", href: "/dashboard/tanah?hak=Hak+Pengelolaan" },
        { label: "Hak Milik", value: hakMap["Hak Milik"], color: "#8B5CF6", href: "/dashboard/tanah?hak=Hak+Milik" },
        { label: "Belum / Lainnya", value: hakMap["Lainnya"], color: "#94A3B8", href: "/dashboard/tanah?hak=Lainnya" },
      ]}
      riskLevels={riskLevels}
      sixDimensions={sixDimensions}
      urgentActions={urgentActions.map((u) => ({
        id: u.id,
        idTanah: u.idTanah,
        namaBarang: u.tanah?.namaBarang || "Aset Tanpa Nama",
        nibar: u.tanah?.nibar || "-",
        kategoriRisiko: u.kategoriRisiko,
        deskripsiRisiko: u.deskripsiRisiko,
        skorTotal: u.skorTotal,
        tingkatRisiko: u.tingkatRisiko,
      }))}
    />
  );
}
