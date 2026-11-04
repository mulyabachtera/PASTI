"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  MoreVertical, Eye, Edit, Trash2, X, ExternalLink, 
  AlertTriangle, ShieldCheck, User, Calendar, Loader2, Save 
} from "lucide-react";
import Link from "next/link";

interface RiskItem {
  id: string;
  idTanah: string;
  riskId: string | null;
  kategoriRisiko: string;
  deskripsiRisiko: string;
  penyebab: string | null;
  dampakNarasi: string | null;
  existingControl: string | null;
  statusTindakLanjut: string | null;
  pic: string | null;
  targetSelesai: string | Date | null;
  skorDampak: number;
  skorPeluang: number;
  skorTotal: number;
  tingkatRisiko: string;
  tanah?: {
    assetId: string | null;
    kodeTanah: string | null;
    namaBarang: string;
    nibar: string;
    alamatLokasi?: string | null;
  } | null;
}

export default function RiskActionMenu({ risk }: { risk: RiskItem }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State untuk Edit
  const [editKategori, setEditKategori] = useState(risk.kategoriRisiko || "Sengketa Lahan");
  const [editDeskripsi, setEditDeskripsi] = useState(risk.deskripsiRisiko || "");
  const [editPenyebab, setEditPenyebab] = useState(risk.penyebab || "");
  const [editDampak, setEditDampak] = useState(risk.dampakNarasi || "");
  const [editExistingControl, setEditExistingControl] = useState(risk.existingControl || "");
  const [editDampakScore, setEditDampakScore] = useState(risk.skorDampak || 3);
  const [editPeluangScore, setEditPeluangScore] = useState(risk.skorPeluang || 3);
  const [editStatus, setEditStatus] = useState(risk.statusTindakLanjut || "Belum Ditindaklanjuti");
  const [editPic, setEditPic] = useState(risk.pic || "BPKAD Bidang Aset");
  const [editTargetSelesai, setEditTargetSelesai] = useState(
    risk.targetSelesai ? new Date(risk.targetSelesai).toISOString().split("T")[0] : ""
  );

  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hitung live matriks skor & tingkat risiko saat diedit
  const liveTotal = editDampakScore * editPeluangScore;
  let liveTingkat = "LOW";
  let liveBadgeColor = "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (liveTotal >= 15) {
    liveTingkat = "EXTREME";
    liveBadgeColor = "bg-rose-100 text-rose-800 border-rose-300";
  } else if (liveTotal >= 10) {
    liveTingkat = "HIGH";
    liveBadgeColor = "bg-orange-100 text-orange-800 border-orange-300";
  } else if (liveTotal >= 5) {
    liveTingkat = "MEDIUM";
    liveBadgeColor = "bg-amber-100 text-amber-800 border-amber-300";
  }

  const getRiskColor = (tingkat: string) => {
    switch (tingkat.toUpperCase()) {
      case "EXTREME": return "bg-rose-100 text-rose-800 border-rose-300";
      case "HIGH": return "bg-orange-100 text-orange-800 border-orange-300";
      case "MEDIUM": return "bg-amber-100 text-amber-800 border-amber-300";
      case "LOW": return "bg-emerald-100 text-emerald-800 border-emerald-300";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getStatusColor = (status: string | null) => {
    if (status === "Selesai Termitigasi") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "Sedang Berjalan") return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  // Handler Hapus
  const handleDelete = async () => {
    setIsDropdownOpen(false);
    if (!confirm(`Yakin ingin menghapus data risiko "${risk.riskId || risk.kategoriRisiko}" secara permanen?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/risk/${risk.id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Data risiko berhasil dihapus!");
        window.location.reload();
      } else {
        alert("Gagal menghapus data risiko.");
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler Simpan Perubahan Edit
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDeskripsi.trim()) {
      alert("Deskripsi risiko wajib diisi!");
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch(`/api/risk/${risk.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kategoriRisiko: editKategori,
          deskripsiRisiko: editDeskripsi,
          penyebab: editPenyebab,
          dampakNarasi: editDampak,
          existingControl: editExistingControl,
          skorDampak: editDampakScore,
          skorPeluang: editPeluangScore,
          statusTindakLanjut: editStatus,
          pic: editPic,
          targetSelesai: editTargetSelesai || null,
        }),
      });

      if (res.ok) {
        alert("Data risiko berhasil diperbarui!");
        setIsEditOpen(false);
        window.location.reload();
      } else {
        alert("Gagal memperbarui data risiko.");
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button Titik Tiga */}
      <button 
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none"
        title="Menu Aksi"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Dropdown Options */}
      {isDropdownOpen && (
        <div className="origin-top-right absolute right-0 mt-1 w-36 rounded-xl shadow-lg bg-white ring-1 ring-black/5 z-40 py-1 divide-y divide-slate-100 text-left">
          <div className="py-0.5">
            <button 
              onClick={() => {
                setIsDropdownOpen(false);
                setIsDetailOpen(true);
              }}
              className="flex items-center gap-2 w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-left"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" /> Lihat Detail
            </button>
            <button 
              onClick={() => {
                setIsDropdownOpen(false);
                setIsEditOpen(true);
              }}
              className="flex items-center gap-2 w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-600 transition-colors text-left"
            >
              <Edit className="w-3.5 h-3.5 text-amber-500" /> Edit Risiko
            </button>
          </div>
          <div className="py-0.5">
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 w-full px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Hapus
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. MODAL DETAIL RISIKO */}
      {/* ========================================================= */}
      {isDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto text-left">
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-extrabold text-slate-900 px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200">
                  {risk.riskId || "RISK REGISTER"}
                </span>
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold border uppercase ${getRiskColor(risk.tingkatRisiko)}`}>
                  {risk.tingkatRisiko}
                </span>
              </div>
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Modal Detail */}
            <div className="p-6 space-y-5 text-sm">
              {/* Aset Terkait Box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Aset Tanah Terkait
                  </span>
                  <h4 className="font-bold text-slate-800 text-sm">{risk.tanah?.namaBarang || "Aset Tidak Terhubung"}</h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    NIBAR: {risk.tanah?.nibar || "-"} {risk.tanah?.assetId ? `• ID: ${risk.tanah.assetId}` : ""}
                  </p>
                </div>
                {risk.idTanah && (
                  <Link 
                    href={`/dashboard/tanah/${risk.idTanah}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0"
                  >
                    Buka Detail Aset <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {/* Kategori & Deskripsi */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Kategori & Deskripsi Peristiwa Risiko
                </span>
                <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200">
                  {risk.kategoriRisiko}
                </span>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/60 p-3 rounded-xl border border-slate-200/60 mt-2">
                  {risk.deskripsiRisiko}
                </p>
              </div>

              {/* Penyebab & Dampak */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Penyebab Utama (Root Cause)
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {risk.penyebab || "-"}
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Dampak Naratif (Kualitatif / Finansial)
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {risk.dampakNarasi || "-"}
                  </p>
                </div>
              </div>

              {/* Pengendalian yang Ada */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Pengendalian Saat Ini (Existing Control)
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {risk.existingControl || "-"}
                </p>
              </div>

              {/* Matriks Skor */}
              <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Perhitungan Matriks Risiko
                </span>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">Skor Dampak (D)</span>
                    <span className="text-xl font-bold font-mono text-white mt-0.5 block">{risk.skorDampak}</span>
                    <span className="text-[10px] text-slate-500">Skala 1 - 5</span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">Skor Peluang (P)</span>
                    <span className="text-xl font-bold font-mono text-white mt-0.5 block">{risk.skorPeluang}</span>
                    <span className="text-[10px] text-slate-500">Skala 1 - 5</span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">Total Matriks (D × P)</span>
                    <span className="text-xl font-bold font-mono text-amber-400 mt-0.5 block">{risk.skorTotal}</span>
                    <span className="text-[10px] text-slate-400">{risk.tingkatRisiko}</span>
                  </div>
                </div>
              </div>

              {/* Status Tindak Lanjut & PIC */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Status Tindak Lanjut</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(risk.statusTindakLanjut)}`}>
                    {risk.statusTindakLanjut || "Belum Ditindaklanjuti"}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Penanggung Jawab (PIC)</span>
                  <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {risk.pic || "BPKAD"}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Target Batas Waktu</span>
                  <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {risk.targetSelesai 
                      ? new Date(risk.targetSelesai).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                      : "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Modal Detail */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button 
                onClick={() => {
                  setIsDetailOpen(false);
                  setIsEditOpen(true);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Data Ini
              </button>
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MODAL EDIT RISIKO */}
      {/* ========================================================= */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto text-left">
            <form onSubmit={handleUpdate}>
              {/* Header Modal Edit */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
                <div className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-slate-800 text-base">Edit Data Risiko ({risk.riskId || "RR"})</h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 space-y-4 text-xs sm:text-sm">
                {/* Kategori Risiko */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Kategori Risiko</label>
                  <select 
                    value={editKategori}
                    onChange={(e) => setEditKategori(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Sengketa Lahan">Sengketa Lahan (Klaim Pihak Ketiga)</option>
                    <option value="Penyerobotan / Pendudukan Fisik">Penyerobotan / Pendudukan Fisik</option>
                    <option value="Legalitas & Sertifikasi">Legalitas & Sertifikasi Belum Lengkap</option>
                    <option value="Administrasi & Warkah KIB">Administrasi & Warkah KIB</option>
                    <option value="Alih Fungsi Ilegal">Alih Fungsi Ilegal / Tanpa Izin</option>
                    <option value="Bencana Alam (Longsor/Banjir)">Bencana Alam (Longsor / Banjir)</option>
                    <option value="Lainnya">Lainnya</option>
                    {![
                      "Sengketa Lahan",
                      "Penyerobotan / Pendudukan Fisik",
                      "Legalitas & Sertifikasi",
                      "Administrasi & Warkah KIB",
                      "Alih Fungsi Ilegal",
                      "Bencana Alam (Longsor/Banjir)",
                      "Lainnya",
                    ].includes(editKategori) && editKategori ? (
                      <option value={editKategori}>{editKategori}</option>
                    ) : null}
                  </select>
                </div>

                {/* Deskripsi Risiko */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Deskripsi Peristiwa Risiko <span className="text-rose-500">*</span>
                  </label>
                  <textarea 
                    rows={3}
                    value={editDeskripsi}
                    onChange={(e) => setEditDeskripsi(e.target.value)}
                    required
                    placeholder="Jelaskan detail peristiwa ancaman risiko..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Penyebab & Dampak */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Penyebab Utama (Root Cause)</label>
                    <input 
                      type="text"
                      value={editPenyebab}
                      onChange={(e) => setEditPenyebab(e.target.value)}
                      placeholder="Penyebab terjadinya risiko..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Dampak Naratif</label>
                    <input 
                      type="text"
                      value={editDampak}
                      onChange={(e) => setEditDampak(e.target.value)}
                      placeholder="Konsekuensi jika risiko terjadi..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Existing Control */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Pengendalian Saat Ini (Existing Control)</label>
                  <input 
                    type="text"
                    value={editExistingControl}
                    onChange={(e) => setEditExistingControl(e.target.value)}
                    placeholder="Contoh: Pengawasan berkala / Koordinat terdata KIB"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Matriks Skor: Dampak x Peluang */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      Matriks Pembobotan Risiko (1 - 5)
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold border uppercase ${liveBadgeColor}`}>
                      {liveTingkat} (Total: {liveTotal})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-600 block mb-1">
                        Skor Dampak (1 - 5): <span className="font-bold text-slate-800">{editDampakScore}</span>
                      </label>
                      <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        value={editDampakScore}
                        onChange={(e) => setEditDampakScore(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 block mb-1">
                        Skor Peluang (1 - 5): <span className="font-bold text-slate-800">{editPeluangScore}</span>
                      </label>
                      <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        value={editPeluangScore}
                        onChange={(e) => setEditPeluangScore(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Status, PIC, Target Selesai */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Status Tindak Lanjut</label>
                    <select 
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="Belum Ditindaklanjuti">Belum Ditindaklanjuti</option>
                      <option value="Sedang Berjalan">Sedang Berjalan</option>
                      <option value="Selesai Termitigasi">Selesai Termitigasi</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Penanggung Jawab (PIC)</label>
                    <input 
                      type="text"
                      value={editPic}
                      onChange={(e) => setEditPic(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Target Selesai</label>
                    <input 
                      type="date"
                      value={editTargetSelesai}
                      onChange={(e) => setEditTargetSelesai(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Modal Edit */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 sticky bottom-0">
                <button 
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
