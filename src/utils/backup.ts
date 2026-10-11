import { db, getOpeningBalance, getThemeSetting } from '../db';
import { FullBackupData, Transaction, ExpenseCategory, IncomeSource } from '../types';

/**
 * Generate full JSON string of all user data
 */
export async function generateFullBackupJSON(): Promise<string> {
  const [transactions, categories, sources, openingBalance, theme] = await Promise.all([
    db.transactions.toArray(),
    db.categories.toArray(),
    db.sources.toArray(),
    getOpeningBalance(),
    getThemeSetting(),
  ]);

  const backupPayload: FullBackupData = {
    version: 1,
    exportDate: new Date().toISOString(),
    settings: {
      openingBalance,
      theme,
    },
    transactions,
    categories,
    sources,
  };

  return JSON.stringify(backupPayload, null, 2);
}

export interface BackupValidationResult {
  isValid: boolean;
  error?: string;
  stats?: {
    txCount: number;
    catCount: number;
    srcCount: number;
    openingBalance: number;
    exportDate?: string;
  };
  payload?: FullBackupData;
}

/**
 * Validate JSON backup payload before restore
 */
export function validateBackupJSON(jsonString: string): BackupValidationResult {
  try {
    const parsed = JSON.parse(jsonString);

    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, error: 'File is not a valid JSON object' };
    }

    if (!Array.isArray(parsed.transactions)) {
      return { isValid: false, error: 'Backup is missing the transactions list' };
    }

    // Validate transactions structure
    for (const tx of parsed.transactions) {
      if (!tx.id || !tx.type || typeof tx.amount !== 'number' || !tx.sourceOrCategory) {
        return {
          isValid: false,
          error: `Malformed transaction record detected (ID: ${tx.id || 'missing'})`,
        };
      }
    }

    const openingBalance =
      typeof parsed.settings?.openingBalance === 'number'
        ? parsed.settings.openingBalance
        : 0;

    const stats = {
      txCount: parsed.transactions.length,
      catCount: Array.isArray(parsed.categories) ? parsed.categories.length : 0,
      srcCount: Array.isArray(parsed.sources) ? parsed.sources.length : 0,
      openingBalance,
      exportDate: parsed.exportDate,
    };

    return {
      isValid: true,
      stats,
      payload: parsed as FullBackupData,
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: `JSON parse error: ${err.message || 'Corrupted file'}`,
    };
  }
}

/**
 * Restore database from validated backup
 */
export async function restoreFromBackup(backup: FullBackupData): Promise<void> {
  await db.transaction('rw', db.transactions, db.categories, db.sources, db.settings, async () => {
    // Clear existing
    await db.transactions.clear();
    await db.categories.clear();
    await db.sources.clear();

    // Restore transactions
    if (backup.transactions && backup.transactions.length > 0) {
      await db.transactions.bulkPut(backup.transactions);
    }

    // Restore categories
    if (backup.categories && backup.categories.length > 0) {
      await db.categories.bulkPut(backup.categories);
    }

    // Restore sources
    if (backup.sources && backup.sources.length > 0) {
      await db.sources.bulkPut(backup.sources);
    }

    // Restore settings
    const openingPaise = backup.settings?.openingBalance ?? 0;
    await db.settings.put({ key: 'opening_balance', value: openingPaise });

    const theme = backup.settings?.theme === 'light' ? 'light' : 'dark';
    await db.settings.put({ key: 'theme', value: theme });
  });
}
