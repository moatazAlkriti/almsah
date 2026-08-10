import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../store/useStore';
import { getTranslation } from '../utils/translations';
import { getCategoryLabel } from '../utils/excel';
import { formatUTMString } from '../utils/utm';
import { PointCategory } from '../types';
import {
  ChevronUp,
  ChevronDown,
  Search,
  MapPin,
  Lock,
  Unlock,
  Navigation,
  Edit3,
  Trash2,
  Copy,
  Plus,
  Check,
  Sparkles,
  Crosshair,
  Layers,
} from 'lucide-react';


export const MobileBottomSheet: React.FC = () => {
  const points = useStore((s) => s.points);
  const selectedPointId = useStore((s) => s.selectedPointId);
  const language = useStore((s) => s.language);
  const searchQuery = useStore((s) => s.searchQuery);
  const selectedCategoryFilter = useStore((s) => s.selectedCategoryFilter);
  const isContinuousAddMode = useStore((s) => s.isContinuousAddMode);

  const setSelectedPointId = useStore((s) => s.setSelectedPointId);
  const setEditingPoint = useStore((s) => s.setEditingPoint);
  const deletePoint = useStore((s) => s.deletePoint);
  const togglePointLock = useStore((s) => s.togglePointLock);
  const updatePoint = useStore((s) => s.updatePoint);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const setSelectedCategoryFilter = useStore((s) => s.setSelectedCategoryFilter);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const setIsContinuousAddMode = useStore((s) => s.setIsContinuousAddMode);
  const showToast = useStore((s) => s.showToast);

  // Bottom Sheet Height States: 'peek' | 'half' | 'full'
  const [sheetState, setSheetState] = useState<'peek' | 'half' | 'full'>('peek');
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);

  // Inline edit state
  const [editCategory, setEditCategory] = useState<PointCategory>('control_point');
  const [editElevation, setEditElevation] = useState<string>('');

  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);

  const isAr = language === 'ar';

  const selectedPoint = useMemo(() => {
    return points.find((p) => p.id === selectedPointId);
  }, [points, selectedPointId]);

  const CATEGORIES: { id: string; labelKey: keyof typeof import('../utils/translations').translations['ar'] }[] = [
    { id: 'all', labelKey: 'allCategories' },
    { id: 'control_point', labelKey: 'control_point' },
    { id: 'boundary', labelKey: 'boundary' },
    { id: 'elevation', labelKey: 'elevation' },
    { id: 'infrastructure', labelKey: 'infrastructure' },
    { id: 'feature', labelKey: 'feature' },
    { id: 'other', labelKey: 'other' },
  ];

  const filteredPoints = useMemo(() => {
    return points.filter((pt) => {
      if (selectedCategoryFilter !== 'all' && pt.category !== selectedCategoryFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        pt.name.toLowerCase().includes(q) ||
        (pt.description || '').toLowerCase().includes(q) ||
        `${pt.utm.zone}${pt.utm.hemisphere}`.toLowerCase().includes(q) ||
        pt.utm.easting.toString().includes(q) ||
        pt.utm.northing.toString().includes(q)
      );
    });
  }, [points, searchQuery, selectedCategoryFilter]);

  // Touch drag gesture handlers for expanding/collapsing sheet
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const diff = startYRef.current - endY; // positive = swipe up

    if (diff > 35) {
      if (sheetState === 'peek') setSheetState('half');
      else if (sheetState === 'half') setSheetState('full');
    } else if (diff < -35) {
      if (sheetState === 'full') setSheetState('half');
      else if (sheetState === 'half') setSheetState('peek');
    }

    startYRef.current = null;
  };

  const toggleExpand = () => {
    if (sheetState === 'peek') setSheetState('half');
    else if (sheetState === 'half') setSheetState('full');
    else setSheetState('peek');
  };

  const startInlineEdit = (pt: typeof points[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setInlineEditingId(pt.id);
    setEditCategory(pt.category || 'other');
    setEditElevation(pt.elevation !== undefined ? String(pt.elevation) : '');
  };

  const saveInlineEdit = (ptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const elevNum = editElevation.trim() !== '' ? parseFloat(editElevation) : undefined;
    updatePoint(ptId, {
      category: editCategory,
      elevation: elevNum,
    });
    setInlineEditingId(null);
    showToast(isAr ? 'تم تحديث التصنيف والارتفاع' : 'Category & Elevation updated', 'success');
  };

  const heights = {
    peek: 'h-14',
    half: 'h-[48vh]',
    full: 'h-[88vh]',
  };

  return (
    <div
      ref={sheetRef}
      className={`fixed bottom-0 left-0 right-0 z-[1000] md:hidden bg-slate-900/98 border-t border-slate-800 rounded-t-3xl shadow-2xl backdrop-blur-2xl transition-all duration-300 ease-out flex flex-col pb-safe ${heights[sheetState]}`}
    >
      {/* Drag Handle Top Bar */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={toggleExpand}
        className="w-full h-14 flex flex-col items-center justify-between py-1.5 px-4 cursor-pointer select-none shrink-0 border-b border-slate-800/60"
      >
        <div className="w-10 h-1 bg-slate-700 rounded-full" />
        
        <div className="flex items-center justify-between w-full text-xs">
          <div className="flex items-center gap-2 line-clamp-1">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            {selectedPoint ? (
              <span className="font-bold text-emerald-300 text-xs truncate max-w-[180px]">
                {selectedPoint.name} ({selectedPoint.utm.zone}{selectedPoint.utm.hemisphere})
              </span>
            ) : (
              <span className="font-bold text-slate-100">
                {isAr ? 'نقاط الرفع المساحي' : 'Survey Points'}
              </span>
            )}
            <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[11px] px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
              {filteredPoints.length}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {sheetState === 'peek' ? (
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <span>{isAr ? 'سحب للأعلى' : 'Swipe up'}</span>
                <ChevronUp className="w-4 h-4 text-emerald-400 animate-bounce" />
              </span>
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content View */}
      {sheetState !== 'peek' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-3 space-y-3">
          {/* Quick Action FAB Row */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsContinuousAddMode(!isContinuousAddMode)}
              className={`flex-1 min-h-[44px] rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                isContinuousAddMode
                  ? 'bg-emerald-400 text-slate-950 ring-2 ring-emerald-300/80 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isContinuousAddMode
                  ? isAr ? 'وضع الإضافة المتتالية نشط ⚡' : 'Continuous Add Active ⚡'
                  : isAr ? 'وضع إضافة النقاط باللمس' : 'Add Points On Map'}
              </span>
            </button>

            <button
              onClick={() => setActiveModal('add_point')}
              className="min-h-[44px] px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
            >
              <Edit3 className="w-4 h-4" />
              <span>{isAr ? 'إدخال يدوي' : 'Manual'}</span>
            </button>
          </div>

          {/* Search Input Bar */}
          <div className="relative shrink-0">
            <Search className={`w-4 h-4 text-slate-400 absolute top-3 ${isAr ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={getTranslation(language, 'searchPlaceholder')}
              className={`w-full bg-slate-950 border border-slate-800 rounded-2xl min-h-[40px] ${
                isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
              } text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500`}
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`min-h-[36px] px-3 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center justify-center ${
                  selectedCategoryFilter === cat.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                    : 'bg-slate-800/80 text-slate-400 border border-slate-800'
                }`}
              >
                {getTranslation(language, cat.labelKey as any)}
              </button>
            ))}
          </div>

          {/* Points List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {filteredPoints.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-center text-slate-500 text-xs">
                {getTranslation(language, 'noPointsFound')}
              </div>
            ) : (
              filteredPoints.map((pt) => {
                const isSelected = selectedPointId === pt.id;
                const isEditingThis = inlineEditingId === pt.id;

                return (
                  <div
                    key={pt.id}
                    onClick={() => {
                      setSelectedPointId(pt.id);
                      setSheetState('peek'); // collapse to view map
                    }}
                    className={`p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-emerald-500/60 shadow-lg'
                        : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-md"
                          style={{ backgroundColor: pt.color || '#10b981' }}
                        />
                        <h4 className="font-bold text-slate-100 text-xs line-clamp-1">{pt.name}</h4>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {pt.isLocked && (
                          <span className="bg-amber-500/20 text-amber-300 p-1 rounded-lg border border-amber-500/30">
                            <Lock className="w-3 h-3" />
                          </span>
                        )}
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-lg border border-slate-700 font-medium">
                          {getCategoryLabel(pt.category, language)}
                        </span>
                      </div>
                    </div>

                    {/* UTM Grid */}
                    <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2 text-[11px] font-mono space-y-0.5 mb-2">
                      <div className="flex justify-between text-slate-400">
                        <span>Zone:</span>
                        <span className="text-amber-400 font-bold">{pt.utm.zone}{pt.utm.hemisphere}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Easting (X):</span>
                        <span className="text-emerald-400 font-semibold">{pt.utm.easting.toFixed(2)} m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Northing (Y):</span>
                        <span className="text-sky-400 font-semibold">{pt.utm.northing.toFixed(2)} m</span>
                      </div>
                      {pt.elevation !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Elevation (Z):</span>
                          <span className="text-indigo-400 font-semibold">{pt.elevation} m</span>
                        </div>
                      )}
                    </div>

                    {/* Inline Editing Controls for Category and Elevation */}
                    {isEditingThis ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl space-y-2 mb-2"
                      >
                        <div className="text-[11px] font-bold text-sky-400">
                          {isAr ? 'تعديل سريع للتصنيف والارتفاع:' : 'Quick Edit Category & Elevation:'}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value as PointCategory)}
                            className="bg-slate-950 border border-slate-800 text-slate-100 rounded-lg p-1.5 text-xs focus:outline-none"
                          >
                            <option value="control_point">{getTranslation(language, 'control_point')}</option>
                            <option value="boundary">{getTranslation(language, 'boundary')}</option>
                            <option value="elevation">{getTranslation(language, 'elevation')}</option>
                            <option value="infrastructure">{getTranslation(language, 'infrastructure')}</option>
                            <option value="feature">{getTranslation(language, 'feature')}</option>
                            <option value="other">{getTranslation(language, 'other')}</option>
                          </select>

                          <input
                            type="number"
                            step="0.01"
                            value={editElevation}
                            onChange={(e) => setEditElevation(e.target.value)}
                            placeholder="Z Elevation (m)"
                            className="bg-slate-950 border border-slate-800 text-slate-100 rounded-lg p-1.5 text-xs font-mono focus:outline-none"
                          />
                        </div>

                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInlineEditingId(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs"
                          >
                            {isAr ? 'إلغاء' : 'Cancel'}
                          </button>
                          <button
                            onClick={(e) => saveInlineEdit(pt.id, e)}
                            className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isAr ? 'حفظ' : 'Save'}</span>
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {/* Action Bar with >=44px Touch Targets */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePointLock(pt.id);
                          }}
                          className={`min-h-[40px] min-w-[40px] px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                            pt.isLocked
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {pt.isLocked ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={(e) => startInlineEdit(pt, e)}
                          className="min-h-[40px] px-2.5 rounded-xl bg-slate-800 text-sky-400 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>{isAr ? 'تعديل' : 'Edit'}</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const text = formatUTMString(pt.utm, language);
                            navigator.clipboard.writeText(text);
                            showToast(isAr ? 'تم نسخ الإحداثيات' : 'Coords copied', 'success');
                          }}
                          className="min-h-[40px] min-w-[40px] rounded-xl bg-slate-800 text-emerald-400 border border-slate-700 text-xs font-semibold flex items-center justify-center"
                          title="نسخ UTM"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPointId(pt.id);
                            setSheetState('peek');
                          }}
                          className="min-h-[40px] px-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1"
                        >
                          <Navigation className="w-4 h-4" />
                          <span>{isAr ? 'انتقال' : 'Go'}</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (pt.isLocked) {
                              showToast(isAr ? 'النقطة مقفلة! يجب فك القفل لتمكين الحذف' : 'Locked point!', 'error');
                              return;
                            }
                            deletePoint(pt.id);
                          }}
                          disabled={pt.isLocked}
                          className="min-h-[40px] min-w-[40px] rounded-xl bg-rose-500/10 text-rose-300 disabled:opacity-40 border border-rose-500/30 text-xs font-semibold flex items-center justify-center"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

