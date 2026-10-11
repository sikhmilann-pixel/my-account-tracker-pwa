import React, { useState } from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  Plus,
  PieChart,
  Settings,
  PlusCircle,
  MinusCircle,
  X,
} from 'lucide-react';
import { useApp, AppTab } from '../../context/AppContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, openAddIncome, openAddExpense } = useApp();
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const handleOpenIncome = () => {
    setIsAddMenuOpen(false);
    openAddIncome();
  };

  const handleOpenExpense = () => {
    setIsAddMenuOpen(false);
    openAddExpense();
  };

  return (
    <>
      {/* Quick Add Bottom Sheet / Overlay on Mobile */}
      {isAddMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col justify-end p-4 pb-24 animate-fadeIn">
          <div className="fixed inset-0" onClick={() => setIsAddMenuOpen(false)} />
          <div className="relative bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-3xl p-5 shadow-2xl space-y-3 z-10 animate-slideUp">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-navy-800">
              <span className="text-sm font-bold text-slate-800 dark:text-white">Record Transaction</span>
              <button
                onClick={() => setIsAddMenuOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleOpenIncome}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 active:scale-95 transition"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-2 shadow-md shadow-emerald-500/30">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold">+ Add Income</span>
                <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">Money received</span>
              </button>

              <button
                onClick={handleOpenExpense}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-400 active:scale-95 transition"
              >
                <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center mb-2 shadow-md shadow-rose-500/30">
                  <MinusCircle className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold">− Add Expense</span>
                <span className="text-[11px] text-rose-600/80 dark:text-rose-400/70 mt-0.5">Money spent</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 dark:border-navy-800 bg-white/95 dark:bg-navy-950/95 backdrop-blur-lg pb-safe">
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {/* 1. Home */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center h-full transition ${
              activeTab === 'dashboard'
                ? 'text-emerald-500 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Home</span>
          </button>

          {/* 2. History */}
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex flex-col items-center justify-center h-full transition ${
              activeTab === 'transactions'
                ? 'text-emerald-500 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ReceiptText className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">History</span>
          </button>

          {/* 3. Center Add Button */}
          <div className="flex items-center justify-center -mt-5">
            <button
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 hover:scale-105 active:scale-95 transition"
              aria-label="Add transaction"
            >
              <Plus className={`w-6 h-6 transition-transform ${isAddMenuOpen ? 'rotate-45' : ''}`} />
            </button>
          </div>

          {/* 4. Reports */}
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center justify-center h-full transition ${
              activeTab === 'reports'
                ? 'text-emerald-500 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <PieChart className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Reports</span>
          </button>

          {/* 5. Settings */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center h-full transition ${
              activeTab === 'settings'
                ? 'text-emerald-500 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Settings className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Settings</span>
          </button>
        </div>
      </nav>
    </>
  );
};
