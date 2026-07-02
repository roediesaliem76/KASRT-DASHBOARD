import { collection, getDocs, addDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { Transaction } from "./types";

const DEFAULT_TRANSACTIONS = [
  {
    date: "2024-03-15",
    type: "income",
    category: "Iuran Warga",
    description: "Iuran bulanan Blok A RT 009",
    amount: 1500000,
  },
  {
    date: "2024-03-12",
    type: "expense",
    category: "Operasional",
    description: "Pembayaran Listrik Pos Satpam & Air Fasum",
    amount: 350000,
  },
  {
    date: "2024-03-10",
    type: "expense",
    category: "Kebersihan",
    description: "Gaji Petugas Sampah",
    amount: 800000,
  },
  {
    date: "2024-03-05",
    type: "income",
    category: "Kas Masuk",
    description: "Donasi Perbaikan Taman Tengah",
    amount: 500000,
  },
  {
    date: "2024-02-28",
    type: "income",
    category: "Iuran Warga",
    description: "Iuran bulanan Blok B RT 009",
    amount: 1700000,
  },
  {
    date: "2024-02-25",
    type: "expense",
    category: "Keamanan",
    description: "Gaji Petugas Keamanan Kompleks",
    amount: 1200000,
  },
  {
    date: "2024-02-20",
    type: "expense",
    category: "Kebersihan",
    description: "Perbaikan Tempat Sampah Umum",
    amount: 300000,
  },
  {
    date: "2024-01-15",
    type: "income",
    category: "Iuran Warga",
    description: "Iuran bulanan Blok C RT 009",
    amount: 1800000,
  },
  {
    date: "2024-01-10",
    type: "expense",
    category: "Operasional",
    description: "Konsumsi Rapat Kerja Pengurus RT",
    amount: 250000,
  }
];

export async function seedDefaultTransactions(userId: string) {
  const transactionsRef = collection(db, "transactions");
  let snapshot;
  try {
    snapshot = await getDocs(transactionsRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "transactions");
  }
  
  if (snapshot.empty) {
    console.log("Seeding default transactions for user:", userId);
    for (const tx of DEFAULT_TRANSACTIONS) {
      try {
        await addDoc(transactionsRef, {
          ...tx,
          createdBy: userId,
          createdAt: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, "transactions");
      }
    }
    return true;
  }
  return false;
}
