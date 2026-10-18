"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Save, Loader2, UploadCloud, FileText, 
  Image as ImageIcon, Trash2, ExternalLink, ShieldCheck, Building2,
  Map, Sparkles, AlertCircle, CheckCircle2, Layers, RefreshCw
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import LiveRiskCard from "@/components/dashboard/LiveRiskCard";
import { calculatePolygonArea, parseCoordinateText, formatArea } from "@/lib/geoUtils";

const FormMapComponent = dynamic(() => import("../../new/FormMapComponent"), { ssr: false });

export default function EditTanahForm({ tanah }: { tanah: any }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);
  
  // State Spasial & Kalkulasi Luas Terintegrasi
  const initialGeo = tanah.geojson 
    ? (typeof tanah.geojson === 'string' ? JSON.parse(tanah.geojson) : tanah.geojson) 
    : null;

  const [geojson, setGeojson] = useState<any>(initialGeo);
  const [coordText, setCoordText] = useState<string>(() => {
    if (initialGeo && initialGeo.coordinates && initialGeo.coordinates[0]) {
      return initialGeo.coordinates[0]
        .map((c: [number, number]) => `${c[1]}, ${c[0]}`)
        .join('\n');
    }
    return "";
  });
  const [coordError, setCoordError] = useState<string | null>(null);
  const [calculatedArea, setCalculatedArea] = useState<number>(() => {
    if (initialGeo && initialGeo.coordinates && initialGeo.coordinates[0]) {
      return calculatePolygonArea(initialGeo.coordinates[0]);
    }
    return Number(tanah.luas) || 0;
  });

  const [formData, setFormData] = useState({
    // Identitas Aset (Ditempatkan sebelum Nama Aset)
    assetId: tanah.assetId || "",
    kodeTanah: tanah.kodeTanah || tanah.kodeBarang || "",
    namaBarang: tanah.namaBarang || "",
    kodeLokasi: tanah.kodeLokasi || "",
    pengelola: tanah.pengelola || "",
    kecamatan: tanah.kecamatan || "",
    kampung: tanah.kampung || "",

    // Legalitas & Nilai
    statusHak: tanah.statusHak || "",
    luas: tanah.luas ? tanah.luas.toString() : "",
    statusLegalitas: tanah.statusLegalitas || "Belum Bersertifikat",
    noSertifikat: tanah.noSertifikat || "",
    tanggalPerolehan: tanah.tanggalPerolehan ? new Date(tanah.tanggalPerolehan).toISOString().split('T')[0] : "",
    alamatLokasi: tanah.alamatLokasi || "",
    asalPerolehan: tanah.asalPerolehan || "",
    nilaiPerolehan: tanah.nilaiPerolehan || "",

    // Pengamanan Fisik & Penguasaan (Skala Bobot 0 - 2)
    papanAset: Number(tanah.papanAset ?? 0),
    batasBidang: Number(tanah.batasBidang ?? 0),
    pagarPengamanan: Number(tanah.pagarPengamanan ?? 0),
    statusPenguasaan: Number(tanah.statusPenguasaan ?? 0),
    pemanfaatan: Number(tanah.pemanfaatan ?? 0),
    permasalahan: tanah.permasalahan || "",

    // Berkas & Media
    dokumenSertifikat: tanah.dokumenSertifikat || "",
    fotoAset: tanah.fotoAset || "",
  });

  /**
   * Handler saat teks koordinat di textarea diubah
   */
  const handleCoordTextChange = (text: string) => {
    setCoordText(text);

    if (!text.trim()) {
      setGeojson(null);
      setCoordError(null);
      setCalculatedArea(0);
      setFormData(prev => ({ ...prev, luas: "" }));
      return;
    }

    const parsed = parseCoordinateText(text);

    if (parsed.isValid) {
      setCoordError(null);
      setCalculatedArea(parsed.area);
      const newGeojson = {
        type: "Polygon",
        coordinates: [parsed.coords]
      };
      setGeojson(newGeojson);
      // Luas tanah otomatis terisi dari kalkulasi poligon
      setFormData(prev => ({ ...prev, luas: parsed.area.toString() }));
    } else {
      setCoordError(parsed.error || "Koordinat tidak valid");
      setCalculatedArea(0);
      // Ketika koordinat salah, luas tanah otomatis berubah / dikosongkan
      setFormData(prev => ({ ...prev, luas: "" }));
    }
  };

  /**
   * Handler saat poligon digambar atau diubah di atas peta
   */
  const handlePolygonDrawn = (geometry: any) => {
    if (!geometry || !geometry.coordinates || !geometry.coordinates[0]) {
      setGeojson(null);
      setCoordText("");
      setCalculatedArea(0);
      setCoordError(null);
      setFormData(prev => ({ ...prev, luas: "" }));
      return;
    }

    const coords = geometry.coordinates[0];
    const area = calculatePolygonArea(coords);

    setGeojson(geometry);
    setCalculatedArea(area);
    setCoordError(null);

    const formatted = coords
      .map((c: [number, number]) => `${c[1].toFixed(6)}, ${c[0].toFixed(6)}`)
      .join('\n');
    setCoordText(formatted);

    // Luas tanah otomatis terisi
    setFormData(prev => ({ ...prev, luas: area.toString() }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "dokumenSertifikat" | "fotoAset") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isDoc = field === "dokumenSertifikat";
    if (isDoc) setIsUploadingDoc(true);
    else setIsUploadingFoto(true);

    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      if (!res.ok) throw new Error("Gagal mengunggah berkas");

      const json = await res.json();
      setFormData(prev => ({ ...prev, [field]: json.url }));
    } catch (err: any) {
      alert(err.message || "Gagal mengunggah berkas.");
    } finally {
      if (isDoc) setIsUploadingDoc(false);
      else setIsUploadingFoto(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name.startsWith('papan') || name.startsWith('batas') || name.startsWith('pagar') || name.startsWith('statusPenguasaan') || name.startsWith('pemanfaatan') 
        ? Number(value) 
        : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/assets/tanah/${tanah.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          luas: formData.luas ? parseFloat(formData.luas as string) : null,
          nilaiPerolehan: formData.nilaiPerolehan ? parseFloat(formData.nilaiPerolehan as string) : null,
          tanggalPerolehan: formData.tanggalPerolehan ? new Date(formData.tanggalPerolehan).toISOString() : null,
          geojson,
        }),
      });

      if (res.ok) {
        alert("Data aset, batas spasial, dan kalkulasi luas berhasil diperbarui!");
        router.push(`/dashboard/tanah/${tanah.id}`);
        router.refresh();
      } else {
        alert("Gagal memperbarui data.");
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link 
          href={`/dashboard/tanah/${tanah.id}`} 
          className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Edit Data, Batas Spasial & Parameter Risiko
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-slate-500 font-mono text-xs">NIBAR: {tanah.nibar}</span>
            {tanah.assetId && (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Asset ID: {tanah.assetId}
              </span>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Identitas & Informasi Utama Aset */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" /> Identitas & Kodefikasi Aset
            </h3>
            <p className="text-xs text-slate-500">
              Form pengisian Asset ID dan Kode Tanah diletakkan sebelum nama aset sesuai spesifikasi KIB A.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Asset ID (Sebelum Nama Aset) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Asset ID</span>
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-mono">Format Unik</span>
              </label>
              <input 
                type="text" 
                name="assetId"
                value={formData.assetId}
                onChange={handleChange}
                placeholder="Contoh: AT-0001"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
              />
            </div>

            {/* 2. Kode Tanah (Sebelum Nama Aset) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Kode Tanah / Kode Barang</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">Permendagri</span>
              </label>
              <input 
                type="text" 
                name="kodeTanah"
                value={formData.kodeTanah}
                onChange={handleChange}
                placeholder="Contoh: 1.3.1.01.01.01.001"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
              />
            </div>

            {/* 3. Nama Aset (Barang) */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">
                Nama Aset (Barang) <span className="text-rose-500">*</span>
              </label>
              <input 
                required
                name="namaBarang"
                value={formData.namaBarang}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold text-slate-800"
                placeholder="Contoh: Kantor Bupati..."
              />
            </div>

            {/* 4. Kode Lokasi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Kode Lokasi</label>
              <input 
                name="kodeLokasi"
                value={formData.kodeLokasi}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                placeholder="Contoh: 11.04.01..."
              />
            </div>

            {/* 5. Pengelola / SKPK */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Pengelola / SKPK</label>
              <input 
                name="pengelola"
                value={formData.pengelola}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="Contoh: BPKAD / Dinas Kesehatan"
              />
            </div>

            {/* 6. Kecamatan & Kampung */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Kecamatan</label>
              <input 
                name="kecamatan"
                value={formData.kecamatan}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="Contoh: Lut Tawar"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Kampung / Desa</label>
              <input 
                name="kampung"
                value={formData.kampung}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="Contoh: Bale Atu"
              />
            </div>

            {/* 7. Luas Tanah (Terintegrasi Koordinat Otomatis) */}
            <div className="space-y-1.5 md:col-span-2 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Luas Tanah (m²)</span>
                  {calculatedArea > 0 && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                      <Sparkles className="w-3 h-3 text-emerald-600" /> Terintegrasi Koordinat
                    </span>
                  )}
                </label>
                {calculatedArea > 0 && (
                  <span className="text-xs font-mono text-blue-700 font-bold">
                    Konversi: {formatArea(calculatedArea).haFormatted} Hektar
                  </span>
                )}
              </div>

              <div className="relative">
                <input 
                  type="number"
                  step="any"
                  name="luas"
                  value={formData.luas}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-slate-800 bg-white"
                  placeholder="Contoh: 1500 (Otomatis dari koordinat)"
                />
                {calculatedArea > 0 && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, luas: calculatedArea.toString() }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300 rounded-lg font-semibold transition-colors flex items-center gap-1"
                    title="Sinkronkan ulang nilai luas dengan poligon peta"
                  >
                    <RefreshCw className="w-3 h-3" /> Sync Poligon
                  </button>
                )}
              </div>

              {coordError ? (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Koordinat Belum Valid: {coordError} (Luas dikosongkan)</span>
                </div>
              ) : calculatedArea > 0 ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Luas tanah <strong>{formatArea(calculatedArea).m2Formatted} m²</strong> terisi otomatis dari poligon batas bidang.
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 Luas tanah otomatis sinkron dengan koordinat poligon yang digambar di peta.
                </p>
              )}
            </div>

            {/* 8. Status Hak */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Status Hak</label>
              <select 
                name="statusHak"
                value={formData.statusHak}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
              >
                <option value="">Pilih Status Hak</option>
                <option value="Hak Pakai">Hak Pakai (Pemkab)</option>
                <option value="Hak Pengelolaan">Hak Pengelolaan (HPL)</option>
                <option value="Hak Milik">Hak Milik</option>
                <option value="Belum Bersertifikat">Belum Bersertifikat</option>
              </select>
            </div>

            {/* 9. Status Legalitas Dokumen */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Status Legalitas Sertifikat</span>
                <span className="text-[10px] text-blue-600 font-semibold">*Indikator Legal</span>
              </label>
              <select 
                name="statusLegalitas"
                value={formData.statusLegalitas}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
              >
                <option value="Sertifikat Asli (Pemda)">Sertifikat Asli BPN (Aman / 0 Poin)</option>
                <option value="Dalam Proses BPN">Dalam Proses BPN (+1 Poin)</option>
                <option value="Belum Bersertifikat">Belum Bersertifikat (+2 Poin)</option>
                <option value="Sengketa / Klaim Pihak Lain">Sengketa / Klaim Pihak Lain (+2 Poin Kritis)</option>
              </select>
            </div>

            {/* 10. Nomor Sertifikat */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Nomor Sertifikat</label>
              <input 
                name="noSertifikat"
                value={formData.noSertifikat}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                placeholder="Contoh: 01.02.03.04.1.12345"
              />
            </div>

            {/* 11. Tanggal Perolehan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Tanggal Perolehan</label>
              <input 
                type="date"
                name="tanggalPerolehan"
                value={formData.tanggalPerolehan}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            {/* 12. Asal Perolehan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Asal Perolehan</label>
              <input 
                name="asalPerolehan"
                value={formData.asalPerolehan}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="Contoh: Pembelian APBD, Hibah..."
              />
            </div>

            {/* 13. Nilai Perolehan (Rp) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Nilai Perolehan (Rp)</label>
              <input 
                type="number"
                name="nilaiPerolehan"
                value={formData.nilaiPerolehan}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                placeholder="Contoh: 500000000"
              />
            </div>

            {/* 14. Alamat / Lokasi */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">Alamat / Lokasi Lengkap</label>
              <input 
                name="alamatLokasi"
                value={formData.alamatLokasi}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="Jalan, Desa, Kecamatan..."
              />
            </div>
          </div>
        </div>

        {/* Card 2: Pengamanan Fisik & Live Risk Scoring */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Parameter Pengamanan Fisik & Penguasaan Lapangan
              </h3>
              <p className="text-xs text-slate-500">
                Ubah parameter kondisi fisik lapangan (skala bobot 0 - 2). Perubahan langsung memperbarui skor 6 dimensi.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-semibold w-fit">
              Skala Bobot: 0 (Aman) s.d 2 (Kritis)
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Opsi Parameter (7 Kolom) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Parameter 1: Papan Aset */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-800">
                    1. Papan Pengamanan Aset Pemda
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Bobot: {formData.papanAset} Poin
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 0, label: "Ada & Terawat", sub: "0 Poin", color: "peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-800" },
                    { value: 1, label: "Rusak / Pudar", sub: "+1 Poin", color: "peer-checked:border-amber-500 peer-checked:bg-amber-50 peer-checked:text-amber-800" },
                    { value: 2, label: "Tidak Ada Plang", sub: "+2 Poin", color: "peer-checked:border-rose-500 peer-checked:bg-rose-50 peer-checked:text-rose-800" },
                  ].map(opt => (
                    <label key={opt.value} className="cursor-pointer relative">
                      <input 
                        type="radio" 
                        name="papanAset" 
                        value={opt.value} 
                        checked={formData.papanAset === opt.value}
                        onChange={handleChange}
                        className="peer sr-only" 
                      />
                      <div className={`p-2.5 text-center rounded-xl border border-slate-200 bg-white transition-all text-xs font-semibold text-slate-700 ${opt.color} hover:bg-slate-50`}>
                        <div>{opt.label}</div>
                        <div className="text-[10px] opacity-75 font-normal mt-0.5">{opt.sub}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Parameter 2: Batas Bidang */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-800">
                    2. Batas Bidang Tanah (Patok BPN)
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Bobot: {formData.batasBidang} Poin
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 0, label: "Jelas & Patok BPN", sub: "0 Poin", color: "peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-800" },
                    { value: 1, label: "Sebagian Jelas", sub: "+1 Poin", color: "peer-checked:border-amber-500 peer-checked:bg-amber-50 peer-checked:text-amber-800" },
                    { value: 2, label: "Belum Jelas / Hilang", sub: "+2 Poin", color: "peer-checked:border-rose-500 peer-checked:bg-rose-50 peer-checked:text-rose-800" },
                  ].map(opt => (
                    <label key={opt.value} className="cursor-pointer relative">
                      <input 
                        type="radio" 
                        name="batasBidang" 
                        value={opt.value} 
                        checked={formData.batasBidang === opt.value}
                        onChange={handleChange}
                        className="peer sr-only" 
                      />
                      <div className={`p-2.5 text-center rounded-xl border border-slate-200 bg-white transition-all text-xs font-semibold text-slate-700 ${opt.color} hover:bg-slate-50`}>
                        <div>{opt.label}</div>
                        <div className="text-[10px] opacity-75 font-normal mt-0.5">{opt.sub}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Parameter 3: Pagar Pengamanan */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-800">
                    3. Pagar Pengamanan Fisik Keliling
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Bobot: {formData.pagarPengamanan} Poin
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 0, label: "Ada Pagar Keliling", sub: "0 Poin", color: "peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-800" },
                    { value: 1, label: "Sebagian / Rusak", sub: "+1 Poin", color: "peer-checked:border-amber-500 peer-checked:bg-amber-50 peer-checked:text-amber-800" },
                    { value: 2, label: "Tidak Berpagar", sub: "+2 Poin", color: "peer-checked:border-rose-500 peer-checked:bg-rose-50 peer-checked:text-rose-800" },
                  ].map(opt => (
                    <label key={opt.value} className="cursor-pointer relative">
                      <input 
                        type="radio" 
                        name="pagarPengamanan" 
                        value={opt.value} 
                        checked={formData.pagarPengamanan === opt.value}
                        onChange={handleChange}
                        className="peer sr-only" 
                      />
                      <div className={`p-2.5 text-center rounded-xl border border-slate-200 bg-white transition-all text-xs font-semibold text-slate-700 ${opt.color} hover:bg-slate-50`}>
                        <div>{opt.label}</div>
                        <div className="text-[10px] opacity-75 font-normal mt-0.5">{opt.sub}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Parameter 4: Status Penguasaan Fisik */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-800">
                    4. Status Penguasaan Fisik Lapangan
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Bobot: {formData.statusPenguasaan} Poin
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 0, label: "Dikuasai Pemda", sub: "0 Poin", color: "peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-800" },
                    { value: 1, label: "Potensi Klaim Warga", sub: "+1 Poin", color: "peer-checked:border-amber-500 peer-checked:bg-amber-50 peer-checked:text-amber-800" },
                    { value: 2, label: "Dikuasai Pihak Lain", sub: "+2 Poin", color: "peer-checked:border-rose-500 peer-checked:bg-rose-50 peer-checked:text-rose-800" },
                  ].map(opt => (
                    <label key={opt.value} className="cursor-pointer relative">
                      <input 
                        type="radio" 
                        name="statusPenguasaan" 
                        value={opt.value} 
                        checked={formData.statusPenguasaan === opt.value}
                        onChange={handleChange}
                        className="peer sr-only" 
                      />
                      <div className={`p-2.5 text-center rounded-xl border border-slate-200 bg-white transition-all text-xs font-semibold text-slate-700 ${opt.color} hover:bg-slate-50`}>
                        <div>{opt.label}</div>
                        <div className="text-[10px] opacity-75 font-normal mt-0.5">{opt.sub}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Parameter 5: Status Pemanfaatan */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-800">
                    5. Status Pemanfaatan Lahan
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Bobot: {formData.pemanfaatan} Poin
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 0, label: "Digunakan SKPK", sub: "0 Poin", color: "peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-800" },
                    { value: 1, label: "Belum Digunakan", sub: "+1 Poin", color: "peer-checked:border-amber-500 peer-checked:bg-amber-50 peer-checked:text-amber-800" },
                    { value: 2, label: "Dimanfaatkan Lain", sub: "+2 Poin", color: "peer-checked:border-rose-500 peer-checked:bg-rose-50 peer-checked:text-rose-800" },
                  ].map(opt => (
                    <label key={opt.value} className="cursor-pointer relative">
                      <input 
                        type="radio" 
                        name="pemanfaatan" 
                        value={opt.value} 
                        checked={formData.pemanfaatan === opt.value}
                        onChange={handleChange}
                        className="peer sr-only" 
                      />
                      <div className={`p-2.5 text-center rounded-xl border border-slate-200 bg-white transition-all text-xs font-semibold text-slate-700 ${opt.color} hover:bg-slate-50`}>
                        <div>{opt.label}</div>
                        <div className="text-[10px] opacity-75 font-normal mt-0.5">{opt.sub}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Catatan Permasalahan Lapangan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Catatan Permasalahan / Kronologi Lapangan
                </label>
                <textarea 
                  rows={3}
                  name="permasalahan"
                  value={formData.permasalahan}
                  onChange={handleChange}
                  placeholder="Catatan kronologi permasalahan..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-700 resize-none"
                />
              </div>
            </div>

            {/* Live Risk Scoring Card (5 Kolom) */}
            <div className="lg:col-span-5 sticky top-6">
              <LiveRiskCard 
                papanAset={formData.papanAset}
                batasBidang={formData.batasBidang}
                pagarPengamanan={formData.pagarPengamanan}
                statusPenguasaan={formData.statusPenguasaan}
                pemanfaatan={formData.pemanfaatan}
                statusLegalitas={formData.statusLegalitas}
                nilaiPerolehan={Number(formData.nilaiPerolehan || 0)}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Pemetaan Spasial (Batas Tanah & Kalkulasi Luas Terintegrasi) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Map className="w-4 h-4 text-blue-600" /> Pemetaan Spasial (Batas Poligon Tanah & Luas Otomatis)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbarui koordinat batas poligon atau gambar langsung di peta. Luas tanah otomatis disinkronkan.
              </p>
            </div>
            
            {calculatedArea > 0 ? (
              <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold w-fit">
                <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Luas Poligon: <strong>{formatArea(calculatedArea).m2Formatted} m²</strong></span>
              </div>
            ) : (
              <span className="text-xs px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg w-fit">
                Belum Ada Poligon
              </span>
            )}
          </div>

          {coordError ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Koordinat Mengandung Kesalahan:</strong>
                <p className="mt-0.5 leading-relaxed">{coordError}</p>
                <p className="text-[11px] text-rose-600 mt-1">
                  Luas tanah otomatis di-reset sampai koordinat diperbaiki menjadi poligon sah.
                </p>
              </div>
            </div>
          ) : calculatedArea > 0 ? (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Poligon terverifikasi valid! Luas Geodesik: <strong className="text-sm font-bold font-mono text-blue-800">{formatArea(calculatedArea).m2Formatted} m²</strong> ({formatArea(calculatedArea).haFormatted} Ha)
                </span>
              </div>
              <span className="text-[11px] bg-blue-600 text-white font-mono font-bold px-2 py-0.5 rounded-lg w-fit">
                {geojson?.coordinates?.[0]?.length || 0} Titik Terhubung
              </span>
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700">
                  Koordinat Manual (Latitude, Longitude)
                </label>
                {coordText && (
                  <button
                    type="button"
                    onClick={() => handleCoordTextChange("")}
                    className="text-[10px] text-rose-600 hover:underline font-medium"
                  >
                    Bersihkan
                  </button>
                )}
              </div>

              <textarea 
                rows={12}
                placeholder="4.623068, 96.844571&#10;4.623015, 96.845014&#10;..."
                value={coordText}
                onChange={(e) => handleCoordTextChange(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 text-xs font-mono text-slate-700 resize-none transition-colors ${
                  coordError 
                    ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20' 
                    : calculatedArea > 0 
                      ? 'border-emerald-300 focus:ring-emerald-500 bg-emerald-50/10' 
                      : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Format: <code>Latitude, Longitude</code> (Pisahkan tiap titik dengan baris baru).
              </p>
            </div>

            <div className="lg:col-span-2 relative">
              <FormMapComponent 
                onPolygonDrawn={handlePolygonDrawn} 
                initialGeojson={geojson} 
                statusLegalitas={formData.statusLegalitas}
                noSertifikat={formData.noSertifikat}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Seksi Berkas & Foto Fisik */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" /> Dokumen Legalitas & Foto Fisik Aset
            </h3>
            <p className="text-xs text-slate-500 mt-1">Perbarui atau lampirkan berkas sertifikat dan foto dokumentasi fisik lapangan.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload Dokumen Sertifikat */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" /> Dokumen Sertifikat (PDF / Doc)
              </label>

              {formData.dokumenSertifikat ? (
                <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold text-xs rounded">PDF</span>
                    <a 
                      href={formData.dokumenSertifikat} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-blue-600 hover:underline truncate font-medium flex items-center gap-1"
                    >
                      Buka Berkas <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, dokumenSertifikat: "" }))}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Hapus berkas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white rounded-xl cursor-pointer transition-colors group">
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileUpload(e, "dokumenSertifikat")}
                    disabled={isUploadingDoc}
                  />
                  {isUploadingDoc ? (
                    <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                      <Loader2 className="w-4 h-4 animate-spin" /> Mengunggah dokumen...
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-blue-500 mb-1 transition-colors" />
                      <span className="text-xs font-semibold text-slate-600 group-hover:text-blue-600">Pilih Berkas Sertifikat</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Format .pdf, .doc, .docx</span>
                    </>
                  )}
                </label>
              )}
            </div>

            {/* Upload Foto Fisik Aset */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600" /> Foto Fisik Aset (JPG / PNG)
              </label>

              {formData.fotoAset ? (
                <div className="relative group rounded-xl overflow-hidden border border-slate-200 h-28 bg-slate-100 flex items-center justify-center">
                  <img 
                    src={formData.fotoAset} 
                    alt="Preview Foto Aset" 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a 
                      href={formData.fotoAset} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="px-2.5 py-1 bg-white/90 rounded-lg text-xs font-medium text-slate-800 hover:bg-white flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Buka
                    </a>
                    <button 
                      type="button" 
                      onClick={() => setFormData(prev => ({ ...prev, fotoAset: "" }))}
                      className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                      title="Hapus foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-white rounded-xl cursor-pointer transition-colors group">
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "fotoAset")}
                    disabled={isUploadingFoto}
                  />
                  {isUploadingFoto ? (
                    <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
                      <Loader2 className="w-4 h-4 animate-spin" /> Mengunggah foto...
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 mb-1 transition-colors" />
                      <span className="text-xs font-semibold text-slate-600 group-hover:text-indigo-600">Pilih Foto Fisik Lapangan</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Format JPG, PNG, atau WEBP</span>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
          <Link href={`/dashboard/tanah/${tanah.id}`} className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors text-sm">
            Batal
          </Link>
          <button 
            type="submit"
            disabled={isSaving}
            className="px-7 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm shadow-sm"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? "Menyimpan & Menghitung..." : "Simpan Perubahan & Update Luas/Risiko"}
          </button>
        </div>
      </form>
    </div>
  );
}
