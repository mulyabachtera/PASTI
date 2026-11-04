"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { getCertificatePolygonStyle } from "@/lib/geoUtils";

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

if (typeof window !== "undefined") {
  (window as any).L = L;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@geoman-io/leaflet-geoman-free");
}

export default function FormMapComponent({
  onPolygonDrawn,
  initialGeojson,
  statusLegalitas,
  noSertifikat
}: {
  onPolygonDrawn: (geojson: any) => void,
  initialGeojson?: any,
  statusLegalitas?: string | null,
  noSertifikat?: string | null
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentLayerRef = useRef<any>(null);
  const isInternalChangeRef = useRef<boolean>(false);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center (Takengon, Aceh Tengah)
      const defaultCenter: L.LatLngTuple = [4.625, 96.842];
      const map = L.map(mapRef.current).setView(defaultCenter, 14);
      mapInstanceRef.current = map;

      // Basemaps:
      // 1. Google Hybrid (Satellite + Labels)
      const googleHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        maxZoom: 21,
        maxNativeZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps'
      });

      // 2. Esri World Imagery
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

      // Default to Google Hybrid
      googleHybrid.addTo(map);

      // Basemap Switcher Control
      const baseMaps = {
        "🛰️ Satelit HD (Google)": googleHybrid,
        "🌍 Satelit Esri (ArcGIS)": esriGroup,
        "🗺️ Peta Jalan (OSM)": osm,
      };
      L.control.layers(baseMaps, undefined, { position: 'topright' }).addTo(map);

      // Helper to bind layer events for live area calculation
      const bindLayerEvents = (layer: any) => {
        const notifyUpdate = () => {
          isInternalChangeRef.current = true;
          try {
            const gj = layer.toGeoJSON();
            if (gj && gj.geometry) {
              onPolygonDrawn(gj.geometry);
            }
          } catch (err) {
            console.error("Error retrieving layer GeoJSON:", err);
          }
        };

        layer.on("pm:edit", notifyUpdate);
        layer.on("pm:update", notifyUpdate);
        layer.on("pm:vertexchange", notifyUpdate);
        layer.on("pm:dragend", notifyUpdate);
      };

      if ((map as any).pm) {
        (map as any).pm.addControls({
          position: 'topleft',
          drawCircle: false,
          drawCircleMarker: false,
          drawPolyline: false,
          drawRectangle: false,
          drawText: false,
          cutPolygon: false,
          editMode: true,
          dragMode: true,
          removalMode: true,
        });
        (map as any).pm.setLang('id');

        map.on('pm:create', (e: any) => {
          if (currentLayerRef.current) {
            map.removeLayer(currentLayerRef.current);
          }
          currentLayerRef.current = e.layer;
          bindLayerEvents(e.layer);
          isInternalChangeRef.current = true;
          const geojson = e.layer.toGeoJSON();
          onPolygonDrawn(geojson.geometry);
        });

        map.on('pm:remove', () => {
          currentLayerRef.current = null;
          isInternalChangeRef.current = true;
          onPolygonDrawn(null);
        });
      }
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    const certStyle = getCertificatePolygonStyle(statusLegalitas, noSertifikat);

    // Update Geoman drawing path options
    if ((map as any).pm) {
      (map as any).pm.setPathOptions({
        color: certStyle.color,
        fillColor: certStyle.fillColor,
        fillOpacity: certStyle.fillOpacity,
        weight: certStyle.weight,
      });
    }

    // Check if the change was triggered internally by map draw/edit
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      if (currentLayerRef.current && currentLayerRef.current.setStyle) {
        currentLayerRef.current.setStyle({
          color: certStyle.color,
          fillColor: certStyle.fillColor,
          fillOpacity: certStyle.fillOpacity,
          weight: certStyle.weight
        });
      }
      return;
    }

    // Sync from external GeoJSON (e.g. typing or pasting coordinates in textarea)
    if (initialGeojson) {
      if (currentLayerRef.current) {
        map.removeLayer(currentLayerRef.current);
        currentLayerRef.current = null;
      }
      try {
        const parsed = typeof initialGeojson === 'string' ? JSON.parse(initialGeojson) : initialGeojson;
        if (parsed && parsed.coordinates && parsed.coordinates[0] && parsed.coordinates[0].length >= 3) {
          const geoLayer = L.geoJSON(parsed, {
            style: {
              color: certStyle.color,
              fillColor: certStyle.fillColor,
              fillOpacity: certStyle.fillOpacity,
              weight: certStyle.weight
            }
          }).addTo(map);

          currentLayerRef.current = geoLayer;

          // Fit bounds to the polygon
          const bounds = geoLayer.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
          }
        }
      } catch (e) {
        console.error("Failed to parse initialGeojson:", e);
      }
    } else {
      if (currentLayerRef.current) {
        map.removeLayer(currentLayerRef.current);
        currentLayerRef.current = null;
      }
    }
  }, [initialGeojson, onPolygonDrawn, statusLegalitas, noSertifikat]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const certStyle = getCertificatePolygonStyle(statusLegalitas, noSertifikat);

  return (
    <div className="w-full h-96 relative rounded-2xl overflow-hidden shadow-sm border border-slate-200 z-10">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-2.5 left-13 z-[400] pointer-events-none flex items-center gap-2">
        <span className={`px-3 py-1 bg-white/95 backdrop-blur border rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 ${certStyle.badgeClass}`}>
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: certStyle.color }}
          />
          Poligon: {certStyle.label}
        </span>
      </div>
    </div>
  );
}
