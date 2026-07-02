export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  createdBy: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: "admin" | "resident";
  createdAt: string;
}

export interface CashflowData {
  month: string;
  income: number;
  expense: number;
}
