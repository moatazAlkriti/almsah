import React, { useMemo, useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getTranslation } from '../utils/translations';
import { formatUTMString, getMGRSBandFromLat, latLngToMGRS } from '../utils/utm';
import { getCategoryLabel, exportPointsToExcel } from '../utils/excel';
import { fetchElevation } from '../utils/elevation';
import { PointCategory, SurveyPoint } from '../types';
import {
  Search,
  MapPin,
  Trash2,
  Edit3,
  Navigation,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  Lock,
  Unlock,
  Copy,
  Check,
  Mountain,
  Loader2,
  RotateCw,
  Ruler,
  Plus,
  Folder,
  FolderOpen,
  FolderPlus,
  FileSpreadsheet,
  GripVertical,
  X,
  Type,
  MoreVertical,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const points = useStore((s) => s.points);
  const selectedPointId = useStore((s) => s.selectedPointId);
  const language = useStore((s) => s.language);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const searchQuery = useStore((s) => s.searchQuery);

  const autoFetchElevation = useStore((s) => s.autoFetchElevation);
  const setAutoFetchElevation = useStore((s) => s.setAutoFetchElevation);

  const setSelectedPointId = useStore((s) => s.setSelectedPointId);
  const deletePoint = useStore((s) => s.deletePoint);
  const togglePointLock = useStore((s) => s.togglePointLock);
  const updatePoint = useStore((s) => s.updatePoint);
  const clearAllPoints = useStore((s) => s.clearAllPoints);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const showToast = useStore((s) => s.showToast);
  
  const storeCategories = useStore((s) => s.categories);
  const addCategory = useStore((s) => s.addCategory);
  const renameCategory = useStore((s) => s.renameCategory);
  const deleteCategory = useStore((s) => s.deleteCategory);
  const exportSettings = useStore((s) => s.exportSettings);

  // Folder & Tree State
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [draggingPtId, setDraggingPtId] = useState<string | null>(null);

  // Card Expand & Inline Editing
  const [expandedPointId, setExpandedPointId] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [inlineCategory, setInlineCategory] = useState<PointCategory>('');
  const [inlineElevation, setInlineElevation] = useState<string>('');

  // Quick Inline Name Edit State (Fast point rename)
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickEditNameText, setQuickEditNameText] = useState<string>('');

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; folderName?: string; pointId?: string } | null>(null);

  // Folder Add/Rename Modal
  const [folderModal, setFolderModal] = useState<{ type: 'add' } | { type: 'rename'; folderName: string } | null>(null);
  const [folderInput, setFolderInput] = useState<string>('');

  // Bulk Elevation Update State
  const [isUpdatingElevations, setIsUpdatingElevations] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<{ current: number; total: number } | null>(null);

  // Custom confirmation for Clear All
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'points' | 'annotations'>('points');

  const annotations = useStore((s) => s.annotations);
  const setSelectedAnnotationId = useStore((s) => s.setSelectedAnnotationId);

  const isAr = language === 'ar';

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

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

  const filteredPoints = useMemo(() => {
    return points.filter((pt) => {
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
  }, [points, searchQuery]);

  const uniqueZones = useMemo(() => {
    const setZones = new Set(
      points.map((p) => {
        const band = getMGRSBandFromLat(p.lat);
        const hemi = p.utm.hemisphere === 'N' ? (isAr ? 'شمال' : 'North') : (isAr ? 'جنوب' : 'South');
        return `${p.utm.zone}${band} (${hemi})`;
      })
    );
    return Array.from(setZones);
  }, [points, isAr]);

  // Folder grouping logic for tree view
  const defaultGeneralFolder = isAr ? 'نقاط عامة' : 'General Points';

  const folderGroups = useMemo(() => {
    const folderSet = new Set<string>();
    folderSet.add(defaultGeneralFolder);

    storeCategories.forEach((c) => {
      if (c && c.trim()) folderSet.add(c.trim());
    });

    points.forEach((p) => {
      if (p.category && p.category.trim()) {
        folderSet.add(p.category.trim());
      }
    });

    const folderList = Array.from(folderSet);

    return folderList.map((fName) => {
      const pts = filteredPoints.filter((p) => {
        const cat = (p.category || '').trim();
        if (!cat) return fName === defaultGeneralFolder;
        return cat === fName;
      });
      return { folderName: fName, pts };
    });
  }, [points, filteredPoints, storeCategories, isAr, defaultGeneralFolder]);

  const isFolderExpanded = (folderName: string) => {
    return expandedFolders[folderName] ?? true;
  };

  const toggleFolderExpand = (folderName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedFolders((prev) => ({
      ...prev,
      [folderName]: prev[folderName] === undefined ? false : !prev[folderName],
    }));
  };

  // Drag & Drop Handlers
  const handlePointDragStart = (ptId: string, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', ptId);
    setDraggingPtId(ptId);
  };

  const handleFolderDragOver = (folderName: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverFolder(folderName);
  };

  const handleFolderDragLeave = () => {
    setDragOverFolder(null);
  };

  const handleFolderDrop = (folderName: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverFolder(null);
    const ptId = e.dataTransfer.getData('text/plain');
    if (ptId) {
      const pt = points.find((p) => p.id === ptId);
      if (pt) {
        if (pt.isLocked) {
          showToast(isAr ? 'النقطة مقفلة! إلغ القفل لنقلها' : 'Point is locked!', 'error');
          return;
        }
        const newCat = folderName === defaultGeneralFolder ? '' : folderName;
        updatePoint(ptId, { category: newCat });
        showToast(
          isAr
            ? `تم نقل "${pt.name}" إلى مجلد "${folderName}"`
            : `Moved "${pt.name}" to folder "${folderName}"`,
          'success'
        );
      }
    }
  };

  // Export specific folder to Excel
  const handleExportFolderToExcel = (folderName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const folderPts = points.filter((p) => {
      const cat = (p.category || '').trim();
      return cat ? cat === folderName : folderName === defaultGeneralFolder;
    });

    if (folderPts.length === 0) {
      showToast(isAr ? 'لا توجد نقاط في هذا المجلد لتصديرها' : 'No points in this folder', 'warning');
      return;
    }

    exportPointsToExcel(folderPts, language, exportSettings);
    showToast(
      isAr
        ? `تم تصدير مجلد "${folderName}" (${folderPts.length} نقطة) إلى Excel 📊`
        : `Exported folder "${folderName}" (${folderPts.length} pts) to Excel 📊`,
      'success'
    );
  };

  // Quick Point Name Rename
  const handleStartQuickNameEdit = (pt: SurveyPoint, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickEditId(pt.id);
    setQuickEditNameText(pt.name);
  };

  const handleSaveQuickNameEdit = (ptId: string) => {
    if (quickEditNameText.trim()) {
      updatePoint(ptId, { name: quickEditNameText.trim() });
      showToast(isAr ? 'تم إعادة تسمية النقطة بنجاح' : 'Point renamed', 'success');
    }
    setQuickEditId(null);
  };

  // Inline Card Edit
  const handleStartInlineEdit = (pt: SurveyPoint, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCardId(pt.id);
    setInlineCategory(pt.category || '');
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

  // Folder Modal Handler
  const handleSaveFolderModal = () => {
    if (!folderInput.trim()) return;
    const name = folderInput.trim();
    if (folderModal?.type === 'add') {
      addCategory(name);
      showToast(isAr ? `تم إنشاء مجلد جديد "${name}"` : `Created folder "${name}"`, 'success');
    } else if (folderModal?.type === 'rename') {
      renameCategory(folderModal.folderName, name);
      showToast(isAr ? `تم تغيير اسم المجلد إلى "${name}"` : `Folder renamed to "${name}"`, 'success');
    }
    setFolderModal(null);
    setFolderInput('');
  };

  if (!sidebarOpen) return null;

  return (
    <aside
      className="hidden md:flex w-80 md:w-96 bg-slate-900/95 border-l border-slate-800/80 flex-col h-[calc(100vh-4rem)] relative z-30 shadow-2xl backdrop-blur-xl shrink-0 transition-all select-none"
      onContextMenu={(e) => {
        // Right-click inside sidebar
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
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

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setFolderModal({ type: 'add' });
              setFolderInput('');
            }}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-700"
            title={isAr ? 'إضافة مجلد جديد' : 'New Folder'}
          >
            <FolderPlus className="w-4 h-4" />
            <span className="hidden sm:inline">{isAr ? 'مجلد جديد' : 'New Folder'}</span>
          </button>

          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isAr ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="p-3 border-b border-slate-800/80 flex items-center gap-2 shrink-0">
        <button
          onClick={() => setActiveTab('points')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'points'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:bg-slate-800 border border-transparent'
          }`}
        >
          {getTranslation(language, 'surveyPointsTab')}
        </button>
        <button
          onClick={() => setActiveTab('annotations')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'annotations'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:bg-slate-800 border border-transparent'
          }`}
        >
          {getTranslation(language, 'annotationsTab')}
        </button>
      </div>

      {/* Main Scrollable Content Container */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {activeTab === 'points' && (
          <>
            {/* Dataset Summary */}
            <div className="grid grid-cols-2 gap-2 text-xs">
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
            <div className="relative sticky top-0 z-20 bg-slate-900/95 py-1 backdrop-blur-md">
              <Search className={`w-4 h-4 text-slate-400 absolute top-3.5 ${isAr ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={getTranslation(language, 'searchPlaceholder')}
                className={`w-full bg-slate-950/90 border border-slate-800 rounded-xl ${
                  isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
                } py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors shadow-sm`}
              />
            </div>

            {/* Elevation Controls Bar */}
            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
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
                className="w-full py-1.5 px-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isUpdatingElevations ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                    <span>
                      {getTranslation(language, 'updatingElevations')}{' '}
                      {updateProgress ? `(${updateProgress.current}/${updateProgress.total})` : ''}
                    </span>
                  </>
                ) : (
                  <>
                    <RotateCw className="w-3.5 h-3.5 text-purple-400" />
                    <span>{getTranslation(language, 'fillMissingElevations')}</span>
                  </>
                )}
              </button>
            </div>

            {/* Folder Groups & Points List */}
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
            folderGroups.map(({ folderName, pts }) => {
              const expanded = isFolderExpanded(folderName);
              const isOver = dragOverFolder === folderName;

              return (
                <div
                  key={folderName}
                  onDragOver={(e) => handleFolderDragOver(folderName, e)}
                  onDragLeave={handleFolderDragLeave}
                  onDrop={(e) => handleFolderDrop(folderName, e)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setContextMenu({ x: e.clientX, y: e.clientY, folderName });
                  }}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isOver
                      ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20'
                      : 'bg-slate-950/80 border-slate-800/80'
                  }`}
                >
                  {/* Folder Header */}
                  <div
                    onClick={(e) => toggleFolderExpand(folderName, e)}
                    className="p-2.5 bg-slate-900/90 hover:bg-slate-800/80 border-b border-slate-800/80 flex items-center justify-between cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {expanded ? (
                        <ChevronDown className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <ChevronRight className={`w-4 h-4 text-amber-400 shrink-0 ${isAr ? 'rotate-180' : ''}`} />
                      )}
                      {expanded ? (
                        <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span className="font-bold text-xs text-slate-200 group-hover:text-amber-300 truncate">
                        {folderName}
                      </span>
                      <span className="text-[10px] bg-slate-950 font-mono text-amber-400/90 px-1.5 py-0.5 rounded-full border border-slate-800 shrink-0">
                        {pts.length}
                      </span>
                    </div>

                    {/* Folder Quick Actions */}
                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const st = useStore.getState();
                          st.setTempMapClickCoords({
                            lat: points[0]?.lat || 33.3152,
                            lng: points[0]?.lng || 44.3661,
                            utm: points[0]?.utm || { easting: 440000, northing: 3680000, zone: 38, hemisphere: 'N' },
                            category: folderName === defaultGeneralFolder ? '' : folderName,
                          });
                          st.setActiveModal('add_point');
                        }}
                        className="p-1 hover:text-emerald-400 hover:bg-slate-800 rounded text-slate-400"
                        title={isAr ? 'إضافة نقطة لهذا المجلد' : 'Add point to folder'}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleExportFolderToExcel(folderName, e)}
                        className="p-1 hover:text-emerald-400 hover:bg-slate-800 rounded text-slate-400"
                        title={isAr ? 'تصدير هذا المجلد لـ Excel' : 'Export folder to Excel'}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </button>

                      {folderName !== defaultGeneralFolder && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFolderModal({ type: 'rename', folderName });
                              setFolderInput(folderName);
                            }}
                            className="p-1 hover:text-sky-400 hover:bg-slate-800 rounded text-slate-400"
                            title={isAr ? 'إعادة تسمية المجلد' : 'Rename folder'}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCategory(folderName);
                              showToast(isAr ? `تم حذف المجلد "${folderName}"` : `Deleted folder "${folderName}"`, 'info');
                            }}
                            className="p-1 hover:text-rose-400 hover:bg-slate-800 rounded text-slate-400"
                            title={isAr ? 'حذف المجلد' : 'Delete folder'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Folder Point List */}
                  {expanded && (
                    <div className="p-2 space-y-2 bg-slate-950/40">
                      {pts.length === 0 ? (
                        <div className="p-3 text-center border border-dashed border-slate-800 rounded-xl text-[11px] text-slate-500">
                          {isAr ? 'اسحب النقاط إلى هنا لوضعها في هذا المجلد 📂' : 'Drag points here to place them in this folder 📂'}
                        </div>
                      ) : (
                        pts.map((pt) => {
                          const isSelected = selectedPointId === pt.id;
                          const isExpanded = isSelected || expandedPointId === pt.id;
                          const isInlineEditing = editingCardId === pt.id;
                          const isQuickEditingName = quickEditId === pt.id;

                          return (
                            <div
                              key={pt.id}
                              draggable={!pt.isLocked}
                              onDragStart={(e) => handlePointDragStart(pt.id, e)}
                              onDragEnd={() => setDraggingPtId(null)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setContextMenu({ x: e.clientX, y: e.clientY, pointId: pt.id, folderName });
                              }}
                              className={`rounded-xl border transition-all cursor-pointer group ${
                                draggingPtId === pt.id ? 'opacity-40 border-dashed border-amber-400' : ''
                              } ${
                                isSelected
                                  ? 'bg-slate-900/95 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30 p-3'
                                  : isExpanded
                                  ? 'bg-slate-900/80 border-slate-700/80 p-3'
                                  : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/60 p-2.5'
                              }`}
                            >
                              {/* Card Header */}
                              <div
                                onClick={() => {
                                  if (expandedPointId === pt.id) {
                                    setExpandedPointId(null);
                                  } else {
                                    setSelectedPointId(pt.id);
                                    setExpandedPointId(pt.id);
                                  }
                                }}
                                className="flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 shrink-0 cursor-grab" />
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                                    style={{ backgroundColor: pt.color || '#10b981' }}
                                  />

                                  {/* Fast Point Name Rename Input */}
                                  {isQuickEditingName ? (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center gap-1 flex-1"
                                    >
                                      <input
                                        type="text"
                                        autoFocus
                                        value={quickEditNameText}
                                        onChange={(e) => setQuickEditNameText(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleSaveQuickNameEdit(pt.id);
                                          if (e.key === 'Escape') setQuickEditId(null);
                                        }}
                                        className="bg-slate-950 border border-amber-500 text-amber-300 text-xs font-bold px-2 py-0.5 rounded w-full focus:outline-none"
                                      />
                                      <button
                                        onClick={() => handleSaveQuickNameEdit(pt.id)}
                                        className="p-1 bg-emerald-500 text-slate-950 rounded hover:bg-emerald-400 shrink-0"
                                      >
                                        <Check className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <h3
                                      onDoubleClick={(e) => handleStartQuickNameEdit(pt, e)}
                                      className="font-bold text-slate-200 text-xs truncate group-hover:text-emerald-400 transition-colors"
                                      title={isAr ? 'انقر مرتين للتسمية السريعة' : 'Double click to rename'}
                                    >
                                      {pt.name}
                                    </h3>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {!isQuickEditingName && (
                                    <button
                                      onClick={(e) => handleStartQuickNameEdit(pt, e)}
                                      className="p-1 opacity-0 group-hover:opacity-100 hover:text-amber-400 text-slate-500 transition-opacity"
                                      title={isAr ? 'إعادة تسمية سريعة' : 'Quick Rename'}
                                    >
                                      <Type className="w-3 h-3" />
                                    </button>
                                  )}

                                  {pt.isLocked && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}

                                  {pt.elevation !== undefined && pt.elevation !== null && (
                                    <span className="text-[10px] font-mono text-purple-300 bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-800/40">
                                      {pt.elevation}m
                                    </span>
                                  )}

                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                                  )}
                                </div>
                              </div>

                              {/* Expanded Card Details */}
                              {isExpanded && (
                                <div className="mt-2.5 pt-2 border-t border-slate-800/60 space-y-2">
                                  {pt.description && (
                                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed px-0.5">
                                      {pt.description}
                                    </p>
                                  )}

                                  {/* UTM Coordinates Box */}
                                  <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-2.5 font-mono text-[11px] space-y-1 shadow-inner">
                                    <div className="flex items-center justify-between text-slate-400">
                                      <span>UTM Zone:</span>
                                      <span className="text-amber-400 font-bold">
                                        {pt.utm.zone}{getMGRSBandFromLat(pt.lat)} ({pt.utm.hemisphere === 'N' ? (isAr ? 'شمال' : 'North') : (isAr ? 'جنوب' : 'South')})
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-400">Easting (X):</span>
                                      <span className="text-emerald-400 font-semibold">{pt.utm.easting.toFixed(2)} m</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-400">Northing (Y):</span>
                                      <span className="text-sky-400 font-semibold">{pt.utm.northing.toFixed(2)} m</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-400">Elev (Z):</span>
                                      {pt.elevation !== undefined && pt.elevation !== null ? (
                                        <span className="text-purple-300 font-semibold font-mono">{pt.elevation} m</span>
                                      ) : (
                                        <span className="text-slate-600 font-sans text-[10px]">{isAr ? 'غير محدد' : 'Not set'}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between border-t border-slate-800/50 pt-1 mt-1 text-[10px]">
                                      <span className="text-slate-400">MGRS Grid:</span>
                                      <span className="text-amber-400 font-semibold">{latLngToMGRS(pt.lat, pt.lng)}</span>
                                    </div>
                                  </div>

                                  {/* Inline Edit Form for Category and Elevation */}
                                  {isInlineEditing && (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl space-y-2"
                                    >
                                      <div className="text-[11px] font-bold text-sky-400">
                                        {isAr ? 'تعديل المجلد والارتفاع:' : 'Edit Folder & Elevation:'}
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <select
                                          value={inlineCategory}
                                          onChange={(e) => setInlineCategory(e.target.value)}
                                          className="bg-slate-950 border border-slate-800 text-slate-100 rounded-lg p-1.5 text-xs focus:outline-none"
                                        >
                                          <option value="">{isAr ? 'نقاط عامة (بدون مجلد)' : 'General Points'}</option>
                                          {storeCategories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                          ))}
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
                                          const st = useStore.getState();
                                          st.setTempMapClickCoords({
                                            lat: pt.lat,
                                            lng: pt.lng,
                                            utm: pt.utm,
                                            elevation: pt.elevation,
                                            category: pt.category,
                                          });
                                          st.setActiveModal('add_point');
                                        }}
                                        className="p-1.5 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors text-emerald-500/80"
                                        title={isAr ? 'إضافة نقطة جديدة هنا' : 'Add new point here'}
                                      >
                                        <Plus className="w-3.5 h-3.5" />
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
                                          showToast(
                                            isAr
                                              ? 'تم بدء القياس الحي! حرّك المؤشر للقياس لحظياً'
                                              : 'Live Measurement started! Move cursor to measure instantly',
                                            'info'
                                          );
                                        }}
                                        className="p-1.5 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors text-amber-500/80"
                                        title={isAr ? 'القياس الحي اللحظي من هنا' : 'Live measure from here'}
                                      >
                                        <Ruler className="w-3.5 h-3.5" />
                                      </button>

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
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </>
      )}

        {activeTab === 'annotations' && (
          annotations.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-2">
              <Edit3 className="w-8 h-8 text-slate-600" />
              <p className="text-xs">
                {isAr ? 'لا توجد رسومات. استخدم شريط الأدوات لإضافة رسومات.' : 'No annotations yet.'}
              </p>
            </div>
          ) : (
            annotations.map((ann) => (
              <div
                key={ann.id}
                onClick={() => setSelectedAnnotationId(ann.id)}
                className="p-3.5 rounded-2xl border bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 transition-all cursor-pointer flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span
                    className="w-3 h-3 rounded-sm shrink-0 shadow-sm"
                    style={{
                      backgroundColor:
                        ann.type === 'line'
                          ? ann.color
                          : ann.backgroundColor === 'transparent'
                          ? ann.color
                          : ann.backgroundColor,
                    }}
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
                  className="p-1.5 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )
        )}
      </div>

      {/* Footer Clear All Button */}
      {((activeTab === 'points' && points.length > 0) || (activeTab === 'annotations' && annotations.length > 0)) && (
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
                  if (activeTab === 'points') {
                    clearAllPoints();
                  } else {
                    useStore.getState().clearAllAnnotations();
                  }
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

      {/* Right-Click Context Menu */}
      {contextMenu && (() => {
        const menuWidth = 230;
        const menuHeight = contextMenu.folderName ? 290 : 180;
        const top = Math.max(10, Math.min(contextMenu.y, window.innerHeight - menuHeight - 16));
        const left = Math.max(10, Math.min(contextMenu.x, window.innerWidth - menuWidth - 16));

        return (
          <div
            style={{ top, left }}
            className="fixed z-[9999] bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 w-56 text-xs space-y-1 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 max-h-[calc(100vh-24px)] overflow-y-auto custom-scrollbar"
            dir={isAr ? 'rtl' : 'ltr'}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setFolderModal({ type: 'add' });
                setFolderInput('');
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 text-amber-300 font-semibold transition-colors"
            >
              <FolderPlus className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'إضافة مجلد جديد' : 'New Folder'}</span>
            </button>

            {contextMenu.folderName && (
              <>
                <button
                  onClick={() => {
                    handleExportFolderToExcel(contextMenu.folderName!);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 text-emerald-300 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? `تصدير "${contextMenu.folderName}" إلى Excel` : 'Export Folder to Excel'}</span>
                </button>

                {contextMenu.folderName !== defaultGeneralFolder && (
                  <>
                    <button
                      onClick={() => {
                        setFolderModal({ type: 'rename', folderName: contextMenu.folderName! });
                        setFolderInput(contextMenu.folderName!);
                        setContextMenu(null);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 text-sky-300 transition-colors"
                    >
                      <Edit3 className="w-4 h-4 text-sky-400" />
                      <span>{isAr ? 'إعادة تسمية المجلد' : 'Rename Folder'}</span>
                    </button>

                    <button
                      onClick={() => {
                        deleteCategory(contextMenu.folderName!);
                        showToast(isAr ? `تم حذف المجلد "${contextMenu.folderName}"` : `Deleted folder`, 'info');
                        setContextMenu(null);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-500/20 text-rose-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                      <span>{isAr ? 'حذف المجلد' : 'Delete Folder'}</span>
                    </button>
                  </>
                )}
              </>
            )}

            <div className="h-px bg-slate-800 my-1" />

            <button
              onClick={() => {
                setActiveModal('export_excel');
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-300 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'تصدير إكسل مخصص' : 'Custom Excel Export'}</span>
            </button>

            <button
              onClick={() => {
                handleFillMissingElevations();
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 text-purple-300 transition-colors"
            >
              <RotateCw className="w-4 h-4 text-purple-400" />
              <span>{isAr ? 'تحديث كافة الارتفاعات' : 'Fetch All Elevations'}</span>
            </button>
          </div>
        );
      })()}

      {/* Add / Rename Folder Modal */}
      {folderModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-400" />
                <span>
                  {folderModal.type === 'add'
                    ? isAr
                      ? 'إنشاء مجلد نقاط جديد'
                      : 'Create New Point Folder'
                    : isAr
                    ? 'إعادة تسمية المجلد'
                    : 'Rename Folder'}
                </span>
              </h3>
              <button
                onClick={() => setFolderModal(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium">
                {isAr ? 'اسم المجلد / التصنيف:' : 'Folder Name:'}
              </label>
              <input
                type="text"
                autoFocus
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveFolderModal()}
                placeholder={isAr ? 'مثال: طريق بغداد / تبليط' : 'e.g., Highway Section 1'}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl p-3 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setFolderModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveFolderModal}
                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400"
              >
                {isAr ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
