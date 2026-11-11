import prisma from '@/lib/prisma';
import { AlertTriangle, Plus, FileText, User } from 'lucide-react';
import Link from 'next/link';
import { DEMO_MODE } from '@/lib/demoConfig';
import FasePlaceholder from '@/components/dashboard/FasePlaceholder';
import TableSearchInput from '@/components/dashboard/TableSearchInput';
import RiskActionMenu from './RiskActionMenu';

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RiskRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (DEMO_MODE) {
    return <FasePlaceholder type="risk" />;
  }

  const resolvedSearchParams = await searchParams;
  const searchQuery = (resolvedSearchParams?.q || '').trim().toLowerCase();

  const allRiskList = await prisma.riskRegister.findMany({
    include: {
      tanah: {
        select: {
          assetId: true,
          kodeTanah: true,
          namaBarang: true,
          nibar: true,
          alamatLokasi: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const riskList = searchQuery
    ? allRiskList.filter((r) =>
        [
          r.riskId,
          r.kategoriRisiko,
          r.deskripsiRisiko,
          r.penyebab,
          r.tingkatRisiko,
          r.statusTindakLanjut,
          r.pic,
          r.tanah?.assetId,
          r.tanah?.nibar,
          r.tanah?.namaBarang,
          r.tanah?.alamatLokasi,
        ]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(searchQuery))
      )
    : allRiskList;

  const getRiskColor = (tingkat: string) => {
    switch (tingkat.toUpperCase()) {
      case 'EXTREME': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'LOW': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusColor = (status: string | null) => {
    if (status === 'Selesai Termitigasi') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'Sedang Berjalan') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-600" /> Risk Register
          </h2>
          <p className="text-slate-500 mt-1">Pemetaan, analisis, audit kendali, dan pemantauan tindak lanjut risiko aset strategis.</p>
        </div>
        <Link href="/dashboard/risk/new" className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-xs text-sm">
          <Plus className="w-4 h-4" /> Identifikasi Risiko Baru
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <TableSearchInput
            placeholder="Cari Risk ID, Aset, atau Deskripsi..."
            initialValue={resolvedSearchParams?.q || ''}
            accentColor="rose"
          />
          <div className="flex gap-2 w-full sm:w-auto">
            <a 
              href="/api/export/risk"
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
                <th className="px-5 py-3.5">Risk ID & Tingkat</th>
                <th className="px-5 py-3.5">Aset Terkait</th>
                <th className="px-5 py-3.5">Kategori & Deskripsi Risiko</th>
                <th className="px-5 py-3.5">Penyebab / Akar Masalah</th>
                <th className="px-5 py-3.5 text-center">Matriks Skor</th>
                <th className="px-5 py-3.5">Tindak Lanjut & PIC</th>
                <th className="px-5 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {riskList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Belum ada data risiko teridentifikasi. Aset dalam keadaan aman.
                  </td>
                </tr>
              ) : (
                riskList.map((risk) => (
                  <tr key={risk.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      {risk.riskId ? (
                        <span className="font-mono text-xs font-bold text-slate-800 block mb-1">
                          {risk.riskId}
                        </span>
                      ) : null}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${getRiskColor(risk.tingkatRisiko)}`}>
                        {risk.tingkatRisiko.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        {risk.tanah?.assetId && risk.tanah.assetId !== '-' && (
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-mono text-[10px] font-bold rounded border border-blue-200">
                            {risk.tanah.assetId}
                          </span>
                        )}
                        <span className="font-mono text-[11px] text-slate-400">
                          {risk.tanah?.nibar && risk.tanah.nibar !== '-' ? `NIBAR: ${risk.tanah.nibar}` : '-'}
                        </span>
                      </div>
                      <Link href={`/dashboard/tanah/${risk.idTanah}`} className="font-semibold text-slate-800 hover:text-blue-600 hover:underline line-clamp-1">
                        {risk.tanah?.namaBarang}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800 text-xs">{risk.kategoriRisiko}</p>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 max-w-xs">{risk.deskripsiRisiko}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs text-slate-600 line-clamp-2 max-w-xs">
                        {risk.penyebab || '-'}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-bold text-slate-800 font-mono text-sm block">
                        {risk.skorTotal}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        (D:{risk.skorDampak} × P:{risk.skorPeluang})
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(risk.statusTindakLanjut)}`}>
                        {risk.statusTindakLanjut || 'Belum Ditindaklanjuti'}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {risk.pic || 'BPKAD'}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <RiskActionMenu risk={risk as any} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500 bg-slate-50/50">
          <p>Menampilkan {riskList.length} dari {allRiskList.length} data risiko terdaftar</p>
        </div>
      </div>
    </div>
  );
}
