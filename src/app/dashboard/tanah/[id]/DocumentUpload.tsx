"use client";

import { useState } from "react";
import { 
  FileText, 
  Image as ImageIcon, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Eye, 
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Layers
} from "lucide-react";
import Link from "next/link";
import PdfCanvasViewer from "@/components/PdfCanvasViewer";
import { parseFotoList } from "@/lib/photoUtils";

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
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const fotoList = parseFotoList(currentFotoUrl);
  const hasPhotos = fotoList.length > 0;
  const currentPhoto = hasPhotos ? fotoList[Math.min(activePhotoIdx, fotoList.length - 1)] : null;

  return (
    <div className="space-y-8">
      {/* 1. SEKSI FOTO FISIK LAPANGAN (Maksimal 5 Foto) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-600" /> Galeri Foto Fisik Aset Lapangan
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Dokumentasi kondisi visual riil di lokasi aset tanah (Maks. 5 Foto).
            </p>
          </div>
          {hasPhotos ? (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {fotoList.length} Foto Tersedia
            </span>
          ) : (
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-slate-400" /> Belum Ada Foto
            </span>
          )}
        </div>

        {hasPhotos && currentPhoto ? (
          <div className="space-y-3">
            {/* Foto Utama Aktif */}
            <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm min-h-[260px] max-h-[420px] flex items-center justify-center">
              <img 
                src={currentPhoto} 
                alt={`Foto Dokumentasi Fisik Aset ${activePhotoIdx + 1}`} 
                className="w-full h-auto max-h-[420px] object-contain transition-transform duration-500" 
              />

              {/* Prev / Next Navigation Arrows for Multi-Photo */}
              {fotoList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActivePhotoIdx((idx) => (idx > 0 ? idx - 1 : fotoList.length - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur transition-all shadow-md active:scale-95"
                    title="Foto Sebelumnya"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePhotoIdx((idx) => (idx < fotoList.length - 1 ? idx + 1 : 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur transition-all shadow-md active:scale-95"
                    title="Foto Selanjutnya"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Overlay Bar */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-90 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4 pointer-events-none">
                <div className="flex items-center gap-2 pointer-events-auto">
                  <span className="text-white text-xs font-semibold bg-black/60 backdrop-blur px-3 py-1 rounded-lg">
                    Foto {activePhotoIdx + 1} dari {fotoList.length}
                  </span>
                  {activePhotoIdx === 0 && (
                    <span className="text-amber-300 text-[11px] font-bold bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-md">
                      Foto Utama
                    </span>
                  )}
                </div>
                <a 
                  href={currentPhoto} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="pointer-events-auto px-3.5 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-semibold hover:bg-slate-100 flex items-center gap-1.5 shadow-md transition-transform active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5" /> Buka Resolusi Penuh
                </a>
              </div>
            </div>

            {/* Thumbnail Carousel / Selector Strip (jika > 1 foto) */}
            {fotoList.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                {fotoList.map((photoUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 w-20 h-16 group ${
                      idx === activePhotoIdx 
                        ? "border-indigo-600 ring-2 ring-indigo-400/40 scale-102 shadow-sm" 
                        : "border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img 
                      src={photoUrl} 
                      alt={`Thumbnail ${idx + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-mono px-1.5 py-0.2 rounded font-bold">
                      {idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            )}
            
            <p className="text-[11px] text-slate-400 text-center italic">
              Klik thumbnail atau gunakan panah navigasi untuk melihat foto lapangan lainnya.
            </p>
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/60 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Belum Ada Dokumentasi Foto Fisik</p>
              <p className="text-xs text-slate-400 mt-0.5">Hingga 5 foto fisik aset dapat diunggah melalui menu Edit Aset.</p>
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
