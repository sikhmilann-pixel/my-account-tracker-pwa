import React from 'react';
import { Sun, Moon, Plus, Minus, IndianRupee } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { computeDashboardMetrics } from '../../utils/calculations';
import { formatINR } from '../../utils/formatters';

export const Header: React.FC = () => {
  const {
    transactions,
    openingBalance,
    theme,
    toggleTheme,
    openAddIncome,
    openAddExpense,
    setActiveTab,
  } = useApp();

  const metrics = computeDashboardMetrics(transactions, openingBalance);
  const isNegative = metrics.accountBalance < 0;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-navy-800/80 bg-white/80 dark:bg-navy-950/80 backdrop-blur-md pt-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition">
            <IndianRupee className="w-5 h-5 font-bold" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              My Account <span className="text-emerald-500">Tracker</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Personal Finance • IST (₹)
            </p>
          </div>
        </div>

        {/* Balance chip & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Balance Preview pill */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className={`hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition ${
              isNegative
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
            }`}
          >
            <span className="text-slate-500 dark:text-slate-400 font-normal">Balance:</span>
            <span>{formatINR(metrics.accountBalance)}</span>
          </div>

          {/* Quick Add buttons on desktop */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={openAddIncome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-bold transition"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Income</span>
            </button>
            <button
              onClick={openAddExpense}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-bold transition"
            >
              <Minus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Expense</span>
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark/light theme"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 transition"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>
        </div>
      </div>
    </header>
  );
};
