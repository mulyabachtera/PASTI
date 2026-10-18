"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, AlertCircle, FileText } from "lucide-react";
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
    script.onerror = (e) => reject(new Error("Gagal menginisialisasi modul pembaca PDF"));
    document.head.appendChild(script);
  });
}

interface PdfCanvasViewerProps {
  url: string;
  fullHeight?: boolean;
}

export default function PdfCanvasViewer({ url, fullHeight = false }: PdfCanvasViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(1.25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadPdf() {
      setLoading(true);
      setError(null);
      try {
        // Safe base64 encoding of target URL to completely avoid IDM regex hooks on .pdf
        const targetB64 = typeof window !== "undefined"
          ? window.btoa(unescape(encodeURIComponent(url)))
          : Buffer.from(url).toString("base64");

        // Request JSON stream API: immune to IDM intercept
        const res = await fetch(`/api/docs/stream?target=${encodeURIComponent(targetB64)}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || `Gagal mengambil dokumen (${res.status})`);
        }

        const json = await res.json();
        if (!json.success || !json.data) {
          throw new Error(json.error || "Gagal memproses data dokumen.");
        }

        // Decode Base64 string directly into Uint8Array in memory
        const binaryString = window.atob(json.data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const pdfjsLib = await getPdfJsLib();
        if (!pdfjsLib) throw new Error("Gagal menginisialisasi pembaca PDF.");

        // Pass in-memory typed array directly to PDF.js (zero network/file hook)
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

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let renderTask: any = null;

    async function renderPage() {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        // Clear canvas before render
        context.clearRect(0, 0, canvas.width, canvas.height);

        const viewport = page.getViewport({ scale });
        const pixelRatio = window.devicePixelRatio || 1;

        canvas.width = viewport.width * pixelRatio;
        canvas.height = viewport.height * pixelRatio;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        renderTask = page.render({
          canvasContext: context,
          viewport: viewport,
        });

        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error("Page render error:", err);
        }
      }
    }

    renderPage();

    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, pageNum, scale]);

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm flex flex-col">
      {/* Viewer Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700 text-white text-xs">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-rose-400" />
          <span className="font-semibold text-slate-200 hidden sm:inline">Pratinjau Dokumen Asli</span>
          <span className="text-slate-400">
            Halaman {pageNum} dari {totalPages}
          </span>
        </div>

        {/* Navigation & Zoom Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-900/50">
            <button
              type="button"
              onClick={() => setPageNum(p => Math.max(1, p - 1))}
              disabled={pageNum <= 1}
              className="p-1.5 hover:bg-slate-700 disabled:opacity-40 transition-colors"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono font-bold text-[11px]">{pageNum}</span>
            <button
              type="button"
              onClick={() => setPageNum(p => Math.min(totalPages, p + 1))}
              disabled={pageNum >= totalPages}
              className="p-1.5 hover:bg-slate-700 disabled:opacity-40 transition-colors"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-900/50">
            <button
              type="button"
              onClick={() => setScale(s => Math.max(0.75, s - 0.2))}
              className="p-1.5 hover:bg-slate-700 transition-colors"
              title="Perkecil Zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-[11px]">{Math.round(scale * 100)}%</span>
            <button
              type="button"
              onClick={() => setScale(s => Math.min(2.5, s + 0.2))}
              className="p-1.5 hover:bg-slate-700 transition-colors"
              title="Perbesar Zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Paper Area */}
      <div className={`p-6 bg-slate-950/90 overflow-auto flex items-center justify-center ${
        fullHeight ? "min-h-[700px] max-h-[85vh]" : "min-h-[350px] max-h-[600px]"
      }`}>
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-xs font-medium">Memuat dan merender halaman sertifikat...</p>
          </div>
        )}

        {error && (
          <div className="p-6 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className={`shadow-2xl bg-white rounded-lg transition-transform ${loading || error ? "hidden" : "block"}`}
        />
      </div>
    </div>
  );
}
