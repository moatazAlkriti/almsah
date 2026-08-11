import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
  latLngToUTM,
  utmToLatLng,
  latLngToMGRS,
  mgrsToLatLng,
  mgrsToUTM,
  dmsToDecimal,
  decimalToDMS,
  validateUTM,
} from '../utils/utm';
import {
  ArrowLeftRight,
  X,
  Copy,
  Check,
  Plus,
  MapPin,
  Sparkles,
  Compass,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { Hemisphere } from '../types';

export const CoordinateConverterModal: React.FC = () => {
  const activeModal = useStore((s) => s.activeModal);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const language = useStore((s) => s.language);
  const defaultHemisphere = useStore((s) => s.defaultHemisphere);
  const manualZoneOverride = useStore((s) => s.manualZoneOverride);
  const addPoint = useStore((s) => s.addPoint);
  const showToast = useStore((s) => s.showToast);

  const isAr = language === 'ar';

  // Input Mode: 'utm' | 'mgrs' | 'latlng' | 'dms'
  const [activeTab, setActiveTab] = useState<'utm' | 'mgrs' | 'latlng' | 'dms'>('utm');

  // UTM state
  const [zone, setZone] = useState<number>(38);
  const [hemisphere, setHemisphere] = useState<Hemisphere>(defaultHemisphere || 'S');
  const [easting, setEasting] = useState<number>(441010.5);
  const [northing, setNorthing] = useState<number>(3686520.8);

  // MGRS state
  const [mgrsInput, setMgrsInput] = useState<string>('38SMB4101086520');

  // Lat/Lng state
  const [latInput, setLatInput] = useState<number>(33.3152);
  const [lngInput, setLngInput] = useState<number>(44.3661);

  // DMS state
  const [latDeg, setLatDeg] = useState<number>(33);
  const [latMin, setLatMin] = useState<number>(18);
  const [latSec, setLatSec] = useState<number>(54.72);
  const [latDir, setLatDir] = useState<'N' | 'S'>('N');

  const [lngDeg, setLngDeg] = useState<number>(44);
  const [lngMin, setLngMin] = useState<number>(21);
  const [lngSec, setLngSec] = useState<number>(57.96);
  const [lngDir, setLngDir] = useState<'E' | 'W'>('E');

  // Converted output calculations
  const [computedUTM, setComputedUTM] = useState({
    zone: 38,
    hemisphere: (defaultHemisphere || 'S') as Hemisphere,
    easting: 441010.5,
    northing: 3686520.8,
  });
  const [computedLatLng, setComputedLatLng] = useState({ lat: 33.3152, lng: 44.3661 });
  const [computedMGRS, setComputedMGRS] = useState<string>('38SMB 41010 86520');
  const [computedDMS, setComputedDMS] = useState({
    lat: { deg: 33, min: 18, sec: 54.72, dir: 'N' as const },
    lng: { deg: 44, min: 21, sec: 57.96, dir: 'E' as const },
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync calculations whenever inputs change
  useEffect(() => {
    if (activeTab === 'utm') {
      const currentUtm = { zone, hemisphere, easting, northing };
      const ll = utmToLatLng(currentUtm);
      if (!isNaN(ll.lat) && !isNaN(ll.lng)) {
        setComputedUTM(currentUtm);
        setComputedLatLng(ll);
        setComputedMGRS(latLngToMGRS(ll.lat, ll.lng));
        setComputedDMS({
          lat: decimalToDMS(ll.lat, true) as any,
          lng: decimalToDMS(ll.lng, false) as any,
        });
      }
    } else if (activeTab === 'mgrs') {
      const ll = mgrsToLatLng(mgrsInput);
      if (ll) {
        const utm = latLngToUTM(ll.lat, ll.lng, manualZoneOverride);
        setComputedUTM(utm);
        setComputedLatLng(ll);
        setComputedMGRS(latLngToMGRS(ll.lat, ll.lng));
        setComputedDMS({
          lat: decimalToDMS(ll.lat, true) as any,
          lng: decimalToDMS(ll.lng, false) as any,
        });
      }
    } else if (activeTab === 'latlng') {
      if (!isNaN(latInput) && !isNaN(lngInput)) {
        const utm = latLngToUTM(latInput, lngInput, manualZoneOverride);
        setComputedUTM(utm);
        setComputedLatLng({ lat: latInput, lng: lngInput });
        setComputedMGRS(latLngToMGRS(latInput, lngInput));
        setComputedDMS({
          lat: decimalToDMS(latInput, true) as any,
          lng: decimalToDMS(lngInput, false) as any,
        });
      }
    } else if (activeTab === 'dms') {
      const lat = dmsToDecimal(latDeg, latMin, latSec, latDir);
      const lng = dmsToDecimal(lngDeg, lngMin, lngSec, lngDir);
      if (!isNaN(lat) && !isNaN(lng)) {
        const utm = latLngToUTM(lat, lng, manualZoneOverride);
        setComputedUTM(utm);
        setComputedLatLng({ lat, lng });
        setComputedMGRS(latLngToMGRS(lat, lng));
        setComputedDMS({
          lat: decimalToDMS(lat, true) as any,
          lng: decimalToDMS(lng, false) as any,
        });
      }
    }
  }, [
    activeTab,
    zone,
    hemisphere,
    easting,
    northing,
    mgrsInput,
    latInput,
    lngInput,
    latDeg,
    latMin,
    latSec,
    latDir,
    lngDeg,
    lngMin,
    lngSec,
    lngDir,
    manualZoneOverride,
  ]);

  if (activeModal !== 'converter') return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(isAr ? 'تم النسخ للحافظة 📋' : 'Copied to clipboard 📋', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveAsPoint = () => {
    addPoint({
      name: `نقطة محولة (${computedUTM.zone}${computedUTM.hemisphere})`,
      description: `تم إنشاؤها عبر محول الإحداثيات | MGRS: ${computedMGRS}`,
      category: 'نقطة محولة',
      utm: computedUTM,
      lat: computedLatLng.lat,
      lng: computedLatLng.lng,
      elevation: 0,
      color: '#39FF14',
    });
    showToast(isAr ? 'تم حفظ النقطة وإضافتها للخريطة بنجاح 📍' : 'Point saved to map 📍', 'success');
    setActiveModal(null);
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 pt-safe pb-safe">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                {isAr ? 'محوّل الإحداثيات الاحترافي' : 'Professional Coordinate Converter'}
              </h3>
              <p className="text-[11px] text-slate-400">UTM ↔ MGRS ↔ Geographic Lat/Lon</p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="p-6 space-y-5">
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 gap-1">
            {[
              { id: 'utm', label: 'UTM WGS84' },
              { id: 'mgrs', label: 'MGRS Grid' },
              { id: 'latlng', label: 'Geographic (Decimal)' },
              { id: 'dms', label: 'Geographic (DMS)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Interactive Input Forms */}
          <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-3">
            {activeTab === 'utm' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  <span>{isAr ? 'إدخال إحداثيات UTM' : 'Enter UTM Coordinates'}</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Zone (1-60)</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={zone}
                      onChange={(e) => setZone(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Hemisphere</label>
                    <select
                      value={hemisphere}
                      onChange={(e) => setHemisphere(e.target.value as Hemisphere)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="S">S (Southern / Iraq)</option>
                      <option value="N">N (Northern)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Easting X (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={easting}
                      onChange={(e) => setEasting(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Northing Y (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={northing}
                      onChange={(e) => setNorthing(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-sky-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'mgrs' && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  <span>{isAr ? 'إدخال شبكة MGRS' : 'Enter MGRS Grid'}</span>
                </h4>
                <div>
                  <input
                    type="text"
                    value={mgrsInput}
                    onChange={(e) => setMgrsInput(e.target.value)}
                    placeholder="e.g. 38SMB4101086520"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-emerald-500 tracking-wider"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    {isAr
                      ? 'مثال: 38SMB4101086520 أو 38S MB 41010 86520'
                      : 'Example: 38SMB4101086520'}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'latlng' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  <span>{isAr ? 'إدخال درجات عشرية (Lat / Lon)' : 'Enter Decimal Lat/Lon'}</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">
                      Latitude (°N/S)
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={latInput}
                      onChange={(e) => setLatInput(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">
                      Longitude (°E/W)
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={lngInput}
                      onChange={(e) => setLngInput(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-sky-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dms' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  <span>{isAr ? 'درجات، دقائق، وثواني (DMS)' : 'Degrees, Minutes, Seconds'}</span>
                </h4>

                {/* Latitude DMS */}
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 font-bold block">Latitude (خط العرض)</span>
                  <div className="grid grid-cols-4 gap-2">
                    <input
                      type="number"
                      placeholder="Deg °"
                      value={latDeg}
                      onChange={(e) => setLatDeg(parseInt(e.target.value) || 0)}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 text-xs font-mono font-bold text-slate-200 text-center"
                    />
                    <input
                      type="number"
                      placeholder="Min '"
                      value={latMin}
                      onChange={(e) => setLatMin(parseInt(e.target.value) || 0)}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 text-xs font-mono font-bold text-slate-200 text-center"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder='Sec "'
                      value={latSec}
                      onChange={(e) => setLatSec(parseFloat(e.target.value) || 0)}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 text-xs font-mono font-bold text-slate-200 text-center"
                    />
                    <select
                      value={latDir}
                      onChange={(e) => setLatDir(e.target.value as any)}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 text-xs font-mono font-bold text-amber-400 text-center"
                    >
                      <option value="N">N</option>
                      <option value="S">S</option>
                    </select>
                  </div>
                </div>

                {/* Longitude DMS */}
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 font-bold block">Longitude (خط الطول)</span>
                  <div className="grid grid-cols-4 gap-2">
                    <input
                      type="number"
                      placeholder="Deg °"
                      value={lngDeg}
                      onChange={(e) => setLngDeg(parseInt(e.target.value) || 0)}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 text-xs font-mono font-bold text-slate-200 text-center"
                    />
                    <input
                      type="number"
                      placeholder="Min '"
                      value={lngMin}
                      onChange={(e) => setLngMin(parseInt(e.target.value) || 0)}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 text-xs font-mono font-bold text-slate-200 text-center"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder='Sec "'
                      value={lngSec}
                      onChange={(e) => setLngSec(parseFloat(e.target.value) || 0)}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 text-xs font-mono font-bold text-slate-200 text-center"
                    />
                    <select
                      value={lngDir}
                      onChange={(e) => setLngDir(e.target.value as any)}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 text-xs font-mono font-bold text-sky-400 text-center"
                    >
                      <option value="E">E</option>
                      <option value="W">W</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Computed Results Display */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300">
              {isAr ? 'النتائج والمكافئات اللحظية:' : 'Converted Real-time Results:'}
            </h4>

            {/* UTM Output */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">UTM WGS84</span>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  Zone {computedUTM.zone}
                  {computedUTM.hemisphere} | E: {computedUTM.easting.toFixed(2)} m | N:{' '}
                  {computedUTM.northing.toFixed(2)} m
                </span>
              </div>
              <button
                onClick={() =>
                  handleCopy(
                    `Zone ${computedUTM.zone}${computedUTM.hemisphere} E:${computedUTM.easting} N:${computedUTM.northing}`,
                    'utm'
                  )
                }
                className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl transition-colors border border-slate-800 shrink-0"
              >
                {copiedKey === 'utm' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* MGRS Output */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">MGRS Grid</span>
                <span className="font-mono text-xs font-bold text-amber-300">
                  {computedMGRS || 'N/A'}
                </span>
              </div>
              <button
                onClick={() => handleCopy(computedMGRS, 'mgrs')}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl transition-colors border border-slate-800 shrink-0"
              >
                {copiedKey === 'mgrs' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Geographic Lat/Lon Output */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">
                  Geographic Decimal & DMS
                </span>
                <span className="font-mono text-xs font-bold text-sky-400 block">
                  Lat: {computedLatLng.lat.toFixed(6)}°, Lon: {computedLatLng.lng.toFixed(6)}°
                </span>
                <span className="font-mono text-[11px] text-slate-400 block">
                  {computedDMS.lat.deg}° {computedDMS.lat.min}' {computedDMS.lat.sec}"{' '}
                  {computedDMS.lat.dir} | {computedDMS.lng.deg}° {computedDMS.lng.min}'{' '}
                  {computedDMS.lng.sec}" {computedDMS.lng.dir}
                </span>
              </div>
              <button
                onClick={() =>
                  handleCopy(
                    `${computedLatLng.lat.toFixed(6)}, ${computedLatLng.lng.toFixed(6)}`,
                    'latlng'
                  )
                }
                className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl transition-colors border border-slate-800 shrink-0"
              >
                {copiedKey === 'latlng' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>

            <button
              onClick={handleSaveAsPoint}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة كنقطة على الخريطة' : 'Save as Point'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
