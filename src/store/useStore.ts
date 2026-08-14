import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import {
  SurveyPoint,
  TileLayerType,
  Language,
  Hemisphere,
  MeasurePoint,
  UTMCoordinate,
  PointMoveHistory,
  ToastMessage,
  ToastType,
  MapPopoverCoords,
  TempMapClickCoords,
  ContextMenuData,
  ExportSettings,
  Annotation,
  AnnotationLine,
  AnnotationText,
  AnnotationPoint,
  ImportResult,
  PinStyle,
  PointLabelPosition,
} from '../types';
import { latLngToUTM, utmToLatLng, calculateHaversineDistance } from '../utils/utm';
import { fetchElevation } from '../utils/elevation';

const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

interface AppState {
  // Survey Points State
  points: SurveyPoint[];
  selectedPointId: string | null;
  editingPoint: SurveyPoint | null;

  // Map Controls State
  activeTileLayer: TileLayerType;
  manualZoneOverride: number | null; // e.g. Zone 37 lock

  // Export Settings
  exportSettings: ExportSettings;

  // App UI & Settings
  language: Language;
  defaultHemisphere: Hemisphere;
  sidebarOpen: boolean;
  searchQuery: string;
  selectedCategoryFilter: string;
  autoFetchElevation: boolean;

  // Pin & Label Customization State
  pinStyle: PinStyle;
  pinSize: number;
  pointLabelSize: number;
  pointLabelPosition: PointLabelPosition;
  showPointLabels: boolean;
  setPinStyle: (style: PinStyle) => void;
  setPinSize: (size: number) => void;
  setPointLabelSize: (size: number) => void;
  setPointLabelPosition: (pos: PointLabelPosition) => void;
  setShowPointLabels: (show: boolean) => void;

  // Two Point Measurement State
  pointAMeasureId: string | null;
  pointBMeasureId: string | null;
  setPointToPointMeasure: (ptAId: string | null, ptBId: string | null) => void;
  setDefaultHemisphere: (hemi: Hemisphere) => void;

  // Interactive Modes
  isAddingPointMode: boolean;
  isContinuousAddMode: boolean;
  isMeasuringMode: boolean;
  isSelectionMode: boolean;
  isEraserMode: boolean;
  isEraserChoiceModalOpen: boolean;
  eraserDeleteLockedPoints: boolean;
  setIsEraserChoiceModalOpen: (open: boolean) => void;
  setEraserDeleteLockedPoints: (allow: boolean) => void;
  measurePoints: MeasurePoint[];
  selectedPointIdsForAction: string[];


  // Annotations State
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  movingAnnotationId: string | null;
  isDrawingLineMode: boolean;
  isAddingTextMode: boolean;
  drawingLinePoints: AnnotationPoint[];
  pendingTextLocation: AnnotationPoint | null;

  // Active Modals & Popovers
  activeModal:
    | 'add_point'
    | 'edit_point'
    | 'import_excel'
    | 'batch_zone'
    | 'batch_category'
    | 'batch_delete'
    | 'export_excel'
    | 'export_preview'
    | 'import_options'
    | 'import_result'
    | 'settings'
    | 'converter'
    | 'two_point_measure'
    | 'line_stationing'
    | null;
  tempMapClickCoords: TempMapClickCoords | null;
  quickMapPopover: MapPopoverCoords | null;
  contextMenu: ContextMenuData | null;

  // New Export/Import States
  exportFormat: 'excel' | 'geojson' | 'backup' | null;
  importFile: File | null;
  importFileType: 'geojson' | 'backup' | null;
  importResult: ImportResult | null;

  // History & Toasts
  lastMovedPoint: PointMoveHistory | null;
  toast: ToastMessage | null;

  // Actions
  addPoint: (pointData: Omit<SurveyPoint, 'id' | 'timestamp'>) => void;
  updatePoint: (id: string, updates: Partial<SurveyPoint>) => void;
  deletePoint: (id: string, forceDeleteLocked?: boolean) => void;
  movePoint: (id: string, newLat: number, newLng: number) => void;
  togglePointLock: (id: string) => void;
  lockAllPoints: (scope?: 'all' | 'uncategorized' | string) => void;
  unlockAllPoints: (scope?: 'all' | 'uncategorized' | string) => void;
  toggleFolderLock: (folderName: string) => void;
  revertLastMove: () => void;
  dismissLastMove: () => void;
  clearAllPoints: () => void;
  importPoints: (newPoints: SurveyPoint[]) => void;

  setSelectedPointId: (id: string | null) => void;
  setEditingPoint: (point: SurveyPoint | null) => void;
  setActiveTileLayer: (layer: TileLayerType) => void;
  setLanguage: (lang: Language) => void;
  setManualZoneOverride: (zone: number | null) => void;
  setAutoFetchElevation: (enabled: boolean) => void;

  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategoryFilter: (category: string) => void;

  // Custom user categories
  categories: string[];
  addCategory: (name: string) => void;
  renameCategory: (oldName: string, newName: string) => void;
  deleteCategory: (name: string) => void;

  setIsAddingPointMode: (active: boolean) => void;
  setIsContinuousAddMode: (active: boolean) => void;
  setIsMeasuringMode: (active: boolean) => void;
  setIsSelectionMode: (active: boolean) => void;
  setIsEraserMode: (active: boolean) => void;
  setSelectedPointIdsForAction: (ids: string[]) => void;
  batchDeletePoints: (ids: string[], forceDeleteLocked?: boolean) => { deletedCount: number; lockedSkipped: number };
  addMeasurePoint: (pt: MeasurePoint) => void;
  clearMeasurePoints: () => void;

  // Annotations Actions
  setIsDrawingLineMode: (active: boolean) => void;
  setIsAddingTextMode: (active: boolean) => void;
  addDrawingLinePoint: (pt: AnnotationPoint) => void;
  undoDrawingLinePoint: () => void;
  cancelDrawingLine: () => void;
  saveDrawingLine: (opts: { name?: string; color: string; weight: number; dashArray?: string }) => void;
  setPendingTextLocation: (loc: AnnotationPoint | null) => void;
  saveTextLabel: (opts: { content: string; color: string; fontSize: number }) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  clearAllAnnotations: () => void;
  setSelectedAnnotationId: (id: string | null) => void;
  setMovingAnnotationId: (id: string | null) => void;

  // Project Import/Export Actions
  replaceProjectData: (points: SurveyPoint[], annotations: Annotation[], settings?: any, categories?: string[]) => void;
  mergeProjectData: (points: SurveyPoint[], annotations: Annotation[], categories?: string[]) => void;

  setExportSettings: (settings: ExportSettings) => void;

  setActiveModal: (
    modal:
      | 'add_point'
      | 'edit_point'
      | 'import_excel'
      | 'batch_zone'
      | 'batch_category'
      | 'batch_delete'
      | 'export_excel'
      | 'export_preview'
      | 'import_options'
      | 'import_result'
      | 'settings'
      | 'converter'
      | 'two_point_measure'
      | 'line_stationing'
      | null
  ) => void;

  setExportFormat: (format: 'excel' | 'geojson' | 'backup' | null) => void;
  setImportFile: (file: File | null, type: 'geojson' | 'backup' | null) => void;
  setImportResult: (result: ImportResult | null) => void;
  setTempMapClickCoords: (coords: TempMapClickCoords | null) => void;
  setQuickMapPopover: (popover: MapPopoverCoords | null) => void;
  setContextMenu: (menu: ContextMenuData | null) => void;

  showToast: (text: string, type?: ToastType) => void;
  hideToast: () => void;
}

// Initial default sample points (Empty by default)
const INITIAL_SAMPLE_POINTS: SurveyPoint[] = [];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      points: INITIAL_SAMPLE_POINTS,
      selectedPointId: null,
      editingPoint: null,

      activeTileLayer: 'hybrid',
      manualZoneOverride: null,

      exportSettings: {
        selectedColumns: ['seq', 'name', 'zone', 'easting', 'northing', 'elevation', 'mgrs', 'latitude', 'longitude', 'category', 'description', 'timestamp'],
        orientation: 'horizontal',
      },

      language: 'ar',
      defaultHemisphere: 'S',
      sidebarOpen: true,
      searchQuery: '',
      categories: [],
      selectedCategoryFilter: 'all',
      autoFetchElevation: true,

      // Google Pin & Label Defaults
      pinStyle: 'google_pin',
      pinSize: 34,
      pointLabelSize: 11,
      pointLabelPosition: 'bottom',
      showPointLabels: true,
      setPinStyle: (style) => set({ pinStyle: style }),
      setPinSize: (size) => set({ pinSize: Math.max(18, Math.min(70, size)) }),
      setPointLabelSize: (size) => set({ pointLabelSize: Math.max(8, Math.min(24, size)) }),
      setPointLabelPosition: (pos) => set({ pointLabelPosition: pos }),
      setShowPointLabels: (show) => set({ showPointLabels: show }),

      pointAMeasureId: null,
      pointBMeasureId: null,
      setPointToPointMeasure: (ptAId, ptBId) => set({ pointAMeasureId: ptAId, pointBMeasureId: ptBId }),
      setDefaultHemisphere: (hemi) => set({ defaultHemisphere: hemi }),

      isAddingPointMode: false,
      isContinuousAddMode: false,
      isMeasuringMode: false,
      isSelectionMode: false,
      isEraserMode: false,
      isEraserChoiceModalOpen: false,
      eraserDeleteLockedPoints: false,
      setIsEraserChoiceModalOpen: (open) => set({ isEraserChoiceModalOpen: open }),
      setEraserDeleteLockedPoints: (allow) => set({ eraserDeleteLockedPoints: allow }),
      measurePoints: [],
      selectedPointIdsForAction: [],

      annotations: [],
      selectedAnnotationId: null,
      movingAnnotationId: null,
      isDrawingLineMode: false,
      isAddingTextMode: false,
      drawingLinePoints: [],
      pendingTextLocation: null,

      activeModal: null,
      tempMapClickCoords: null,
      quickMapPopover: null,
      contextMenu: null,

      exportFormat: null,
      importFile: null,
      importFileType: null,
      importResult: null,

      lastMovedPoint: null,
      toast: null,

      // Actions
      addPoint: (pointData) => {
        const newPoint: SurveyPoint = {
          ...pointData,
          id: `pt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: new Date().toISOString(),
          isLocked: false,
        };

        const isContinuous = get().isContinuousAddMode;

        if (newPoint.category) {
          get().addCategory(newPoint.category);
        }

        set((state) => ({
          points: [newPoint, ...state.points],
          selectedPointId: newPoint.id,
          activeModal: null,
          isAddingPointMode: isContinuous, // Stay in add mode if continuous!
          tempMapClickCoords: null,
          quickMapPopover: null,
        }));

        // Auto fetch elevation if missing and autoFetchElevation is enabled
        if ((newPoint.elevation === undefined || newPoint.elevation === null) && get().autoFetchElevation) {
          fetchElevation(newPoint.lat, newPoint.lng).then((elev) => {
            if (elev !== null) {
              set((state) => ({
                points: state.points.map((pt) =>
                  pt.id === newPoint.id ? { ...pt, elevation: elev } : pt
                ),
              }));
            }
          });
        }

        get().showToast(
          get().language === 'ar' ? 'تم إضافة النقطة بنجاح' : 'Point added successfully',
          'success'
        );
      },

      updatePoint: (id, updates) => {
        if (updates.category) {
          get().addCategory(updates.category);
        }

        set((state) => ({
          points: state.points.map((pt) => {
            if (pt.id !== id) return pt;

            let updatedPt = { ...pt, ...updates };
            if (updates.lat !== undefined || updates.lng !== undefined) {
              const lat = updates.lat ?? pt.lat;
              const lng = updates.lng ?? pt.lng;
              const utm = latLngToUTM(lat, lng, state.manualZoneOverride);
              updatedPt.utm = utm;
            } else if (updates.utm) {
              const { lat, lng } = utmToLatLng(updates.utm);
              updatedPt.lat = lat;
              updatedPt.lng = lng;
            }

            return updatedPt;
          }),
          editingPoint: null,
          activeModal: null,
        }));

        if ((updates.lat !== undefined || updates.lng !== undefined) && updates.elevation === undefined && get().autoFetchElevation) {
          const updatedPt = get().points.find((p) => p.id === id);
          if (updatedPt) {
            fetchElevation(updatedPt.lat, updatedPt.lng).then((elev) => {
              if (elev !== null) {
                set((state) => ({
                  points: state.points.map((pt) =>
                    pt.id === id ? { ...pt, elevation: elev } : pt
                  ),
                }));
              }
            });
          }
        }

        get().showToast(
          get().language === 'ar' ? 'تم تحديث النقطة' : 'Point updated',
          'info'
        );
      },

      togglePointLock: (id) => {
        let isNowLocked = false;
        let ptName = '';

        set((state) => ({
          points: state.points.map((pt) => {
            if (pt.id === id) {
              isNowLocked = !pt.isLocked;
              ptName = pt.name;
              return { ...pt, isLocked: isNowLocked };
            }
            return pt;
          }),
        }));

        const isAr = get().language === 'ar';
        get().showToast(
          isAr
            ? `${isNowLocked ? 'تم قفل النقطة 🔒' : 'تم إلغاء قفل النقطة 🔓'} (${ptName})`
            : `${isNowLocked ? 'Point locked 🔒' : 'Point unlocked 🔓'} (${ptName})`,
          isNowLocked ? 'warning' : 'info'
        );
      },

      lockAllPoints: (scope = 'all') => {
        let count = 0;
        const isGeneralScope =
          scope === 'uncategorized' ||
          scope === 'عام' ||
          scope === 'نقاط عامة' ||
          scope === 'General' ||
          scope === 'General Points';

        set((state) => ({
          points: state.points.map((pt) => {
            const cat = (pt.category || '').trim();
            let match = false;
            if (scope === 'all') {
              match = true;
            } else if (isGeneralScope) {
              match = !cat || cat === 'عام' || cat === 'نقاط عامة' || cat === 'General' || cat === 'General Points';
            } else {
              match = cat === scope;
            }
            if (match && !pt.isLocked) {
              count++;
              return { ...pt, isLocked: true };
            }
            return pt;
          }),
        }));

        const isAr = get().language === 'ar';
        const label = scope === 'all'
          ? (isAr ? 'كافة النقاط' : 'All Points')
          : isGeneralScope
          ? (isAr ? 'النقاط العامة' : 'General Points')
          : (isAr ? `نقاط مجلد "${scope}"` : `Folder "${scope}" points`);

        get().showToast(
          isAr ? `تم قفل ${label} بنجاح 🔒 (${count} نقطة)` : `Locked ${label} 🔒 (${count} points)`,
          'warning'
        );
      },

      unlockAllPoints: (scope = 'all') => {
        let count = 0;
        const isGeneralScope =
          scope === 'uncategorized' ||
          scope === 'عام' ||
          scope === 'نقاط عامة' ||
          scope === 'General' ||
          scope === 'General Points';

        set((state) => ({
          points: state.points.map((pt) => {
            const cat = (pt.category || '').trim();
            let match = false;
            if (scope === 'all') {
              match = true;
            } else if (isGeneralScope) {
              match = !cat || cat === 'عام' || cat === 'نقاط عامة' || cat === 'General' || cat === 'General Points';
            } else {
              match = cat === scope;
            }
            if (match && pt.isLocked) {
              count++;
              return { ...pt, isLocked: false };
            }
            return pt;
          }),
        }));

        const isAr = get().language === 'ar';
        const label = scope === 'all'
          ? (isAr ? 'كافة النقاط' : 'All Points')
          : isGeneralScope
          ? (isAr ? 'النقاط العامة' : 'General Points')
          : (isAr ? `نقاط مجلد "${scope}"` : `Folder "${scope}" points`);

        get().showToast(
          isAr ? `تم فك قفل ${label} بنجاح 🔓 (${count} نقطة)` : `Unlocked ${label} 🔓 (${count} points)`,
          'success'
        );
      },

      toggleFolderLock: (folderName) => {
        const isAr = get().language === 'ar';
        const isGeneral =
          !folderName ||
          folderName === 'عام' ||
          folderName === 'نقاط عامة' ||
          folderName === 'General' ||
          folderName === 'General Points' ||
          folderName === (isAr ? 'نقاط عامة' : 'General Points');
        
        const targetPts = get().points.filter((pt) => {
          const cat = (pt.category || '').trim();
          return isGeneral ? !cat || cat === 'عام' || cat === 'نقاط عامة' || cat === 'General' || cat === 'General Points' || cat === folderName : cat === folderName;
        });

        if (targetPts.length === 0) {
          get().showToast(isAr ? 'لا توجد نقاط في هذا المجلد' : 'No points in this folder', 'info');
          return;
        }

        const allLocked = targetPts.every((pt) => pt.isLocked);
        const targetLockState = !allLocked;

        set((state) => ({
          points: state.points.map((pt) => {
            const cat = (pt.category || '').trim();
            const match = isGeneral
              ? !cat || cat === 'عام' || cat === 'نقاط عامة' || cat === 'General' || cat === 'General Points' || cat === folderName
              : cat === folderName;
            if (match) {
              return { ...pt, isLocked: targetLockState };
            }
            return pt;
          }),
        }));

        get().showToast(
          isAr
            ? `${targetLockState ? 'تم قفل مجلد' : 'تم فك قفل مجلد'} "${folderName}" (${targetPts.length} نقطة) 🔒`
            : `${targetLockState ? 'Locked folder' : 'Unlocked folder'} "${folderName}" (${targetPts.length} points) 🔒`,
          targetLockState ? 'warning' : 'success'
        );
      },

      deletePoint: (id, forceDeleteLocked = false) => {
        const targetPt = get().points.find((p) => p.id === id);
        const allowLocked = forceDeleteLocked || get().eraserDeleteLockedPoints;
        if (targetPt?.isLocked && !allowLocked) {
          get().showToast(
            get().language === 'ar'
              ? 'لا يمكن حذف نقطة مقفلة! قم بفك القفل أولاً'
              : 'Cannot delete a locked point! Unlock first.',
            'error'
          );
          return;
        }

        set((state) => ({
          points: state.points.filter((pt) => pt.id !== id),
          selectedPointId: state.selectedPointId === id ? null : state.selectedPointId,
        }));

        get().showToast(
          get().language === 'ar' ? 'تم حذف النقطة' : 'Point deleted',
          'warning'
        );
      },

      movePoint: (id, newLat, newLng) => {
        const point = get().points.find((p) => p.id === id);
        if (!point) return;

        if (point.isLocked) {
          get().showToast(
            get().language === 'ar'
              ? 'النقطة مقفلة ومحمية من التحريك 🔒'
              : 'Point is locked and cannot be dragged 🔒',
            'warning'
          );
          return;
        }

        const zoneOverride = get().manualZoneOverride;
        const newUtm = latLngToUTM(newLat, newLng, zoneOverride);
        const dist = calculateHaversineDistance(point.lat, point.lng, newLat, newLng);

        const moveHistory: PointMoveHistory = {
          pointId: id,
          pointName: point.name,
          previousLat: point.lat,
          previousLng: point.lng,
          previousUtm: point.utm,
          newLat,
          newLng,
          newUtm,
          distanceMeters: Math.round(dist * 100) / 100,
        };

        set((state) => ({
          points: state.points.map((pt) =>
            pt.id === id
              ? {
                  ...pt,
                  lat: newLat,
                  lng: newLng,
                  utm: newUtm,
                }
              : pt
          ),
          lastMovedPoint: moveHistory,
        }));
      },

      revertLastMove: () => {
        const lastMove = get().lastMovedPoint;
        if (!lastMove) return;

        set((state) => ({
          points: state.points.map((pt) =>
            pt.id === lastMove.pointId
              ? {
                  ...pt,
                  lat: lastMove.previousLat,
                  lng: lastMove.previousLng,
                  utm: lastMove.previousUtm,
                }
              : pt
          ),
          lastMovedPoint: null,
        }));

        get().showToast(
          get().language === 'ar' ? 'تم التراجع عن تحريك النقطة' : 'Point move reverted',
          'info'
        );
      },

      dismissLastMove: () => {
        set({ lastMovedPoint: null });
      },

      clearAllPoints: () => {
        set({ points: [], selectedPointId: null, lastMovedPoint: null });
        get().showToast(
          get().language === 'ar' ? 'تم مسح كافة النقاط' : 'All points cleared',
          'warning'
        );
      },

      importPoints: (newPoints) => {
        set((state) => ({
          points: [...newPoints, ...state.points],
          activeModal: null,
        }));

        get().showToast(
          get().language === 'ar'
            ? `تم استيراد ${newPoints.length} نقطة بنجاح`
            : `Imported ${newPoints.length} points`,
          'success'
        );
      },

      setSelectedPointId: (id) => set({ selectedPointId: id, quickMapPopover: null }),
      setEditingPoint: (point) => set({ editingPoint: point, quickMapPopover: null, contextMenu: null }),
      setActiveTileLayer: (layer) => set({ activeTileLayer: layer }),

      setLanguage: (lang) => {
        document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', lang);
        set({ language: lang });
      },

      setManualZoneOverride: (zone) => {
        set({ manualZoneOverride: zone });
        if (zone) {
          set((state) => ({
            points: state.points.map((pt) => ({
              ...pt,
              utm: latLngToUTM(pt.lat, pt.lng, zone),
            })),
          }));
        }
      },

      setAutoFetchElevation: (enabled) => set({ autoFetchElevation: enabled }),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedCategoryFilter: (category) => set({ selectedCategoryFilter: category }),

      addCategory: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) => {
          if (state.categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
            return state;
          }
          return { categories: [...state.categories, trimmed] };
        });
      },

      deleteCategory: (name) => {
        set((state) => ({
          categories: state.categories.filter((c) => c !== name),
          points: state.points.map((pt) => (pt.category === name ? { ...pt, category: undefined } : pt)),
        }));
      },

      renameCategory: (oldName, newName) => {
        const trimmed = newName.trim();
        if (!trimmed || oldName === trimmed) return;
        set((state) => ({
          categories: state.categories.map((c) => (c === oldName ? trimmed : c)),
          points: state.points.map((pt) => (pt.category === oldName ? { ...pt, category: trimmed } : pt)),
        }));
      },

      setIsAddingPointMode: (active) =>
        set((state) => ({
          isAddingPointMode: active,
          isContinuousAddMode: active ? state.isContinuousAddMode : false,
          isMeasuringMode: false,
          isDrawingLineMode: false,
          isAddingTextMode: false,
          isSelectionMode: false,
          isEraserMode: false,
          drawingLinePoints: [],
        })),

      setIsContinuousAddMode: (active) =>
        set({
          isContinuousAddMode: active,
          isAddingPointMode: active,
          isMeasuringMode: false,
          isDrawingLineMode: false,
          isAddingTextMode: false,
          isSelectionMode: false,
          isEraserMode: false,
          drawingLinePoints: [],
        }),

      setIsMeasuringMode: (active) =>
        set({
          isMeasuringMode: active,
          isAddingPointMode: false,
          isContinuousAddMode: false,
          isDrawingLineMode: false,
          isAddingTextMode: false,
          isSelectionMode: false,
          isEraserMode: false,
          drawingLinePoints: [],
        }),

      setIsSelectionMode: (active) =>
        set((state) => ({
          isSelectionMode: active,
          isMeasuringMode: false,
          isAddingPointMode: false,
          isContinuousAddMode: false,
          isDrawingLineMode: false,
          isAddingTextMode: false,
          isEraserMode: false,
          drawingLinePoints: [],
          selectedPointIdsForAction: active ? [] : state.selectedPointIdsForAction,
        })),

      setIsEraserMode: (active) =>
        set({
          isEraserMode: active,
          isSelectionMode: false,
          isMeasuringMode: false,
          isAddingPointMode: false,
          isContinuousAddMode: false,
          isDrawingLineMode: false,
          isAddingTextMode: false,
          drawingLinePoints: [],
        }),

      setSelectedPointIdsForAction: (ids) => set({ selectedPointIdsForAction: ids }),

      batchDeletePoints: (ids, forceDeleteLocked = false) => {
        const isAr = get().language === 'ar';
        const targetIds = new Set(ids);
        const currentPoints = get().points;
        const allowLocked = forceDeleteLocked || get().eraserDeleteLockedPoints;

        let deletedCount = 0;
        let lockedSkipped = 0;

        const remainingPoints = currentPoints.filter((pt) => {
          if (targetIds.has(pt.id)) {
            if (pt.isLocked && !allowLocked) {
              lockedSkipped++;
              return true; // Keep locked point
            }
            deletedCount++;
            return false; // Remove point
          }
          return true;
        });

        set((state) => ({
          points: remainingPoints,
          selectedPointId: state.selectedPointId && targetIds.has(state.selectedPointId) ? null : state.selectedPointId,
          selectedPointIdsForAction: state.selectedPointIdsForAction.filter((id) => !targetIds.has(id)),
        }));

        if (deletedCount > 0) {
          get().showToast(
            isAr
              ? `تم حذف ${deletedCount} نقطة بنجاح 🗑️${lockedSkipped > 0 ? ` (تم تخطي ${lockedSkipped} نقطة مقفلة 🔒)` : ''}`
              : `Deleted ${deletedCount} points 🗑️${lockedSkipped > 0 ? ` (Skipped ${lockedSkipped} locked 🔒)` : ''}`,
            deletedCount > 0 ? 'success' : 'warning'
          );
        } else if (lockedSkipped > 0) {
          get().showToast(
            isAr
              ? `لم يتم حذف أي نقطة لأن جميعها (${lockedSkipped}) مقفلة ومحمية 🔒`
              : `No points deleted because all (${lockedSkipped}) are locked 🔒`,
            'error'
          );
        }

        return { deletedCount, lockedSkipped };
      },

      addMeasurePoint: (pt) => set((state) => ({ measurePoints: [...state.measurePoints, pt] })),
      clearMeasurePoints: () => set({ measurePoints: [] }),

      // Annotations Actions
      
      clearAllAnnotations: () => {
        set({ annotations: [], selectedAnnotationId: null });
        get().showToast(
          get().language === 'ar' ? 'تم مسح جميع العناصر التوضيحية' : 'All annotations cleared',
          'warning'
        );
      },

      replaceProjectData: (points, annotations, settings, categories) => {
        const importedCats = Array.from(
          new Set([
            ...(categories || []),
            ...points
              .map((p) => (p.category || '').trim())
              .filter(
                (c) =>
                  c !== '' &&
                  !['other', 'Other', 'OTHER', 'أخرى', 'عام', 'General', 'general'].includes(c)
              ),
          ])
        );
        set((state) => ({
          points,
          annotations,
          selectedPointId: null,
          selectedAnnotationId: null,
          categories: importedCats,
          activeTileLayer: settings?.activeTileLayer ?? state.activeTileLayer,
          manualZoneOverride: settings?.manualZoneOverride !== undefined ? settings.manualZoneOverride : state.manualZoneOverride,
          autoFetchElevation: settings?.autoFetchElevation ?? state.autoFetchElevation,
          isContinuousAddMode: settings?.isContinuousAddMode ?? state.isContinuousAddMode,
          pinStyle: settings?.pinStyle ?? state.pinStyle,
          pinSize: settings?.pinSize ?? state.pinSize,
          pointLabelSize: settings?.pointLabelSize ?? state.pointLabelSize,
          pointLabelPosition: settings?.pointLabelPosition ?? state.pointLabelPosition,
          showPointLabels: settings?.showPointLabels ?? state.showPointLabels,
        }));
      },

      mergeProjectData: (points, annotations, categories) => {
        set((state) => {
          const existingIds = new Set(state.points.map((p) => p.id));
          const existingCoordsKeys = new Set(state.points.map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`));

          const filteredPoints = points.filter((p) => {
            const hasId = existingIds.has(p.id);
            const hasCoords = existingCoordsKeys.has(`${p.lat.toFixed(6)},${p.lng.toFixed(6)}`);
            return !hasId && !hasCoords;
          });

          const existingAnnIds = new Set(state.annotations.map((a) => a.id));
          const filteredAnnotations = annotations.filter((a) => !existingAnnIds.has(a.id));

          const importedCats = Array.from(
            new Set([
              ...(categories || []),
              ...points
                .map((p) => (p.category || '').trim())
                .filter(
                  (c) =>
                    c !== '' &&
                    !['other', 'Other', 'OTHER', 'أخرى', 'عام', 'General', 'general'].includes(c)
                ),
            ])
          );

          return {
            points: [...state.points, ...filteredPoints],
            annotations: [...state.annotations, ...filteredAnnotations],
            categories: Array.from(new Set([...state.categories, ...importedCats])),
          };
        });
      },

      setIsDrawingLineMode: (active) => set((s) => ({
        isDrawingLineMode: active,
        isAddingTextMode: false,
        isAddingPointMode: false,
        isMeasuringMode: active ? false : s.isMeasuringMode,
        isSelectionMode: false,
        drawingLinePoints: active ? [] : s.drawingLinePoints,
        pendingTextLocation: null,
        quickMapPopover: null,
      })),
      
      setIsAddingTextMode: (active) => set((s) => ({
        isAddingTextMode: active,
        isDrawingLineMode: false,
        isAddingPointMode: false,
        isMeasuringMode: active ? false : s.isMeasuringMode,
        isSelectionMode: false,
        drawingLinePoints: [],
        quickMapPopover: null,
      })),
      
      addDrawingLinePoint: (pt) => set((s) => ({ drawingLinePoints: [...s.drawingLinePoints, pt] })),
      undoDrawingLinePoint: () => set((s) => ({ drawingLinePoints: s.drawingLinePoints.slice(0, -1) })),
      cancelDrawingLine: () => set({ drawingLinePoints: [], isDrawingLineMode: false }),
      
      saveDrawingLine: (opts: { name?: string; color: string; weight: number; dashArray?: string }) => set((s) => {
        if (s.drawingLinePoints.length < 2) return { drawingLinePoints: [] };
        const line: AnnotationLine = {
          id: `line_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: 'line',
          name: opts.name?.trim() || `خط-${s.annotations.filter(a => a.type === 'line').length + 1}`,
          points: s.drawingLinePoints,
          color: opts.color,
          weight: opts.weight,
          dashArray: opts.dashArray,
          createdAt: new Date().toISOString(),
        };
        return { annotations: [...s.annotations, line], drawingLinePoints: [], isDrawingLineMode: false };
      }),
      
      setPendingTextLocation: (loc) => set({ pendingTextLocation: loc }),
      
      saveTextLabel: (opts: { content: string; color: string; fontSize: number }) => set((s) => {
        if (!s.pendingTextLocation || !opts.content.trim()) return {};
        const t: AnnotationText = {
          id: `text_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: 'text',
          content: opts.content.trim(),
          lat: s.pendingTextLocation.lat,
          lng: s.pendingTextLocation.lng,
          utm: s.pendingTextLocation.utm,
          fontSize: opts.fontSize,
          color: opts.color,
          createdAt: new Date().toISOString(),
        };
        return { annotations: [...s.annotations, t], pendingTextLocation: null, isAddingTextMode: false };
      }),
      
      updateAnnotation: (id, updates) => set((s) => ({
        annotations: s.annotations.map(a => (a.id === id ? ({ ...a, ...updates } as Annotation) : a)),
      })),
      
      deleteAnnotation: (id) => set((s) => ({
        annotations: s.annotations.filter(a => a.id !== id),
        selectedAnnotationId: s.selectedAnnotationId === id ? null : s.selectedAnnotationId,
        movingAnnotationId: s.movingAnnotationId === id ? null : s.movingAnnotationId,
      })),
      
      setSelectedAnnotationId: (id) => set({ selectedAnnotationId: id, movingAnnotationId: null }),
      setMovingAnnotationId: (id) => set({ movingAnnotationId: id }),

      setExportSettings: (settings) => set({ exportSettings: settings }),

      setActiveModal: (modal) => set({ activeModal: modal, quickMapPopover: null, contextMenu: null }),
      setExportFormat: (format) => set({ exportFormat: format }),
      setImportFile: (file, type) => set({ importFile: file, importFileType: type }),
      setImportResult: (result) => set({ importResult: result }),
      setTempMapClickCoords: (coords) => set({ tempMapClickCoords: coords }),
      setQuickMapPopover: (popover) => set({ quickMapPopover: popover, contextMenu: popover ? null : get().contextMenu }),
      setContextMenu: (menu) => set({ contextMenu: menu, quickMapPopover: menu ? null : get().quickMapPopover }),

      showToast: (text, type = 'info') => {
        set({
          toast: {
            id: `toast_${Date.now()}`,
            text,
            type,
          },
        });
      },

      hideToast: () => set({ toast: null }),
    }),
    {
      name: 'utm-gis-surveyor-storage',
      version: 4,
      migrate: (persistedState: any, version: number) => {
        let state = persistedState;
        
        if (version < 2 || !state || state.autoFetchElevation === undefined) {
          state = {
            ...state,
            autoFetchElevation: true,
          };
        }
        
        if (version < 3 && state && state.points && Array.isArray(state.points)) {
          // Remove default sample points from previous versions
          state = {
            ...state,
            points: state.points.filter((p: any) => !['sample_01', 'sample_02', 'sample_03'].includes(p.id))
          };
        }

        if (version < 4 || !state || state.pinStyle === undefined) {
          state = {
            ...state,
            pinStyle: state?.pinStyle || 'google_pin',
            pinSize: state?.pinSize ?? 34,
            pointLabelSize: state?.pointLabelSize ?? 11,
            pointLabelPosition: state?.pointLabelPosition || 'bottom',
            showPointLabels: state?.showPointLabels ?? true,
          };
        }
        
        return state;
      },
      partialize: (state) => ({
        points: state.points,
        annotations: state.annotations,
        categories: state.categories,
        activeTileLayer: state.activeTileLayer,
        manualZoneOverride: state.manualZoneOverride,
        language: state.language,
        autoFetchElevation: state.autoFetchElevation,
        isContinuousAddMode: state.isContinuousAddMode,
        exportSettings: state.exportSettings,
        pinStyle: state.pinStyle,
        pinSize: state.pinSize,
        pointLabelSize: state.pointLabelSize,
        pointLabelPosition: state.pointLabelPosition,
        showPointLabels: state.showPointLabels,
      }),
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
