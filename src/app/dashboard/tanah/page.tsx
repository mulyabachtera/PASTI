import prisma from '@/lib/prisma';
import { Map, Plus, Search, FileText, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import ActionMenu from './ActionMenu';

export default async function MasterTanahPage() {
  // Fetch data from DB directly in Server Component
  const tanahList = await prisma.tanah.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const getRiskBadge = (kategori: string | null) => {
    if (kategori === "Sangat Tinggi") return "bg-rose-100 text-rose-800 border-rose-300";
    if (kategori === "Tinggi") return "bg-orange-100 text-orange-800 border-orange-300";
    if (kategori === "Sedang") return "bg-amber-100 text-amber-800 border-amber-300";
    return "bg-emerald-100 text-emerald-800 border-emerald-300";
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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari Asset ID, NIBAR, atau Nama Aset..." 
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
            />
          </div>
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
                <th className="px-5 py-3.5">Status Hak</th>
                <th className="px-5 py-3.5">Tingkat Risiko</th>
                <th className="px-5 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tanahList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Belum ada data aset tanah.
                  </td>
                </tr>
              ) : (
                tanahList.map((tanah) => (
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
                      <p className="font-semibold text-slate-800 leading-snug">{tanah.namaBarang}</p>
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
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500 bg-slate-50/50">
          <p>Menampilkan {tanahList.length} aset terdaftar</p>
        </div>
      </div>
    </div>
  );
}
