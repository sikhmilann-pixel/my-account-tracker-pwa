import React, { useState } from 'react';
import {
  Calendar,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ReceiptText,
  Clock,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BalanceCard } from './BalanceCard';
import { MetricCards } from './MetricCards';
import {
  computeDashboardMetrics,
  filterTransactionsByRange,
} from '../../utils/calculations';
import { formatINR, formatIndianDate } from '../../utils/formatters';
import { DashboardDateFilter } from '../../types';

export const Dashboard: React.FC = () => {
  const {
    transactions,
    openingBalance,
    setActiveTab,
    openEditTx,
    openAddIncome,
    openAddExpense,
  } = useApp();

  const [dateFilter, setDateFilter] = useState<DashboardDateFilter>('all');

  const metrics = computeDashboardMetrics(transactions, openingBalance);

  // Filtered transactions for the selected dashboard view
  const filteredTxs = filterTransactionsByRange(transactions, dateFilter);

  // Calculate period metrics
  let periodIncome = 0;
  let periodExpense = 0;
  for (const t of filteredTxs) {
    if (t.type === 'income') periodIncome += t.amount;
    else periodExpense += t.amount;
  }
  const periodNet = periodIncome - periodExpense;

  const recentTransactions = transactions.slice(0, 5);

  const filterButtons: { key: DashboardDateFilter; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'this_week', label: 'This Week' },
    { key: 'this_month', label: 'This Month' },
    { key: 'this_year', label: 'This Year' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-8 animate-fadeIn">
      {/* 1. Hero Balance Card (Opening + All Income - All Expenses) */}
      <BalanceCard
        accountBalance={metrics.accountBalance}
        openingBalance={metrics.openingBalance}
        totalIncome={metrics.totalIncome}
        totalExpenses={metrics.totalExpenses}
      />

      {/* 2. Standard 6 Financial Summary Cards */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Quick Financial Insights
        </h2>
        <MetricCards
          totalIncome={metrics.totalIncome}
          totalExpenses={metrics.totalExpenses}
          todayIncome={metrics.todayIncome}
          todayExpenses={metrics.todayExpenses}
          thisMonthIncome={metrics.thisMonthIncome}
          thisMonthExpenses={metrics.thisMonthExpenses}
        />
      </div>

      {/* 3. Dashboard Date Range Period Summary */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-navy-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span>Period Filter Summary</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Analyze cashflow for custom timeframes
            </p>
          </div>

          {/* Date Filter Tabs */}
          <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-navy-800 rounded-xl">
            {filterButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => setDateFilter(btn.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  dateFilter === btn.key
                    ? 'bg-white dark:bg-navy-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3 mini stats for filtered period */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/60 dark:border-navy-700/60">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              Period Income
            </span>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatINR(periodIncome)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/60 dark:border-navy-700/60">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              Period Expenses
            </span>
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">
              {formatINR(periodExpense)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/60 dark:border-navy-700/60">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              Net Period Cashflow
            </span>
            <p
              className={`text-lg font-bold mt-1 ${
                periodNet >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatINR(periodNet, { showSign: true })}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Recent Transactions Section */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Transactions
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('transactions')}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <span>View All ({transactions.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-navy-700">
            <ReceiptText className="w-10 h-10 text-slate-300 dark:text-navy-700 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No transactions recorded yet
            </p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Get started by recording your first income or expense
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={openAddIncome}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Income</span>
              </button>
              <button
                onClick={openAddExpense}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <MinusCircle className="w-3.5 h-3.5" />
                <span>Add Expense</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-navy-800">
            {recentTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              return (
                <div
                  key={tx.id}
                  onClick={() => openEditTx(tx)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-navy-800/40 px-2 rounded-xl cursor-pointer transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                        isIncome
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isIncome ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {tx.sourceOrCategory}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{formatIndianDate(tx.date)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {tx.time}
                        </span>
                        {tx.note && (
                          <>
                            <span>•</span>
                            <span className="truncate italic text-slate-500 dark:text-slate-400">
                              "{tx.note}"
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-extrabold ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '−'}
                      {formatINR(tx.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
