import React from 'react';
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
} from 'lucide-react';
import { Hemisphere } from '../types';

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
  const showToast = useStore((s) => s.showToast);

  const isAr = language === 'ar';

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
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setActiveModal('converter')}
              className="p-3.5 bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl flex flex-col gap-2 text-right transition-all group hover:bg-slate-900/80"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:scale-110 transition-transform">
                <ArrowLeftRight className="w-4 h-4" />
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
              className="p-3.5 bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 rounded-2xl flex flex-col gap-2 text-right transition-all group hover:bg-slate-900/80"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30 group-hover:scale-110 transition-transform">
                <Ruler className="w-4 h-4" />
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
