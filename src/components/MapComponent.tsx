"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Loader2, Maximize2, ArrowLeft, X } from "lucide-react";
import { getCertificatePolygonStyle } from "@/lib/geoUtils";

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const dangerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

if (typeof window !== "undefined") {
  (window as any).L = L;
}

export interface MapComponentProps {
  mode?: "embedded" | "standalone";
}

export default function MapComponent({ mode = "embedded" }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<{ tanah: any[]; risk: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [legendStats, setLegendStats] = useState({ hijau: 0, kuning: 0, merah: 0, total: 0 });
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Resize listener agar peta selalu pas saat ukuran jendela browser berubah
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener("resize", handleResize);
    const timer = setTimeout(handleResize, 300);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/assets")
      .then((res) => res.json())
      .then((d) => {
        if (isMounted) {
          setData(d);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isLoading || !mapRef.current) return;

    // Default center if no data (Takengon, Aceh Tengah)
    const defaultCenter: L.LatLngTuple = [4.625, 96.842];
    
    // Parse GeoJSON and calculate bounds
    const allLatLngs: L.LatLngTuple[] = [];
    const tanahPolygons: any[] = [];
    const riskPoints: any[] = [];

    let statHijau = 0;
    let statKuning = 0;
    let statMerah = 0;

    if (data?.tanah) {
      data.tanah.forEach((t: any) => {
        if (t.geojson) {
          try {
            const geo = JSON.parse(t.geojson);
            if (geo.type === "Polygon") {
              const coords = geo.coordinates[0].map((coord: [number, number]) => {
                const latlng: L.LatLngTuple = [coord[1], coord[0]];
                allLatLngs.push(latlng);
                return latlng;
              });
              tanahPolygons.push({ ...t, coords });

              // Hitung statistik warna poligon
              const style = getCertificatePolygonStyle(t.statusLegalitas, t.noSertifikat);
              if (style.category === 'hijau') statHijau++;
              else if (style.category === 'kuning') statKuning++;
              else statMerah++;
            }
          } catch (e) {
            console.error("Error parsing GeoJSON:", e);
          }
        }
      });
    }

    setLegendStats({
      hijau: statHijau,
      kuning: statKuning,
      merah: statMerah,
      total: tanahPolygons.length
    });

    if (data?.risk) {
      data.risk.forEach((r: any) => {
        if (r.geojson) {
          try {
            const geo = JSON.parse(r.geojson);
            if (geo.type === "Point") {
              const latlng: L.LatLngTuple = [geo.coordinates[1], geo.coordinates[0]];
              allLatLngs.push(latlng);
              riskPoints.push({ ...r, coords: latlng });
            }
          } catch (e) {
            console.error("Error parsing risk point:", e);
          }
        }
      });
    }

    // Initialize Map with high zoom limit
    const map = L.map(mapRef.current, {
      maxZoom: 21,
    }).setView(defaultCenter, 12);
    mapInstanceRef.current = map;

    // Basemaps:
    // 1. Google Hybrid (Satellite + Labels) - natively sharp up to zoom 20 in Aceh Tengah
    const googleHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 21,
      maxNativeZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    });

    // 2. Esri World Imagery (with maxNativeZoom: 17 to prevent "Map data not yet available" tiles)
    const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri',
      maxZoom: 21,
      maxNativeZoom: 17,
    });

    const esriLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 21,
      maxNativeZoom: 17,
    });

    const esriGroup = L.layerGroup([esriSatellite, esriLabels]);

    // 3. OpenStreetMap
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap'
    });

    // Default to Google Hybrid for high-resolution satellite imagery
    googleHybrid.addTo(map);

    // Basemap Switcher Control
    const baseMaps = {
      "🛰️ Satelit HD (Google)": googleHybrid,
      "🌍 Satelit Esri (ArcGIS)": esriGroup,
      "🗺️ Peta Jalan (OSM)": osm,
    };
    L.control.layers(baseMaps, undefined, { position: 'topright' }).addTo(map);

    // Add Polygons dengan warna berbasis sertifikat:
    // Hijau = Bersertifikat, Kuning = Dalam Pengurusan, Merah = Tidak Ada / Bermasalah
    tanahPolygons.forEach(t => {
      const certStyle = getCertificatePolygonStyle(t.statusLegalitas, t.noSertifikat);
      
      const polygon = L.polygon(t.coords, {
        color: certStyle.color,
        fillColor: certStyle.fillColor,
        fillOpacity: certStyle.fillOpacity,
        weight: certStyle.weight
      }).addTo(map);

      let badgeBg = "#dcfce7";
      let badgeTextColor = "#15803d";
      let badgeBorder = "#86efac";

      if (certStyle.category === 'kuning') {
        badgeBg = "#fef3c7";
        badgeTextColor = "#b45309";
        badgeBorder = "#fcd34d";
      } else if (certStyle.category === 'merah') {
        badgeBg = "#ffe4e6";
        badgeTextColor = "#be123c";
        badgeBorder = "#fda4af";
      }
      
      const popupContent = `
        <div style="font-family: inherit; min-width: 230px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; background: ${badgeBg}; color: ${badgeTextColor}; border: 1px solid ${badgeBorder}; display: inline-flex; align-items: center; gap: 5px;">
              <span style="width: 6px; height: 6px; border-radius: 9999px; background: ${certStyle.color};"></span>
              ${certStyle.label}
            </span>
          </div>

          <h3 style="font-weight: 700; color: #0f172a; font-size: 13px; line-height: 1.35; margin: 0 0 8px 0;">
            ${t.namaBarang}
          </h3>

          <div style="font-size: 11px; color: #475569; display: flex; flex-direction: column; gap: 4px; border-top: 1px solid #f1f5f9; padding-top: 8px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Legalitas:</span>
              <span style="font-weight: 600; color: #1e293b;">${t.statusLegalitas || 'Belum Terdata'}</span>
            </div>
            ${t.noSertifikat ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">No. Sertifikat:</span>
              <span style="font-weight: 600; font-family: monospace; color: #0f172a;">${t.noSertifikat}</span>
            </div>` : ''}
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Status Hak:</span>
              <span style="font-weight: 600; color: #2563eb;">${t.statusHak || '-'}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Luas Bidang:</span>
              <span style="font-weight: 700; color: #0f172a;">${Number(t.luas || 0).toLocaleString('id-ID')} m²</span>
            </div>
          </div>

          <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #f1f5f9; text-align: right;">
            <a href="/dashboard/tanah/${t.id}" target="${mode === 'standalone' ? '_blank' : '_self'}" style="color: #2563eb; font-weight: 700; font-size: 11px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
              Buka Detail Aset &rarr;
            </a>
          </div>
        </div>
      `;
      polygon.bindPopup(popupContent);
    });

    // Add Markers
    riskPoints.forEach(r => {
      const marker = L.marker(r.coords, {
        icon: r.tingkatRisiko === 'Extreme' ? dangerIcon : new L.Icon.Default()
      }).addTo(map);

      const popupContent = `
        <div class="p-1 font-sans">
          <h3 class="font-bold text-rose-600 text-sm mb-1">Risiko ${r.kategoriRisiko}</h3>
          <p class="text-xs text-slate-700 font-medium mb-1">${r.tingkatRisiko} Level</p>
          <p class="text-xs text-slate-500 leading-tight">${r.deskripsiRisiko}</p>
        </div>
      `;
      marker.bindPopup(popupContent);
    });

    // Fit Bounds
    if (allLatLngs.length > 0) {
      const bounds = L.latLngBounds(allLatLngs);
      setTimeout(() => {
        try {
          map.fitBounds(bounds, { padding: [50, 50] });
        } catch (e) {}
      }, 200);
    }

    // Cleanup on unmount
    return () => {
      try {
        map.remove(); // Safely destroy Leaflet instance
        mapInstanceRef.current = null;
      } catch (e) {}
    };
  }, [isLoading, data, mode]);

  if (isLoading) {
    return (
      <div className={mode === "standalone" ? "w-screen h-screen flex flex-col items-center justify-center bg-slate-950 text-white" : "w-full h-full flex flex-col items-center justify-center bg-slate-100 rounded-2xl min-h-[400px]"}>
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className={mode === "standalone" ? "text-slate-300 font-medium" : "text-slate-500 font-medium"}>Memuat Data Spasial...</p>
      </div>
    );
  }

  const isStandalone = mode === "standalone";

  return (
    <div
      className={
        isStandalone
          ? "w-screen h-screen overflow-hidden bg-slate-950 relative m-0 p-0"
          : "w-full h-full relative rounded-2xl overflow-hidden shadow-inner border border-slate-200 z-10 min-h-[400px]"
      }
    >
      {/* Kontainer Peta Leaflet */}
      <div ref={mapRef} className="w-full h-full min-h-[400px]" />

      {/* Floating Control di Atas Peta */}
      {isStandalone ? (
        /* Floating Pill Khusus Mode Peta Standalone (Layar Penuh Tab Baru) */
        <div className="absolute top-3 left-14 z-[400] flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700/80 shadow-2xl text-xs">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-700/80">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-white text-xs tracking-tight">
              Live WebGIS Aset Daerah
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              Kab. Aceh Tengah
            </span>
          </div>

          <a
            href="/dashboard"
            className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors font-medium flex items-center gap-1.5 text-[11px]"
            title="Buka Halaman Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </a>

          <button
            type="button"
            onClick={() => window.close()}
            className="px-2.5 py-1 text-rose-300 hover:text-white hover:bg-rose-600/80 rounded-xl transition-colors font-medium flex items-center gap-1 text-[11px] border border-rose-500/30 cursor-pointer"
            title="Tutup Tab Ini"
          >
            <X className="w-3.5 h-3.5" />
            <span>Tutup Tab</span>
          </button>
        </div>
      ) : (
        /* Tombol Buka Layar Penuh di Tab Baru (Untuk Mode Embedded Dashboard) */
        <a
          href="/peta"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-3 left-14 z-[400] bg-white/95 hover:bg-white text-slate-700 hover:text-blue-600 px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-md font-semibold text-xs flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer backdrop-blur-xs"
          title="Buka Peta Spasial Layar Penuh di Tab Baru"
        >
          <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Layar Penuh (Tab Baru)</span>
        </a>
      )}

      {/* Floating Legend: Indikator Sertifikat Poligon */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md px-3.5 py-3 rounded-2xl border border-slate-200/80 shadow-lg text-xs max-w-xs transition-all hover:bg-white">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <span className="font-bold text-slate-800 text-[11px] tracking-tight flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            Indikator Sertifikat Lahan
          </span>
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
            {legendStats.total} Bidang
          </span>
        </div>

        <div className="space-y-1.5">
          {/* Hijau */}
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-700 shadow-sm inline-block flex-shrink-0" />
              <span className="text-slate-700 font-medium">Sudah Bersertifikat</span>
            </div>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
              {legendStats.hijau}
            </span>
          </div>

          {/* Kuning */}
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-amber-500 border border-amber-700 shadow-sm inline-block flex-shrink-0" />
              <span className="text-slate-700 font-medium">Dalam Pengurusan</span>
            </div>
            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[10px]">
              {legendStats.kuning}
            </span>
          </div>

          {/* Merah */}
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-rose-500 border border-rose-700 shadow-sm inline-block flex-shrink-0" />
              <span className="text-slate-700 font-medium">Tidak Ada / Bermasalah</span>
            </div>
            <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[10px]">
              {legendStats.merah}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
