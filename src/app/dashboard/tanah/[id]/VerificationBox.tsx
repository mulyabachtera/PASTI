"use client";

import React, { useState } from "react";
import {
  FileCheck, CheckCircle2, XCircle, Clock,
  MessageSquare, Loader2, User
} from "lucide-react";

interface VerificationBoxProps {
  tanahId: string;
  namaBarang: string;
  statusVerifikasi: string | null;
  catatanVerifikasi: string | null;
  verifiedBy: string | null;
  verifiedAt: string | Date | null;
  inputBy: string | null;
  userRole?: string | null;
  userName?: string | null;
}

export default function VerificationBox({
  tanahId,
  namaBarang,
  statusVerifikasi: initialStatus,
  catatanVerifikasi: initialCatatan,
  verifiedBy: initialVerifiedBy,
  verifiedAt: initialVerifiedAt,
  inputBy,
  userRole,
}: VerificationBoxProps) {
  const [status, setStatus] = useState<string>(initialStatus || "TERVERIFIKASI");
  const [catatan, setCatatan] = useState<string>(initialCatatan || "");
  const [verifiedBy, setVerifiedBy] = useState<string | null>(initialVerifiedBy);
  const [verifiedAt, setVerifiedAt] = useState<any>(initialVerifiedAt);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [inputNotes, setInputNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canVerify = userRole === "VERIFICATOR" || userRole === "SUPER_ADMIN";

  const handleOpenModal = (action: "APPROVE" | "REJECT") => {
    setModalAction(action);
    setInputNotes(
      action === "APPROVE"
        ? "Data telah diperiksa, dokumen lengkap dan sesuai kondisi riil."
        : "Mohon lengkapi nomor sertifikat dan perbaiki data patok batas."
    );
    setIsModalOpen(true);
  };

  const submitVerification = async () => {
    setIsLoading(true);
    const newStatus = modalAction === "APPROVE" ? "TERVERIFIKASI" : "DITOLAK";

    try {
      const res = await fetch(`/api/assets/tanah/${tanahId}/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statusVerifikasi: newStatus,
          catatanVerifikasi: inputNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal memproses verifikasi.");
        return;
      }

      setStatus(newStatus);
      setCatatan(inputNotes);
      setVerifiedBy(data.tanah.verifiedBy);
      setVerifiedAt(data.tanah.verifiedAt);
      setIsModalOpen(false);
      alert(data.message || "Status verifikasi berhasil diperbarui!");
    } catch (err) {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header Panel */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-800 text-sm">Status & Validasi Verifikator</h3>
        </div>
        <div>
          {status === "TERVERIFIKASI" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Terverifikasi & Sah
            </span>
          )}
          {status === "MENUNGGU_VERIFIKASI" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Menunggu Verifikasi
            </span>
          )}
          {status === "DITOLAK" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
              <XCircle className="w-3.5 h-3.5 text-rose-600" /> Perlu Revisi / Ditolak
            </span>
          )}
        </div>
      </div>

      {/* Body Info */}
      <div className="p-5 space-y-4 text-xs sm:text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Petugas Penginput (Operator)
            </span>
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {inputBy || "Operator Sistem BMD"}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Petugas Verifikator
            </span>
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-slate-400" />
              {verifiedBy ? `${verifiedBy}` : "Belum Diverifikasi"}
            </p>
            {verifiedAt && (
              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                {new Date(verifiedAt).toLocaleString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>

        {/* Catatan Verifikator jika ada */}
        {catatan && (
          <div
            className={`p-3.5 rounded-xl border ${status === "DITOLAK"
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-blue-50/60 border-blue-200/70 text-slate-700"
              }`}
          >
            <span className="font-bold text-xs flex items-center gap-1.5 mb-1">
              <MessageSquare className="w-3.5 h-3.5" /> Catatan Hasil Pemeriksaan Verifikator:
            </span>
            <p className="text-xs leading-relaxed italic">&ldquo;{catatan}&rdquo;</p>
          </div>
        )}

        {/* Tombol Aksi Khusus Verifikator & Super Admin */}
        {canVerify ? (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Sebagai <strong>{userRole === "SUPER_ADMIN" ? "Super Admin" : "Verifikator"}</strong>, Anda berhak memvalidasi kebenaran fisik & dokumen aset ini.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenModal("REJECT")}
                className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4 text-rose-500" /> Tolak / Minta Revisi
              </button>
              <button
                type="button"
                onClick={() => handleOpenModal("APPROVE")}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> Setujui & Verifikasi Aset
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-400">
            {status === "MENUNGGU_VERIFIKASI"
              ? "⏳ Data aset ini sedang menunggu penelaahan dan persetujuan dari akun Verifikator."
              : "✓ Data aset ini telah terverifikasi resmi dalam inventarisasi BMD."}
          </div>
        )}
      </div>

      {/* Modal Dialog Verifikasi */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-left space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${modalAction === "APPROVE" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}
              >
                {modalAction === "APPROVE" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  {modalAction === "APPROVE" ? "Setujui & Verifikasi Aset" : "Tolak / Minta Revisi Aset"}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-1">{namaBarang}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Catatan Verifikator untuk Operator:
              </label>
              <textarea
                rows={3}
                value={inputNotes}
                onChange={(e) => setInputNotes(e.target.value)}
                placeholder="Tuliskan catatan hasil pemeriksaan fisik atau dokumen..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={submitVerification}
                className={`px-4 py-2 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer ${modalAction === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                  }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    {modalAction === "APPROVE" ? "Ya, Verifikasi Sekarang" : "Konfirmasi Tolak / Revisi"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
