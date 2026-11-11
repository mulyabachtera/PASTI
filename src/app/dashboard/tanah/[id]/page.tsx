import prisma from '@/lib/prisma';
import { 
  ArrowLeft, MapPin, FileText, CheckCircle2, Calendar, 
  Edit3, Map, ShieldCheck, AlertTriangle, 
  Activity, Building2
} from 'lucide-react';
import Link from 'next/link';
import MiniMapWrapper from './MiniMapWrapper';
import DocumentUpload from './DocumentUpload';
import PrintAssetButton from './PrintAssetButton';
import VerificationBox from './VerificationBox';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { FORMS_UNDER_DEVELOPMENT } from '@/lib/demoConfig';

export default async function DetailTanahPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  const userName = session?.user?.name || session?.user?.email;

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const result: any[] = await prisma.$queryRaw`
    SELECT 
      id, "nibar", "assetId", "kodeTanah", "kodeLokasi", "namaBarang", 
      "pengelola", "kecamatan", "kampung", "statusHak", "luas", 
      "statusLegalitas", "noSertifikat", "tanggalPerolehan", 
      "alamatLokasi", "asalPerolehan", "nilaiPerolehan", "dokumenSertifikat", "fotoAset",
      "papanAset", "batasBidang", "pagarPengamanan", "statusPenguasaan", "pemanfaatan", "permasalahan",
      "skorAdministrasi", "skorLegal", "skorFisik", "skorPenguasaan", "skorSengketa", "skorStrategis",
      "totalSkorRisiko", "kategoriRisiko", "prioritasTindakan",
      "statusVerifikasi", "catatanVerifikasi", "verifiedBy", "verifiedAt", "inputBy",
      ST_AsGeoJSON("koordinatPolygon") as geojson
    FROM "tanah"
    WHERE id = ${id}
  `;

  const tanah = result[0];

  if (!tanah) return notFound();

  // Helper labels for physical parameters
  const getPapanLabel = (val: number | null) => {
    if (val === 0) return { label: "Ada & Terawat", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (val === 1) return { label: "Rusak / Pudar", color: "bg-amber-50 text-amber-700 border-amber-200" };
    return { label: "Tidak Ada Plang", color: "bg-rose-50 text-rose-700 border-rose-200" };
  };

  const getBatasLabel = (val: number | null) => {
    if (val === 0) return { label: "Jelas & Patok BPN", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (val === 1) return { label: "Sebagian Jelas", color: "bg-amber-50 text-amber-700 border-amber-200" };
    return { label: "Belum Jelas / Hilang", color: "bg-rose-50 text-rose-700 border-rose-200" };
  };

  const getPagarLabel = (val: number | null) => {
    if (val === 0) return { label: "Ada Pagar Keliling", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (val === 1) return { label: "Sebagian / Rusak", color: "bg-amber-50 text-amber-700 border-amber-200" };
    return { label: "Tidak Berpagar", color: "bg-rose-50 text-rose-700 border-rose-200" };
  };

  const getPenguasaanLabel = (val: number | null) => {
    if (val === 0) return { label: "Dikuasai Pemkab", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (val === 1) return { label: "Potensi Klaim Warga", color: "bg-amber-50 text-amber-700 border-amber-200" };
    return { label: "Dikuasai Pihak Lain", color: "bg-rose-50 text-rose-700 border-rose-200" };
  };

  const getPemanfaatanLabel = (val: number | null) => {
    if (val === 0) return { label: "Digunakan SKPK", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (val === 1) return { label: "Belum Dimanfaatkan", color: "bg-amber-50 text-amber-700 border-amber-200" };
    return { label: "Dimanfaatkan Pihak Lain", color: "bg-rose-50 text-rose-700 border-rose-200" };
  };

  // Helper for risk category color
  const getRiskBadge = (kategori: string | null) => {
    if (kategori === "Sangat Tinggi") return "bg-rose-100 text-rose-800 border-rose-300";
    if (kategori === "Tinggi") return "bg-orange-100 text-orange-800 border-orange-300";
    if (kategori === "Sedang") return "bg-amber-100 text-amber-800 border-amber-300";
    return "bg-emerald-100 text-emerald-800 border-emerald-300";
  };

  const papan = getPapanLabel(tanah.papanAset);
  const batas = getBatasLabel(tanah.batasBidang);
  const pagar = getPagarLabel(tanah.pagarPengamanan);
  const penguasaan = getPenguasaanLabel(tanah.statusPenguasaan);
  const pemanfaatan = getPemanfaatanLabel(tanah.pemanfaatan);

  return (
    <div className="space-y-6">
      {/* Official Government Kop Surat (Only Visible When Printing / Saving to PDF) */}
      <div className="hidden print:flex items-center gap-4 border-b-2 border-slate-900 pb-4 mb-6">
        <img 
          src="/pasti-logo.png" 
          alt="Logo PASTI" 
          className="w-20 h-20 object-contain shrink-0" 
        />
        <div className="flex-1 text-center space-y-1">
          <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
            PEMERINTAH KABUPATEN ACEH TENGAH
          </h1>
          <h2 className="text-sm font-bold uppercase text-slate-800">
            BADAN PENGELOLA KEUANGAN DAN ASET DAERAH (BPKAD)
          </h2>
          <p className="text-xs text-slate-600">
            Sistem Informasi Pengamanan Aset Strategis Terintegrasi dan Informatif (SIM-PASTI)
          </p>
          <p className="text-xs font-bold text-slate-900 mt-1.5 underline tracking-wide">
            LEMBAR PROFIL RESMI, PARAMETER FISIK & RISIKO ASET TANAH (KIB A)
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link 
            href="/dashboard/tanah" 
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors print:hidden shadow-xs shrink-0 mt-0.5"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-1">
            {/* Asset ID & Kode Tanah ditampilkan sebelum / di atas Nama Aset */}
            <div className="flex items-center gap-2 flex-wrap">
              {tanah.assetId && tanah.assetId !== '-' ? (
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Asset ID: {tanah.assetId}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono text-slate-400 bg-slate-50 border border-slate-200">
                  Asset ID: -
                </span>
              )}

              {tanah.kodeTanah ? (
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  Kode: {tanah.kodeTanah}
                </span>
              ) : null}

              <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200">
                NIBAR: {tanah.nibar && tanah.nibar !== '-' ? tanah.nibar : '-'}
              </span>

              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 flex items-center gap-1 print:border print:border-emerald-600">
                <CheckCircle2 className="w-3 h-3" /> Terdaftar Aktif
              </span>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{tanah.namaBarang}</h2>
          </div>
        </div>

        {/* Print Button */}
        <div className="print:hidden">
          <PrintAssetButton namaAset={tanah.namaBarang} />
        </div>
      </div>

      {/* Verification Box - Alur Verifikator & Operator */}
      <div className="print:hidden">
        <VerificationBox
          tanahId={tanah.id}
          namaBarang={tanah.namaBarang}
          statusVerifikasi={tanah.statusVerifikasi}
          catatanVerifikasi={tanah.catatanVerifikasi}
          verifiedBy={tanah.verifiedBy}
          verifiedAt={tanah.verifiedAt}
          inputBy={tanah.inputBy}
          userRole={userRole}
          userName={userName}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri & Tengah: Informasi Utama, Legalitas, Parameter Fisik & Risiko */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Informasi Utama Aset */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" /> Informasi Utama Aset
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <p className="text-xs text-slate-400 mb-1">Asset ID & Kode Tanah</p>
                <p className="font-mono font-semibold text-slate-800 text-sm">
                  {(tanah.assetId && tanah.assetId !== '-' ? tanah.assetId : '-') + ' / ' + (tanah.kodeTanah || '-')}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Kode Lokasi</p>
                <p className="font-mono font-semibold text-slate-800 text-sm">{tanah.kodeLokasi || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Pengelola / SKPK Terkait</p>
                <p className="font-semibold text-slate-800 text-sm">{tanah.pengelola || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Luas Tanah</p>
                <p className="font-semibold text-slate-800 text-sm">
                  {tanah.luas ? `${tanah.luas.toLocaleString('id-ID')} m²` : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Kecamatan & Kampung</p>
                <p className="font-semibold text-slate-800 text-sm">
                  {tanah.kecamatan || '-'} {tanah.kampung ? `(${tanah.kampung})` : ''}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Asal Perolehan</p>
                <p className="font-semibold text-slate-800 text-sm">{tanah.asalPerolehan || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-slate-400 mb-1">Alamat / Lokasi Lengkap</p>
                <p className="font-semibold text-slate-800 text-sm flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  {tanah.alamatLokasi || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Status Legalitas & Sertifikat */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" /> Status Legalitas & Sertifikat
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <p className="text-xs text-slate-400 mb-1">Status Hak</p>
                <p className="font-semibold text-slate-800 text-sm">{tanah.statusHak || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Status Legalitas Dokumen</p>
                <p className="font-semibold text-slate-800 text-sm">{tanah.statusLegalitas || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Nomor Sertifikat</p>
                <p className="font-mono text-slate-800 text-sm">{tanah.noSertifikat || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Tanggal Perolehan</p>
                <p className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {tanah.tanggalPerolehan ? new Date(tanah.tanggalPerolehan).toLocaleDateString('id-ID') : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Parameter Pengamanan Fisik & Penguasaan (Prototype Sync) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Pengamanan Fisik & Penguasaan Lapangan
                </h3>
                <p className="text-xs text-slate-500">
                  Kondisi riil 5 parameter fisik lapangan untuk penilaian risiko terintegrasi.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg w-fit">
                Bobot Terdaftar
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Papan Nama Aset</span>
                  <span className="text-sm font-semibold text-slate-800">{papan.label}</span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${papan.color}`}>
                  Nilai: {tanah.papanAset ?? 0}
                </span>
              </div>

              <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Batas Bidang (Patok BPN)</span>
                  <span className="text-sm font-semibold text-slate-800">{batas.label}</span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${batas.color}`}>
                  Nilai: {tanah.batasBidang ?? 0}
                </span>
              </div>

              <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Pagar Pengamanan</span>
                  <span className="text-sm font-semibold text-slate-800">{pagar.label}</span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${pagar.color}`}>
                  Nilai: {tanah.pagarPengamanan ?? 0}
                </span>
              </div>

              <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Status Penguasaan</span>
                  <span className="text-sm font-semibold text-slate-800">{penguasaan.label}</span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${penguasaan.color}`}>
                  Nilai: {tanah.statusPenguasaan ?? 0}
                </span>
              </div>

              <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between sm:col-span-2">
                <div>
                  <span className="text-xs text-slate-500 block">Status Pemanfaatan Lahan</span>
                  <span className="text-sm font-semibold text-slate-800">{pemanfaatan.label}</span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${pemanfaatan.color}`}>
                  Nilai: {tanah.pemanfaatan ?? 0}
                </span>
              </div>
            </div>

            {tanah.permasalahan && (
              <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Catatan Permasalahan / Kronologi Lapangan:
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  {tanah.permasalahan}
                </p>
              </div>
            )}
          </div>

          {/* Card 4: Profil Risiko 6 Dimensi & Prioritas Tindakan */}
          <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" /> Profil Risiko 6 Dimensi & Prioritas Tindakan
                </h3>
                <p className="text-xs text-slate-400">
                  Dihitung secara otomatis berdasarkan pembobotan parameter fisik dan status legalitas.
                </p>
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold border tracking-wide uppercase flex items-center gap-1.5 w-fit ${getRiskBadge(tanah.kategoriRisiko)}`}>
                {tanah.kategoriRisiko || 'Rendah'}
              </span>
            </div>

            {/* Score Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
              <div>
                <span className="text-xs text-slate-400">Total Skor Risiko</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-3xl font-extrabold font-mono text-white">
                    {tanah.totalSkorRisiko ?? 6}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">/ 30</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-400">Tingkat Kategori</span>
                <p className="text-base font-bold text-slate-100 mt-1">
                  {tanah.kategoriRisiko || 'Rendah'}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Prioritas Rekomendasi</span>
                <p className="text-base font-bold text-blue-400 mt-1">
                  {tanah.prioritasTindakan || 'Monitoring'}
                </p>
              </div>
            </div>

            {/* 6 Dimension Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "1. Administrasi", score: tanah.skorAdministrasi ?? 1, desc: "Papan Aset & KIB" },
                { label: "2. Legalitas", score: tanah.skorLegal ?? 1, desc: "Sertifikasi BPN" },
                { label: "3. Fisik", score: tanah.skorFisik ?? 1, desc: "Batas & Pagar" },
                { label: "4. Penguasaan", score: tanah.skorPenguasaan ?? 1, desc: "Fisik Pemkab" },
                { label: "5. Sengketa", score: tanah.skorSengketa ?? 1, desc: "Klaim Warga/Pihak 3" },
                { label: "6. Strategis", score: tanah.skorStrategis ?? 1, desc: "Nilai & Fungsi Layanan" },
              ].map((dim, idx) => (
                <div key={idx} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">{dim.label}</span>
                    <span className="text-[10px] text-slate-400 block">{dim.desc}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-1.5 border-t border-slate-700/40">
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {dim.score} / 5
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div 
                          key={lvl} 
                          className={`w-1.5 h-3 rounded-xs ${
                            lvl <= dim.score 
                              ? dim.score <= 2 ? 'bg-emerald-500' : dim.score === 3 ? 'bg-amber-500' : dim.score === 4 ? 'bg-orange-500' : 'bg-rose-500' 
                              : 'bg-slate-700'
                          }`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 5: Dokumen & Foto Fisik Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" /> Dokumentasi & Berkas Fisik Aset
            </h3>
            <DocumentUpload 
              idTanah={tanah.id} 
              currentDocUrl={tanah.dokumenSertifikat} 
              currentFotoUrl={tanah.fotoAset} 
            />
          </div>
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          {/* Mini Map Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-64 relative">
            <MiniMapWrapper 
              geojsonString={tanah.geojson} 
              statusLegalitas={tanah.statusLegalitas}
              noSertifikat={tanah.noSertifikat}
            />
            <div className="absolute top-4 left-4 z-10">
              <span className="px-3 py-1 bg-white/90 backdrop-blur border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm flex items-center gap-1.5">
                <Map className="w-3.5 h-3.5 text-blue-600" /> Peta Batas Bidang
              </span>
            </div>
          </div>

          {/* Nilai Aset Card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-sm p-6 text-white">
            <h3 className="font-semibold mb-2 opacity-90 text-sm">Nilai Aset Daerah</h3>
            <p className="text-3xl font-extrabold tracking-tight">
              Rp {tanah.nilaiPerolehan ? Number(tanah.nilaiPerolehan).toLocaleString('id-ID') : '0'}
            </p>
            <p className="text-xs opacity-75 mt-2">Berdasarkan Nilai Perolehan Resmi KIB A</p>
          </div>

          {/* Quick Action Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3 print:hidden">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Aksi Manajemen Aset
            </h4>
            {!FORMS_UNDER_DEVELOPMENT && (
              <Link 
                href={`/dashboard/tanah/${tanah.id}/edit`} 
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <Edit3 className="w-4 h-4" /> Edit Informasi & Parameter
              </Link>
            )}
            <Link 
              href="/dashboard" 
              className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Map className="w-4 h-4 text-blue-600" /> Buka Dashboard Spasial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
