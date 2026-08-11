import React from 'react';
import { useStore } from '../store/useStore';
import { getTranslation } from '../utils/translations';
import { X, CheckCircle, AlertTriangle, MapPin, Milestone, Type } from 'lucide-react';

export const ImportResultModal: React.FC = () => {
  const activeModal = useStore((s) => s.activeModal);
  const language = useStore((s) => s.language);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const importResult = useStore((s) => s.importResult);

  if (activeModal !== 'import_result' || !importResult) return null;

  const isAr = language === 'ar';

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 pt-safe pb-safe">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-100 text-sm">
              {getTranslation(language, 'importSummary')}
            </h3>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-right dir-rtl">
          {/* Big Success Greeting */}
          <div className="text-center space-y-2 py-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle className="w-6 h-6 animate-bounce" />
            </div>
            <h4 className="font-bold text-slate-100 text-sm">
              {isAr ? 'تم استيراد المشروع بنجاح!' : 'Project imported successfully!'}
            </h4>
            <p className="text-slate-400 text-xs">
              {isAr ? 'تم جلب جميع البيانات ومطابقتها مع إحداثيات الخريطة.' : 'All features parsed and projected onto the map.'}
            </p>
          </div>

          {/* Counts metrics */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 px-1">
              {isAr ? 'العناصر المستوردة:' : 'Imported elements:'}
            </label>

            <div className="grid grid-cols-3 gap-2 text-center">
              {/* Points */}
              <div className="p-3 bg-slate-950/50 rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center gap-1">
                <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-100 text-sm mt-1">{importResult.pointsCount}</span>
                <span className="text-[10px] text-slate-400 leading-tight">
                  {getTranslation(language, 'pointsImportedCount')}
                </span>
              </div>

              {/* Lines */}
              <div className="p-3 bg-slate-950/50 rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center gap-1">
                <div className="p-1.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/10">
                  <Milestone className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-100 text-sm mt-1">{importResult.linesCount}</span>
                <span className="text-[10px] text-slate-400 leading-tight">
                  {getTranslation(language, 'linesImported')}
                </span>
              </div>

              {/* Labels */}
              <div className="p-3 bg-slate-950/50 rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center gap-1">
                <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/10">
                  <Type className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-100 text-sm mt-1">{importResult.labelsCount}</span>
                <span className="text-[10px] text-slate-400 leading-tight">
                  {getTranslation(language, 'labelsImported')}
                </span>
              </div>
            </div>
          </div>

          {/* Warnings (if any exist) */}
          {importResult.warnings && importResult.warnings.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-rose-400 flex items-center gap-1.5 px-1">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>{isAr ? 'تنبيهات الاستيراد:' : 'Import alerts:'}</span>
              </label>
              <div className="max-h-24 overflow-y-auto p-3 bg-rose-500/5 border border-rose-500/20 rounded-2xl text-rose-300 text-[10px] space-y-1 scrollbar-thin">
                {importResult.warnings.map((w, idx) => (
                  <div key={idx} className="flex gap-1.5 leading-normal">
                    <span className="text-rose-500 shrink-0">•</span>
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2">
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/15 active:scale-95"
            >
              {isAr ? 'حسناً، تم' : 'Okay, Done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
