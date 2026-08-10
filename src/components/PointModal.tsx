import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getTranslation } from '../utils/translations';
import { utmToLatLng, validateUTM } from '../utils/utm';
import { PointCategory, Hemisphere } from '../types';
import { MapPin, X, Save, CheckCircle2, AlertTriangle, Layers, Palette } from 'lucide-react';

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

  const addPoint = useStore((s) => s.addPoint);
  const updatePoint = useStore((s) => s.updatePoint);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const setEditingPoint = useStore((s) => s.setEditingPoint);

  const isEditMode = activeModal === 'edit_point' && editingPoint;

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PointCategory>('control_point');
  const [zone, setZone] = useState<number>(37);
  const [hemisphere, setHemisphere] = useState<Hemisphere>('N');
  const [easting, setEasting] = useState<number>(450000);
  const [northing, setNorthing] = useState<number>(2700000);
  const [elevation, setElevation] = useState<string>('');
  const [color, setColor] = useState('#10b981');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize form fields when modal opens or editingPoint changes
  useEffect(() => {
    if (isEditMode && editingPoint) {
      setName(editingPoint.name);
      setDescription(editingPoint.description || '');
      setCategory(editingPoint.category || 'other');
      setZone(editingPoint.utm.zone);
      setHemisphere(editingPoint.utm.hemisphere);
      setEasting(editingPoint.utm.easting);
      setNorthing(editingPoint.utm.northing);
      setElevation(editingPoint.elevation !== undefined ? String(editingPoint.elevation) : '');
      setColor(editingPoint.color || '#10b981');
    } else if (tempMapClickCoords) {
      // Form pre-populated from clicking on the map
      setName(`نقطة جديدة (${tempMapClickCoords.utm.zone}${tempMapClickCoords.utm.hemisphere})`);
      setDescription('');
      setCategory('control_point');
      setZone(tempMapClickCoords.utm.zone);
      setHemisphere(tempMapClickCoords.utm.hemisphere);
      setEasting(tempMapClickCoords.utm.easting);
      setNorthing(tempMapClickCoords.utm.northing);
      setElevation('');
      setColor('#10b981');
    } else {
      // Reset defaults
      setName('');
      setDescription('');
      setCategory('control_point');
      setZone(manualZoneOverride || 37);
      setHemisphere('N');
      setEasting(450000);
      setNorthing(2700000);
      setElevation('');
      setColor('#10b981');
    }
    setErrorMsg(null);
  }, [activeModal, editingPoint, tempMapClickCoords, isEditMode, manualZoneOverride]);

  if (activeModal !== 'add_point' && activeModal !== 'edit_point') return null;

  // Calculate projected Lat/Lng preview
  const currentUTM = { zone, hemisphere, easting, northing };
  const latLngPreview = utmToLatLng(currentUTM);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg('يرجى كتابة اسم النقطة المساحية');
      return;
    }

    // Validate UTM values
    const validation = validateUTM(currentUTM);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'إحداثيات UTM غير صحيحة');
      return;
    }

    const elevationVal = elevation.trim() !== '' ? parseFloat(elevation) : undefined;

    if (isEditMode && editingPoint) {
      updatePoint(editingPoint.id, {
        name: name.trim(),
        description: description.trim(),
        category,
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
        category,
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
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PointCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="control_point">{getTranslation(language, 'control_point')}</option>
                <option value="boundary">{getTranslation(language, 'boundary')}</option>
                <option value="elevation">{getTranslation(language, 'elevation')}</option>
                <option value="infrastructure">{getTranslation(language, 'infrastructure')}</option>
                <option value="feature">{getTranslation(language, 'feature')}</option>
                <option value="other">{getTranslation(language, 'other')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {getTranslation(language, 'elevationZ')}
              </label>
              <input
                type="number"
                step="0.01"
                value={elevation}
                onChange={(e) => setElevation(e.target.value)}
                placeholder="0.00 m"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
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
            <div className="text-[11px] text-slate-500 font-mono text-center pt-1">
              المكافئ الجغرافي: Lat: {latLngPreview.lat.toFixed(6)}°, Lng: {latLngPreview.lng.toFixed(6)}°
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
