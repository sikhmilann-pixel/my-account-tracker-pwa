import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  Settings,
  PlusCircle,
  MinusCircle,
  Coins,
} from 'lucide-react';
import { useApp, AppTab } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    openAddIncome,
    openAddExpense,
    openOpeningModal,
  } = useApp();

  const navItems: { tab: AppTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { tab: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { tab: 'transactions', label: 'Transaction History', icon: ReceiptText },
    { tab: 'reports', label: 'Reports & Analytics', icon: PieChart },
    { tab: 'settings', label: 'Settings & Backup', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200/80 dark:border-navy-800/80 bg-white/50 dark:bg-navy-900/50 backdrop-blur-md p-5 shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Navigation Links */}
      <div className="space-y-1.5 mb-8">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Action Buttons */}
      <div className="space-y-3 mb-8">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
          Quick Actions
        </p>
        <button
          onClick={openAddIncome}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Income</span>
        </button>
        <button
          onClick={openAddExpense}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-md shadow-rose-600/20 transition active:scale-[0.98]"
        >
          <MinusCircle className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Quick Setup Card */}
      <div className="mt-auto p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/80 border border-slate-200/80 dark:border-navy-700/80">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 text-xs font-bold mb-1.5">
          <Coins className="w-4 h-4 text-amber-500" />
          <span>Account Setup</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
          Set or update opening balance directly.
        </p>
        <button
          onClick={openOpeningModal}
          className="w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-white dark:bg-navy-700 hover:bg-slate-100 dark:hover:bg-navy-600 border border-slate-200 dark:border-navy-600 text-slate-700 dark:text-slate-200 transition"
        >
          Edit Opening Balance
        </button>
      </div>
    </aside>
  );
};
