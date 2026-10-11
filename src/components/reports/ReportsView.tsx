import React, { useState, useMemo } from 'react';
import {
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Layers,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ArrowRight,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import {
  computeCategoryBreakdown,
  computeGstSummary,
  computeMonthlySummaries,
  filterTransactionsByRange,
} from '../../utils/calculations';
import { formatINR, paiseToRupees } from '../../utils/formatters';
import { ReportDateFilter } from '../../types';

const CHART_COLORS = [
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#f97316', // orange
  '#ef4444', // red
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#84cc16', // lime
  '#64748b', // slate
];

export const ReportsView: React.FC = () => {
  const { transactions, openingBalance } = useApp();

  const [dateFilter, setDateFilter] = useState<ReportDateFilter>('this_month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // 1. Filter transactions according to selected range
  const filteredTxs = useMemo(() => {
    return filterTransactionsByRange(transactions, dateFilter, customStart, customEnd);
  }, [transactions, dateFilter, customStart, customEnd]);

  // 2. Compute Category-wise Expense breakdown
  const expenseBreakdown = useMemo(() => {
    return computeCategoryBreakdown(filteredTxs, 'expense');
  }, [filteredTxs]);

  // 3. Compute Source-wise Income breakdown
  const incomeBreakdown = useMemo(() => {
    return computeCategoryBreakdown(filteredTxs, 'income');
  }, [filteredTxs]);

  // 4. Compute GST Tracking summary
  const gstSummary = useMemo(() => {
    return computeGstSummary(filteredTxs);
  }, [filteredTxs]);

  // 5. Compute Monthly Summary table
  const monthlySummaries = useMemo(() => {
    return computeMonthlySummaries(transactions, openingBalance);
  }, [transactions, openingBalance]);

  // 6. Data formatted for Recharts Pie Chart (Expenses)
  const pieChartData = useMemo(() => {
    return expenseBreakdown.items.map((item) => ({
      name: item.name,
      value: paiseToRupees(item.totalPaise),
      formatted: formatINR(item.totalPaise),
      percentage: item.percentage.toFixed(1),
    }));
  }, [expenseBreakdown]);

  // 7. Data formatted for Income vs Expense Bar Chart (last 6 months)
  const comparisonChartData = useMemo(() => {
    return monthlySummaries.slice(0, 6).reverse().map((m) => ({
      month: m.monthLabel.split(' ')[0], // Month name
      Income: paiseToRupees(m.income),
      Expenses: paiseToRupees(m.expenses),
    }));
  }, [monthlySummaries]);

  const filterButtons: { key: ReportDateFilter; label: string }[] = [
    { key: 'this_month', label: 'This Month' },
    { key: 'last_month', label: 'Last Month' },
    { key: 'this_year', label: 'This Year' },
    { key: 'all', label: 'All Time' },
    { key: 'custom', label: 'Custom Range' },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-8 animate-fadeIn">
      {/* Header and Date Filter Selection */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-navy-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-emerald-500" />
              <span>Category Reports & Analytics</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Breakdown of spending, income channels, GST analysis, and monthly ledger
            </p>
          </div>

          {/* Filter button tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-navy-800 rounded-xl">
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

        {/* Custom Date Range selector if active */}
        {dateFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">From:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">To:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Total Summary for selected report range */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/60 dark:border-navy-700/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Selected Expenses</span>
            <p className="text-lg sm:text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
              {formatINR(expenseBreakdown.totalPaise)}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/60 dark:border-navy-700/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Selected Income</span>
            <p className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatINR(incomeBreakdown.totalPaise)}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/60 dark:border-navy-700/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Transactions Analyzed</span>
            <p className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white mt-1">
              {filteredTxs.length}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Category Expense Donut Chart */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-rose-500" />
              <span>Category Expense Distribution</span>
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              Total: {formatINR(expenseBreakdown.totalPaise)}
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full flex items-center justify-center">
            {pieChartData.length === 0 ? (
              <p className="text-xs text-slate-400">No expense records in this range</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {pieChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`₹${Number(value).toLocaleString('en-IN')}`, name]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: '1px solid #1e293b',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 2. Income vs Expenses Comparison Chart */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <span>Income vs Expenses (Monthly)</span>
            </h3>
            <span className="text-xs font-semibold text-slate-400">Past Months</span>
          </div>

          <div className="h-64 sm:h-72 w-full flex items-center justify-center">
            {comparisonChartData.length === 0 ? (
              <p className="text-xs text-slate-400">No history available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: '1px solid #1e293b',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 6. GST Tracking Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                GST Tracking Breakdown
              </h3>
              <p className="text-[11px] text-slate-400">
                Independent tracking of GST Charge and GST Paid categories
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          {/* GST Charge */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/60 dark:border-navy-700/60">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              GST Charge
            </span>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {formatINR(gstSummary.gstChargeTotal)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {gstSummary.gstChargeCount} transaction{gstSummary.gstChargeCount === 1 ? '' : 's'}
            </p>
          </div>

          {/* GST Paid */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/60 dark:border-navy-700/60">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              GST Paid
            </span>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {formatINR(gstSummary.gstPaidTotal)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {gstSummary.gstPaidCount} transaction{gstSummary.gstPaidCount === 1 ? '' : 's'}
            </p>
          </div>

          {/* Total Combined GST */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/60 dark:border-navy-700/60">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              Total GST Expenses
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {formatINR(gstSummary.totalGstExpenses)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Combined sum for personal tracking
            </p>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 bg-slate-100/60 dark:bg-navy-800/40 p-2.5 rounded-lg border border-slate-200/40 dark:border-navy-700/40">
          <strong>Note:</strong> GST Charge and GST Paid are tracked independently for your personal record keeping. This application does not automatically determine input tax credit (ITC) or replace tax filing.
        </p>
      </div>

      {/* Category-wise Expense Report Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-navy-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-500" />
              <span>Category-Wise Expense Report</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Individual category totals, transaction counts, and percentages
            </p>
          </div>
          <span className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-900/50">
            Total: {formatINR(expenseBreakdown.totalPaise)}
          </span>
        </div>

        {expenseBreakdown.items.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">
            No expenses recorded for this timeframe.
          </p>
        ) : (
          <div className="space-y-3">
            {expenseBreakdown.items.map((cat, idx) => (
              <div
                key={cat.name}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-800/40 border border-slate-200/60 dark:border-navy-700/60"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {cat.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({cat.count} transaction{cat.count === 1 ? '' : 's'})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
                      {formatINR(cat.totalPaise)}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">
                      ({cat.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                {/* Percentage progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-navy-700 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(1, cat.percentage))}%`,
                      backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Source-wise Income Report Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-navy-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Source-Wise Income Report</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Income distribution by client, platform, or service channel
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/50">
            Total: {formatINR(incomeBreakdown.totalPaise)}
          </span>
        </div>

        {incomeBreakdown.items.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">
            No income recorded for this timeframe.
          </p>
        ) : (
          <div className="space-y-3">
            {incomeBreakdown.items.map((src, idx) => (
              <div
                key={src.name}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-800/40 border border-slate-200/60 dark:border-navy-700/60"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {src.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({src.count} transaction{src.count === 1 ? '' : 's'})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatINR(src.totalPaise)}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">
                      ({src.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-navy-700 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(1, src.percentage))}%`,
                      backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7.B Monthly Summary Ledger Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-navy-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Monthly Account Balance Summary</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Opening balance, total income, total expenses, and closing balance for each month
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">Month</th>
                <th className="p-3">Opening Balance</th>
                <th className="p-3">Total Income</th>
                <th className="p-3">Total Expenses</th>
                <th className="p-3">Closing Balance</th>
                <th className="p-3 text-center">Tx Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {monthlySummaries.map((m) => (
                <tr key={m.monthKey} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/40">
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{m.monthLabel}</td>
                  <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                    {formatINR(m.openingBalance)}
                  </td>
                  <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatINR(m.income)}
                  </td>
                  <td className="p-3 font-bold text-rose-600 dark:text-rose-400">
                    −{formatINR(m.expenses)}
                  </td>
                  <td className="p-3 font-black">
                    <span
                      className={
                        m.closingBalance >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }
                    >
                      {formatINR(m.closingBalance)}
                    </span>
                  </td>
                  <td className="p-3 text-center text-slate-400">{m.transactionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
