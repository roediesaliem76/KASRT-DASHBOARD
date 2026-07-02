import { Transaction } from "../types";
import { ArrowLeft, Printer } from "lucide-react";
import logoBekasi from "../logo_bekasi.svg";

interface PrintReportProps {
  transactions: Transaction[];
  selectedMonth: string; // e.g., "Maret 2024" or "All"
  onClose: () => void;
}

export default function PrintReport({ transactions, selectedMonth, onClose }: PrintReportProps) {
  // Sort transactions by date ascending for official reports
  const sortedTx = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  // Compute totals
  const totalIncome = sortedTx
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = sortedTx
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const currentBalance = totalIncome - totalExpense;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateStr: string) => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
    ];
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const day = parseInt(parts[2]);
      const monthIdx = parseInt(parts[1]) - 1;
      const year = parts[0];
      return `${day} ${months[monthIdx]} ${year}`;
    }
    return dateStr;
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 md:p-8 text-[#151c27] font-sans flex flex-col items-center">
      {/* Action Bar (Hidden on print) */}
      <div className="no-print w-full max-w-[210mm] flex justify-between items-center mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-semibold text-[#003fb1] hover:text-[#002d85] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </button>
        <span className="text-xs text-gray-500 font-medium">
          Format Laporan Siap Cetak (A4)
        </span>
      </div>

      {/* Main Printable Area (Styled to A4 dimensions: 210mm x 297mm) */}
      <div className="print-container bg-white w-full max-w-[210mm] min-h-[297mm] shadow-md border border-gray-200 p-8 md:p-12 flex flex-col">
        {/* Document Header (Kop Surat) */}
        <header className="border-b-4 border-[#003fb1] pb-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white flex items-center justify-center rounded-full border-2 border-[#003fb1] overflow-hidden shrink-0 p-1">
              <img 
                src={logoBekasi} 
                className="w-16 h-16 object-contain" 
                alt="Logo Kota Bekasi" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <h1 className="font-hanken text-2xl font-bold text-[#003fb1] uppercase tracking-tight">
                RUKUN TETANGGA 009 / RW 05
              </h1>
              <p className="font-hanken text-lg font-semibold text-gray-700">
                Kelurahan Jatisari, Kecamatan Jatiasih
              </p>
              <p className="text-xs text-gray-500">
                Perumahan Pondok Indah Jatisari, Jl. Wibawa Mukti 2, Kota Bekasi, Jawa Barat 17426
              </p>
              <p className="text-xs text-gray-400">
                Email: wargapijbekasi@gmail.com | Hubungi: +62 812-9284-6673
              </p>
            </div>
          </div>
        </header>

        {/* Report Title */}
        <div className="text-center mb-8 flex flex-col gap-1.5">
          <h2 className="font-hanken text-xl font-bold uppercase underline underline-offset-4 decoration-2">
            LAPORAN KEUANGAN KAS RT
          </h2>
          <p className="text-sm font-semibold text-gray-600">
            Periode Laporan: {selectedMonth === "All" ? "Semua Bulan" : selectedMonth}
          </p>
        </div>

        {/* Financial Recap Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50/50 p-4 rounded-xl border border-[#cbd5e1] flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Total Saldo Saat Ini
            </span>
            <span className="font-hanken text-lg font-bold text-[#003fb1]">
              {formatRupiah(currentBalance)}
            </span>
          </div>

          <div className="bg-[#e8f5e9]/50 p-4 rounded-xl border border-[#cbd5e1] flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Total Pemasukan
            </span>
            <span className="font-hanken text-lg font-bold text-[#006c49]">
              {formatRupiah(totalIncome)}
            </span>
          </div>

          <div className="bg-[#ffebee]/50 p-4 rounded-xl border border-[#cbd5e1] flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Total Pengeluaran
            </span>
            <span className="font-hanken text-lg font-bold text-[#ba1a1a]">
              {formatRupiah(totalExpense)}
            </span>
          </div>
        </div>

        {/* Transactions list */}
        <div className="flex-grow mb-12">
          <h3 className="font-hanken text-sm font-bold text-gray-800 mb-3 border-b border-[#cbd5e1] pb-1.5 uppercase">
            Rincian Transaksi
          </h3>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase tracking-wider font-semibold">
                <th className="p-3 border-b border-[#cbd5e1] w-28">Tanggal</th>
                <th className="p-3 border-b border-[#cbd5e1] w-36">Kategori</th>
                <th className="p-3 border-b border-[#cbd5e1]">Keterangan</th>
                <th className="p-3 border-b border-[#cbd5e1] text-right w-32">Pemasukan</th>
                <th className="p-3 border-b border-[#cbd5e1] text-right w-32">Pengeluaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#cbd5e1]/50 text-gray-700">
              {sortedTx.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-400">
                    Tidak ada transaksi pada periode ini
                  </td>
                </tr>
              ) : (
                sortedTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="p-3 font-semibold">{tx.category}</td>
                    <td className="p-3 text-gray-500">{tx.description}</td>
                    <td className="p-3 text-right text-[#006c49] font-medium">
                      {tx.type === "income" ? formatRupiah(tx.amount) : "-"}
                    </td>
                    <td className="p-3 text-right text-[#ba1a1a] font-medium">
                      {tx.type === "expense" ? formatRupiah(tx.amount) : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="font-hanken text-xs font-bold bg-gray-50 border-t-2 border-gray-300">
                <td className="p-3 text-right" colSpan={3}>Total:</td>
                <td className="p-3 text-right text-[#006c49]">{formatRupiah(totalIncome)}</td>
                <td className="p-3 text-right text-[#ba1a1a]">{formatRupiah(totalExpense)}</td>
              </tr>
              <tr className="font-hanken text-xs font-bold bg-blue-50/30 border-t border-gray-300">
                <td className="p-3 text-right text-[#003fb1]" colSpan={3}>Saldo Kas Akhir Periode:</td>
                <td className="p-3 text-right text-[#003fb1]" colSpan={2}>{formatRupiah(currentBalance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Signature Box */}
        <div className="mt-auto pt-8 flex justify-between px-10 text-xs">
          <div className="text-center flex flex-col gap-16">
            <p className="text-gray-600">
              Mengetahui,<br />
              <span className="font-bold text-gray-800">Ketua RT 009 / RW 05</span>
            </p>
            <div className="border-b border-[#cbd5e1] w-48 pb-1 mx-auto">
              <p className="font-bold text-gray-800">Bpk. Iwan Abdurachman</p>
            </div>
          </div>

          <div className="text-center flex flex-col gap-16">
            <p className="text-gray-600">
              Dibuat oleh,<br />
              <span className="font-bold text-gray-800">Bendahara RT 009 / RW 05</span>
            </p>
            <div className="border-b border-[#cbd5e1] w-48 pb-1 mx-auto">
              <p className="font-bold text-gray-800">Bpk. Kana Martin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Printable button */}
      <button
        onClick={() => window.print()}
        className="no-print fixed bottom-8 right-8 bg-[#003fb1] hover:bg-[#002d85] text-white text-sm font-semibold px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-colors cursor-pointer"
      >
        <Printer className="w-5 h-5" />
        Cetak Laporan (PDF)
      </button>
    </div>
  );
}
