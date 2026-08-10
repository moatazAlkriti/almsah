import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  SurveyPoint,
  TileLayerType,
  Language,
  MeasurePoint,
  UTMCoordinate,
  PointMoveHistory,
  ToastMessage,
  ToastType,
  MapPopoverCoords,
  ContextMenuData,
  ExportSettings,
} from '../types';
import { latLngToUTM, utmToLatLng, calculateHaversineDistance } from '../utils/utm';

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
  sidebarOpen: boolean;
  searchQuery: string;
  selectedCategoryFilter: string;

  // Interactive Modes
  isAddingPointMode: boolean;
  isContinuousAddMode: boolean;
  isMeasuringMode: boolean;
  measurePoints: MeasurePoint[];

  // Active Modals & Popovers
  activeModal: 'add_point' | 'edit_point' | 'import_excel' | 'batch_zone' | 'export_excel' | null;
  tempMapClickCoords: { lat: number; lng: number; utm: UTMCoordinate } | null;
  quickMapPopover: MapPopoverCoords | null;
  contextMenu: ContextMenuData | null;

  // History & Toasts
  lastMovedPoint: PointMoveHistory | null;
  toast: ToastMessage | null;

  // Actions
  addPoint: (pointData: Omit<SurveyPoint, 'id' | 'timestamp'>) => void;
  updatePoint: (id: string, updates: Partial<SurveyPoint>) => void;
  deletePoint: (id: string) => void;
  movePoint: (id: string, newLat: number, newLng: number) => void;
  togglePointLock: (id: string) => void;
  revertLastMove: () => void;
  dismissLastMove: () => void;
  clearAllPoints: () => void;
  importPoints: (newPoints: SurveyPoint[]) => void;

  setSelectedPointId: (id: string | null) => void;
  setEditingPoint: (point: SurveyPoint | null) => void;
  setActiveTileLayer: (layer: TileLayerType) => void;
  setLanguage: (lang: Language) => void;
  setManualZoneOverride: (zone: number | null) => void;

  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategoryFilter: (category: string) => void;

  setIsAddingPointMode: (active: boolean) => void;
  setIsContinuousAddMode: (active: boolean) => void;
  setIsMeasuringMode: (active: boolean) => void;
  addMeasurePoint: (pt: MeasurePoint) => void;
  clearMeasurePoints: () => void;

  setExportSettings: (settings: ExportSettings) => void;

  setActiveModal: (modal: 'add_point' | 'edit_point' | 'import_excel' | 'batch_zone' | 'export_excel' | null) => void;
  setTempMapClickCoords: (coords: { lat: number; lng: number; utm: UTMCoordinate } | null) => void;
  setQuickMapPopover: (popover: MapPopoverCoords | null) => void;
  setContextMenu: (menu: ContextMenuData | null) => void;

  showToast: (text: string, type?: ToastType) => void;
  hideToast: () => void;
}

// Initial default sample points
const INITIAL_SAMPLE_POINTS: SurveyPoint[] = [
  {
    id: 'sample_01',
    name: 'نقطة المرجعية الأولى - برج المملكة',
    description: 'نقطة ضبط أرضي ثنائية الإحداثيات UTM Zone 38N',
    utm: { zone: 38, hemisphere: 'N', easting: 280124.45, northing: 2734180.20 },
    lat: 24.7116,
    lng: 46.6744,
    timestamp: new Date().toISOString(),
    category: 'control_point',
    elevation: 612.5,
    color: '#10b981',
    isLocked: false,
  },
  {
    id: 'sample_02',
    name: 'مرجع مساحي - الكعبة المشرفة',
    description: 'نقطة مرجعية مركزية المنطقة 37N',
    utm: { zone: 37, hemisphere: 'N', easting: 588210.15, northing: 2369040.80 },
    lat: 21.4225,
    lng: 39.8262,
    timestamp: new Date().toISOString(),
    category: 'boundary',
    elevation: 298.0,
    color: '#f59e0b',
    isLocked: true,
  },
  {
    id: 'sample_03',
    name: 'نقطة حد المشروع الشمالية',
    description: 'حد القارعة للموقع العام - Zone 38N',
    utm: { zone: 38, hemisphere: 'N', easting: 284500.00, northing: 2741200.00 },
    lat: 24.7742,
    lng: 46.7180,
    timestamp: new Date().toISOString(),
    category: 'boundary',
    elevation: 625.0,
    color: '#3b82f6',
    isLocked: false,
  },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      points: INITIAL_SAMPLE_POINTS,
      selectedPointId: null,
      editingPoint: null,

      activeTileLayer: 'satellite',
      manualZoneOverride: null,

      exportSettings: {
        selectedColumns: ['id', 'name', 'description', 'category', 'zone', 'hemisphere', 'easting', 'northing', 'elevation', 'timestamp'],
        orientation: 'horizontal',
      },

      language: 'ar',
      sidebarOpen: true,
      searchQuery: '',
      selectedCategoryFilter: 'all',

      isAddingPointMode: false,
      isContinuousAddMode: false,
      isMeasuringMode: false,
      measurePoints: [],

      activeModal: null,
      tempMapClickCoords: null,
      quickMapPopover: null,
      contextMenu: null,

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

        set((state) => ({
          points: [newPoint, ...state.points],
          selectedPointId: newPoint.id,
          activeModal: null,
          isAddingPointMode: isContinuous, // Stay in add mode if continuous!
          tempMapClickCoords: null,
          quickMapPopover: null,
        }));

        get().showToast(
          get().language === 'ar' ? 'تم إضافة النقطة بنجاح' : 'Point added successfully',
          'success'
        );
      },

      updatePoint: (id, updates) => {
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

        get().showToast(
          get().language === 'ar' ? 'تم تحديث النقطة المساحية' : 'Point updated',
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

      deletePoint: (id) => {
        const targetPt = get().points.find((p) => p.id === id);
        if (targetPt?.isLocked) {
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

      setSelectedPointId: (id) => set({ selectedPointId: id }),
      setEditingPoint: (point) => set({ editingPoint: point }),
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

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedCategoryFilter: (category) => set({ selectedCategoryFilter: category }),

      setIsAddingPointMode: (active) =>
        set((state) => ({
          isAddingPointMode: active,
          isContinuousAddMode: active ? state.isContinuousAddMode : false,
          isMeasuringMode: false,
        })),

      setIsContinuousAddMode: (active) =>
        set({
          isContinuousAddMode: active,
          isAddingPointMode: active,
          isMeasuringMode: false,
        }),

      setIsMeasuringMode: (active) =>
        set({
          isMeasuringMode: active,
          isAddingPointMode: false,
          isContinuousAddMode: false,
          measurePoints: active ? [] : [],
        }),

      addMeasurePoint: (pt) => set((state) => ({ measurePoints: [...state.measurePoints, pt] })),
      clearMeasurePoints: () => set({ measurePoints: [] }),

      setExportSettings: (settings) => set({ exportSettings: settings }),

      setActiveModal: (modal) => set({ activeModal: modal }),
      setTempMapClickCoords: (coords) => set({ tempMapClickCoords: coords }),
      setQuickMapPopover: (popover) => set({ quickMapPopover: popover }),
      setContextMenu: (menu) => set({ contextMenu: menu }),

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
      partialize: (state) => ({
        points: state.points,
        activeTileLayer: state.activeTileLayer,
        manualZoneOverride: state.manualZoneOverride,
        language: state.language,
        isContinuousAddMode: state.isContinuousAddMode,
        exportSettings: state.exportSettings,
      }),
    }
  )
);
