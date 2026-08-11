import React from 'react';
import { useStore } from '../store/useStore';
import { calculateUTMDistance, calculateBearing } from '../utils/utm';
import {
  Ruler,
  X,
  ArrowLeftRight,
  Compass,
  MapPin,
  RefreshCw,
  Target,
  ChevronDown,
} from 'lucide-react';

export const OnMapMeasureHUD: React.FC = () => {
  const pointAMeasureId = useStore((s) => s.pointAMeasureId);
  const pointBMeasureId = useStore((s) => s.pointBMeasureId);
  const points = useStore((s) => s.points);
  const language = useStore((s) => s.language);
  const setPointToPointMeasure = useStore((s) => s.setPointToPointMeasure);
  const setSelectedPointId = useStore((s) => s.setSelectedPointId);
  const showToast = useStore((s) => s.showToast);

  const isAr = language === 'ar';

  if (!pointAMeasureId) return null;

  const pointA = points.find((p) => p.id === pointAMeasureId);
  const pointB = points.find((p) => p.id === pointBMeasureId);

  const handleClear = () => {
    setPointToPointMeasure(null, null);
    showToast(isAr ? 'تم إنهاء القياس' : 'Measurement closed', 'info');
  };

  const handleSwap = () => {
    if (pointAMeasureId && pointBMeasureId) {
      setPointToPointMeasure(pointBMeasureId, pointAMeasureId);
      showToast(isAr ? 'تم عكس اتجاه القياس B ➔ A' : 'Measurement direction swapped', 'info');
    }
  };

  const handleSelectB = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val) {
      setPointToPointMeasure(pointAMeasureId, val);
      setSelectedPointId(val);
    }
  };

  // Calculations
  let distanceMeters = 0;
  let deltaEasting = 0;
  let deltaNorthing = 0;
  let deltaElevation: number | null = null;
  let bearingDegrees = 0;

  if (pointA && pointB) {
    distanceMeters = Math.round(calculateUTMDistance(pointA.utm, pointB.utm) * 100) / 100;
    deltaEasting = Math.round((pointB.utm.easting - pointA.utm.easting) * 100) / 100;
    deltaNorthing = Math.round((pointB.utm.northing - pointA.utm.northing) * 100) / 100;

    if (pointA.elevation !== undefined && pointB.elevation !== undefined) {
      deltaElevation = Math.round((pointB.elevation - pointA.elevation) * 100) / 100;
    }

    bearingDegrees = calculateBearing(pointA.lat, pointA.lng, pointB.lat, pointB.lng);
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[2200] w-[92%] max-w-lg animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="bg-slate-900/95 border-2 border-amber-500/50 rounded-2xl shadow-2xl p-3 sm:p-4 backdrop-blur-xl text-slate-100 space-y-3">
        {/* Header / Route Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <Ruler className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs text-amber-300 flex items-center gap-1.5 truncate">
                <span>{pointA?.name || (isAr ? 'النقطة أ' : 'Point A')}</span>
                {pointB && <span className="text-slate-400">➔</span>}
                {pointB && <span className="text-sky-300">{pointB.name}</span>}
              </h4>
              <p className="text-[10px] text-slate-400">
                {isAr ? 'قياس حقل مباشر على الخريطة' : 'Live On-Map Survey Measurement'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClear}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            title={isAr ? 'إغلاق القياس' : 'Close Measurement'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* State A: Point B not selected yet */}
        {!pointB ? (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 animate-pulse">
              <Target className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                {isAr
                  ? 'انقر على أي نقطة على الخريطة لاختيار الهدف (النقطة ب)'
                  : 'Click any point on map to set Target (Point B)'}
              </span>
            </div>

            {/* Alternative: Select Point B from dropdown */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-400 shrink-0">
                {isAr ? 'أو اختر من القائمة:' : 'Or pick from list:'}
              </span>
              <select
                onChange={handleSelectB}
                defaultValue=""
                className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:border-amber-500"
              >
                <option value="" disabled>
                  {isAr ? '-- اختر نقطة الهدف ب --' : '-- Select Target B --'}
                </option>
                {points
                  .filter((p) => p.id !== pointAMeasureId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.utm.zone}{p.utm.hemisphere})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        ) : (
          /* State B: Both Points A & B selected -> Display Metrics */
          <div className="space-y-2">
            {/* Direct Distance & Azimuth Main Banner */}
            <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl grid grid-cols-2 gap-2 text-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">
                  {isAr ? 'المسافة الأفقية (Distance)' : 'Horizontal Distance'}
                </span>
                <span className="font-mono text-base sm:text-lg font-extrabold text-amber-400 block">
                  {distanceMeters.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  م
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {(distanceMeters / 1000).toFixed(3)} km
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold block">
                  {isAr ? 'انحراف السمت (Azimuth)' : 'Azimuth Bearing'}
                </span>
                <span className="font-mono text-base sm:text-lg font-extrabold text-sky-400 block">
                  {bearingDegrees.toFixed(2)}°
                </span>
                <span className="text-[10px] text-slate-400 font-sans">
                  {isAr ? 'اتجاه السمت الدائري' : 'Compass Bearing'}
                </span>
              </div>
            </div>

            {/* Coordinate Deltas Bar */}
            <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono text-center">
              <div className="p-1.5 bg-slate-950/80 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">ΔEasting (ΔE)</span>
                <span className={`font-bold ${deltaEasting >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {deltaEasting >= 0 ? `+${deltaEasting.toFixed(2)}` : deltaEasting.toFixed(2)}m
                </span>
              </div>

              <div className="p-1.5 bg-slate-950/80 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">ΔNorthing (ΔN)</span>
                <span className={`font-bold ${deltaNorthing >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                  {deltaNorthing >= 0 ? `+${deltaNorthing.toFixed(2)}` : deltaNorthing.toFixed(2)}m
                </span>
              </div>

              <div className="p-1.5 bg-slate-950/80 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">ΔElev (ΔZ)</span>
                <span className="font-bold text-purple-300">
                  {deltaElevation !== null
                    ? `${deltaElevation >= 0 ? '+' : ''}${deltaElevation.toFixed(2)}m`
                    : '---'}
                </span>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between gap-1.5 pt-1">
              <button
                onClick={handleSwap}
                className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isAr ? 'عكس (B ➔ A)' : 'Swap (B ➔ A)'}</span>
              </button>

              <div className="flex items-center gap-1">
                <select
                  value={pointBMeasureId || ''}
                  onChange={handleSelectB}
                  className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold focus:outline-none"
                >
                  {points
                    .filter((p) => p.id !== pointAMeasureId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>

                <button
                  onClick={handleClear}
                  className="py-1 px-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition-colors"
                >
                  {isAr ? 'إنهاء' : 'Clear'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
