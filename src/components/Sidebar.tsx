import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { getTranslation } from '../utils/translations';
import { formatUTMString } from '../utils/utm';
import { getCategoryLabel } from '../utils/excel';
import { PointCategory } from '../types';
import {
  Search,
  MapPin,
  Trash2,
  Edit3,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Info,
  Lock,
  Unlock,
  Copy,
  Check,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const points = useStore((s) => s.points);
  const selectedPointId = useStore((s) => s.selectedPointId);
  const language = useStore((s) => s.language);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const searchQuery = useStore((s) => s.searchQuery);
  const selectedCategoryFilter = useStore((s) => s.selectedCategoryFilter);

  const setSelectedPointId = useStore((s) => s.setSelectedPointId);
  const setEditingPoint = useStore((s) => s.setEditingPoint);
  const deletePoint = useStore((s) => s.deletePoint);
  const togglePointLock = useStore((s) => s.togglePointLock);
  const updatePoint = useStore((s) => s.updatePoint);
  const clearAllPoints = useStore((s) => s.clearAllPoints);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const setSelectedCategoryFilter = useStore((s) => s.setSelectedCategoryFilter);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const showToast = useStore((s) => s.showToast);

  // Inline editing state for Category & Elevation
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [inlineCategory, setInlineCategory] = useState<PointCategory>('other');
  const [inlineElevation, setInlineElevation] = useState<string>('');
  
  // Custom confirmation for Clear All (since window.confirm blocks in iframes)
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const isAr = language === 'ar';

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

  const uniqueZones = useMemo(() => {
    const setZones = new Set(points.map((p) => `${p.utm.zone}${p.utm.hemisphere}`));
    return Array.from(setZones);
  }, [points]);

  const CATEGORIES: { id: string; labelKey: keyof typeof import('../utils/translations').translations['ar'] }[] = [
    { id: 'all', labelKey: 'allCategories' },
    { id: 'control_point', labelKey: 'control_point' },
    { id: 'boundary', labelKey: 'boundary' },
    { id: 'elevation', labelKey: 'elevation' },
    { id: 'infrastructure', labelKey: 'infrastructure' },
    { id: 'feature', labelKey: 'feature' },
    { id: 'other', labelKey: 'other' },
  ];

  const handleStartInlineEdit = (pt: typeof points[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCardId(pt.id);
    setInlineCategory(pt.category || 'other');
    setInlineElevation(pt.elevation !== undefined ? String(pt.elevation) : '');
  };

  const handleSaveInlineEdit = (ptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const elev = inlineElevation.trim() !== '' ? parseFloat(inlineElevation) : undefined;
    updatePoint(ptId, {
      category: inlineCategory,
      elevation: elev,
    });
    setEditingCardId(null);
    showToast(isAr ? 'تم حفظ التعديلات بنجاح' : 'Changes saved', 'success');
  };

  if (!sidebarOpen) return null;

  return (
    <aside className="hidden md:flex w-80 md:w-96 bg-slate-900/95 border-l border-slate-800/80 flex-col h-[calc(100vh-4rem)] relative z-30 shadow-2xl backdrop-blur-xl shrink-0 transition-all">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-400" />
          <h2 className="font-bold text-slate-100 text-sm">
            {getTranslation(language, 'pointDetails')}
          </h2>
          <span className="bg-emerald-500/20 text-emerald-300 font-mono text-xs px-2 py-0.5 rounded-full border border-emerald-500/30">
            {filteredPoints.length}
          </span>
        </div>

        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          {isAr ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Dataset Summary */}
      <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
          <div className="text-slate-400 text-[11px] mb-1">{getTranslation(language, 'totalPoints')}</div>
          <div className="font-bold text-emerald-400 text-base font-mono">{points.length}</div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
          <div className="text-slate-400 text-[11px] mb-1">{getTranslation(language, 'activeZone')}</div>
          <div className="font-bold text-sky-400 text-xs font-mono truncate">
            {uniqueZones.length > 0 ? uniqueZones.join(', ') : '---'}
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="p-3 border-b border-slate-800/80 space-y-2">
        <div className="relative">
          <Search className={`w-4 h-4 text-slate-400 absolute top-3 ${isAr ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={getTranslation(language, 'searchPlaceholder')}
            className={`w-full bg-slate-950/80 border border-slate-800 rounded-xl ${
              isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
            } py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors`}
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                selectedCategoryFilter === cat.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {getTranslation(language, cat.labelKey as any)}
            </button>
          ))}
        </div>
      </div>

      {/* Points Scrollable List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredPoints.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-2">
            <Info className="w-8 h-8 text-slate-600" />
            <p className="text-xs">
              {points.length === 0
                ? getTranslation(language, 'noPointsYet')
                : getTranslation(language, 'noPointsFound')}
            </p>
          </div>
        ) : (
          filteredPoints.map((pt) => {
            const isSelected = selectedPointId === pt.id;
            const isInlineEditing = editingCardId === pt.id;

            return (
              <div
                key={pt.id}
                onClick={() => setSelectedPointId(pt.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-slate-800/90 border-emerald-500/60 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: pt.color || '#10b981' }}
                    />
                    <h3 className="font-bold text-slate-200 text-xs group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {pt.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {pt.isLocked && (
                      <span className="p-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Lock className="w-3 h-3" />
                      </span>
                    )}
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-medium border border-slate-700">
                      {getCategoryLabel(pt.category, language)}
                    </span>
                  </div>
                </div>

                {pt.description && (
                  <p className="text-[11px] text-slate-400 mb-2 line-clamp-2 leading-relaxed">
                    {pt.description}
                  </p>
                )}

                {/* UTM Grid */}
                <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-2 font-mono text-[11px] space-y-1 mb-2.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>UTM Zone:</span>
                    <span className="text-amber-400 font-bold">{pt.utm.zone}{pt.utm.hemisphere}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Easting (X):</span>
                    <span className="text-emerald-400 font-semibold">{pt.utm.easting.toFixed(2)} m</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Northing (Y):</span>
                    <span className="text-sky-400 font-semibold">{pt.utm.northing.toFixed(2)} m</span>
                  </div>
                  {pt.elevation !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Elevation (Z):</span>
                      <span className="text-indigo-400 font-semibold">{pt.elevation} m</span>
                    </div>
                  )}
                </div>

                {/* Inline Edit Form for Category and Elevation */}
                {isInlineEditing && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl space-y-2 mb-2"
                  >
                    <div className="text-[11px] font-bold text-sky-400">
                      {isAr ? 'تعديل التصنيف والارتفاع:' : 'Edit Category & Elevation:'}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={inlineCategory}
                        onChange={(e) => setInlineCategory(e.target.value as PointCategory)}
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
                        value={inlineElevation}
                        onChange={(e) => setInlineElevation(e.target.value)}
                        placeholder="Z Elevation (m)"
                        className="bg-slate-950 border border-slate-800 text-slate-100 rounded-lg p-1.5 text-xs font-mono focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCardId(null);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={(e) => handleSaveInlineEdit(pt.id, e)}
                        className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>حفظ</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Card Action Toolbar */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60 text-slate-400">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePointLock(pt.id);
                    }}
                    className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-[11px] font-semibold ${
                      pt.isLocked
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'hover:bg-slate-800 hover:text-slate-200 border-transparent'
                    }`}
                    title={pt.isLocked ? 'إلغاء القفل' : 'قفل النقطة'}
                  >
                    {pt.isLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const text = formatUTMString(pt.utm, language);
                        navigator.clipboard.writeText(text);
                        showToast(isAr ? 'تم نسخ الإحداثيات' : 'Coords copied', 'success');
                      }}
                      className="p-1.5 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="نسخ الإحداثيات"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPointId(pt.id);
                      }}
                      className="p-1.5 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title={getTranslation(language, 'zoomTo')}
                    >
                      <Navigation className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => handleStartInlineEdit(pt, e)}
                      className="p-1.5 hover:text-sky-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title={getTranslation(language, 'edit')}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (pt.isLocked) {
                          showToast(isAr ? 'النقطة مقفلة! قم بفك القفل أولاً' : 'Point is locked!', 'error');
                          return;
                        }
                        deletePoint(pt.id);
                      }}
                      disabled={pt.isLocked}
                      className="p-1.5 hover:text-rose-400 disabled:opacity-30 hover:bg-slate-800 rounded-lg transition-colors"
                      title={getTranslation(language, 'delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Clear All Button */}
      {points.length > 0 && (
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 pb-safe">
          {isConfirmingClear ? (
            <div className="flex gap-2">
              <button
                onClick={() => setIsConfirmingClear(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-all"
              >
                {getTranslation(language, 'cancel')}
              </button>
              <button
                onClick={() => {
                  clearAllPoints();
                  setIsConfirmingClear(false);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-500 text-white hover:bg-rose-400 text-xs font-bold shadow-lg shadow-rose-500/20 transition-all"
              >
                {isAr ? 'تأكيد المسح' : 'Confirm Clear'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirmingClear(true)}
              className="w-full py-2 px-3 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/60 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>{getTranslation(language, 'clearAll')}</span>
            </button>
          )}
        </div>
      )}
    </aside>
  );
};
