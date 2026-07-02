import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { Transaction, CashflowData } from "../types";
import { seedDefaultTransactions } from "../dbSeed";
import logoBekasi from "../logo_bekasi.svg";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  Plus, LayoutDashboard, LogOut, TrendingUp, ArrowDownCircle, ArrowUpCircle, 
  Wallet, FileText, Bell, HelpCircle, Trash2, Calendar, FileUp, Filter, Search, ShieldCheck
} from "lucide-react";
import TransactionModal from "./TransactionModal";
import UploadModal from "./UploadModal";

interface DashboardProps {
  onPrint: (transactions: Transaction[], month: string) => void;
}

export default function Dashboard({ onPrint }: DashboardProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("Maret 2024");
  const [activeTab, setActiveTab] = useState<"overview" | "income" | "expense" | "settings">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [viewAllTx, setViewAllTx] = useState(false);
  
  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null);

  // Read current user profile
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserProfile({
        name: user.displayName || "Pengurus RT 009",
        email: user.email || "admin@jatisari.rt009.id",
      });
      
      // Seed default data if completely empty
      seedDefaultTransactions(user.uid).then((seeded) => {
        if (seeded) {
          fetchTransactions();
        }
      });
    }
  }, []);

  // Listen for real-time transaction updates from Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    const q = query(collection(db, "transactions"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txList: Transaction[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        txList.push({
          id: doc.id,
          ...data
        } as Transaction);
      });
      setTransactions(txList);
      setLoading(false);
    }, (error) => {
      console.error("Error reading real-time transactions:", error);
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, "transactions");
    });

    return () => unsubscribe();
  }, []);

  const fetchTransactions = async () => {
    // Falls back or updates local state
    const user = auth.currentUser;
    if (!user) return;
    try {
      const q = query(collection(db, "transactions"));
      const snapshot = await getDocs(q);
      const txList: Transaction[] = [];
      snapshot.forEach((doc) => {
        txList.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setTransactions(txList);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.LIST, "transactions");
    }
  };

  // Process filtering
  useEffect(() => {
    let result = [...transactions];

    // Filter by active category tab (Income / Expense / All)
    if (activeTab === "income") {
      result = result.filter(t => t.type === "income");
    } else if (activeTab === "expense") {
      result = result.filter(t => t.type === "expense");
    }

    // Filter by selected month
    if (selectedMonth !== "Semua") {
      result = result.filter(t => {
        // Date format: YYYY-MM-DD
        const monthNames = [
          "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
          "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];
        const dateParts = t.date.split("-");
        if (dateParts.length === 3) {
          const monthIdx = parseInt(dateParts[1]) - 1;
          const year = dateParts[0];
          const txMonthName = `${monthNames[monthIdx]} ${year}`;
          return txMonthName === selectedMonth;
        }
        return false;
      });
    }

    // Filter by search bar
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.description.toLowerCase().includes(term) || 
        t.category.toLowerCase().includes(term)
      );
    }

    // Filter by category select dropdown
    if (categoryFilter !== "All") {
      result = result.filter(t => t.category === categoryFilter);
    }

    // Sort by date descending
    result.sort((a, b) => b.date.localeCompare(a.date));

    setFilteredTransactions(result);
  }, [transactions, selectedMonth, activeTab, searchTerm, categoryFilter]);

  // Calculations
  const totalBalance = transactions
    .reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0);

  const selectedMonthIncome = filteredTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const selectedMonthExpense = filteredTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Generate unique months for selection dropdown/tabs from transactions
  const uniqueMonths: string[] = ["Semua"];
  transactions.forEach(t => {
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Des"
    ];
    const dateParts = t.date.split("-");
    if (dateParts.length === 3) {
      const monthIdx = parseInt(dateParts[1]) - 1;
      const year = dateParts[0];
      const mName = `${monthNames[monthIdx]} ${year}`;
      if (!uniqueMonths.includes(mName)) {
        uniqueMonths.push(mName);
      }
    }
  });

  // Unique categories for filtering
  const uniqueCategories: string[] = [];
  transactions.forEach(t => {
    if (!uniqueCategories.includes(t.category)) {
      uniqueCategories.push(t.category);
    }
  });

  // Format charting data (last 3 available months or hardcoded Q1 2024 for visual parity)
  const getChartData = (): CashflowData[] => {
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Des"];
    return months.map(m => {
      const monthTx = transactions.filter(t => {
        const dateParts = t.date.split("-");
        if (dateParts.length === 3) {
          const mIdx = parseInt(dateParts[1]) - 1;
          const monthNames = [
            "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
            "Jul", "Aug", "Sep", "Okt", "Nov", "Des"
          ];
          return monthNames[mIdx] === m && dateParts[0] === "2026";
        }
        return false;
      });

      const income = monthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expense = monthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

      return {
        month: m,
        income,
        expense
      };
    });
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus catatan transaksi ini?")) return;
    try {
      await deleteDoc(doc(db, "transactions", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `transactions/${id}`);
    }
  };

  const handleLogout = () => {
    auth.signOut();
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDateString = (dateStr: string) => {
    const monthNamesShort = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
      "Jul", "Aug", "Sep", "Okt", "Nov", "Des"
    ];
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const day = parseInt(parts[2]);
      const monthIdx = parseInt(parts[1]) - 1;
      const year = parts[0];
      return `${day} ${monthNamesShort[monthIdx]} ${year}`;
    }
    return dateStr;
  };

  const activeTxList = viewAllTx ? filteredTransactions : filteredTransactions.slice(0, 5);

  return (
    <div className="bg-[#f9f9ff] text-[#151c27] font-sans min-h-screen flex flex-col">
      
      {/* Top Navigation Bar */}
      <header className="hidden md:flex sticky top-0 z-40 justify-between items-center w-full px-6 py-4 bg-white shadow-sm border-b border-[#e5e7eb]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white flex items-center justify-center rounded-xl border border-gray-100 shadow-xs">
            <img 
              src={logoBekasi} 
              className="w-8 h-8 object-contain" 
              alt="Logo Kota Bekasi" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="font-hanken text-lg font-bold text-[#003fb1] tracking-tight">KAS RT 009/05</div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">KELURAHAN JATISARI</span>
          </div>
        </div>

        {/* Month Selector Tabs */}
        <nav className="flex bg-gray-50 p-1 rounded-xl border border-[#cbd5e1]/40">
          {uniqueMonths.slice(0, 4).map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedMonth === m 
                  ? "bg-white text-[#003fb1] shadow-sm font-bold" 
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {m}
            </button>
          ))}
          {uniqueMonths.length > 4 && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-500 border-none outline-none pr-3 cursor-pointer pl-2 focus:ring-0"
            >
              <option value="" disabled>Lainnya</option>
              {uniqueMonths.slice(4).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}
        </nav>

        {/* Right tools */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onPrint(filteredTransactions, selectedMonth)}
            className="bg-[#003fb1] hover:bg-[#002d85] text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            Cetak PDF
          </button>
          <div className="flex gap-1 text-gray-400 border-l border-r border-[#cbd5e1]/50 px-3">
            <button className="p-1.5 hover:text-[#003fb1] transition-colors cursor-pointer relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-1.5 hover:text-[#003fb1] transition-colors cursor-pointer">
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#003fb1] font-bold text-sm">
              {userProfile?.name[0].toUpperCase()}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-gray-800 leading-tight">{userProfile?.name}</p>
              <p className="text-[10px] text-gray-400">{userProfile?.email}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Workspace container */}
      <div className="flex flex-1">
        
        {/* Sidebar Navigation */}
        <aside className="hidden md:flex flex-col h-[calc(100vh-73px)] w-64 bg-white border-r border-[#cbd5e1]/50 p-4 gap-2 sticky top-[73px]">
          <div className="px-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-gray-100 p-0.5">
                <img 
                  src={logoBekasi} 
                  className="w-6 h-6 object-contain" 
                  alt="Logo Kota Bekasi" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h2 className="font-hanken text-sm font-bold text-gray-800">RT 009 Dashboard</h2>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Keuangan Warga</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 flex flex-col gap-1">
            <button
              onClick={() => { setActiveTab("overview"); setCategoryFilter("All"); }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "overview" 
                  ? "bg-blue-50 text-[#003fb1] font-bold" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Overview Kas
            </button>

            <button
              onClick={() => { setActiveTab("income"); setCategoryFilter("All"); }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "income" 
                  ? "bg-[#7ef6be]/10 text-[#006c49] font-bold" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              <ArrowDownCircle className="w-4 h-4 text-[#006c49]" />
              Pemasukan
            </button>

            <button
              onClick={() => { setActiveTab("expense"); setCategoryFilter("All"); }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "expense" 
                  ? "bg-red-50 text-[#ba1a1a] font-bold" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              <ArrowUpCircle className="w-4 h-4 text-[#ba1a1a]" />
              Pengeluaran
            </button>
          </nav>

          <div className="mt-auto flex flex-col gap-2">
            <button 
              onClick={() => setIsTxModalOpen(true)}
              className="w-full bg-[#003fb1] hover:bg-[#002d85] text-white py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Transaksi
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-500 hover:bg-red-50 hover:text-[#ba1a1a] rounded-lg text-xs font-semibold transition-all cursor-pointer border border-[#cbd5e1]/10"
            >
              <LogOut className="w-4 h-4" />
              Logout Sistem
            </button>
          </div>
        </aside>

        {/* Main Dashboard Panel */}
        <main className="flex-1 p-6 overflow-x-hidden">
          
          {/* Header Title Mobile / Info */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-hanken text-2xl font-bold text-[#151c27]">Laporan Keuangan RT 009/05</h1>
              <p className="text-xs text-gray-500">
                Pencatatan kas kasir digital Kelurahan Jatisari — Periode: <strong className="text-gray-700">{selectedMonth}</strong>
              </p>
            </div>
            {/* Print/Actions in mobile view */}
            <div className="flex gap-2 md:hidden">
              <button 
                onClick={() => setIsTxModalOpen(true)}
                className="flex-1 bg-[#003fb1] text-white py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Transaksi
              </button>
              <button 
                onClick={() => onPrint(filteredTransactions, selectedMonth)}
                className="flex-1 border border-gray-300 py-2 px-3 rounded-lg text-xs font-semibold text-gray-700 flex items-center justify-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>

          {/* Bento-style overview counters */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-6">
            
            {/* Saldo Kas Utama */}
            <div className="md:col-span-6 bg-white border border-[#cbd5e1]/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <Wallet className="w-5 h-5 text-[#003fb1]" />
                  <span className="text-xs font-bold uppercase tracking-wider">Saldo Total Kas</span>
                </div>
                <span className="text-[10px] font-bold text-gray-400">Kumulatif</span>
              </div>
              <div>
                <div className="font-hanken text-3xl font-extrabold text-[#151c27]">
                  {formatRupiah(totalBalance)}
                </div>
                <div className="text-[#006c49] text-xs font-semibold flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4" /> +4.8% dari triwulan sebelumnya
                </div>
              </div>
            </div>

            {/* Pemasukan Bulan Berjalan */}
            <div className="md:col-span-3 bg-white border border-[#cbd5e1]/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 text-gray-500 mb-3">
                <ArrowDownCircle className="w-5 h-5 text-[#006c49]" />
                <span className="text-xs font-bold uppercase tracking-wider">Pemasukan</span>
              </div>
              <div>
                <div className="font-hanken text-xl font-bold text-[#151c27]">
                  {formatRupiah(selectedMonthIncome)}
                </div>
                <span className="text-[10px] text-gray-400 font-semibold">Periode terpilih</span>
              </div>
            </div>

            {/* Pengeluaran Bulan Berjalan */}
            <div className="md:col-span-3 bg-white border border-[#cbd5e1]/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 text-gray-500 mb-3">
                <ArrowUpCircle className="w-5 h-5 text-[#ba1a1a]" />
                <span className="text-xs font-bold uppercase tracking-wider">Pengeluaran</span>
              </div>
              <div>
                <div className="font-hanken text-xl font-bold text-[#151c27]">
                  {formatRupiah(selectedMonthExpense)}
                </div>
                <span className="text-[10px] text-gray-400 font-semibold">Periode terpilih</span>
              </div>
            </div>
          </div>

          {/* Middle: Chart + Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
            
            {/* Chart Column */}
            <div className="md:col-span-8 bg-white border border-[#cbd5e1]/50 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-hanken text-sm font-bold text-gray-800">Perbandingan Arus Kas (Q1 2024)</h3>
                <span className="text-[10px] text-gray-400 font-bold">Rupiah (IDR)</span>
              </div>
              <div className="h-64 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getChartData()}
                    margin={{ top: 10, right: 10, left: 15, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1/40" />
                    <XAxis dataKey="month" stroke="#4a5568" />
                    <YAxis 
                      stroke="#4a5568" 
                      tickFormatter={(value) => `Rp ${value / 1000000}Jt`} 
                    />
                    <Tooltip 
                      formatter={(value: any) => [formatRupiah(Number(value)), "Total"]} 
                      contentStyle={{ background: "#151c27", color: "#fff", borderRadius: "8px" }}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Pemasukan" fill="#006c49" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Pengeluaran" fill="#ba1a1a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Actions Card Column */}
            <div className="md:col-span-4 flex flex-col gap-4">
              
              <div className="bg-white border border-[#cbd5e1]/50 rounded-2xl p-5 shadow-sm flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-hanken text-sm font-bold text-[#151c27] mb-1">Status Transaksi</h3>
                  <p className="text-xs text-gray-400 mb-4">Ringkasan kuantitas</p>
                </div>
                <div className="text-center bg-[#f9f9ff] py-6 rounded-xl border border-dashed border-[#cbd5e1]">
                  <p className="text-3xl font-extrabold text-[#003fb1] font-hanken">
                    {filteredTransactions.length}
                  </p>
                  <p className="text-[11px] text-gray-500 font-medium mt-1 uppercase tracking-wider">
                    Catatan Transaksi Terfilter
                  </p>
                </div>
              </div>

              {/* Aksi Cepat */}
              <div className="bg-blue-50/70 rounded-2xl p-5 border border-blue-100 flex-1 flex flex-col justify-center">
                <h4 className="font-hanken text-sm font-bold text-[#003fb1] mb-2.5">Aksi Cepat</h4>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => setIsUploadModalOpen(true)}
                    className="w-full bg-white text-gray-700 font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 border border-gray-200 shadow-xs cursor-pointer transition-colors"
                  >
                    <FileUp className="w-4 h-4 text-[#003fb1]" />
                    Unggah Data Massal
                  </button>
                  <button 
                    onClick={() => onPrint(filteredTransactions, selectedMonth)}
                    className="w-full bg-white text-gray-700 font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 border border-gray-200 shadow-xs cursor-pointer transition-colors"
                  >
                    <FileText className="w-4 h-4 text-[#006c49]" />
                    Ekspor Laporan PDF
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Transactions History panel */}
          <div className="bg-white border border-[#cbd5e1]/50 rounded-2xl shadow-sm overflow-hidden">
            
            {/* Table actions bar */}
            <div className="p-5 border-b border-[#cbd5e1]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
              <h3 className="font-hanken text-sm font-bold text-[#151c27]">Riwayat Transaksi Terkini</h3>
              
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Search field */}
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Cari deskripsi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-[#151c27] focus:outline-none focus:border-[#003fb1]"
                  />
                </div>

                {/* Dropdown Category select */}
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="pl-3 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none appearance-none outline-none"
                  >
                    <option value="All">Semua Kategori</option>
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Print current button */}
                <button
                  onClick={() => onPrint(filteredTransactions, selectedMonth)}
                  className="p-1.5 hover:text-[#003fb1] transition-colors border border-gray-200 rounded-lg bg-white"
                  title="Ekspor list ini"
                >
                  <FileText className="w-3.5 h-3.5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Table data */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-[#cbd5e1]/40 text-gray-500 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Tanggal</th>
                    <th className="px-5 py-3.5">Kategori</th>
                    <th className="px-5 py-3.5">Deskripsi</th>
                    <th className="px-5 py-3.5">Tipe</th>
                    <th className="px-5 py-3.5 text-right">Nominal</th>
                    <th className="px-5 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#cbd5e1]/30 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-gray-400 font-medium">
                        Sedang mengambil data transaksi...
                      </td>
                    </tr>
                  ) : activeTxList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-gray-400 font-medium">
                        Tidak ada catatan transaksi ditemukan.
                      </td>
                    </tr>
                  ) : (
                    activeTxList.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4 font-semibold text-gray-700 whitespace-nowrap">
                          {formatDateString(tx.date)}
                        </td>
                        <td className="px-5 py-4 font-bold text-[#151c27] whitespace-nowrap">
                          {tx.category}
                        </td>
                        <td className="px-5 py-4 text-gray-500">
                          {tx.description}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 inline-flex text-[10px] leading-5 font-bold rounded-full ${
                            tx.type === "income" 
                              ? "bg-[#7ef6be]/20 text-[#00714c]" 
                              : "bg-red-50 text-[#ba1a1a]"
                          }`}>
                            {tx.type === "income" ? "Pemasukan" : "Pengeluaran"}
                          </span>
                        </td>
                        <td className={`px-5 py-4 whitespace-nowrap text-right font-extrabold ${
                          tx.type === "income" ? "text-[#006c49]" : "text-[#ba1a1a]"
                        }`}>
                          {tx.type === "income" ? "" : "- "}{formatRupiah(tx.amount)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="p-1 hover:text-[#ba1a1a] text-gray-300 transition-colors cursor-pointer"
                            title="Hapus catatan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer / View All toggle */}
            {filteredTransactions.length > 5 && (
              <div className="p-4 border-t border-[#cbd5e1]/40 text-center">
                <button
                  onClick={() => setViewAllTx(!viewAllTx)}
                  className="text-xs font-bold text-[#003fb1] hover:text-[#002d85] cursor-pointer"
                >
                  {viewAllTx ? "Sembunyikan Sebagian" : `Lihat Semua (${filteredTransactions.length} Transaksi)`}
                </button>
              </div>
            )}
          </div>

        </main>
      </div>

      {/* MODALS */}
      <TransactionModal 
        isOpen={isTxModalOpen} 
        onClose={() => setIsTxModalOpen(false)} 
        onSuccess={fetchTransactions} 
      />

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onSuccess={fetchTransactions} 
      />

    </div>
  );
}
