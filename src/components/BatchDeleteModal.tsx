import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Trash2, X, AlertTriangle, Filter, Hash, Type, Folder, Palette, CheckSquare, Square, Lock, Unlock } from 'lucide-react';
import { SurveyPoint } from '../types';

type DeleteFilterMode = 'range' | 'name' | 'folder' | 'color';

export const BatchDeleteModal: React.FC = () => {
  const activeModal = useStore((s) => s.activeModal);
  const language = useStore((s) => s.language);
  const isAr = language === 'ar';

  const points = useStore((s) => s.points);
  const categories = useStore((s) => s.categories);
  const batchDeletePoints = useStore((s) => s.batchDeletePoints);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const showToast = useStore((s) => s.showToast);

  const [filterMode, setFilterMode] = useState<DeleteFilterMode>('range');
  
  // Range filter state
  const [rangeStart, setRangeStart] = useState<string>('160');
  const [rangeEnd, setRangeEnd] = useState<string>('189');
  const [rangeType, setRangeType] = useState<'numberInName' | 'sequenceIndex'>('numberInName');

  // Name filter state
  const [nameQuery, setNameQuery] = useState<string>('');
  const [nameMatchType, setNameMatchType] = useState<'startsWith' | 'contains' | 'endsWith'>('startsWith');

  // Folder filter state
  const [selectedFolder, setSelectedFolder] = useState<string>('all');

  // Color filter state
  const [selectedColor, setSelectedColor] = useState<string>('all');

  const eraserDeleteLockedPoints = useStore((s) => s.eraserDeleteLockedPoints);
  const [forceDeleteLocked, setForceDeleteLocked] = useState<boolean>(eraserDeleteLockedPoints);

  React.useEffect(() => {
    if (activeModal === 'batch_delete') {
      setForceDeleteLocked(useStore.getState().eraserDeleteLockedPoints);
    }
  }, [activeModal]);

  // Selected for deletion (set of point IDs)
  const [excludedPointIds, setExcludedPointIds] = useState<Set<string>>(new Set());

  // Distinct colors in points
  const uniqueColors = useMemo(() => {
    const set = new Set<string>();
    points.forEach((p) => {
      if (p.color) set.add(p.color);
    });
    return Array.from(set);
  }, [points]);

  // Compute matched points based on active filter criteria
  const matchedPoints = useMemo(() => {
    return points.filter((pt, index) => {
      if (filterMode === 'range') {
        const start = parseInt(rangeStart.trim(), 10);
        const end = parseInt(rangeEnd.trim(), 10);

        if (isNaN(start) || isNaN(end)) return false;
        const minVal = Math.min(start, end);
        const maxVal = Math.max(start, end);

        if (rangeType === 'sequenceIndex') {
          const ptSeq = index + 1;
          return ptSeq >= minVal && ptSeq <= maxVal;
        } else {
          // Extract numeric parts from point name
          const match = pt.name.match(/\d+/);
          if (match) {
            const num = parseInt(match[0], 10);
            return num >= minVal && num <= maxVal;
          }
          return false;
        }
      }

      if (filterMode === 'name') {
        const q = nameQuery.trim().toLowerCase();
        if (!q) return false;
        const ptName = pt.name.toLowerCase();

        if (nameMatchType === 'startsWith') return ptName.startsWith(q);
        if (nameMatchType === 'endsWith') return ptName.endsWith(q);
        return ptName.includes(q);
      }

      if (filterMode === 'folder') {
        if (selectedFolder === 'all') return true;
        const cat = (pt.category || '').trim();
        if (selectedFolder === '__uncategorized__') {
          return !cat || ['عام', 'General', 'other', 'Other', 'General Points', 'نقاط عامة'].includes(cat);
        }
        return cat === selectedFolder;
      }

      if (filterMode === 'color') {
        if (selectedColor === 'all') return true;
        return (pt.color || '#ea4335').toLowerCase() === selectedColor.toLowerCase();
      }

      return false;
    });
  }, [points, filterMode, rangeStart, rangeEnd, rangeType, nameQuery, nameMatchType, selectedFolder, selectedColor]);

  // Filter out excluded points
  const pointsToDelete = useMemo(() => {
    return matchedPoints.filter((pt) => !excludedPointIds.has(pt.id));
  }, [matchedPoints, excludedPointIds]);

  const lockedCount = useMemo(() => {
    return pointsToDelete.filter((pt) => pt.isLocked).length;
  }, [pointsToDelete]);

  if (activeModal !== 'batch_delete') return null;

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
    setExcludedPointIds(new Set(matchedPoints.map((p) => p.id)));
  };

  const handleDeleteConfirm = () => {
    if (pointsToDelete.length === 0) {
      showToast(isAr ? 'لم يتم تحديد أي نقاط للحذف' : 'No points selected for deletion', 'warning');
      return;
    }

    const idsToDelete = pointsToDelete.map((p) => p.id);
    batchDeletePoints(idsToDelete, forceDeleteLocked);
    setActiveModal(null);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 md:p-4">
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                {isAr ? 'حذف مجموعة نقاط مخصصة' : 'Batch Delete Points'}
              </h2>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'اختر النطاق المتسلسل أو المعايير لحذف النقاط بسرعة وأمان'
                  : 'Select range or criteria to quickly and safely delete points'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5">
          {/* Filter Mode Selector Tabs */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2">
              {isAr ? 'طريقة تحديد النقاط المراد حذفها:' : 'How to select points to delete:'}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setFilterMode('range')}
                className={`flex items-center justify-center gap-2 py-2 px-2.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'range'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                <span>{isAr ? 'نطاق متسلسل (من.. إلى)' : 'Sequence Range'}</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('name')}
                className={`flex items-center justify-center gap-2 py-2 px-2.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'name'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>{isAr ? 'حسب الاسم / البادئة' : 'By Name / Prefix'}</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('folder')}
                className={`flex items-center justify-center gap-2 py-2 px-2.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'folder'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>{isAr ? 'حسب المجلد' : 'By Folder'}</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('color')}
                className={`flex items-center justify-center gap-2 py-2 px-2.5 rounded-lg text-xs font-bold transition-all ${
                  filterMode === 'color'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>{isAr ? 'حسب اللون' : 'By Color'}</span>
              </button>
            </div>
          </div>

          {/* Mode Configuration Controls */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
            {/* 1. Range Mode */}
            {filterMode === 'range' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-semibold">{isAr ? 'تحديد نطاق الأرقام المتسلسلة:' : 'Set Sequence Number Range:'}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRangeType('numberInName')}
                      className={`px-2.5 py-1 rounded text-xs transition-colors ${
                        rangeType === 'numberInName'
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isAr ? 'الرقم الموجود بالاسم (مثلاً 160 إلى 189)' : 'Number in Name (e.g. 160 to 189)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRangeType('sequenceIndex')}
                      className={`px-2.5 py-1 rounded text-xs transition-colors ${
                        rangeType === 'sequenceIndex'
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isAr ? 'ترتيب النقاط في الجدول (1 إلى N)' : 'List Order (1 to N)'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      {isAr ? 'من رقم:' : 'From number:'}
                    </label>
                    <input
                      type="number"
                      value={rangeStart}
                      onChange={(e) => setRangeStart(e.target.value)}
                      placeholder="160"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      {isAr ? 'إلى رقم:' : 'To number:'}
                    </label>
                    <input
                      type="number"
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(e.target.value)}
                      placeholder="189"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Name / Prefix Mode */}
            {filterMode === 'name' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNameMatchType('startsWith')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold ${
                      nameMatchType === 'startsWith'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isAr ? 'تبدأ بـ (Starts with)' : 'Starts with'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNameMatchType('contains')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold ${
                      nameMatchType === 'contains'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isAr ? 'تحتوي على (Contains)' : 'Contains'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNameMatchType('endsWith')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold ${
                      nameMatchType === 'endsWith'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isAr ? 'تنتهي بـ (Ends with)' : 'Ends with'}
                  </button>
                </div>
                <div>
                  <input
                    type="text"
                    value={nameQuery}
                    onChange={(e) => setNameQuery(e.target.value)}
                    placeholder={isAr ? 'اكتب الاسم أو البادئة (مثلاً: 16 أو ملحق)...' : 'Type name or prefix (e.g. 16 or Point)...'}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* 3. Folder Mode */}
            {filterMode === 'folder' && (
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">
                  {isAr ? 'اختر المجلد لحذف كافة نقاطه:' : 'Select folder to delete all its points:'}
                </label>
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-rose-500"
                >
                  <option value="all">{isAr ? '-- كافة النقاط في كل المجلدات --' : '-- All Folders --'}</option>
                  <option value="__uncategorized__">{isAr ? 'النقاط العامة (غير المصنفة)' : 'General (Uncategorized)'}</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 4. Color Mode */}
            {filterMode === 'color' && (
              <div className="space-y-2">
                <label className="text-xs text-slate-400 block">
                  {isAr ? 'اختر لون الدبوس المراد حذف نقاطه:' : 'Select pin color to delete:'}
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => setSelectedColor('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      selectedColor === 'all'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isAr ? 'كافة الألوان' : 'All Colors'}
                  </button>
                  {uniqueColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        selectedColor.toLowerCase() === color.toLowerCase()
                          ? 'border-white bg-slate-800 text-white ring-2 ring-rose-500'
                          : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full inline-block shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-mono text-[11px]">{color}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Locked Points Protection & Toggle */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {forceDeleteLocked ? (
                <Unlock className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  {isAr ? 'حماية النقاط المقفولة 🔒' : 'Locked Points Protection 🔒'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {forceDeleteLocked
                    ? isAr
                      ? 'سيتم حذف النقاط حتى وإن كانت مقفولة'
                      : 'Locked points will also be deleted'
                    : isAr
                    ? 'النقاط المقفولة محمية ولن تُحذف تلقائياً إلا إذا قمت بتفعيل الخيار'
                    : 'Locked points are protected from deletion'}
                </span>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700/80 hover:bg-slate-800 transition-colors shrink-0">
              <input
                type="checkbox"
                checked={forceDeleteLocked}
                onChange={(e) => setForceDeleteLocked(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-slate-950 border-slate-700"
              />
              <span className="text-xs font-semibold text-rose-300">
                {isAr ? 'شمل النقاط المقفولة ⚠️' : 'Force Include Locked ⚠️'}
              </span>
            </label>
          </div>

          {/* Matched Points Live Preview Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold text-slate-200">
                  {isAr ? 'معاينة النقاط المطابقة:' : 'Matching Points Preview:'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {isAr ? `${pointsToDelete.length} نقطة محددة للحذف` : `${pointsToDelete.length} points selected`}
                </span>
              </div>

              {matchedPoints.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    {isAr ? 'تحديد الكل' : 'Select All'}
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-slate-400 hover:text-slate-300"
                  >
                    {isAr ? 'إلغاء التحديد' : 'Deselect All'}
                  </button>
                </div>
              )}
            </div>

            {/* Matched Points List Table */}
            <div className="border border-slate-800 bg-slate-950/90 rounded-xl max-h-52 overflow-y-auto divide-y divide-slate-900 text-xs">
              {matchedPoints.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  {isAr ? 'لا توجد نقاط مطابقة للمعايير المحددة حالياً' : 'No points match the specified criteria'}
                </div>
              ) : (
                matchedPoints.map((pt) => {
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
                      <div className="flex items-center gap-2.5">
                        <button type="button" className="text-slate-400 hover:text-white">
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
                        <span className="font-bold text-slate-200 font-mono">{pt.name}</span>
                        {pt.category && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                            {pt.category}
                          </span>
                        )}
                        {isPtLocked && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                            <Lock className="w-3 h-3" />
                            {isAr ? 'مقفل' : 'Locked'}
                          </span>
                        )}
                      </div>

                      <div className="text-right font-mono text-[11px] text-slate-400">
                        {pt.utm
                          ? `E: ${pt.utm.easting.toFixed(1)}, N: ${pt.utm.northing.toFixed(1)}`
                          : `${pt.lat.toFixed(4)}, ${pt.lng.toFixed(4)}`}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors text-xs md:text-sm"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>

          <div className="flex items-center gap-2">
            {lockedCount > 0 && !forceDeleteLocked && (
              <div className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {isAr ? `سيتم تخطي ${lockedCount} نقطة مقفلة` : `${lockedCount} locked points will be skipped`}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={pointsToDelete.length === 0}
              className={`flex items-center gap-2 py-2.5 px-5 rounded-xl font-bold text-xs md:text-sm shadow-xl transition-all ${
                pointsToDelete.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 active:scale-95'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>
                {isAr
                  ? `حذف النقاط المحددة (${pointsToDelete.length})`
                  : `Delete Selected (${pointsToDelete.length})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
