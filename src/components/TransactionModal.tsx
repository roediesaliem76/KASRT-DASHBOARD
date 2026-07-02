import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { X } from "lucide-react";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransactionModal({ isOpen, onClose, onSuccess }: TransactionModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<"income" | "expense">("income");
  const [category, setCategory] = useState("Iuran Warga");
  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      setError("Nominal harus berupa angka positif.");
      return;
    }

    if (!description.trim()) {
      setError("Deskripsi transaksi wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Pengguna tidak terautentikasi.");

      try {
        await addDoc(collection(db, "transactions"), {
          date,
          type,
          category,
          description,
          amount,
          createdBy: user.uid,
          createdAt: new Date().toISOString()
        });
      } catch (err: any) {
        handleFirestoreError(err, OperationType.CREATE, "transactions");
      }

      // Clear fields
      setDescription("");
      setAmountStr("");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Gagal menyimpan transaksi: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col border border-gray-100">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-hanken text-lg font-bold text-[#151c27]">Input Transaksi Baru</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-[#ba1a1a] text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          {/* Date Picker */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#434654] uppercase tracking-wider">Tanggal</label>
            <input 
              type="date" 
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-gray-200 bg-[#f9f9ff] text-[#151c27] focus:border-[#003fb1] focus:ring-1 focus:ring-[#003fb1] outline-none text-sm transition-colors"
            />
          </div>

          {/* Type Select buttons */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#434654] uppercase tracking-wider">Tipe Transaksi</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setType("income");
                  if (category === "Operasional" || category === "Kebersihan" || category === "Keamanan") {
                    setCategory("Iuran Warga");
                  }
                }}
                className={`flex-1 text-center py-2.5 rounded-lg border font-semibold text-sm transition-all cursor-pointer ${
                  type === "income" 
                    ? "bg-[#7ef6be]/20 text-[#00714c] border-[#006c49]" 
                    : "border-gray-200 hover:bg-gray-50 text-gray-600"
                }`}
              >
                Pemasukan
              </button>
              <button
                type="button"
                onClick={() => {
                  setType("expense");
                  if (category === "Iuran Warga" || category === "Kas Masuk") {
                    setCategory("Operasional");
                  }
                }}
                className={`flex-1 text-center py-2.5 rounded-lg border font-semibold text-sm transition-all cursor-pointer ${
                  type === "expense" 
                    ? "bg-[#ffdad6] text-[#93000a] border-[#ba1a1a]" 
                    : "border-gray-200 hover:bg-gray-50 text-gray-600"
                }`}
              >
                Pengeluaran
              </button>
            </div>
          </div>

          {/* Category SELECT */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#434654] uppercase tracking-wider">Kategori</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-gray-200 bg-[#f9f9ff] text-[#151c27] focus:border-[#003fb1] focus:ring-1 focus:ring-[#003fb1] outline-none text-sm transition-colors"
            >
              {type === "income" ? (
                <>
                  <option value="Iuran Warga">Iuran Warga</option>
                  <option value="Kas Masuk">Kas Masuk (Donasi/Sumbangan)</option>
                  <option value="Lain-lain">Lain-lain</option>
                </>
              ) : (
                <>
                  <option value="Operasional">Operasional RT</option>
                  <option value="Gaji Satpam">Gaji Satpam</option>
                  <option value="Gaji Petugas Kebersihan">Gaji Petugas Kebersihan</option>
                  <option value="Biaya Angkut Sampah">Biaya Angkut Sampah</option>
                  <option value="Biaya Sewa Penampungan Sampah">Biaya Sewa Penampungan Sampah</option>
                  <option value="Kebersihan">Kebersihan Lingkungan</option>
                  <option value="Keamanan">Operasional Keamanan & Satpam</option>
                  <option value="Fasilitas Umum">Fasilitas Umum / Perbaikan</option>
                  <option value="Sosial">Sosial / Santunan</option>
                  <option value="Lain-lain">Lain-lain</option>
                </>
              )}
            </select>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#434654] uppercase tracking-wider">Deskripsi</label>
            <textarea 
              placeholder="Contoh: Pembayaran iuran warga Blok B-12"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={150}
              className="w-full p-2.5 rounded-lg border border-gray-200 bg-[#f9f9ff] text-[#151c27] focus:border-[#003fb1] focus:ring-1 focus:ring-[#003fb1] outline-none text-sm h-20 resize-none transition-colors"
            />
          </div>

          {/* Nominal amount */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#434654] uppercase tracking-wider">Nominal</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">Rp</span>
              <input 
                type="number" 
                placeholder="0"
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-[#f9f9ff] text-[#151c27] focus:border-[#003fb1] focus:ring-1 focus:ring-[#003fb1] outline-none text-sm transition-colors"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-[#003fb1] hover:bg-[#002d85] text-white font-semibold text-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Menyimpan..." : "Simpan Transaksi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
