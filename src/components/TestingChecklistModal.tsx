import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getTranslation } from '../utils/translations';
import { CheckSquare, Square, X, ClipboardCheck, Sparkles, RotateCcw } from 'lucide-react';

interface ChecklistItem {
  id: string;
  categoryAr: string;
  categoryEn: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'c1',
    categoryAr: 'إنشاء وإضافة النقاط',
    categoryEn: 'Point Creation',
    titleAr: 'إضافة نقطة بنقرة على الخريطة',
    titleEn: 'Add point by clicking map',
    descAr: 'تفعيل وضع الإضافة ثم النقر على الخريطة لاستخلاص إحداثيات UTM وتسمية النقطة.',
    descEn: 'Activate Add Mode and click map to capture UTM coordinates and name the point.',
  },
  {
    id: 'c2',
    categoryAr: 'إنشاء وإضافة النقاط',
    categoryEn: 'Point Creation',
    titleAr: 'وضع الإضافة المتتالية السريعة ⚡',
    titleEn: 'Continuous Rapid Add Mode ⚡',
    descAr: 'تفعيل الإضافة المتتالية وإضافة عدة نقاط متتابعة بنقرات متتالية دون إغلاق الوضع.',
    descEn: 'Activate continuous add and click multiple times to instantly add points sequentially.',
  },
  {
    id: 'c3',
    categoryAr: 'تحريك وقفل النقاط',
    categoryEn: 'Dragging & Locking',
    titleAr: 'سحب العلامات مع Tooltip حي',
    titleEn: 'Drag markers with live UTM tooltip',
    descAr: 'سحب العلامة بالماوس أو اللمس مع ظهور الإحداثيات الحية أثناء السحب وحساب المسافة المقطوعة.',
    descEn: 'Drag marker with mouse or touch while floating live UTM tooltip follows cursor.',
  },
  {
    id: 'c4',
    categoryAr: 'تحريك وقفل النقاط',
    categoryEn: 'Dragging & Locking',
    titleAr: 'التراجع عن التحريك (MoveToast & Ctrl+Z)',
    titleEn: 'Revert move via MoveToast or Ctrl+Z',
    descAr: 'عند نقل نقطة، يظهر شريط MoveToast يتيح التراجع السريع أو التثبيت.',
    descEn: 'When point is moved, a MoveToast appears with Revert & Keep position options.',
  },
  {
    id: 'c5',
    categoryAr: 'تحريك وقفل النقاط',
    categoryEn: 'Dragging & Locking',
    titleAr: 'قفل النقاط لحمايتها 🔒',
    titleEn: 'Lock points for protection 🔒',
    descAr: 'قفل النقطة يمنع تحريكها بالخطأ أو حذفها حتى يتم فك القفل.',
    descEn: 'Locking a point prevents dragging and accidental deletion until unlocked.',
  },
  {
    id: 'c6',
    categoryAr: 'التعديل السريع',
    categoryEn: 'Inline Editing',
    titleAr: 'تعديل التصنيف والارتفاع مباشرة',
    titleEn: 'Inline edit category & Z elevation',
    descAr: 'تعديل تصنيف النقطة والارتفاع Z مباشرة من الكارت في القائمة الجانبية أو Bottom Sheet.',
    descEn: 'Edit category and elevation Z directly inside point cards without full modal.',
  },
  {
    id: 'c7',
    categoryAr: 'إكسل والاستيراد',
    categoryEn: 'Excel Import / Export',
    titleAr: 'تصدير النقاط إلى ملف Excel (.xlsx)',
    titleEn: 'Export points to Excel file (.xlsx)',
    descAr: 'تصدير جميع النقاط ببيانات UTM الكاملة والتصنيفات والتاريخ في شيت إكسل منظم.',
    descEn: 'Export all survey points with full UTM attributes into structured Excel sheet.',
  },
  {
    id: 'c8',
    categoryAr: 'إكسل والاستيراد',
    categoryEn: 'Excel Import / Export',
    titleAr: 'استيراد نقاط من Excel مع معاينة',
    titleEn: 'Import points from Excel with live preview',
    descAr: 'رفع ملف إكسل واكتشاف أعمدة UTM أو Lat/Lng تلقائياً واستيرادها.',
    descEn: 'Upload Excel file, auto-detect UTM or Lat/Lng columns and import seamlessly.',
  },
  {
    id: 'c9',
    categoryAr: 'قياس المسافات',
    categoryEn: 'Distance Measurement',
    titleAr: 'أداة قياس المسافات المساحية',
    titleEn: 'Geodesic Distance Measurement Tool',
    descAr: 'رسم مسار متعدد النقاط وحساب المسافة التراكمية بالمتر والكيلومتر.',
    descEn: 'Plot multi-node path and calculate total cumulative distance in meters/km.',
  },
  {
    id: 'c10',
    categoryAr: 'إيماءات الموبايل',
    categoryEn: 'Mobile Gestures',
    titleAr: 'Long-press وسحب Bottom Sheet',
    titleEn: 'Long-press map/marker & Bottom Sheet drag',
    descAr: 'الضغط المطول على الخريطة يفتح القائمة السريعة وسحب Bottom Sheet يغير ارتفاعه.',
    descEn: 'Long press map to trigger context popover and drag Bottom Sheet to expand/collapse.',
  },
  {
    id: 'c11',
    categoryAr: 'اختصارات وتصميم',
    categoryEn: 'Shortcuts & Layout',
    titleAr: 'تجنب الاختصارات أثناء الكتابة',
    titleEn: 'Disable shortcuts while typing in inputs',
    descAr: 'عدم تفعيل Ctrl+Z أو Delete أثناء الكتابة في مدخلات النصوص.',
    descEn: 'Ensure keyboard shortcuts like Ctrl+Z or Delete do not trigger inside form inputs.',
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TestingChecklistModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const language = useStore((s) => s.language);
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const isAr = language === 'ar';

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const resetAll = () => {
    setCheckedIds({});
  };

  const completedCount = Object.values(checkedIds).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);

  return (
    <div className="fixed inset-0 z-[5000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 pt-safe pb-safe animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <span>{isAr ? 'قائمة التحقق واختبار التطبيق' : 'GIS Application Testing Checklist'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'اختبار ميداني شامل لجميع وظائف النظام وإحداثيات UTM'
                  : 'Comprehensive field testing checklist for all GIS & UTM features'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between gap-4 text-xs font-mono shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">{isAr ? 'الإنجاز:' : 'Progress:'}</span>
            <span className="text-emerald-400 font-bold">
              {completedCount} / {CHECKLIST_ITEMS.length} ({progressPercent}%)
            </span>
          </div>

          <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden max-w-xs">
            <div
              className="bg-emerald-400 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <button
            onClick={resetAll}
            className="text-slate-400 hover:text-rose-400 text-xs flex items-center gap-1 transition-colors"
            title="إعادة ضبط الاختيارات"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isAr ? 'تصفير' : 'Reset'}</span>
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {CHECKLIST_ITEMS.map((item) => {
            const isChecked = Boolean(checkedIds[item.id]);

            return (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  isChecked
                    ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-100'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 text-slate-200'
                }`}
              >
                <div className="pt-0.5 shrink-0">
                  {isChecked ? (
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`font-bold text-xs ${
                        isChecked ? 'line-through text-emerald-300' : 'text-slate-100'
                      }`}
                    >
                      {isAr ? item.titleAr : item.titleEn}
                    </h4>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono border border-slate-700 shrink-0">
                      {isAr ? item.categoryAr : item.categoryEn}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {isAr ? item.descAr : item.descEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
          >
            {isAr ? 'إغلاق القائمة' : 'Close Checklist'}
          </button>
        </div>
      </div>
    </div>
  );
};
