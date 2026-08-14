import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
  Trash2,
  X,
  AlertTriangle,
  Lock,
  Unlock,
  CheckSquare,
  Square,
  FolderPlus,
  FolderOpen,
  Folder,
  Plus,
  Check,
  BoxSelect,
  Layers,
  MapPin,
  ArrowRight,
} from 'lucide-react';

export const BatchActionModal: React.FC = () => {
  const activeModal = useStore((s) => s.activeModal);
  const language = useStore((s) => s.language);
  const isAr = language === 'ar';

  const points = useStore((s) => s.points);
  const categories = useStore((s) => s.categories);
  const selectedPointIds = useStore((s) => s.selectedPointIdsForAction);
  const batchDeletePoints = useStore((s) => s.batchDeletePoints);
  const updatePoint = useStore((s) => s.updatePoint);
  const addCategory = useStore((s) => s.addCategory);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const showToast = useStore((s) => s.showToast);

  const [activeTab, setActiveTab] = useState<'move' | 'delete'>('move');

  const eraserDeleteLockedPoints = useStore((s) => s.eraserDeleteLockedPoints);
  const [forceDeleteLocked, setForceDeleteLocked] = useState<boolean>(eraserDeleteLockedPoints);

  // Move Tab State
  const [targetCategory, setTargetCategory] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [customCategoryName, setCustomCategoryName] = useState<string>('');

  const [excludedPointIds, setExcludedPointIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (activeModal === 'batch_category') {
      setActiveTab('move');
      setForceDeleteLocked(useStore.getState().eraserDeleteLockedPoints);
      setExcludedPointIds(new Set());
      setIsCustomCategory(false);
      setCustomCategoryName('');
      
      // Default to first category if available
      const storeCategories = useStore.getState().categories;
      const pointCategories = Array.from(new Set(useStore.getState().points.map((p) => p.category).filter(Boolean))) as string[];
      const allCats = Array.from(new Set([...storeCategories, ...pointCategories]));
      if (allCats.length > 0) {
        setTargetCategory(allCats[0]);
      } else {
        setTargetCategory('');
      }
    }
  }, [activeModal]);

  // Selected Points object list
  const selectedPoints = useMemo(() => {
    const idSet = new Set(selectedPointIds);
    return points.filter((p) => idSet.has(p.id));
  }, [points, selectedPointIds]);

  const activeSelectedPoints = useMemo(() => {
    return selectedPoints.filter((pt) => !excludedPointIds.has(pt.id));
  }, [selectedPoints, excludedPointIds]);

  const lockedCount = useMemo(() => {
    return activeSelectedPoints.filter((pt) => pt.isLocked).length;
  }, [activeSelectedPoints]);

  const allCategories = useMemo(() => {
    const cats = new Set([...categories, ...points.map((p) => p.category).filter(Boolean)]);
    return Array.from(cats) as string[];
  }, [categories, points]);

  // Point count per category map
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    points.forEach((pt) => {
      if (pt.category) {
        map[pt.category] = (map[pt.category] || 0) + 1;
      }
    });
    return map;
  }, [points]);

  if (activeModal !== 'batch_category') return null;

  const handleToggleExclude = (id: string) => {
    const next = new Set(excludedPointIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExcludedPointIds(next);
  };

  const handleSelectAll = () => {
    setExcludedPointIds(new Set());
  };

  const handleDeselectAll = () => {
    setExcludedPointIds(new Set(selectedPoints.map((p) => p.id)));
  };

  // Perform Batch Delete
  const handleDelete = () => {
    if (activeSelectedPoints.length === 0) {
      showToast(isAr ? 'لم يتم تحديد أي نقاط للحذف' : 'No points selected for deletion', 'warning');
      return;
    }

    const idsToDelete = activeSelectedPoints.map((p) => p.id);
    batchDeletePoints(idsToDelete, forceDeleteLocked);
    setActiveModal(null);
  };

  // Perform Batch Move
  const handleMove = () => {
    const finalCategory = isCustomCategory ? customCategoryName.trim() : targetCategory;

    if (!finalCategory) {
      showToast(isAr ? 'الرجاء اختيار أو كتابة اسم المجلد / التصنيف' : 'Please select or enter a category/folder name', 'error');
      return;
    }

    if (activeSelectedPoints.length === 0) {
      showToast(isAr ? 'لم يتم تحديد أي نقاط للنقل' : 'No points selected to move', 'warning');
      return;
    }

    if (!categories.includes(finalCategory)) {
      addCategory(finalCategory);
    }

    let updatedCount = 0;
    activeSelectedPoints.forEach((pt) => {
      updatePoint(pt.id, { category: finalCategory });
      updatedCount++;
    });

    showToast(
      isAr
        ? `تم نقل ${updatedCount} نقطة إلى المجلد "${finalCategory}" بنجاح 📁`
        : `Successfully moved ${updatedCount} points to folder "${finalCategory}" 📁`,
      'success'
    );

    setActiveModal(null);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 md:p-4 animate-in fade-in duration-200">
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0 shadow-inner">
              <BoxSelect className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-extrabold text-white flex items-center gap-2">
                <span>{isAr ? 'تحديد وتجميع النقاط بالماوس' : 'Windows Mouse Box Selection'}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? `تم تحديد ${selectedPoints.length} نقطة عبر مربع التحديد بالماوس`
                  : `${selectedPoints.length} points selected via mouse rectangle`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Action Tabs */}
        <div className="p-3 bg-slate-950/50 border-b border-slate-800/80">
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('move')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'move'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>{isAr ? '📁 نقل إلى مجلد (موجود أو جديد)' : '📁 Move to Folder'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('delete')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'delete'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-1 ring-rose-400/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>{isAr ? '🗑️ حذف النقاط المحددة' : '🗑️ Delete Points'}</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === 'move' ? (
            /* MOVE TAB CONTENT */
            <div className="space-y-4">
              {/* Folder Selector Banner */}
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FolderPlus className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div>
                      <h3 className="text-xs md:text-sm font-bold text-indigo-200">
                        {isAr ? 'اختر مجلداً كوجهة للنقاط المحددة:' : 'Select Target Destination Folder:'}
                      </h3>
                      <p className="text-[11px] text-indigo-300/70">
                        {isAr
                          ? 'يمكنك النقر على مجلد فرعي موجود أو إضافة مجلد جديد بالكامل'
                          : 'Select an existing folder or create a new custom folder'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Existing Folders Chips Grid */}
                {allCategories.length > 0 && !isCustomCategory && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-400 block">
                      {isAr ? 'المجلدات المتاحة حالياً:' : 'Available Folders:'}
                    </span>
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                      {allCategories.map((cat) => {
                        const isSelected = targetCategory === cat;
                        const ptCount = categoryCounts[cat] || 0;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setIsCustomCategory(false);
                              setTargetCategory(cat);
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30 scale-105'
                                : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:border-indigo-500/50'
                            }`}
                          >
                            <Folder className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-indigo-400'}`} />
                            <span>{cat}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                isSelected ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {ptCount}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Toggle Create New Folder Input */}
                <div className="pt-2 border-t border-indigo-500/20">
                  {isCustomCategory ? (
                    <div className="space-y-2 animate-in fade-in duration-150">
                      <label className="text-xs font-bold text-indigo-300 block">
                        {isAr ? 'اسم المجلد الجديد:' : 'New Folder Name:'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customCategoryName}
                          onChange={(e) => setCustomCategoryName(e.target.value)}
                          placeholder={isAr ? 'مثال: مشروع الطريق، القطاع الشمالي...' : 'e.g., Road Project, North Sector...'}
                          className="flex-1 bg-slate-950 border border-indigo-500/60 rounded-xl px-4 py-2 text-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomCategory(false);
                            if (allCategories.length > 0) setTargetCategory(allCategories[0]);
                          }}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
                        >
                          {isAr ? 'إلغاء' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategory(true);
                        setCustomCategoryName('');
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-indigo-900/40 border border-dashed border-indigo-500/50 hover:border-indigo-400 text-indigo-300 text-xs font-bold transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isAr ? '+ إنشاء مجلد / تصنيف جديد' : '+ Create New Custom Folder'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Selected Points Preview List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300">
                      {isAr ? 'النقاط الجاري نقلها:' : 'Points to Move:'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {isAr ? `${activeSelectedPoints.length} نقطة` : `${activeSelectedPoints.length} points`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-indigo-400 hover:text-indigo-300 font-bold"
                    >
                      {isAr ? 'تحديد الكل' : 'Select All'}
                    </button>
                    <span className="text-slate-700">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-slate-400 hover:text-slate-300"
                    >
                      {isAr ? 'إلغاء التحديد' : 'Deselect All'}
                    </button>
                  </div>
                </div>

                {/* Points List Box */}
                <div className="border border-slate-800 bg-slate-950/90 rounded-2xl max-h-52 overflow-y-auto divide-y divide-slate-900 text-xs">
                  {selectedPoints.map((pt) => {
                    const isChecked = !excludedPointIds.has(pt.id);
                    return (
                      <div
                        key={pt.id}
                        onClick={() => handleToggleExclude(pt.id)}
                        className={`flex items-center justify-between p-2.5 cursor-pointer hover:bg-slate-900 transition-colors ${
                          !isChecked ? 'opacity-40 bg-slate-950' : 'bg-slate-900/30'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button type="button" className="text-slate-400 shrink-0">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-indigo-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600" />
                            )}
                          </button>
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: pt.color || '#ea4335' }}
                          />
                          <span className="font-bold text-slate-200 font-mono truncate">{pt.name}</span>
                          {pt.category ? (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] shrink-0">
                              {pt.category}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 text-[10px] italic shrink-0">
                              {isAr ? 'بدون مجلد' : 'Uncategorized'}
                            </span>
                          )}
                        </div>

                        <div className="text-right font-mono text-[11px] text-slate-400 shrink-0">
                          {pt.utm
                            ? `E: ${pt.utm.easting.toFixed(1)}, N: ${pt.utm.northing.toFixed(1)}`
                            : `${pt.lat.toFixed(4)}, ${pt.lng.toFixed(4)}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* DELETE TAB CONTENT */
            <div className="space-y-4">
              {/* Lock Protection Option */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {forceDeleteLocked ? (
                    <Unlock className="w-5 h-5 text-amber-400 shrink-0" />
                  ) : (
                    <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      {isAr ? 'التعامل مع النقاط المقفولة 🔒' : 'Locked Points Behavior 🔒'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {forceDeleteLocked
                        ? isAr
                          ? 'تحذير: سيتم حذف النقاط المقفولة أيضاً'
                          : 'Warning: Locked points will also be deleted'
                        : isAr
                        ? 'النقاط المقفولة محمية وسيتم تخطيها والحفاظ عليها'
                        : 'Locked points will be protected and preserved'}
                    </span>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-700/80 hover:bg-slate-800 transition-colors shrink-0">
                  <input
                    type="checkbox"
                    checked={forceDeleteLocked}
                    onChange={(e) => setForceDeleteLocked(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-slate-950 border-slate-700"
                  />
                  <span className="text-xs font-bold text-rose-300">
                    {isAr ? 'شمل النقاط المقفولة ⚠️' : 'Force Delete Locked ⚠️'}
                  </span>
                </label>
              </div>

              {/* Point Selection List for Deletion */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300">
                      {isAr ? 'قائمة النقاط المحددة:' : 'Selected Points List:'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {isAr ? `${activeSelectedPoints.length} نقطة للحذف` : `${activeSelectedPoints.length} points to delete`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-indigo-400 hover:text-indigo-300 font-bold"
                    >
                      {isAr ? 'تحديد الكل' : 'Select All'}
                    </button>
                    <span className="text-slate-700">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-slate-400 hover:text-slate-300"
                    >
                      {isAr ? 'إلغاء التحديد' : 'Deselect All'}
                    </button>
                  </div>
                </div>

                {/* Points List Table */}
                <div className="border border-slate-800 bg-slate-950/90 rounded-2xl max-h-52 overflow-y-auto divide-y divide-slate-900 text-xs">
                  {selectedPoints.map((pt) => {
                    const isChecked = !excludedPointIds.has(pt.id);
                    const isPtLocked = Boolean(pt.isLocked);
                    return (
                      <div
                        key={pt.id}
                        onClick={() => handleToggleExclude(pt.id)}
                        className={`flex items-center justify-between p-2.5 cursor-pointer hover:bg-slate-900/80 transition-colors ${
                          !isChecked ? 'opacity-40 bg-slate-950' : 'bg-slate-900/30'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button type="button" className="text-slate-400 hover:text-white shrink-0">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-rose-500" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600" />
                            )}
                          </button>
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: pt.color || '#ea4335' }}
                          />
                          <span className="font-bold text-slate-200 font-mono truncate">{pt.name}</span>
                          {pt.category && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] shrink-0">
                              {pt.category}
                            </span>
                          )}
                          {isPtLocked && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold shrink-0">
                              <Lock className="w-3 h-3" />
                              {isAr ? 'مقفل' : 'Locked'}
                            </span>
                          )}
                        </div>

                        <div className="text-right font-mono text-[11px] text-slate-400 shrink-0">
                          {pt.utm
                            ? `E: ${pt.utm.easting.toFixed(1)}, N: ${pt.utm.northing.toFixed(1)}`
                            : `${pt.lat.toFixed(4)}, ${pt.lng.toFixed(4)}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors text-xs md:text-sm"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>

          {activeTab === 'move' ? (
            <button
              type="button"
              onClick={handleMove}
              disabled={activeSelectedPoints.length === 0 || (!isCustomCategory && !targetCategory) || (isCustomCategory && !customCategoryName.trim())}
              className={`flex items-center gap-2 py-2.5 px-5 rounded-xl font-bold text-xs md:text-sm shadow-xl transition-all ${
                activeSelectedPoints.length === 0 || (!isCustomCategory && !targetCategory) || (isCustomCategory && !customCategoryName.trim())
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-95'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>
                {isAr
                  ? `نقل (${activeSelectedPoints.length}) نقطة إلى المجلد`
                  : `Move (${activeSelectedPoints.length}) Points`}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {lockedCount > 0 && !forceDeleteLocked && (
                <div className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {isAr ? `تخطي ${lockedCount} مقفلة` : `${lockedCount} locked skipped`}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleDelete}
                disabled={activeSelectedPoints.length === 0}
                className={`flex items-center gap-2 py-2.5 px-5 rounded-xl font-bold text-xs md:text-sm shadow-xl transition-all ${
                  activeSelectedPoints.length === 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 active:scale-95'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {isAr
                    ? `حذف النقاط المحددة (${activeSelectedPoints.length})`
                    : `Delete Selected (${activeSelectedPoints.length})`}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
