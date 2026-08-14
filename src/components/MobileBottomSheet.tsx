import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../store/useStore';
import { getTranslation } from '../utils/translations';
import { getCategoryLabel } from '../utils/excel';
import { formatUTMString, getMGRSBandFromLat, latLngToMGRS } from '../utils/utm';
import { fetchElevation } from '../utils/elevation';
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
  Mountain,
  RotateCw,
  Loader2,
  ArrowLeftRight,
  Ruler,
  Settings,
} from 'lucide-react';


export const MobileBottomSheet: React.FC = () => {
  const points = useStore((s) => s.points);
  const selectedPointId = useStore((s) => s.selectedPointId);
  const language = useStore((s) => s.language);
  const searchQuery = useStore((s) => s.searchQuery);
  const selectedCategoryFilter = useStore((s) => s.selectedCategoryFilter);
  const isContinuousAddMode = useStore((s) => s.isContinuousAddMode);

  const autoFetchElevation = useStore((s) => s.autoFetchElevation);
  const setAutoFetchElevation = useStore((s) => s.setAutoFetchElevation);

  const setSelectedPointId = useStore((s) => s.setSelectedPointId);
  const setEditingPoint = useStore((s) => s.setEditingPoint);
  const deletePoint = useStore((s) => s.deletePoint);
  const togglePointLock = useStore((s) => s.togglePointLock);
  const updatePoint = useStore((s) => s.updatePoint);
  const clearAllPoints = useStore((s) => s.clearAllPoints);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const setSelectedCategoryFilter = useStore((s) => s.setSelectedCategoryFilter);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const setPointToPointMeasure = useStore((s) => s.setPointToPointMeasure);
  const setIsContinuousAddMode = useStore((s) => s.setIsContinuousAddMode);
  const showToast = useStore((s) => s.showToast);
  const storeCategories = useStore((s) => s.categories);

  const quickMapPopover = useStore((s) => s.quickMapPopover);
  const contextMenu = useStore((s) => s.contextMenu);
  const setQuickMapPopover = useStore((s) => s.setQuickMapPopover);
  const setContextMenu = useStore((s) => s.setContextMenu);

  // Bottom Sheet Height States: 'peek' | 'half' | 'full'
  const [sheetState, setSheetState] = useState<'peek' | 'half' | 'full'>('peek');
  const [expandedPointId, setExpandedPointId] = useState<string | null>(null);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);

  // 5-second Safety Countdown for Clear All
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [clearCountdown, setClearCountdown] = useState(5);

  React.useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isConfirmingClear) {
      setClearCountdown(5);
      timer = setInterval(() => {
        setClearCountdown((prev) => {
          if (prev <= 1) {
            if (timer) clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setClearCountdown(5);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isConfirmingClear]);

  // Auto minimize bottom sheet when map popover or context menu opens
  React.useEffect(() => {
    if (quickMapPopover || contextMenu) {
      setSheetState('peek');
    }
  }, [quickMapPopover, contextMenu]);

  // Tabs
  const [activeTab, setActiveTab] = useState<'points' | 'annotations'>('points');

  const annotations = useStore((s) => s.annotations);
  const setSelectedAnnotationId = useStore((s) => s.setSelectedAnnotationId);

  // Inline edit state
  const [editCategory, setEditCategory] = useState<PointCategory>('');
  const [editElevation, setEditElevation] = useState<string>('');

  // Bulk elevation update state
  const [isUpdatingElevations, setIsUpdatingElevations] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<{ current: number; total: number } | null>(null);

  const handleFillMissingElevations = async () => {
    const missingPoints = points.filter((p) => p.elevation === undefined || p.elevation === null);
    if (missingPoints.length === 0) {
      showToast(getTranslation(language, 'noMissingElevations'), 'info');
      return;
    }

    setIsUpdatingElevations(true);
    setUpdateProgress({ current: 0, total: missingPoints.length });

    let updatedCount = 0;
    for (let i = 0; i < missingPoints.length; i++) {
      const pt = missingPoints[i];
      setUpdateProgress({ current: i + 1, total: missingPoints.length });

      try {
        const elev = await fetchElevation(pt.lat, pt.lng);
        if (elev !== null) {
          updatePoint(pt.id, { elevation: elev });
          updatedCount++;
        }
      } catch (err) {
        // continue
      }

      if (i < missingPoints.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    setIsUpdatingElevations(false);
    setUpdateProgress(null);
    showToast(
      isAr ? `تم تحديث ارتفاع ${updatedCount} من أصل ${missingPoints.length} نقطة` : `Updated elevation for ${updatedCount} of ${missingPoints.length} points`,
      'success'
    );
  };

  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);

  const isAr = language === 'ar';

  const selectedPoint = useMemo(() => {
    return points.find((p) => p.id === selectedPointId);
  }, [points, selectedPointId]);

  const CATEGORIES = useMemo(() => {
    const setCats = new Set<string>();
    points.forEach((p) => {
      if (p.category) setCats.add(p.category);
    });
    storeCategories.forEach((c) => {
      if (c) setCats.add(c);
    });
    const list = Array.from(setCats);
    return [
      { id: 'all', label: isAr ? 'كافة التصنيفات' : 'All Categories' },
      ...list.map((c) => ({ id: c, label: c })),
    ];
  }, [points, storeCategories, isAr]);

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

    if (Math.abs(diff) > 20) {
      setQuickMapPopover(null);
      setContextMenu(null);
    }

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
    setQuickMapPopover(null);
    setContextMenu(null);
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
                {isAr ? 'النقاط' : 'Survey Points'}
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
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 pb-8">
          {/* Mobile Survey Tools Strip */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setActiveModal('converter')}
              className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
              <span>{isAr ? 'المحوّل' : 'Converter'}</span>
            </button>

            <button
              onClick={() => setActiveModal('two_point_measure')}
              className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Ruler className="w-3.5 h-3.5 shrink-0" />
              <span>{isAr ? 'قياس بين نقطتين' : '2-Pt Measure'}</span>
            </button>

            <button
              onClick={() => setActiveModal('settings')}
              className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Settings className="w-3.5 h-3.5 shrink-0" />
              <span>{isAr ? 'الإعدادات' : 'Settings'}</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsContinuousAddMode(!isContinuousAddMode)}
              className={`flex-1 min-h-[44px] rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                isContinuousAddMode
                  ? 'bg-emerald-400 text-slate-950 ring-2 ring-emerald-300/80 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
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
              <Edit3 className="w-4 h-4 shrink-0" />
              <span>{isAr ? 'إدخال يدوي' : 'Manual'}</span>
            </button>
          </div>

          {/* Single Tabs Switcher */}
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('points')}
              className={`flex-1 min-h-[40px] py-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'points' 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold' 
                  : 'text-slate-400 hover:bg-slate-800 border border-transparent'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{getTranslation(language, 'surveyPointsTab')}</span>
            </button>
            <button
              onClick={() => setActiveTab('annotations')}
              className={`flex-1 min-h-[40px] py-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'annotations' 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold' 
                  : 'text-slate-400 hover:bg-slate-800 border border-transparent'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>{getTranslation(language, 'annotationsTab')}</span>
            </button>
          </div>

          {activeTab === 'points' && (
            <>
              {/* Elevation Controls Bar */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                    <Mountain className="w-3.5 h-3.5 text-purple-400" />
                    <span>{getTranslation(language, 'autoFetchElevation')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                        autoFetchElevation
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {autoFetchElevation ? (isAr ? 'مُفعّل' : 'ON') : (isAr ? 'معطّل' : 'OFF')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAutoFetchElevation(!autoFetchElevation)}
                      dir="ltr"
                      className={`w-11 h-6 rounded-full p-1 transition-colors relative shrink-0 ${
                        autoFetchElevation
                          ? 'bg-purple-600 shadow-md shadow-purple-500/40'
                          : 'bg-slate-800 border border-slate-700'
                      }`}
                    >
                      <span
                        className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                          autoFetchElevation ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

            <button
              onClick={handleFillMissingElevations}
              disabled={isUpdatingElevations}
              className="w-full py-2 px-3 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[40px]"
            >
              {isUpdatingElevations ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span>
                    {getTranslation(language, 'updatingElevations')}{' '}
                    {updateProgress ? `(${updateProgress.current}/${updateProgress.total})` : ''}
                  </span>
                </>
              ) : (
                <>
                  <RotateCw className="w-4 h-4 text-purple-400" />
                  <span>{getTranslation(language, 'fillMissingElevations')}</span>
                </>
              )}
            </button>
          </div>

          {/* Search Input Bar */}
          <div className="relative">
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
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
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
                {cat.label}
              </button>
            ))}
          </div>

            </>
          )}

          {/* Points & Annotations Content */}
          <div className="space-y-2.5">
            {activeTab === 'points' && (
              filteredPoints.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-center text-slate-500 text-xs">
                  {getTranslation(language, 'noPointsFound')}
                </div>
              ) : (
                filteredPoints.map((pt) => {
                  const isSelected = selectedPointId === pt.id;
                  const isExpanded = isSelected || expandedPointId === pt.id;
                  const isEditingThis = inlineEditingId === pt.id;

                  if (!isExpanded) {
                    return (
                      <div
                        key={pt.id}
                        onClick={() => {
                          setSelectedPointId(pt.id);
                          setExpandedPointId(pt.id);
                        }}
                        className="p-3 rounded-2xl border border-slate-800/80 bg-slate-950/70 hover:bg-slate-800/50 transition-all cursor-pointer flex items-center justify-between gap-2 point-card-contain"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-md"
                            style={{ backgroundColor: pt.color || '#10b981' }}
                          />
                          <h4 className="font-bold text-slate-100 text-xs truncate">{pt.name}</h4>
                          {pt.category && (
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-lg border border-slate-700 font-medium shrink-0">
                              {getCategoryLabel(pt.category, language)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {pt.isLocked && (
                            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                          {pt.elevation !== undefined && pt.elevation !== null && (
                            <span className="text-[10px] font-mono text-purple-300 bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-800/40">
                              {pt.elevation}m
                            </span>
                          )}
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={pt.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-slate-900 border-emerald-500/60 shadow-lg ring-1 ring-emerald-500/20'
                          : 'bg-slate-950/90 border-slate-800/80'
                      }`}
                    >
                      {/* Card Header / Toggle */}
                      <div
                        onClick={() => {
                          if (expandedPointId === pt.id) {
                            setExpandedPointId(null);
                          } else {
                            setSelectedPointId(pt.id);
                            setExpandedPointId(pt.id);
                          }
                        }}
                        className="flex items-start justify-between gap-2 mb-2 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
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
                          <ChevronUp className="w-4 h-4 text-emerald-400 ml-0.5" />
                        </div>
                      </div>

                      {/* UTM Grid */}
                      <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2 text-[11px] font-mono space-y-0.5 mb-2">
                        <div className="flex justify-between text-slate-400">
                          <span>Zone:</span>
                          <span className="text-amber-400 font-bold">
                            {pt.utm.zone}{getMGRSBandFromLat(pt.lat)} ({pt.utm.hemisphere === 'N' ? (isAr ? 'شمال' : 'North') : (isAr ? 'جنوب' : 'South')})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Easting (X):</span>
                          <span className="text-emerald-400 font-semibold">{pt.utm.easting.toFixed(2)} m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Northing (Y):</span>
                          <span className="text-sky-400 font-semibold">{pt.utm.northing.toFixed(2)} m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Elev (Z):</span>
                          {pt.elevation !== undefined && pt.elevation !== null ? (
                            <span className="text-purple-300 font-semibold">{pt.elevation} m</span>
                          ) : (
                            <span className="text-slate-600 font-sans text-[10px]">{isAr ? 'غير محدد' : 'Not set'}</span>
                          )}
                        </div>
                        <div className="flex justify-between border-t border-slate-800/50 pt-1 mt-1 text-[10px]">
                          <span className="text-slate-400">MGRS:</span>
                          <span className="text-amber-400 font-semibold">{latLngToMGRS(pt.lat, pt.lng)}</span>
                        </div>
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
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="bg-slate-950 border border-slate-800 text-slate-100 rounded-lg p-1.5 text-xs focus:outline-none"
                            >
                              <option value="">{isAr ? 'بدون تصنيف (عام)' : 'No Category (General)'}</option>
                              {CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                              ))}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              const st = useStore.getState();
                              st.setIsMeasuringMode(true);
                              st.clearMeasurePoints();
                              st.addMeasurePoint({
                                id: `m_${pt.id}`,
                                lat: pt.lat,
                                lng: pt.lng,
                                utm: pt.utm,
                              });
                              setSheetState('peek');
                              showToast(
                                isAr
                                  ? 'تم بدء القياس من النقطة! حرّك الخريطة للقياس'
                                  : 'Measuring from point! Move map to measure',
                                'info'
                              );
                            }}
                            className="min-h-[40px] px-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1"
                            title={isAr ? 'قياس من هذه النقطة' : 'Measure from point'}
                          >
                            <Ruler className="w-4 h-4 text-amber-400" />
                            <span>{isAr ? 'قياس' : 'Measure'}</span>
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
              )
            )}
            
            {activeTab === 'annotations' && (
              annotations.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-2">
                  <Edit3 className="w-8 h-8 text-slate-600" />
                  <p className="text-xs">
                    {isAr ? 'لا توجد رسومات. استخدم شريط الأدوات لإضافة رسومات.' : 'No annotations yet.'}
                  </p>
                </div>
              ) : (
                annotations.map((ann) => (
                  <div
                    key={ann.id}
                    onClick={() => {
                      setSelectedAnnotationId(ann.id);
                      setSheetState('peek');
                    }}
                    className="p-3.5 rounded-2xl border bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 transition-all cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span
                        className="w-3 h-3 rounded-sm shrink-0 shadow-sm"
                        style={{ backgroundColor: ann.type === 'line' ? ann.color : (ann.backgroundColor === 'transparent' ? ann.color : ann.backgroundColor) }}
                      />
                      <div className="flex flex-col truncate">
                        <span className="font-bold text-slate-200 text-xs truncate">
                          {ann.type === 'line' ? ann.name : ann.content}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {ann.type === 'line' ? (isAr ? 'خط' : 'Line') : (isAr ? 'نص' : 'Text')}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        useStore.getState().deleteAnnotation(ann.id);
                      }}
                      className="p-2 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )
            )}
          </div>

          {/* Mobile Footer Clear All Button with 5-second Safety Countdown */}
          {((activeTab === 'points' && points.length > 0) || (activeTab === 'annotations' && annotations.length > 0)) && (
            <div className="p-3 border-t border-slate-800/80 bg-slate-950/90 shrink-0 pb-safe">
              {isConfirmingClear ? (
                <div className="space-y-2.5 bg-rose-950/40 border border-rose-500/40 rounded-2xl p-3 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-start gap-2 text-rose-300 text-xs font-semibold leading-relaxed">
                    <Trash2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>
                      {isAr
                        ? activeTab === 'points'
                          ? '⚠️ تحذير: سيتم مسح كافة نقاط وبيانات المشروع نهائياً!'
                          : '⚠️ تحذير: سيتم مسح كافة الرسومات نهائياً!'
                        : '⚠️ Warning: All project points & data will be permanently wiped!'}
                    </span>
                  </div>

                  {clearCountdown > 0 ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-rose-400 font-mono">
                        <span>{isAr ? 'قفل الأمان نشط:' : 'Safety lock:'}</span>
                        <span className="font-bold bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30">
                          {clearCountdown} {isAr ? 'ثوانٍ' : 'sec'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800/90 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-rose-500 h-full transition-all duration-1000 ease-linear rounded-full"
                          style={{ width: `${((5 - clearCountdown) / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>{isAr ? 'تم إلغاء قفل الأمان - يمكنك التأكيد الآن:' : 'Safety lock released:'}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingClear(false)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-all border border-slate-700"
                    >
                      {getTranslation(language, 'cancel')}
                    </button>
                    <button
                      type="button"
                      disabled={clearCountdown > 0}
                      onClick={() => {
                        if (clearCountdown > 0) return;
                        if (activeTab === 'points') {
                          clearAllPoints();
                        } else {
                          useStore.getState().clearAllAnnotations();
                        }
                        setIsConfirmingClear(false);
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg ${
                        clearCountdown > 0
                          ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60'
                          : 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 shadow-rose-600/30 active:scale-95'
                      }`}
                    >
                      {clearCountdown > 0 ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                          <span>{isAr ? `انتظر (${clearCountdown}ث)...` : `Wait (${clearCountdown}s)...`}</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isAr ? 'تأكيد المسح النهائي' : 'Confirm Wipe'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsConfirmingClear(true)}
                  className="w-full py-2.5 px-3 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/60 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>
                    {activeTab === 'points'
                      ? isAr
                        ? `مسح جميع النقاط (${points.length})`
                        : `Clear All Points (${points.length})`
                      : isAr
                      ? `مسح جميع الرسومات (${annotations.length})`
                      : `Clear All Annotations (${annotations.length})`}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

