"use client";

import { Printer } from "lucide-react";

export default function PrintAssetButton({ namaAset }: { namaAset: string }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      type="button"
      className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs print:hidden cursor-pointer"
      title="Cetak atau Simpan Lembar Profil Aset sebagai PDF"
    >
      <Printer className="w-4 h-4 text-slate-600" />
      <span>Cetak Lembar Aset (PDF)</span>
    </button>
  );
}
