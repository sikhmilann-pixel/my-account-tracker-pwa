import React, { useState, useEffect } from 'react';
import { PlusCircle, MinusCircle, Plus, Calendar, Clock, Tag, FileText, Check, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { Transaction, TransactionType } from '../../types';
import {
  getKolkataNow,
  rupeesToPaise,
  paiseToRupees,
  formatINR,
  parseKolkataDateTime,
  time12To24,
  time24To12,
} from '../../utils/formatters';

export const TransactionModal: React.FC = () => {
  const {
    isTxModalOpen,
    closeTxModal,
    txModalType,
    editingTx,
    categories,
    sources,
    showToast,
  } = useApp();

  const [type, setType] = useState<TransactionType>('income');
  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedSourceOrCat, setSelectedSourceOrCat] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time12, setTime12] = useState<string>('');
  const [time24, setTime24] = useState<string>('12:00');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // In-line creation of new Category or Source
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCustomName, setNewCustomName] = useState('');

  // Populate form on open or change
  useEffect(() => {
    if (!isTxModalOpen) return;

    if (editingTx) {
      setType(editingTx.type);
      setAmountStr(paiseToRupees(editingTx.amount).toString());
      setSelectedSourceOrCat(editingTx.sourceOrCategory);
      setDate(editingTx.date);
      setTime12(editingTx.time);
      setTime24(time12To24(editingTx.time));
      setNote(editingTx.note || '');
    } else {
      const now = getKolkataNow();
      setType(txModalType);
      setAmountStr('');
      setDate(now.dateStr);
      setTime12(now.time12);
      setTime24(time12To24(now.time12));
      setNote('');

      // Set default selected category/source
      if (txModalType === 'income') {
        setSelectedSourceOrCat(sources[0]?.name || 'Razorpay');
      } else {
        setSelectedSourceOrCat(categories[0]?.name || 'Fast Food');
      }
    }
    setError(null);
    setIsAddingCustom(false);
    setNewCustomName('');
  }, [isTxModalOpen, txModalType, editingTx, categories, sources]);

  // When type changes, ensure valid selection
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income') {
      setSelectedSourceOrCat(sources[0]?.name || 'Razorpay');
    } else {
      setSelectedSourceOrCat(categories[0]?.name || 'Fast Food');
    }
  };

  const handleTimeChange = (newTime24: string) => {
    setTime24(newTime24);
    setTime12(time24To12(newTime24));
  };

  // Add custom category/source on the fly
  const handleCreateCustom = async () => {
    const trimmed = newCustomName.trim();
    if (!trimmed) return;

    try {
      if (type === 'income') {
        const id = `src_custom_${Date.now()}`;
        await db.sources.put({
          id,
          name: trimmed,
          isDefault: false,
          createdAt: Date.now(),
        });
      } else {
        const id = `cat_custom_${Date.now()}`;
        await db.categories.put({
          id,
          name: trimmed,
          isDefault: false,
          createdAt: Date.now(),
        });
      }
      setSelectedSourceOrCat(trimmed);
      setIsAddingCustom(false);
      setNewCustomName('');
      showToast(`Added custom ${type === 'income' ? 'source' : 'category'} "${trimmed}"`);
    } catch (err: any) {
      setError(`Could not add "${trimmed}": ${err.message || 'Already exists'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const paise = rupeesToPaise(amountStr);

    if (paise <= 0) {
      setError('Please enter a valid amount greater than ₹0');
      return;
    }

    if (!selectedSourceOrCat) {
      setError(`Please select a ${type === 'income' ? 'source' : 'category'}`);
      return;
    }

    if (!date) {
      setError('Please enter a date');
      return;
    }

    // Compute UTC timestamp for Asia/Kolkata date and 12-hour time
    const timestamp = parseKolkataDateTime(date, time12);

    try {
      if (editingTx) {
        const updated: Transaction = {
          ...editingTx,
          type,
          amount: paise,
          sourceOrCategory: selectedSourceOrCat,
          date,
          time: time12,
          timestamp,
          note: note.trim() || undefined,
          updatedAt: Date.now(),
        };
        await db.transactions.put(updated);
        showToast('Transaction updated successfully');
      } else {
        const newTx: Transaction = {
          id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type,
          amount: paise,
          sourceOrCategory: selectedSourceOrCat,
          date,
          time: time12,
          timestamp,
          note: note.trim() || undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await db.transactions.add(newTx);
        showToast(
          `${type === 'income' ? '+ Income' : '− Expense'} of ${formatINR(paise)} recorded`
        );
      }

      closeTxModal();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    }
  };

  const previewPaise = rupeesToPaise(amountStr);
  const optionsList = type === 'income' ? sources : categories;

  return (
    <Modal
      isOpen={isTxModalOpen}
      onClose={closeTxModal}
      title={editingTx ? 'Edit Transaction' : type === 'income' ? 'Add Income' : 'Add Expense'}
      subtitle="Asia/Kolkata (IST) • Instant Balance Sync"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle Buttons (Income vs Expense) */}
        {!editingTx && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-navy-800 rounded-2xl">
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Income</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MinusCircle className="w-4 h-4" />
              <span>Expense</span>
            </button>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Amount (INR) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-xl ${
                type === 'income' ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              ₹
            </span>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              value={amountStr}
              onChange={(e) => {
                setAmountStr(e.target.value);
                setError(null);
              }}
              placeholder="0.00"
              autoFocus
              className={`w-full pl-9 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-navy-800 border text-slate-900 dark:text-white font-bold text-2xl focus:outline-none transition ${
                type === 'income'
                  ? 'border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/40'
                  : 'border-rose-500/40 focus:ring-2 focus:ring-rose-500/40'
              }`}
            />
          </div>
          {previewPaise > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Formatted:{' '}
              <span
                className={`font-semibold ${
                  type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {formatINR(previewPaise)}
              </span>
            </p>
          )}
        </div>

        {/* Source / Category Dropdown */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {type === 'income' ? 'Income Source' : 'Expense Category'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            {!isAddingCustom && (
              <button
                type="button"
                onClick={() => setIsAddingCustom(true)}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add New</span>
              </button>
            )}
          </div>

          {/* In-line Custom Name Creator */}
          {isAddingCustom ? (
            <div className="flex items-center gap-2 p-2 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/30 rounded-xl mb-2">
              <input
                type="text"
                value={newCustomName}
                onChange={(e) => setNewCustomName(e.target.value)}
                placeholder={`New ${type === 'income' ? 'Source' : 'Category'} name`}
                autoFocus
                className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-sm text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreateCustom}
                disabled={!newCustomName.trim()}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsAddingCustom(false)}
                className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedSourceOrCat}
                onChange={(e) => {
                  if (e.target.value === '__ADD_NEW__') {
                    setIsAddingCustom(true);
                  } else {
                    setSelectedSourceOrCat(e.target.value);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                {optionsList.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
                <option value="__ADD_NEW__">+ Add New {type === 'income' ? 'Source' : 'Category'}...</option>
              </select>
            </div>
          )}
        </div>

        {/* Date and Time Pickers (Asia/Kolkata) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Date</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {/* Time Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Time (IST)</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-500">{time12}</span>
            </label>
            <input
              type="time"
              required
              value={time24}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
        </div>

        {/* Note input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Note (Optional)</span>
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Monthly cloud server renewal, invoice #104"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-rose-500 text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-navy-800">
          <button
            type="button"
            onClick={closeTxModal}
            className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 font-semibold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`w-1/2 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition ${
              type === 'income'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{editingTx ? 'Update Entry' : 'Save Transaction'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
