import React, { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import PrintReport from "./components/PrintReport";
import { Transaction } from "./types";
import { Loader2 } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Print flow states
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [printTransactions, setPrintTransactions] = useState<Transaction[]>([]);
  const [printMonth, setPrintMonth] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleTriggerPrint = (txs: Transaction[], month: string) => {
    setPrintTransactions(txs);
    setPrintMonth(month);
    setIsPrintMode(true);
  };

  const handleClosePrint = () => {
    setIsPrintMode(false);
    setPrintTransactions([]);
    setPrintMonth("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center flex-col gap-3">
        <Loader2 className="w-8 h-8 text-[#003fb1] animate-spin" />
        <span className="text-xs text-gray-400 font-semibold tracking-wider uppercase">Loading RT Financial System...</span>
      </div>
    );
  }

  // Auth Guard
  if (!user) {
    return <Auth />;
  }

  // Render printable PDF layout if triggered
  if (isPrintMode) {
    return (
      <PrintReport 
        transactions={printTransactions} 
        selectedMonth={printMonth} 
        onClose={handleClosePrint} 
      />
    );
  }

  // Standard Dashboard
  return <Dashboard onPrint={handleTriggerPrint} />;
}
