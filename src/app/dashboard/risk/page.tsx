import prisma from '@/lib/prisma';
import { AlertTriangle, Plus } from 'lucide-react';
import Link from 'next/link';
import { DEMO_MODE } from '@/lib/demoConfig';
import FasePlaceholder from '@/components/dashboard/FasePlaceholder';
import RiskTableClient from './RiskTableClient';

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

  // Default urutan: Asset ID terendah (asc), data tanpa Asset ID di paling bawah
  allRiskList.sort((a, b) => {
    const idA = a.tanah?.assetId;
    const idB = b.tanah?.assetId;
    const hasA = Boolean(idA && idA.trim() !== '' && idA !== '-');
    const hasB = Boolean(idB && idB.trim() !== '' && idB !== '-');
    if (!hasA && hasB) return 1;
    if (hasA && !hasB) return -1;
    if (!hasA && !hasB) {
      return (a.tanah?.namaBarang || '').localeCompare(b.tanah?.namaBarang || '', 'id');
    }
    return (idA || '').localeCompare(idB || '', undefined, { numeric: true });
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

      <RiskTableClient
        initialData={riskList as any}
        allCount={allRiskList.length}
        searchQuery={resolvedSearchParams?.q || ''}
      />
    </div>
  );
}
