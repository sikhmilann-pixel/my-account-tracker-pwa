import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle2, Copy, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { parseCSV, validateCsvRows, CsvParsedRow } from '../../utils/csv';
import { formatINR, parseKolkataDateTime } from '../../utils/formatters';
import { Transaction } from '../../types';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose }) => {
  const { transactions, showToast } = useApp();
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [parsedData, setParsedData] = useState<{
    parsedRows: CsvParsedRow[];
    validCount: number;
    duplicateCount: number;
    errorCount: number;
  } | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setFileContent(text);
        const matrix = parseCSV(text);
        if (matrix.length < 2) {
          setErrorMessage('CSV file appears empty or contains only headers.');
          setParsedData(null);
          return;
        }
        const validated = validateCsvRows(matrix, transactions);
        setParsedData(validated);
      } catch (err: any) {
        setErrorMessage(`Error parsing CSV: ${err.message}`);
        setParsedData(null);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Could not read file.');
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!parsedData || parsedData.validCount === 0) return;
    setIsImporting(true);

    try {
      const rowsToImport = parsedData.parsedRows.filter((r) => {
        if (!r.isValid) return false;
        if (skipDuplicates && r.isDuplicate) return false;
        return true;
      });

      if (rowsToImport.length === 0) {
        setErrorMessage('No eligible rows to import based on your duplicate settings.');
        setIsImporting(false);
        return;
      }

      const txList: Transaction[] = rowsToImport.map((row) => ({
        id: row.id || `tx_csv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: row.type,
        amount: row.amountPaise,
        sourceOrCategory: row.sourceOrCategory,
        date: row.date,
        time: row.time,
        timestamp: parseKolkataDateTime(row.date, row.time),
        note: row.note || undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));

      await db.transactions.bulkPut(txList);
      showToast(`Successfully imported ${txList.length} transactions`);
      handleReset();
      onClose();
    } catch (err: any) {
      setErrorMessage(`Failed to import: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFileContent(null);
    setFileName('');
    setParsedData(null);
    setErrorMessage(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Transactions from CSV"
      subtitle="Validate and preview before importing"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Upload State */}
        {!parsedData ? (
          <div>
            <div className="border-2 border-dashed border-slate-300 dark:border-navy-700 rounded-2xl p-8 text-center hover:border-emerald-500 transition cursor-pointer relative bg-slate-50 dark:bg-navy-800/40">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                Choose a CSV backup file or drag it here
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Supports UTF-8 CSV with columns: Type, Category/Source, Amount, Date, Time, Note
              </p>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 mt-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 text-xs font-semibold border border-rose-200 dark:border-rose-900/50">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        ) : (
          /* Preview and Validation State */
          <div className="space-y-4">
            {/* File info and Stats */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-700">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-xs">
                  {fileName}
                </span>
              </div>
              <button
                onClick={handleReset}
                className="text-xs text-rose-500 font-semibold hover:underline"
              >
                Choose another file
              </button>
            </div>

            {/* Validation Badges */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                  Valid Rows
                </span>
                <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {parsedData.validCount}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50">
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">
                  Duplicates
                </span>
                <p className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                  {parsedData.duplicateCount}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50">
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase">
                  Errors
                </span>
                <p className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                  {parsedData.errorCount}
                </p>
              </div>
            </div>

            {/* Duplicate handling setting */}
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/60 dark:border-navy-700 cursor-pointer">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Skip duplicate transactions automatically (Recommended)
              </span>
            </label>

            {/* Rows Preview Table */}
            <div className="border border-slate-200 dark:border-navy-700 rounded-xl max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 sticky top-0">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Category/Source</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Date & Time</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                  {parsedData.parsedRows.slice(0, 30).map((row) => (
                    <tr
                      key={row.index}
                      className={
                        !row.isValid
                          ? 'bg-rose-50/50 dark:bg-rose-950/20'
                          : row.isDuplicate
                          ? 'bg-amber-50/50 dark:bg-amber-950/20'
                          : ''
                      }
                    >
                      <td className="p-2 text-slate-400">{row.index}</td>
                      <td className="p-2 font-bold capitalize">
                        <span
                          className={row.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td className="p-2 text-slate-800 dark:text-slate-200 font-medium">
                        {row.sourceOrCategory}
                      </td>
                      <td className="p-2 font-bold">{formatINR(row.amountPaise)}</td>
                      <td className="p-2 text-slate-500">
                        {row.date} {row.time}
                      </td>
                      <td className="p-2">
                        {!row.isValid ? (
                          <span className="text-[10px] font-bold text-rose-500">
                            {row.errors[0] || 'Invalid'}
                          </span>
                        ) : row.isDuplicate ? (
                          <span className="text-[10px] font-bold text-amber-500">Duplicate</span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-500">Ready</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {parsedData.parsedRows.length > 30 && (
              <p className="text-[11px] text-slate-400 text-center">
                Showing first 30 of {parsedData.parsedRows.length} rows
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 font-semibold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isImporting || parsedData.validCount === 0}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isImporting
                    ? 'Importing...'
                    : `Import Valid Rows (${
                        skipDuplicates
                          ? parsedData.validCount
                          : parsedData.validCount + parsedData.duplicateCount
                      })`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
