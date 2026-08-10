import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getTranslation } from '../utils/translations';
import { exportPointsToExcel } from '../utils/excel';
import {
  Compass,
  Plus,
  FileSpreadsheet,
  Upload,
  Ruler,
  Globe2,
  Lock,
  Menu,
  Crosshair,
  MapPin,
  Sparkles,
  ClipboardCheck,
  MoreVertical,
  SlidersHorizontal,
  X,
} from 'lucide-react';

export const Header: React.FC = () => {
  const points = useStore((s) => s.points);
  const language = useStore((s) => s.language);
  const manualZoneOverride = useStore((s) => s.manualZoneOverride);
  const isAddingPointMode = useStore((s) => s.isAddingPointMode);
  const isContinuousAddMode = useStore((s) => s.isContinuousAddMode);
  const isMeasuringMode = useStore((s) => s.isMeasuringMode);
  const sidebarOpen = useStore((s) => s.sidebarOpen);

  const setLanguage = useStore((s) => s.setLanguage);
  const setManualZoneOverride = useStore((s) => s.setManualZoneOverride);
  const setIsAddingPointMode = useStore((s) => s.setIsAddingPointMode);
  const setIsContinuousAddMode = useStore((s) => s.setIsContinuousAddMode);
  const setIsMeasuringMode = useStore((s) => s.setIsMeasuringMode);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const showToast = useStore((s) => s.showToast);

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false);

  const POPULAR_ZONES = [36, 37, 38, 39, 40, 35, 34, 33];
  const isAr = language === 'ar';

  const handleExport = () => {
    if (points.length === 0) {
      showToast(isAr ? 'لا توجد نقاط مساحية للتصدير' : 'No points to export', 'warning');
      return;
    }
    setActiveModal('export_excel');
  };

  return (
    <header className="h-14 md:h-16 bg-slate-900/98 border-b border-slate-800/80 px-3 md:px-4 flex items-center justify-between relative z-40 shadow-xl backdrop-blur-md pt-safe select-none">
      {/* Right side (RTL): Brand Title & Logo */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 md:p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          title="قائمة النقاط"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold shrink-0">
            <Compass className="w-4 h-4 md:w-5 md:h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-slate-100 text-sm md:text-base tracking-tight">
                {getTranslation(language, 'appTitle')}
              </h1>
              <span className="hidden lg:inline-flex text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                UTM WGS84
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {getTranslation(language, 'appSubtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Center & Actions: Interactive Mode Controls & Buttons */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Add Point Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowAddMenu(!showAddMenu);
              setShowMobileMoreMenu(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95 ${
              isContinuousAddMode
                ? 'bg-emerald-400 text-slate-950 font-extrabold ring-2 ring-emerald-300/80 animate-pulse'
                : isAddingPointMode
                ? 'bg-emerald-500 text-slate-950 font-bold ring-2 ring-emerald-400/50'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isContinuousAddMode ? <Sparkles className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {isContinuousAddMode
                ? isAr ? 'إضافة متتالية ⚡' : 'Continuous Add ⚡'
                : getTranslation(language, 'addPoint')}
            </span>
            <span className="sm:hidden font-bold">
              {isContinuousAddMode ? '⚡' : isAr ? 'إضافة' : 'Add'}
            </span>
          </button>

          {showAddMenu && (
            <div
              className={`absolute top-11 md:top-12 ${
                isAr ? 'right-0' : 'left-0'
              } bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 w-60 z-[2000] backdrop-blur-xl space-y-1`}
            >
              <button
                onClick={() => {
                  setIsContinuousAddMode(!isContinuousAddMode);
                  setShowAddMenu(false);
                }}
                className={`w-full text-right ${
                  language === 'en' ? 'text-left' : ''
                } px-3 py-2.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-2.5 ${
                  isContinuousAddMode
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                    : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{isAr ? 'وضع الإضافة المتتالية السريعة ⚡' : 'Continuous Rapid Add Mode ⚡'}</span>
              </button>

              <button
                onClick={() => {
                  setIsAddingPointMode(true);
                  setShowAddMenu(false);
                }}
                className={`w-full text-right ${
                  language === 'en' ? 'text-left' : ''
                } px-3 py-2.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-2.5 ${
                  isAddingPointMode && !isContinuousAddMode
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                    : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Crosshair className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{getTranslation(language, 'addByClick')}</span>
              </button>

              <button
                onClick={() => {
                  setIsAddingPointMode(false);
                  setIsContinuousAddMode(false);
                  setActiveModal('add_point');
                  setShowAddMenu(false);
                }}
                className="w-full text-right ${language === 'en' ? 'text-left' : ''} px-3 py-2.5 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-2.5"
              >
                <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{getTranslation(language, 'addManual')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Distance Measure Tool Button */}
        <button
          onClick={() => setIsMeasuringMode(!isMeasuringMode)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95 ${
            isMeasuringMode
              ? 'bg-amber-500 text-slate-950 font-bold ring-2 ring-amber-400/50'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
          title={getTranslation(language, 'measureDistance')}
        >
          <Ruler className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="hidden lg:inline">{getTranslation(language, 'measureDistance')}</span>
        </button>

        {/* Desktop-only Direct Excel Buttons */}
        <button
          onClick={handleExport}
          className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 px-3 py-2 rounded-xl text-xs font-semibold shadow-md transition-all hover:border-emerald-500/60"
          title={getTranslation(language, 'exportExcel')}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span className="hidden xl:inline">{getTranslation(language, 'exportExcel')}</span>
          <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-1.5 py-0.2 rounded-md">
            {points.length}
          </span>
        </button>

        <button
          onClick={() => setActiveModal('import_excel')}
          className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-500/30 px-3 py-2 rounded-xl text-xs font-semibold shadow-md transition-all hover:border-sky-500/60"
          title={getTranslation(language, 'importExcel')}
        >
          <Upload className="w-4 h-4" />
          <span className="hidden xl:inline">{getTranslation(language, 'importExcel')}</span>
        </button>

        {/* Desktop-only Zone Lock & Checklist & Lang */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-2.5 py-1.5 rounded-xl text-xs font-mono">
          <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-slate-400 text-[11px] font-sans hidden md:inline">
            {getTranslation(language, 'zoneOverride')}:
          </span>
          <select
            value={manualZoneOverride || ''}
            onChange={(e) => setManualZoneOverride(e.target.value ? parseInt(e.target.value, 10) : null)}
            className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-slate-900 text-slate-300">
              {getTranslation(language, 'allZones')}
            </option>
            {POPULAR_ZONES.map((z) => (
              <option key={z} value={z} className="bg-slate-900 text-slate-100">
                Zone {z}N
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          className="hidden sm:flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all"
          title="تغيير اللغة / Change Language"
        >
          <Globe2 className="w-4 h-4 text-emerald-400" />
          <span>{getTranslation(language, 'languageToggle')}</span>
        </button>

        {/* Mobile-only "More Tools" Menu Button */}
        <div className="relative sm:hidden">
          <button
            onClick={() => {
              setShowMobileMoreMenu(!showMobileMoreMenu);
              setShowAddMenu(false);
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl transition-all active:scale-95 flex items-center justify-center"
            title="أدوات إضافية"
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
          </button>

          {showMobileMoreMenu && (
            <div
              className={`absolute top-11 ${
                isAr ? 'left-0' : 'right-0'
              } bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2.5 w-64 z-[2000] backdrop-blur-xl space-y-2 animate-in fade-in zoom-in-95 duration-150`}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 px-1">
                <span className="text-xs font-bold text-slate-200">
                  {isAr ? 'أدوات وإعدادات المساح' : 'Al-Mussah Tools'}
                </span>
                <button
                  onClick={() => setShowMobileMoreMenu(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Excel Actions */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    handleExport();
                    setShowMobileMoreMenu(false);
                  }}
                  className="py-2 px-2.5 rounded-xl bg-slate-800 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 justify-center"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{isAr ? 'تصدير' : 'Export'}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveModal('import_excel');
                    setShowMobileMoreMenu(false);
                  }}
                  className="py-2 px-2.5 rounded-xl bg-slate-800 text-sky-400 border border-sky-500/30 text-xs font-semibold flex items-center gap-1.5 justify-center"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isAr ? 'استيراد' : 'Import'}</span>
                </button>
              </div>

              {/* Zone Override */}
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-sans">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{getTranslation(language, 'zoneOverride')}:</span>
                </div>
                <select
                  value={manualZoneOverride || ''}
                  onChange={(e) => {
                    setManualZoneOverride(e.target.value ? parseInt(e.target.value, 10) : null);
                    setShowMobileMoreMenu(false);
                  }}
                  className="w-full bg-slate-900 text-emerald-400 font-bold p-1.5 rounded-lg text-xs focus:outline-none cursor-pointer border border-slate-800"
                >
                  <option value="">{getTranslation(language, 'allZones')}</option>
                  {POPULAR_ZONES.map((z) => (
                    <option key={z} value={z}>
                      Zone {z}N
                    </option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div className="space-y-1 pt-1">
                <button
                  onClick={() => {
                    setLanguage(language === 'ar' ? 'en' : 'ar');
                    setShowMobileMoreMenu(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-2"
                >
                  <Globe2 className="w-4 h-4 text-emerald-400" />
                  <span>{getTranslation(language, 'languageToggle')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

