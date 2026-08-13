import React from 'react';
import { useStore } from '../store/useStore';
import { getTranslation } from '../utils/translations';
import { calculateHaversineDistance } from '../utils/utm';
import { Ruler, Trash2, CheckCircle2, X, Route } from 'lucide-react';

export const DistanceMeasurePanel: React.FC = () => {
  const isMeasuringMode = useStore((s) => s.isMeasuringMode);
  const measurePoints = useStore((s) => s.measurePoints);
  const language = useStore((s) => s.language);

  const setIsMeasuringMode = useStore((s) => s.setIsMeasuringMode);
  const clearMeasurePoints = useStore((s) => s.clearMeasurePoints);
  const setActiveModal = useStore((s) => s.setActiveModal);

  const isAr = language === 'ar';

  if (!isMeasuringMode) return null;

  // Calculate cumulative distance in meters
  let totalMeters = 0;
  for (let i = 0; i < measurePoints.length - 1; i++) {
    totalMeters += calculateHaversineDistance(
      measurePoints[i].lat,
      measurePoints[i].lng,
      measurePoints[i + 1].lat,
      measurePoints[i + 1].lng
    );
  }

  const kilometers = totalMeters / 1000;

  return (
    <div className="fixed inset-x-0 bottom-12 z-[2000] pointer-events-none flex justify-center px-4">
      <div className="pointer-events-auto bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl p-4 w-80 md:w-96 animate-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Ruler className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-slate-100 text-xs">
            {getTranslation(language, 'measureDistance')}
          </h4>
        </div>

        <button
          onClick={() => setIsMeasuringMode(false)}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono">
          <span className="text-slate-400 font-sans">{getTranslation(language, 'totalDistance')}</span>
          <span className="font-bold text-amber-400 text-sm">
            {totalMeters > 1000 ? `${kilometers.toFixed(3)} km` : `${totalMeters.toFixed(2)} m`}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>عدد نقاط المسار المقاسة: <span className="text-slate-200 font-bold font-mono">{measurePoints.length}</span></span>
          {measurePoints.length >= 2 && (
            <button
              onClick={() => setActiveModal('line_stationing')}
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 hover:underline"
            >
              <Route className="w-3.5 h-3.5" />
              <span>{isAr ? 'تثبيت نقاط المسار' : 'Stationing Points'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={clearMeasurePoints}
          disabled={measurePoints.length === 0}
          className="flex-1 py-1.5 px-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span>{getTranslation(language, 'resetMeasure')}</span>
        </button>

        {measurePoints.length >= 2 && (
          <button
            onClick={() => setActiveModal('line_stationing')}
            className="flex-1 py-1.5 px-3 rounded-xl bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <Route className="w-3.5 h-3.5" />
            <span>{isAr ? 'تثبيت نقاط الطريق' : 'Stationing'}</span>
          </button>
        )}

        <button
          onClick={() => setIsMeasuringMode(false)}
          className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>إغلاق</span>
        </button>
      </div>
    </div>
  </div>
  );
};
