import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { getTranslation } from '../utils/translations';
import {
  Settings,
  X,
  Globe,
  Sliders,
  Compass,
  ArrowLeftRight,
  Ruler,
  Layers,
  Database,
  Info,
  CheckCircle2,
  Sparkles,
  Lock,
  Unlock,
  ShieldCheck,
  Folder,
  MapPin,
  Type,
  Maximize2,
  Eye,
  EyeOff,
  ArrowDown,
  ArrowUp,
  ArrowRight,
  ArrowLeft,
  Palette,
  Trash2,
} from 'lucide-react';
import { Hemisphere, PinStyle, PointLabelPosition } from '../types';

export const SettingsModal: React.FC = () => {
  const activeModal = useStore((s) => s.activeModal);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const defaultHemisphere = useStore((s) => s.defaultHemisphere);
  const setDefaultHemisphere = useStore((s) => s.setDefaultHemisphere);
  const manualZoneOverride = useStore((s) => s.manualZoneOverride);
  const setManualZoneOverride = useStore((s) => s.setManualZoneOverride);
  const autoFetchElevation = useStore((s) => s.autoFetchElevation);
  const setAutoFetchElevation = useStore((s) => s.setAutoFetchElevation);
  const points = useStore((s) => s.points);
  const categories = useStore((s) => s.categories);
  const lockAllPoints = useStore((s) => s.lockAllPoints);
  const unlockAllPoints = useStore((s) => s.unlockAllPoints);
  const showToast = useStore((s) => s.showToast);

  // Pin & Label Display Settings
  const pinStyle = useStore((s) => s.pinStyle);
  const setPinStyle = useStore((s) => s.setPinStyle);
  const pinSize = useStore((s) => s.pinSize);
  const setPinSize = useStore((s) => s.setPinSize);
  const pointLabelSize = useStore((s) => s.pointLabelSize);
  const setPointLabelSize = useStore((s) => s.setPointLabelSize);
  const pointLabelPosition = useStore((s) => s.pointLabelPosition);
  const setPointLabelPosition = useStore((s) => s.setPointLabelPosition);
  const showPointLabels = useStore((s) => s.showPointLabels);
  const setShowPointLabels = useStore((s) => s.setShowPointLabels);

  const [previewColor, setPreviewColor] = useState<string>('#ea4335');
  const [previewLocked, setPreviewLocked] = useState<boolean>(false);

  const isAr = language === 'ar';

  const [selectedScope, setSelectedScope] = useState<'all' | 'uncategorized' | string>('all');

  const allFolders = useMemo(() => {
    const set = new Set<string>();
    categories.forEach((c) => {
      if (c && c.trim()) set.add(c.trim());
    });
    points.forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    return Array.from(set);
  }, [categories, points]);

  const lockedCount = useMemo(() => points.filter((p) => p.isLocked).length, [points]);
  const unlockedCount = points.length - lockedCount;

  if (activeModal !== 'settings') return null;

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 pt-safe pb-safe">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                {isAr ? 'إعدادات النظام' : 'System & Settings'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'تخصيص أنظمة الإحداثيات والخريطة والأدوات' : 'Configure coordinates, map & survey tools'}
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
        <div className="p-6 space-y-6">
          {/* Quick Tools Shortcuts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <button
              onClick={() => setActiveModal('converter')}
              className="p-3 bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl flex flex-col gap-1.5 text-right transition-all group hover:bg-slate-900/80"
            >
              <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:scale-110 transition-transform">
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-200 text-xs group-hover:text-emerald-400 transition-colors">
                  {isAr ? 'محوّل الإحداثيات' : 'Coordinate Converter'}
                </h4>
                <p className="text-[10px] text-slate-400">UTM ↔ MGRS ↔ Lat/Lon</p>
              </div>
            </button>

            <button
              onClick={() => setActiveModal('two_point_measure')}
              className="p-3 bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 rounded-2xl flex flex-col gap-1.5 text-right transition-all group hover:bg-slate-900/80"
            >
              <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30 group-hover:scale-110 transition-transform">
                <Ruler className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-200 text-xs group-hover:text-amber-400 transition-colors">
                  {isAr ? 'قياس بين نقطتين' : 'Measure Two Points'}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {isAr ? 'مسافة، انحراف وزوايا' : 'Distance, bearing & delta'}
                </p>
              </div>
            </button>

            <button
              onClick={() => setActiveModal('batch_delete')}
              className="p-3 bg-slate-950/80 border border-slate-800 hover:border-rose-500/50 rounded-2xl flex flex-col gap-1.5 text-right transition-all group hover:bg-slate-900/80 col-span-2 sm:col-span-1"
            >
              <div className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/30 group-hover:scale-110 transition-transform">
                <Trash2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-200 text-xs group-hover:text-rose-400 transition-colors">
                  {isAr ? 'الحذف المتقدم (بالنطاق)' : 'Advanced Batch Delete'}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {isAr ? 'حذف بالمتسلسلة والنطاق' : 'Delete by range & sequence'}
                </p>
              </div>
            </button>
          </div>

          {/* Coordinate & Survey System Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <h4 className="font-bold text-slate-200 text-xs">
                {isAr ? 'إعدادات نظام الإحداثيات UTM' : 'UTM Coordinate System'}
              </h4>
            </div>

            {/* Default Hemisphere (Iraq focus) */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-bold text-slate-200 text-xs block">
                    {isAr ? 'نصف الكرة الافتراضي (Hemisphere)' : 'Default Hemisphere'}
                  </label>
                  <p className="text-[11px] text-slate-400">
                    {isAr
                      ? 'تم الضبط افتراضياً إلى النطاق الجنوبي (S)'
                      : 'Default set to Southern (S)'}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  Band {defaultHemisphere}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDefaultHemisphere('S');
                    showToast(isAr ? 'تم تحديد نصف الكرة الجنوبي (S) كافتراضي' : 'Default Hemisphere set to S (Southern)', 'success');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                    defaultHemisphere === 'S'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${defaultHemisphere === 'S' ? 'inline' : 'hidden'}`} />
                  <span>{isAr ? 'جنوبي (S - Iraq)' : 'Southern (S)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDefaultHemisphere('N');
                    showToast(isAr ? 'تم تحديد نصف الكرة الشمالي (N) كافتراضي' : 'Default Hemisphere set to N (Northern)', 'info');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                    defaultHemisphere === 'N'
                      ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${defaultHemisphere === 'N' ? 'inline' : 'hidden'}`} />
                  <span>{isAr ? 'شمالي (N - Northern)' : 'Northern (N)'}</span>
                </button>
              </div>
            </div>

            {/* Default Zone Override Lock */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-bold text-slate-200 text-xs block">
                    {isAr ? 'تثبيت نطاق المنطقة UTM Zone' : 'Lock UTM Zone'}
                  </label>
                  <p className="text-[11px] text-slate-400">
                    {isAr
                      ? 'قفل جميع النقاط والتحويلات على zone معينة (مثال: Zone 38 بالعراق)'
                      : 'Lock zone calculations (e.g. Zone 38 for Iraq region)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                {[null, 38, 37, 39].map((z) => (
                  <button
                    key={z ?? 'auto'}
                    type="button"
                    onClick={() => {
                      setManualZoneOverride(z);
                      showToast(
                        z
                          ? isAr
                            ? `تم تثبيت النطاق على Zone ${z}`
                            : `UTM Zone locked to ${z}`
                          : isAr
                          ? 'تم تفعيل التحديد التلقائي للمنطقة'
                          : 'Auto zone calculation enabled',
                        'success'
                      );
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-mono font-bold transition-all border text-center ${
                      manualZoneOverride === z
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {z ? `Zone ${z}` : isAr ? 'تلقائي' : 'Auto'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Elevation & Automation Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <h4 className="font-bold text-slate-200 text-xs">
                {isAr ? 'البيانات والأتمتة' : 'Data & Elevation Automation'}
              </h4>
            </div>

            {/* Auto Elevation Toggle */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <label className="font-bold text-slate-200 text-xs block">
                  {isAr ? 'جلب الارتفاع عن سطح البحر تلقائياً' : 'Auto Fetch Elevation (Z)'}
                </label>
                <p className="text-[11px] text-slate-400">
                  {isAr
                    ? 'استعلام تلقائي عبر خوادم DEM للارتفاعات عند إضافة النقطة'
                    : 'Automatically query elevation data for new survey points'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                    autoFetchElevation
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {autoFetchElevation ? (isAr ? 'مُفعّل' : 'ON') : (isAr ? 'معطّل' : 'OFF')}
                </span>
                <button
                  type="button"
                  onClick={() => setAutoFetchElevation(!autoFetchElevation)}
                  dir="ltr"
                  className={`w-11 h-6 rounded-full p-1 transition-colors relative shrink-0 ${
                    autoFetchElevation
                      ? 'bg-purple-600 shadow-md shadow-purple-500/40'
                      : 'bg-slate-800 border border-slate-700'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                      autoFetchElevation ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Google Map Pin & Point Label Customization Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <MapPin className="w-4 h-4 text-red-400" />
              <h4 className="font-bold text-slate-200 text-xs">
                {isAr ? 'دنبوس خرائط جوجل وأسماء النقاط (Google Pin & Labels)' : 'Google Pin & Point Labels'}
              </h4>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-5">
              {/* Pin Style Selection */}
              <div className="space-y-2">
                <label className="font-bold text-slate-200 text-xs flex items-center justify-between">
                  <span>{isAr ? 'شكل دنبوس الخريطة (Pin Style):' : 'Pin Style:'}</span>
                  <span className="text-[10px] text-red-400 font-mono">📍 Google Pushpin</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPinStyle('google_pin');
                      showToast(isAr ? 'تم تفعيل دنبوس خرائط جوجل (Google Pin)' : 'Google Pin selected', 'success');
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      pinStyle === 'google_pin'
                        ? 'bg-red-500/20 text-red-300 border-red-500/50 shadow-sm shadow-red-500/20'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-base">📍</span>
                    <span>{isAr ? 'دنبوس جوجل' : 'Google Pin'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPinStyle('classic_marker');
                      showToast(isAr ? 'تم تفعيل العلامة الكلاسيكية' : 'Classic Marker selected', 'info');
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      pinStyle === 'classic_marker'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-base">💧</span>
                    <span>{isAr ? 'كلاسيكي' : 'Classic'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPinStyle('circle_dot');
                      showToast(isAr ? 'تم تفعيل النقطة الدائرية' : 'Circle Dot selected', 'info');
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      pinStyle === 'circle_dot'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm shadow-purple-500/20'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-base">🔘</span>
                    <span>{isAr ? 'نقطة دائرية' : 'Dot'}</span>
                  </button>
                </div>
              </div>

              {/* Pin Size Slider & Presets */}
              <div className="space-y-2.5 bg-slate-900/80 border border-slate-800/80 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Maximize2 className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-xs font-bold text-slate-200">
                      {isAr ? 'حجم الدنبوس على الخريطة (Pin Size)' : 'Pin Size Scaling'}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-red-500/15 text-red-300 border border-red-500/30">
                    {pinSize} px
                  </span>
                </div>

                <input
                  type="range"
                  min="18"
                  max="64"
                  step="2"
                  value={pinSize}
                  onChange={(e) => setPinSize(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                />

                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[
                    { label: isAr ? 'صغير' : 'Small', size: 24 },
                    { label: isAr ? 'متوسط' : 'Medium', size: 34 },
                    { label: isAr ? 'كبير' : 'Large', size: 44 },
                    { label: isAr ? 'عريض' : 'XL', size: 56 },
                  ].map((preset) => (
                    <button
                      key={preset.size}
                      type="button"
                      onClick={() => setPinSize(preset.size)}
                      className={`py-1 px-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                        pinSize === preset.size
                          ? 'bg-red-500 text-white border-red-400 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {preset.label} ({preset.size})
                    </button>
                  ))}
                </div>
              </div>

              {/* Point Name Label Size & Position */}
              <div className="space-y-3 bg-slate-900/80 border border-slate-800/80 rounded-xl p-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Type className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-xs font-bold text-slate-200">
                      {isAr ? 'تسمية واسم النقطة (Point Name Label)' : 'Point Name Label'}
                    </span>
                  </div>

                  {/* Toggle Show/Hide Labels */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowPointLabels(!showPointLabels);
                      showToast(
                        showPointLabels
                          ? isAr
                            ? 'تم إخفاء أسماء النقاط من الخريطة'
                            : 'Labels hidden'
                          : isAr
                          ? 'تم إظهار أسماء النقاط'
                          : 'Labels visible',
                        'info'
                      );
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition-all ${
                      showPointLabels
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {showPointLabels ? <Eye className="w-3 h-3 text-sky-400" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
                    <span>{showPointLabels ? (isAr ? 'الأسماء مفعلة' : 'Labels ON') : (isAr ? 'الأسماء مخفية' : 'Labels OFF')}</span>
                  </button>
                </div>

                {/* Label Font Size Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-300 font-medium">
                      {isAr ? 'حجم خط الاسم (Font Size):' : 'Label Font Size:'}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      {pointLabelSize} px
                    </span>
                  </div>

                  <input
                    type="range"
                    min="8"
                    max="22"
                    step="1"
                    value={pointLabelSize}
                    onChange={(e) => setPointLabelSize(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />

                  <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                    {[
                      { label: isAr ? 'دقيق' : 'Small', size: 9 },
                      { label: isAr ? 'قياسي' : 'Normal', size: 11 },
                      { label: isAr ? 'بارز' : 'Medium', size: 14 },
                      { label: isAr ? 'كبير' : 'Large', size: 17 },
                    ].map((preset) => (
                      <button
                        key={preset.size}
                        type="button"
                        onClick={() => setPointLabelSize(preset.size)}
                        className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition-all ${
                          pointLabelSize === preset.size
                            ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold shadow-sm'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {preset.label} ({preset.size}px)
                      </button>
                    ))}
                  </div>
                </div>

                {/* Label Position Relative to Pin */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] text-slate-300 font-medium block">
                    {isAr ? 'موضع الاسم بالنسبة للدنبوس (Label Position):' : 'Label Position relative to pin:'}
                  </span>

                  <div className="grid grid-cols-5 gap-1">
                    {[
                      { pos: 'bottom' as PointLabelPosition, label: isAr ? 'أسفل' : 'Bottom', icon: ArrowDown },
                      { pos: 'top' as PointLabelPosition, label: isAr ? 'أعلى' : 'Top', icon: ArrowUp },
                      { pos: 'right' as PointLabelPosition, label: isAr ? 'يمين' : 'Right', icon: ArrowRight },
                      { pos: 'left' as PointLabelPosition, label: isAr ? 'يسار' : 'Left', icon: ArrowLeft },
                      { pos: 'hidden' as PointLabelPosition, label: isAr ? 'إخفاء' : 'Hidden', icon: EyeOff },
                    ].map((item) => {
                      const IconComponent = item.icon;
                      const isActive = pointLabelPosition === item.pos;
                      return (
                        <button
                          key={item.pos}
                          type="button"
                          onClick={() => setPointLabelPosition(item.pos)}
                          className={`py-1.5 px-1 rounded-xl text-[10px] font-bold border flex flex-col items-center gap-1 transition-all ${
                            isActive
                              ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 shadow-sm'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-slate-200'
                          }`}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Interactive Live Visual Preview Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">
                      {isAr ? 'معاينة حية للدنبوس والاسم (Live Preview)' : 'Live Pin & Label Preview'}
                    </span>
                  </div>

                  {/* Color Chips for Preview */}
                  <div className="flex items-center gap-1">
                    {['#ea4335', '#10b981', '#3b82f6', '#f59e0b', '#a855f7', '#06b6d4'].map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setPreviewColor(col)}
                        style={{ backgroundColor: col }}
                        className={`w-4 h-4 rounded-full border transition-transform ${
                          previewColor === col ? 'scale-125 border-white shadow-sm ring-2 ring-white/30' : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => setPreviewLocked(!previewLocked)}
                      className={`ml-1.5 p-1 rounded-md border text-[10px] ${
                        previewLocked ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                      title={isAr ? 'تجربة حالة القفل' : 'Toggle Lock badge'}
                    >
                      <Lock className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Simulated Map Canvas */}
                <div className="relative w-full h-36 rounded-xl bg-slate-900/90 border border-slate-800/80 overflow-hidden flex items-center justify-center shadow-inner">
                  {/* Subtle Grid Map Lines */}
                  <div
                    className="absolute inset-0 opacity-15"
                    style={{
                      backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
                      backgroundSize: '16px 16px',
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none" />

                  {/* Target Crosshair under Pin Anchor */}
                  <div className="absolute w-4 h-4 border border-dashed border-red-500/40 rounded-full flex items-center justify-center pointer-events-none">
                    <div className="w-1 h-1 bg-red-400 rounded-full" />
                  </div>

                  {/* Rendered Live Pin */}
                  <div className="relative flex items-center justify-center transition-all duration-150 z-10">
                    {pinStyle === 'classic_marker' ? (
                      <svg
                        width={pinSize}
                        height={Math.round(pinSize * 1.375)}
                        viewBox="0 0 32 42"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="drop-shadow-lg transition-all"
                      >
                        <path
                          d="M16 0C7.163 0 0 7.163 0 16C0 28 16 42 16 42C16 42 32 28 32 16C32 7.163 24.837 0 16 0Z"
                          fill={previewColor}
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        <circle cx="16" cy="15" r="7" fill="#ffffff" />
                        <circle cx="16" cy="15" r="4" fill={previewColor} />
                      </svg>
                    ) : pinStyle === 'circle_dot' ? (
                      <svg
                        width={Math.round(pinSize * 0.75)}
                        height={Math.round(pinSize * 0.75)}
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="drop-shadow-lg transition-all"
                      >
                        <circle cx="12" cy="12" r="10" fill={previewColor} stroke="#ffffff" strokeWidth="2.5" />
                        <circle cx="12" cy="12" r="4" fill="#ffffff" />
                      </svg>
                    ) : (
                      // Google Pushpin - Clean Solid Color Head
                      <svg
                        width={pinSize}
                        height={Math.round(pinSize * 1.375)}
                        viewBox="0 0 32 44"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="drop-shadow-md transition-all"
                      >
                        <defs>
                          <linearGradient id="needle-grad-preview" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#475569" />
                            <stop offset="35%" stopColor="#cbd5e1" />
                            <stop offset="70%" stopColor="#94a3b8" />
                            <stop offset="100%" stopColor="#334155" />
                          </linearGradient>
                        </defs>
                        <path d="M 14.3 19 L 17.7 19 L 17.4 39.5 L 16 43.8 L 14.6 39.5 Z" fill="url(#needle-grad-preview)" />
                        <line x1="16" y1="20" x2="16" y2="43" stroke="#ffffff" strokeWidth="0.75" strokeOpacity="0.65" strokeLinecap="round" />
                        <circle cx="16" cy="13" r="11.5" fill={previewColor} stroke="#ffffff" strokeWidth="1.75" />
                      </svg>
                    )}

                    {/* Optional Lock Badge in preview */}
                    {previewLocked && (
                      <div
                        className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 rounded-full shadow-lg border border-amber-300 flex items-center justify-center pointer-events-none"
                        style={{
                          width: `${Math.max(12, Math.round(pinSize * 0.42))}px`,
                          height: `${Math.max(12, Math.round(pinSize * 0.42))}px`,
                        }}
                      >
                        <Lock className="w-2.5 h-2.5" />
                      </div>
                    )}

                    {/* Dynamic Label in preview */}
                    {showPointLabels && pointLabelPosition !== 'hidden' && (
                      <span
                        className={`bg-slate-950/95 text-slate-100 font-bold px-2 py-0.5 rounded shadow-lg border border-slate-700/80 whitespace-nowrap font-mono select-none pointer-events-none transition-all ${
                          pointLabelPosition === 'top'
                            ? 'absolute -top-7 left-1/2 -translate-x-1/2'
                            : pointLabelPosition === 'right'
                            ? 'absolute top-1/2 -translate-y-1/2 left-full ml-2.5'
                            : pointLabelPosition === 'left'
                            ? 'absolute top-1/2 -translate-y-1/2 right-full mr-2.5'
                            : 'absolute -bottom-6 left-1/2 -translate-x-1/2'
                        }`}
                        style={{ fontSize: `${pointLabelSize}px`, lineHeight: 1.2 }}
                      >
                        P-101 (نقطة مساحية)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Points Locking & Protection Management */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <h4 className="font-bold text-slate-200 text-xs">
                {isAr ? 'إدارة قفل وحماية النقاط (Lock & Protect)' : 'Point Locking & Protection'}
              </h4>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-4">
              {/* Summary Stats Badges */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-slate-850">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    {isAr ? 'حالة نقاط المشروع' : 'Project Points Status'}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {isAr
                      ? 'التحكم الجماعي بالقفل لمنع التعديل أو الحذف بالخطأ'
                      : 'Batch lock/unlock to prevent accidental drag or deletion'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                    {isAr ? 'الإجمالي:' : 'Total:'} <b>{points.length}</b>
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>{lockedCount}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1">
                    <Unlock className="w-3 h-3" />
                    <span>{unlockedCount}</span>
                  </span>
                </div>
              </div>

              {/* Scope Selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 block">
                  {isAr ? 'نطاق التطبيق (Target Scope):' : 'Target Scope:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedScope('all')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium transition-all border text-center flex items-center justify-center gap-1.5 ${
                      selectedScope === 'all'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200'
                    }`}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${selectedScope === 'all' ? 'inline text-amber-400' : 'hidden'}`} />
                    <span>{isAr ? 'كافة النقاط (الكل)' : 'All Points (Global)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedScope('uncategorized')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium transition-all border text-center flex items-center justify-center gap-1.5 ${
                      selectedScope === 'uncategorized'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200'
                    }`}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${selectedScope === 'uncategorized' ? 'inline text-amber-400' : 'hidden'}`} />
                    <span>{isAr ? 'بدون مجلد (عام)' : 'Uncategorized Only'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (allFolders.length > 0) {
                        setSelectedScope(allFolders[0]);
                      } else {
                        setSelectedScope('all');
                        showToast(isAr ? 'لا توجد مجلدات حالياً' : 'No custom folders yet', 'info');
                      }
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium transition-all border text-center flex items-center justify-center gap-1.5 ${
                      selectedScope !== 'all' && selectedScope !== 'uncategorized'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAr ? 'مجلد محدد...' : 'Specific Folder'}</span>
                  </button>
                </div>

                {/* Specific Folder Dropdown if chosen */}
                {selectedScope !== 'all' && selectedScope !== 'uncategorized' && (
                  <div className="pt-1">
                    <select
                      value={selectedScope}
                      onChange={(e) => setSelectedScope(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                    >
                      {allFolders.map((f) => (
                        <option key={f} value={f}>
                          📁 {f} ({points.filter((p) => p.category === f).length} {isAr ? 'نقطة' : 'pts'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Action Buttons for the selected scope */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => unlockAllPoints(selectedScope)}
                  className="py-2.5 px-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 hover:text-emerald-200 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Unlock className="w-4 h-4" />
                  <span>
                    {isAr
                      ? selectedScope === 'all'
                        ? 'فك قفل كافة النقاط 🔓'
                        : selectedScope === 'uncategorized'
                        ? 'فك قفل غير المصنفة 🔓'
                        : `فك قفل (${selectedScope}) 🔓`
                      : 'Unlock Selected Scope 🔓'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => lockAllPoints(selectedScope)}
                  className="py-2.5 px-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 hover:text-amber-200 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {isAr
                      ? selectedScope === 'all'
                        ? 'قفل كافة النقاط 🔒'
                        : selectedScope === 'uncategorized'
                        ? 'قفل غير المصنفة 🔒'
                        : `قفل (${selectedScope}) 🔒`
                      : 'Lock Selected Scope 🔒'}
                  </span>
                </button>
              </div>

              {/* Quick One-Click Full Project Unlock Banner */}
              {lockedCount > 0 && selectedScope !== 'all' && (
                <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAr ? 'إجراء سريع وشامل:' : 'Quick global action:'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => unlockAllPoints('all')}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Unlock className="w-3 h-3" />
                    <span>{isAr ? 'فك قفل كل شيء (المشروع كاملاً)' : 'Unlock Everything'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Elevation & Automation Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <h4 className="font-bold text-slate-200 text-xs">
                {isAr ? 'البيانات والأتمتة واللغة' : 'Data, Automation & Language'}
              </h4>
            </div>

            {/* Language Selection */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <label className="font-bold text-slate-200 text-xs block">
                  {isAr ? 'لغة الواجهة (Language)' : 'Interface Language'}
                </label>
                <p className="text-[11px] text-slate-400">
                  {isAr ? 'التنقل بين اللغة العربية والإنجليزية' : 'Switch between Arabic and English'}
                </p>
              </div>

              <div className="flex gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setLanguage('ar')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    language === 'ar' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  العربية
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    language === 'en' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>

          {/* Modal Action Footer */}
          <div className="pt-2 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all"
            >
              {isAr ? 'حفظ وإغلاق' : 'Save & Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
