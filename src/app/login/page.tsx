"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await signIn("credentials", {
        email: identifier.trim(),
        password,
        redirect: false,
        callbackUrl: "/dashboard"
      });

      if (res?.error) {
        alert(res.error === "CredentialsSignin" ? "NIP/Email atau password tidak sesuai atau akun belum diverifikasi." : res.error);
        setIsLoading(false);
        return;
      }

      if (res?.ok) {
        router.push("/dashboard");
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Terjadi kendala koneksi ke server saat proses masuk. Silakan coba kembali.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/20 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center p-6 relative z-10">
        
        {/* Left Side: Branding */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:flex flex-col gap-6 text-white p-8"
        >
          <div className="flex items-center gap-4">
            <img 
              src="/pasti-logo.png" 
              alt="Logo PASTI" 
              className="w-16 h-16 rounded-full object-contain p-1 bg-slate-800/80 border border-emerald-500/30 shadow-2xl shadow-emerald-500/20 hover:scale-105 transition-transform" 
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">SIM <span className="text-blue-400">PASTI</span></h1>
              <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">Executive System</p>
            </div>
          </div>
          
          <h2 className="text-5xl font-extrabold leading-tight mt-4">
            Pengamanan Aset Strategis <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Terintegrasi & Informatif
            </span>
          </h2>
          
          <p className="text-slate-400 text-xl mt-4 leading-relaxed max-w-lg">
            Sistem manajemen aset tanah dan mitigasi risiko cerdas berbasis intelijen spasial (PostGIS) terpadu.
          </p>

          <div className="flex items-center gap-4 mt-12">
            <div className="flex -space-x-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-12 h-12 rounded-full border-2 border-[#0B0F19] bg-slate-800 flex items-center justify-center shadow-lg">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-300 font-medium leading-snug">
              Keamanan Data Tingkat Tinggi <br/>
              <span className="text-emerald-400">Enkripsi AES-256 & Bcrypt</span>
            </p>
          </div>
        </motion.div>

        {/* Right Side: Login Form */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="w-full max-w-md mx-auto"
        >
          <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/50 shadow-2xl shadow-blue-900/20">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <img 
                  src="/pasti-logo.png" 
                  alt="Logo PASTI" 
                  className="w-16 h-16 rounded-full object-contain p-1 bg-slate-800/80 border border-emerald-500/40 shadow-xl shadow-emerald-500/20 hover:scale-105 transition-transform" 
                />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">Selamat Datang</h3>
              <p className="text-slate-400 text-sm">Masuk untuk mengelola aset strategis daerah</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">NIP atau Email Akun</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500" />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-700/50 text-white rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600 shadow-inner font-mono text-sm"
                    placeholder="Masukkan NIP (18 digit) atau Email..."
                  />
                </div>
                <p className="text-[11px] text-slate-400 ml-1">
                  Gunakan <strong>NIP</strong> (contoh: <code>199010252022031003</code>) atau alamat email terdaftar.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <a href="#" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Lupa Password?</a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-700/50 text-white rounded-xl py-3.5 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600 shadow-inner font-mono text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    title={showPassword ? "Sembunyikan password" : "Lihat password"}
                    aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-blue-400 hover:text-blue-300 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-500 hover:text-slate-300 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-semibold rounded-xl py-4 px-4 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none shadow-lg shadow-blue-900/30 mt-6"
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <span className="text-lg">Masuk ke Sistem</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-500 leading-relaxed">
                &copy; 2026 SIM PASTI v3.0 Enterprise Edition.<br/> 
                Direktorat Jenderal Pengelolaan Aset Negara
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
