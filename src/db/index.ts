import Dexie, { Table } from 'dexie';
import { Transaction, ExpenseCategory, IncomeSource } from '../types';

export const DEFAULT_INCOME_SOURCES: string[] = [
  'Razorpay',
  'Website Development',
  'App Development',
  'Freelancing',
  'Social Media Marketing',
  'Client Payment',
  'Affiliate Income',
  'Other',
];

export const DEFAULT_EXPENSE_CATEGORIES: string[] = [
  'Fast Food',
  'Influencer',
  'Petrol',
  'GST Charge',
  'GST Paid',
  'Hosting & Domains',
  'Software & Tools',
  'Marketing & Advertising',
  'Salary',
  'Internet & Mobile',
  'Travel',
  'Office Expenses',
  'Personal Expenses',
  'Bank Charges',
  'Other',
];

export interface SettingRecord {
  key: string;
  value: any;
}

export class AppDatabase extends Dexie {
  transactions!: Table<Transaction, string>;
  categories!: Table<ExpenseCategory, string>;
  sources!: Table<IncomeSource, string>;
  settings!: Table<SettingRecord, string>;

  constructor() {
    super('PersonalIncomeExpenseDB');
    this.version(1).stores({
      transactions: 'id, type, sourceOrCategory, date, timestamp, amount',
      categories: 'id, &name, isDefault',
      sources: 'id, &name, isDefault',
      settings: 'key',
    });
  }
}

export const db = new AppDatabase();

// Singleton initialization promise to prevent race conditions during React StrictMode mount
let initPromise: Promise<void> | null = null;

export function initializeDatabase(forceRetry = false): Promise<void> {
  if (forceRetry || !initPromise) {
    initPromise = doInitializeDatabase().catch((err) => {
      initPromise = null; // Reset so retry is possible
      console.error('Dexie database initialization failed:', err);
      throw err;
    });
  }
  return initPromise;
}

async function doInitializeDatabase(): Promise<void> {
  // Ensure DB connection is open
  if (!db.isOpen()) {
    await db.open();
  }

  // Atomically initialize default master data without throwing ConstraintError
  await db.transaction('rw', [db.categories, db.sources, db.settings], async () => {
    // 1. Initialize default categories if none exist
    const categoriesCount = await db.categories.count();
    if (categoriesCount === 0) {
      for (const name of DEFAULT_EXPENSE_CATEGORIES) {
        const existing = await db.categories.where('name').equals(name).first();
        if (!existing) {
          await db.categories.put({
            id: `cat_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            name,
            isDefault: true,
            createdAt: Date.now(),
          });
        }
      }
    }

    // 2. Initialize default sources if none exist
    const sourcesCount = await db.sources.count();
    if (sourcesCount === 0) {
      for (const name of DEFAULT_INCOME_SOURCES) {
        const existing = await db.sources.where('name').equals(name).first();
        if (!existing) {
          await db.sources.put({
            id: `src_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            name,
            isDefault: true,
            createdAt: Date.now(),
          });
        }
      }
    }

    // 3. Ensure opening balance setting exists (in paise)
    const openingSetting = await db.settings.get('opening_balance');
    if (!openingSetting) {
      await db.settings.put({ key: 'opening_balance', value: 0 });
    }

    // 4. Ensure theme setting exists
    const themeSetting = await db.settings.get('theme');
    if (!themeSetting) {
      await db.settings.put({ key: 'theme', value: 'dark' });
    }
  });
}

// Database helper functions
export async function getOpeningBalance(): Promise<number> {
  try {
    const setting = await db.settings.get('opening_balance');
    return typeof setting?.value === 'number' ? setting.value : 0;
  } catch (err) {
    console.warn('Failed to read opening_balance setting:', err);
    return 0;
  }
}

export async function setOpeningBalance(paise: number): Promise<void> {
  await db.settings.put({ key: 'opening_balance', value: paise });
}

export async function getThemeSetting(): Promise<'dark' | 'light'> {
  try {
    const setting = await db.settings.get('theme');
    return setting?.value === 'light' ? 'light' : 'dark';
  } catch (err) {
    console.warn('Failed to read theme setting:', err);
    return 'dark';
  }
}

export async function setThemeSetting(theme: 'dark' | 'light'): Promise<void> {
  await db.settings.put({ key: 'theme', value: theme });
}

/**
 * Check if a category or source is used in any transactions
 */
export async function countTransactionsForCategoryOrSource(
  name: string,
  type: 'income' | 'expense'
): Promise<number> {
  return await db.transactions
    .where({ type, sourceOrCategory: name })
    .count();
}

/**
 * Rename category or source across the master list and existing transactions
 */
export async function renameCategoryOrSource(
  oldName: string,
  newName: string,
  type: 'income' | 'expense'
): Promise<void> {
  const trimmedNew = newName.trim();
  if (!trimmedNew || trimmedNew === oldName) return;

  await db.transaction('rw', [db.transactions, db.categories, db.sources], async () => {
    if (type === 'expense') {
      const existing = await db.categories.where('name').equals(oldName).first();
      if (existing) {
        await db.categories.update(existing.id, { name: trimmedNew });
      }
    } else {
      const existing = await db.sources.where('name').equals(oldName).first();
      if (existing) {
        await db.sources.update(existing.id, { name: trimmedNew });
      }
    }

    // Update historical transactions to preserve consistency
    const matchingTx = await db.transactions
      .where({ type, sourceOrCategory: oldName })
      .toArray();

    for (const tx of matchingTx) {
      await db.transactions.update(tx.id, {
        sourceOrCategory: trimmedNew,
        updatedAt: Date.now(),
      });
    }
  });
}

/**
 * Delete category or source safely:
 * If reassignTo is provided, reassign matching transactions.
 * If transactions exist and no reassignment provided, return error to prevent orphan records.
 */
export async function deleteCategoryOrSource(
  name: string,
  type: 'income' | 'expense',
  reassignTo?: string
): Promise<{ success: boolean; message?: string }> {
  const txCount = await countTransactionsForCategoryOrSource(name, type);
  
  if (txCount > 0 && !reassignTo) {
    return {
      success: false,
      message: `Cannot delete "${name}" because it is used in ${txCount} transaction(s). Please reassign them first or keep the category for your records.`,
    };
  }

  await db.transaction('rw', [db.transactions, db.categories, db.sources], async () => {
    if (txCount > 0 && reassignTo) {
      const matchingTx = await db.transactions
        .where({ type, sourceOrCategory: name })
        .toArray();
      for (const tx of matchingTx) {
        await db.transactions.update(tx.id, {
          sourceOrCategory: reassignTo,
          updatedAt: Date.now(),
        });
      }
    }

    if (type === 'expense') {
      const cat = await db.categories.where('name').equals(name).first();
      if (cat) await db.categories.delete(cat.id);
    } else {
      const src = await db.sources.where('name').equals(name).first();
      if (src) await db.sources.delete(src.id);
    }
  });

  return { success: true };
}
