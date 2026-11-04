import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import UsersClient from "./UsersClient";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  // Proteksi: Hanya Super Admin yang boleh membuka halaman Manajemen Pengguna
  if (role !== "SUPER_ADMIN") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4 shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Akses Dibatasi Khusus Super Admin</h2>
        <p className="text-slate-500 text-sm max-w-md mt-2 leading-relaxed">
          Halaman manajemen akun dan hak akses pengguna ini hanya dapat diakses oleh akun dengan peran <strong>Super Admin</strong>.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs"
        >
          Kembali ke Dashboard Utama
        </Link>
      </div>
    );
  }

  const rawUsers = await prisma.user.findMany({
    select: {
      id: true,
      nip: true,
      name: true,
      email: true,
      role: true,
      isEmailVerified: true,
      emailVerifiedAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedUsers = rawUsers.map((u) => ({
    ...u,
    emailVerifiedAt: u.emailVerifiedAt ? u.emailVerifiedAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));

  return <UsersClient initialUsers={serializedUsers as any} />;
}

