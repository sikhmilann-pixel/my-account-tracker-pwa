import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Upload,
  ArrowUpDown,
  Calendar,
  Trash2,
  Edit2,
  Clock,
  PlusCircle,
  MinusCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { Transaction, TransactionType } from '../../types';
import { formatINR, formatIndianDate } from '../../utils/formatters';
import { exportTransactionsToCSV, downloadFile } from '../../utils/csv';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { CsvImportModal } from './CsvImportModal';

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

export const TransactionHistory: React.FC = () => {
  const {
    transactions,
    categories,
    sources,
    openEditTx,
    openAddIncome,
    openAddExpense,
    showToast,
  } = useApp();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // YYYY-MM
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modals state
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);

  // Available unique categories & sources for filtering
  const allCategoryAndSourceNames = useMemo(() => {
    const set = new Set<string>();
    categories.forEach((c) => set.add(c.name));
    sources.forEach((s) => set.add(s.name));
    transactions.forEach((t) => set.add(t.sourceOrCategory));
    return Array.from(set).sort();
  }, [categories, sources, transactions]);

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        // Search query (source/category, note, date)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesCategory = t.sourceOrCategory.toLowerCase().includes(q);
          const matchesNote = (t.note || '').toLowerCase().includes(q);
          const matchesDate = t.date.includes(q);
          if (!matchesCategory && !matchesNote && !matchesDate) return false;
        }

        // Type filter
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;

        // Category/Source filter
        if (selectedCategory !== 'all' && t.sourceOrCategory !== selectedCategory) return false;

        // Date Range
        if (startDate && t.date < startDate) return false;
        if (endDate && t.date > endDate) return false;

        // Month filter
        if (selectedMonth && !t.date.startsWith(selectedMonth)) return false;

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'oldest':
            return a.timestamp - b.timestamp;
          case 'highest':
            return b.amount - a.amount;
          case 'lowest':
            return a.amount - b.amount;
          case 'newest':
          default:
            return b.timestamp - a.timestamp;
        }
      });
  }, [
    transactions,
    searchQuery,
    typeFilter,
    selectedCategory,
    startDate,
    endDate,
    selectedMonth,
    sortBy,
  ]);

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  // Reset page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setSelectedCategory('all');
    setStartDate('');
    setEndDate('');
    setSelectedMonth('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  // CSV Export
  const handleExportCsv = (filteredOnly: boolean) => {
    const listToExport = filteredOnly ? filteredTransactions : transactions;
    if (listToExport.length === 0) {
      showToast('No transactions to export');
      return;
    }
    const csvContent = exportTransactionsToCSV(listToExport);
    const dateTag = new Date().toISOString().slice(0, 10);
    const filename = `my_account_tracker_${filteredOnly ? 'filtered_' : 'all_'}${dateTag}.csv`;
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
    showToast(`Exported ${listToExport.length} transactions as CSV`);
  };

  // Delete Transaction
  const handleDeleteTransaction = async () => {
    if (!txToDelete) return;
    try {
      await db.transactions.delete(txToDelete.id);
      showToast('Transaction deleted successfully');
      setTxToDelete(null);
    } catch (err: any) {
      showToast(`Error deleting transaction: ${err.message}`);
    }
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    typeFilter !== 'all' ||
    selectedCategory !== 'all' ||
    startDate ||
    endDate ||
    selectedMonth ||
    sortBy !== 'newest'
  );

  return (
    <div className="space-y-5 pb-20 lg:pb-8 animate-fadeIn">
      {/* Top Header & Quick Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Transaction History
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {filteredTransactions.length} transaction{filteredTransactions.length === 1 ? '' : 's'}{' '}
            found
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* CSV Import */}
          <button
            onClick={() => setIsCsvImportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold border border-slate-200 dark:border-navy-700 transition"
            title="Import from CSV backup"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-500" />
            <span>Import</span>
          </button>

          {/* CSV Export */}
          <button
            onClick={() => handleExportCsv(hasActiveFilters)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold border border-slate-200 dark:border-navy-700 transition"
            title="Export transactions to CSV"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>Export CSV</span>
          </button>

          {/* Quick Add Buttons */}
          <button
            onClick={openAddIncome}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Income</span>
          </button>
          <button
            onClick={openAddExpense}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
          >
            <MinusCircle className="w-3.5 h-3.5" />
            <span>Expense</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleFilterChange();
            }}
            placeholder="Search by category, source, note, or date..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {/* Type Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as any);
                handleFilterChange();
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="income">Income Only</option>
              <option value="expense">Expense Only</option>
            </select>
          </div>

          {/* Category / Source */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Category / Source
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                handleFilterChange();
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none truncate"
            >
              <option value="all">All Categories</option>
              {allCategoryAndSourceNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Month / Year */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Month / Year
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                handleFilterChange();
              }}
              className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          {/* Date Range Start */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                handleFilterChange();
              }}
              className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          {/* Date Range End */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                handleFilterChange();
              }}
              className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                handleFilterChange();
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-navy-800 text-xs">
            <span className="text-slate-500">Filters applied</span>
            <button
              onClick={handleClearFilters}
              className="text-rose-500 font-semibold hover:underline"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Transactions List Table / Cards */}
      <div className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm overflow-hidden">
        {paginatedTransactions.length === 0 ? (
          <div className="text-center py-16 px-4">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-navy-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              No transactions found
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Try adjusting or clearing your filters to see transactions.'
                : 'Your transaction register is currently empty. Record your first transaction using the buttons above.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-navy-800">
            {paginatedTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              return (
                <div
                  key={tx.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-navy-800/40 transition group"
                >
                  {/* Left info: Icon, Category/Source, Date & Time, Note */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold ${
                        isIncome
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isIncome ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                          {tx.sourceOrCategory}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                            isIncome
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40'
                          }`}
                        >
                          {isIncome ? 'Income' : 'Expense'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          {formatIndianDate(tx.date)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{tx.time}</span>
                        </span>
                        {tx.note && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500 dark:text-slate-400 italic truncate max-w-xs sm:max-w-md">
                              "{tx.note}"
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-12 sm:pl-0">
                    <span
                      className={`text-base sm:text-lg font-black tracking-tight ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '−'}
                      {formatINR(tx.amount)}
                    </span>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-90 sm:opacity-40 group-hover:opacity-100 transition">
                      <button
                        onClick={() => openEditTx(tx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-700 transition"
                        title="Edit transaction"
                        aria-label="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setTxToDelete(tx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Delete transaction"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-navy-800 text-xs">
            <span className="text-slate-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-navy-700 disabled:opacity-40 text-slate-600 dark:text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-navy-700 disabled:opacity-40 text-slate-600 dark:text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!txToDelete}
        onClose={() => setTxToDelete(null)}
        onConfirm={handleDeleteTransaction}
        title="Delete Transaction?"
        message={`Are you sure you want to delete this ${
          txToDelete?.type === 'income' ? 'income' : 'expense'
        } of ${txToDelete ? formatINR(txToDelete.amount) : ''}? This will immediately update your account balance and reports.`}
        confirmLabel="Delete Permanently"
        variant="danger"
      />

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
      />
    </div>
  );
};
