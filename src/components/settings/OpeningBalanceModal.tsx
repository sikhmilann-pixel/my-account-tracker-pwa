import React, { useState, useEffect } from 'react';
import { IndianRupee, Save } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { paiseToRupees, rupeesToPaise, formatINR } from '../../utils/formatters';

export const OpeningBalanceModal: React.FC = () => {
  const { isOpeningModalOpen, closeOpeningModal, openingBalance, updateOpeningBalance, showToast } =
    useApp();
  const [amountStr, setAmountStr] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpeningModalOpen) {
      const rupees = paiseToRupees(openingBalance);
      setAmountStr(rupees === 0 ? '' : rupees.toString());
      setError(null);
    }
  }, [isOpeningModalOpen, openingBalance]);

  const previewPaise = rupeesToPaise(amountStr);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const paise = rupeesToPaise(amountStr);
    try {
      await updateOpeningBalance(paise);
      showToast(`Opening balance set to ${formatINR(paise)}`);
      closeOpeningModal();
    } catch (err: any) {
      setError(err.message || 'Failed to update opening balance');
    }
  };

  return (
    <Modal
      isOpen={isOpeningModalOpen}
      onClose={closeOpeningModal}
      title="Set Opening Balance"
      subtitle="Initial funds present before tracking transactions"
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Opening Balance Amount (₹)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg">
              ₹
            </span>
            <input
              type="number"
              step="any"
              value={amountStr}
              onChange={(e) => {
                setAmountStr(e.target.value);
                setError(null);
              }}
              placeholder="0.00"
              autoFocus
              className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          {amountStr && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Preview: <span className="font-semibold text-emerald-500">{formatINR(previewPaise)}</span>
            </p>
          )}
        </div>

        {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-navy-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-navy-700/60">
          <strong>Note:</strong> Opening balance is maintained separately from income transactions. It forms the base for calculating your Current Account Balance.
        </p>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={closeOpeningModal}
            className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 font-semibold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save Balance</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
