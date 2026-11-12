"use client";

import { useEffect, useRef, useState } from "react";
import { 
  Loader2, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  FileText, 
  Layers, 
  File, 
  Maximize2 
} from "lucide-react";

// Dynamic client loader for local PDF.js to bypass Turbopack / SSR canvas dependency
async function getPdfJsLib(): Promise<any> {
  if (typeof window === "undefined") return null;
  if ((window as any).pdfjsLib) {
    (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
    return (window as any).pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="/pdf.min.js"]') as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).pdfjsLib) {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
        return resolve((window as any).pdfjsLib);
      }
      existing.addEventListener("load", () => {
        const lib = (window as any).pdfjsLib;
        if (lib) lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
        resolve(lib);
      });
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = "/pdf.min.js";
    script.async = true;
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      if (lib) {
        lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
      }
      resolve(lib);
    };
    script.onerror = () => reject(new Error("Gagal menginisialisasi modul pembaca PDF"));
    document.head.appendChild(script);
  });
}

/**
 * Komponen individual untuk merender satu halaman PDF ke elemen <canvas>.
 * Mendukung pembatalan renderTask saat zoom berubah atau unmount.
 */
function PdfPageCanvas({
  pageNumber,
  pdfDoc,
  scale,
  totalPages,
}: {
  pageNumber: number;
  pdfDoc: any;
  scale: number;
  totalPages: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    let renderTask: any = null;
    let isCancelled = false;

    async function render() {
      if (!pdfDoc || !canvasRef.current) return;
      setRendering(true);

      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) return;

        const viewport = page.getViewport({ scale });
        const pixelRatio = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        renderTask = page.render({
          canvasContext: context,
          viewport: viewport,
        });

        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error(`Gagal merender halaman ${pageNumber}:`, err);
        }
      } finally {
        if (!isCancelled) {
          setRendering(false);
        }
      }
    }

    render();

    return () => {
      isCancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {}
      }
    };
  }, [pdfDoc, pageNumber, scale]);

  return (
    <div
      id={`pdf-page-${pageNumber}`}
      className="flex flex-col items-center bg-white rounded-xl shadow-xl overflow-hidden border border-slate-700/60 my-3 scroll-mt-6 transition-all"
    >
      <div className="w-full bg-slate-800 text-slate-300 px-4 py-2 text-xs font-medium flex items-center justify-between border-b border-slate-700/80">
        <span className="font-semibold text-slate-200">
          Halaman {pageNumber} dari {totalPages}
        </span>
        {rendering ? (
          <span className="flex items-center gap-1.5 text-[11px] text-blue-400 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" /> Memuat halaman...
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 font-mono">
            {Math.round(scale * 100)}%
          </span>
        )}
      </div>
      <div className="p-2 sm:p-5 bg-slate-950/40 flex items-center justify-center min-h-[350px]">
        <canvas
          ref={canvasRef}
          className="shadow-2xl bg-white rounded-md transition-transform"
        />
      </div>
    </div>
  );
}

interface PdfCanvasViewerProps {
  url: string;
  fullHeight?: boolean;
}

export default function PdfCanvasViewer({ url, fullHeight = false }: PdfCanvasViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(1.15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mode Tampilan: "scroll" (Semua Halaman) atau "single" (Per Halaman)
  const [viewMode, setViewMode] = useState<"scroll" | "single">("scroll");

  useEffect(() => {
    let isCancelled = false;

    async function loadPdf() {
      setLoading(true);
      setError(null);
      try {
        // Enkoding base64 aman untuk nama/jalur berkas agar kebal dari regex IDM browser
        const targetB64 = typeof window !== "undefined"
          ? window.btoa(unescape(encodeURIComponent(url)))
          : Buffer.from(url).toString("base64");

        // Request stream biner langsung dari API: cepat tanpa overhead JSON Base64
        const res = await fetch(`/api/docs/stream?target=${encodeURIComponent(targetB64)}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || `Gagal mengambil dokumen (${res.status})`);
        }

        // Baca langsung sebagai ArrayBuffer biner murni (kecepatan C++ native)
        const arrayBuffer = await res.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        const pdfjsLib = await getPdfJsLib();
        if (!pdfjsLib) throw new Error("Gagal menginisialisasi pembaca PDF.");

        const loadingTask = pdfjsLib.getDocument({ data: bytes });
        const pdf = await loadingTask.promise;

        if (!isCancelled) {
          setPdfDoc(pdf);
          setTotalPages(pdf.numPages);
          setPageNum(1);
        }
      } catch (err: any) {
        console.error("PDF load error:", err);
        if (!isCancelled) {
          setError(err.message || "Gagal memproses dokumen PDF.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [url]);

  // Handler melompat ke halaman tertentu
  const handleJumpToPage = (targetPage: number) => {
    const page = Math.max(1, Math.min(totalPages, targetPage));
    setPageNum(page);
    if (viewMode === "scroll") {
      const el = document.getElementById(`pdf-page-${page}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shadow-md flex flex-col">
      {/* Viewer Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700 text-white text-xs">
        {/* Title & Document Status */}
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="font-semibold text-slate-100 hidden sm:inline">Pratinjau Sertifikat Asli</span>
          <span className="bg-slate-700/80 text-slate-200 px-2 py-0.5 rounded text-[11px] font-mono">
            {totalPages} Halaman
          </span>
        </div>

        {/* View Mode Toggle & Page Selector & Zoom Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Selector: Semua Halaman (Scroll) vs Per Halaman */}
          <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode("scroll")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === "scroll"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Tampilkan semua halaman berurutan ke bawah"
            >
              <Layers className="w-3.5 h-3.5" /> Semua Halaman
            </button>
            <button
              type="button"
              onClick={() => setViewMode("single")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === "single"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Tampilkan satu per satu per halaman"
            >
              <File className="w-3.5 h-3.5" /> Per Halaman
            </button>
          </div>

          {/* Quick Page Jump Dropdown */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-700 text-[11px]">
              <span className="text-slate-400">Hal:</span>
              <select
                value={pageNum}
                onChange={(e) => handleJumpToPage(Number(e.target.value))}
                className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer"
              >
                {pageNumbers.map((p) => (
                  <option key={p} value={p} className="bg-slate-800 text-white">
                    {p} / {totalPages}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Per Page Prev/Next Controls (hanya saat mode 'single') */}
          {viewMode === "single" && (
            <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-900/80">
              <button
                type="button"
                onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                disabled={pageNum <= 1}
                className="p-1.5 hover:bg-slate-700 disabled:opacity-30 transition-colors"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono font-bold text-[11px] text-slate-200">
                {pageNum} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPageNum((p) => Math.min(totalPages, p + 1))}
                disabled={pageNum >= totalPages}
                className="p-1.5 hover:bg-slate-700 disabled:opacity-30 transition-colors"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-900/80">
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(0.6, s - 0.15))}
              className="p-1.5 hover:bg-slate-700 transition-colors"
              title="Perkecil Zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-300 min-w-[42px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(2.5, s + 0.15))}
              className="p-1.5 hover:bg-slate-700 transition-colors"
              title="Perbesar Zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setScale(1.0)}
              className="px-2 py-1 border-l border-slate-700 hover:bg-slate-700 transition-colors text-[10px] text-slate-300"
              title="Atur ke 100%"
            >
              100%
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Paper Area */}
      <div
        className={`p-4 sm:p-6 bg-slate-950/95 overflow-auto flex flex-col items-center ${
          fullHeight ? "min-h-[750px] max-h-[88vh]" : "min-h-[450px] max-h-[700px]"
        }`}
      >
        {loading && (
          <div className="my-auto flex flex-col items-center justify-center gap-3 text-slate-400 py-16">
            <Loader2 className="w-9 h-9 animate-spin text-blue-500" />
            <p className="text-sm font-medium text-slate-300">Memuat berkas sertifikat...</p>
            <p className="text-xs text-slate-500">Menyiapkan halaman dokumen untuk pratinjau instan.</p>
          </div>
        )}

        {error && (
          <div className="my-auto p-6 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && pdfDoc && (
          <div className="w-full flex flex-col items-center">
            {viewMode === "scroll" ? (
              // Mode Gulir: Render semua halaman secara kontinu
              pageNumbers.map((p) => (
                <PdfPageCanvas
                  key={p}
                  pageNumber={p}
                  pdfDoc={pdfDoc}
                  scale={scale}
                  totalPages={totalPages}
                />
              ))
            ) : (
              // Mode Per Halaman: Render hanya halaman terpilih
              <PdfPageCanvas
                key={pageNum}
                pageNumber={pageNum}
                pdfDoc={pdfDoc}
                scale={scale}
                totalPages={totalPages}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
