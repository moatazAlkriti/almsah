import React from 'react';
import { useStore } from '../store/useStore';
import { RotateCcw, Check, Move } from 'lucide-react';

export const MoveToast: React.FC = () => {
  const lastMovedPoint = useStore((s) => s.lastMovedPoint);
  const language = useStore((s) => s.language);
  const revertLastMove = useStore((s) => s.revertLastMove);
  const dismissLastMove = useStore((s) => s.dismissLastMove);

  if (!lastMovedPoint) return null;

  const isAr = language === 'ar';

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[3500] max-w-md w-[92vw] animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="bg-slate-900/95 border border-emerald-500/50 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 text-xs text-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Move className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-100 line-clamp-1">
              {lastMovedPoint.pointName}
            </div>
            <div className="text-[11px] text-emerald-300 font-mono">
              {isAr ? 'تم نقل النقطة بمقدار:' : 'Moved distance:'}{' '}
              <span className="font-bold text-amber-400">
                {lastMovedPoint.distanceMeters.toFixed(2)} م
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={revertLastMove}
            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
            title={isAr ? 'تراجع عن التحريك' : 'Revert move'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isAr ? 'تراجع' : 'Revert'}</span>
          </button>

          <button
            onClick={dismissLastMove}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-md transition-all active:scale-95"
            title={isAr ? 'تثبيت الموقع الجديد' : 'Keep position'}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isAr ? 'تثبيت' : 'Keep'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
