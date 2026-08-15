import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import {
  calculateProfileSummary,
  calculateDistanceMeters,
  fetchBatchElevations,
  interpolateLinePoints,
  ProfileSummary,
  ProfileSamplePoint,
  formatDistance,
} from '../utils/elevation';
import { latLngToUTM } from '../utils/utm';
import {
  Mountain,
  X,
  RefreshCw,
  Maximize2,
  Minimize2,
  TrendingUp,
  TrendingDown,
  Navigation,
  Folder,
  MousePointer2,
  Route,
  ArrowRightLeft,
  Download,
  Printer,
  FileSpreadsheet,
  Table as TableIcon,
  BarChart3,
  Activity,
  ArrowUpDown,
  ArrowUpAZ,
  ArrowDownAZ,
  Search,
  Check,
  Calendar,
  Layers,
  Sliders,
  CheckSquare,
  Square,
  FileText,
  Edit3,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import * as XLSX from 'xlsx';

// Natural alphanumeric sorting comparator for point names (e.g., 1, 2, 10, 140, 150 or P1, P2, P140, P150)
function naturalCompare(a: string = '', b: string = ''): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export const ElevationProfileModal: React.FC = () => {
  const points = useStore((s) => s.points);
  const annotations = useStore((s) => s.annotations);
  const categories = useStore((s) => s.categories);
  const selectedPointIdsForAction = useStore((s) => s.selectedPointIdsForAction);
  const language = useStore((s) => s.language);
  const isAr = language === 'ar';

  const elevationProfile = useStore((s) => s.elevationProfile);
  const closeElevationProfile = useStore((s) => s.closeElevationProfile);
  const setElevationProfileHoverCoord = useStore((s) => s.setElevationProfileHoverCoord);
  const setElevationProfileSourceMode = useStore((s) => s.setElevationProfileSourceMode);
  const showToast = useStore((s) => s.showToast);

  // Window Size & View States
  const [windowMode, setWindowMode] = useState<'studio' | 'fullscreen'>('studio');
  const [activeViewTab, setActiveViewTab] = useState<'chart' | 'table' | 'stats'>('chart');
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);

  // Sorting Mode (Strictly by Point Name by default)
  const [sortOrder, setSortOrder] = useState<'name_asc' | 'name_desc' | 'original'>('name_asc');

  // Print Report Customization & Flexibility
  const [includeHeader, setIncludeHeader] = useState<boolean>(false);
  const [includeStats, setIncludeStats] = useState<boolean>(true);
  const [includeChart, setIncludeChart] = useState<boolean>(true);
  const [includeTable, setIncludeTable] = useState<boolean>(false);
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(false);
  const [includeNotes, setIncludeNotes] = useState<boolean>(false);
  const [customNotes, setCustomNotes] = useState<string>('');

  const [reportTitle, setReportTitle] = useState<string>(
    isAr ? 'تقرير المقطع التضاريسي ومناسيب النقاط' : 'Elevation Profile & Point Elevations Report'
  );
  const [projectName, setProjectName] = useState<string>(isAr ? 'مشروع الرفع الطبوغرافي' : 'Topographic Survey Project');
  const [surveyorName, setSurveyorName] = useState<string>(isAr ? 'مهندس المساحة المعتمد' : 'Certified Survey Engineer');
  const [appSubtitle, setAppSubtitle] = useState<string>(
    isAr ? 'تطبيق المساح الذكي - تقرير الرفع الطبوغرافي ومناسيب النقاط' : 'Al-Mussah Professional GIS & Survey Suite'
  );
  const [reportDate, setReportDate] = useState<string>(() =>
    new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  );
  const [reviewerName, setReviewerName] = useState<string>(isAr ? 'مهندس المساحة والمشاريع' : 'Lead Project Engineer');
  const [approverName, setApproverName] = useState<string>(isAr ? 'إدارة المساحة ونظم المعلومات' : 'Survey & GIS Department');
  const [printTableLimit, setPrintTableLimit] = useState<number>(50);

  // Local Controls State
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [selectedLineId, setSelectedLineId] = useState<string>('');
  const [startPointId, setStartPointId] = useState<string>('');
  const [endPointId, setEndPointId] = useState<string>('');
  const [sampleResolution, setSampleResolution] = useState<number>(30);
  const [isSamplingElevations, setIsSamplingElevations] = useState<boolean>(false);
  const [activeHoverPoint, setActiveHoverPoint] = useState<ProfileSamplePoint | null>(null);
  const [activeTabMode, setActiveTabMode] = useState<'sequence' | 'folder' | 'start_end' | 'line' | 'selection'>('sequence');
  const [isPathReversed, setIsPathReversed] = useState<boolean>(false);

  // Chart Visual Options
  const [showRefLines, setShowRefLines] = useState<boolean>(true);
  const [curveType, setCurveType] = useState<'monotone' | 'linear'>('monotone');
  const [tableSearchTerm, setTableSearchTerm] = useState<string>('');

  // Filtered lines from annotations
  const lines = useMemo(() => {
    return annotations.filter((a) => a.type === 'line');
  }, [annotations]);

  // Sync with store state on open
  useEffect(() => {
    if (elevationProfile.isOpen) {
      if (elevationProfile.sourceMode) {
        setActiveTabMode(elevationProfile.sourceMode as any);
      }
      if (elevationProfile.sourceFolderName) {
        setSelectedFolder(elevationProfile.sourceFolderName);
      }
      if (elevationProfile.sourceLineId) {
        setSelectedLineId(elevationProfile.sourceLineId);
      }
      if (elevationProfile.startPointId) {
        setStartPointId(elevationProfile.startPointId);
      }
      if (elevationProfile.endPointId) {
        setEndPointId(elevationProfile.endPointId);
      }
    }
  }, [elevationProfile.isOpen]);

  // Set default start/end points if empty (sorted by name)
  useEffect(() => {
    if (points.length >= 2) {
      const sortedPts = [...points].sort((a, b) => naturalCompare(a.name, b.name));
      if (!startPointId) setStartPointId(sortedPts[0].id);
      if (!endPointId) setEndPointId(sortedPts[sortedPts.length - 1].id);
    }
    if (lines.length > 0 && !selectedLineId) {
      setSelectedLineId(lines[0].id);
    }
  }, [points, lines]);

  // State to hold sampled elevation points for Start-to-End mode
  const [interpolatedSamples, setInterpolatedSamples] = useState<
    Array<{ lat: number; lng: number; elevation?: number | null; name?: string; id?: string }>
  >([]);

  // Compute Raw Points based on active source mode and STRICTLY sort by Point Name (Natural Alphanumeric)
  const rawPoints = useMemo(() => {
    let pts: Array<{ lat: number; lng: number; elevation?: number | null; name?: string; id?: string }> = [];

    if (activeTabMode === 'sequence') {
      pts = points.map((p) => ({
        id: p.id,
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        elevation: p.elevation ?? 0,
      }));
    } else if (activeTabMode === 'folder') {
      const folderPts =
        selectedFolder === 'all'
          ? points
          : selectedFolder === 'uncategorized'
          ? points.filter((p) => !p.category || p.category.trim() === '')
          : points.filter((p) => p.category === selectedFolder);

      pts = folderPts.map((p) => ({
        id: p.id,
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        elevation: p.elevation ?? 0,
      }));
    } else if (activeTabMode === 'selection') {
      const selected = points.filter((p) => selectedPointIdsForAction.includes(p.id));
      pts = selected.map((p) => ({
        id: p.id,
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        elevation: p.elevation ?? 0,
      }));
    } else if (activeTabMode === 'line') {
      const targetLine = lines.find((l) => l.id === selectedLineId);
      if (targetLine && targetLine.points.length > 0) {
        pts = targetLine.points.map((p, idx) => ({
          name: `${targetLine.name || 'Line'} - ${idx + 1}`,
          lat: p.lat,
          lng: p.lng,
          elevation: 0,
        }));
      }
    } else if (activeTabMode === 'start_end') {
      if (interpolatedSamples.length > 0) {
        pts = interpolatedSamples;
      } else {
        const ptA = points.find((p) => p.id === startPointId);
        const ptB = points.find((p) => p.id === endPointId);
        if (ptA && ptB) {
          pts = [
            { id: ptA.id, name: ptA.name, lat: ptA.lat, lng: ptA.lng, elevation: ptA.elevation ?? 0 },
            { id: ptB.id, name: ptB.name, lat: ptB.lat, lng: ptB.lng, elevation: ptB.elevation ?? 0 },
          ];
        }
      }
    }

    // Apply Sorting:
    // If not in start_end interpolation mode or line mode, sort strictly by Point Name!
    if (activeTabMode !== 'line' && (activeTabMode !== 'start_end' || interpolatedSamples.length === 0)) {
      if (sortOrder === 'name_asc') {
        pts = [...pts].sort((a, b) => naturalCompare(a.name, b.name));
      } else if (sortOrder === 'name_desc') {
        pts = [...pts].sort((a, b) => naturalCompare(b.name, a.name));
      }
    }

    if (isPathReversed) {
      return [...pts].reverse();
    }
    return pts;
  }, [
    activeTabMode,
    points,
    selectedFolder,
    selectedPointIdsForAction,
    selectedLineId,
    lines,
    startPointId,
    endPointId,
    interpolatedSamples,
    sortOrder,
    isPathReversed,
  ]);

  // Generate Profile Summary
  const profileSummary: ProfileSummary = useMemo(() => {
    return calculateProfileSummary(rawPoints, isAr);
  }, [rawPoints, isAr]);

  // Enriched points with UTM coordinates, index, and leg distance (without confusing 'ch' or 'station' jargon)
  const enrichedPointList = useMemo(() => {
    return profileSummary.points.map((p, idx) => {
      const utm = latLngToUTM(p.lat, p.lng);
      const prevPt = idx > 0 ? profileSummary.points[idx - 1] : null;
      const legDist = prevPt ? calculateDistanceMeters(prevPt.lat, prevPt.lng, p.lat, p.lng) : 0;

      return {
        ...p,
        seqIndex: idx + 1,
        legDistMeters: Math.round(legDist * 10) / 10,
        formattedLegDist: formatDistance(legDist, isAr),
        utmEasting: utm.easting,
        utmNorthing: utm.northing,
        utmZone: `${utm.zone}${utm.hemisphere}`,
      };
    });
  }, [profileSummary.points, isAr]);

  // Filtered points for search in table view
  const filteredPointList = useMemo(() => {
    if (!tableSearchTerm.trim()) return enrichedPointList;
    const q = tableSearchTerm.toLowerCase();
    return enrichedPointList.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.formattedDistance.toLowerCase().includes(q) ||
        p.elevation.toString().includes(q) ||
        p.utmEasting.toString().includes(q) ||
        p.utmNorthing.toString().includes(q)
    );
  }, [enrichedPointList, tableSearchTerm]);

  // Detailed Terrain Analysis Metrics
  const terrainStats = useMemo(() => {
    if (profileSummary.points.length < 2) {
      return {
        avgSlope: 0,
        maxClimbSlope: 0,
        maxDescentSlope: 0,
        flatPercent: 0,
        moderatePercent: 0,
        steepPercent: 0,
        meanElevation: 0,
      };
    }

    let totalSlope = 0;
    let maxClimb = 0;
    let maxDescent = 0;
    let flatCount = 0;
    let moderateCount = 0;
    let steepCount = 0;
    let sumElev = 0;

    const validSlopes = profileSummary.points.filter((p) => p.slopePercent !== undefined);

    validSlopes.forEach((p) => {
      const s = p.slopePercent || 0;
      totalSlope += Math.abs(s);
      if (s > maxClimb) maxClimb = s;
      if (s < maxDescent) maxDescent = s;

      const absS = Math.abs(s);
      if (absS < 3) flatCount++;
      else if (absS <= 10) moderateCount++;
      else steepCount++;
    });

    profileSummary.points.forEach((p) => {
      sumElev += p.elevation;
    });

    const totalCount = validSlopes.length || 1;

    return {
      avgSlope: Math.round((totalSlope / totalCount) * 10) / 10,
      maxClimbSlope: maxClimb,
      maxDescentSlope: Math.abs(maxDescent),
      flatPercent: Math.round((flatCount / totalCount) * 100),
      moderatePercent: Math.round((moderateCount / totalCount) * 100),
      steepPercent: Math.round((steepCount / totalCount) * 100),
      meanElevation: Math.round((sumElev / profileSummary.points.length) * 10) / 10,
    };
  }, [profileSummary]);

  // Generate Start-to-End Elevation Profile with intermediate digital elevation samples
  const handleGenerateStartEndSamples = async () => {
    const ptA = points.find((p) => p.id === startPointId);
    const ptB = points.find((p) => p.id === endPointId);

    if (!ptA || !ptB) {
      showToast(isAr ? 'يرجى اختيار نقطة بداية ونقطة نهاية صالحة' : 'Please select valid start & end points', 'warning');
      return;
    }

    setIsSamplingElevations(true);
    try {
      const interpolated = interpolateLinePoints(ptA.lat, ptA.lng, ptB.lat, ptB.lng, sampleResolution);
      const elevations = await fetchBatchElevations(interpolated);

      const sampled = interpolated.map((pt, idx) => {
        let elev = elevations[idx];
        if (elev === null || elev === undefined) {
          const startE = ptA.elevation ?? 0;
          const endE = ptB.elevation ?? 0;
          elev = startE + (endE - startE) * pt.ratio;
        }
        const name =
          idx === 0 ? ptA.name : idx === interpolated.length - 1 ? ptB.name : `${ptA.name} ➔ ${(pt.ratio * 100).toFixed(0)}%`;
        return {
          name,
          lat: pt.lat,
          lng: pt.lng,
          elevation: elev,
        };
      });

      setInterpolatedSamples(sampled);
      showToast(
        isAr ? `تم حساب وتحليل الارتفاع عبر ${sampled.length} عينة بنجاح ⛰️` : `Calculated elevation profile with ${sampled.length} samples ⛰️`,
        'success'
      );
    } catch (err) {
      showToast(isAr ? 'تعذر جلب بيانات الارتفاع الرقمية' : 'Failed to fetch elevation samples', 'error');
    } finally {
      setIsSamplingElevations(false);
    }
  };

  // Fetch missing elevations for all profile points via satellite
  const handleFetchAllMissingElevations = async () => {
    if (rawPoints.length === 0) return;
    setIsSamplingElevations(true);

    try {
      const coords = rawPoints.map((p) => ({ lat: p.lat, lng: p.lng }));
      const elevations = await fetchBatchElevations(coords);

      const updated = rawPoints.map((p, idx) => ({
        ...p,
        elevation: elevations[idx] !== null ? elevations[idx]! : p.elevation ?? 0,
      }));

      setInterpolatedSamples(updated);
      showToast(
        isAr ? 'تم تحديث وتحسين دقة مناسيب الارتفاع من القمر الصناعي (SRTM) 🛰️' : 'Updated elevation points with satellite data 🛰️',
        'success'
      );
    } catch (e) {
      showToast(isAr ? 'حدث خطأ أثناء جلب الارتفاعات' : 'Error updating elevations', 'error');
    } finally {
      setIsSamplingElevations(false);
    }
  };

  // Export Elevation Profile to Excel
  const handleExportProfileToExcel = () => {
    if (enrichedPointList.length === 0) return;

    const data = enrichedPointList.map((p) => ({
      [isAr ? 'التسلسل' : 'Seq']: p.seqIndex,
      [isAr ? 'اسم النقطة' : 'Point Name']: p.name,
      [isAr ? 'المنسوب / الارتفاع (م)' : 'Elevation (m)']: p.elevation,
      [isAr ? 'المسافة التراكمية (م)' : 'Cumulative Dist (m)']: p.distanceMeters,
      [isAr ? 'المسافة التراكمية' : 'Formatted Dist']: p.formattedDistance,
      [isAr ? 'المسافة الجزئية (م)' : 'Leg Dist (m)']: p.legDistMeters,
      [isAr ? 'نسبة الانحدار (%)' : 'Slope (%)']: `${p.slopePercent || 0}%`,
      [isAr ? 'الإحداثي الشرقي (UTM X)' : 'UTM Easting']: p.utmEasting,
      [isAr ? 'الإحداثي الشمالي (UTM Y)' : 'UTM Northing']: p.utmNorthing,
      [isAr ? 'نطاق UTM' : 'UTM Zone']: p.utmZone,
      [isAr ? 'دائرة العرض (Lat)' : 'Latitude']: p.lat,
      [isAr ? 'خط الطول (Lng)' : 'Longitude']: p.lng,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ElevationProfile');
    XLSX.writeFile(wb, `Elevation_Profile_Points_${Date.now()}.xlsx`);
    showToast(isAr ? 'تم تصدير جدول مناسيب النقاط إلى Excel بنجاح' : 'Exported profile points to Excel', 'success');
  };

  // Trigger Browser Print
  const handleTriggerPrint = () => {
    window.print();
  };

  if (!elevationProfile.isOpen) return null;

  return (
    <>
      {/* 1. Main Elevation Profile Container */}
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className={`fixed z-[990] transition-all duration-300 select-none overflow-hidden ${
          windowMode === 'fullscreen'
            ? 'inset-2 md:inset-4 rounded-3xl bg-slate-950/98 backdrop-blur-2xl border border-slate-700/80 shadow-2xl flex flex-col'
            : 'bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl h-[82vh] md:h-[80vh] rounded-t-3xl bg-slate-950/98 backdrop-blur-2xl border-t border-x border-slate-700/80 shadow-2xl flex flex-col'
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/25 text-white shrink-0">
              <Mountain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-extrabold text-slate-100 text-base tracking-tight">
                  {isAr ? 'المقطع التضاريسي ومناسيب النقاط' : 'Point Elevation & Terrain Profile'}
                </h3>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  {profileSummary.points.length} {isAr ? 'نقطة مساحية' : 'Points'}
                </span>
                {profileSummary.totalDistanceMeters > 0 && (
                  <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {profileSummary.formattedTotalDistance}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {isAr
                  ? 'مرتب بدقة حسب تسلسل اسم النقطة (1 ➔ 2 ➔ 140 ➔ 150) مع حساب المناسيب والمسافات والطباعة'
                  : 'Ordered strictly by Point Name sequence with elevation analysis and print report'}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Print Engineering Report Button */}
            <button
              type="button"
              onClick={() => setShowPrintPreview(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/30 active:scale-95 flex items-center gap-1.5"
              title={isAr ? 'معاينة وطباعة التقرير الهندسي' : 'Print Survey Report'}
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'طباعة التقرير' : 'Print Report'}</span>
            </button>

            {/* Export to Excel */}
            <button
              type="button"
              onClick={handleExportProfileToExcel}
              title={isAr ? 'تصدير جدول مناسيب النقاط إلى Excel' : 'Export to Excel'}
              className="p-2 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-700"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>

            {/* Refresh SRTM Elevation Data */}
            <button
              type="button"
              onClick={handleFetchAllMissingElevations}
              disabled={isSamplingElevations}
              title={isAr ? 'تحديث مناسيب الارتفاع من الأقمار الصناعية (SRTM)' : 'Refresh SRTM Elevations'}
              className="p-2 text-slate-300 hover:text-sky-400 hover:bg-slate-800 rounded-xl transition-all disabled:opacity-40 border border-transparent hover:border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${isSamplingElevations ? 'animate-spin text-sky-400' : ''}`} />
            </button>

            {/* Window Mode Toggles (Studio / Fullscreen) */}
            <button
              type="button"
              onClick={() => setWindowMode(windowMode === 'fullscreen' ? 'studio' : 'fullscreen')}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-700"
              title={windowMode === 'fullscreen' ? (isAr ? 'تصغير الحجم' : 'Normal Size') : isAr ? 'ملء الشاشة' : 'Fullscreen'}
            >
              {windowMode === 'fullscreen' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={closeElevationProfile}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-700"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 flex flex-col">
          {/* Top Bar: Source Mode Selector & Path Settings & Sorting */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-2 sm:p-2.5 rounded-2xl border border-slate-800 shrink-0">
            {/* Mode Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none max-w-full">
              <button
                type="button"
                onClick={() => {
                  setActiveTabMode('sequence');
                  setElevationProfileSourceMode('sequence');
                  setInterpolatedSamples([]);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTabMode === 'sequence'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{isAr ? 'النقاط بالتسلسل' : 'Sequential Points'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTabMode('folder');
                  setElevationProfileSourceMode('folder');
                  setInterpolatedSamples([]);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTabMode === 'folder'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>{isAr ? 'حسب المجلد' : 'By Folder'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTabMode('start_end');
                  setElevationProfileSourceMode('start_end');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTabMode === 'start_end'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>{isAr ? 'بين نقطتين (بداية ونهاية)' : 'Start ➔ End'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTabMode('selection');
                  setElevationProfileSourceMode('quick_select');
                  setInterpolatedSamples([]);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTabMode === 'selection'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <MousePointer2 className="w-3.5 h-3.5" />
                <span>
                  {isAr ? 'تحديد سريع' : 'Selected'} ({selectedPointIdsForAction.length})
                </span>
              </button>

              {lines.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTabMode('line');
                    setElevationProfileSourceMode('line');
                    setInterpolatedSamples([]);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                    activeTabMode === 'line'
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Route className="w-3.5 h-3.5" />
                  <span>{isAr ? 'خط مرسوم' : 'Drawn Line'}</span>
                </button>
              )}
            </div>

            {/* Sorting & View Toggles */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Point Name Sort Selector */}
              <div className="flex items-center bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 gap-1.5 text-xs">
                <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3" />
                  {isAr ? 'الترتيب:' : 'Sort:'}
                </span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="bg-transparent text-slate-200 text-xs font-bold focus:outline-none cursor-pointer"
                >
                  <option value="name_asc" className="bg-slate-900">
                    {isAr ? '🔢 حسب اسم النقطة تصاعدياً (1 ➔ 2 ➔ 140 ➔ 150)' : 'By Point Name (Ascending)'}
                  </option>
                  <option value="name_desc" className="bg-slate-900">
                    {isAr ? '🔢 حسب اسم النقطة تنازلياً (150 ➔ 140 ➔ 1)' : 'By Point Name (Descending)'}
                  </option>
                  <option value="original" className="bg-slate-900">
                    {isAr ? '🕒 حسب ترتيب الإضافة الأصلي' : 'Original Import Order'}
                  </option>
                </select>
              </div>

              {/* View Switcher: Chart vs Table vs Stats */}
              <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveViewTab('chart')}
                  className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    activeViewTab === 'chart' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={isAr ? 'عرض الرسم البياني' : 'Chart View'}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">{isAr ? 'المخطط البياني' : 'Chart'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveViewTab('table')}
                  className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    activeViewTab === 'table' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={isAr ? 'عرض جدول مناسيب النقاط' : 'Points Table'}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">{isAr ? 'جدول النقاط' : 'Table'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveViewTab('stats')}
                  className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    activeViewTab === 'stats' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={isAr ? 'التحليل التضاريسي' : 'Analytics'}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">{isAr ? 'التحليل الإحصائي' : 'Analytics'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Conditional Sub-controls for Selected Modes */}
          {activeTabMode === 'folder' && (
            <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs">
              <span className="text-slate-300 font-bold shrink-0">
                {isAr ? '📁 اختر مجلد النقاط لتحليله:' : 'Select folder:'}
              </span>
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-sky-500 outline-none flex-1"
              >
                <option value="all">{isAr ? '🌟 جميع نقاط الرفع المساحي' : 'All Points'}</option>
                <option value="uncategorized">{isAr ? '📂 غير مصنف (عام)' : 'Uncategorized'}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    📁 {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTabMode === 'line' && (
            <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs">
              <span className="text-slate-300 font-bold shrink-0">
                {isAr ? '📍 اختر الخط المساحي المرسوم:' : 'Select line:'}
              </span>
              <select
                value={selectedLineId}
                onChange={(e) => setSelectedLineId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-sky-500 outline-none flex-1"
              >
                {lines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name || (isAr ? 'خط بدون اسم' : 'Unnamed Line')} ({l.points.length} {isAr ? 'نقطة' : 'pts'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTabMode === 'start_end' && (
            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    {isAr ? '1. نقطة البداية (Start Point):' : '1. Start Point'}
                  </label>
                  <select
                    value={startPointId}
                    onChange={(e) => setStartPointId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-sky-500 outline-none"
                  >
                    {[...points]
                      .sort((a, b) => naturalCompare(a.name, b.name))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.elevation ? `${p.elevation}m` : '---'})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    {isAr ? '2. نقطة النهاية (End Point):' : '2. End Point'}
                  </label>
                  <select
                    value={endPointId}
                    onChange={(e) => setEndPointId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-sky-500 outline-none"
                  >
                    {[...points]
                      .sort((a, b) => naturalCompare(a.name, b.name))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.elevation ? `${p.elevation}m` : '---'})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 gap-2 flex-wrap bg-slate-950/60 p-2 rounded-xl border border-slate-850">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-xs font-semibold">{isAr ? 'كثافة أخذ العينات:' : 'Sampling Density:'}</span>
                  <select
                    value={sampleResolution}
                    onChange={(e) => setSampleResolution(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none"
                  >
                    <option value={15}>{isAr ? '15 عينة تضاريسية' : '15 samples'}</option>
                    <option value={30}>{isAr ? '30 عينة تضاريسية (موصى به)' : '30 samples (Recommended)'}</option>
                    <option value={60}>{isAr ? '60 عينة عالية الدقة' : '60 high-res samples'}</option>
                    <option value={100}>{isAr ? '100 عينة دقيقة جداً' : '100 ultra-precision samples'}</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateStartEndSamples}
                  disabled={isSamplingElevations || !startPointId || !endPointId}
                  className="px-4 py-2 bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2 text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSamplingElevations ? 'animate-spin' : ''}`} />
                  <span>
                    {isSamplingElevations
                      ? isAr
                        ? 'جاري سحب المناسيب الرقمية من القمر الصناعي...'
                        : 'Fetching digital terrain data...'
                      : isAr
                      ? 'رسم وتحليل مسار التضاريس بين النقطتين ⛰️'
                      : 'Generate Elevation Profile'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Key Technical Metrics HUD */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 shrink-0">
            {/* Total Distance */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between hover:border-slate-700 transition-all">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                {isAr ? 'طول المسار الكلي' : 'Total Distance'}
              </span>
              <div className="mt-1">
                <span className="text-base sm:text-lg font-extrabold text-slate-100 font-mono">
                  {profileSummary.formattedTotalDistance}
                </span>
                <span className="text-[10px] text-slate-500 block font-mono">
                  ({profileSummary.totalDistanceMeters.toFixed(1)} m)
                </span>
              </div>
            </div>

            {/* Max Elevation */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between hover:border-slate-700 transition-all">
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {isAr ? 'أعلى منسوب' : 'Max Elevation'}
              </span>
              <div className="mt-1">
                <span className="text-base sm:text-lg font-extrabold text-emerald-300 font-mono">
                  {profileSummary.maxElev} m
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {isAr ? 'أعلى نقطة بالمسار' : 'Peak Elevation'}
                </span>
              </div>
            </div>

            {/* Min Elevation */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between hover:border-slate-700 transition-all">
              <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-bold flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                {isAr ? 'أدنى منسوب' : 'Min Elevation'}
              </span>
              <div className="mt-1">
                <span className="text-base sm:text-lg font-extrabold text-indigo-300 font-mono">
                  {profileSummary.minElev} m
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {isAr ? 'أخفض نقطة بالمسار' : 'Lowest Elevation'}
                </span>
              </div>
            </div>

            {/* Elevation Difference (Delta H) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between hover:border-slate-700 transition-all">
              <span className="text-[10px] text-amber-400 uppercase tracking-wider font-bold">
                {isAr ? 'فرق المنسوب (ΔH)' : 'Delta Elevation'}
              </span>
              <div className="mt-1">
                <span className="text-base sm:text-lg font-extrabold text-amber-300 font-mono">
                  {profileSummary.elevRange} m
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {isAr ? 'المدى الرأسي' : 'Vertical Range'}
                </span>
              </div>
            </div>

            {/* Elevation Gain */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between hover:border-slate-700 transition-all">
              <span className="text-[10px] text-sky-400 uppercase tracking-wider font-bold">
                {isAr ? 'إجمالي الصعود (+)' : 'Elev Gain (+)'}
              </span>
              <div className="mt-1">
                <span className="text-base sm:text-lg font-extrabold text-sky-300 font-mono">
                  +{profileSummary.elevationGain} m
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {isAr ? 'صعود تراكمي' : 'Cumulative Climb'}
                </span>
              </div>
            </div>

            {/* Elevation Loss */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between hover:border-slate-700 transition-all">
              <span className="text-[10px] text-rose-400 uppercase tracking-wider font-bold">
                {isAr ? 'إجمالي الهبوط (-)' : 'Elev Loss (-)'}
              </span>
              <div className="mt-1">
                <span className="text-base sm:text-lg font-extrabold text-rose-300 font-mono">
                  -{profileSummary.elevationLoss} m
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {isAr ? 'انحدار تراكمي' : 'Cumulative Descent'}
                </span>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT VIEWS */}
          {activeViewTab === 'chart' && (
            <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col relative min-h-[300px]">
              {/* Chart Toolbar Controls */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-sky-400" />
                    {isAr ? 'المخطط الطولي لمناسيب النقاط' : 'Point Elevation Profile Chart'}
                  </span>
                  {activeHoverPoint && (
                    <div className="bg-slate-950 border border-sky-500/50 px-3 py-1 rounded-xl flex items-center gap-2 text-xs backdrop-blur-md animate-in fade-in">
                      <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
                      <span className="font-extrabold text-slate-100">{activeHoverPoint.name}</span>
                      <span className="font-extrabold text-sky-300 font-mono">{activeHoverPoint.elevation} m</span>
                      <span className="text-[10px] text-slate-400 font-mono">({activeHoverPoint.formattedDistance})</span>
                      {activeHoverPoint.slopePercent !== undefined && activeHoverPoint.slopePercent !== 0 && (
                        <span
                          className={`text-[10px] font-mono font-bold ${
                            activeHoverPoint.slopePercent > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {activeHoverPoint.slopePercent > 0
                            ? `+${activeHoverPoint.slopePercent}%`
                            : `${activeHoverPoint.slopePercent}%`}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Toggle Ref Lines */}
                  <button
                    type="button"
                    onClick={() => setShowRefLines(!showRefLines)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                      showRefLines ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {isAr ? 'خطوط المراجع (Min/Max)' : 'Min/Max Lines'}
                  </button>

                  {/* Curve Type */}
                  <button
                    type="button"
                    onClick={() => setCurveType(curveType === 'monotone' ? 'linear' : 'monotone')}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-950 text-slate-300 border border-slate-800 hover:text-white transition-all"
                  >
                    {curveType === 'monotone' ? (isAr ? 'منحنى ناعم' : 'Smooth Curve') : isAr ? 'خطوط مستقيمة' : 'Straight Lines'}
                  </button>
                </div>
              </div>

              {/* Interactive Recharts Canvas */}
              {profileSummary.points.length < 2 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
                  <Mountain className="w-12 h-12 text-slate-600 stroke-1" />
                  <p className="text-sm font-semibold text-slate-300">
                    {isAr ? 'لا توجد نقاط كافية لرسم البروفايل' : 'Insufficient points to generate profile.'}
                  </p>
                  <p className="text-xs max-w-md text-slate-500">
                    {isAr
                      ? 'يرجى إضافة نقطتين على الأقل على الخريطة لعرض المقطع التضاريسي المباشر.'
                      : 'Add at least 2 points to render the terrain profile.'}
                  </p>
                </div>
              ) : (
                <div className="flex-1 w-full min-h-[260px] sm:min-h-[320px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={profileSummary.points}
                      margin={{ top: 20, right: 30, left: -10, bottom: 20 }}
                      onMouseMove={(e: any) => {
                        if (e && e.activePayload && e.activePayload.length > 0) {
                          const pt = e.activePayload[0].payload as ProfileSamplePoint;
                          setActiveHoverPoint(pt);
                          setElevationProfileHoverCoord({
                            lat: pt.lat,
                            lng: pt.lng,
                            elevation: pt.elevation,
                            distanceMeters: pt.distanceMeters,
                          });
                        }
                      }}
                      onMouseLeave={() => {
                        setActiveHoverPoint(null);
                        setElevationProfileHoverCoord(null);
                      }}
                    >
                      <defs>
                        <linearGradient id="profileElevGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0284c7" stopOpacity={0.8} />
                          <stop offset="50%" stopColor="#38bdf8" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#0369a1" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.8} />

                      {/* X Axis: Modern, clean, evenly spaced distance scale in Kilometers/Meters */}
                      <XAxis
                        dataKey="distanceMeters"
                        type="number"
                        domain={[0, profileSummary.totalDistanceMeters || 'auto']}
                        stroke="#94a3b8"
                        fontSize={10}
                        fontWeight="bold"
                        tickLine={false}
                        axisLine={{ stroke: '#334155' }}
                        tickFormatter={(val: number) => {
                          if (profileSummary.totalDistanceMeters >= 1000) {
                            const km = val / 1000;
                            return `${Number(km.toFixed(1))} ${isAr ? 'كم' : 'km'}`;
                          }
                          return `${Math.round(val)} ${isAr ? 'م' : 'm'}`;
                        }}
                      />

                      <YAxis
                        dataKey="elevation"
                        domain={['dataMin - 2', 'dataMax + 4']}
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#334155' }}
                        tickFormatter={(v) => `${v}m`}
                      />

                      {showRefLines && (
                        <>
                          <ReferenceLine
                            y={profileSummary.maxElev}
                            stroke="#10b981"
                            strokeDasharray="4 4"
                            label={{
                              value: `Max: ${profileSummary.maxElev}m`,
                              position: isAr ? 'left' : 'right',
                              fill: '#10b981',
                              fontSize: 10,
                              fontWeight: 'bold',
                            }}
                          />
                          <ReferenceLine
                            y={profileSummary.minElev}
                            stroke="#6366f1"
                            strokeDasharray="4 4"
                            label={{
                              value: `Min: ${profileSummary.minElev}m`,
                              position: isAr ? 'left' : 'right',
                              fill: '#6366f1',
                              fontSize: 10,
                              fontWeight: 'bold',
                            }}
                          />
                        </>
                      )}

                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload as ProfileSamplePoint;
                            return (
                              <div className="bg-slate-950/95 border border-slate-700 p-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-sans space-y-1.5 min-w-[200px]">
                                <div className="font-extrabold text-slate-100 border-b border-slate-800 pb-1.5 flex items-center justify-between gap-3">
                                  <span className="text-sky-300 font-bold">{data.name}</span>
                                  <span className="font-mono text-sky-400 font-extrabold text-sm">
                                    {data.elevation} m
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center justify-between gap-4 font-mono">
                                  <span>{isAr ? 'المسافة التراكمية:' : 'Cumulative Dist:'}</span>
                                  <span className="text-slate-200 font-bold">{data.formattedDistance}</span>
                                </div>
                                {data.slopePercent !== undefined && data.slopePercent !== 0 && (
                                  <div className="text-[11px] text-slate-400 flex items-center justify-between gap-4 font-mono">
                                    <span>{isAr ? 'نسبة الانحدار:' : 'Slope Grade:'}</span>
                                    <span
                                      className={`font-bold ${
                                        data.slopePercent > 0 ? 'text-emerald-400' : 'text-rose-400'
                                      }`}
                                    >
                                      {data.slopePercent > 0 ? `+${data.slopePercent}%` : `${data.slopePercent}%`}
                                    </span>
                                  </div>
                                )}
                                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80 font-mono">
                                  Lat: {data.lat.toFixed(6)}, Lng: {data.lng.toFixed(6)}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />

                      <Area
                        type={curveType}
                        dataKey="elevation"
                        stroke="#0284c7"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#profileElevGrad)"
                        activeDot={{
                          r: 7,
                          fill: '#38bdf8',
                          stroke: '#0369a1',
                          strokeWidth: 3,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* TABLE VIEW: Points Elevation Sheet */}
          {activeViewTab === 'table' && (
            <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col space-y-3 min-h-[300px]">
              {/* Search & Export Bar */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-1 max-w-sm relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 rtl:left-auto ltr:left-3 ltr:right-auto" />
                  <input
                    type="text"
                    value={tableSearchTerm}
                    onChange={(e) => setTableSearchTerm(e.target.value)}
                    placeholder={isAr ? 'بحث في أسماء النقاط والمناسيب...' : 'Search points by name or elevation...'}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-8 py-1.5 text-xs focus:ring-1 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">
                    {filteredPointList.length} / {enrichedPointList.length} {isAr ? 'نقطة' : 'points'}
                  </span>
                  <button
                    type="button"
                    onClick={handleExportProfileToExcel}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تصدير Excel' : 'Export Excel'}</span>
                  </button>
                </div>
              </div>

              {/* Table Container */}
              <div className="flex-1 overflow-x-auto overflow-y-auto border border-slate-800 rounded-2xl max-h-[420px]">
                <table className="w-full text-xs text-left rtl:text-right text-slate-300">
                  <thead className="text-[11px] uppercase bg-slate-950 text-slate-400 sticky top-0 z-10 border-b border-slate-800">
                    <tr>
                      <th className="px-3 py-2.5 font-bold">#</th>
                      <th className="px-3 py-2.5 font-bold text-sky-400">{isAr ? 'اسم النقطة' : 'Point Name'}</th>
                      <th className="px-3 py-2.5 font-bold text-emerald-400">{isAr ? 'المنسوب (Z)' : 'Elevation'}</th>
                      <th className="px-3 py-2.5 font-bold">{isAr ? 'المسافة التراكمية' : 'Cumul. Dist'}</th>
                      <th className="px-3 py-2.5 font-bold">{isAr ? 'المسافة الجزئية' : 'Leg Dist'}</th>
                      <th className="px-3 py-2.5 font-bold">{isAr ? 'الانحدار (%)' : 'Slope'}</th>
                      <th className="px-3 py-2.5 font-bold font-mono">{isAr ? 'UTM X (شرقيات)' : 'Easting'}</th>
                      <th className="px-3 py-2.5 font-bold font-mono">{isAr ? 'UTM Y (شماليات)' : 'Northing'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {filteredPointList.map((pt) => (
                      <tr
                        key={pt.seqIndex}
                        className="hover:bg-slate-850/80 transition-colors"
                        onMouseEnter={() => {
                          setElevationProfileHoverCoord({
                            lat: pt.lat,
                            lng: pt.lng,
                            elevation: pt.elevation,
                            distanceMeters: pt.distanceMeters,
                          });
                        }}
                      >
                        <td className="px-3 py-2 text-slate-500 font-bold">{pt.seqIndex}</td>
                        <td className="px-3 py-2 text-sky-300 font-sans font-bold text-sm">{pt.name}</td>
                        <td className="px-3 py-2 font-bold text-emerald-400">{pt.elevation.toFixed(1)} m</td>
                        <td className="px-3 py-2 text-slate-300">{pt.formattedDistance}</td>
                        <td className="px-3 py-2 text-slate-400">{pt.formattedLegDist}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`font-bold ${
                              (pt.slopePercent || 0) > 0
                                ? 'text-emerald-400'
                                : (pt.slopePercent || 0) < 0
                                ? 'text-rose-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {(pt.slopePercent || 0) > 0 ? `+${pt.slopePercent}%` : `${pt.slopePercent || 0}%`}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-400">{pt.utmEasting.toFixed(2)}</td>
                        <td className="px-3 py-2 text-slate-400">{pt.utmNorthing.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ANALYTICS VIEW */}
          {activeViewTab === 'stats' && (
            <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 min-h-[300px]">
              <h4 className="font-extrabold text-sm text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400" />
                <span>{isAr ? 'التحليل التضاريسي الإحصائي وتوزيع الانحدارات' : 'Terrain Slope Distribution & Analytics'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Flat Slopes (<3%) */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">
                      {isAr ? 'أراضي منبسطة (< 3%)' : 'Flat Terrain (<3%)'}
                    </span>
                    <span className="font-mono font-bold text-emerald-300">{terrainStats.flatPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${terrainStats.flatPercent}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {isAr ? 'مسارات سهلة ومستوية مناسبة للأعمال الإنشائية والطرق الرئيسية' : 'Optimal for standard roads and structures'}
                  </p>
                </div>

                {/* Moderate Slopes (3% - 10%) */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">
                      {isAr ? 'انحدار متوسط (3% - 10%)' : 'Moderate (3-10%)'}
                    </span>
                    <span className="font-mono font-bold text-amber-300">{terrainStats.moderatePercent}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${terrainStats.moderatePercent}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {isAr ? 'تضاريس متموجة معتدلة تتطلب ميول تصميمية مناسبة' : 'Rolling terrain requiring standard drainage/grades'}
                  </p>
                </div>

                {/* Steep Slopes (>10%) */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400">
                      {isAr ? 'انحدار شديد (> 10%)' : 'Steep Terrain (>10%)'}
                    </span>
                    <span className="font-mono font-bold text-rose-300">{terrainStats.steepPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${terrainStats.steepPercent}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {isAr ? 'منحدرات جبلية أو حادة تتطلب حمايات وقطع وردم مدروس' : 'Steep grades requiring cut/fill engineering analysis'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850">
                  <span className="text-[10px] text-slate-400 font-bold block">{isAr ? 'متوسط نسبة الميل العام' : 'Average Slope'}</span>
                  <span className="text-base font-extrabold text-slate-100 font-mono mt-1 block">
                    {terrainStats.avgSlope}%
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850">
                  <span className="text-[10px] text-slate-400 font-bold block">{isAr ? 'متوسط المنسوب (Mean Z)' : 'Mean Elevation'}</span>
                  <span className="text-base font-extrabold text-sky-400 font-mono mt-1 block">
                    {terrainStats.meanElevation} m
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850">
                  <span className="text-[10px] text-slate-400 font-bold block">{isAr ? 'أقصى صعود مساحي' : 'Max Climb Grade'}</span>
                  <span className="text-base font-extrabold text-emerald-400 font-mono mt-1 block">
                    +{terrainStats.maxClimbSlope}%
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850">
                  <span className="text-[10px] text-slate-400 font-bold block">{isAr ? 'أقصى هبوط مساحي' : 'Max Descent Grade'}</span>
                  <span className="text-base font-extrabold text-rose-400 font-mono mt-1 block">
                    -{terrainStats.maxDescentSlope}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. PRINTABLE REPORT MODAL & DEDICATED PRINT VIEW */}
      {showPrintPreview && (
        <div
          dir={isAr ? 'rtl' : 'ltr'}
          className="fixed inset-0 z-[1000] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
        >
          <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Print Modal Header (Hidden on actual physical print) */}
            <div className="flex items-center justify-between px-5 py-4 bg-slate-850 border-b border-slate-700 shrink-0 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-100 text-sm sm:text-base">
                    {isAr ? 'معاينة وطباعة تقرير مناسيب النقاط والمقطع التضاريسي' : 'Point Elevation & Terrain Profile Print Report'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isAr ? 'تقرير مساحي رسمي مرتب حسب تسلسل أسماء النقاط' : 'Survey report ordered strictly by point name'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerPrint}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2 active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isAr ? 'طباعة التقرير الآن (Print / PDF)' : 'Print / Export PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintPreview(false)}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Customization Bar & Section Selectors (Hidden on actual physical print) */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 space-y-3.5 print:hidden text-xs">
              {/* Section Toggle Chips */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-sky-400" />
                    <span>{isAr ? 'تخصيص أقسام التقرير المطبوع (تفعيل / إلغاء حر):' : 'Customize Print Sections (Toggle On/Off):'}</span>
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {isAr ? 'حدد العناصر المراد تضمينها في الطباعة أو تصدير PDF' : 'Select items to include in print/PDF'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Toggle Header */}
                  <button
                    type="button"
                    onClick={() => setIncludeHeader(!includeHeader)}
                    className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 border transition-all text-xs active:scale-95 ${
                      includeHeader
                        ? 'bg-sky-600/20 text-sky-300 border-sky-500/50 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    {includeHeader ? <CheckSquare className="w-3.5 h-3.5 text-sky-400" /> : <Square className="w-3.5 h-3.5" />}
                    <span>{isAr ? 'الترويسة ومعلومات المشروع' : 'Header & Metadata'}</span>
                  </button>

                  {/* Toggle Stats */}
                  <button
                    type="button"
                    onClick={() => setIncludeStats(!includeStats)}
                    className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 border transition-all text-xs active:scale-95 ${
                      includeStats
                        ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    {includeStats ? <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> : <Square className="w-3.5 h-3.5" />}
                    <span>{isAr ? 'إحصائيات المسافة والمناسيب' : 'Summary Distance & Elev Badges'}</span>
                  </button>

                  {/* Toggle Chart */}
                  <button
                    type="button"
                    onClick={() => setIncludeChart(!includeChart)}
                    className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 border transition-all text-xs active:scale-95 ${
                      includeChart
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    {includeChart ? <CheckSquare className="w-3.5 h-3.5 text-indigo-400" /> : <Square className="w-3.5 h-3.5" />}
                    <span>{isAr ? 'المخطط التضاريسي الطولي' : 'Elevation Profile Chart'}</span>
                  </button>

                  {/* Toggle Table */}
                  <button
                    type="button"
                    onClick={() => setIncludeTable(!includeTable)}
                    className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 border transition-all text-xs active:scale-95 ${
                      includeTable
                        ? 'bg-amber-600/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    {includeTable ? <CheckSquare className="w-3.5 h-3.5 text-amber-400" /> : <Square className="w-3.5 h-3.5" />}
                    <span>{isAr ? 'جدول مناسيب وإحداثيات النقاط' : 'Survey Points Sheet Table'}</span>
                  </button>

                  {/* Toggle Signatures */}
                  <button
                    type="button"
                    onClick={() => setIncludeSignatures(!includeSignatures)}
                    className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 border transition-all text-xs active:scale-95 ${
                      includeSignatures
                        ? 'bg-purple-600/20 text-purple-300 border-purple-500/50 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    {includeSignatures ? <CheckSquare className="w-3.5 h-3.5 text-purple-400" /> : <Square className="w-3.5 h-3.5" />}
                    <span>{isAr ? 'التواقيع والاعتماد والختم' : 'Signatures & Approvals'}</span>
                  </button>

                  {/* Toggle Notes */}
                  <button
                    type="button"
                    onClick={() => setIncludeNotes(!includeNotes)}
                    className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 border transition-all text-xs active:scale-95 ${
                      includeNotes
                        ? 'bg-teal-600/20 text-teal-300 border-teal-500/50 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    {includeNotes ? <CheckSquare className="w-3.5 h-3.5 text-teal-400" /> : <Square className="w-3.5 h-3.5" />}
                    <span>{isAr ? 'ملاحظات إضافية' : 'Surveyor Notes'}</span>
                  </button>
                </div>
              </div>

              {/* Editable Information Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-850">
                {includeHeader && (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 mb-1 block">
                        {isAr ? 'اسم المشروع:' : 'Project Name:'}
                      </label>
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-750 text-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 mb-1 block">
                        {isAr ? 'عنوان التقرير:' : 'Report Title:'}
                      </label>
                      <input
                        type="text"
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-750 text-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 mb-1 block">
                        {isAr ? 'المساح المسؤول:' : 'Surveyor / Engineer:'}
                      </label>
                      <input
                        type="text"
                        value={surveyorName}
                        onChange={(e) => setSurveyorName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-750 text-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 mb-1 block">
                        {isAr ? 'التاريخ المطبوع:' : 'Report Date:'}
                      </label>
                      <input
                        type="text"
                        value={reportDate}
                        onChange={(e) => setReportDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-750 text-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>
                  </>
                )}

                {includeSignatures && (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 mb-1 block">
                        {isAr ? 'تدقيق ومراجعة:' : 'Reviewed By:'}
                      </label>
                      <input
                        type="text"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-750 text-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 mb-1 block">
                        {isAr ? 'الاعتماد والختم الرسمي:' : 'Approval Authority:'}
                      </label>
                      <input
                        type="text"
                        value={approverName}
                        onChange={(e) => setApproverName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-750 text-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>
                  </>
                )}

                {includeTable && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 mb-1 block">
                      {isAr ? 'عدد النقاط بالجدول:' : 'Table Points Count:'}
                    </label>
                    <select
                      value={printTableLimit}
                      onChange={(e) => setPrintTableLimit(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-750 text-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-sky-500 transition-colors"
                    >
                      <option value={30}>{isAr ? 'أول 30 نقطة' : 'First 30 Points'}</option>
                      <option value={50}>{isAr ? 'أول 50 نقطة' : 'First 50 Points'}</option>
                      <option value={100}>{isAr ? 'أول 100 نقطة' : 'First 100 Points'}</option>
                      <option value={10000}>{isAr ? 'كامل النقاط' : 'All Points'}</option>
                    </select>
                  </div>
                )}

                {includeNotes && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="text-[10px] font-bold text-slate-400 mb-1 block">
                      {isAr ? 'ملاحظات المساح / توجيهات المشروع:' : 'Surveyor / Project Notes:'}
                    </label>
                    <input
                      type="text"
                      value={customNotes}
                      placeholder={isAr ? 'أدخل أي ملاحظات فنية يراد طباعتها بالتقرير...' : 'Enter any technical notes to print...'}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-750 text-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ACTUAL PRINTABLE REPORT SHEET */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950 print:bg-white print:p-0 print:m-0">
              <div
                id="elevation-profile-print-area"
                className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl max-w-4xl mx-auto space-y-6 print:shadow-none print:max-w-none print:p-2 print:border-none print:rounded-none"
              >
                {/* 1. Official Engineering Document Header (Optional & Toggleable) */}
                {includeHeader && (
                  <div className="border-b-2 border-slate-800 pb-4 flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {reportTitle}
                      </h1>
                      {projectName && <p className="text-sm font-bold text-slate-700 mt-0.5">{projectName}</p>}
                      <p className="text-xs text-slate-500 mt-1">{appSubtitle}</p>
                    </div>

                    <div className="text-right rtl:text-left text-xs text-slate-600 space-y-0.5 shrink-0">
                      <div className="font-mono font-bold text-slate-800">{reportDate}</div>
                      {surveyorName && (
                        <div>
                          {isAr ? 'المساح المسؤول:' : 'Surveyor:'} <span className="font-bold text-slate-800">{surveyorName}</span>
                        </div>
                      )}
                      <div>
                        {isAr ? 'عدد النقاط:' : 'Points Count:'} <span className="font-mono font-bold">{enrichedPointList.length}</span>
                      </div>
                      <div>
                        {isAr ? 'المسافة الكلية:' : 'Total Distance:'} <span className="font-mono font-bold">{profileSummary.formattedTotalDistance}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Executive Summary Badges Grid (Optional & Toggleable) */}
                {includeStats && (
                  <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">{isAr ? 'المسافة الكلية' : 'Total Distance'}</span>
                      <span className="text-sm sm:text-base font-black text-slate-900 font-mono">{profileSummary.formattedTotalDistance}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">{isAr ? 'أعلى منسوب' : 'Max Elevation'}</span>
                      <span className="text-sm sm:text-base font-black text-emerald-700 font-mono">{profileSummary.maxElev} m</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-700 block">{isAr ? 'أدنى منسوب' : 'Min Elevation'}</span>
                      <span className="text-sm sm:text-base font-black text-indigo-700 font-mono">{profileSummary.minElev} m</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-700 block">{isAr ? 'فرق المنسوب (ΔH)' : 'Elevation Delta'}</span>
                      <span className="text-sm sm:text-base font-black text-amber-700 font-mono">{profileSummary.elevRange} m</span>
                    </div>
                  </div>
                )}

                {/* 3. Vector SVG Profile Chart (Optional & Primary) */}
                {includeChart && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {isAr ? 'مخطط المقطع التضاريسي الطولي للنقاط' : 'Longitudinal Elevation Profile'}
                    </h3>
                    <div className="h-64 sm:h-72 w-full border border-slate-300 rounded-xl p-2 bg-slate-50">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={profileSummary.points} margin={{ top: 15, right: 25, left: -10, bottom: 20 }}>
                          <defs>
                            <linearGradient id="printElevGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0284c7" stopOpacity={0.6} />
                              <stop offset="95%" stopColor="#0284c7" stopOpacity={0.08} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="2 2" stroke="#cbd5e1" vertical={false} />
                          <XAxis
                            dataKey="distanceMeters"
                            type="number"
                            domain={[0, profileSummary.totalDistanceMeters || 'auto']}
                            stroke="#475569"
                            fontSize={9}
                            fontWeight="bold"
                            tickLine={false}
                            axisLine={{ stroke: '#94a3b8' }}
                            tickFormatter={(val: number) => {
                              if (profileSummary.totalDistanceMeters >= 1000) {
                                const km = val / 1000;
                                return `${Number(km.toFixed(1))} ${isAr ? 'كم' : 'km'}`;
                              }
                              return `${Math.round(val)} ${isAr ? 'م' : 'm'}`;
                            }}
                          />
                          <YAxis
                            dataKey="elevation"
                            domain={['dataMin - 2', 'dataMax + 4']}
                            stroke="#475569"
                            fontSize={9}
                            fontWeight="bold"
                            tickLine={false}
                            tickFormatter={(v) => `${v}m`}
                          />
                          <ReferenceLine
                            y={profileSummary.maxElev}
                            stroke="#059669"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            label={{
                              value: `Max: ${profileSummary.maxElev}m`,
                              position: isAr ? 'left' : 'right',
                              fill: '#059669',
                              fontSize: 10,
                              fontWeight: 'bold',
                            }}
                          />
                          <ReferenceLine
                            y={profileSummary.minElev}
                            stroke="#4f46e5"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            label={{
                              value: `Min: ${profileSummary.minElev}m`,
                              position: isAr ? 'left' : 'right',
                              fill: '#4f46e5',
                              fontSize: 10,
                              fontWeight: 'bold',
                            }}
                          />
                          <Area
                            type={curveType}
                            dataKey="elevation"
                            stroke="#0284c7"
                            strokeWidth={2.5}
                            fill="url(#printElevGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* 4. Notes Block (Optional) */}
                {includeNotes && customNotes.trim() && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-amber-900 block">{isAr ? 'ملاحظات المساح والفريق الفني:' : 'Technical Notes:'}</span>
                    <p className="text-slate-800 leading-relaxed font-sans">{customNotes}</p>
                  </div>
                )}

                {/* 5. Official Survey Points Table (Optional & Toggleable) */}
                {includeTable && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {isAr ? 'جدول مناسيب وإحداثيات النقاط المساحية (Survey Points Sheet)' : 'Survey Points & Elevations Sheet'}
                    </h3>
                    <div className="border border-slate-300 rounded-xl overflow-hidden">
                      <table className="w-full text-[10px] text-left rtl:text-right text-slate-800">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 uppercase">
                          <tr>
                            <th className="px-2.5 py-1.5">#</th>
                            <th className="px-2.5 py-1.5">{isAr ? 'اسم النقطة' : 'Point Name'}</th>
                            <th className="px-2.5 py-1.5">{isAr ? 'المنسوب (Z)' : 'Elev (m)'}</th>
                            <th className="px-2.5 py-1.5">{isAr ? 'المسافة التراكمية' : 'Cumul. Dist'}</th>
                            <th className="px-2.5 py-1.5">{isAr ? 'المسافة الجزئية' : 'Leg Dist'}</th>
                            <th className="px-2.5 py-1.5">{isAr ? 'الميل (%)' : 'Slope %'}</th>
                            <th className="px-2.5 py-1.5 font-mono">{isAr ? 'شرقيات (E)' : 'Easting'}</th>
                            <th className="px-2.5 py-1.5 font-mono">{isAr ? 'شماليات (N)' : 'Northing'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-mono">
                          {enrichedPointList.slice(0, printTableLimit).map((pt) => (
                            <tr key={pt.seqIndex}>
                              <td className="px-2.5 py-1 text-slate-500 font-bold">{pt.seqIndex}</td>
                              <td className="px-2.5 py-1 font-sans font-bold text-slate-900 text-xs">{pt.name}</td>
                              <td className="px-2.5 py-1 font-bold text-slate-900">{pt.elevation.toFixed(1)} m</td>
                              <td className="px-2.5 py-1">{pt.formattedDistance}</td>
                              <td className="px-2.5 py-1 text-slate-600">{pt.formattedLegDist}</td>
                              <td className="px-2.5 py-1">
                                {(pt.slopePercent || 0) > 0 ? `+${pt.slopePercent}%` : `${pt.slopePercent || 0}%`}
                              </td>
                              <td className="px-2.5 py-1 text-slate-600">{pt.utmEasting.toFixed(2)}</td>
                              <td className="px-2.5 py-1 text-slate-600">{pt.utmNorthing.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {enrichedPointList.length > printTableLimit && (
                      <p className="text-[9px] text-slate-500 italic">
                        {isAr
                          ? `* تم عرض أول ${printTableLimit} نقطة في التقرير المطبوع. لإجمالي الـ ${enrichedPointList.length} نقطة، يرجى اختيار "كامل النقاط" أو التصدير لملف Excel.`
                          : `* Showing first ${printTableLimit} points. For all ${enrichedPointList.length} points, choose "All Points" or export to Excel.`}
                      </p>
                    )}
                  </div>
                )}

                {/* 6. Signatures / Approval Block (Optional & Toggleable) */}
                {includeSignatures && (
                  <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-xs">
                    <div>
                      <span className="font-bold text-slate-700 block mb-8">{isAr ? 'إعداد المساح المسؤول' : 'Prepared By Surveyor'}</span>
                      <span className="text-[11px] text-slate-500 border-t border-slate-400 pt-1 block">{surveyorName || (isAr ? 'مهندس المساحة' : 'Surveyor')}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 block mb-8">{isAr ? 'تدقيق ومراجعة' : 'Reviewed By'}</span>
                      <span className="text-[11px] text-slate-500 border-t border-slate-400 pt-1 block">{reviewerName}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 block mb-8">{isAr ? 'الاعتماد والختم الرسمي' : 'Official Approval'}</span>
                      <span className="text-[11px] text-slate-500 border-t border-slate-400 pt-1 block">{approverName}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
