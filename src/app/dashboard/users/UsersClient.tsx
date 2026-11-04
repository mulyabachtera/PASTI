"use client";

import React, { useState } from "react";
import { 
  Users, UserPlus, Search, Shield, ShieldCheck, 
  Edit, Trash2, KeyRound, CheckCircle, AlertCircle, 
  X, Loader2, UserCheck, FileCheck
} from "lucide-react";
import { useSession } from "next-auth/react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "VERIFICATOR" | "OPERATOR" | "ADMIN_PEMERINTAH" | "VENDOR_SWASTA";
  createdAt: string;
  updatedAt: string;
}

interface UsersClientProps {
  initialUsers: UserItem[];
}

export default function UsersClient({ initialUsers }: UsersClientProps) {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const currentUserEmail = session?.user?.email;

  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Form State (Add)
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState<UserItem["role"]>("OPERATOR");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State (Edit)
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<UserItem["role"]>("OPERATOR");
  const [editPassword, setEditPassword] = useState("");

  const roleMeta: Record<UserItem["role"], { label: string; badge: string; icon: any; desc: string }> = {
    SUPER_ADMIN: {
      label: "Super Admin",
      badge: "bg-purple-100 text-purple-800 border-purple-200",
      icon: Shield,
      desc: "Akses penuh sistem, manajemen akun pengguna, dan seluruh data.",
    },
    VERIFICATOR: {
      label: "Verifikator",
      badge: "bg-amber-100 text-amber-800 border-amber-300",
      icon: FileCheck,
      desc: "Memvalidasi, menyetujui (approve), atau menolak data yang diinput oleh Operator.",
    },
    OPERATOR: {
      label: "Operator Input",
      badge: "bg-blue-100 text-blue-800 border-blue-200",
      icon: UserCheck,
      desc: "Menginput aset tanah & data fisik. Data otomatis berstatus Menunggu Verifikasi.",
    },
    ADMIN_PEMERINTAH: {
      label: "Admin Instansi",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: ShieldCheck,
      desc: "Pengelola aset tingkat dinas / SKPK pemerintah daerah.",
    },
    VENDOR_SWASTA: {
      label: "Vendor Mitra",
      badge: "bg-slate-100 text-slate-800 border-slate-200",
      icon: Users,
      desc: "Mitra lapangan / surveyor untuk pengukuran batas dan spasial.",
    },
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Role Counts
  const counts = {
    total: users.length,
    superAdmin: users.filter((u) => u.role === "SUPER_ADMIN").length,
    verificator: users.filter((u) => u.role === "VERIFICATOR").length,
    operator: users.filter((u) => u.role === "OPERATOR").length,
    others: users.filter((u) => u.role === "ADMIN_PEMERINTAH" || u.role === "VENDOR_SWASTA").length,
  };

  // Open Edit Modal
  const handleOpenEdit = (user: UserItem) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditPassword("");
    setErrorMsg(null);
    setIsEditModalOpen(true);
  };

  // Submit Add User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addName,
          email: addEmail,
          password: addPassword,
          role: addRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal membuat akun.");
        return;
      }

      setUsers([data.user, ...users]);
      setIsAddModalOpen(false);
      setAddName("");
      setAddEmail("");
      setAddPassword("");
      setAddRole("OPERATOR");
      alert(data.message || "Akun baru berhasil dibuat!");
    } catch (err) {
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Update User
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          role: editRole,
          password: editPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal memperbarui akun.");
        return;
      }

      setUsers(users.map((u) => (u.id === selectedUser.id ? { ...u, ...data.user } : u)));
      setIsEditModalOpen(false);
      setSelectedUser(null);
      alert(data.message || "Data akun berhasil diperbarui!");
    } catch (err) {
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (user: UserItem) => {
    if (user.id === currentUserId || user.email === currentUserEmail) {
      alert("Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif!");
      return;
    }

    if (!confirm(`Yakin ingin menghapus akun "${user.name}" (${user.email})? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal menghapus pengguna.");
        return;
      }

      setUsers(users.filter((u) => u.id !== user.id));
      alert(data.message || "Pengguna berhasil dihapus.");
    } catch (err) {
      alert("Terjadi kesalahan jaringan.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" /> Manajemen Akun & Hak Akses
          </h2>
          <p className="text-slate-500 mt-1">
            Kelola pengguna sistem, buat akun <strong>Verifikator</strong> dan <strong>Operator</strong> untuk alur validasi aset berjenjang.
          </p>
        </div>
        <button
          onClick={() => {
            setErrorMsg(null);
            setIsAddModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-xs text-sm cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Tambah Akun Baru
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Pengguna</span>
            <span className="text-2xl font-black text-slate-800">{counts.total}</span>
            <span className="text-xs text-slate-500 block mt-0.5">Semua peran terdaftar</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">Verifikator</span>
            <span className="text-2xl font-black text-amber-900">{counts.verificator}</span>
            <span className="text-xs text-amber-700/80 block mt-0.5">Pemeriksa & validasi data</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200/80 bg-blue-50/20 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">Operator Input</span>
            <span className="text-2xl font-black text-blue-900">{counts.operator}</span>
            <span className="text-xs text-blue-700/80 block mt-0.5">Penginput data aset lapangan</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-200/80 bg-purple-50/20 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider block">Super Admin</span>
            <span className="text-2xl font-black text-purple-900">{counts.superAdmin}</span>
            <span className="text-xs text-purple-700/80 block mt-0.5">Otoritas tertinggi sistem</span>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50/60">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau email pengguna..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium">Filter Peran:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Peran ({counts.total})</option>
              <option value="VERIFICATOR">Verifikator ({counts.verificator})</option>
              <option value="OPERATOR">Operator Input ({counts.operator})</option>
              <option value="SUPER_ADMIN">Super Admin ({counts.superAdmin})</option>
              <option value="ADMIN_PEMERINTAH">Admin Instansi</option>
              <option value="VENDOR_SWASTA">Vendor Mitra</option>
            </select>
          </div>
        </div>

        {/* Table Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Nama & Email</th>
                <th className="px-5 py-3.5">Peran (Role)</th>
                <th className="px-5 py-3.5">Deskripsi Hak Akses</th>
                <th className="px-5 py-3.5">Terdaftar Sejak</th>
                <th className="px-5 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Tidak ditemukan data pengguna yang cocok.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const meta = roleMeta[user.role] || {
                    label: user.role,
                    badge: "bg-slate-100 text-slate-700 border-slate-200",
                    icon: Users,
                    desc: "Pengguna sistem",
                  };
                  const Icon = meta.icon;
                  const isCurrent = user.id === currentUserId || user.email === currentUserEmail;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0 uppercase text-xs">
                            {user.name.slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 text-sm block flex items-center gap-1.5">
                              {user.name}
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                                  Anda
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${meta.badge}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs text-slate-600 max-w-sm leading-relaxed">{meta.desc}</p>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 font-mono">
                        {new Date(user.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Akun & Role"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isCurrent
                                ? "text-slate-300 cursor-not-allowed"
                                : "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                            }`}
                            title={isCurrent ? "Tidak dapat menghapus akun sendiri" : "Hapus Pengguna"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
          <p>
            Menampilkan <strong>{filteredUsers.length}</strong> dari <strong>{users.length}</strong> pengguna
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: TAMBAH AKUN BARU */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateUser}>
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Tambah Akun Pengguna Baru</h3>
                    <p className="text-xs text-slate-500">Pilih peran Operator atau Verifikator sesuai kebutuhan kerja.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 text-xs sm:text-sm">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Nama */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso, S.Kom"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Email Pengguna <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="contoh: operator.aset@pasti.go.id"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Password Awal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Minimal 6 karakter"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <p className="text-[11px] text-slate-400">Pengguna dapat mengganti password ini nantinya.</p>
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 block">
                    Peran / Hak Akses Akun <span className="text-rose-500">*</span>
                  </label>

                  <div className="grid grid-cols-1 gap-2.5">
                    {/* Option OPERATOR */}
                    <label
                      className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        addRole === "OPERATOR"
                          ? "border-blue-500 bg-blue-50/40 ring-1 ring-blue-500"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="addRole"
                        value="OPERATOR"
                        checked={addRole === "OPERATOR"}
                        onChange={() => setAddRole("OPERATOR")}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Operator (Entri & Input Data)
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          Bertugas menginput data aset tanah, nomor sertifikat, dan kondisi fisik lapangan. Data yang diinput berstatus <strong>Menunggu Verifikasi</strong>.
                        </p>
                      </div>
                    </label>

                    {/* Option VERIFICATOR */}
                    <label
                      className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        addRole === "VERIFICATOR"
                          ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="addRole"
                        value="VERIFICATOR"
                        checked={addRole === "VERIFICATOR"}
                        onChange={() => setAddRole("VERIFICATOR")}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <FileCheck className="w-3.5 h-3.5 text-amber-600" /> Verifikator (Pemeriksa & Validasi)
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          Bertugas memeriksa keabsahan dan kelengkapan data yang diinput Operator. Berhak <strong>Menyetujui (Approve)</strong> atau <strong>Menolak</strong> data.
                        </p>
                      </div>
                    </label>

                    {/* Option SUPER_ADMIN */}
                    <label
                      className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        addRole === "SUPER_ADMIN"
                          ? "border-purple-500 bg-purple-50/40 ring-1 ring-purple-500"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="addRole"
                        value="SUPER_ADMIN"
                        checked={addRole === "SUPER_ADMIN"}
                        onChange={() => setAddRole("SUPER_ADMIN")}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-purple-600" /> Super Admin
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Akses penuh sistem, manajemen akun pengguna, dan seluruh aset.
                        </p>
                      </div>
                    </label>

                    {/* Other Roles Toggle */}
                    <div className="pt-1 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAddRole("ADMIN_PEMERINTAH")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          addRole === "ADMIN_PEMERINTAH"
                            ? "bg-emerald-100 border-emerald-300 text-emerald-800 font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Admin Instansi (Dinas)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddRole("VENDOR_SWASTA")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          addRole === "VENDOR_SWASTA"
                            ? "bg-slate-200 border-slate-300 text-slate-800 font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Vendor Mitra
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" /> Buat Akun Sekarang
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: EDIT AKUN & RESET PASSWORD */}
      {/* ========================================================= */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleUpdateUser}>
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Edit className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Edit Akun Pengguna</h3>
                    <p className="text-xs text-slate-500">Perbarui profil, hak akses peran, atau reset password.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 text-xs sm:text-sm">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Nama */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Email</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Ubah Peran */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Peran (Role)</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value="OPERATOR">Operator (Entri & Input Data Aset)</option>
                    <option value="VERIFICATOR">Verifikator (Pemeriksa & Validasi Aset)</option>
                    <option value="SUPER_ADMIN">Super Admin (Akses Penuh)</option>
                    <option value="ADMIN_PEMERINTAH">Admin Instansi (Dinas)</option>
                    <option value="VENDOR_SWASTA">Vendor Mitra (Surveyor)</option>
                  </select>
                </div>

                {/* Reset Password */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="font-semibold text-slate-700 flex items-center gap-1.5 text-xs">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" /> Reset Password (Opsional)
                  </label>
                  <input
                    type="password"
                    placeholder="Kosongkan jika password tidak ingin diubah"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white"
                  />
                  <p className="text-[11px] text-slate-400">Isi minimal 6 karakter hanya jika ingin mengganti password baru.</p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" /> Simpan Perubahan
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

