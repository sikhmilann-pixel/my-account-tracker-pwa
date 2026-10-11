import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initializeDatabase, setOpeningBalance as dbSetOpeningBalance, setThemeSetting as dbSetThemeSetting } from '../db';
import { Transaction, ExpenseCategory, IncomeSource } from '../types';

export type AppTab = 'dashboard' | 'transactions' | 'reports' | 'settings';

interface AppContextType {
  isDbReady: boolean;
  initError: string | null;
  retryInit: () => Promise<void>;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  transactions: Transaction[];
  categories: ExpenseCategory[];
  sources: IncomeSource[];
  openingBalance: number; // in paise
  updateOpeningBalance: (paise: number) => Promise<void>;
  theme: 'dark' | 'light';
  toggleTheme: () => Promise<void>;
  
  // Transaction Modal State
  isTxModalOpen: boolean;
  txModalType: 'income' | 'expense';
  editingTx: Transaction | null;
  openAddIncome: () => void;
  openAddExpense: () => void;
  openEditTx: (tx: Transaction) => void;
  closeTxModal: () => void;

  // Opening Balance Modal State
  isOpeningModalOpen: boolean;
  openOpeningModal: () => void;
  closeOpeningModal: () => void;

  // Toast / notification helper
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDbReady, setIsDbReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  
  // Modal states
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<'income' | 'expense'>('income');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Retry initialization logic
  const retryInit = useCallback(async () => {
    setInitError(null);
    setIsDbReady(false);
    try {
      await initializeDatabase(true);
      setIsDbReady(true);
      setInitError(null);
    } catch (err: any) {
      console.error('Database initialization retry failed:', err);
      setInitError(err?.message || 'Database could not be initialized');
    }
  }, []);

  // Initialize DB on boot
  useEffect(() => {
    let isCancelled = false;

    initializeDatabase()
      .then(() => {
        if (!isCancelled) {
          setIsDbReady(true);
          setInitError(null);
        }
      })
      .catch((err: any) => {
        if (!isCancelled) {
          console.error('Database boot error:', err);
          setInitError(err?.message || 'Failed to initialize database');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Reactive queries via Dexie useLiveQuery with safe default fallbacks
  const liveTransactions = useLiveQuery(
    () => db.transactions.orderBy('timestamp').reverse().toArray(),
    []
  );
  const transactions: Transaction[] = liveTransactions ?? [];

  const liveCategories = useLiveQuery(
    () => db.categories.toArray(),
    []
  );
  const categories: ExpenseCategory[] = liveCategories ?? [];

  const liveSources = useLiveQuery(
    () => db.sources.toArray(),
    []
  );
  const sources: IncomeSource[] = liveSources ?? [];

  const openingBalanceSetting = useLiveQuery(
    () => db.settings.get('opening_balance'),
    []
  );

  const themeSetting = useLiveQuery(
    () => db.settings.get('theme'),
    []
  );

  const openingBalance = typeof openingBalanceSetting?.value === 'number' ? openingBalanceSetting.value : 0;
  const theme: 'dark' | 'light' = themeSetting?.value === 'light' ? 'light' : 'dark';

  // Apply dark mode class to html document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const updateOpeningBalance = async (paise: number) => {
    await dbSetOpeningBalance(paise);
  };

  const toggleTheme = async () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    await dbSetThemeSetting(next);
  };

  const openAddIncome = () => {
    setEditingTx(null);
    setTxModalType('income');
    setIsTxModalOpen(true);
  };

  const openAddExpense = () => {
    setEditingTx(null);
    setTxModalType('expense');
    setIsTxModalOpen(true);
  };

  const openEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setTxModalType(tx.type);
    setIsTxModalOpen(true);
  };

  const closeTxModal = () => {
    setIsTxModalOpen(false);
    setEditingTx(null);
  };

  const openOpeningModal = () => setIsOpeningModalOpen(true);
  const closeOpeningModal = () => setIsOpeningModalOpen(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  return (
    <AppContext.Provider
      value={{
        isDbReady,
        initError,
        retryInit,
        activeTab,
        setActiveTab,
        transactions,
        categories,
        sources,
        openingBalance,
        updateOpeningBalance,
        theme,
        toggleTheme,
        isTxModalOpen,
        txModalType,
        editingTx,
        openAddIncome,
        openAddExpense,
        openEditTx,
        closeTxModal,
        isOpeningModalOpen,
        openOpeningModal,
        closeOpeningModal,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
