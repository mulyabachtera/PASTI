"use client";

import dynamic from "next/dynamic";

// Dynamically import the actual MiniMap component with SSR disabled
const DynamicMiniMap = dynamic(() => import("./MiniMap"), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">Memuat Peta...</div>
});

export default function MiniMapWrapper({ 
  geojsonString,
  statusLegalitas,
  noSertifikat
}: { 
  geojsonString: string;
  statusLegalitas?: string | null;
  noSertifikat?: string | null;
}) {
  return (
    <DynamicMiniMap 
      geojsonString={geojsonString} 
      statusLegalitas={statusLegalitas}
      noSertifikat={noSertifikat}
    />
  );
}
