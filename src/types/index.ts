export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // in integer paise (e.g. ₹100.50 = 10050 paise)
  sourceOrCategory: string; // Income Source or Expense Category name
  date: string; // YYYY-MM-DD (Asia/Kolkata)
  time: string; // 12-hour AM/PM format, e.g. "10:35 AM"
  timestamp: number; // UTC timestamp in milliseconds for exact ordering
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  isDefault?: boolean;
  color?: string;
  createdAt?: number;
}

export interface IncomeSource {
  id: string;
  name: string;
  isDefault?: boolean;
  color?: string;
  createdAt?: number;
}

export interface AppSettings {
  openingBalance: number; // in integer paise
  theme: 'dark' | 'light';
  currency: 'INR';
  timezone: 'Asia/Kolkata';
}

export type DashboardDateFilter = 'today' | 'this_week' | 'this_month' | 'this_year' | 'all';
export type ReportDateFilter = 'this_month' | 'last_month' | 'this_year' | 'all' | 'custom';

export interface MonthlySummaryItem {
  monthKey: string; // YYYY-MM
  monthLabel: string; // "October 2026"
  openingBalance: number; // in paise
  income: number; // in paise
  expenses: number; // in paise
  closingBalance: number; // in paise
  transactionCount: number;
}

export interface FullBackupData {
  version: number;
  exportDate: string;
  settings: {
    openingBalance: number;
    theme: 'dark' | 'light';
  };
  transactions: Transaction[];
  categories: ExpenseCategory[];
  sources: IncomeSource[];
}
