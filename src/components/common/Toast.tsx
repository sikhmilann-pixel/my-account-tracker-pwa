import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Toast: React.FC = () => {
  const { toastMessage } = useApp();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 animate-bounce-in max-w-sm">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-900/95 dark:bg-navy-800/95 text-white border border-slate-700/50 dark:border-navy-600 rounded-xl shadow-2xl backdrop-blur-md">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <span className="text-sm font-medium tracking-wide">{toastMessage}</span>
      </div>
    </div>
  );
};
