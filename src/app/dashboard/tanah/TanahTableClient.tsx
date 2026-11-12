"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowUpDown, ArrowUp, ArrowDown, Clock, CheckCircle2, XCircle, FileText,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import ActionMenu from './ActionMenu';
import TableSearchInput from '@/components/dashboard/TableSearchInput';

interface TanahItem {
  id: string;
  assetId: string | null;
  kodeTanah: string | null;
  kodeLokasi: string | null;
  kodeBarang: string | null;
  nibar: string;
  namaBarang: string;
  pengelola: string | null;
  luas: number | null;
  statusHak: string | null;
  statusLegalitas: string | null;
  statusVerifikasi: string | null;
  catatanVerifikasi: string | null;
  verifiedBy: string | null;
  inputBy: string | null;
  kategoriRisiko: string | null;
  totalSkorRisiko: number | null;
  prioritasTindakan: string | null;
  alamatLokasi: string | null;
  skorAdministrasi?: number | null;
  skorLegal?: number | null;
  skorFisik?: number | null;
  skorPenguasaan?: number | null;
  skorSengketa?: number | null;
  skorStrategis?: number | null;
  [key: string]: any;
}

interface TanahTableClientProps {
  initialData: TanahItem[];
  allCount: number;
  filterDimensi?: string;
  searchQuery?: string;
}

export default function TanahTableClient({
  initialData,
  allCount,
  filterDimensi,
  searchQuery = '',
}: TanahTableClientProps) {
  // Default urutan: Asset ID terendah (asc), aset tanpa Asset ID ditempatkan paling bawah
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
      // 1. Khusus Sorting berdasarkan Asset ID (Default & User Click)
      if (sortBy === 'assetId') {
        const hasA = hasAssetId(a.assetId);
        const hasB = hasAssetId(b.assetId);

        // Jika salah satu tidak punya Asset ID, tempatkan selalu di paling bawah
        if (!hasA && hasB) return 1;
        if (hasA && !hasB) return -1;
        if (!hasA && !hasB) {
          return (a.namaBarang || '').localeCompare(b.namaBarang || '', 'id');
        }

        const comp = (a.assetId || '').localeCompare(b.assetId || '', undefined, { numeric: true });
        return sortOrder === 'asc' ? comp : -comp;
      }

      // 2. Sorting berdasarkan Nama Aset
      if (sortBy === 'namaBarang') {
        const comp = (a.namaBarang || '').localeCompare(b.namaBarang || '', 'id', { sensitivity: 'base' });
        return sortOrder === 'asc' ? comp : -comp;
      }

      // 3. Sorting berdasarkan Luas
      if (sortBy === 'luas') {
        const luasA = a.luas != null ? Number(a.luas) : null;
        const luasB = b.luas != null ? Number(b.luas) : null;

        if (luasA === null && luasB !== null) return 1;
        if (luasA !== null && luasB === null) return -1;
        if (luasA === null && luasB === null) return 0;

        const diff = (luasA as number) - (luasB as number);
        return sortOrder === 'asc' ? diff : -diff;
      }

      // 4. Sorting berdasarkan Status Hak & Legalitas
      if (sortBy === 'statusHak') {
        const strA = `${a.statusHak || ''} ${a.statusLegalitas || ''}`.trim();
        const strB = `${b.statusHak || ''} ${b.statusLegalitas || ''}`.trim();
        const comp = strA.localeCompare(strB, 'id');
        return sortOrder === 'asc' ? comp : -comp;
      }

      // 5. Sorting berdasarkan Status Verifikasi
      if (sortBy === 'statusVerifikasi') {
        const comp = (a.statusVerifikasi || '').localeCompare(b.statusVerifikasi || '', 'id');
        return sortOrder === 'asc' ? comp : -comp;
      }

      // 6. Sorting berdasarkan Tingkat Risiko / Total Skor Risiko
      if (sortBy === 'risiko') {
        const skorA = Number(a.totalSkorRisiko) || 0;
        const skorB = Number(b.totalSkorRisiko) || 0;
        const diff = skorA - skorB;
        return sortOrder === 'asc' ? diff : -diff;
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

  const renderSortIcon = (columnKey: string) => {
    if (sortBy === columnKey) {
      return sortOrder === 'asc' ? (
        <span className="inline-flex items-center gap-1 text-blue-600 font-bold text-[11px] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
          <ArrowUp className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[10px]">Terendah</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-blue-600 font-bold text-[11px] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
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
          placeholder="Cari Asset ID, NIBAR, atau Nama Aset..."
          initialValue={searchQuery}
          accentColor="blue"
        />
        <div className="flex gap-2 w-full sm:w-auto items-center">
          <a 
            href="/api/export/tanah"
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
              {/* Kolom 1: Asset ID / NIBAR */}
              <th 
                onClick={() => handleSort('assetId')}
                className={`px-5 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors group ${
                  sortBy === 'assetId' ? 'bg-blue-50/60 text-blue-900' : ''
                }`}
                title="Klik untuk mengurutkan berdasarkan Asset ID (Default: Terendah ke Tertinggi, data kosong di paling bawah)"
              >
                <div className="flex items-center justify-between gap-2">
                  <span>Asset ID / NIBAR</span>
                  {renderSortIcon('assetId')}
                </div>
              </th>

              {/* Kolom 2: Nama Aset & Kodefikasi */}
              <th 
                onClick={() => handleSort('namaBarang')}
                className={`px-5 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors group ${
                  sortBy === 'namaBarang' ? 'bg-blue-50/60 text-blue-900' : ''
                }`}
                title="Klik untuk mengurutkan nama aset A - Z / Z - A"
              >
                <div className="flex items-center justify-between gap-2">
                  <span>Nama Aset & Kodefikasi</span>
                  {renderSortIcon('namaBarang')}
                </div>
              </th>

              {/* Kolom 3: Luas */}
              <th 
                onClick={() => handleSort('luas')}
                className={`px-5 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors group ${
                  sortBy === 'luas' ? 'bg-blue-50/60 text-blue-900' : ''
                }`}
                title="Klik untuk mengurutkan luas m²"
              >
                <div className="flex items-center justify-between gap-2">
                  <span>Luas (m²)</span>
                  {renderSortIcon('luas')}
                </div>
              </th>

              {/* Kolom 4: Status Hak & Legalitas */}
              <th 
                onClick={() => handleSort('statusHak')}
                className={`px-5 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors group ${
                  sortBy === 'statusHak' ? 'bg-blue-50/60 text-blue-900' : ''
                }`}
                title="Klik untuk mengurutkan status hak dan legalitas sertifikat"
              >
                <div className="flex items-center justify-between gap-2">
                  <span>Status Hak & Legalitas</span>
                  {renderSortIcon('statusHak')}
                </div>
              </th>

              {/* Kolom 5: Status Verifikasi */}
              <th 
                onClick={() => handleSort('statusVerifikasi')}
                className={`px-5 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors group ${
                  sortBy === 'statusVerifikasi' ? 'bg-blue-50/60 text-blue-900' : ''
                }`}
                title="Klik untuk mengurutkan status verifikasi"
              >
                <div className="flex items-center justify-between gap-2">
                  <span>Status Verifikasi</span>
                  {renderSortIcon('statusVerifikasi')}
                </div>
              </th>

              {/* Kolom 6: Tingkat Risiko */}
              <th 
                onClick={() => handleSort('risiko')}
                className={`px-5 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors group ${
                  sortBy === 'risiko' ? 'bg-blue-50/60 text-blue-900' : ''
                }`}
                title="Klik untuk mengurutkan tingkat risiko dan total skor"
              >
                <div className="flex items-center justify-between gap-2">
                  <span>
                    {filterDimensi && filterDimensi !== 'all'
                      ? `Skor Dimensi & Risiko`
                      : `Tingkat Risiko`}
                  </span>
                  {renderSortIcon('risiko')}
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
                  Tidak ada data aset tanah yang sesuai dengan filter pencarian ini.
                </td>
              </tr>
            ) : (
              paginatedData.map((tanah) => {
                return (
                  <tr key={tanah.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 max-w-[220px]">
                      <span className="block font-mono text-xs font-bold text-blue-600 break-all">
                        {tanah.assetId && tanah.assetId !== '-' ? tanah.assetId : '-'}
                      </span>
                      {tanah.nibar && tanah.nibar !== '-' && !tanah.nibar.startsWith('BELUM-ADA') && tanah.nibar !== tanah.assetId && (
                        <span className="font-mono text-[11px] text-slate-400 block break-all">
                          NIBAR: {tanah.nibar}
                        </span>
                      )}
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
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
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
                        ? 'bg-blue-600 text-white shadow-xs'
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
