import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { useStore } from '../store/useStore';
import { latLngToUTM, formatUTMString, calculateHaversineDistance } from '../utils/utm';
import { getTranslation } from '../utils/translations';
import { TileLayerType, UTMCoordinate } from '../types';
import { Crosshair, Ruler, MapPin, Layers, Lock, Sparkles, LocateFixed } from 'lucide-react';

// Custom SVG DivIcon generator with optional lock icon badge & selection animation
function createCustomMarkerIcon(
  color: string = '#10b981',
  label: string = '',
  isSelected: boolean = false,
  isLocked: boolean = false
) {
  const pulseClass = isSelected ? 'animate-bounce' : '';
  const scale = isSelected ? 'scale-125 z-50' : 'hover:scale-110';

  const lockBadge = isLocked
    ? `<div class="absolute -top-2 -right-2 bg-amber-500 text-slate-950 p-1 rounded-full shadow-lg border border-amber-300">
         <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
           <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
           <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
         </svg>
       </div>`
    : '';

  const html = `
    <div class="relative flex items-center justify-center transition-all duration-200 ${scale} ${pulseClass}">
      <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-lg">
        <path d="M16 0C7.163 0 0 7.163 0 16C0 28 16 42 16 42C16 42 32 28 32 16C32 7.163 24.837 0 16 0Z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
        <circle cx="16" cy="15" r="7" fill="#ffffff"/>
        <circle cx="16" cy="15" r="4" fill="${color}"/>
      </svg>
      ${lockBadge}
      ${
        label
          ? `<span class="absolute -bottom-6 bg-slate-900/95 text-slate-100 text-[11px] font-bold px-2 py-0.5 rounded shadow-md border border-slate-700 whitespace-nowrap font-mono">${label}</span>`
          : ''
      }
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38],
  });
}

// Tile Layer Provider URLs
const TILE_PROVIDERS: Record<TileLayerType, { url: string; attribution: string; subdomains?: string[] }> = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
  hybrid: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
    subdomains: ['a', 'b', 'c'],
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; OpenStreetMap',
    subdomains: ['a', 'b', 'c'],
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: ['a', 'b', 'c', 'd'],
  },
};

const ESRI_REFERENCE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

export const MapContainer: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const overlayLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const measurePolylineRef = useRef<L.Polyline | null>(null);
  const measureMarkersRef = useRef<L.Marker[]>([]);

  // Long press timer refs
  const longPressTimerRef = useRef<any>(null);
  const isLongPressRef = useRef(false);

  // Dragging tooltip
  const dragTooltipRef = useRef<L.Tooltip | null>(null);

  // Store state
  const points = useStore((s) => s.points);
  const selectedPointId = useStore((s) => s.selectedPointId);
  const activeTileLayer = useStore((s) => s.activeTileLayer);
  const language = useStore((s) => s.language);
  const isAddingPointMode = useStore((s) => s.isAddingPointMode);
  const isContinuousAddMode = useStore((s) => s.isContinuousAddMode);
  const isMeasuringMode = useStore((s) => s.isMeasuringMode);
  const measurePoints = useStore((s) => s.measurePoints);
  const manualZoneOverride = useStore((s) => s.manualZoneOverride);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const activeModal = useStore((s) => s.activeModal);

  const movePoint = useStore((s) => s.movePoint);
  const setSelectedPointId = useStore((s) => s.setSelectedPointId);
  const setTempMapClickCoords = useStore((s) => s.setTempMapClickCoords);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const addMeasurePoint = useStore((s) => s.addMeasurePoint);
  const setActiveTileLayer = useStore((s) => s.setActiveTileLayer);
  const setQuickMapPopover = useStore((s) => s.setQuickMapPopover);
  const setContextMenu = useStore((s) => s.setContextMenu);
  const addPoint = useStore((s) => s.addPoint);
  const showToast = useStore((s) => s.showToast);
  const revertLastMove = useStore((s) => s.revertLastMove);
  const deletePoint = useStore((s) => s.deletePoint);

  // Cursor UTM display state
  const [cursorUtm, setCursorUtm] = useState<UTMCoordinate | null>(null);
  const [showLayerPicker, setShowLayerPicker] = useState(false);

  const isAr = language === 'ar';

  // StateRef to avoid stale closures in click handlers without re-registering listeners
  const stateRef = useRef({
    isAddingPointMode,
    isContinuousAddMode,
    isMeasuringMode,
    manualZoneOverride,
    points,
    language,
    isAr,
  });

  useEffect(() => {
    stateRef.current = {
      isAddingPointMode,
      isContinuousAddMode,
      isMeasuringMode,
      manualZoneOverride,
      points,
      language,
      isAr,
    };
  }, [isAddingPointMode, isContinuousAddMode, isMeasuringMode, manualZoneOverride, points, language, isAr]);

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      showToast(isAr ? 'الجي بي إس غير مدعوم في متصفحك' : 'GPS not supported', 'error');
      return;
    }
    showToast(isAr ? 'جاري تحديد موقعك الجغرافي...' : 'Locating GPS...', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 17, { animate: true });
          showToast(
            isAr ? 'تم الانتقال إلى موقعك الميداني الحالي 📍' : 'Centered on current GPS location 📍',
            'success'
          );
        }
      },
      () => {
        showToast(isAr ? 'تعذر الحصول على الموقع الجغرافي' : 'GPS location error', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [24.7116, 46.6744],
      zoom: 6,
      zoomControl: false,
      attributionControl: false,
      tapHold: true, // leafet taphold support
    });

    L.control.zoom({ position: language === 'ar' ? 'topleft' : 'topright' }).addTo(map);
    mapInstanceRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Recalculate map container size on layout changes (sidebar toggle, modal open/close, mode changes)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [sidebarOpen, activeModal, isMeasuringMode, isAddingPointMode, isContinuousAddMode]);

  // 2. Tile Layer Sync
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    if (overlayLayerRef.current) {
      map.removeLayer(overlayLayerRef.current);
      overlayLayerRef.current = null;
    }

    const provider = TILE_PROVIDERS[activeTileLayer];
    const newTileLayer = L.tileLayer(provider.url, {
      maxZoom: 19,
      attribution: provider.attribution,
      subdomains: provider.subdomains || ['a', 'b', 'c'],
    });

    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;

    if (activeTileLayer === 'hybrid') {
      const overlay = L.tileLayer(ESRI_REFERENCE_URL, { maxZoom: 19 });
      overlay.addTo(map);
      overlayLayerRef.current = overlay;
    }
  }, [activeTileLayer]);

  // 3. Mousemove Coords Display
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const utm = latLngToUTM(lat, lng, manualZoneOverride);
      setCursorUtm(utm);
    };

    map.on('mousemove', handleMouseMove);
    return () => {
      map.off('mousemove', handleMouseMove);
    };
  }, [manualZoneOverride]);

  // 4. Map Click & Long Press Gesture Handler
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (isLongPressRef.current) {
        isLongPressRef.current = false;
        return;
      }

      const { lat, lng } = e.latlng;
      const {
        isContinuousAddMode,
        isAddingPointMode,
        isMeasuringMode,
        manualZoneOverride,
        points,
        isAr,
      } = stateRef.current;

      const utm = latLngToUTM(lat, lng, manualZoneOverride);

      if (isContinuousAddMode) {
        // Continuous Add Mode: auto add point immediately!
        const autoName = isAr
          ? `نقطة ${points.length + 1} (${utm.zone}${utm.hemisphere})`
          : `Point ${points.length + 1} (${utm.zone}${utm.hemisphere})`;

        addPoint({
          name: autoName,
          category: 'control_point',
          utm,
          lat,
          lng,
          color: '#10b981',
        });
      } else if (isAddingPointMode) {
        setTempMapClickCoords({ lat, lng, utm });
        setActiveModal('add_point');
      } else if (isMeasuringMode) {
        addMeasurePoint({
          id: `m_${Date.now()}`,
          lat,
          lng,
          utm,
        });
      } else {
        // Normal click: open QuickMapPopover at click location
        setContextMenu(null);
        setQuickMapPopover({
          lat,
          lng,
          utm,
          x: e.originalEvent.clientX,
          y: e.originalEvent.clientY,
        });
      }
    };

    // Long Press on Map
    const handleMouseDownOrTouchStart = (e: L.LeafletMouseEvent | TouchEvent) => {
      const origEvent = 'originalEvent' in e ? e.originalEvent : e;
      const clientX = 'touches' in origEvent ? origEvent.touches[0].clientX : (origEvent as MouseEvent).clientX;
      const clientY = 'touches' in origEvent ? origEvent.touches[0].clientY : (origEvent as MouseEvent).clientY;

      longPressTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        let latlng: L.LatLng;
        if ('latlng' in e) {
          latlng = e.latlng;
        } else {
          latlng = map.containerPointToLatLng([clientX, clientY]);
        }

        const utm = latLngToUTM(latlng.lat, latlng.lng, stateRef.current.manualZoneOverride);
        setContextMenu(null);
        setQuickMapPopover({
          lat: latlng.lat,
          lng: latlng.lng,
          utm,
          x: clientX,
          y: clientY,
        });
      }, 500);
    };

    const handleMouseUpOrTouchEnd = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    map.on('click', handleMapClick);
    map.on('mousedown', handleMouseDownOrTouchStart as any);
    map.on('mouseup', handleMouseUpOrTouchEnd);
    map.on('dragstart', handleMouseUpOrTouchEnd);

    return () => {
      map.off('click', handleMapClick);
      map.off('mousedown', handleMouseDownOrTouchStart as any);
      map.off('mouseup', handleMouseUpOrTouchEnd);
      map.off('dragstart', handleMouseUpOrTouchEnd);
    };
  }, [
    addPoint,
    setTempMapClickCoords,
    setActiveModal,
    addMeasurePoint,
    setQuickMapPopover,
    setContextMenu,
  ]);

  // 5. Sync Markers on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentMarkers = markersRef.current;
    const existingIds = new Set<string>(currentMarkers.keys());
    const newPointIds = new Set(points.map((p) => p.id));

    // Remove old markers
    existingIds.forEach((id) => {
      if (!newPointIds.has(id)) {
        const marker = currentMarkers.get(id);
        if (marker) {
          marker.remove();
          currentMarkers.delete(id);
        }
      }
    });

    // Add or update markers
    points.forEach((pt) => {
      const isSelected = selectedPointId === pt.id;
      const isLocked = Boolean(pt.isLocked);
      const icon = createCustomMarkerIcon(pt.color || '#10b981', pt.name, isSelected, isLocked);

      if (currentMarkers.has(pt.id)) {
        const existingMarker = currentMarkers.get(pt.id)!;
        existingMarker.setLatLng([pt.lat, pt.lng]);
        existingMarker.setIcon(icon);

        if (isLocked) {
          existingMarker.dragging?.disable();
        } else {
          existingMarker.dragging?.enable();
        }
      } else {
        const marker = L.marker([pt.lat, pt.lng], {
          icon,
          draggable: !isLocked,
          title: pt.name,
        });

        // Touch dragging polish: disable map panning while dragging marker
        marker.on('dragstart', (e: any) => {
          map.dragging.disable();

          // Show floating live UTM tooltip
          const latlng = e.target.getLatLng();
          const utm = latLngToUTM(latlng.lat, latlng.lng, manualZoneOverride);
          const text = `${utm.zone}${utm.hemisphere} | E:${utm.easting.toFixed(2)} N:${utm.northing.toFixed(2)}`;

          const tooltip = L.tooltip({
            permanent: true,
            direction: 'top',
            className: 'bg-slate-900/95 text-emerald-300 font-mono text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-500/50 shadow-2xl',
          })
            .setContent(text)
            .setLatLng(latlng);

          tooltip.addTo(map);
          dragTooltipRef.current = tooltip;
        });

        marker.on('drag', (e: any) => {
          const latlng = e.target.getLatLng();
          const utm = latLngToUTM(latlng.lat, latlng.lng, manualZoneOverride);
          const text = `${utm.zone}${utm.hemisphere} | E:${utm.easting.toFixed(2)} m, N:${utm.northing.toFixed(2)} m`;

          if (dragTooltipRef.current) {
            dragTooltipRef.current.setLatLng(latlng).setContent(text);
          }
        });

        marker.on('dragend', (e: any) => {
          map.dragging.enable();

          if (dragTooltipRef.current) {
            dragTooltipRef.current.remove();
            dragTooltipRef.current = null;
          }

          const newLatLng = e.target.getLatLng();
          movePoint(pt.id, newLatLng.lat, newLatLng.lng);
        });

        // Click marker -> select
        marker.on('click', (e: any) => {
          L.DomEvent.stopPropagation(e);
          setSelectedPointId(pt.id);
        });

        // Context menu (right click or long touch)
        marker.on('contextmenu', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          setQuickMapPopover(null);
          setContextMenu({
            pointId: pt.id,
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY,
          });
        });

        marker.addTo(map);
        currentMarkers.set(pt.id, marker);
      }
    });
  }, [
    points,
    selectedPointId,
    manualZoneOverride,
    movePoint,
    setSelectedPointId,
    setContextMenu,
    setQuickMapPopover,
  ]);

  // 6. Fly to selected point
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPointId) return;

    const targetPoint = points.find((p) => p.id === selectedPointId);
    if (targetPoint) {
      map.flyTo([targetPoint.lat, targetPoint.lng], Math.max(map.getZoom(), 16), {
        duration: 1.2,
      });
    }
  }, [selectedPointId, points]);

  // 7. Render Measurement Polyline & Nodes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (measurePolylineRef.current) {
      measurePolylineRef.current.remove();
      measurePolylineRef.current = null;
    }
    measureMarkersRef.current.forEach((m) => m.remove());
    measureMarkersRef.current = [];

    // Only create L.polyline if we have at least 2 points to avoid single-point SVG path bounds bugs
    if (measurePoints.length >= 2) {
      const latLngs = measurePoints.map((p) => [p.lat, p.lng] as [number, number]);

      const polyline = L.polyline(latLngs, {
        color: '#f59e0b',
        weight: 3.5,
        dashArray: '8, 8',
        interactive: false,
        fill: false,
        fillColor: 'none',
        fillOpacity: 0,
      }).addTo(map);

      measurePolylineRef.current = polyline;
    }

    // Render node markers for all measure points
    if (measurePoints.length > 0) {
      measurePoints.forEach((pt, index) => {
        const nodeIcon = L.divIcon({
          html: `<div class="w-6 h-6 bg-amber-500 border-2 border-slate-900 rounded-full flex items-center justify-center text-[11px] font-bold text-slate-950 font-mono shadow-xl">${index + 1}</div>`,
          className: 'measure-node-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const nodeMarker = L.marker([pt.lat, pt.lng], {
          icon: nodeIcon,
          interactive: false,
        }).addTo(map);
        measureMarkersRef.current.push(nodeMarker);
      });
    }
  }, [measurePoints]);

  // 8. Global Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in form inputs, textareas, or selects
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');

      if (isInput) return;

      // Ctrl + Z: Undo move
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        revertLastMove();
      }

      // Escape: Close menus & exit add/measure mode
      if (e.key === 'Escape') {
        setQuickMapPopover(null);
        setContextMenu(null);
        useStore.getState().setIsAddingPointMode(false);
        useStore.getState().setIsMeasuringMode(false);
      }

      // Delete / Backspace: Delete selected point (if unlocked)
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPointId) {
        deletePoint(selectedPointId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPointId, revertLastMove, deletePoint, setQuickMapPopover, setContextMenu]);

  const totalMeasuredMeters = React.useMemo(() => {
    if (measurePoints.length < 2) return 0;
    let dist = 0;
    for (let i = 0; i < measurePoints.length - 1; i++) {
      dist += calculateHaversineDistance(
        measurePoints[i].lat,
        measurePoints[i].lng,
        measurePoints[i + 1].lat,
        measurePoints[i + 1].lng
      );
    }
    return dist;
  }, [measurePoints]);

  // Update cursor safely without wiping Leaflet's native classes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const container = map.getContainer();
    
    container.classList.remove('cursor-crosshair', 'cursor-cell', 'cursor-grab');
    
    if (isAddingPointMode || isContinuousAddMode) {
      container.classList.add('cursor-crosshair');
    } else if (isMeasuringMode) {
      container.classList.add('cursor-cell');
    } else {
      container.classList.add('cursor-grab');
    }
  }, [isAddingPointMode, isContinuousAddMode, isMeasuringMode]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Leaflet Stage */}
      <div
        ref={mapContainerRef}
        className="w-full h-full z-0"
      />

      {/* Mode Indicator Overlay Banners */}
      {isContinuousAddMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-emerald-950 border-2 border-emerald-400 text-emerald-100 px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-3 animate-pulse">
          <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" />
          <span className="text-xs font-extrabold tracking-wide">
            {isAr ? 'وضع الإضافة المتتالية نشط ⚡ اضغط على الخريطة لإضافة نقاط فورية' : 'Continuous Add Mode Active ⚡ Click map for instant points'}
          </span>
        </div>
      )}

      {isAddingPointMode && !isContinuousAddMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-emerald-950/95 border border-emerald-500/50 text-emerald-200 px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-3">
          <Crosshair className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold">{getTranslation(language, 'clickToAddPrompt')}</span>
        </div>
      )}

      {isMeasuringMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-amber-950/95 border border-amber-500/50 text-amber-200 px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-4">
          <Ruler className="w-5 h-5 text-amber-400" />
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium">{getTranslation(language, 'measuringPrompt')}</span>
            {measurePoints.length > 0 && (
              <span className="bg-amber-500 text-slate-950 font-mono font-bold text-xs px-2.5 py-0.5 rounded-full">
                {totalMeasuredMeters > 1000
                  ? `${(totalMeasuredMeters / 1000).toFixed(2)} km`
                  : `${totalMeasuredMeters.toFixed(1)} m`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Controls (GPS Location + Map Layer Switcher) */}
      <div className={`absolute bottom-20 sm:bottom-12 md:bottom-6 ${language === 'ar' ? 'left-3 sm:left-4' : 'right-3 sm:right-4'} z-[990] flex flex-col gap-2 items-end`}>
        {/* GPS My Location FAB Button */}
        <button
          onClick={handleLocateUser}
          className="p-3 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-emerald-400 rounded-2xl shadow-2xl transition-all active:scale-95 flex items-center justify-center group"
          title={isAr ? 'موقعي الميداني الحالي GPS' : 'My Current GPS Location'}
        >
          <LocateFixed className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        {/* Map Tile Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowLayerPicker(!showLayerPicker)}
            className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-200 px-3 py-2 rounded-2xl shadow-2xl text-xs font-semibold transition-all active:scale-95"
            title="تغيير طبقة الخريطة"
          >
            <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{getTranslation(language, activeTileLayer)}</span>
          </button>

          {showLayerPicker && (
            <div className={`absolute bottom-12 ${language === 'ar' ? 'left-0' : 'right-0'} bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-2 w-48 space-y-1 z-[1001]`}>
              {(['satellite', 'hybrid', 'streets', 'topo', 'dark'] as TileLayerType[]).map((layer) => (
                <button
                  key={layer}
                  onClick={() => {
                    setActiveTileLayer(layer);
                    setShowLayerPicker(false);
                  }}
                  className={`w-full text-right ${language === 'en' ? 'text-left' : ''} px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                    activeTileLayer === layer
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <span>{getTranslation(language, layer)}</span>
                  {activeTileLayer === layer && <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-glow" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cursor UTM Coordinates Footer Bar */}
      <div className={`absolute bottom-3 ${language === 'ar' ? 'right-4 left-24' : 'left-4 right-24'} z-[1000] pointer-events-none hidden sm:block`}>
        <div className="inline-flex items-center gap-3 bg-slate-950/90 border border-slate-800/80 text-slate-300 px-4 py-1.5 rounded-full shadow-lg text-xs font-mono">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
          <span className="text-slate-400 font-sans text-[11px] shrink-0">
            {getTranslation(language, 'cursorUtm')}
          </span>
          <span className="font-semibold text-slate-100 tracking-wide">
            {cursorUtm ? formatUTMString(cursorUtm, language) : '---'}
          </span>
        </div>
      </div>
    </div>
  );
};
