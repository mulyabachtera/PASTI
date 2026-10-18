import { ArrowLeft, FileText, Download } from "lucide-react";
import Link from "next/link";
import PdfCanvasViewer from "@/components/PdfCanvasViewer";


export default async function DocumentViewerPage({
  searchParams,
}: {
  searchParams: Promise<{ file?: string; doc?: string; title?: string }>;
}) {
  const resolved = await searchParams;
  let fileUrl = resolved.file;

  if (!fileUrl && resolved.doc) {
    try {
      const decoded = Buffer.from(resolved.doc, "base64").toString("utf-8");
      if (decoded.includes("/") || decoded.includes("\\")) {
        fileUrl = decoded;
      } else {
        fileUrl = resolved.doc;
      }
    } catch {
      fileUrl = resolved.doc;
    }
  }

  const title = resolved.title || "Dokumen Sertifikat Tanah";

  if (!fileUrl) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-500 font-medium">Tautan berkas tidak valid atau tidak ditemukan.</p>
        <Link href="/dashboard/tanah" className="mt-4 inline-block text-blue-600 font-bold hover:underline">
          Kembali ke Master Tanah
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Viewer Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/tanah"
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-500" /> {title}
            </h2>
            <p className="text-xs text-slate-400 font-mono">{fileUrl.split("/").pop()}</p>
          </div>
        </div>

        <a
          href={fileUrl}
          download
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Download className="w-4 h-4" /> Unduh Berkas Asli
        </a>
      </div>

      {/* Canvas PDF Viewer (100% immune to IDM intercept) */}
      <PdfCanvasViewer url={fileUrl} fullHeight={true} />
    </div>
  );
}
