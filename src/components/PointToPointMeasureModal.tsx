import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { calculateUTMDistance, calculateBearing } from '../utils/utm';
import { Ruler, X, ArrowLeftRight, Compass, MapPin, CheckCircle2, Eye } from 'lucide-react';

export const PointToPointMeasureModal: React.FC = () => {
  const activeModal = useStore((s) => s.activeModal);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const points = useStore((s) => s.points);
  const language = useStore((s) => s.language);
  const pointAMeasureId = useStore((s) => s.pointAMeasureId);
  const pointBMeasureId = useStore((s) => s.pointBMeasureId);
  const setPointToPointMeasure = useStore((s) => s.setPointToPointMeasure);
  const setSelectedPointId = useStore((s) => s.setSelectedPointId);
  const showToast = useStore((s) => s.showToast);

  const isAr = language === 'ar';

  const [ptAId, setPtAId] = useState<string>(pointAMeasureId || (points[0]?.id || ''));
  const [ptBId, setPtBId] = useState<string>(pointBMeasureId || (points[1]?.id || points[0]?.id || ''));

  useEffect(() => {
    if (pointAMeasureId) setPtAId(pointAMeasureId);
    if (pointBMeasureId) setPtBId(pointBMeasureId);
  }, [pointAMeasureId, pointBMeasureId]);

  if (activeModal !== 'two_point_measure') return null;

  const pointA = points.find((p) => p.id === ptAId);
  const pointB = points.find((p) => p.id === ptBId);

  // Measure calculations
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

  const handleApplyToMap = () => {
    if (ptAId && ptBId) {
      setPointToPointMeasure(ptAId, ptBId);
      setSelectedPointId(ptAId);
      showToast(isAr ? 'تم تحديد قياس المسار بين النقطتين على الخريطة 📐' : 'Measurement path applied to map 📐', 'success');
      setActiveModal(null);
    }
  };

  const handleClearMapMeasure = () => {
    setPointToPointMeasure(null, null);
    showToast(isAr ? 'تم إزالة القياس من الخريطة' : 'Map measurement cleared', 'info');
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 pt-safe pb-safe">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                {isAr ? 'حاسبة القياس بين نقطتين' : 'Measure Between Two Points'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'حساب المسافة، الفروقات الانحراف والارتفاع' : 'Distance, azimuth, delta & slope'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {points.length < 2 ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-2xl text-center">
              {isAr
                ? 'يلزم وجود نقطتين على الأقل لإجراء القياس المباشر بينهما.'
                : 'At least two points are required to compute distances.'}
            </div>
          ) : (
            <>
              {/* Point A and Point B Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Point A Dropdown */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-1.5">
                  <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{isAr ? 'النقطة الأولى (A)' : 'First Point (A)'}</span>
                  </label>
                  <select
                    value={ptAId}
                    onChange={(e) => setPtAId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-bold focus:outline-none focus:border-amber-500"
                  >
                    {points.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.name} ({pt.utm.zone}{pt.utm.hemisphere})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Point B Dropdown */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-1.5">
                  <label className="text-[11px] font-bold text-sky-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{isAr ? 'النقطة الثانية (B)' : 'Second Point (B)'}</span>
                  </label>
                  <select
                    value={ptBId}
                    onChange={(e) => setPtBId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-bold focus:outline-none focus:border-sky-500"
                  >
                    {points.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.name} ({pt.utm.zone}{pt.utm.hemisphere})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Measurement Results Grid */}
              <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Compass className="w-4 h-4" />
                    <span>{isAr ? 'نتائج القياس الحسابي المباشر' : 'Calculated Survey Results'}</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">2D Euclidean / UTM</span>
                </div>

                {/* Direct Distance Hero metric */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center space-y-1">
                  <span className="text-[10px] text-amber-300 font-bold block">
                    {isAr ? 'المسافة الأفقية المباشرة (Horizontal Distance)' : 'Direct Horizontal Distance'}
                  </span>
                  <div className="font-mono text-xl font-extrabold text-amber-400">
                    {distanceMeters.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} م (m)
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {(distanceMeters / 1000).toFixed(3)} km | {(distanceMeters * 3.28084).toFixed(2)} ft
                  </div>
                </div>

                {/* Deltas & Azimuth Bearing Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">
                      {isAr ? 'فرق الإحداثي الشرقي (ΔE)' : 'Delta Easting (ΔE)'}
                    </span>
                    <span className={`font-bold ${deltaEasting >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {deltaEasting >= 0 ? `+${deltaEasting.toFixed(2)}` : deltaEasting.toFixed(2)} m
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">
                      {isAr ? 'فرق الإحداثي الشمالي (ΔN)' : 'Delta Northing (ΔN)'}
                    </span>
                    <span className={`font-bold ${deltaNorthing >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                      {deltaNorthing >= 0 ? `+${deltaNorthing.toFixed(2)}` : deltaNorthing.toFixed(2)} m
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">
                      {isAr ? 'انحراف السمت (Azimuth)' : 'Azimuth Bearing'}
                    </span>
                    <span className="font-bold text-amber-300">{bearingDegrees.toFixed(2)}°</span>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">
                      {isAr ? 'فرق الارتفاع (ΔZ)' : 'Delta Elevation (ΔZ)'}
                    </span>
                    <span className="font-bold text-purple-300">
                      {deltaElevation !== null
                        ? `${deltaElevation >= 0 ? '+' : ''}${deltaElevation.toFixed(2)} m`
                        : 'غير متوفر'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleClearMapMeasure}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  {isAr ? 'إلغاء تحديد المسار' : 'Clear Map Path'}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    {isAr ? 'إغلاق' : 'Close'}
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyToMap}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{isAr ? 'توضيح المسار على الخريطة' : 'Highlight on Map'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
