import React from 'react';
import { useStore } from '../store/useStore';
import { getTranslation } from '../utils/translations';
import { calculateUTMDistance, calculateBearing } from '../utils/utm';
import { Ruler, Trash2, CheckCircle2, X, Route, MapPin, Target } from 'lucide-react';

export const DistanceMeasurePanel: React.FC = () => {
  const isMeasuringMode = useStore((s) => s.isMeasuringMode);
  const measurePoints = useStore((s) => s.measurePoints);
  const language = useStore((s) => s.language);

  const setIsMeasuringMode = useStore((s) => s.setIsMeasuringMode);
  const clearMeasurePoints = useStore((s) => s.clearMeasurePoints);
  const setActiveModal = useStore((s) => s.setActiveModal);

  const isAr = language === 'ar';

  if (!isMeasuringMode) return null;

  // Calculate cumulative distance in meters using UTM distance
  let totalMeters = 0;
  for (let i = 0; i < measurePoints.length - 1; i++) {
    totalMeters += calculateUTMDistance(measurePoints[i].utm, measurePoints[i + 1].utm);
  }

  const kilometers = totalMeters / 1000;
  const startPointName = measurePoints[0]?.fromPointName;

  // Calculate azimuth if 2 or more points
  let azimuth: number | null = null;
  if (measurePoints.length >= 2) {
    const p1 = measurePoints[0];
    const p2 = measurePoints[measurePoints.length - 1];
    azimuth = calculateBearing(p1.lat, p1.lng, p2.lat, p2.lng);
  }

  const handleFinishAndStation = () => {
    setIsMeasuringMode(false);
    setActiveModal('line_stationing');
  };

  return (
    <div className="fixed inset-x-0 bottom-10 z-[2000] pointer-events-none flex justify-center px-4">
      <div className="pointer-events-auto bg-slate-900/95 border-2 border-amber-500/50 rounded-2xl shadow-2xl p-4 w-88 md:w-[26rem] animate-in slide-in-from-bottom-4 duration-200 backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Ruler className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-xs">
                {isAr ? 'قياس مسار حقل مباشر' : 'Live Path Measurement'}
              </h4>
              {startPointName && (
                <p className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>{isAr ? `نقطة البداية: [${startPointName}]` : `Start Point: [${startPointName}]`}</span>
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsMeasuringMode(false)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Instructions banner when only 1 point selected */}
        {measurePoints.length === 1 && (
          <div className="mb-3 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-xs text-amber-300 animate-pulse">
            <Target className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {isAr
                ? 'انقر على الخريطة لتحديد النقطة التالية أو نقطة النهاية 🎯'
                : 'Click on map to select next point or endpoint 🎯'}
            </span>
          </div>
        )}

        {/* Distance Stats Panel */}
        <div className="space-y-2 mb-3">
          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 font-sans block">
                {getTranslation(language, 'totalDistance')}
              </span>
              <span className="font-bold text-amber-400 text-sm font-mono block">
                {totalMeters.toFixed(2)} م
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                ({kilometers.toFixed(3)} كم)
              </span>
            </div>

            <div className="border-r border-slate-800 pr-2">
              <span className="text-[10px] text-slate-400 font-sans block">
                {isAr ? 'انحراف السمت (Azimuth)' : 'Azimuth Bearing'}
              </span>
              <span className="font-bold text-sky-400 text-sm font-mono block">
                {azimuth !== null ? `${azimuth.toFixed(2)}°` : '---'}
              </span>
              <span className="text-[10px] text-slate-500 font-sans">
                {measurePoints.length} {isAr ? 'نقاط مقاسة' : 'points'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {measurePoints.length >= 2 && (
            <button
              onClick={handleFinishAndStation}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
            >
              <Route className="w-4 h-4" />
              <span>{isAr ? 'إنهاء القياس ووضع نقاط على خط مستقيم 🎯' : 'Finish & Station Points on Line 🎯'}</span>
            </button>
          )}

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={clearMeasurePoints}
              disabled={measurePoints.length === 0}
              className="flex-1 py-1.5 px-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>{getTranslation(language, 'resetMeasure')}</span>
            </button>

            <button
              onClick={() => setIsMeasuringMode(false)}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? 'إلغاء' : 'Cancel'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
