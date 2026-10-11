import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { formatINR } from '../../utils/formatters';

interface MetricCardsProps {
  totalIncome: number;
  totalExpenses: number;
  todayIncome: number;
  todayExpenses: number;
  thisMonthIncome: number;
  thisMonthExpenses: number;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  totalIncome,
  totalExpenses,
  todayIncome,
  todayExpenses,
  thisMonthIncome,
  thisMonthExpenses,
}) => {
  const cards = [
    {
      id: 'total-income',
      title: 'Total Income',
      amount: totalIncome,
      type: 'income' as const,
      subtitle: 'All-time cumulative',
      icon: TrendingUp,
      accentColor: 'text-emerald-500',
      badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'total-expenses',
      title: 'Total Expenses',
      amount: totalExpenses,
      type: 'expense' as const,
      subtitle: 'All-time cumulative',
      icon: TrendingDown,
      accentColor: 'text-rose-500',
      badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    },
    {
      id: 'today-income',
      title: "Today's Income",
      amount: todayIncome,
      type: 'income' as const,
      subtitle: 'Since midnight IST',
      icon: Clock,
      accentColor: 'text-emerald-500',
      badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'today-expenses',
      title: "Today's Expenses",
      amount: todayExpenses,
      type: 'expense' as const,
      subtitle: 'Since midnight IST',
      icon: Clock,
      accentColor: 'text-rose-500',
      badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    },
    {
      id: 'month-income',
      title: "This Month's Income",
      amount: thisMonthIncome,
      type: 'income' as const,
      subtitle: 'Current calendar month',
      icon: Calendar,
      accentColor: 'text-emerald-500',
      badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'month-expenses',
      title: "This Month's Expenses",
      amount: thisMonthExpenses,
      type: 'expense' as const,
      subtitle: 'Current calendar month',
      icon: Calendar,
      accentColor: 'text-rose-500',
      badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        const isIncome = c.type === 'income';
        return (
          <div
            key={c.id}
            className="group relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm hover:shadow-md transition duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {c.title}
              </span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center border ${c.badgeBg}`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <div
                className={`text-2xl font-black tracking-tight ${
                  isIncome
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatINR(c.amount)}
              </div>
              {isIncome ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-rose-500 shrink-0" />
              )}
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {c.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
};
