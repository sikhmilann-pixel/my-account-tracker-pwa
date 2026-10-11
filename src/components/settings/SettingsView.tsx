import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Coins,
  Globe,
  Sun,
  Moon,
  Database,
  Download,
  Upload,
  Trash2,
  Plus,
  Edit2,
  ShieldAlert,
  HelpCircle,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db, renameCategoryOrSource, deleteCategoryOrSource } from '../../db';
import { formatINR } from '../../utils/formatters';
import { generateFullBackupJSON, validateBackupJSON, restoreFromBackup } from '../../utils/backup';
import { exportTransactionsToCSV, downloadFile } from '../../utils/csv';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Modal } from '../common/Modal';

export const SettingsView: React.FC = () => {
  const {
    openingBalance,
    openOpeningModal,
    theme,
    toggleTheme,
    categories,
    sources,
    transactions,
    showToast,
  } = useApp();

  // Category / Source management state
  const [activeManagerTab, setActiveManagerTab] = useState<'categories' | 'sources'>('categories');
  const [newCatName, setNewCatName] = useState('');
  const [newSrcName, setNewSrcName] = useState('');
  
  // Rename state
  const [itemToRename, setItemToRename] = useState<{ name: string; type: 'expense' | 'income' } | null>(null);
  const [renameInput, setRenameInput] = useState('');

  // Delete state
  const [itemToDelete, setItemToDelete] = useState<{ name: string; type: 'expense' | 'income' } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // JSON Restore state
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [backupPayload, setBackupPayload] = useState<any | null>(null);
  const [backupStats, setBackupStats] = useState<any | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // Clear all data state
  const [isClearDataOpen, setIsClearDataOpen] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');

  // Add category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    try {
      await db.categories.add({
        id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: trimmed,
        isDefault: false,
        createdAt: Date.now(),
      });
      setNewCatName('');
      showToast(`Category "${trimmed}" added`);
    } catch (err: any) {
      showToast(`Failed: ${err.message || 'Category already exists'}`);
    }
  };

  // Add source
  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSrcName.trim();
    if (!trimmed) return;
    try {
      await db.sources.add({
        id: `src_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: trimmed,
        isDefault: false,
        createdAt: Date.now(),
      });
      setNewSrcName('');
      showToast(`Income source "${trimmed}" added`);
    } catch (err: any) {
      showToast(`Failed: ${err.message || 'Source already exists'}`);
    }
  };

  // Submit rename
  const handleConfirmRename = async () => {
    if (!itemToRename) return;
    const trimmed = renameInput.trim();
    if (!trimmed || trimmed === itemToRename.name) {
      setItemToRename(null);
      return;
    }
    try {
      await renameCategoryOrSource(itemToRename.name, trimmed, itemToRename.type);
      showToast(`Renamed to "${trimmed}"`);
      setItemToRename(null);
    } catch (err: any) {
      showToast(`Error renaming: ${err.message}`);
    }
  };

  // Submit delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const res = await deleteCategoryOrSource(itemToDelete.name, itemToDelete.type);
    if (!res.success) {
      setDeleteError(res.message || 'Cannot delete item');
    } else {
      showToast(`Deleted "${itemToDelete.name}"`);
      setItemToDelete(null);
      setDeleteError(null);
    }
  };

  // Export JSON Full Backup
  const handleExportJson = async () => {
    try {
      const jsonStr = await generateFullBackupJSON();
      const dateTag = new Date().toISOString().slice(0, 10);
      downloadFile(
        jsonStr,
        `my_account_tracker_full_backup_${dateTag}.json`,
        'application/json;charset=utf-8;'
      );
      showToast('Full JSON backup downloaded');
    } catch (err: any) {
      showToast(`Backup error: ${err.message}`);
    }
  };

  // Handle JSON Restore File Selection
  const handleRestoreFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const validation = validateBackupJSON(content);
        if (!validation.isValid) {
          setRestoreError(validation.error || 'Invalid backup file structure');
          setBackupPayload(null);
          setBackupStats(null);
        } else {
          setBackupPayload(validation.payload);
          setBackupStats(validation.stats);
        }
      } catch (err: any) {
        setRestoreError(`Failed to parse file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Execute JSON Restore
  const handleExecuteRestore = async () => {
    if (!backupPayload) return;
    try {
      await restoreFromBackup(backupPayload);
      showToast('All data successfully restored from backup!');
      setIsRestoreModalOpen(false);
      setBackupPayload(null);
      setBackupStats(null);
    } catch (err: any) {
      setRestoreError(`Restore failed: ${err.message}`);
    }
  };

  // Clear All Data
  const handleClearAllData = async () => {
    if (clearConfirmText !== 'CLEAR') return;
    await db.transaction('rw', db.transactions, db.settings, async () => {
      await db.transactions.clear();
      await db.settings.put({ key: 'opening_balance', value: 0 });
    });
    showToast('All transaction records have been reset');
    setIsClearDataOpen(false);
    setClearConfirmText('');
  };

  // Optional Sample Data Loader
  const handleLoadSampleData = async () => {
    const sampleTxs = [
      {
        id: `sample_1_${Date.now()}`,
        type: 'income' as const,
        amount: 1000000, // ₹10,000
        sourceOrCategory: 'Razorpay',
        date: '2026-10-10',
        time: '10:30 AM',
        timestamp: Date.now() - 86400000,
        note: 'Website milestone payment',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: `sample_2_${Date.now()}`,
        type: 'expense' as const,
        amount: 500000, // ₹5,000
        sourceOrCategory: 'Fast Food',
        date: '2026-10-11',
        time: '01:15 PM',
        timestamp: Date.now() - 40000000,
        note: 'Team lunch',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: `sample_3_${Date.now()}`,
        type: 'expense' as const,
        amount: 200000, // ₹2,000
        sourceOrCategory: 'Petrol',
        date: '2026-10-11',
        time: '04:00 PM',
        timestamp: Date.now() - 10000000,
        note: 'Fuel for car',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    await db.transactions.bulkPut(sampleTxs);
    showToast('Loaded 3 sample transactions for testing');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-emerald-500" />
          <span>App Settings & Preferences</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage currency, timezone, categories, sources, and data backups
        </p>
      </div>

      {/* 1. Account Settings Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-500" />
          <span>Financial Base Settings</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Opening Balance */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/60 dark:border-navy-700/60 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Opening Balance</span>
              <p className="text-lg font-black text-slate-800 dark:text-white mt-1">
                {formatINR(openingBalance)}
              </p>
            </div>
            <button
              onClick={openOpeningModal}
              className="mt-3 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit Balance</span>
            </button>
          </div>

          {/* Fixed Currency */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/60 dark:border-navy-700/60 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Currency</span>
              <p className="text-lg font-black text-slate-800 dark:text-white mt-1 flex items-center gap-1.5">
                <span>INR (₹)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                  Fixed
                </span>
              </p>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Indian Numbering System</p>
          </div>

          {/* Fixed Timezone */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/60 dark:border-navy-700/60 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Timezone</span>
              <p className="text-lg font-black text-slate-800 dark:text-white mt-1 flex items-center gap-1.5">
                <span>Asia/Kolkata</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-bold border border-blue-500/20">
                  IST
                </span>
              </p>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">12-Hour AM/PM Formats</p>
          </div>
        </div>

        {/* Theme Setting */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/60 dark:border-navy-700/60">
          <div className="flex items-center gap-2.5">
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-indigo-400" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white block">
                Visual Theme
              </span>
              <span className="text-[11px] text-slate-400">
                {theme === 'dark' ? 'Deep Navy Dark Theme' : 'Clean Slate Light Theme'}
              </span>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-navy-700 text-xs font-bold bg-white dark:bg-navy-700 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-navy-600 transition"
          >
            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
        </div>
      </div>

      {/* 2. Category & Source Management */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Category & Source Management
            </h3>
            <p className="text-xs text-slate-400">
              Create, rename, or delete expense categories and income sources
            </p>
          </div>

          {/* Toggle Tab */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-navy-800 rounded-xl">
            <button
              onClick={() => setActiveManagerTab('categories')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeManagerTab === 'categories'
                  ? 'bg-white dark:bg-navy-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Expense Categories ({categories.length})
            </button>
            <button
              onClick={() => setActiveManagerTab('sources')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeManagerTab === 'sources'
                  ? 'bg-white dark:bg-navy-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Income Sources ({sources.length})
            </button>
          </div>
        </div>

        {/* Manager: Expense Categories */}
        {activeManagerTab === 'categories' && (
          <div className="space-y-3">
            {/* Add new category form */}
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Enter new expense category name..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newCatName.trim()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </form>

            {/* Categories list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto pt-1">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-navy-800/50 border border-slate-200/60 dark:border-navy-700/60 text-xs"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                    {cat.name}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setItemToRename({ name: cat.name, type: 'expense' });
                        setRenameInput(cat.name);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteError(null);
                        setItemToDelete({ name: cat.name, type: 'expense' });
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-500"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manager: Income Sources */}
        {activeManagerTab === 'sources' && (
          <div className="space-y-3">
            {/* Add new source form */}
            <form onSubmit={handleAddSource} className="flex gap-2">
              <input
                type="text"
                value={newSrcName}
                onChange={(e) => setNewSrcName(e.target.value)}
                placeholder="Enter new income source name..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newSrcName.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Source</span>
              </button>
            </form>

            {/* Sources list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto pt-1">
              {sources.map((src) => (
                <div
                  key={src.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-navy-800/50 border border-slate-200/60 dark:border-navy-700/60 text-xs"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                    {src.name}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setItemToRename({ name: src.name, type: 'income' });
                        setRenameInput(src.name);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteError(null);
                        setItemToDelete({ name: src.name, type: 'income' });
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-500"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Data Backup, Export & Restore */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-500" />
          <span>Data Backup & Restore (IndexedDB)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Full JSON Export */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/60 dark:border-navy-700/60 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white block">
                Export Full Backup (JSON)
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Saves transactions, opening balance, categories, sources, and settings into a single backup file.
              </p>
            </div>
            <button
              onClick={handleExportJson}
              className="mt-3 w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full Backup</span>
            </button>
          </div>

          {/* JSON Restore */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/60 dark:border-navy-700/60 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white block">
                Restore Full Backup (JSON)
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Upload and validate a previously exported JSON backup to restore your data.
              </p>
            </div>
            <button
              onClick={() => {
                setBackupPayload(null);
                setBackupStats(null);
                setRestoreError(null);
                setIsRestoreModalOpen(true);
              }}
              className="mt-3 w-full py-2 px-3 rounded-lg bg-slate-200 dark:bg-navy-700 hover:bg-slate-300 dark:hover:bg-navy-600 text-slate-800 dark:text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Restore from Backup</span>
            </button>
          </div>
        </div>

        {/* PWA Local Data Advisory Alert */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs">
          <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Offline Local Storage Security & Best Practices</p>
            <p className="text-[11px] leading-relaxed text-amber-900/80 dark:text-amber-200/80">
              All transactions are stored securely inside IndexedDB directly on your device. No data is sent to external cloud servers. If you clear browser website data, IndexedDB will be erased.
              <strong> We strongly recommend exporting a JSON backup regularly or when switching devices.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 4. Development / Testing & Danger Zone */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <span>Data Reset & Optional Demo Tools</span>
        </h3>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/60 dark:border-navy-700/60">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-white block">
              Optional Sample Test Data
            </span>
            <span className="text-[11px] text-slate-400">
              Inserts 3 sample entries (₹10,000 Razorpay, ₹5,000 Fast Food, ₹2,000 Petrol)
            </span>
          </div>
          <button
            onClick={handleLoadSampleData}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold border border-emerald-500/20 transition shrink-0"
          >
            Load Sample Data
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30">
          <div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
              Clear All Transaction History
            </span>
            <span className="text-[11px] text-rose-700/80 dark:text-rose-400/80">
              Permanently wipes all recorded transactions and resets opening balance to ₹0
            </span>
          </div>
          <button
            onClick={() => {
              setClearConfirmText('');
              setIsClearDataOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition shrink-0"
          >
            Clear All Data
          </button>
        </div>
      </div>

      {/* Rename Modal */}
      <Modal
        isOpen={!!itemToRename}
        onClose={() => setItemToRename(null)}
        title={`Rename ${itemToRename?.type === 'income' ? 'Income Source' : 'Expense Category'}`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              New Name
            </label>
            <input
              type="text"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
          <p className="text-[11px] text-slate-400">
            All past transactions under "{itemToRename?.name}" will automatically be updated to retain full historical reporting integrity.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setItemToRename(null)}
              className="w-1/2 py-2 rounded-xl border border-slate-200 dark:border-navy-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRename}
              className="w-1/2 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm"
            >
              Save Rename
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Category/Source Dialog */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${itemToDelete?.type === 'income' ? 'Source' : 'Category'} "${itemToDelete?.name}"?`}
        message={
          deleteError ||
          `Are you sure you want to delete "${itemToDelete?.name}"? If any transactions are using this, you will be warned to reassign them.`
        }
        confirmLabel="Confirm Delete"
        variant="danger"
      />

      {/* Restore JSON Modal */}
      <Modal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        title="Restore Full Backup (JSON)"
        subtitle="Validate data before replacing database"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 dark:border-navy-700 rounded-2xl p-6 text-center relative bg-slate-50 dark:bg-navy-800/40">
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreFileSelected}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800 dark:text-white">
              Select a JSON Backup file
            </p>
          </div>

          {restoreError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 text-xs font-semibold border border-rose-200 dark:border-rose-900/50">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{restoreError}</span>
            </div>
          )}

          {backupStats && (
            <div className="space-y-3 p-4 rounded-xl bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-700">
              <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Backup Validated Successfully</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Transactions:</span>{' '}
                  <strong className="text-slate-800 dark:text-white">{backupStats.txCount}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Opening Balance:</span>{' '}
                  <strong className="text-slate-800 dark:text-white">
                    {formatINR(backupStats.openingBalance)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Categories:</span>{' '}
                  <strong className="text-slate-800 dark:text-white">{backupStats.catCount}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Sources:</span>{' '}
                  <strong className="text-slate-800 dark:text-white">{backupStats.srcCount}</strong>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setIsRestoreModalOpen(false)}
              className="w-1/2 py-2 rounded-xl border border-slate-200 dark:border-navy-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              disabled={!backupPayload}
              onClick={handleExecuteRestore}
              className="w-1/2 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 shadow-md"
            >
              Restore & Overwrite
            </button>
          </div>
        </div>
      </Modal>

      {/* Clear All Data Modal with High-Stakes Type-Confirmation */}
      <Modal
        isOpen={isClearDataOpen}
        onClose={() => setIsClearDataOpen(false)}
        title="Confirm Complete Data Wipe"
        maxWidth="sm"
      >
        <div className="space-y-4 text-center py-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            This will permanently delete all {transactions.length} transaction(s) and reset your opening balance to ₹0. This action <strong>cannot be undone</strong>.
          </p>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              Type <strong>CLEAR</strong> to confirm:
            </label>
            <input
              type="text"
              value={clearConfirmText}
              onChange={(e) => setClearConfirmText(e.target.value)}
              placeholder="CLEAR"
              className="w-full text-center tracking-widest px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-sm font-black text-rose-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => setIsClearDataOpen(false)}
              className="py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              disabled={clearConfirmText !== 'CLEAR'}
              onClick={handleClearAllData}
              className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-40 transition shadow-md"
            >
              Permanently Clear
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
