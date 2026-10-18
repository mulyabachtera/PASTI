"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

export default function ActionMenu({ id }: { id: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <Link 
              href={`/dashboard/tanah/${id}`} 
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
            >
              <Eye className="w-4 h-4" /> Lihat Detail
            </Link>
            <Link 
              href={`/dashboard/tanah/${id}/edit`} 
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-amber-600 transition-colors"
            >
              <Edit className="w-4 h-4" /> Edit Data
            </Link>
            <button 
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left"
              onClick={async () => {
                if (confirm('Yakin ingin menghapus aset ini secara permanen?')) {
                  try {
                    const res = await fetch(`/api/assets/tanah/${id}`, {
                      method: 'DELETE',
                    });
                    if (res.ok) {
                      alert('Aset berhasil dihapus!');
                      window.location.reload();
                    } else {
                      alert('Gagal menghapus aset.');
                    }
                  } catch (err) {
                    alert('Terjadi kesalahan jaringan.');
                  }
                }
                setIsOpen(false);
              }}
            >
              <Trash2 className="w-4 h-4" /> Hapus
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
