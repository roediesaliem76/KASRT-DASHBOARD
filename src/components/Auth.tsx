import React, { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";
import { auth } from "../firebase";
import { motion } from "motion/react";
import { Shield, Mail, Lock, User, CheckCircle } from "lucide-react";
import logoBekasi from "../logo_bekasi.svg";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error("Nama lengkap harus diisi");
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: name,
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      let errorMsg = "Terjadi kesalahan. Silakan coba lagi.";
      if (err.code === "auth/email-already-in-use") {
        errorMsg = "Email sudah digunakan oleh akun lain.";
      } else if (err.code === "auth/invalid-email") {
        errorMsg = "Format email tidak valid.";
      } else if (err.code === "auth/weak-password") {
        errorMsg = "Password minimal terdiri dari 6 karakter.";
      } else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        errorMsg = "Email atau password salah.";
      } else if (err.code === "auth/operation-not-allowed" || (err.message && err.message.includes("operation-not-allowed"))) {
        errorMsg = "auth/operation-not-allowed";
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-white flex items-center justify-center rounded-2xl border border-gray-100 shadow-sm p-1.5">
            <img 
              src={logoBekasi} 
              className="w-16 h-16 object-contain" 
              alt="Logo Kota Bekasi" 
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[#151c27] font-hanken tracking-tight">
          RT 009/05 Jatisari
        </h2>
        <p className="mt-2 text-center text-sm text-[#434654] font-sans">
          {isSignUp 
            ? "Pendaftaran Akun Pengurus / Warga" 
            : "Sistem Laporan Keuangan Keasistenan RT"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          layout
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white py-8 px-4 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),_0_2px_4px_-1px_rgba(0,0,0,0.03)] border border-[#e5e7eb] rounded-2xl sm:px-10"
        >
          {error && error === "auth/operation-not-allowed" ? (
            <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-900 text-sm p-4 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">!</div>
                <div>
                  <h4 className="font-bold text-amber-950">Provider Email/Password Belum Aktif</h4>
                  <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                    Metode masuk dengan Email/Password belum diaktifkan di Firebase Console Anda. Silakan ikuti langkah berikut untuk mengaktifkannya:
                  </p>
                </div>
              </div>
              <ol className="list-decimal pl-5 text-xs space-y-1.5 text-amber-800 leading-relaxed font-sans">
                <li>Buka <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-amber-950">Firebase Console</a> Anda.</li>
                <li>Pilih proyek Firebase Anda.</li>
                <li>Buka menu <span className="font-semibold text-amber-950">Authentication</span> &gt; tab <span className="font-semibold text-amber-950">Sign-in method</span>.</li>
                <li>Klik tombol <span className="font-semibold text-amber-950">Add new provider</span> dan pilih <span className="font-semibold text-amber-950">Email/Password</span>.</li>
                <li>Aktifkan (Enable) opsi <span className="font-semibold text-amber-950">Email/Password</span> lalu klik <span className="font-semibold text-amber-950">Save</span>.</li>
                <li>Setelah disimpan, silakan refresh halaman ini dan ulangi pendaftaran/masuk.</li>
              </ol>
            </div>
          ) : error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-[#ba1a1a] text-sm p-3 rounded-lg flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#434654] mb-1.5">
                  Nama Lengkap
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-[#f9f9ff] border border-[#cbd5e1] rounded-lg text-sm text-[#151c27] placeholder-gray-400 focus:outline-none focus:border-[#003fb1] focus:ring-1 focus:ring-[#003fb1] transition-colors"
                    placeholder="Contoh: Siti Aminah"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#434654] mb-1.5">
                Alamat Email
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#f9f9ff] border border-[#cbd5e1] rounded-lg text-sm text-[#151c27] placeholder-gray-400 focus:outline-none focus:border-[#003fb1] focus:ring-1 focus:ring-[#003fb1] transition-colors"
                  placeholder="admin@jatisari.rt009.id"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#434654] mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#f9f9ff] border border-[#cbd5e1] rounded-lg text-sm text-[#151c27] placeholder-gray-400 focus:outline-none focus:border-[#003fb1] focus:ring-1 focus:ring-[#003fb1] transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-[#003fb1] focus:ring-[#003fb1] border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-[#434654]">
                  Ingat saya di perangkat ini
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#003fb1] hover:bg-[#002d85] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003fb1] transition-colors disabled:opacity-55"
              >
                {loading ? "Memproses..." : isSignUp ? "Daftar Akun Baru" : "Masuk Sistem"}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                }}
                className="text-sm font-semibold text-[#003fb1] hover:text-[#002d85]"
              >
                {isSignUp 
                  ? "Sudah punya akun? Masuk di sini" 
                  : "Belum punya akun? Daftar sebagai pengurus/warga"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
