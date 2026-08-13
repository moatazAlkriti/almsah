import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
  X,
  Route,
  Compass,
  MapPin,
  Sparkles,
  Plus,
  CheckCircle2,
  Sliders,
  Layers,
  ArrowRightLeft,
  ListOrdered,
  Ruler
} from 'lucide-react';
import { SurveyPoint, UTMCoordinate, AnnotationLine } from '../types';
import {
  latLngToUTM,
  utmToLatLng,
  calculateUTMDistance,
  getUTMZoneFromLng,
  getHemisphereFromLat,
  formatUTMCompact
} from '../utils/utm';
import { fetchElevation } from '../utils/elevation';

interface GeneratedStationPoint {
  stationDist: number; // e.g. 0, 20, 40 meters
  stationName: string;
  lat: number;
  lng: number;
  utm: UTMCoordinate;
  elevation?: number;
}

export const LineStationingModal: React.FC = () => {
  const activeModal = useStore((s) => s.activeModal);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const language = useStore((s) => s.language);
  const measurePoints = useStore((s) => s.measurePoints);
  const annotations = useStore((s) => s.annotations);
  const addPoint = useStore((s) => s.addPoint);
  const showToast = useStore((s) => s.showToast);
  const autoFetchElevation = useStore((s) => s.autoFetchElevation);
  const categories = useStore((s) => s.categories);
  const addCategory = useStore((s) => s.addCategory);

  const isAr = language === 'ar';

  // State
  const [sourceType, setSourceType] = useState<'measure' | 'line' | 'manual'>('measure');
  const [selectedLineId, setSelectedLineId] = useState<string>('');
  
  // Manual endpoints
  const [manualStartEasting, setManualStartEasting] = useState<string>('');
  const [manualStartNorthing, setManualStartNorthing] = useState<string>('');
  const [manualEndEasting, setManualEndEasting] = useState<string>('');
  const [manualEndNorthing, setManualEndNorthing] = useState<string>('');
  const [manualZone, setManualZone] = useState<number>(37);
  const [manualStartElev, setManualStartElev] = useState<string>('');
  const [manualEndElev, setManualEndElev] = useState<string>('');

  // Stationing config
  const [intervalMode, setIntervalMode] = useState<'distance' | 'count'>('distance');
  const [stepDistance, setStepDistance] = useState<number>(20); // 20 meters default for road paving
  const [pointCount, setPointCount] = useState<number>(10);
  const [startStation, setStartStation] = useState<number>(0); // 0+000
  const [namingFormat, setNamingFormat] = useState<'chainage' | 'station' | 'point' | 'custom'>('chainage');
  const [customPrefix, setCustomPrefix] = useState<string>('P');
  const [includeEndpoints, setIncludeEndpoints] = useState<boolean>(true);
  const [category, setCategory] = useState<string>('نقاط مسار / تبليط');

  // Preview generated points
  const [previewPoints, setPreviewPoints] = useState<GeneratedStationPoint[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Line annotations
  const lineAnnotations = annotations.filter((a): a is AnnotationLine => a.type === 'line');

  useEffect(() => {
    if (activeModal === 'line_stationing') {
      if (measurePoints.length >= 2) {
        setSourceType('measure');
      } else if (lineAnnotations.length > 0) {
        setSourceType('line');
        setSelectedLineId(lineAnnotations[0].id);
      } else {
        setSourceType('manual');
      }
    }
  }, [activeModal, measurePoints.length, lineAnnotations.length]);

  if (activeModal !== 'line_stationing') return null;

  // Helper to format station name
  const formatStationName = (distMeters: number, index: number) => {
    const totalDist = startStation + distMeters;
    if (namingFormat === 'chainage') {
      // CH 0+020
      const km = Math.floor(totalDist / 1000);
      const m = Math.round((totalDist % 1000) * 100) / 100;
      const mStr = m < 10 ? `00${m}` : m < 100 ? `0${m}` : `${m}`;
      return `CH ${km}+${mStr}`;
    } else if (namingFormat === 'station') {
      // STA 0+020
      const km = Math.floor(totalDist / 1000);
      const m = Math.round((totalDist % 1000) * 100) / 100;
      const mStr = m < 10 ? `00${m}` : m < 100 ? `0${m}` : `${m}`;
      return `STA ${km}+${mStr}`;
    } else if (namingFormat === 'point') {
      return isAr ? `نقطة مسار ${index + 1}` : `Station ${index + 1}`;
    } else {
      return `${customPrefix} ${index + 1}`;
    }
  };

  // Get polyline nodes depending on sourceType
  const getPolylineNodes = (): { lat: number; lng: number; utm: UTMCoordinate; elevation?: number }[] => {
    if (sourceType === 'measure' && measurePoints.length >= 2) {
      return measurePoints.map((m) => ({ lat: m.lat, lng: m.lng, utm: m.utm }));
    }

    if (sourceType === 'line' && selectedLineId) {
      const line = lineAnnotations.find((l) => l.id === selectedLineId);
      if (line && line.points.length >= 2) {
        return line.points.map((pt) => ({ lat: pt.lat, lng: pt.lng, utm: pt.utm }));
      }
    }

    if (sourceType === 'manual') {
      const e1 = parseFloat(manualStartEasting);
      const n1 = parseFloat(manualStartNorthing);
      const e2 = parseFloat(manualEndEasting);
      const n2 = parseFloat(manualEndNorthing);
      const el1 = manualStartElev ? parseFloat(manualStartElev) : undefined;
      const el2 = manualEndElev ? parseFloat(manualEndElev) : undefined;

      if (!isNaN(e1) && !isNaN(n1) && !isNaN(e2) && !isNaN(n2)) {
        const utm1: UTMCoordinate = { easting: e1, northing: n1, zone: manualZone, hemisphere: 'N' };
        const utm2: UTMCoordinate = { easting: e2, northing: n2, zone: manualZone, hemisphere: 'N' };
        const pt1 = utmToLatLng(utm1);
        const pt2 = utmToLatLng(utm2);
        return [
          { lat: pt1.lat, lng: pt1.lng, utm: utm1, elevation: el1 },
          { lat: pt2.lat, lng: pt2.lng, utm: utm2, elevation: el2 },
        ];
      }
    }

    return [];
  };

  // Generate Station Points
  const handleCalculatePreview = () => {
    const nodes = getPolylineNodes();
    if (nodes.length < 2) {
      showToast(
        isAr
          ? 'يرجى تحديد مسار صالح يحتوي على نقطتين على الأقل'
          : 'Please select a valid path with at least 2 points',
        'warning'
      );
      return;
    }

    // Calculate segment lengths along polyline
    let cumulativeDistances: number[] = [0];
    let totalLength = 0;

    for (let i = 0; i < nodes.length - 1; i++) {
      const segDist = calculateUTMDistance(nodes[i].utm, nodes[i + 1].utm);
      totalLength += segDist;
      cumulativeDistances.push(totalLength);
    }

    if (totalLength === 0) {
      showToast(isAr ? 'طول المسار المحسوب يساوي صفراً' : 'Path length is zero', 'warning');
      return;
    }

    // Determine station target distances
    let targetDistances: number[] = [];

    if (intervalMode === 'distance') {
      const step = Math.max(0.5, stepDistance);
      let cur = 0;
      while (cur <= totalLength) {
        targetDistances.push(cur);
        cur += step;
      }
      if (includeEndpoints && Math.abs(targetDistances[targetDistances.length - 1] - totalLength) > 0.01) {
        targetDistances.push(totalLength);
      }
    } else {
      const count = Math.max(2, pointCount);
      const step = totalLength / (count - 1);
      for (let i = 0; i < count; i++) {
        targetDistances.push(i * step);
      }
    }

    // Remove duplicates & sort
    targetDistances = Array.from(new Set(targetDistances.map((d) => Math.round(d * 100) / 100))).sort(
      (a, b) => a - b
    );

    // Interpolate points along polyline
    const generated: GeneratedStationPoint[] = [];

    targetDistances.forEach((targetD, idx) => {
      // Find segment
      let segIdx = 0;
      for (let i = 0; i < cumulativeDistances.length - 1; i++) {
        if (targetD >= cumulativeDistances[i] && targetD <= cumulativeDistances[i + 1]) {
          segIdx = i;
          break;
        }
        if (i === cumulativeDistances.length - 2 && targetD >= cumulativeDistances[i + 1]) {
          segIdx = i;
        }
      }

      const segStartD = cumulativeDistances[segIdx];
      const segEndD = cumulativeDistances[segIdx + 1];
      const segLen = segEndD - segStartD;

      const ratio = segLen > 0 ? Math.min(1, Math.max(0, (targetD - segStartD) / segLen)) : 0;

      const pStart = nodes[segIdx];
      const pEnd = nodes[segIdx + 1];

      // Linear interpolation in UTM space
      const easting = pStart.utm.easting + ratio * (pEnd.utm.easting - pStart.utm.easting);
      const northing = pStart.utm.northing + ratio * (pEnd.utm.northing - pStart.utm.northing);

      let elevation: number | undefined = undefined;
      if (pStart.elevation !== undefined && pEnd.elevation !== undefined) {
        elevation = pStart.elevation + ratio * (pEnd.elevation - pStart.elevation);
        elevation = Math.round(elevation * 100) / 100;
      }

      const interpUtm: UTMCoordinate = {
        easting: Math.round(easting * 100) / 100,
        northing: Math.round(northing * 100) / 100,
        zone: pStart.utm.zone,
        hemisphere: pStart.utm.hemisphere,
      };

      const geo = utmToLatLng(interpUtm);
      const name = formatStationName(targetD, idx);

      generated.push({
        stationDist: targetD,
        stationName: name,
        lat: geo.lat,
        lng: geo.lng,
        utm: interpUtm,
        elevation,
      });
    });

    setPreviewPoints(generated);
  };

  // Save points to store
  const handleSavePoints = async () => {
    if (previewPoints.length === 0) {
      showToast(isAr ? 'قم بحساب المعاينة أولاً' : 'Calculate preview points first', 'warning');
      return;
    }

    setIsGenerating(true);

    if (category && !categories.includes(category)) {
      addCategory(category);
    }

    let savedCount = 0;

    for (const pt of previewPoints) {
      let elev = pt.elevation;
      if (elev === undefined && autoFetchElevation) {
        try {
          elev = (await fetchElevation(pt.lat, pt.lng)) ?? undefined;
        } catch (e) {
          // ignore error
        }
      }

      addPoint({
        name: pt.stationName,
        utm: pt.utm,
        lat: pt.lat,
        lng: pt.lng,
        category: category || 'نقاط مسار / تبليط',
        description: `محطة مسافة ${pt.stationDist.toFixed(2)}m على المسار`,
        elevation: elev,
        color: '#3b82f6', // Bright blue for stationing
      });
      savedCount++;
    }

    setIsGenerating(false);
    showToast(
      isAr
        ? `تم تثبيت ${savedCount} نقطة مسار بنجاح 🛣️`
        : `Successfully added ${savedCount} station points 🛣️`,
      'success'
    );
    setActiveModal(null);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
              <Route className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isAr ? 'تثبيت نقاط المسار / خط التبليط' : 'Road Stationing & Line Points'}
              </h2>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'توزيع نقاط مساحية متساوية الفواصل على خط مستقيم أو مسار محدد'
                  : 'Generate equally spaced survey points along a line or pavement path'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
          {/* Section 1: Source Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              {isAr ? 'مصدر المسار (طريقة التحديد)' : 'Path Source'}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSourceType('measure')}
                className={`p-4 rounded-2xl border flex flex-col items-start gap-2 text-start transition-all ${
                  sourceType === 'measure'
                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <Ruler className="w-5 h-5" />
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-900/60 border border-slate-700">
                    {measurePoints.length} {isAr ? 'نقاط' : 'pts'}
                  </span>
                </div>
                <span className="font-semibold text-sm">
                  {isAr ? 'مسار القياس الحالي' : 'Current Measure Path'}
                </span>
                <span className="text-xs text-slate-400">
                  {isAr ? 'استخدام النقاط المقاسة حالياً' : 'Use live measured path'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('line')}
                className={`p-4 rounded-2xl border flex flex-col items-start gap-2 text-start transition-all ${
                  sourceType === 'line'
                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <Route className="w-5 h-5" />
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-900/60 border border-slate-700">
                    {lineAnnotations.length} {isAr ? 'خطوط' : 'lines'}
                  </span>
                </div>
                <span className="font-semibold text-sm">
                  {isAr ? 'خط مرسوم على الخريطة' : 'Drawn Map Line'}
                </span>
                <span className="text-xs text-slate-400">
                  {isAr ? 'اختيار أحد الخطوط المرسومة' : 'Select from drawn annotations'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('manual')}
                className={`p-4 rounded-2xl border flex flex-col items-start gap-2 text-start transition-all ${
                  sourceType === 'manual'
                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <MapPin className="w-5 h-5" />
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-900/60 border border-slate-700">
                    UTM
                  </span>
                </div>
                <span className="font-semibold text-sm">
                  {isAr ? 'بداية ونهاية يدوي' : 'Manual Endpoints'}
                </span>
                <span className="text-xs text-slate-400">
                  {isAr ? 'إدخال إحداثيات خط مستقيم' : 'Enter start & end UTM coordinates'}
                </span>
              </button>
            </div>

            {/* Line Selection if 'line' */}
            {sourceType === 'line' && (
              <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl space-y-2">
                <label className="text-xs font-medium text-slate-300">
                  {isAr ? 'اختر الخط المطلوب تقسيمه:' : 'Select Line Annotation:'}
                </label>
                {lineAnnotations.length > 0 ? (
                  <select
                    value={selectedLineId}
                    onChange={(e) => setSelectedLineId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-amber-500"
                  >
                    {lineAnnotations.map((line) => (
                      <option key={line.id} value={line.id}>
                        {line.name} ({line.points.length} {isAr ? 'نقاط' : 'points'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-amber-400">
                    {isAr
                      ? 'لا توجد خطوط مرسومة حالياً. يمكنك رسم خط من شريط الأدوات أولاً.'
                      : 'No line annotations found. Draw a line first.'}
                  </p>
                )}
              </div>
            )}

            {/* Manual Endpoints Inputs */}
            {sourceType === 'manual' && (
              <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400">
                    {isAr ? 'إحداثيات خط التبليط المستقيـم (UTM)' : 'Straight Line Endpoints (UTM)'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{isAr ? 'المنطقة:' : 'Zone:'}</span>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={manualZone}
                      onChange={(e) => setManualZone(parseInt(e.target.value) || 37)}
                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Start Pt */}
                  <div className="space-y-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="font-bold text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      {isAr ? 'نقطة البداية (Start)' : 'Start Point'}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Easting X (م)"
                        value={manualStartEasting}
                        onChange={(e) => setManualStartEasting(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                      />
                      <input
                        type="number"
                        placeholder="Northing Y (م)"
                        value={manualStartNorthing}
                        onChange={(e) => setManualStartNorthing(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                      />
                    </div>
                    <input
                      type="number"
                      placeholder="الارتفاع Z (اختياري)"
                      value={manualStartElev}
                      onChange={(e) => setManualStartElev(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                    />
                  </div>

                  {/* End Pt */}
                  <div className="space-y-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="font-bold text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      {isAr ? 'نقطة النهاية (End)' : 'End Point'}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Easting X (م)"
                        value={manualEndEasting}
                        onChange={(e) => setManualEndEasting(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                      />
                      <input
                        type="number"
                        placeholder="Northing Y (م)"
                        value={manualEndNorthing}
                        onChange={(e) => setManualEndNorthing(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                      />
                    </div>
                    <input
                      type="number"
                      placeholder="الارتفاع Z (اختياري)"
                      value={manualEndElev}
                      onChange={(e) => setManualEndElev(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Interval Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-800/30 p-5 rounded-2xl border border-slate-800">
            <div className="space-y-4">
              <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                {isAr ? 'خيارات الفواصل والتباعد' : 'Interval Options'}
              </label>

              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setIntervalMode('distance')}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    intervalMode === 'distance'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'مسافة ثابتة (كل X متر)' : 'Fixed Interval (e.g. 20m)'}
                </button>
                <button
                  type="button"
                  onClick={() => setIntervalMode('count')}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    intervalMode === 'count'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'عدد نقاط محدد' : 'Fixed Point Count'}
                </button>
              </div>

              {intervalMode === 'distance' ? (
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium">
                    {isAr ? 'المسافة بين النقاط (متر):' : 'Step Distance (meters):'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step={0.5}
                      min={0.5}
                      value={stepDistance}
                      onChange={(e) => setStepDistance(parseFloat(e.target.value) || 20)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex gap-1">
                      {[10, 20, 25, 50].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setStepDistance(d)}
                          className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
                            stepDistance === d
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {d}م
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium">
                    {isAr ? 'عدد النقاط المطلوب إنشاءها:' : 'Number of Points:'}
                  </label>
                  <input
                    type="number"
                    min={2}
                    value={pointCount}
                    onChange={(e) => setPointCount(parseInt(e.target.value) || 10)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="incEndpoints"
                  checked={includeEndpoints}
                  onChange={(e) => setIncludeEndpoints(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                />
                <label htmlFor="incEndpoints" className="text-xs text-slate-300 cursor-pointer">
                  {isAr ? 'تثبيت نقطتي البداية والنهاية دائماً' : 'Always include Start and End points'}
                </label>
              </div>
            </div>

            {/* Section 3: Naming & Category */}
            <div className="space-y-4">
              <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-amber-400" />
                {isAr ? 'صيغة الترقيم والتسمية' : 'Station Naming Format'}
              </label>

              <select
                value={namingFormat}
                onChange={(e) => setNamingFormat(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="chainage">
                  {isAr ? 'ترقيم محطات الطرق (CH 0+000, CH 0+020)' : 'Chainage Format (CH 0+000)'}
                </option>
                <option value="station">
                  {isAr ? 'ترقيم محطات هندسية (STA 0+000, STA 0+020)' : 'Station Format (STA 0+000)'}
                </option>
                <option value="point">
                  {isAr ? 'تسلسل رقمي عادي (نقطة مسار 1, 2...)' : 'Numeric Sequence (Point 1, Point 2)'}
                </option>
                <option value="custom">
                  {isAr ? 'بادئة مخصصة (مثال: P 1, P 2)' : 'Custom Prefix (e.g. P 1, P 2)'}
                </option>
              </select>

              {namingFormat === 'custom' && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">{isAr ? 'البادئة المخصصة:' : 'Custom Prefix:'}</label>
                  <input
                    type="text"
                    value={customPrefix}
                    onChange={(e) => setCustomPrefix(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-1.5 text-slate-200 text-sm"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">
                    {isAr ? 'محطة البداية (متر):' : 'Start Station (m):'}
                  </label>
                  <input
                    type="number"
                    value={startStation}
                    onChange={(e) => setStartStation(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">{isAr ? 'التصنيف:' : 'Category:'}</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Calculate Preview Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleCalculatePreview}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-3 transition-all transform active:scale-95"
            >
              <Sparkles className="w-5 h-5" />
              {isAr ? 'حساب وبناء المعاينة الحية' : 'Calculate Live Preview'}
            </button>
          </div>

          {/* Preview Table */}
          {previewPoints.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {isAr
                    ? `معاينة النقاط المحسوبة (${previewPoints.length} نقطة):`
                    : `Generated Preview (${previewPoints.length} points):`}
                </span>
                <span className="text-xs text-slate-400">
                  {isAr ? 'إجمالي طول المسار:' : 'Total Length:'}{' '}
                  <strong className="text-amber-400">
                    {previewPoints[previewPoints.length - 1]?.stationDist.toFixed(2)}m
                  </strong>
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950 custom-scrollbar">
                <table className="w-full text-xs text-start whitespace-nowrap text-slate-300">
                  <thead className="bg-slate-900/90 sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="px-3 py-2 text-start font-semibold text-slate-400">#</th>
                      <th className="px-3 py-2 text-start font-semibold text-slate-400">
                        {isAr ? 'اسم النقطة' : 'Station Name'}
                      </th>
                      <th className="px-3 py-2 text-start font-semibold text-slate-400">
                        {isAr ? 'المسافة (متر)' : 'Distance (m)'}
                      </th>
                      <th className="px-3 py-2 text-start font-semibold text-slate-400">
                        {isAr ? 'الإحداثي الشرقي Easting (X)' : 'Easting (X)'}
                      </th>
                      <th className="px-3 py-2 text-start font-semibold text-slate-400">
                        {isAr ? 'الإحداثي الشمالي Northing (Y)' : 'Northing (Y)'}
                      </th>
                      <th className="px-3 py-2 text-start font-semibold text-slate-400">
                        {isAr ? 'الارتفاع Elevation (Z)' : 'Elevation (Z)'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {previewPoints.map((pt, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                        <td className="px-3 py-2 font-mono text-slate-500">{idx + 1}</td>
                        <td className="px-3 py-2 font-bold text-amber-300">{pt.stationName}</td>
                        <td className="px-3 py-2 text-slate-300">{pt.stationDist.toFixed(2)} m</td>
                        <td className="px-3 py-2 font-mono text-emerald-400">{pt.utm.easting.toFixed(2)}</td>
                        <td className="px-3 py-2 font-mono text-emerald-400">{pt.utm.northing.toFixed(2)}</td>
                        <td className="px-3 py-2 text-slate-400">
                          {pt.elevation !== undefined ? `${pt.elevation.toFixed(2)}m` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-800/30 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            {previewPoints.length > 0 && (
              <span>
                {isAr ? 'جاهز لإضافة' : 'Ready to add'}{' '}
                <strong className="text-amber-400">{previewPoints.length}</strong>{' '}
                {isAr ? 'نقطة إلى الخريطة' : 'points to map'}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveModal(null)}
              className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={handleSavePoints}
              disabled={previewPoints.length === 0 || isGenerating}
              className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                previewPoints.length > 0 && !isGenerating
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-5 h-5" />
              {isGenerating
                ? isAr
                  ? 'جاري الحفظ...'
                  : 'Saving...'
                : isAr
                ? 'تثبيت النقاط على الخريطة'
                : 'Save Points to Map'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
