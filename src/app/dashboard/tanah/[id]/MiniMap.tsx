"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getCertificatePolygonStyle } from "@/lib/geoUtils";

export default function MiniMap({ 
  geojsonString,
  statusLegalitas,
  noSertifikat
}: { 
  geojsonString: string;
  statusLegalitas?: string | null;
  noSertifikat?: string | null;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!geojsonString) return;

    let coords: L.LatLngTuple[] = [];
    try {
      const geo = JSON.parse(geojsonString);
      if (geo.type === "Polygon") {
        coords = geo.coordinates[0].map((c: [number, number]) => [c[1], c[0]]);
      }
    } catch (e) {}

    if (coords.length === 0) return;

    // Initialize Map
    const map = L.map(mapRef.current, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false
    }).setView(coords[0], 15);
    
    mapInstanceRef.current = map;

    // Basemaps: Google Hybrid for high-resolution satellite imagery down to parcels
    L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 21,
      maxNativeZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    }).addTo(map);

    // Add Polygon with certificate-based coloring
    const certStyle = getCertificatePolygonStyle(statusLegalitas, noSertifikat);
    L.polygon(coords, {
      color: certStyle.color,
      fillColor: certStyle.fillColor,
      fillOpacity: certStyle.fillOpacity,
      weight: certStyle.weight
    }).addTo(map);

    // Fit Bounds
    setTimeout(() => {
      try {
        const bounds = L.latLngBounds(coords);
        map.fitBounds(bounds, { padding: [20, 20], maxZoom: 18 });
      } catch (e) {}
    }, 100);

    return () => {
      try {
        map.remove();
        mapInstanceRef.current = null;
      } catch (e) {}
    };
  }, [geojsonString]);

  if (!geojsonString) {
    return <div className="w-full h-full bg-slate-100 flex items-center justify-center text-sm text-slate-400">Data Spasial Tidak Tersedia</div>;
  }

  return <div ref={mapRef} className="w-full h-full z-0" />;
}
