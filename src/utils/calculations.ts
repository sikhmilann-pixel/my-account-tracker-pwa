import { Transaction, MonthlySummaryItem } from '../types';
import { getKolkataNow } from './formatters';

export interface DashboardMetrics {
  openingBalance: number; // in paise
  accountBalance: number; // in paise (Opening + All Income - All Expenses)
  totalIncome: number; // in paise
  totalExpenses: number; // in paise
  todayIncome: number; // in paise
  todayExpenses: number; // in paise
  thisMonthIncome: number; // in paise
  thisMonthExpenses: number; // in paise
}

export function computeDashboardMetrics(
  transactions: Transaction[],
  openingBalance: number
): DashboardMetrics {
  const { dateStr } = getKolkataNow();
  const currentMonth = dateStr.slice(0, 7); // YYYY-MM

  let totalIncome = 0;
  let totalExpenses = 0;
  let todayIncome = 0;
  let todayExpenses = 0;
  let thisMonthIncome = 0;
  let thisMonthExpenses = 0;

  for (const t of transactions) {
    if (t.type === 'income') {
      totalIncome += t.amount;
      if (t.date === dateStr) {
        todayIncome += t.amount;
      }
      if (t.date.startsWith(currentMonth)) {
        thisMonthIncome += t.amount;
      }
    } else {
      totalExpenses += t.amount;
      if (t.date === dateStr) {
        todayExpenses += t.amount;
      }
      if (t.date.startsWith(currentMonth)) {
        thisMonthExpenses += t.amount;
      }
    }
  }

  // Account Balance = Opening Balance + All Income - All Expenses
  const accountBalance = openingBalance + totalIncome - totalExpenses;

  return {
    openingBalance,
    accountBalance,
    totalIncome,
    totalExpenses,
    todayIncome,
    todayExpenses,
    thisMonthIncome,
    thisMonthExpenses,
  };
}

export interface CategorySummary {
  name: string;
  totalPaise: number;
  count: number;
  percentage: number; // 0 - 100
}

export function computeCategoryBreakdown(
  transactions: Transaction[],
  type: 'expense' | 'income'
): {
  items: CategorySummary[];
  totalPaise: number;
} {
  const map = new Map<string, { totalPaise: number; count: number }>();
  let totalPaise = 0;

  for (const t of transactions) {
    if (t.type === type) {
      totalPaise += t.amount;
      const key = t.sourceOrCategory || 'Other';
      const existing = map.get(key) || { totalPaise: 0, count: 0 };
      existing.totalPaise += t.amount;
      existing.count += 1;
      map.set(key, existing);
    }
  }

  const items: CategorySummary[] = Array.from(map.entries()).map(([name, data]) => ({
    name,
    totalPaise: data.totalPaise,
    count: data.count,
    percentage: totalPaise > 0 ? (data.totalPaise / totalPaise) * 100 : 0,
  }));

  // Sort descending by total amount
  items.sort((a, b) => b.totalPaise - a.totalPaise);

  return { items, totalPaise };
}

export interface GstSummary {
  gstChargeTotal: number; // in paise
  gstChargeCount: number;
  gstPaidTotal: number; // in paise
  gstPaidCount: number;
  totalGstExpenses: number; // in paise
}

export function computeGstSummary(transactions: Transaction[]): GstSummary {
  let gstChargeTotal = 0;
  let gstChargeCount = 0;
  let gstPaidTotal = 0;
  let gstPaidCount = 0;

  for (const t of transactions) {
    if (t.type === 'expense') {
      const lower = (t.sourceOrCategory || '').trim().toLowerCase();
      if (lower === 'gst charge') {
        gstChargeTotal += t.amount;
        gstChargeCount += 1;
      } else if (lower === 'gst paid') {
        gstPaidTotal += t.amount;
        gstPaidCount += 1;
      }
    }
  }

  return {
    gstChargeTotal,
    gstChargeCount,
    gstPaidTotal,
    gstPaidCount,
    totalGstExpenses: gstChargeTotal + gstPaidTotal,
  };
}

/**
 * Compute monthly summary table
 */
export function computeMonthlySummaries(
  transactions: Transaction[],
  initialOpeningBalance: number
): MonthlySummaryItem[] {
  if (transactions.length === 0) {
    const { dateStr } = getKolkataNow();
    const currentMonthKey = dateStr.slice(0, 7);
    return [
      {
        monthKey: currentMonthKey,
        monthLabel: formatMonthLabel(currentMonthKey),
        openingBalance: initialOpeningBalance,
        income: 0,
        expenses: 0,
        closingBalance: initialOpeningBalance,
        transactionCount: 0,
      },
    ];
  }

  // Sort chronological (oldest to newest)
  const sorted = [...transactions].sort((a, b) => a.timestamp - b.timestamp);

  // Group by YYYY-MM
  const monthMap = new Map<string, { income: number; expenses: number; count: number }>();

  for (const t of sorted) {
    const monthKey = t.date ? t.date.slice(0, 7) : 'Unknown';
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { income: 0, expenses: 0, count: 0 });
    }
    const m = monthMap.get(monthKey)!;
    if (t.type === 'income') {
      m.income += t.amount;
    } else {
      m.expenses += t.amount;
    }
    m.count += 1;
  }

  // Ensure current month is present
  const { dateStr } = getKolkataNow();
  const currentMonthKey = dateStr.slice(0, 7);
  if (!monthMap.has(currentMonthKey)) {
    monthMap.set(currentMonthKey, { income: 0, expenses: 0, count: 0 });
  }

  // Sort month keys chronologically
  const sortedMonthKeys = Array.from(monthMap.keys()).sort();

  let runningOpening = initialOpeningBalance;
  const result: MonthlySummaryItem[] = [];

  for (const monthKey of sortedMonthKeys) {
    const data = monthMap.get(monthKey)!;
    const closing = runningOpening + data.income - data.expenses;

    result.push({
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
      openingBalance: runningOpening,
      income: data.income,
      expenses: data.expenses,
      closingBalance: closing,
      transactionCount: data.count,
    });

    runningOpening = closing;
  }

  // Return descending by month (newest first for viewing)
  return result.reverse();
}

export function formatMonthLabel(yyyyMm: string): string {
  const [yStr, mStr] = yyyyMm.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(y) || isNaN(m)) return yyyyMm;
  const d = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(d);
}

/**
 * Filter transactions by predefined dashboard or report range
 */
export function filterTransactionsByRange(
  transactions: Transaction[],
  range: 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'all' | 'custom',
  customStart?: string,
  customEnd?: string
): Transaction[] {
  const { dateStr } = getKolkataNow();
  const [currentYear, currentMonth] = dateStr.split('-');

  switch (range) {
    case 'today':
      return transactions.filter((t) => t.date === dateStr);

    case 'this_week': {
      // Calculate start of current week (Monday)
      const now = new Date();
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);
      return transactions.filter((t) => t.timestamp >= monday.getTime());
    }

    case 'this_month': {
      const monthPrefix = `${currentYear}-${currentMonth}`;
      return transactions.filter((t) => t.date.startsWith(monthPrefix));
    }

    case 'last_month': {
      let lmYear = parseInt(currentYear, 10);
      let lmMonth = parseInt(currentMonth, 10) - 1;
      if (lmMonth === 0) {
        lmMonth = 12;
        lmYear -= 1;
      }
      const lmPrefix = `${lmYear}-${String(lmMonth).padStart(2, '0')}`;
      return transactions.filter((t) => t.date.startsWith(lmPrefix));
    }

    case 'this_year': {
      return transactions.filter((t) => t.date.startsWith(currentYear));
    }

    case 'custom': {
      if (!customStart && !customEnd) return transactions;
      return transactions.filter((t) => {
        if (customStart && t.date < customStart) return false;
        if (customEnd && t.date > customEnd) return false;
        return true;
      });
    }

    case 'all':
    default:
      return transactions;
  }
}
