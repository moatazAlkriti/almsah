import React from 'react';
import { useStore } from '../store/useStore';
import { getTranslation } from '../utils/translations';
import { calculateUTMDistance } from '../utils/utm';
import {
  Ruler,
  Trash2,
  CheckCircle2,
  X,
  MapPin,
  Target,
  Undo2,
} from 'lucide-react';

export const DistanceMeasurePanel: React.FC = () => {
  const isMeasuringMode = useStore((s) => s.isMeasuringMode);
  const measurePoints = useStore((s) => s.measurePoints);
  const language = useStore((s) => s.language);

  const setIsMeasuringMode = useStore((s) => s.setIsMeasuringMode);
  const undoMeasurePoint = useStore((s) => s.undoMeasurePoint);
  const clearMeasurePoints = useStore((s) => s.clearMeasurePoints);

  const isAr = language === 'ar';

  if (!isMeasuringMode) return null;

  // Calculate cumulative distance
  let totalMeters = 0;
  for (let i = 0; i < measurePoints.length - 1; i++) {
    const p1 = measurePoints[i];
    const p2 = measurePoints[i + 1];
    totalMeters += calculateUTMDistance(p1.utm, p2.utm);
  }

  const kilometers = totalMeters / 1000;
  const startPointName = measurePoints[0]?.fromPointName;

  return (
    <div
      id="distance-measure-panel"
      className="fixed inset-x-0 bottom-6 z-[2000] pointer-events-none flex justify-center px-2"
    >
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="pointer-events-auto bg-slate-900/95 border border-amber-500/60 rounded-2xl shadow-xl p-2.5 w-full max-w-[280px] animate-in slide-in-from-bottom-4 duration-200 backdrop-blur-xl text-slate-100 space-y-2"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shadow-inner shrink-0">
              <Ruler className="w-3 h-3" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-slate-100 text-xs">
                  {isAr ? 'أداة القياس' : 'Measurement Tool'}
                </h4>
                {measurePoints.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                    {measurePoints.length} {isAr ? 'نقطة' : 'pts'}
                  </span>
                )}
              </div>
              {startPointName ? (
                <p className="text-[9px] text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                  <span>
                    {isAr
                      ? `البداية: [${startPointName}]`
                      : `Start: [${startPointName}]`}
                  </span>
                </p>
              ) : (
                <p className="text-[9px] text-slate-400 mt-0.5">
                  {isAr
                    ? 'انقر بالخريطة للقياس'
                    : 'Click map to measure'}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsMeasuringMode(false)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dynamic Help Status Banner */}
        {measurePoints.length === 0 && (
          <div className="p-1.5 bg-sky-500/10 border border-sky-500/30 rounded-lg flex items-center gap-1.5 text-[10px] text-sky-300">
            <Target className="w-3 h-3 text-sky-400 shrink-0 animate-pulse" />
            <span>
              {isAr
                ? 'انقر للبدء 🎯'
                : 'Click to start 🎯'}
            </span>
          </div>
        )}

        {measurePoints.length === 1 && (
          <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-1.5 text-[10px] text-amber-300 animate-pulse">
            <Target className="w-3 h-3 text-amber-400 shrink-0" />
            <span>
              {isAr
                ? 'حرك للقياس الحي، انقر للإضافة'
                : 'Move to measure, click to add'}
            </span>
          </div>
        )}

        {/* Distance Main Stats Card */}
        <div className="bg-slate-950/90 p-2 rounded-xl border border-slate-800 text-center space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold block">
            {getTranslation(language, 'totalDistance')}
          </span>
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="font-mono text-lg font-black text-amber-400 tracking-tight">
              {totalMeters.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-amber-300 font-bold text-xs">
              {isAr ? 'م' : 'm'}
            </span>
          </div>
          {totalMeters >= 1000 && (
            <span className="text-[10px] text-slate-400 font-mono block">
              ({kilometers.toFixed(3)} {isAr ? 'كم' : 'km'})
            </span>
          )}
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-col gap-1.5 pt-0.5">
          <div className="flex items-center gap-1.5">
            {/* Undo Button */}
            <button
              onClick={undoMeasurePoint}
              disabled={measurePoints.length === 0}
              className="flex-1 py-1.5 px-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 disabled:opacity-40 text-slate-200 text-[10px] font-semibold flex items-center justify-center gap-1 transition-all"
              title={isAr ? 'تراجع' : 'Undo'}
            >
              <Undo2 className="w-3 h-3 text-amber-400" />
              <span>{isAr ? 'تراجع' : 'Undo'}</span>
            </button>

            {/* Reset Button */}
            <button
              onClick={clearMeasurePoints}
              disabled={measurePoints.length === 0}
              className="flex-1 py-1.5 px-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-[10px] font-semibold flex items-center justify-center gap-1 transition-all"
              title={isAr ? 'تصفير' : 'Reset'}
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
              <span>{getTranslation(language, 'resetMeasure')}</span>
            </button>

            {/* Finish & Close Button */}
            <button
              onClick={() => setIsMeasuringMode(false)}
              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>{isAr ? 'إنهاء' : 'Done'}</span>
            </button>
          </div>

          <button
            onClick={() => useStore.getState().setActiveModal('line_stationing')}
            disabled={measurePoints.length === 0}
            className="w-full py-1.5 px-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <MapPin className="w-3 h-3" />
            <span>{isAr ? 'إنهاء القياس وإعدادات التثبيت' : 'Finish & Stationing'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
