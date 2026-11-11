"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Eye, Edit, Trash2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FORMS_UNDER_DEVELOPMENT } from "@/lib/demoConfig";

export default function ActionMenu({ id }: { id: string }) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const canVerify = role === "VERIFICATOR" || role === "SUPER_ADMIN";
  const canDelete = role === "SUPER_ADMIN" || role === "ADMIN_PEMERINTAH";

  const [isOpen, setIsOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 192; // 12rem = 192px
      const left = Math.max(10, rect.right - menuWidth);
      const spaceBelow = window.innerHeight - rect.bottom;
      // Jika ruang di bawah kurang dari 240px, buka ke atas
      const top = spaceBelow < 240 ? Math.max(10, rect.top - 230) : rect.bottom + 6;
      setCoords({ top, left });
    }
  };

  const toggleOpen = () => {
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    function handleScrollOrResize() {
      setIsOpen(false);
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  const handleQuickVerify = async (statusVerifikasi: "TERVERIFIKASI" | "DITOLAK") => {
    setIsOpen(false);
    let catatanVerifikasi = "Data telah diperiksa dan disetujui oleh Verifikator.";
    if (statusVerifikasi === "DITOLAK") {
      const note = prompt("Masukkan catatan perbaikan/alasan penolakan untuk Operator:", "Mohon lengkapi dokumen pendukung dan cek kembali ukuran luas.");
      if (note === null) return; // dibatalkan
      catatanVerifikasi = note.trim() || "Perlu perbaikan data.";
    } else {
      if (!confirm("Setujui dan verifikasi data aset tanah ini?")) return;
    }

    try {
      setIsVerifying(true);
      const res = await fetch(`/api/assets/tanah/${id}/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusVerifikasi, catatanVerifikasi }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Status verifikasi berhasil diperbarui!");
        window.location.reload();
      } else {
        alert(data.error || "Gagal memproses verifikasi.");
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      <button 
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none cursor-pointer"
        title="Menu Aksi"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && coords && mounted && createPortal(
        <div 
          ref={menuRef}
          style={{
            position: "fixed",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
          }}
          className="w-48 rounded-xl shadow-xl bg-white border border-slate-200/80 ring-1 ring-black/5 z-[9999] divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="py-1" role="menu">
            <Link 
              href={`/dashboard/tanah/${id}`} 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" /> Lihat Detail
            </Link>
            {!FORMS_UNDER_DEVELOPMENT && (
              <Link 
                href={`/dashboard/tanah/${id}/edit`} 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-colors"
              >
                <Edit className="w-3.5 h-3.5 text-amber-500" /> Edit Data
              </Link>
            )}
          </div>

          {/* Menu Cepat Khusus Verifikator & Super Admin */}
          {canVerify && (
            <div className="py-1 bg-slate-50/40">
              <button
                type="button"
                disabled={isVerifying}
                onClick={() => handleQuickVerify("TERVERIFIKASI")}
                className="flex w-full items-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors text-left cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Setujui (Verifikasi)
              </button>
              <button
                type="button"
                disabled={isVerifying}
                onClick={() => handleQuickVerify("DITOLAK")}
                className="flex w-full items-center gap-2 px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors text-left cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5 text-amber-600" /> Tolak / Minta Revisi
              </button>
            </div>
          )}

          {/* Tombol Hapus Khusus Super Admin & Admin Instansi */}
          {canDelete && (
            <div className="py-1">
              <button 
                type="button"
                className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                onClick={async () => {
                  setIsOpen(false);
                  if (confirm('Yakin ingin menghapus aset ini secara permanen?')) {
                    try {
                      const res = await fetch(`/api/assets/tanah/${id}`, {
                        method: 'DELETE',
                      });
                      if (res.ok) {
                        alert('Aset berhasil dihapus!');
                        window.location.reload();
                      } else {
                        const errData = await res.json();
                        alert(errData.error || 'Gagal menghapus aset.');
                      }
                    } catch (err) {
                      alert('Terjadi kesalahan jaringan.');
                    }
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Hapus Aset
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
