import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { useStore } from '../store/useStore';
import { latLngToUTM, formatUTMString, calculateHaversineDistance, latLngToMGRS, utmToLatLng, calculateUTMDistance, calculateBearing } from '../utils/utm';
import { fetchElevation } from '../utils/elevation';
import { getTranslation } from '../utils/translations';
import { TileLayerType, UTMCoordinate, AnnotationText } from '../types';
import { Crosshair, Ruler, MapPin, Layers, Lock, Sparkles, LocateFixed, Loader2, AlertCircle, RotateCw, Wifi, PenTool, Type } from 'lucide-react';
import { AnnotationToolbar } from './AnnotationToolbar';
import { LineEditorModal } from './LineEditorModal';
import { TextEditorModal } from './TextEditorModal';

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
  
  const annotationsLayerGroupRef = useRef<L.FeatureGroup | null>(null);
  const drawingLinePolylineRef = useRef<L.Polyline | null>(null);
  const drawingLineMarkersRef = useRef<L.Marker[]>([]);
  const twoPointMeasureLayerRef = useRef<L.FeatureGroup | null>(null);

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
  const isDrawingLineMode = useStore((s) => s.isDrawingLineMode);
  const isAddingTextMode = useStore((s) => s.isAddingTextMode);
  const annotations = useStore((s) => s.annotations);
  const selectedAnnotationId = useStore((s) => s.selectedAnnotationId);
  const drawingLinePoints = useStore((s) => s.drawingLinePoints);

  const manualZoneOverride = useStore((s) => s.manualZoneOverride);
  const autoFetchElevation = useStore((s) => s.autoFetchElevation);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const activeModal = useStore((s) => s.activeModal);
  const pointAMeasureId = useStore((s) => s.pointAMeasureId);
  const pointBMeasureId = useStore((s) => s.pointBMeasureId);

  const movePoint = useStore((s) => s.movePoint);
  const updatePoint = useStore((s) => s.updatePoint);
  const setSelectedPointId = useStore((s) => s.setSelectedPointId);
  const setTempMapClickCoords = useStore((s) => s.setTempMapClickCoords);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const addMeasurePoint = useStore((s) => s.addMeasurePoint);
  const addDrawingLinePoint = useStore((s) => s.addDrawingLinePoint);
  const setSelectedAnnotationId = useStore((s) => s.setSelectedAnnotationId);
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
    isDrawingLineMode,
    isAddingTextMode,
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
      isDrawingLineMode,
      isAddingTextMode,
      manualZoneOverride,
      points,
      language,
      isAr,
    };
  }, [isAddingPointMode, isContinuousAddMode, isMeasuringMode, isDrawingLineMode, isAddingTextMode, manualZoneOverride, points, language, isAr]);

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

  // Tile loading & error states
  const [isTileLoading, setIsTileLoading] = useState(false);
  const [hasTileError, setHasTileError] = useState(false);
  const tileErrorCountRef = useRef(0);

  const IRAQ_BOUNDS = L.latLngBounds([26.0, 35.0], [40.0, 52.0]);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [33.3152, 44.3661], // Baghdad center
      zoom: 6,
      minZoom: 5,
      maxBounds: IRAQ_BOUNDS,
      maxBoundsViscosity: 1.0,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
      tapHold: true, // leaflet taphold support
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

  // Handle Tile Error & Fallback
  const handleTileError = useCallback(() => {
    tileErrorCountRef.current += 1;
    setHasTileError(true);
    
    // If satellite fails repeatedly, suggest or auto switch to OSM Streets
    if (tileErrorCountRef.current > 4 && activeTileLayer === 'satellite') {
      showToast(
        isAr ? 'فشل تحميل بعض بلاطات الأقمار الصناعية، تم الانتقال تلقائياً لخرائط الطرق' : 'Satellite tiles failed, switched automatically to Street Map',
        'warning'
      );
      setActiveTileLayer('streets');
      tileErrorCountRef.current = 0;
    } else {
      showToast(
        getTranslation(language, 'mapTileError'),
        'error'
      );
    }
  }, [activeTileLayer, showToast, setActiveTileLayer, isAr, language]);

  // Retry loading current tile layer
  const handleRetryTiles = () => {
    setHasTileError(false);
    tileErrorCountRef.current = 0;
    if (tileLayerRef.current) {
      tileLayerRef.current.redraw();
    }
  };

  // 2. Tile Layer Sync
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    if (overlayLayerRef.current) {
      map.removeLayer(overlayLayerRef.current);
      overlayLayerRef.current = null;
    }

    setHasTileError(false);
    setIsTileLoading(true);

    const provider = TILE_PROVIDERS[activeTileLayer];
    const newTileLayer = L.tileLayer(provider.url, {
      maxZoom: 19,
      attribution: provider.attribution,
      subdomains: provider.subdomains || ['a', 'b', 'c'],
      keepBuffer: 4,
      updateWhenIdle: true,
    });

    newTileLayer.on('loading', () => setIsTileLoading(true));
    newTileLayer.on('load', () => {
      setIsTileLoading(false);
      tileErrorCountRef.current = 0;
    });
    newTileLayer.on('tileerror', () => {
      setIsTileLoading(false);
      handleTileError();
    });

    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;

    if (activeTileLayer === 'hybrid') {
      const overlay = L.tileLayer(ESRI_REFERENCE_URL, { 
        maxZoom: 19,
        keepBuffer: 4,
        updateWhenIdle: true,
      });
      overlay.addTo(map);
      overlayLayerRef.current = overlay;
    }
  }, [activeTileLayer, handleTileError]);

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

  // 4. Map Click Handler (Using store.getState() for fresh values)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      const st = useStore.getState();
      const { lat, lng } = e.latlng;
      const utm = latLngToUTM(lat, lng, st.manualZoneOverride);

      if (st.movingAnnotationId) {
        const target = st.annotations.find(a => a.id === st.movingAnnotationId);
        if (target) {
          if (target.type === 'text') {
            st.updateAnnotation(target.id, { lat, lng, utm });
          } else if (target.type === 'line') {
            let avgLat = 0, avgLng = 0;
            target.points.forEach(p => { avgLat += p.lat; avgLng += p.lng; });
            avgLat /= target.points.length;
            avgLng /= target.points.length;
            const dLat = lat - avgLat;
            const dLng = lng - avgLng;
            const newPoints = target.points.map(p => {
              const nLat = p.lat + dLat;
              const nLng = p.lng + dLng;
              return { lat: nLat, lng: nLng, utm: latLngToUTM(nLat, nLng, st.manualZoneOverride) };
            });
            st.updateAnnotation(target.id, { points: newPoints });
          }
        }
        st.setMovingAnnotationId(null);
        return;
      }

      if (st.isDrawingLineMode) { st.addDrawingLinePoint({ lat, lng, utm }); return; }
      if (st.isAddingTextMode)  { st.setPendingTextLocation({ lat, lng, utm }); return; }
      if (st.isMeasuringMode)   { st.addMeasurePoint({ id: `m_${Date.now()}`, lat, lng, utm }); return; }
      
      if (st.isContinuousAddMode) {
        const autoName = (st.language === 'ar')
          ? `نقطة ${st.points.length + 1} (${utm.zone}${utm.hemisphere})`
          : `Point ${st.points.length + 1} (${utm.zone}${utm.hemisphere})`;

        st.addPoint({
          name: autoName,
          category: '',
          utm,
          lat,
          lng,
          color: '#10b981',
        });
        return;
      }

      if (st.isAddingPointMode) { 
        st.setTempMapClickCoords({ lat, lng, utm });
        st.setActiveModal('add_point');
        return; 
      }

      st.setQuickMapPopover({ lat, lng, utm, x: e.originalEvent.clientX, y: e.originalEvent.clientY });
      st.setContextMenu(null);
      st.setSelectedAnnotationId(null);
    };

    map.on('click', handleClick);
    return () => { map.off('click', handleClick); };
  }, []);

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

        if (!map.hasLayer(existingMarker)) {
          existingMarker.addTo(map);
        }

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

          if (autoFetchElevation) {
            fetchElevation(newLatLng.lat, newLatLng.lng).then((newElev) => {
              if (newElev !== null) {
                updatePoint(pt.id, { elevation: newElev });
              }
            });
          }
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

  // Sync Temporary Drawing Line Points
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (drawingLinePolylineRef.current) {
      drawingLinePolylineRef.current.remove();
      drawingLinePolylineRef.current = null;
    }
    drawingLineMarkersRef.current.forEach((m) => m.remove());
    drawingLineMarkersRef.current = [];

    if (drawingLinePoints.length >= 2) {
      const latLngs = drawingLinePoints.map((p) => [p.lat, p.lng] as [number, number]);
      const polyline = L.polyline(latLngs, {
        color: '#ef4444',
        weight: 3,
        dashArray: '5, 10',
        interactive: false,
      }).addTo(map);
      drawingLinePolylineRef.current = polyline;
    }

    if (drawingLinePoints.length > 0) {
      drawingLinePoints.forEach((pt, index) => {
        const nodeIcon = L.divIcon({
          html: `<div class="w-4 h-4 bg-rose-500 border border-white rounded-full shadow-md"></div>`,
          className: 'drawing-node-icon',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        const nodeMarker = L.marker([pt.lat, pt.lng], {
          icon: nodeIcon,
          interactive: false,
        }).addTo(map);
        drawingLineMarkersRef.current.push(nodeMarker);
      });
    }
  }, [drawingLinePoints]);

  // Sync Annotations
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!annotationsLayerGroupRef.current || !map.hasLayer(annotationsLayerGroupRef.current)) {
      if (annotationsLayerGroupRef.current) {
        annotationsLayerGroupRef.current.remove();
      }
      annotationsLayerGroupRef.current = L.featureGroup().addTo(map);
    }
    const layerGroup = annotationsLayerGroupRef.current;
    layerGroup.clearLayers();

    annotations.forEach((annotation) => {
      const isSelected = selectedAnnotationId === annotation.id;
      
      if (annotation.type === 'line') {
        const latLngs = annotation.points.map(p => [p.lat, p.lng] as [number, number]);
        
        // Add a transparent thicker background polyline to make clicking easier
        const hitArea = L.polyline(latLngs, {
          color: 'transparent',
          weight: Math.max(15, (annotation.weight || 3) + 10),
          interactive: true,
        });

        const polyline = L.polyline(latLngs, {
          color: isSelected ? '#ffffff' : (annotation.color || '#ef4444'),
          weight: isSelected ? (annotation.weight || 3) + 2 : (annotation.weight || 3),
          dashArray: annotation.dashArray,
          interactive: true,
          className: isSelected ? 'drop-shadow-md' : '',
        });

        hitArea.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedAnnotationId(annotation.id);
        });
        
        polyline.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedAnnotationId(annotation.id);
        });

        hitArea.addTo(layerGroup);
        polyline.addTo(layerGroup);
        
      } else if (annotation.type === 'text') {
        const rotation = annotation.rotation || 0;
        const color = annotation.color || '#ffffff';
        const bg = annotation.backgroundColor || 'transparent';
        const fontSize = annotation.fontSize || 16;
        
        const html = `
          <div 
            class="transition-all ${isSelected ? 'ring-2 ring-amber-500 scale-105 z-50' : 'hover:scale-105 z-40'}"
            style="
              color: ${color}; 
              font-size: ${fontSize}px; 
              background-color: ${bg}; 
              transform: rotate(${rotation}deg);
              padding: ${bg !== 'transparent' ? '4px 8px' : '0'};
              border-radius: 4px;
              text-shadow: ${bg === 'transparent' ? '0px 0px 3px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.8)' : 'none'};
              font-weight: bold;
              white-space: nowrap;
              transform-origin: center center;
              cursor: pointer;
            "
          >
            ${annotation.content}
          </div>
        `;
        
        const icon = L.divIcon({
          html,
          className: 'annotation-text-label',
          iconSize: undefined,
        });
        
        const marker = L.marker([annotation.lat, annotation.lng], {
          icon,
          interactive: true,
        });
        
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedAnnotationId(annotation.id);
        });
        
        marker.addTo(layerGroup);
      }
    });
  }, [annotations, selectedAnnotationId, setSelectedAnnotationId]);

  // Sync Two-Point Measurement path and floating badge
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!twoPointMeasureLayerRef.current || !map.hasLayer(twoPointMeasureLayerRef.current)) {
      if (twoPointMeasureLayerRef.current) twoPointMeasureLayerRef.current.remove();
      twoPointMeasureLayerRef.current = L.featureGroup().addTo(map);
    }

    const layerGroup = twoPointMeasureLayerRef.current;
    layerGroup.clearLayers();

    if (pointAMeasureId && pointBMeasureId) {
      const ptA = points.find((p) => p.id === pointAMeasureId);
      const ptB = points.find((p) => p.id === pointBMeasureId);

      if (ptA && ptB) {
        const latLngs: [number, number][] = [
          [ptA.lat, ptA.lng],
          [ptB.lat, ptB.lng],
        ];

        // Draw dashed measurement line
        const polyline = L.polyline(latLngs, {
          color: '#f59e0b',
          weight: 4,
          dashArray: '8, 8',
          interactive: false,
        });
        polyline.addTo(layerGroup);

        // Calculate midpoint, distance & azimuth bearing
        const midLat = (ptA.lat + ptB.lat) / 2;
        const midLng = (ptA.lng + ptB.lng) / 2;
        const dist = calculateUTMDistance(ptA.utm, ptB.utm);
        const bearing = calculateBearing(ptA.lat, ptA.lng, ptB.lat, ptB.lng);

        const html = `
          <div class="bg-amber-950/95 border-2 border-amber-400 text-amber-200 px-3 py-1.5 rounded-xl shadow-2xl font-mono text-xs font-bold text-center -translate-x-1/2 -translate-y-1/2 flex flex-col gap-0.5 whitespace-nowrap">
            <div>📏 ${dist.toFixed(2)} m</div>
            <div class="text-[10px] text-amber-300 font-sans">Azimuth: ${bearing.toFixed(1)}°</div>
          </div>
        `;

        const badgeIcon = L.divIcon({
          html,
          className: 'twopt-measure-badge',
          iconSize: [120, 40],
          iconAnchor: [60, 20],
        });

        L.marker([midLat, midLng], { icon: badgeIcon, interactive: false }).addTo(layerGroup);

        // Zoom map to show both points
        map.fitBounds(L.latLngBounds([ptA.lat, ptA.lng], [ptB.lat, ptB.lng]), {
          padding: [60, 60],
          maxZoom: 18,
        });
      }
    }
  }, [pointAMeasureId, pointBMeasureId, points]);

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


      {/* Map Tile Loading Indicator & Retry / Error Banner */}
      {isTileLoading && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 border border-slate-700/80 text-slate-200 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium backdrop-blur-md">
          <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
          <span>{getTranslation(language, 'mapLoading')}</span>
        </div>
      )}

      {hasTileError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] bg-rose-950/90 border border-rose-500/50 text-rose-200 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-medium backdrop-blur-md">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{getTranslation(language, 'mapTileError')}</span>
          <button
            onClick={handleRetryTiles}
            className="flex items-center gap-1 bg-rose-500 hover:bg-rose-600 text-white px-2.5 py-1 rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <RotateCw className="w-3 h-3" />
            <span>{getTranslation(language, 'mapRetry')}</span>
          </button>
        </div>
      )}

      {/* Floating Action Controls (GPS Location + Map Layer Switcher) */}
      <div
        dir="ltr"
        className={`absolute bottom-20 sm:bottom-12 md:bottom-6 ${
          isAr ? 'left-3 sm:left-4 items-start' : 'right-3 sm:right-4 items-end'
        } z-[990] flex flex-col gap-2`}
      >
        {/* GPS My Location FAB Button */}
        <button
          onClick={handleLocateUser}
          className={`group relative flex ${
            isAr ? 'flex-row' : 'flex-row-reverse'
          } items-center h-12 rounded-2xl bg-slate-900/90 border border-slate-700/80 hover:bg-slate-800 text-emerald-400 shadow-2xl transition-all duration-300 ease-out cursor-pointer overflow-hidden active:scale-95`}
          title={isAr ? 'موقعي الميداني الحالي GPS' : 'My Current GPS Location'}
        >
          <div className="w-12 h-12 flex items-center justify-center shrink-0">
            <LocateFixed className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </div>
          <span
            dir={isAr ? 'rtl' : 'ltr'}
            className={`max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 ${
              isAr ? 'group-hover:pr-3.5 group-hover:pl-1' : 'group-hover:pl-3.5 group-hover:pr-1'
            } text-xs font-bold text-slate-200 whitespace-nowrap transition-all duration-300 ease-out`}
          >
            {isAr ? 'موقعي الميداني GPS' : 'My GPS Location'}
          </span>
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
          {cursorUtm && (
            <span className="text-[10px] bg-slate-900 border border-slate-800 text-amber-400 px-2 py-0.5 rounded-full font-bold">
              MGRS: {(() => {
                const pt = utmToLatLng(cursorUtm);
                return latLngToMGRS(pt.lat, pt.lng);
              })()}
            </span>
          )}
        </div>
      </div>
      
      <AnnotationToolbar />
      
    </div>
  );
};
