import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { getTranslation } from '../utils/translations';
import { utmToLatLng, validateUTM, getMGRSBandFromLat, latLngToMGRS } from '../utils/utm';
import { fetchElevation } from '../utils/elevation';
import { PointCategory, Hemisphere } from '../types';
import { MapPin, X, Save, CheckCircle2, AlertTriangle, Layers, Palette, RotateCw, Loader2, Info } from 'lucide-react';

const MARKER_COLORS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ec4899', // Pink
];

export const PointModal: React.FC = () => {
  const activeModal = useStore((s) => s.activeModal);
  const editingPoint = useStore((s) => s.editingPoint);
  const tempMapClickCoords = useStore((s) => s.tempMapClickCoords);
  const language = useStore((s) => s.language);
  const manualZoneOverride = useStore((s) => s.manualZoneOverride);
  const defaultHemisphere = useStore((s) => s.defaultHemisphere);

  const isAr = language === 'ar';

  const autoFetchElevation = useStore((s) => s.autoFetchElevation);

  const addPoint = useStore((s) => s.addPoint);
  const updatePoint = useStore((s) => s.updatePoint);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const setEditingPoint = useStore((s) => s.setEditingPoint);
  const points = useStore((s) => s.points);
  const storeCategories = useStore((s) => s.categories);

  const isEditMode = activeModal === 'edit_point' && editingPoint;

  const allCategories = useMemo(() => {
    const setCats = new Set<string>();
    points.forEach((p) => {
      if (p.category) setCats.add(p.category);
    });
    storeCategories.forEach((c) => {
      if (c) setCats.add(c);
    });
    return Array.from(setCats);
  }, [points, storeCategories]);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PointCategory>('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [zone, setZone] = useState<number>(37);
  const [hemisphere, setHemisphere] = useState<Hemisphere>('N');
  const [easting, setEasting] = useState<number>(450000);
  const [northing, setNorthing] = useState<number>(2700000);
  const [elevation, setElevation] = useState<string>('');
  const [color, setColor] = useState('#10b981');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Elevation fetching state
  const [isFetchingElev, setIsFetchingElev] = useState(false);
  const [elevFetchStatus, setElevFetchStatus] = useState<'idle' | 'fetching' | 'success' | 'failed'>('idle');
  const abortControllerRef = useRef<AbortController | null>(null);
  const initialLoadRef = useRef<boolean>(true);

  // Calculate projected Lat/Lng preview
  const currentUTM = { zone, hemisphere, easting, northing };
  const latLngPreview = utmToLatLng(currentUTM);

  // Manual & auto fetch helper
  const triggerFetchElevation = async (targetLat?: number, targetLng?: number) => {
    const latToUse = targetLat ?? latLngPreview.lat;
    const lngToUse = targetLng ?? latLngPreview.lng;

    if (isNaN(latToUse) || isNaN(lngToUse)) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsFetchingElev(true);
    setElevFetchStatus('fetching');

    try {
      const elev = await fetchElevation(latToUse, lngToUse, controller.signal);
      if (!controller.signal.aborted) {
        setIsFetchingElev(false);
        if (elev !== null) {
          setElevation(String(elev));
          setElevFetchStatus('success');
        } else {
          setElevFetchStatus('failed');
        }
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setIsFetchingElev(false);
        setElevFetchStatus('failed');
      }
    }
  };

  // Initialize form fields when modal opens or editingPoint changes
  useEffect(() => {
    initialLoadRef.current = true;
    setElevFetchStatus('idle');

    if (isEditMode && editingPoint) {
      setName(editingPoint.name);
      setDescription(editingPoint.description || '');
      setCategory(editingPoint.category || '');
      setIsCustomCategory(false);
      setCustomCategoryName('');
      setZone(editingPoint.utm.zone);
      setHemisphere(editingPoint.utm.hemisphere);
      setEasting(editingPoint.utm.easting);
      setNorthing(editingPoint.utm.northing);
      setElevation(editingPoint.elevation !== undefined ? String(editingPoint.elevation) : '');
      setColor(editingPoint.color || '#10b981');
    } else if (tempMapClickCoords) {
      setName(`نقطة جديدة (${tempMapClickCoords.utm.zone}${tempMapClickCoords.utm.hemisphere})`);
      setDescription('');
      setCategory('');
      setIsCustomCategory(false);
      setCustomCategoryName('');
      setZone(tempMapClickCoords.utm.zone);
      setHemisphere(tempMapClickCoords.utm.hemisphere);
      setEasting(tempMapClickCoords.utm.easting);
      setNorthing(tempMapClickCoords.utm.northing);
      setElevation(
        tempMapClickCoords.elevation !== undefined ? String(tempMapClickCoords.elevation) : ''
      );
      setColor('#10b981');

      // If map click did not have elevation yet and autoFetch is on, fetch now
      if (tempMapClickCoords.elevation === undefined && autoFetchElevation) {
        triggerFetchElevation(tempMapClickCoords.lat, tempMapClickCoords.lng);
      }
    } else {
      setName('');
      setDescription('');
      setCategory('');
      setZone(manualZoneOverride || 38);
      setHemisphere(defaultHemisphere || 'S');
      setEasting(441000);
      setNorthing(3686000);
      setElevation('');
      setColor('#10b981');

      if (autoFetchElevation) {
        const defaultPt = utmToLatLng({ zone: manualZoneOverride || 38, hemisphere: defaultHemisphere || 'S', easting: 441000, northing: 3686000 });
        triggerFetchElevation(defaultPt.lat, defaultPt.lng);
      }
    }
    setErrorMsg(null);
  }, [activeModal, editingPoint, tempMapClickCoords, isEditMode, manualZoneOverride]);

  // Debounce coordinate changes to auto-update elevation
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    if (!autoFetchElevation || (activeModal !== 'add_point' && activeModal !== 'edit_point')) {
      return;
    }

    const timer = setTimeout(() => {
      triggerFetchElevation();
    }, 600);

    return () => clearTimeout(timer);
  }, [zone, hemisphere, easting, northing, autoFetchElevation]);

  if (activeModal !== 'add_point' && activeModal !== 'edit_point') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg('يرجى كتابة اسم النقطة');
      return;
    }

    // Validate UTM values
    const validation = validateUTM(currentUTM);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'إحداثيات UTM غير صحيحة');
      return;
    }

    const elevationVal = elevation.trim() !== '' ? parseFloat(elevation) : undefined;
    const finalCategory = isCustomCategory ? customCategoryName.trim() : category;

    if (isEditMode && editingPoint) {
      updatePoint(editingPoint.id, {
        name: name.trim(),
        description: description.trim(),
        category: finalCategory,
        utm: currentUTM,
        lat: latLngPreview.lat,
        lng: latLngPreview.lng,
        elevation: elevationVal,
        color,
      });
    } else {
      addPoint({
        name: name.trim(),
        description: description.trim(),
        category: finalCategory,
        utm: currentUTM,
        lat: latLngPreview.lat,
        lng: latLngPreview.lng,
        elevation: elevationVal,
        color,
      });
    }

    handleClose();
  };

  const handleClose = () => {
    setActiveModal(null);
    setEditingPoint(null);
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 pt-safe pb-safe">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-100 text-base">
              {isEditMode ? getTranslation(language, 'edit') : getTranslation(language, 'addPoint')}
            </h3>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Point Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {getTranslation(language, 'pointName')} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={getTranslation(language, 'pointNamePlaceholder')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Description & Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {getTranslation(language, 'category')}
              </label>
              {isCustomCategory ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    placeholder={isAr ? 'اكتب اسم التصنيف الجديد...' : 'Type new category name...'}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCategory(false);
                      setCategory('');
                    }}
                    className="px-3 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === '__NEW_CUSTOM_CAT__') {
                      setIsCustomCategory(true);
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">{isAr ? 'بدون تصنيف (عام)' : 'No Category (General)'}</option>
                  {allCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__NEW_CUSTOM_CAT__" className="text-emerald-400 font-bold">
                    {isAr ? '+ إضافة تصنيف جديد...' : '+ Add custom category...'}
                  </option>
                </select>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  {getTranslation(language, 'elevationZ')}
                </label>
                {elevFetchStatus === 'fetching' && (
                  <span className="text-[10px] text-purple-400 flex items-center gap-1 font-medium">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {getTranslation(language, 'fetchingElevation')}
                  </span>
                )}
                {elevFetchStatus === 'failed' && (
                  <span className="text-[10px] text-rose-400 font-medium">
                    {getTranslation(language, 'elevationFetchFailed')}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.01"
                  value={elevation}
                  onChange={(e) => {
                    setElevation(e.target.value);
                    setElevFetchStatus('idle');
                  }}
                  placeholder="0.00 m"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />

                <button
                  type="button"
                  onClick={() => triggerFetchElevation()}
                  disabled={isFetchingElev}
                  title={getTranslation(language, 'retryElevation')}
                  className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-xl transition-all shrink-0"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isFetchingElev ? 'animate-spin text-purple-400' : 'text-slate-300'}`} />
                </button>
              </div>

              <p className="mt-1 text-[10px] text-slate-500 flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-500 shrink-0" />
                <span>{getTranslation(language, 'elevationApproximate')}</span>
              </p>
            </div>
          </div>

          {/* UTM Coordinates Box */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
              <span className="font-bold text-emerald-400">نظام الإحداثيات UTM WGS84</span>
              <span className="font-mono text-[11px] text-slate-400">Easting / Northing</span>
            </div>

            {/* Zone & Hemisphere */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  {getTranslation(language, 'zone')} (1-60)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={zone}
                  onChange={(e) => setZone(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-bold font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  {getTranslation(language, 'hemisphere')}
                </label>
                <select
                  value={hemisphere}
                  onChange={(e) => setHemisphere(e.target.value as Hemisphere)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-bold font-mono focus:outline-none focus:border-emerald-500"
                >
                  <option value="N">شمالي (Northern - N)</option>
                  <option value="S">جنوبي (Southern - S)</option>
                </select>
              </div>
            </div>

            {/* Easting & Northing */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  {getTranslation(language, 'eastingX')} (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={easting}
                  onChange={(e) => setEasting(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-emerald-400 font-bold font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  {getTranslation(language, 'northingY')} (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={northing}
                  onChange={(e) => setNorthing(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-sky-400 font-bold font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Calculated Lat/Lng Indicator */}
            <div className="text-[11px] text-slate-500 font-mono text-center pt-2.5 border-t border-slate-900/60 flex flex-col gap-1">
              <div>
                {language === 'ar' ? 'المكافئ الجغرافي:' : 'Geographic:'} Lat: {latLngPreview.lat.toFixed(6)}°, Lng: {latLngPreview.lng.toFixed(6)}°
              </div>
              <div className="text-amber-400 font-bold">
                MGRS: {latLngToMGRS(latLngPreview.lat, latLngPreview.lng) || 'N/A'}
              </div>
            </div>
          </div>

          {/* Description Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {getTranslation(language, 'description')}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={getTranslation(language, 'descriptionPlaceholder')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Color Picker Palette */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-emerald-400" />
              <span>{getTranslation(language, 'colorMarker')}</span>
            </label>
            <div className="flex items-center gap-2">
              {MARKER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {getTranslation(language, 'cancel')}
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isEditMode ? getTranslation(language, 'updatePoint') : getTranslation(language, 'savePoint')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
