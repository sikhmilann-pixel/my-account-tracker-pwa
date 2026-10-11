import { Transaction, TransactionType } from '../types';
import { paiseToRupees, rupeesToPaise, formatKolkataDateTime, parseKolkataDateTime } from './formatters';

/**
 * Generate CSV string with UTF-8 BOM for Excel/Spreadsheet compatibility
 */
export function exportTransactionsToCSV(transactions: Transaction[]): string {
  const headers = ['ID', 'Type', 'Category / Source', 'Amount (INR)', 'Date', 'Time', 'Note'];
  
  const escapeCsv = (str: string | undefined): string => {
    if (str === undefined || str === null) return '""';
    const escaped = String(str).replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const rows = transactions.map((t) => {
    const rupees = (t.amount / 100).toFixed(2);
    return [
      escapeCsv(t.id),
      escapeCsv(t.type === 'income' ? 'Income' : 'Expense'),
      escapeCsv(t.sourceOrCategory),
      rupees,
      escapeCsv(t.date),
      escapeCsv(t.time),
      escapeCsv(t.note || ''),
    ].join(',');
  });

  // UTF-8 BOM to prevent character distortion in Excel
  const bom = '\uFEFF';
  return bom + [headers.join(','), ...rows].join('\r\n');
}

/**
 * Trigger file download in browser
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface CsvParsedRow {
  index: number;
  id?: string;
  type: TransactionType;
  sourceOrCategory: string;
  amountPaise: number;
  amountRupees: number;
  date: string;
  time: string;
  note: string;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
}

/**
 * Parse CSV raw text into rows
 */
export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentValue = '';

  // Strip BOM if present
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xFEFF) {
    cleanText = cleanText.slice(1);
  }

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentValue += '"';
        i++; // skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentValue += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(currentValue.trim());
        currentValue = '';
      } else if (char === '\r') {
        if (nextChar === '\n') i++;
        row.push(currentValue.trim());
        if (row.some(cell => cell.length > 0)) {
          lines.push(row);
        }
        row = [];
        currentValue = '';
      } else if (char === '\n') {
        row.push(currentValue.trim());
        if (row.some(cell => cell.length > 0)) {
          lines.push(row);
        }
        row = [];
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
  }

  if (currentValue.length > 0 || row.length > 0) {
    row.push(currentValue.trim());
    if (row.some(cell => cell.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

/**
 * Validate and prepare CSV rows for preview and import
 */
export function validateCsvRows(
  rows: string[][],
  existingTransactions: Transaction[]
): {
  parsedRows: CsvParsedRow[];
  validCount: number;
  duplicateCount: number;
  errorCount: number;
} {
  if (rows.length === 0) {
    return { parsedRows: [], validCount: 0, duplicateCount: 0, errorCount: 0 };
  }

  const headerRow = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  
  // Find column indices
  let idIdx = headerRow.findIndex((h) => h.includes('id'));
  let typeIdx = headerRow.findIndex((h) => h.includes('type'));
  let categoryIdx = headerRow.findIndex((h) => h.includes('cat') || h.includes('source'));
  let amountIdx = headerRow.findIndex((h) => h.includes('amount') || h.includes('inr') || h.includes('rupee'));
  let dateIdx = headerRow.findIndex((h) => h.includes('date'));
  let timeIdx = headerRow.findIndex((h) => h.includes('time'));
  let noteIdx = headerRow.findIndex((h) => h.includes('note') || h.includes('desc'));

  // Default fallback indices if headers not recognized
  if (typeIdx === -1 && rows[0].length >= 4) {
    // Check if row 0 is actually data or header
    typeIdx = 1;
    categoryIdx = 2;
    amountIdx = 3;
    dateIdx = 4;
    timeIdx = 5;
    noteIdx = 6;
  }

  const dataRows = rows.slice(1);
  const parsedRows: CsvParsedRow[] = [];
  let validCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;

  // Build sets for quick duplicate checking
  const existingIds = new Set(existingTransactions.map((t) => t.id));
  const existingSignatures = new Set(
    existingTransactions.map(
      (t) => `${t.type}_${t.date}_${t.time}_${t.amount}_${t.sourceOrCategory.toLowerCase()}`
    )
  );

  dataRows.forEach((row, idx) => {
    const errors: string[] = [];
    const id = idIdx !== -1 && row[idIdx] ? row[idIdx].trim() : undefined;
    
    // Type validation
    const rawType = (typeIdx !== -1 && row[typeIdx] ? row[typeIdx] : '').toLowerCase();
    let type: TransactionType = 'expense';
    if (rawType.includes('inc') || rawType === 'credit') {
      type = 'income';
    } else if (rawType.includes('exp') || rawType === 'debit') {
      type = 'expense';
    } else {
      errors.push('Invalid type (must be Income or Expense)');
    }

    // Category / Source
    const sourceOrCategory = categoryIdx !== -1 && row[categoryIdx] ? row[categoryIdx].trim() : 'Other';
    if (!sourceOrCategory) {
      errors.push('Category/Source is required');
    }

    // Amount
    const rawAmount = amountIdx !== -1 ? row[amountIdx] : '';
    const amountPaise = rupeesToPaise(rawAmount);
    if (amountPaise <= 0) {
      errors.push('Amount must be greater than 0');
    }

    // Date
    let date = dateIdx !== -1 && row[dateIdx] ? row[dateIdx].trim() : '';
    // Format if e.g. DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = date.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dmyMatch) {
      date = `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
    }
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      errors.push('Invalid date format (expected YYYY-MM-DD or DD/MM/YYYY)');
    }

    // Time
    const rawTime = timeIdx !== -1 && row[timeIdx] ? row[timeIdx].trim() : '12:00 PM';
    const time = rawTime || '12:00 PM';

    // Note
    const note = noteIdx !== -1 && row[noteIdx] ? row[noteIdx].trim() : '';

    // Duplicate check
    let isDuplicate = false;
    if (id && existingIds.has(id)) {
      isDuplicate = true;
    } else {
      const signature = `${type}_${date}_${time}_${amountPaise}_${sourceOrCategory.toLowerCase()}`;
      if (existingSignatures.has(signature)) {
        isDuplicate = true;
      }
    }

    const isValid = errors.length === 0;
    if (!isValid) errorCount++;
    else if (isDuplicate) duplicateCount++;
    else validCount++;

    parsedRows.push({
      index: idx + 1,
      id,
      type,
      sourceOrCategory,
      amountPaise,
      amountRupees: paiseToRupees(amountPaise),
      date,
      time,
      note,
      isValid,
      isDuplicate,
      errors,
    });
  });

  return { parsedRows, validCount, duplicateCount, errorCount };
}
