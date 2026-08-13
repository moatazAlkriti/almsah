import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { FolderPlus, FolderOpen, Save, X } from 'lucide-react';

export const BatchCategoryModal: React.FC = () => {
  const activeModal = useStore((s) => s.activeModal);
  const language = useStore((s) => s.language);
  const isAr = language === 'ar';
  
  const points = useStore((s) => s.points);
  const categories = useStore((s) => s.categories);
  const selectedPointIds = useStore((s) => s.selectedPointIdsForAction);
  const updatePoint = useStore((s) => s.updatePoint);
  const addCategory = useStore((s) => s.addCategory);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const showToast = useStore((s) => s.showToast);

  const [category, setCategory] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [customCategoryName, setCustomCategoryName] = useState<string>('');

  const allCategories = useMemo(() => {
    const cats = new Set([...categories, ...points.map((p) => p.category).filter(Boolean)]);
    return Array.from(cats) as string[];
  }, [categories, points]);

  if (activeModal !== 'batch_category') return null;

  const handleSave = () => {
    const finalCategory = isCustomCategory ? customCategoryName.trim() : category;
    
    if (!finalCategory) {
      showToast(isAr ? 'الرجاء اختيار أو كتابة اسم المجلد' : 'Please select or enter a category name', 'error');
      return;
    }

    if (!categories.includes(finalCategory)) {
      addCategory(finalCategory);
    }

    let updatedCount = 0;
    selectedPointIds.forEach(id => {
      updatePoint(id, { category: finalCategory });
      updatedCount++;
    });

    showToast(
      isAr 
        ? `تم نقل ${updatedCount} نقطة إلى المجلد "${finalCategory}" بنجاح` 
        : `Successfully moved ${updatedCount} points to "${finalCategory}"`,
      'success'
    );
    
    setActiveModal(null);
  };

  const handleClose = () => {
    setActiveModal(null);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <FolderOpen className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">
              {isAr ? 'نقل النقاط المحددة' : 'Move Selected Points'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-start gap-3">
            <FolderPlus className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-indigo-300">
                {isAr ? `تحديد ${selectedPointIds.length} نقاط` : `${selectedPointIds.length} Points Selected`}
              </h3>
              <p className="text-xs text-indigo-200/70 mt-1">
                {isAr 
                  ? 'اختر مجلداً موجوداً أو قم بإنشاء مجلد جديد لتجميع هذه النقاط فيه.' 
                  : 'Select an existing folder or create a new one to group these points.'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              {isAr ? 'المجلد / التصنيف' : 'Category / Folder'}
            </label>
            
            {isCustomCategory ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  placeholder={isAr ? 'اكتب اسم المجلد الجديد...' : 'Type new folder name...'}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomCategory(false);
                    setCategory(allCategories.length > 0 ? allCategories[0] : '');
                  }}
                  className="px-4 py-3 bg-slate-800 text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            ) : (
              <select
                value={category}
                onChange={(e) => {
                  if (e.target.value === '__NEW_CUSTOM_CAT__') {
                    setIsCustomCategory(true);
                  } else {
                    setCategory(e.target.value);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 appearance-none"
              >
                <option value="" disabled>
                  {isAr ? '-- اختر مجلداً --' : '-- Select a folder --'}
                </option>
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__NEW_CUSTOM_CAT__" className="text-indigo-400 font-bold">
                  {isAr ? '+ إنشاء مجلد/تصنيف جديد...' : '+ Create new folder/category...'}
                </option>
              </select>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-400 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <Save className="w-5 h-5" />
            {isAr ? 'حفظ ونقل' : 'Save & Move'}
          </button>
        </div>
      </div>
    </div>
  );
};
