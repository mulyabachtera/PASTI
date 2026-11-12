"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
      <Loader2 className="w-9 h-9 text-blue-500 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-300">Memuat Peta Spasial Layar Penuh...</p>
      <p className="text-xs text-slate-500 mt-1">Mengunduh layer kadastral dan citra satelit resolusi tinggi</p>
    </div>
  ),
});

export default function PetaClient() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-slate-950 m-0 p-0">
      <MapComponent mode="standalone" />
    </main>
  );
}

