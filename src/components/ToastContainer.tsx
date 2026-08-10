import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const toast = useStore((s) => s.toast);
  const hideToast = useStore((s) => s.hideToast);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      hideToast();
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast, hideToast]);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
    error: <XCircle className="w-4 h-4 text-rose-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-sky-400 shrink-0" />,
  };

  const borderColors = {
    success: 'border-emerald-500/50 bg-emerald-950/95 text-emerald-100',
    warning: 'border-amber-500/50 bg-amber-950/95 text-amber-100',
    error: 'border-rose-500/50 bg-rose-950/95 text-rose-100',
    info: 'border-sky-500/50 bg-slate-900/95 text-slate-100',
  };

  const type = toast.type || 'info';

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[4000] max-w-md w-[90vw] animate-in fade-in slide-in-from-top-4 duration-200">
      <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl ${borderColors[type]}`}>
        <div className="flex items-center gap-2.5 text-xs font-semibold">
          {icons[type]}
          <span>{toast.text}</span>
        </div>

        <button
          onClick={hideToast}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
