"use client";

import { useState } from "react";
import { FileText, Image as ImageIcon, ExternalLink, CheckCircle2, AlertCircle, Download, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import PdfCanvasViewer from "@/components/PdfCanvasViewer";

export default function DocumentUpload({ 
  idTanah, 
  currentDocUrl,
  currentFotoUrl,
}: { 
  idTanah: string; 
  currentDocUrl: string | null;
  currentFotoUrl?: string | null;
}) {
  const [showEmbeddedPdf, setShowEmbeddedPdf] = useState(false);

  return (
    <div className="space-y-8">
      {/* 1. SEKSI FOTO FISIK LAPANGAN */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-600" /> Foto Fisik Aset Lapangan
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">Dokumentasi kondisi visual riil di lokasi aset tanah.</p>
          </div>
          {currentFotoUrl ? (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Foto Tersedia
            </span>
          ) : (
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-slate-400" /> Belum Ada Foto
            </span>
          )}
        </div>

        {currentFotoUrl ? (
          <div className="space-y-2">
            <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm max-h-[380px] flex items-center justify-center">
              <img 
                src={currentFotoUrl} 
                alt="Foto Dokumentasi Fisik Aset" 
                className="w-full h-auto max-h-[380px] object-cover transition-transform duration-500 group-hover:scale-102" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                <span className="text-white text-xs font-medium bg-black/40 backdrop-blur px-2.5 py-1 rounded-lg">
                  Dokumentasi Lapangan BPN/Pemda
                </span>
                <a 
                  href={currentFotoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-semibold hover:bg-slate-100 flex items-center gap-1.5 shadow-md transition-transform active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5" /> Buka Ukuran Penuh
                </a>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 text-center italic">Klik atau arahkan kursor ke foto untuk melihat resolusi penuh.</p>
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/60 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Belum Ada Dokumentasi Foto Fisik</p>
              <p className="text-xs text-slate-400 mt-0.5">Foto fisik aset dapat diunggah melalui menu Edit Aset.</p>
            </div>
            <Link 
              href={`/dashboard/tanah/${idTanah}/edit`}
              className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              + Unggah Foto Sekarang
            </Link>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100" />

      {/* 2. SEKSI DOKUMEN SERTIFIKAT DIGITAL */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" /> Dokumen Sertifikat Digital (PDF / Scan)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">Berkas legalitas hak atas tanah yang terdaftar resmi.</p>
          </div>
          {currentDocUrl ? (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sertifikat Sah
            </span>
          ) : (
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-slate-400" /> Belum Diunggah
            </span>
          )}
        </div>

        {currentDocUrl ? (
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs space-y-4 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex flex-col items-center justify-center text-rose-600 font-bold text-xs shadow-xs flex-shrink-0">
                  <FileText className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px] uppercase font-black">PDF</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Berkas Sertifikat Hak Atas Tanah</p>
                  <p className="text-xs text-slate-500 mt-0.5">Arsip Digital Terdaftar & Terverifikasi</p>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5 truncate max-w-xs">
                    {currentDocUrl.split('/').pop()}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmbeddedPdf(!showEmbeddedPdf)}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {showEmbeddedPdf ? (
                    <><EyeOff className="w-3.5 h-3.5 text-slate-500" /> Tutup Pratinjau</>
                  ) : (
                    <><Eye className="w-3.5 h-3.5 text-blue-600" /> Pratinjau di Halaman</>
                  )}
                </button>
                <Link 
                  href={`/dashboard/tanah/viewer?doc=${encodeURIComponent(typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(currentDocUrl))) : Buffer.from(currentDocUrl).toString('base64'))}&title=${encodeURIComponent('Sertifikat Tanah Sah')}`}
                  target="_blank" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Buka Tab Baru
                </Link>
                <a 
                  href={currentDocUrl} 
                  download
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh File
                </a>
              </div>
            </div>

            {/* Embedded PDF Canvas Viewer - Immune to IDM auto-download */}
            {showEmbeddedPdf && (
              <div className="mt-4 transition-all">
                <PdfCanvasViewer url={currentDocUrl} />
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/60 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Belum Ada Dokumen Sertifikat Terunggah</p>
              <p className="text-xs text-slate-400 mt-0.5">Berkas scan sertifikat dapat dilampirkan melalui menu Edit Aset.</p>
            </div>
            <Link 
              href={`/dashboard/tanah/${idTanah}/edit`}
              className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              + Lampirkan Sertifikat Sekarang
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
