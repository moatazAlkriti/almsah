import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  Eraser,
  BoxSelect,
  Lock,
  Unlock,
  X,
  Sparkles,
  MousePointerClick,
  CheckSquare,
  Square,
  AlertTriangle,
  Layers,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

export const EraserChoiceModal: React.FC = () => {
  const isEraserChoiceModalOpen = useStore((s) => s.isEraserChoiceModalOpen);
  const setIsEraserChoiceModalOpen = useStore((s) => s.setIsEraserChoiceModalOpen);
  const eraserDeleteLockedPoints = useStore((s) => s.eraserDeleteLockedPoints);
  const setEraserDeleteLockedPoints = useStore((s) => s.setEraserDeleteLockedPoints);
  const setIsEraserMode = useStore((s) => s.setIsEraserMode);
  const setIsSelectionMode = useStore((s) => s.setIsSelectionMode);
  const language = useStore((s) => s.language);
  const points = useStore((s) => s.points);
  const isAr = language === 'ar';

  const totalPoints = points.length;
  const lockedPointsCount = points.filter((p) => p.isLocked).length;

  if (!isEraserChoiceModalOpen) return null;

  const handleChooseClickDelete = () => {
    setIsEraserChoiceModalOpen(false);
    setIsSelectionMode(false);
    setIsEraserMode(true);
  };

  const handleChooseBoxSelectDelete = () => {
    setIsEraserChoiceModalOpen(false);
    setIsEraserMode(false);
    setIsSelectionMode(true);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 md:p-4 animate-in fade-in duration-200">
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-inner">
              <Eraser className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-extrabold text-white flex items-center gap-2">
                <span>{isAr ? 'أداة الممحاة والحذف السريع' : 'Quick Eraser & Deletion Tool'}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {isAr ? 'اختر النمط' : 'Choose Mode'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? 'اختر طريقة الحذف المطلوبة على الخريطة وحدد خيارات النقاط المقفولة'
                  : 'Select deletion interaction method and locked points options'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEraserChoiceModalOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-3.5">
            {/* Option 1: Click and Delete */}
            <button
              type="button"
              onClick={handleChooseClickDelete}
              className="w-full text-right p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-800/90 border-2 border-slate-800 hover:border-rose-500/70 transition-all group flex items-start gap-4 shadow-md relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all">
                <MousePointerClick className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm md:text-base font-bold text-white group-hover:text-rose-400 transition-colors">
                    {isAr ? '1. انقر واحذف (نقرة واحدة)' : '1. Click to Delete (Single-Click)'}
                  </h4>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20">
                    {isAr ? 'سريع ومباشر' : 'Instant & Direct'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {isAr
                    ? 'تفعيل مؤشر الممحاة على الخريطة، عند النقر على أي نقطة تُحذف فوراً بدون تأكيد إضافي.'
                    : 'Activate eraser cursor. Clicking any point deletes it immediately without prompts.'}
                </p>
              </div>
            </button>

            {/* Option 2: Box Select and Delete */}
            <button
              type="button"
              onClick={handleChooseBoxSelectDelete}
              className="w-full text-right p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-800/90 border-2 border-slate-800 hover:border-indigo-500/70 transition-all group flex items-start gap-4 shadow-md relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                <BoxSelect className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm md:text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {isAr ? '2. حدّد واحذف (سحب مربع بالماوس)' : '2. Box Select & Delete (Windows Mouse Drag)'}
                  </h4>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {isAr ? 'حذف مجموعة كاملة' : 'Batch Selection'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {isAr
                    ? 'اسحب مستطيل تحديد بالماوس (مثل وندوز) لتحديد مجموعة نقاط معاً وحذفها أو نقلها بنقرة واحدة.'
                    : 'Click & drag a rectangle on the map to select multiple points and batch delete or move them.'}
                </p>
              </div>
            </button>
          </div>

          {/* Locked Points Setting Toggle */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${eraserDeleteLockedPoints ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                  {eraserDeleteLockedPoints ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-200">
                    {isAr ? 'حذف النقاط المقفولة 🔒' : 'Delete Locked Points 🔒'}
                  </h5>
                  <p className="text-[11px] text-slate-400">
                    {isAr
                      ? `يوجد حالياً ${lockedPointsCount} نقطة مقفلة من أصل ${totalPoints} نقطة`
                      : `Currently ${lockedPointsCount} locked points out of ${totalPoints}`}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => setEraserDeleteLockedPoints(!eraserDeleteLockedPoints)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  eraserDeleteLockedPoints ? 'bg-amber-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    eraserDeleteLockedPoints
                      ? isAr
                        ? '-translate-x-5'
                        : 'translate-x-5'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className={`text-[11px] rounded-xl p-2.5 flex items-center gap-2 border ${
              eraserDeleteLockedPoints
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                {eraserDeleteLockedPoints
                  ? isAr
                    ? '⚠️ سيتم السماح بحذف النقاط المقفولة المحمية عند النقر عليها أو تحديدها.'
                    : '⚠️ Locked points will be allowed to be deleted when clicked or selected.'
                  : isAr
                  ? '🛡️ النقاط المقفولة محمية ومحصنة ولن تُحذف بالممحاة السريعة.'
                  : '🛡️ Locked points are safe and protected from accidental deletion.'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>{isAr ? 'يمكنك إيقاف وضع الحذف في أي وقت بالضغط على ESC' : 'You can exit at any time with ESC key'}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsEraserChoiceModalOpen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};
