/**
 * SIM PASTI v3.0 - Utilitas Spasial & Kalkulasi Luas Poligon Geodesik
 * Menggunakan formula Spherical Excess WGS84 (Radius Bumi R = 6.378.137m)
 */

/**
 * Menghitung luas poligon bola bumi (geodesic area) dalam meter persegi (m²).
 * Input koordinat: GeoJSON format ring outer [[lng, lat], ...]
 */
export function calculatePolygonArea(coords: number[][]): number {
  if (!coords || coords.length < 3) return 0;

  // Pastikan salinan titik
  const points = [...coords];

  // Pastikan poligon tertutup (titik pertama = titik terakhir)
  const first = points[0];
  const last = points[points.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    points.push([...first]);
  }

  if (points.length < 4) return 0; // Minimal 3 titik unik + 1 penutup

  const RADIUS = 6378137; // Radius rata-rata bumi WGS84 (meter)
  let total = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    // GeoJSON urutan: [lng, lat]
    const lon1 = (p1[0] * Math.PI) / 180;
    const lat1 = (p1[1] * Math.PI) / 180;
    const lon2 = (p2[0] * Math.PI) / 180;
    const lat2 = (p2[1] * Math.PI) / 180;

    total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  const area = (Math.abs(total) * RADIUS * RADIUS) / 2;
  
  if (isNaN(area) || !isFinite(area)) return 0;

  // Pembulatan 2 desimal
  return Math.round(area * 100) / 100;
}

/**
 * Parsing teks baris koordinat (Format input pengguna: "Lat, Lng")
 * Menghasilkan koordinat GeoJSON [lng, lat] dan status validasi.
 */
export function parseCoordinateText(text: string): {
  coords: [number, number][]; // GeoJSON [lng, lat]
  isValid: boolean;
  totalPoints: number;
  area: number;
  error?: string;
} {
  if (!text || !text.trim()) {
    return { coords: [], isValid: false, totalPoints: 0, area: 0 };
  }

  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const coords: [number, number][] = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    // Split berdasarkan koma atau spasi ganda
    const parts = line.split(/[,\t]+/).map(s => s.trim()).filter(Boolean);

    if (parts.length < 2) {
      return {
        coords: [],
        isValid: false,
        totalPoints: coords.length,
        area: 0,
        error: `Format baris ke-${idx + 1} tidak valid ("${line}"). Gunakan format: Latitude, Longitude`
      };
    }

    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);

    if (isNaN(lat) || isNaN(lng)) {
      return {
        coords: [],
        isValid: false,
        totalPoints: coords.length,
        area: 0,
        error: `Baris ke-${idx + 1} mengandung angka tidak valid ("${line}").`
      };
    }

    // Validasi range koordinat geografis
    if (lat < -90 || lat > 90) {
      return {
        coords: [],
        isValid: false,
        totalPoints: coords.length,
        area: 0,
        error: `Latitude baris ke-${idx + 1} di luar jangkauan (-90 s.d 90): ${lat}`
      };
    }

    if (lng < -180 || lng > 180) {
      return {
        coords: [],
        isValid: false,
        totalPoints: coords.length,
        area: 0,
        error: `Longitude baris ke-${idx + 1} di luar jangkauan (-180 s.d 180): ${lng}`
      };
    }

    // GeoJSON membutuhkan [lng, lat]
    coords.push([lng, lat]);
  }

  // Hitung titik unik
  const uniquePoints = coords.filter((c, i, arr) => 
    i === 0 || c[0] !== arr[i-1][0] || c[1] !== arr[i-1][1]
  );

  if (uniquePoints.length < 3) {
    return {
      coords,
      isValid: false,
      totalPoints: coords.length,
      area: 0,
      error: `Poligon memerlukan minimal 3 titik batas koordinat (saat ini: ${coords.length} titik).`
    };
  }

  // Tutup poligon jika belum tertutup
  const closedCoords = [...coords];
  const first = closedCoords[0];
  const last = closedCoords[closedCoords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    closedCoords.push([...first]);
  }

  const area = calculatePolygonArea(closedCoords);

  return {
    coords: closedCoords,
    isValid: true,
    totalPoints: coords.length,
    area
  };
}

/**
 * Format angka luas menjadi tampilan ramah pengguna (m² dan Hektar)
 */
export function formatArea(areaM2: number): {
  m2Formatted: string;
  haFormatted: string;
} {
  const m2Formatted = areaM2.toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const ha = areaM2 / 10000;
  const haFormatted = ha.toLocaleString('id-ID', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });

  return { m2Formatted, haFormatted };
}

export interface CertificatePolygonStyle {
  color: string;
  fillColor: string;
  fillOpacity: number;
  weight: number;
  category: 'hijau' | 'kuning' | 'merah';
  label: string;
  badgeClass: string;
}

/**
 * Aturan Pewarnaan Poligon Berdasarkan Indikator Sertifikat:
 * - HIJAU  : Sudah ada sertifikat (Sertifikat Asli, Pemda, Bersertifikat resmi)
 * - KUNING : Masih dalam pengurusan (Dalam proses BPN, pengurusan)
 * - MERAH  : Sertifikat tidak ada, belum bersertifikat, atau bermasalah / sengketa
 */
export function getCertificatePolygonStyle(
  statusLegalitas?: string | null,
  noSertifikat?: string | null
): CertificatePolygonStyle {
  const status = (statusLegalitas || "").toLowerCase().trim();
  const certNo = (noSertifikat || "").trim();

  // 1. KUNING: Masih dalam proses pengurusan BPN
  if (
    status.includes("proses") ||
    status.includes("urus") ||
    status.includes("pengurusan") ||
    status.includes("daftar")
  ) {
    return {
      color: "#d97706",      // Amber-600 border
      fillColor: "#f59e0b",  // Amber-500 fill
      fillOpacity: 0.45,
      weight: 3,
      category: "kuning",
      label: "Dalam Pengurusan BPN",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-300"
    };
  }

  // 2. MERAH: Sertifikat tidak ada, belum bersertifikat, atau bermasalah / sengketa
  if (
    !status ||
    status.includes("belum") ||
    status.includes("tidak") ||
    status.includes("sengketa") ||
    status.includes("klaim") ||
    status.includes("masalah") ||
    status.includes("sporadik") ||
    status.includes("hilang") ||
    status.includes("rusak") ||
    status.includes("gugatan")
  ) {
    const isDispute = status.includes("sengketa") || status.includes("klaim") || status.includes("masalah");
    return {
      color: "#dc2626",      // Red-600 border
      fillColor: "#ef4444",  // Red-500 fill
      fillOpacity: 0.45,
      weight: 3,
      category: "merah",
      label: isDispute ? "Sengketa / Bermasalah" : "Belum Ada Sertifikat",
      badgeClass: "bg-rose-100 text-rose-800 border-rose-300"
    };
  }

  // 3. HIJAU: Sudah ada sertifikat resmi
  if (
    status.includes("sertifikat") ||
    status.includes("asli") ||
    status.includes("pemda") ||
    status.includes("shm") ||
    status.includes("shp") ||
    status.includes("hgb") ||
    status.includes("hpl") ||
    (certNo.length > 3 && certNo !== "-" && !status)
  ) {
    return {
      color: "#16a34a",      // Green-600 border
      fillColor: "#22c55e",  // Green-500 fill
      fillOpacity: 0.45,
      weight: 3,
      category: "hijau",
      label: "Sudah Bersertifikat",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300"
    };
  }

  // Fallback: Belum ada sertifikat -> MERAH
  return {
    color: "#dc2626",
    fillColor: "#ef4444",
    fillOpacity: 0.45,
    weight: 3,
    category: "merah",
    label: "Belum Ada Sertifikat",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300"
  };
}

