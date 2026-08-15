import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { getTranslation } from '../utils/translations';
import {
  PenTool,
  Type,
  Plus,
  Ruler,
  MousePointer2,
  ArrowLeftRight,
  Compass,
  Route,
  BoxSelect,
  Eraser,
  Mountain,
  Wrench,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
} from 'lucide-react';

export const AnnotationToolbar: React.FC = () => {
  const language = useStore((s) => s.language);
  const isAr = language === 'ar';

  const elevationProfile = useStore((s) => s.elevationProfile);
  const openElevationProfile = useStore((s) => s.openElevationProfile);
  const closeElevationProfile = useStore((s) => s.closeElevationProfile);

  const isDrawingLineMode = useStore((s) => s.isDrawingLineMode);
  const setIsDrawingLineMode = useStore((s) => s.setIsDrawingLineMode);
  const isAddingTextMode = useStore((s) => s.isAddingTextMode);
  const setIsAddingTextMode = useStore((s) => s.setIsAddingTextMode);
  
  const isAddingPointMode = useStore((s) => s.isAddingPointMode);
  const setIsAddingPointMode = useStore((s) => s.setIsAddingPointMode);
  const isMeasuringMode = useStore((s) => s.isMeasuringMode);
  const setIsMeasuringMode = useStore((s) => s.setIsMeasuringMode);
  const isSelectionMode = useStore((s) => s.isSelectionMode);
  const setIsSelectionMode = useStore((s) => s.setIsSelectionMode);
  const isEraserMode = useStore((s) => s.isEraserMode);
  const setIsEraserMode = useStore((s) => s.setIsEraserMode);
  const setIsEraserChoiceModalOpen = useStore((s) => s.setIsEraserChoiceModalOpen);

  const activeModal = useStore((s) => s.activeModal);
  const setActiveModal = useStore((s) => s.setActiveModal);

  // Expandable Extra Tools state
  const [isExtraToolsExpanded, setIsExtraToolsExpanded] = useState<boolean>(false);
  const extraToolsRef = useRef<HTMLDivElement>(null);

  // Check if any extra tool is currently active
  const isConverterActive = activeModal === 'converter';
  const isTwoPointMeasureActive = activeModal === 'two_point_measure';
  const isDrawLineActive = isDrawingLineMode;
  const isAddTextActive = isAddingTextMode;
  const isAnyExtraToolActive = isConverterActive || isTwoPointMeasureActive || isDrawLineActive || isAddTextActive;

  // Auto expand or close when clicking outside extra tools menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (extraToolsRef.current && !extraToolsRef.current.contains(e.target as Node)) {
        setIsExtraToolsExpanded(false);
      }
    };
    if (isExtraToolsExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExtraToolsExpanded]);

  // Clear modes helper
  const resetModes = () => {
    setIsDrawingLineMode(false);
    setIsAddingTextMode(false);
    setIsAddingPointMode(false);
    setIsMeasuringMode(false);
    setIsSelectionMode(false);
    setIsEraserMode(false);
  };

  const activeMode = isDrawingLineMode
    ? 'line'
    : isAddingTextMode
    ? 'text'
    : isAddingPointMode
    ? 'point'
    : isMeasuringMode
    ? 'measure'
    : isSelectionMode
    ? 'selection'
    : isEraserMode
    ? 'eraser'
    : 'none';

  return (
    <div
      dir="ltr"
      className={`absolute top-16 md:top-20 ${
        isAr ? 'right-2.5 md:right-4 items-end' : 'left-2.5 md:left-4 items-start'
      } z-[1000] flex flex-col gap-1.5 md:gap-2 max-h-[calc(100dvh-5rem)] overflow-y-auto overflow-x-visible scrollbar-none py-1 select-none`}
    >
      {/* Pointer (Select) Mode */}
      <button
        onClick={resetModes}
        className={`group relative flex ${
          isAr ? 'flex-row-reverse' : 'flex-row'
        } items-center h-10 md:h-11 rounded-2xl shadow-xl transition-all duration-300 ease-out cursor-pointer overflow-hidden ${
          activeMode === 'none' && !activeModal
            ? 'bg-slate-800 text-white ring-2 ring-slate-500 shadow-slate-900/50'
            : 'bg-slate-900/95 text-slate-300 hover:bg-slate-800 hover:text-white backdrop-blur-md border border-slate-700/60'
        }`}
        title={isAr ? 'تحديد وتصفح' : 'Select & Pan'}
      >
        <div className="w-10 md:w-11 h-10 md:h-11 flex items-center justify-center shrink-0">
          <MousePointer2 className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:scale-110" />
        </div>
        <span
          dir={isAr ? 'rtl' : 'ltr'}
          className={`max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 ${
            isAr ? 'group-hover:pl-3.5 group-hover:pr-1' : 'group-hover:pr-3.5 group-hover:pl-1'
          } text-xs font-bold whitespace-nowrap transition-all duration-300 ease-out`}
        >
          {isAr ? 'تحديد وتصفح' : 'Select & Pan'}
        </span>
      </button>

      {/* Windows Mouse Box Select & Move to Folder Tool */}
      <button
        onClick={() => {
          if (isSelectionMode) {
            resetModes();
          } else {
            resetModes();
            setIsSelectionMode(true);
          }
        }}
        className={`group relative flex ${
          isAr ? 'flex-row-reverse' : 'flex-row'
        } items-center h-10 md:h-11 rounded-2xl shadow-xl transition-all duration-300 ease-out cursor-pointer overflow-hidden ${
          isSelectionMode
            ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-indigo-600/40 animate-pulse'
            : 'bg-slate-900/95 text-slate-300 hover:bg-slate-800 hover:text-indigo-400 backdrop-blur-md border border-slate-700/60'
        }`}
        title={isAr ? 'تحديد وسحب ماوس لمجموعة نقاط' : 'Box Select & Move'}
      >
        <div className="w-10 md:w-11 h-10 md:h-11 flex items-center justify-center shrink-0">
          <BoxSelect className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:scale-110" />
        </div>
        <span
          dir={isAr ? 'rtl' : 'ltr'}
          className={`max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 ${
            isAr ? 'group-hover:pl-3.5 group-hover:pr-1' : 'group-hover:pr-3.5 group-hover:pl-1'
          } text-xs font-bold whitespace-nowrap transition-all duration-300 ease-out`}
        >
          {isSelectionMode
            ? isAr
              ? 'تحديد وسحب ماوس نشط'
              : 'Box Select Active'
            : isAr
            ? 'تحديد ونقل لمجلد (مربع ماوس)'
            : 'Box Select & Move to Folder'}
        </span>
      </button>

      {/* Eraser Tool Button - Directly Opens Eraser Choice Modal */}
      <button
        onClick={() => {
          if (isEraserMode) {
            resetModes();
          } else {
            setIsEraserChoiceModalOpen(true);
          }
        }}
        className={`group relative flex ${
          isAr ? 'flex-row-reverse' : 'flex-row'
        } items-center h-10 md:h-11 rounded-2xl shadow-xl transition-all duration-300 ease-out cursor-pointer overflow-hidden ${
          isEraserMode
            ? 'bg-rose-600 text-white ring-2 ring-rose-400 shadow-rose-600/40 animate-pulse'
            : 'bg-slate-900/95 text-slate-300 hover:bg-slate-800 hover:text-rose-400 backdrop-blur-md border border-slate-700/60'
        }`}
        title={isAr ? 'أداة الممحاة والحذف' : 'Eraser Tool'}
      >
        <div className="w-10 md:w-11 h-10 md:h-11 flex items-center justify-center shrink-0">
          <Eraser className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12" />
        </div>
        <span
          dir={isAr ? 'rtl' : 'ltr'}
          className={`max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 ${
            isAr ? 'group-hover:pl-3.5 group-hover:pr-1' : 'group-hover:pr-3.5 group-hover:pl-1'
          } text-xs font-bold whitespace-nowrap transition-all duration-300 ease-out`}
        >
          {isEraserMode
            ? isAr
              ? 'الممحاة نشطة (انقر واحذف)'
              : 'Click Eraser Active'
            : isAr
            ? 'أداة الممحاة والحذف'
            : 'Eraser & Deletion Tool'}
        </span>
      </button>

      <div className="w-7 h-px bg-slate-800/80 my-0.5 self-center" />

      {/* Add Point Mode Button */}
      <button
        onClick={() => {
          if (isAddingPointMode) {
            setIsAddingPointMode(false);
          } else {
            resetModes();
            setIsAddingPointMode(true);
          }
        }}
        className={`group relative flex ${
          isAr ? 'flex-row-reverse' : 'flex-row'
        } items-center h-10 md:h-11 rounded-2xl shadow-xl transition-all duration-300 ease-out cursor-pointer overflow-hidden ${
          isAddingPointMode
            ? 'bg-emerald-500 text-white ring-2 ring-emerald-400/90 shadow-emerald-500/40 animate-pulse'
            : 'bg-slate-900/95 text-slate-300 hover:bg-slate-800 hover:text-emerald-400 backdrop-blur-md border border-slate-700/60'
        }`}
        title={isAr ? 'إضافة نقطة جديدة على الخريطة' : 'Add New Point'}
      >
        <div className="w-10 md:w-11 h-10 md:h-11 flex items-center justify-center shrink-0">
          <Plus className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110" />
        </div>
        <span
          dir={isAr ? 'rtl' : 'ltr'}
          className={`max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 ${
            isAr ? 'group-hover:pl-3.5 group-hover:pr-1' : 'group-hover:pr-3.5 group-hover:pl-1'
          } text-xs font-bold whitespace-nowrap transition-all duration-300 ease-out`}
        >
          {isAddingPointMode ? (isAr ? 'انقر على الخريطة لتحديد الموقع' : 'Click Map to Place') : getTranslation(language, 'addPoint')}
        </span>
      </button>

      {/* Measure Distance (Continuous) */}
      <button
        onClick={() => {
          if (isMeasuringMode) {
            setIsMeasuringMode(false);
          } else {
            resetModes();
            setIsMeasuringMode(true);
          }
        }}
        className={`group relative flex ${
          isAr ? 'flex-row-reverse' : 'flex-row'
        } items-center h-10 md:h-11 rounded-2xl shadow-xl transition-all duration-300 ease-out cursor-pointer overflow-hidden ${
          isMeasuringMode
            ? 'bg-sky-500 text-white ring-2 ring-sky-400/80 shadow-sky-500/30'
            : 'bg-slate-900/95 text-slate-300 hover:bg-slate-800 hover:text-sky-400 backdrop-blur-md border border-slate-700/60'
        }`}
        title={getTranslation(language, 'measureDistance')}
      >
        <div className="w-10 md:w-11 h-10 md:h-11 flex items-center justify-center shrink-0">
          <Ruler className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12" />
        </div>
        <span
          dir={isAr ? 'rtl' : 'ltr'}
          className={`max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 ${
            isAr ? 'group-hover:pl-3.5 group-hover:pr-1' : 'group-hover:pr-3.5 group-hover:pl-1'
          } text-xs font-bold whitespace-nowrap transition-all duration-300 ease-out`}
        >
          {getTranslation(language, 'measureDistance')}
        </span>
      </button>

      {/* Road Stationing / Line Stationing */}
      <button
        onClick={() => setActiveModal(activeModal === 'line_stationing' ? null : 'line_stationing')}
        className={`group relative flex ${
          isAr ? 'flex-row-reverse' : 'flex-row'
        } items-center h-10 md:h-11 rounded-2xl shadow-xl transition-all duration-300 ease-out cursor-pointer overflow-hidden ${
          activeModal === 'line_stationing'
            ? 'bg-amber-500 text-white ring-2 ring-amber-400/80 shadow-amber-500/30'
            : 'bg-slate-900/95 text-slate-300 hover:bg-slate-800 hover:text-amber-400 backdrop-blur-md border border-slate-700/60'
        }`}
        title={isAr ? 'تثبيت نقاط مسار' : 'Road Stationing'}
      >
        <div className="w-10 md:w-11 h-10 md:h-11 flex items-center justify-center shrink-0">
          <Route className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:scale-110" />
        </div>
        <span
          dir={isAr ? 'rtl' : 'ltr'}
          className={`max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 ${
            isAr ? 'group-hover:pl-3.5 group-hover:pr-1' : 'group-hover:pr-3.5 group-hover:pl-1'
          } text-xs font-bold whitespace-nowrap transition-all duration-300 ease-out`}
        >
          {isAr ? 'تثبيت نقاط مسار' : 'Road Stationing'}
        </span>
      </button>

      {/* Elevation Profile (المقطع التضاريسي) */}
      <button
        onClick={() => {
          if (elevationProfile.isOpen) {
            closeElevationProfile();
          } else {
            openElevationProfile({ sourceMode: 'sequence' });
          }
        }}
        className={`group relative flex ${
          isAr ? 'flex-row-reverse' : 'flex-row'
        } items-center h-10 md:h-11 rounded-2xl shadow-xl transition-all duration-300 ease-out cursor-pointer overflow-hidden ${
          elevationProfile.isOpen
            ? 'bg-sky-500 text-white ring-2 ring-sky-400/80 shadow-sky-500/40'
            : 'bg-slate-900/95 text-slate-300 hover:bg-slate-800 hover:text-sky-400 backdrop-blur-md border border-slate-700/60'
        }`}
        title={isAr ? 'المقطع التضاريسي للمناسيب' : 'Elevation Profile'}
      >
        <div className="w-10 md:w-11 h-10 md:h-11 flex items-center justify-center shrink-0">
          <Mountain className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:scale-110" />
        </div>
        <span
          dir={isAr ? 'rtl' : 'ltr'}
          className={`max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 ${
            isAr ? 'group-hover:pl-3.5 group-hover:pr-1' : 'group-hover:pr-3.5 group-hover:pl-1'
          } text-xs font-bold whitespace-nowrap transition-all duration-300 ease-out`}
        >
          {isAr ? 'بروفايل الارتفاع (المقطع التضاريسي)' : 'Elevation Profile'}
        </span>
      </button>

      <div className="w-7 h-px bg-slate-800/80 my-0.5 self-center" />

      {/* Expandable "Additional Tools" (أدوات إضافية) Group with Flyout Anchoring */}
      <div ref={extraToolsRef} className="relative flex flex-col items-end">
        {/* Main Expandable Toggle Button */}
        <button
          onClick={() => setIsExtraToolsExpanded(!isExtraToolsExpanded)}
          className={`group relative flex ${
            isAr ? 'flex-row-reverse' : 'flex-row'
          } items-center h-10 md:h-11 rounded-2xl shadow-xl transition-all duration-300 ease-out cursor-pointer overflow-hidden ${
            isExtraToolsExpanded || isAnyExtraToolActive
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white ring-2 ring-purple-400/80 shadow-purple-500/30'
              : 'bg-slate-900/95 text-slate-300 hover:bg-slate-800 hover:text-purple-300 backdrop-blur-md border border-slate-700/60'
          }`}
          title={isAr ? 'أدوات إضافية (محول، خطوط، نصوص، قياس)' : 'Additional Tools'}
        >
          <div className="w-10 md:w-11 h-10 md:h-11 flex items-center justify-center shrink-0 relative">
            <Wrench className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 ${isExtraToolsExpanded ? 'rotate-45 scale-110 text-white' : 'group-hover:scale-110'}`} />
            {isAnyExtraToolActive && !isExtraToolsExpanded && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <span
            dir={isAr ? 'rtl' : 'ltr'}
            className={`max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 ${
              isAr ? 'group-hover:pl-3 group-hover:pr-1' : 'group-hover:pr-3 group-hover:pl-1'
            } text-xs font-bold whitespace-nowrap transition-all duration-300 ease-out flex items-center gap-1.5`}
          >
            <span>{isAr ? 'أدوات إضافية' : 'Additional Tools'}</span>
            {isExtraToolsExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 opacity-80" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            )}
          </span>
        </button>

        {/* Floating Flyout Menu (Expands gracefully beside the toolbar so it never pushes items down off screen) */}
        {isExtraToolsExpanded && (
          <div
            dir={isAr ? 'rtl' : 'ltr'}
            className={`absolute ${
              isAr ? 'right-full mr-2' : 'left-full ml-2'
            } top-0 flex flex-col gap-1.5 p-2.5 bg-slate-950/95 border border-purple-500/40 rounded-2xl shadow-2xl backdrop-blur-2xl min-w-[220px] max-w-[calc(100vw-5rem)] z-[1100] animate-in fade-in zoom-in-95 duration-150`}
          >
            {/* Header with Title & Close */}
            <div className="flex items-center justify-between pb-1.5 mb-0.5 border-b border-slate-800/80 px-1">
              <div className="flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-bold text-slate-200">
                  {isAr ? 'أدوات إضافية' : 'Extra Tools'}
                </span>
              </div>
              <button
                onClick={() => setIsExtraToolsExpanded(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 1. Coordinate Converter (محول الإحداثيات) */}
            <button
              onClick={() => {
                setActiveModal(activeModal === 'converter' ? null : 'converter');
                setIsExtraToolsExpanded(false);
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                isConverterActive
                  ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30'
                  : 'text-slate-200 hover:bg-purple-950/60 hover:text-purple-300 border border-slate-800/60'
              }`}
            >
              <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col text-start">
                <span className="font-semibold">{isAr ? 'محول الإحداثيات' : 'Coordinate Converter'}</span>
                <span className="text-[10px] text-slate-400">UTM, Lat/Lng, MGRS</span>
              </div>
            </button>

            {/* 2. Draw Line (رسم خط توضيحي) */}
            <button
              onClick={() => {
                const st = useStore.getState();
                if (st.isDrawingLineMode) {
                  if (st.drawingLinePoints.length >= 2) {
                    st.saveDrawingLine({ color: '#ef4444', weight: 3 });
                  } else {
                    st.setIsDrawingLineMode(false);
                  }
                } else {
                  resetModes();
                  st.setIsDrawingLineMode(true);
                }
                setIsExtraToolsExpanded(false);
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                isDrawLineActive
                  ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-600/30'
                  : 'text-slate-200 hover:bg-rose-950/60 hover:text-rose-300 border border-slate-800/60'
              }`}
            >
              <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                <PenTool className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col text-start">
                <span className="font-semibold">{getTranslation(language, 'drawLine')}</span>
                <span className="text-[10px] text-slate-400">{isAr ? 'رسم خطوط ومسارات' : 'Sketch overlay lines'}</span>
              </div>
            </button>

            {/* 3. Add Text (إضافة نص) */}
            <button
              onClick={() => {
                if (isAddingTextMode) {
                  setIsAddingTextMode(false);
                } else {
                  resetModes();
                  setIsAddingTextMode(true);
                }
                setIsExtraToolsExpanded(false);
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                isAddTextActive
                  ? 'bg-amber-600 text-white font-bold shadow-md shadow-amber-600/30'
                  : 'text-slate-200 hover:bg-amber-950/60 hover:text-amber-300 border border-slate-800/60'
              }`}
            >
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <Type className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col text-start">
                <span className="font-semibold">{getTranslation(language, 'addText')}</span>
                <span className="text-[10px] text-slate-400">{isAr ? 'ملاحظات ونصوص توضيحية' : 'Text notes on map'}</span>
              </div>
            </button>

            {/* 4. 2-Point Measure (قياس المسافة بين نقطتين) */}
            <button
              onClick={() => {
                setActiveModal(activeModal === 'two_point_measure' ? null : 'two_point_measure');
                setIsExtraToolsExpanded(false);
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                isTwoPointMeasureActive
                  ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-600/30'
                  : 'text-slate-200 hover:bg-sky-950/60 hover:text-sky-300 border border-slate-800/60'
              }`}
            >
              <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col text-start">
                <span className="font-semibold">{isAr ? 'قياس بين نقطتين' : '2-Point Measure'}</span>
                <span className="text-[10px] text-slate-400">{isAr ? 'مسافة وسمت بين نقطتين' : 'Distance & bearing'}</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


