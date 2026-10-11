import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { Dashboard } from './components/dashboard/Dashboard';
import { TransactionHistory } from './components/transactions/TransactionHistory';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { TransactionModal } from './components/transactions/TransactionModal';
import { OpeningBalanceModal } from './components/settings/OpeningBalanceModal';
import { Toast } from './components/common/Toast';

const MainLayout: React.FC = () => {
  const { activeTab, isDbReady, initError, retryInit } = useApp();

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-white p-4">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-rose-200 dark:border-rose-900/50 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Database Initialization Error
            </h2>
            <p className="text-xs text-rose-500 font-semibold mt-1.5 p-2 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200/60 dark:border-rose-900/40">
              {initError}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
              The local database encountered an issue during startup. Your existing financial records remain safe and untouched in IndexedDB.
            </p>
          </div>
          <button
            onClick={retryInit}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Loading</span>
          </button>
        </div>
      </div>
    );
  }

  if (!isDbReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-white p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              Starting My Account Tracker...
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Opening local database & syncing transactions
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Header */}
      <Header />

      {/* Main Body with Desktop Sidebar + Main Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-full overflow-x-hidden">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'transactions' && <TransactionHistory />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Central Transaction Modal (Income / Expense / Edit) */}
      <TransactionModal />

      {/* Opening Balance Modal */}
      <OpeningBalanceModal />

      {/* Toast notifications */}
      <Toast />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
