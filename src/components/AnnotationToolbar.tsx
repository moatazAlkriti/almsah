import React from 'react';
import { useStore } from '../store/useStore';
import { getTranslation } from '../utils/translations';
import { PenTool, Type, Plus, Ruler, MousePointer2, ArrowLeftRight, Compass } from 'lucide-react';

export const AnnotationToolbar: React.FC = () => {
  const language = useStore((s) => s.language);
  const isAr = language === 'ar';

  const isDrawingLineMode = useStore((s) => s.isDrawingLineMode);
  const setIsDrawingLineMode = useStore((s) => s.setIsDrawingLineMode);
  const isAddingTextMode = useStore((s) => s.isAddingTextMode);
  const setIsAddingTextMode = useStore((s) => s.setIsAddingTextMode);
  
  const isAddingPointMode = useStore((s) => s.isAddingPointMode);
  const setIsAddingPointMode = useStore((s) => s.setIsAddingPointMode);
  const isMeasuringMode = useStore((s) => s.isMeasuringMode);
  const setIsMeasuringMode = useStore((s) => s.setIsMeasuringMode);

  const activeModal = useStore((s) => s.activeModal);
  const setActiveModal = useStore((s) => s.setActiveModal);

  // Clear modes helper
  const resetModes = () => {
    setIsDrawingLineMode(false);
    setIsAddingTextMode(false);
    setIsAddingPointMode(false);
    setIsMeasuringMode(false);
  };

  const activeMode = isDrawingLineMode ? 'line' : isAddingTextMode ? 'text' : isAddingPointMode ? 'point' : isMeasuringMode ? 'measure' : 'none';

  return (
    <div
      dir="ltr"
      className={`absolute top-20 md:top-24 ${
        isAr ? 'right-4 items-end' : 'left-4 items-start'
      } z-[1000] flex flex-col gap-2.5`}
    >
      {/* Pointer (Select) Mode */}
      <button
        onClick={resetModes}
        className={`group relative flex ${
          isAr ? 'flex-row-reverse' : 'flex-row'
        } items-center h-12 rounded-2xl shadow-xl transition-all duration-300 ease-out cursor-pointer overflow-hidden ${
          activeMode === 'none' && !activeModal
            ? 'bg-slate-800 text-white ring-2 ring-slate-500 shadow-slate-900/50'
            : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white backdrop-blur-md border border-slate-700/60'
        }`}
      >
        <div className="w-12 h-12 flex items-center justify-center shrink-0">
          <MousePointer2 className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
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

      <div className="w-8 h-px bg-slate-800/80 my-0.5 self-center" />

      {/* Add Point */}
      <button
        onClick={() => setIsAddingPointMode(!isAddingPointMode)}
        className={`group relative flex ${
          isAr ? 'flex-row-reverse' : 'flex-row'
        } items-center h-12 rounded-2xl shadow-xl transition-all duration-300 ease-out cursor-pointer overflow-hidden ${
          isAddingPointMode
            ? 'bg-emerald-500 text-white ring-2 ring-emerald-400/80 shadow-emerald-500/30'
            : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-emerald-400 backdrop-blur-md border border-slate-700/60'
        }`}
      >
        <div className="w-12 h-12 flex items-center justify-center shrink-0">
          <Plus className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110" />
        </div>
        <span
          dir={isAr ? 'rtl' : 'ltr'}
          className={`max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 ${
            isAr ? 'group-hover:pl-3.5 group-hover:pr-1' : 'group-hover:pr-3.5 group-hover:pl-1'
          } text-xs font-bold whitespace-nowrap transition-all duration-300 ease-out`}
        >
          {getTranslation(language, 'addPoint')}
        </span>
      </button>

      {/* Measure Distance (Continuous) */}
      <button
        onClick={() => setIsMeasuringMode(!isMeasuringMode)}
        className={`group relative flex ${
          isAr ? 'flex-row-reverse' : 'flex-row'
        } items-center h-12 rounded-2xl shadow-xl transition-all duration-300 ease-out cursor-pointer overflow-hidden ${
          isMeasuringMode
            ? 'bg-sky-500 text-white ring-2 ring-sky-400/80 shadow-sky-500/30'
            : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-sky-400 backdrop-blur-md border border-slate-700/60'
        }`}
      >
        <div className="w-12 h-12 flex items-center justify-center shrink-0">
          <Ruler className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12" />
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

      {/* 2-Point Measure */}
      <button
        onClick={() => setActiveModal(activeModal === 'two_point_measure' ? null : 'two_point_measure')}
        className={`group relative flex ${
          isAr ? 'flex-row-reverse' : 'flex-row'
        } items-center h-12 rounded-2xl shadow-xl transition-all duration-300 ease-out cursor-pointer overflow-hidden ${
          activeModal === 'two_point_measure'
            ? 'bg-amber-500 text-white ring-2 ring-amber-400/80 shadow-amber-500/30'
            : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-amber-400 backdrop-blur-md border border-slate-700/60'
        }`}
      >
        <div className="w-12 h-12 flex items-center justify-center shrink-0">
          <Compass className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-45" />
        </div>
        <span
          dir={isAr ? 'rtl' : 'ltr'}
          className={`max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 ${
            isAr ? 'group-hover:pl-3.5 group-hover:pr-1' : 'group-hover:pr-3.5 group-hover:pl-1'
          } text-xs font-bold whitespace-nowrap transition-all duration-300 ease-out`}
        >
          {isAr ? 'قياس بين نقطتين' : '2-Point Measure'}
        </span>
      </button>

      {/* Coordinate Converter */}
      <button
        onClick={() => setActiveModal(activeModal === 'converter' ? null : 'converter')}
        className={`group relative flex ${
          isAr ? 'flex-row-reverse' : 'flex-row'
        } items-center h-12 rounded-2xl shadow-xl transition-all duration-300 ease-out cursor-pointer overflow-hidden ${
          activeModal === 'converter'
            ? 'bg-purple-500 text-white ring-2 ring-purple-400/80 shadow-purple-500/30'
            : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-purple-400 backdrop-blur-md border border-slate-700/60'
        }`}
      >
        <div className="w-12 h-12 flex items-center justify-center shrink-0">
          <ArrowLeftRight className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
        </div>
        <span
          dir={isAr ? 'rtl' : 'ltr'}
          className={`max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 ${
            isAr ? 'group-hover:pl-3.5 group-hover:pr-1' : 'group-hover:pr-3.5 group-hover:pl-1'
          } text-xs font-bold whitespace-nowrap transition-all duration-300 ease-out`}
        >
          {isAr ? 'محول الإحداثيات' : 'Coordinate Converter'}
        </span>
      </button>

      <div className="w-8 h-px bg-slate-800/80 my-0.5 self-center" />

      {/* Draw Line */}
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
            st.setIsDrawingLineMode(true);
          }
        }}
        className={`group relative flex ${
          isAr ? 'flex-row-reverse' : 'flex-row'
        } items-center h-12 rounded-2xl shadow-xl transition-all duration-300 ease-out cursor-pointer overflow-hidden ${
          isDrawingLineMode
            ? 'bg-rose-500 text-white ring-2 ring-rose-400/80 shadow-rose-500/30'
            : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-rose-400 backdrop-blur-md border border-slate-700/60'
        }`}
      >
        <div className="w-12 h-12 flex items-center justify-center shrink-0">
          <PenTool className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
        </div>
        <span
          dir={isAr ? 'rtl' : 'ltr'}
          className={`max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 ${
            isAr ? 'group-hover:pl-3.5 group-hover:pr-1' : 'group-hover:pr-3.5 group-hover:pl-1'
          } text-xs font-bold whitespace-nowrap transition-all duration-300 ease-out`}
        >
          {getTranslation(language, 'drawLine')}
        </span>
      </button>

      {/* Add Text */}
      <button
        onClick={() => setIsAddingTextMode(!isAddingTextMode)}
        className={`group relative flex ${
          isAr ? 'flex-row-reverse' : 'flex-row'
        } items-center h-12 rounded-2xl shadow-xl transition-all duration-300 ease-out cursor-pointer overflow-hidden ${
          isAddingTextMode
            ? 'bg-amber-500 text-white ring-2 ring-amber-400/80 shadow-amber-500/30'
            : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-amber-400 backdrop-blur-md border border-slate-700/60'
        }`}
      >
        <div className="w-12 h-12 flex items-center justify-center shrink-0">
          <Type className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
        </div>
        <span
          dir={isAr ? 'rtl' : 'ltr'}
          className={`max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 ${
            isAr ? 'group-hover:pl-3.5 group-hover:pr-1' : 'group-hover:pr-3.5 group-hover:pl-1'
          } text-xs font-bold whitespace-nowrap transition-all duration-300 ease-out`}
        >
          {getTranslation(language, 'addText')}
        </span>
      </button>
    </div>
  );
};

