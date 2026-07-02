import React, { useState, useRef } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { X, Upload, Download, CheckCircle, AlertTriangle } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle drag over/enter/leave
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError("");

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const isCSV = selectedFile.name.endsWith(".csv");
    const isExcel = selectedFile.name.endsWith(".xlsx");
    
    if (!isCSV && !isExcel) {
      setError("Format file tidak didukung. Harap unggah file .csv atau .xlsx saja.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Ukuran file melebihi batas 5MB.");
      return;
    }

    setFile(selectedFile);
  };

  const downloadCSVTemplate = () => {
    const headers = "tanggal,tipe,kategori,deskripsi,nominal\n";
    const row1 = "2024-03-18,income,Iuran Warga,Iuran bulanan Blok C-10,150000\n";
    const row2 = "2024-03-19,expense,Operasional,Minyak Solar Genset RT,75000\n";
    const row3 = "2024-03-20,income,Kas Masuk,Sumbangan Kegiatan Baksos,500000\n";
    
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + row1 + row2 + row3);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "template_transaksi_rt.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcessUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setStatus("Membaca file...");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Pengguna tidak terautentikasi.");

      // Read file content
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          if (!text) {
            throw new Error("Gagal membaca isi file.");
          }

          const lines = text.split(/\r?\n/);
          if (lines.length <= 1) {
            throw new Error("File kosong atau hanya berisi header.");
          }

          // Parse CSV
          const headers = lines[0].toLowerCase().split(",");
          const dateIdx = headers.indexOf("tanggal");
          const typeIdx = headers.indexOf("tipe");
          const categoryIdx = headers.indexOf("kategori");
          const descIdx = headers.indexOf("deskripsi");
          const amountIdx = headers.indexOf("nominal");

          if (dateIdx === -1 || typeIdx === -1 || categoryIdx === -1 || descIdx === -1 || amountIdx === -1) {
            throw new Error("Header kolom tidak cocok. Gunakan template resmi (tanggal, tipe, kategori, deskripsi, nominal).");
          }

          let addedCount = 0;
          const transactionsRef = collection(db, "transactions");

          setStatus("Sedang mengunggah data...");

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cells = line.split(",");
            if (cells.length < headers.length) continue;

            const date = cells[dateIdx].trim();
            const typeStr = cells[typeIdx].trim().toLowerCase();
            const category = cells[categoryIdx].trim();
            const description = cells[descIdx].trim();
            const amountVal = parseFloat(cells[amountIdx].trim());

            // Simple validation
            if (!date || !typeStr || !category || !description || isNaN(amountVal)) {
              continue;
            }

            const type = typeStr === "expense" || typeStr === "pengeluaran" ? "expense" : "income";

            try {
              await addDoc(transactionsRef, {
                date,
                type,
                category,
                description,
                amount: amountVal,
                createdBy: user.uid,
                createdAt: new Date().toISOString()
              });
            } catch (err: any) {
              handleFirestoreError(err, OperationType.CREATE, "transactions");
            }

            addedCount++;
          }

          setStatus(`Sukses mengunggah ${addedCount} transaksi!`);
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);

        } catch (err: any) {
          console.error(err);
          setError(err.message || "Gagal memproses baris file CSV.");
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError("Gagal membaca file.");
        setLoading(false);
      };

      reader.readAsText(file);

    } catch (err: any) {
      console.error(err);
      setError("Gagal memproses unggahan: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col border border-gray-100">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-hanken text-lg font-bold text-[#151c27]">Upload Data Transaksi</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5">
          <p className="text-xs text-gray-500 font-medium">
            Unggah file Excel (.xlsx atau .csv) untuk mengimpor data transaksi pemasukan dan pengeluaran secara massal ke kas RT 009/05.
          </p>

          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-gray-50/50 hover:bg-gray-100/50 transition-colors cursor-pointer text-center ${
              dragActive ? "border-[#003fb1] bg-blue-50/30" : "border-gray-200"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
            />
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#003fb1]">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#151c27]">
                {file ? file.name : "Tarik dan lepas file di sini atau klik untuk memilih file"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {file ? `${(file.size / 1024).toFixed(1)} KB` : "Maksimal ukuran file 5MB"}
              </p>
            </div>
          </div>

          {/* Download Template Link */}
          <button
            type="button"
            onClick={downloadCSVTemplate}
            className="flex items-center gap-2 text-xs font-semibold text-[#003fb1] hover:text-[#002d85] transition-colors self-start cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Unduh Template CSV Transaksi
          </button>

          {/* Status / Error Displays */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-[#ba1a1a] text-xs rounded-lg flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {status && !error && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-[#003fb1] text-xs rounded-lg flex items-center gap-2 font-semibold">
              <CheckCircle className="w-4 h-4 shrink-0 animate-pulse" />
              <span>{status}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!file || loading}
              onClick={handleProcessUpload}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm text-white transition-all ${
                file && !loading
                  ? "bg-[#003fb1] hover:bg-[#002d85] cursor-pointer"
                  : "bg-gray-300 opacity-70 cursor-not-allowed"
              }`}
            >
              {loading ? "Memproses..." : "Proses Unggahan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
