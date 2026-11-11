"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Loader2 } from "lucide-react";
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

export default function MapComponent() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<{ tanah: any[]; risk: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [legendStats, setLegendStats] = useState({ hijau: 0, kuning: 0, merah: 0, total: 0 });
  const mapInstanceRef = useRef<L.Map | null>(null);

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
            <span style="font-size: 10px; font-weight: 700; color: #475569; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">
              ${(t.assetId && t.assetId !== '-') ? t.assetId : ((t.nibar && t.nibar !== '-') ? t.nibar : (t.kodeTanah || 'Aset Tanah'))}
            </span>
            <span style="font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; background: ${badgeBg}; color: ${badgeTextColor}; border: 1px solid ${badgeBorder};">
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
            <a href="/dashboard/tanah/${t.id}" style="color: #2563eb; font-weight: 700; font-size: 11px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
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
  }, [isLoading, data]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 rounded-2xl">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Memuat Data Spasial...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-inner border border-slate-200 z-10">
      <div ref={mapRef} className="w-full h-full min-h-[400px]" />

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
