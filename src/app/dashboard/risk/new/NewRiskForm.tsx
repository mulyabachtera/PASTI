"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, AlertTriangle, ShieldAlert, CheckCircle2, User, Calendar, Shield } from "lucide-react";
import Link from "next/link";

export default function NewRiskForm({ 
  tanahList 
}: { 
  tanahList: { id: string; namaBarang: string; nibar: string; assetId?: string | null }[] 
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    idTanah: "",
    riskId: "",
    kategoriRisiko: "Sengketa Lahan",
    deskripsiRisiko: "",
    penyebab: "",
    dampakNarasi: "",
    existingControl: "",
    statusTindakLanjut: "Belum Ditindaklanjuti",
    pic: "BPKAD Bidang Aset",
    targetSelesai: "",
    skorDampak: 3,
    skorPeluang: 3,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.idTanah) {
      alert("Aset tanah wajib dipilih!");
      return;
    }
    if (!formData.deskripsiRisiko) {
      alert("Deskripsi risiko wajib diisi!");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan data risiko");
      }

      alert("Data risiko dan rencana mitigasi berhasil disimpan!");
      router.push("/dashboard/risk");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem saat menyimpan.");
    } finally {
      setIsLoading(false);
    }
  };

  const totalSkor = Number(formData.skorDampak) * Number(formData.skorPeluang);
  let tingkatRisiko = "LOW";
  let badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (totalSkor >= 15) { tingkatRisiko = "EXTREME"; badgeColor = "bg-rose-100 text-rose-800 border-rose-300"; }
  else if (totalSkor >= 10) { tingkatRisiko = "HIGH"; badgeColor = "bg-orange-100 text-orange-800 border-orange-300"; }
  else if (totalSkor >= 5) { tingkatRisiko = "MEDIUM"; badgeColor = "bg-amber-100 text-amber-800 border-amber-300"; }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/risk" 
          className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-600" /> Identifikasi Risiko Baru
          </h2>
          <p className="text-slate-500 mt-0.5 text-sm">Daftarkan ancaman, akar masalah (penyebab), dampak, dan rencana pengendalian risiko.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Risk ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Risk ID <span className="text-slate-400 font-normal">(Opsional)</span></span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">Contoh: RR-0004</span>
            </label>
            <input 
              type="text" 
              name="riskId"
              value={formData.riskId}
              onChange={handleChange}
              placeholder="Contoh: RR-0004 (Kosongkan untuk otomatis)"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm font-mono"
            />
          </div>

          {/* Aset Tanah Terkait */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Aset Tanah Terkait <span className="text-rose-500">*</span>
            </label>
            <select 
              name="idTanah"
              value={formData.idTanah}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm bg-white"
            >
              <option value="" disabled>-- Pilih Aset Tanah --</option>
              {tanahList.map(t => (
                <option key={t.id} value={t.id}>
                  {t.assetId ? `[${t.assetId}] ` : ''}{t.namaBarang} ({t.nibar})
                </option>
              ))}
            </select>
          </div>

          {/* Kategori Risiko */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Kategori Risiko</label>
            <select 
              name="kategoriRisiko"
              value={formData.kategoriRisiko}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm bg-white"
            >
              <option value="Sengketa Lahan">Sengketa Lahan (Klaim Pihak Ke-3)</option>
              <option value="Penyerobotan / Pendudukan Fisik">Penyerobotan / Pendudukan Fisik</option>
              <option value="Legalitas & Sertifikasi">Legalitas & Sertifikasi</option>
              <option value="Administrasi & Warkah KIB">Administrasi & Warkah KIB</option>
              <option value="Alih Fungsi Ilegal">Alih Fungsi Ilegal</option>
              <option value="Bencana Alam (Longsor/Banjir)">Bencana Alam (Longsor/Banjir)</option>
            </select>
          </div>

          {/* Status Tindak Lanjut */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Status Tindak Lanjut</label>
            <select 
              name="statusTindakLanjut"
              value={formData.statusTindakLanjut}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm bg-white"
            >
              <option value="Belum Ditindaklanjuti">Belum Ditindaklanjuti</option>
              <option value="Sedang Berjalan">Sedang Berjalan (Proses Lapangan)</option>
              <option value="Selesai Termitigasi">Selesai Termitigasi (Closed)</option>
            </select>
          </div>
        </div>

        {/* Deskripsi Detail Risiko */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">
            Deskripsi Detail Peristiwa Risiko <span className="text-rose-500">*</span>
          </label>
          <textarea 
            required
            name="deskripsiRisiko"
            value={formData.deskripsiRisiko}
            onChange={handleChange}
            rows={3}
            placeholder="Jelaskan peristiwa ancaman risiko yang sedang atau berpotensi terjadi..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm resize-none"
          />
        </div>

        {/* Penyebab & Dampak Narasi (Sinkronisasi Prototype) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Penyebab Utama (Root Cause)
            </label>
            <textarea 
              rows={3}
              name="penyebab"
              value={formData.penyebab}
              onChange={handleChange}
              placeholder="Contoh: Belum tersedianya patok batas BPN dan papan nama aset pemkab di lokasi..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Dampak Naratif (Kualitatif / Finansial)
            </label>
            <textarea 
              rows={3}
              name="dampakNarasi"
              value={formData.dampakNarasi}
              onChange={handleChange}
              placeholder="Contoh: Hambatan pemanfaatan lahan dan potensi klaim kepemilikan oleh warga sekitar..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm resize-none"
            />
          </div>
        </div>

        {/* Pengendalian / Mitigasi & PIC */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-xs font-bold text-slate-700">
              Pengendalian Saat Ini (Existing Control)
            </label>
            <input 
              type="text" 
              name="existingControl"
              value={formData.existingControl}
              onChange={handleChange}
              placeholder="Contoh: Koordinat KIB tercatat, pemantauan berkala"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Penanggung Jawab (PIC)
            </label>
            <input 
              type="text" 
              name="pic"
              value={formData.pic}
              onChange={handleChange}
              placeholder="Contoh: BPKAD Bidang Aset"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Target Penyelesaian
            </label>
            <input 
              type="date" 
              name="targetSelesai"
              value={formData.targetSelesai}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
            />
          </div>
        </div>

        {/* Matrix Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200/80">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700">Skor Dampak (1 - 5)</label>
              <span className="font-mono font-bold text-rose-600 text-lg bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-lg">
                Level {formData.skorDampak}
              </span>
            </div>
            <p className="text-xs text-slate-500">Tingkat keparahan konsekuensi jika risiko terjadi.</p>
            <input 
              type="range" 
              name="skorDampak"
              min="1" max="5" step="1"
              value={formData.skorDampak}
              onChange={handleChange}
              className="w-full accent-rose-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>1: Sangat Rendah</span>
              <span>3: Sedang</span>
              <span>5: Bencana / Fatal</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700">Skor Kemungkinan / Peluang (1 - 5)</label>
              <span className="font-mono font-bold text-orange-600 text-lg bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-lg">
                Level {formData.skorPeluang}
              </span>
            </div>
            <p className="text-xs text-slate-500">Frekuensi kemungkinan terjadinya risiko.</p>
            <input 
              type="range" 
              name="skorPeluang"
              min="1" max="5" step="1"
              value={formData.skorPeluang}
              onChange={handleChange}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>1: Sangat Jarang</span>
              <span>3: Berkala</span>
              <span>5: Hampir Pasti</span>
            </div>
          </div>
        </div>

        {/* Skor Result Box */}
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl shadow-sm">
          <div>
            <p className="text-xs text-slate-400">Total Skor Matriks (Dampak × Peluang)</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-bold text-2xl font-mono text-white">{totalSkor}</span>
              <span className="text-xs text-slate-400 font-mono">/ 25</span>
            </div>
          </div>
          <div className={`px-4 py-1.5 rounded-lg font-bold text-xs border tracking-wide uppercase ${badgeColor}`}>
            Tingkat: {tingkatRisiko}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button 
            type="submit"
            disabled={isLoading}
            className="bg-rose-600 hover:bg-rose-700 text-white px-7 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-50 text-sm shadow-sm"
          >
            {isLoading ? "Menyimpan Data..." : <><Save className="w-4 h-4" /> Simpan Data Risiko</>}
          </button>
        </div>
      </form>
    </div>
  );
}
