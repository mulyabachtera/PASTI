import prisma from '@/lib/prisma';
import { 
  Map, Plus, FileText, Clock, CheckCircle2, XCircle, FileCheck, Filter, X 
} from 'lucide-react';
import Link from 'next/link';
import ActionMenu from './ActionMenu';
import { DEMO_MODE } from '@/lib/demoConfig';
import FasePlaceholder from '@/components/dashboard/FasePlaceholder';
import TableSearchInput from '@/components/dashboard/TableSearchInput';
import { calculateAutomatedRisk } from '@/lib/riskCalculator';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const DIMENSION_META: Record<string, { label: string; field: string }> = {
  administrasi: { label: 'Risiko Administrasi (Papan Aset & KIB A)', field: 'skorAdministrasi' },
  legal: { label: 'Risiko Legalitas (Sertifikasi BPN & Hak)', field: 'skorLegal' },
  fisik: { label: 'Risiko Fisik Lapangan (Patok & Pagar)', field: 'skorFisik' },
  penguasaan: { label: 'Risiko Penguasaan Fisik Riil', field: 'skorPenguasaan' },
  sengketa: { label: 'Risiko Sengketa & Klaim Pihak Ketiga', field: 'skorSengketa' },
  strategis: { label: 'Risiko Strategis (Nilai & Pemanfaatan)', field: 'skorStrategis' },
  all: { label: 'Seluruh 6 Dimensi Risiko (Diurutkan dari Skor Risiko Tertinggi)', field: 'totalSkorRisiko' },
};

function classifyLegalitas(raw?: string | null): string {
  const leg = (raw || '').toLowerCase().trim();
  if (leg.includes('proses') || leg.includes('urus') || leg.includes('pengurusan')) {
    return 'Dalam Proses BPN';
  }
  if (leg.includes('sengketa') || leg.includes('klaim') || leg.includes('masalah')) {
    return 'Sengketa / Klaim';
  }
  if (leg.includes('belum') || leg.includes('tidak') || !leg) {
    return 'Belum Bersertifikat';
  }
  if (leg.includes('asli') || leg.includes('sertifikat') || leg.includes('pemda')) {
    return 'Sudah Bersertifikat';
  }
  return 'Belum Bersertifikat';
}

function classifyHak(raw?: string | null): string {
  const hak = (raw || '').trim().toLowerCase();
  if (hak.includes('pakai')) return 'Hak Pakai';
  if (hak.includes('pengelolaan')) return 'Hak Pengelolaan';
  if (hak.includes('milik')) return 'Hak Milik';
  return 'Lainnya';
}

function getDimensionScores(t: any) {
  if (t.skorAdministrasi != null && t.skorLegal != null && t.skorFisik != null) {
    return {
      administrasi: Number(t.skorAdministrasi ?? 1),
      legal: Number(t.skorLegal ?? 1),
      fisik: Number(t.skorFisik ?? 1),
      penguasaan: Number(t.skorPenguasaan ?? 1),
      sengketa: Number(t.skorSengketa ?? 1),
      strategis: Number(t.skorStrategis ?? 1),
      all: Number(t.totalSkorRisiko ?? 6),
    };
  }
  const calc = calculateAutomatedRisk({
    papanAset: Number(t.papanAset ?? 0),
    batasBidang: Number(t.batasBidang ?? 0),
    pagarPengamanan: Number(t.pagarPengamanan ?? 0),
    statusPenguasaan: Number(t.statusPenguasaan ?? 0),
    pemanfaatan: Number(t.pemanfaatan ?? 0),
    statusLegalitas: t.statusLegalitas || undefined,
    nilaiPerolehan: Number(t.nilaiPerolehan || 0),
  });
  return {
    administrasi: calc.skorAdministrasi,
    legal: calc.skorLegal,
    fisik: calc.skorFisik,
    penguasaan: calc.skorPenguasaan,
    sengketa: calc.skorSengketa,
    strategis: calc.skorStrategis,
    all: calc.totalSkor,
  };
}

export default async function MasterTanahPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    dimensi?: string;
    risiko?: string;
    legalitas?: string;
    hak?: string;
  }>;
}) {
  if (DEMO_MODE) {
    return <FasePlaceholder type="tanah" />;
  }

  const resolvedSearchParams = await searchParams;
  const searchQuery = (resolvedSearchParams?.q || '').trim().toLowerCase();
  const filterDimensi = (resolvedSearchParams?.dimensi || '').trim().toLowerCase();
  const filterRisiko = (resolvedSearchParams?.risiko || '').trim().toLowerCase();
  const filterLegalitas = (resolvedSearchParams?.legalitas || '').trim();
  const filterHak = (resolvedSearchParams?.hak || '').trim();

  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;

  // Fetch data from DB directly in Server Component
  const allTanahList = await prisma.tanah.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const pendingCount = allTanahList.filter((t) => t.statusVerifikasi === 'MENUNGGU_VERIFIKASI').length;

  let tanahList = [...allTanahList];
  let activeFilterLabel: string | null = null;

  // 1. Filter berdasarkan Status Legalitas (dari Donut Chart Komposisi Status Legalitas)
  if (filterLegalitas) {
    const normFilter = filterLegalitas.toLowerCase();
    tanahList = tanahList.filter((t) => {
      const cat = classifyLegalitas(t.statusLegalitas).toLowerCase();
      if (normFilter.includes('sengketa')) return cat.includes('sengketa');
      return cat === normFilter;
    });
    activeFilterLabel = `Komposisi Status Legalitas: "${
      normFilter.includes('sengketa') ? 'Sengketa / Klaim' : filterLegalitas
    }"`;
  }

  // 2. Filter berdasarkan Jenis Hak (dari Donut Chart Komposisi Jenis Hak)
  if (filterHak) {
    const normHak = filterHak.toLowerCase();
    tanahList = tanahList.filter((t) => {
      const cat = classifyHak(t.statusHak).toLowerCase();
      return cat === normHak;
    });
    activeFilterLabel = `Komposisi Jenis Hak: "${
      normHak === 'lainnya' ? 'Belum / Lainnya' : filterHak
    }"`;
  }

  // 3. Filter berdasarkan Tingkat Risiko (dari Legenda Bawah Profil Risiko 6 Dimensi)
  if (filterRisiko) {
    tanahList = tanahList.filter((t) => {
      const kat = (t.kategoriRisiko || 'Rendah').toLowerCase();
      if (filterRisiko === 'aman') return kat === 'rendah';
      if (filterRisiko === 'sedang') return kat === 'sedang';
      if (filterRisiko === 'kritis') return kat === 'tinggi' || kat === 'sangat tinggi';
      return true;
    });
    const labelMap: Record<string, string> = {
      aman: 'Tingkat Risiko Aman / Rendah (Skor 1-2)',
      sedang: 'Tingkat Risiko Sedang (Skor 3)',
      kritis: 'Tingkat Risiko Kritis / Tinggi (Skor 4-5)',
    };
    activeFilterLabel = labelMap[filterRisiko] || `Tingkat Risiko: ${filterRisiko}`;
  }

  // 4. Urutkan & sorot berdasarkan Dimensi Risiko (dari Klik Balok Profil Risiko 6 Dimensi)
  if (filterDimensi && DIMENSION_META[filterDimensi]) {
    const dimKey = filterDimensi as keyof ReturnType<typeof getDimensionScores>;
    tanahList.sort((a, b) => {
      const scoreA = getDimensionScores(a)[dimKey] ?? 1;
      const scoreB = getDimensionScores(b)[dimKey] ?? 1;
      return scoreB - scoreA;
    });
    activeFilterLabel = `Sumber Grafik 6 Dimensi — ${DIMENSION_META[filterDimensi].label}`;
  }

  // 5. Filter Pencarian Teks (Search Bar)
  if (searchQuery) {
    tanahList = tanahList.filter((t) =>
      [
        t.assetId,
        t.nibar,
        t.kodeTanah,
        t.namaBarang,
        t.alamatLokasi,
        t.kodeLokasi,
        t.kecamatan,
        t.kampung,
        t.statusHak,
        t.statusLegalitas,
        t.kategoriRisiko,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(searchQuery))
    );
  }

  const getRiskBadge = (kategori: string | null) => {
    if (kategori === "Sangat Tinggi") return "bg-rose-100 text-rose-800 border-rose-300";
    if (kategori === "Tinggi") return "bg-orange-100 text-orange-800 border-orange-300";
    if (kategori === "Sedang") return "bg-amber-100 text-amber-800 border-amber-300";
    return "bg-emerald-100 text-emerald-800 border-emerald-300";
  };

  const getDimScoreBadge = (score: number) => {
    if (score >= 4) return "bg-rose-600 text-white border-rose-700";
    if (score === 3) return "bg-amber-500 text-white border-amber-600";
    return "bg-emerald-600 text-white border-emerald-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Map className="w-6 h-6 text-blue-600" /> Master Data Tanah
          </h2>
          <p className="text-slate-500 mt-1">Kelola seluruh inventarisasi aset tanah daerah dan pantau risiko terintegrasi.</p>
        </div>
        <Link href="/dashboard/tanah/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-xs text-sm">
          <Plus className="w-4 h-4" /> Tambah Aset Baru
        </Link>
      </div>

      {/* Banner Filter Grafik Aktif (Drill-Down dari Grafik Dashboard) */}
      {activeFilterLabel && (
        <div className="p-4 bg-blue-50/90 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                Data Sumber Grafik Dashboard
              </p>
              <h4 className="font-bold text-slate-800 text-sm">
                {activeFilterLabel}{' '}
                <span className="font-normal text-slate-500">
                  ({tanahList.length} dari {allTanahList.length} bidang tanah)
                </span>
              </h4>
            </div>
          </div>
          <Link
            href="/dashboard/tanah"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs self-start sm:self-auto"
          >
            <X className="w-3.5 h-3.5" /> Tampilkan Semua Aset
          </Link>
        </div>
      )}

      {/* Banner Khusus Verifikator & Super Admin jika ada data aset yang menunggu verifikasi */}
      {pendingCount > 0 && (userRole === 'VERIFICATOR' || userRole === 'SUPER_ADMIN') && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 text-sm">
                Ada {pendingCount} aset baru dari Operator yang menunggu verifikasi Anda!
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Silakan periksa detail data fisik dan kelengkapan dokumen untuk menyetujui atau meminta revisi.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-200/80 text-amber-900 shrink-0">
            {pendingCount} Perlu Ditelaah
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <TableSearchInput
            placeholder="Cari Asset ID, NIBAR, atau Nama Aset..."
            initialValue={resolvedSearchParams?.q || ''}
            accentColor="blue"
          />
          <div className="flex gap-2 w-full sm:w-auto">
            <a 
              href="/api/export/tanah"
              download
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 flex items-center gap-2 transition-colors shadow-xs"
            >
              <FileText className="w-4 h-4 text-emerald-600" /> Export CSV (Excel)
            </a>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Asset ID / NIBAR</th>
                <th className="px-5 py-3.5">Nama Aset & Kodefikasi</th>
                <th className="px-5 py-3.5">Luas (m²)</th>
                <th className="px-5 py-3.5">Status Hak & Legalitas</th>
                <th className="px-5 py-3.5">Status Verifikasi</th>
                <th className="px-5 py-3.5">
                  {filterDimensi && DIMENSION_META[filterDimensi] && filterDimensi !== 'all'
                    ? `Skor Dimensi & Risiko`
                    : `Tingkat Risiko`}
                </th>
                <th className="px-5 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tanahList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada data aset tanah yang sesuai dengan filter grafik ini.
                  </td>
                </tr>
              ) : (
                tanahList.map((tanah) => {
                  const dimScores = getDimensionScores(tanah);
                  const activeDimScore =
                    filterDimensi && filterDimensi !== 'all' && filterDimensi in dimScores
                      ? dimScores[filterDimensi as keyof typeof dimScores]
                      : null;

                  return (
                    <tr key={tanah.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        {tanah.assetId ? (
                          <span className="block font-mono text-xs font-bold text-blue-600">
                            {tanah.assetId}
                          </span>
                        ) : null}
                        <span className="font-mono text-[11px] text-slate-400 block">
                          {tanah.nibar}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {tanah.kodeTanah && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200 mb-1">
                            {tanah.kodeTanah}
                          </span>
                        )}
                        <Link
                          href={`/dashboard/tanah/${tanah.id}`}
                          className="font-semibold text-slate-800 hover:text-blue-600 hover:underline leading-snug block"
                        >
                          {tanah.namaBarang}
                        </Link>
                        <p className="text-xs text-slate-400 mt-0.5">{tanah.alamatLokasi || tanah.kodeLokasi || '-'}</p>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-700">
                        {tanah.luas ? `${tanah.luas.toLocaleString('id-ID')} m²` : '-'}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {tanah.statusHak || 'Belum Terverifikasi'}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1">{tanah.statusLegalitas || '-'}</p>
                      </td>
                      <td className="px-5 py-4">
                        {tanah.statusVerifikasi === 'MENUNGGU_VERIFIKASI' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" /> Menunggu
                            </span>
                            {tanah.inputBy && (
                              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                                Oleh: {tanah.inputBy}
                              </span>
                            )}
                          </div>
                        ) : tanah.statusVerifikasi === 'DITOLAK' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <XCircle className="w-3 h-3 text-rose-600" /> Ditolak
                            </span>
                            {tanah.catatanVerifikasi && (
                              <span className="text-[10px] text-rose-500 block mt-0.5 truncate max-w-[130px]" title={tanah.catatanVerifikasi}>
                                {tanah.catatanVerifikasi}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Terverifikasi
                            </span>
                            {tanah.verifiedBy && (
                              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                                Oleh: {tanah.verifiedBy}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {activeDimScore !== null && (
                          <div className="mb-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${getDimScoreBadge(activeDimScore)}`}>
                              Skor {filterDimensi.charAt(0).toUpperCase() + filterDimensi.slice(1)}: {activeDimScore}/5
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getRiskBadge(tanah.kategoriRisiko)}`}>
                            {tanah.kategoriRisiko || 'Rendah'}
                          </span>
                          {tanah.totalSkorRisiko && (
                            <span className="text-[11px] font-mono text-slate-400">
                              ({tanah.totalSkorRisiko}/30)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{tanah.prioritasTindakan || 'Monitoring'}</p>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <ActionMenu id={tanah.id} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500 bg-slate-50/50">
          <p>Menampilkan {tanahList.length} dari {allTanahList.length} aset terdaftar</p>
        </div>
      </div>
    </div>
  );
}
