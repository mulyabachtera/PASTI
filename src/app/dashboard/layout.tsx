"use client";

import React, { Suspense, useState, useEffect } from 'react';
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  ShieldAlert, 
  LogOut, 
  Loader2, 
  Menu, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Users
} from "lucide-react";

import { DEMO_MODE } from '@/lib/demoConfig';

function SidebarNav({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const navItems = [
    { name: "Dashboard Spasial", href: "/dashboard", icon: LayoutDashboard, badge: null },
    { name: "Master Tanah", href: "/dashboard/tanah", icon: FileSpreadsheet, badge: DEMO_MODE ? "Fase 2" : null },
    { name: "Risk Register", href: "/dashboard/risk", icon: ShieldAlert, badge: DEMO_MODE ? "Fase 2" : null },
  ];

  if (role === "SUPER_ADMIN") {
    navItems.push({
      name: "Kelola Pengguna",
      href: "/dashboard/users",
      icon: Users,
      badge: null,
    });
  }

  return (
    <>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.href}
            href={item.href} 
            title={isCollapsed ? `${item.name}${item.badge ? ` (${item.badge})` : ''}` : undefined}
            className={`flex items-center ${
              isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3"
            } rounded-xl font-medium transition-all group relative ${
              isActive 
                ? "bg-blue-600/15 text-blue-400 border border-blue-500/30" 
                : "text-slate-300 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-blue-400" : "text-slate-400 group-hover:text-white"}`} />
            
            {!isCollapsed && (
              <div className="flex items-center justify-between flex-1 min-w-0 pr-0.5">
                <span className="whitespace-nowrap transition-opacity duration-200 text-sm truncate">
                  {item.name}
                </span>
                {item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase tracking-wider shrink-0 ml-2">
                    {item.badge}
                  </span>
                )}
              </div>
            )}

            {/* Floating Tooltip saat menu dikecilkan */}
            {isCollapsed && (
              <span className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-700 hidden group-hover:flex pointer-events-none whitespace-nowrap z-50 items-center gap-2">
                <span>{item.name}</span>
                {item.badge && (
                  <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </span>
            )}
          </Link>
        );
      })}
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login");
    }
  });

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Baca preferensi besar/kecil sidebar dari localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sim_pasti_sidebar_collapsed");
      if (saved !== null) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sim_pasti_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: "👑 Super Admin",
    VERIFICATOR: "🛡️ Verifikator",
    OPERATOR: "✏️ Operator",
    ADMIN_PEMERINTAH: "🏢 Admin Instansi",
    VENDOR_SWASTA: "🏗️ Vendor Mitra",
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Backdrop for Mobile Drawer */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Collapsible Sidebar */}
      <aside 
        className={`${
          isCollapsed ? "w-20" : "w-72"
        } bg-[#0B0F19] text-white flex-col hidden md:flex border-r border-slate-800 shadow-2xl z-20 print:hidden transition-all duration-300 ease-in-out relative flex-shrink-0`}
      >
        {/* Tombol Toggle Besar/Kecil di Tepi Kanan Sidebar */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex absolute -right-3.5 top-7 w-7 h-7 rounded-full bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white items-center justify-center shadow-lg border border-slate-700 z-30 transition-all cursor-pointer group"
          title={isCollapsed ? "Perbesar Panel Menu" : "Kecilkan Panel Menu"}
          aria-label="Toggle Sidebar"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 group-hover:scale-110 transition-transform" />
          ) : (
            <ChevronLeft className="w-4 h-4 group-hover:scale-110 transition-transform" />
          )}
        </button>

        {/* Sidebar Header: Logo & Title (Hanya Logo jika Kecil) */}
        <div className={`h-20 flex items-center border-b border-slate-800/60 bg-slate-900/40 transition-all duration-300 ${
          isCollapsed ? "justify-center px-2" : "justify-between px-6"
        }`}>
          <Link 
            href="/dashboard"
            className="flex items-center min-w-0 cursor-pointer group/brand"
            title="Kembali ke Dashboard Utama"
          >
            <div className="relative group/logo flex items-center justify-center">
              <img 
                src="/pasti-logo.png" 
                alt="Logo PASTI" 
                className={`${isCollapsed ? "w-11 h-11" : "w-11 h-11"} rounded-full object-contain p-0.5 bg-slate-800/80 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 flex-shrink-0 transition-transform group-hover/brand:scale-105`} 
              />
            </div>

            {/* Nama & Subtitle: Hanya ditampilkan saat BESAR (tidak collapsed) */}
            {!isCollapsed && (
              <div className="ml-3 min-w-0 overflow-hidden whitespace-nowrap animate-in fade-in duration-200">
                <h1 className="text-xl font-bold tracking-tight text-white group-hover/brand:text-blue-300 transition-colors leading-tight">
                  SIM <span className="text-blue-400">PASTI</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Executive System</p>
              </div>
            )}
          </Link>
        </div>
        
        {/* Menu Items */}
        <div className={`flex-1 flex flex-col gap-2 py-6 transition-all duration-300 ${
          isCollapsed ? "px-2.5 items-center overflow-visible" : "px-5 overflow-y-auto overflow-x-hidden"
        }`}>
          {!isCollapsed ? (
            <p className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider px-2">
              Menu Utama
            </p>
          ) : (
            <div className="w-8 h-[1px] bg-slate-800 my-1 mb-2" />
          )}

          <Suspense fallback={<div className="h-40 text-slate-400 text-xs flex items-center justify-center">Memuat...</div>}>
            <div className={`w-full flex flex-col gap-1.5 ${isCollapsed ? "items-center" : ""}`}>
              <SidebarNav isCollapsed={isCollapsed} />
            </div>
          </Suspense>
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className="border-t border-slate-800/60 bg-slate-900/30 transition-all duration-300">
          {!isCollapsed ? (
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-xs flex-shrink-0">
                  {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate max-w-[130px]">{session?.user?.name || "Pengguna"}</p>
                  <p className="text-[10px] text-blue-400 truncate">{roleLabels[(session?.user as any)?.role] || "Pengguna"}</p>
                </div>
              </div>
              <button 
                onClick={() => signOut()}
                className="p-2 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg transition-colors text-slate-400 flex-shrink-0"
                title="Keluar / Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-3 flex flex-col items-center gap-2.5">
              <div 
                className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-xs relative group cursor-pointer"
                title={`${session?.user?.name || "Pengguna"} (${roleLabels[(session?.user as any)?.role] || "Pengguna"})`}
              >
                {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-700 hidden group-hover:block pointer-events-none whitespace-nowrap z-50">
                  {session?.user?.name}
                </span>
              </div>
              <button 
                onClick={() => signOut()}
                className="p-2.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 rounded-xl transition-colors text-slate-400 group relative"
                title="Keluar / Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-rose-300 text-xs font-semibold rounded-lg shadow-xl border border-slate-700 hidden group-hover:block pointer-events-none whitespace-nowrap z-50">
                  Keluar
                </span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Drawer (When Opened on Small Screens) */}
      <aside 
        className={`fixed inset-y-0 left-0 w-72 bg-[#0B0F19] text-white flex flex-col z-50 md:hidden transition-transform duration-300 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800/60 bg-slate-900/40">
          <Link
            href="/dashboard"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center min-w-0 cursor-pointer"
            title="Kembali ke Dashboard Utama"
          >
            <img 
              src="/pasti-logo.png" 
              alt="Logo PASTI" 
              className="w-11 h-11 rounded-full object-contain p-0.5 bg-slate-800/80 border border-emerald-500/30 shadow-md shadow-emerald-500/10 flex-shrink-0 mr-3" 
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                SIM <span className="text-blue-400">PASTI</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Executive System</p>
            </div>
          </Link>
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-2 overflow-y-auto">
          <p className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Menu Utama</p>
          <div className="flex flex-col gap-1.5" onClick={() => setIsMobileOpen(false)}>
            <SidebarNav isCollapsed={false} />
          </div>
        </div>

        <div className="p-5 border-t border-slate-800/60 bg-slate-900/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-white">{session?.user?.name || "Pengguna"}</p>
            <p className="text-[10px] text-blue-400 mt-0.5">{roleLabels[(session?.user as any)?.role] || "Pengguna"}</p>
          </div>
          <button 
            onClick={() => signOut()}
            className="p-2 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg transition-colors text-slate-400"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen bg-slate-50/50 print:bg-white overflow-x-hidden">
        {/* Mobile Header (Hanya tampil di mobile/layar kecil) */}
        <header className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-xs print:hidden">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2.5 cursor-pointer" title="Kembali ke Dashboard Utama">
            <img 
              src="/pasti-logo.png" 
              alt="Logo PASTI" 
              className="w-8 h-8 rounded-full object-contain shadow-xs border border-emerald-500/20" 
            />
            <span className="font-bold text-slate-800 text-sm">SIM PASTI</span>
          </Link>
          <div className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Aktif
          </div>
        </header>
        
        <div className="p-6 lg:p-8 flex-1 print:p-2 print:m-0">
          {children}
        </div>
      </main>
    </div>
  );
}

