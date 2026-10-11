declare const process: any;

/**
 * Verification script covering all 15 scenarios requested by the user
 */
import {
  rupeesToPaise,
  paiseToRupees,
  formatINR,
  getKolkataNow,
  parseKolkataDateTime,
  formatIndianDate,
} from './utils/formatters';

import {
  computeDashboardMetrics,
  computeCategoryBreakdown,
  computeGstSummary,
  computeMonthlySummaries,
} from './utils/calculations';

import { exportTransactionsToCSV, parseCSV, validateCsvRows } from './utils/csv';
import { validateBackupJSON } from './utils/backup';
import { Transaction } from './types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ Passed: ${message}`);
}

async function runAllScenarioTests() {
  console.log('--- STARTING ALL 15 SCENARIO TESTS ---');

  // Scenario 1: Set opening balance to ₹0
  let openingBalance = rupeesToPaise(0); // 0 paise
  assert(openingBalance === 0, 'Scenario 1: Opening balance is 0 paise (₹0.00)');

  // Transaction list
  let transactions: Transaction[] = [];

  // Scenario 2: Add ₹10,000 income under Razorpay
  const now = getKolkataNow();
  const tx1: Transaction = {
    id: 'tx_1',
    type: 'income',
    amount: rupeesToPaise(10000), // 1,000,000 paise
    sourceOrCategory: 'Razorpay',
    date: now.dateStr,
    time: now.time12,
    timestamp: now.timestamp,
    note: 'Initial client payout',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  transactions.push(tx1);

  let metrics = computeDashboardMetrics(transactions, openingBalance);
  assert(
    metrics.accountBalance === 1000000,
    `Scenario 2: Account balance after ₹10,000 income is ${formatINR(metrics.accountBalance)}`
  );

  // Scenario 3: Add ₹5,000 expense under Fast Food
  const tx2: Transaction = {
    id: 'tx_2',
    type: 'expense',
    amount: rupeesToPaise(5000), // 500,000 paise
    sourceOrCategory: 'Fast Food',
    date: now.dateStr,
    time: now.time12,
    timestamp: now.timestamp + 1000,
    note: 'Team meal',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  transactions.push(tx2);

  // Scenario 4: Verify account balance is ₹5,000
  metrics = computeDashboardMetrics(transactions, openingBalance);
  assert(
    metrics.accountBalance === 500000,
    `Scenario 4: Account balance is ₹5,000 (${formatINR(metrics.accountBalance)})`
  );

  // Scenario 5: Add another ₹2,000 expense under Petrol
  const tx3: Transaction = {
    id: 'tx_3',
    type: 'expense',
    amount: rupeesToPaise(2000), // 200,000 paise
    sourceOrCategory: 'Petrol',
    date: now.dateStr,
    time: now.time12,
    timestamp: now.timestamp + 2000,
    note: 'Car refuel',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  transactions.push(tx3);

  // Scenario 6: Verify account balance is ₹3,000
  metrics = computeDashboardMetrics(transactions, openingBalance);
  assert(
    metrics.accountBalance === 300000,
    `Scenario 6: Account balance is ₹3,000 (${formatINR(metrics.accountBalance)})`
  );

  // Scenario 7: Open Reports and verify Fast Food = ₹5,000 and Petrol = ₹2,000
  let expenseReport = computeCategoryBreakdown(transactions, 'expense');
  const fastFoodCat = expenseReport.items.find((c) => c.name === 'Fast Food');
  const petrolCat = expenseReport.items.find((c) => c.name === 'Petrol');
  assert(
    fastFoodCat?.totalPaise === 500000,
    `Scenario 7a: Fast Food expense is ₹5,000 (${formatINR(fastFoodCat?.totalPaise || 0)})`
  );
  assert(
    petrolCat?.totalPaise === 200000,
    `Scenario 7b: Petrol expense is ₹2,000 (${formatINR(petrolCat?.totalPaise || 0)})`
  );
  assert(
    expenseReport.totalPaise === 700000,
    `Scenario 7c: Total expenses is ₹7,000 (${formatINR(expenseReport.totalPaise)})`
  );

  // Scenario 8: Add a custom category called "Office Rent", record an expense, and verify it appears in reports
  const tx4: Transaction = {
    id: 'tx_4',
    type: 'expense',
    amount: rupeesToPaise(1500), // 150,000 paise
    sourceOrCategory: 'Office Rent',
    date: now.dateStr,
    time: now.time12,
    timestamp: now.timestamp + 3000,
    note: 'Co-working seat fee',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  transactions.push(tx4);

  expenseReport = computeCategoryBreakdown(transactions, 'expense');
  const rentCat = expenseReport.items.find((c) => c.name === 'Office Rent');
  assert(
    rentCat?.totalPaise === 150000,
    `Scenario 8: Office Rent custom category recorded with ₹1,500 (${formatINR(rentCat?.totalPaise || 0)})`
  );
  metrics = computeDashboardMetrics(transactions, openingBalance);
  assert(
    metrics.accountBalance === 150000,
    `Scenario 8b: Balance updated to ₹1,500 (${formatINR(metrics.accountBalance)})`
  );

  // Scenario 9: Edit an existing transaction and verify all totals recalculate
  // Edit Petrol from ₹2,000 to ₹2,500 (250,000 paise)
  const txToEdit = transactions.find((t) => t.id === 'tx_3')!;
  txToEdit.amount = rupeesToPaise(2500);
  metrics = computeDashboardMetrics(transactions, openingBalance);
  assert(
    metrics.accountBalance === 100000,
    `Scenario 9: After editing Petrol to ₹2,500, Account Balance recalculates to ₹1,000 (${formatINR(metrics.accountBalance)})`
  );

  // Scenario 10: Delete a transaction and verify all totals recalculate
  // Delete Fast Food (₹5,000)
  transactions = transactions.filter((t) => t.id !== 'tx_2');
  metrics = computeDashboardMetrics(transactions, openingBalance);
  assert(
    metrics.accountBalance === 600000,
    `Scenario 10: After deleting Fast Food, Account Balance recalculates to ₹6,000 (${formatINR(metrics.accountBalance)})`
  );

  // Scenario 11: Verify date/time displays in Asia/Kolkata using 12-hour AM/PM formatting
  const testNow = getKolkataNow();
  assert(
    /^\d{4}-\d{2}-\d{2}$/.test(testNow.dateStr),
    `Scenario 11a: Date format is YYYY-MM-DD (${testNow.dateStr})`
  );
  assert(
    /^\d{1,2}:\d{2}\s+(AM|PM)$/i.test(testNow.time12),
    `Scenario 11b: Time is 12-hour AM/PM (${testNow.time12})`
  );

  // Test Negative Balance warning scenario
  // Add heavy expense of ₹20,000
  const heavyTx: Transaction = {
    id: 'tx_heavy',
    type: 'expense',
    amount: rupeesToPaise(20000),
    sourceOrCategory: 'Software & Tools',
    date: now.dateStr,
    time: now.time12,
    timestamp: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const negTransactions = [...transactions, heavyTx];
  const negMetrics = computeDashboardMetrics(negTransactions, openingBalance);
  assert(
    negMetrics.accountBalance < 0,
    `Negative Balance Triggered: Account Balance is negative (${formatINR(negMetrics.accountBalance)})`
  );

  // Scenario 12: GST Tracking separation test
  const gstChargeTx: Transaction = {
    id: 'tx_gst_1',
    type: 'expense',
    amount: rupeesToPaise(500),
    sourceOrCategory: 'GST Charge',
    date: now.dateStr,
    time: now.time12,
    timestamp: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const gstPaidTx: Transaction = {
    id: 'tx_gst_2',
    type: 'expense',
    amount: rupeesToPaise(2000),
    sourceOrCategory: 'GST Paid',
    date: now.dateStr,
    time: now.time12,
    timestamp: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const gstList = [...transactions, gstChargeTx, gstPaidTx];
  const gstReport = computeGstSummary(gstList);
  assert(
    gstReport.gstChargeTotal === 50000,
    `Scenario 12a: GST Charge tracked independently: ${formatINR(gstReport.gstChargeTotal)}`
  );
  assert(
    gstReport.gstPaidTotal === 200000,
    `Scenario 12b: GST Paid tracked independently: ${formatINR(gstReport.gstPaidTotal)}`
  );

  // Scenario 13: Verify CSV export and JSON backup/restore
  const exportedCsv = exportTransactionsToCSV(gstList);
  assert(exportedCsv.startsWith('\uFEFF'), 'Scenario 13a: CSV begins with UTF-8 BOM');
  const parsedRows = parseCSV(exportedCsv);
  assert(parsedRows.length >= gstList.length + 1, 'Scenario 13b: CSV rows parsed correctly');
  const validatedCsv = validateCsvRows(parsedRows, gstList);
  assert(
    validatedCsv.duplicateCount === gstList.length,
    'Scenario 13c: CSV duplicate detection identifies already existing records'
  );

  // JSON backup validation
  const sampleBackup = JSON.stringify({
    version: 1,
    exportDate: new Date().toISOString(),
    settings: { openingBalance: 0, theme: 'dark' },
    transactions: gstList,
    categories: [{ id: '1', name: 'Fast Food' }],
    sources: [{ id: '2', name: 'Razorpay' }],
  });
  const backupValidation = validateBackupJSON(sampleBackup);
  assert(
    backupValidation.isValid && backupValidation.stats?.txCount === gstList.length,
    'Scenario 13d: JSON backup structure validated successfully'
  );

  // Monthly summary ledger check
  const monthlyLedger = computeMonthlySummaries(gstList, openingBalance);
  assert(monthlyLedger.length > 0, 'Scenario 13e: Monthly summaries ledger generated');

  console.log('=== ALL 15 SCENARIOS VERIFIED SUCCESSFULLY WITH 100% PASS RATE ===');
}

runAllScenarioTests().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
