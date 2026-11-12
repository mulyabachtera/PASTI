"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowUpDown, ArrowUp, ArrowDown, FileText, User,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import TableSearchInput from '@/components/dashboard/TableSearchInput';
import RiskActionMenu from './RiskActionMenu';

interface RiskItem {
  id: string;
  idTanah: string;
  riskId: string | null;
  kategoriRisiko: string;
  deskripsiRisiko: string;
  penyebab: string | null;
  dampakNarasi?: string | null;
  existingControl?: string | null;
  statusTindakLanjut: string | null;
  pic: string | null;
  skorDampak: number;
  skorPeluang: number;
  skorTotal: number;
  tingkatRisiko: string;
  tanah: {
    assetId: string | null;
    kodeTanah: string | null;
    namaBarang: string;
    nibar: string;
    alamatLokasi: string | null;
  } | null;
  [key: string]: any;
}

interface RiskTableClientProps {
  initialData: RiskItem[];
  allCount: number;
  searchQuery?: string;
}

const TINGKAT_RANK: Record<string, number> = {
  EXTREME: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export default function RiskTableClient({
  initialData,
  allCount,
  searchQuery = '',
}: RiskTableClientProps) {
  // Default urutan: Asset ID terendah (asc), data tanpa Asset ID ditempatkan paling bawah
  const [sortBy, setSortBy] = useState<string>('assetId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination State (Default 20 baris per halaman)
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset halaman ke 1 saat sorting, search, atau page size berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, sortOrder, searchQuery, pageSize]);

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(columnKey);
      setSortOrder('asc');
    }
  };

  const hasAssetId = (val?: string | null): boolean => {
    return Boolean(val && val.trim() !== '' && val.trim() !== '-');
  };

  const sortedData = useMemo(() => {
    const list = [...initialData];

    list.sort((a, b) => {
      // 1. Sorting berdasarkan Asset ID (Default & User Click)
      if (sortBy === 'assetId') {
        const idA = a.tanah?.assetId;
        const idB = b.tanah?.assetId;
        const hasA = hasAssetId(idA);
        const hasB = hasAssetId(idB);

        // Jika salah satu tidak punya Asset ID, tempatkan selalu di paling bawah
        if (!hasA && hasB) return 1;
        if (hasA && !hasB) return -1;
        if (!hasA && !hasB) {
          return (a.tanah?.namaBarang || '').localeCompare(b.tanah?.namaBarang || '', 'id');
        }

        const comp = (idA || '').localeCompare(idB || '', undefined, { numeric: true });
        return sortOrder === 'asc' ? comp : -comp;
      }

      // 2. Sorting berdasarkan Risk ID
      if (sortBy === 'riskId') {
        const comp = (a.riskId || '').localeCompare(b.riskId || '', undefined, { numeric: true });
        return sortOrder === 'asc' ? comp : -comp;
      }

      // 3. Sorting berdasarkan Tingkat Risiko
      if (sortBy === 'tingkatRisiko') {
        const rankA = TINGKAT_RANK[a.tingkatRisiko?.toUpperCase()] || 0;
        const rankB = TINGKAT_RANK[b.tingkatRisiko?.toUpperCase()] || 0;
        const diff = rankA - rankB;
        return sortOrder === 'asc' ? diff : -diff;
      }

      // 4. Sorting berdasarkan Kategori Risiko
      if (sortBy === 'kategoriRisiko') {
        const comp = (a.kategoriRisiko || '').localeCompare(b.kategoriRisiko || '', 'id');
        return sortOrder === 'asc' ? comp : -comp;
      }

      // 5. Sorting berdasarkan Penyebab / Akar Masalah
      if (sortBy === 'penyebab') {
        const comp = (a.penyebab || '').localeCompare(b.penyebab || '', 'id');
        return sortOrder === 'asc' ? comp : -comp;
      }

      // 6. Sorting berdasarkan Matriks Skor Total
      if (sortBy === 'skor') {
        const diff = Number(a.skorTotal || 0) - Number(b.skorTotal || 0);
        return sortOrder === 'asc' ? diff : -diff;
      }

      // 7. Sorting berdasarkan Tindak Lanjut & PIC
      if (sortBy === 'status') {
        const comp = (a.statusTindakLanjut || '').localeCompare(b.statusTindakLanjut || '', 'id');
        return sortOrder === 'asc' ? comp : -comp;
      }

      return 0;
    });

    return list;
  }, [initialData, sortBy, sortOrder]);

  // Kalkulasi data halaman saat ini (Pagination Slicing)
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, sortedData.length);
  const paginatedData = useMemo(() => {
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, startIndex, endIndex]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (safeCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (safeCurrentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

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

  const renderSortIcon = (columnKey: string) => {
    if (sortBy === columnKey) {
      return sortOrder === 'asc' ? (
        <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
          <ArrowUp className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[10px]">Terendah</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
          <ArrowDown className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[10px]">Tertinggi</span>
        </span>
      );
    }
    return (
      <span className="text-slate-400 group-hover:text-slate-700 transition-colors p-0.5">
        <ArrowUpDown className="w-3.5 h-3.5" />
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
        <TableSearchInput
          placeholder="Cari Risk ID, Aset, atau Deskripsi..."
          initialValue={searchQuery}
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

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider select-none">
            <tr>
              {/* Kolom 1: Risk ID & Tingkat */}
              <th 
                onClick={() => handleSort('riskId')}
                className={`px-5 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors group ${
                  sortBy === 'riskId' ? 'bg-rose-50/60 text-rose-900' : ''
                }`}
                title="Klik untuk mengurutkan Risk ID"
              >
                <div className="flex items-center justify-between gap-2">
                  <span>Risk ID & Tingkat</span>
                  {renderSortIcon('riskId')}
                </div>
              </th>

              {/* Kolom 2: Aset Terkait (Sort by Asset ID - Default) */}
              <th 
                onClick={() => handleSort('assetId')}
                className={`px-5 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors group ${
                  sortBy === 'assetId' ? 'bg-rose-50/60 text-rose-900' : ''
                }`}
                title="Klik untuk mengurutkan berdasarkan Asset ID (Default: Terendah ke Tertinggi, data kosong di paling bawah)"
              >
                <div className="flex items-center justify-between gap-2">
                  <span>Aset Terkait / Asset ID</span>
                  {renderSortIcon('assetId')}
                </div>
              </th>

              {/* Kolom 3: Kategori & Deskripsi Risiko */}
              <th 
                onClick={() => handleSort('kategoriRisiko')}
                className={`px-5 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors group ${
                  sortBy === 'kategoriRisiko' ? 'bg-rose-50/60 text-rose-900' : ''
                }`}
                title="Klik untuk mengurutkan kategori risiko"
              >
                <div className="flex items-center justify-between gap-2">
                  <span>Kategori & Deskripsi</span>
                  {renderSortIcon('kategoriRisiko')}
                </div>
              </th>

              {/* Kolom 4: Penyebab / Akar Masalah */}
              <th 
                onClick={() => handleSort('penyebab')}
                className={`px-5 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors group ${
                  sortBy === 'penyebab' ? 'bg-rose-50/60 text-rose-900' : ''
                }`}
                title="Klik untuk mengurutkan penyebab masalah"
              >
                <div className="flex items-center justify-between gap-2">
                  <span>Penyebab / Akar Masalah</span>
                  {renderSortIcon('penyebab')}
                </div>
              </th>

              {/* Kolom 5: Matriks Skor */}
              <th 
                onClick={() => handleSort('skor')}
                className={`px-5 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors group text-center ${
                  sortBy === 'skor' ? 'bg-rose-50/60 text-rose-900' : ''
                }`}
                title="Klik untuk mengurutkan total skor dampak x peluang"
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Matriks Skor</span>
                  {renderSortIcon('skor')}
                </div>
              </th>

              {/* Kolom 6: Tindak Lanjut & PIC */}
              <th 
                onClick={() => handleSort('status')}
                className={`px-5 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors group ${
                  sortBy === 'status' ? 'bg-rose-50/60 text-rose-900' : ''
                }`}
                title="Klik untuk mengurutkan status tindak lanjut"
              >
                <div className="flex items-center justify-between gap-2">
                  <span>Tindak Lanjut & PIC</span>
                  {renderSortIcon('status')}
                </div>
              </th>

              {/* Kolom 7: Aksi */}
              <th className="px-5 py-3.5 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  Belum ada data risiko teridentifikasi yang sesuai. Aset dalam keadaan aman.
                </td>
              </tr>
            ) : (
              paginatedData.map((risk) => (
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
                  <td className="px-5 py-4 max-w-xs">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      {risk.tanah?.assetId && risk.tanah.assetId !== '-' && (
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-mono text-[10px] font-bold rounded border border-blue-200 break-all">
                          {risk.tanah.assetId}
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-slate-400">
                        {risk.tanah?.nibar && risk.tanah.nibar !== '-' && !risk.tanah.nibar.startsWith('BELUM-ADA') && risk.tanah.nibar !== risk.tanah?.assetId ? `NIBAR: ${risk.tanah.nibar}` : ''}
                      </span>
                    </div>
                    <Link href={`/dashboard/tanah/${risk.idTanah}`} className="font-semibold text-slate-800 hover:text-blue-600 hover:underline line-clamp-1 block">
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
      
      {/* Table Footer with Pagination Controls */}
      <div className="p-4 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600">Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer shadow-2xs"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
            </select>
            <span className="text-xs text-slate-500">per halaman</span>
          </div>

          <p className="text-xs">
            Menampilkan <span className="font-semibold text-slate-700">{sortedData.length === 0 ? 0 : startIndex + 1} - {endIndex}</span> dari{' '}
            <span className="font-semibold text-slate-700">{sortedData.length}</span> data terdaftar
          </p>
        </div>

        {/* Nomor Navigasi Halaman */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 self-center md:self-auto">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 bg-white shadow-2xs"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sebelumnya</span>
            </button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((p, idx) => {
                if (p === '...') {
                  return (
                    <span key={`dots-${idx}`} className="px-1.5 py-1 text-xs text-slate-400 select-none">
                      ...
                    </span>
                  );
                }
                const pageNum = Number(p);
                const isActive = pageNum === safeCurrentPage;
                return (
                  <button
                    key={`page-${pageNum}`}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                      isActive
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage === totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 bg-white shadow-2xs"
              title="Halaman Selanjutnya"
            >
              <span className="hidden sm:inline">Selanjutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
