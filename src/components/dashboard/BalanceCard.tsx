import React from 'react';
import {
  IndianRupee,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
  Edit3,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/formatters';

interface BalanceCardProps {
  accountBalance: number; // in paise
  openingBalance: number; // in paise
  totalIncome: number; // in paise
  totalExpenses: number; // in paise
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  accountBalance,
  openingBalance,
  totalIncome,
  totalExpenses,
}) => {
  const { openAddIncome, openAddExpense, openOpeningModal } = useApp();
  const isNegative = accountBalance < 0;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 transition-all duration-300 shadow-xl ${
        isNegative
          ? 'bg-gradient-to-br from-rose-950 via-slate-900 to-rose-900 border-2 border-rose-500/50 shadow-glow-red text-white'
          : 'bg-gradient-to-br from-slate-900 via-navy-900 to-slate-950 border border-slate-800 dark:border-navy-700 shadow-card-dark text-white'
      }`}
    >
      {/* Decorative ambient glowing circles */}
      <div
        className={`absolute -right-16 -top-16 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isNegative ? 'bg-rose-500' : 'bg-emerald-500'
        }`}
      />
      <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-20 bg-blue-500" />

      {/* Negative Balance Alert Banner */}
      {isNegative && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs sm:text-sm font-semibold mb-6 animate-pulse">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
          <span>
            <strong>Warning: Negative Balance!</strong> Your total expenses exceed available funds by{' '}
            {formatINR(Math.abs(accountBalance))}.
          </span>
        </div>
      )}

      {/* Header Row: Label & Opening Balance Pill */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Account Balance
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800/80 border border-slate-700 text-emerald-400">
            Live
          </span>
        </div>

        {/* Opening Balance Pill / Edit Button */}
        <button
          onClick={openOpeningModal}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 transition"
          title="Click to edit opening balance"
        >
          <span>Opening: {formatINR(openingBalance)}</span>
          <Edit3 className="w-3 h-3 text-slate-400 hover:text-white" />
        </button>
      </div>

      {/* Big Hero Number: Current Account Balance */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span
            className={`text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight ${
              isNegative ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {formatINR(accountBalance)}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Formula: Opening ({formatINR(openingBalance)}) + Income ({formatINR(totalIncome)}) − Expenses ({formatINR(totalExpenses)})
        </p>
      </div>

      {/* Two Highly Visible Main Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
        <button
          onClick={openAddIncome}
          className="flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-base shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 active:scale-[0.98] transition"
        >
          <PlusCircle className="w-5 h-5 stroke-[2.5]" />
          <span>+ Add Income</span>
        </button>

        <button
          onClick={openAddExpense}
          className="flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-base shadow-lg shadow-rose-600/30 hover:shadow-rose-600/40 active:scale-[0.98] transition"
        >
          <MinusCircle className="w-5 h-5 stroke-[2.5]" />
          <span>− Add Expense</span>
        </button>
      </div>
    </div>
  );
};
