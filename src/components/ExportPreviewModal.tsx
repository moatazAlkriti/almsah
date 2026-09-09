import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getTranslation } from '../utils/translations';
import { exportFullProjectToExcel } from '../utils/excel';
import { exportToGeoJSON, exportFullBackup, triggerFileDownload } from '../utils/exportImport';
import {
  exportProjectToScript,
  exportProjectToDxf,
  filterPointsByScope,
  defaultDxfOptions,
  DxfExportOptions,
} from '../utils/dxfExport';
import {
  X,
  FileSpreadsheet,
  Globe,
  Save,
  Download,
  DraftingCompass,
  Layers,
  Check,
  Folder,
  FolderOpen,
  Terminal,
} from 'lucide-react';

export const ExportPreviewModal: React.FC = () => {
  const activeModal = useStore((s) => s.activeModal);
  const language = useStore((s) => s.language);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const points = useStore((s) => s.points);
  const annotations = useStore((s) => s.annotations);
  const categories = useStore((s) => s.categories);
  const exportFormat = useStore((s) => s.exportFormat);
  const activeTileLayer = useStore((s) => s.activeTileLayer);
  const manualZoneOverride = useStore((s) => s.manualZoneOverride);
  const isContinuousAddMode = useStore((s) => s.isContinuousAddMode);
  const autoFetchElevation = useStore((s) => s.autoFetchElevation);
  const showToast = useStore((s) => s.showToast);

  const [dxfOptions, setDxfOptions] = useState<DxfExportOptions>(defaultDxfOptions);

  if (activeModal !== 'export_preview' || !exportFormat) return null;

  const isAr = language === 'ar';

  // Folders computation
  const projectFolders = Array.from(
    new Set([
      ...categories,
      ...points.map((p) => p.category).filter((c): c is string => Boolean(c && c.trim())),
    ])
  );
  const uncategorizedCount = points.filter((p) => !p.category || !p.category.trim()).length;

  // Filtered points based on scope
  const targetCadPoints = exportFormat === 'dxf'
    ? filterPointsByScope(points, dxfOptions.selectedCategory)
    : points;

  const lineCount = annotations.filter((a) => a.type === 'line').length;
  const labelCount = annotations.filter((a) => a.type === 'text').length;

  // Size calculation
  const pointsSize = targetCadPoints.length * 0.4;
  const annotationsSize = annotations.length * 0.6;
  const totalSizeKb = Math.max(1, Math.round(1.5 + pointsSize + annotationsSize));
  const sizeText = totalSizeKb > 1024
    ? `${(totalSizeKb / 1024).toFixed(2)} MB`
    : `${totalSizeKb} KB`;

  // UTM Zones
  const uniqueZones = Array.from(new Set(targetCadPoints.map((p) => `${p.utm.zone}${p.utm.hemisphere}`)));
  const zonesText = uniqueZones.join(', ') || (isAr ? 'لا يوجد' : 'None');

  const formatLabels: Record<string, string> = {
    dxf: isAr ? 'AutoCAD (.scr / .dxf)' : 'AutoCAD (.scr / .dxf)',
    excel: isAr ? 'Excel شامل (.xlsx)' : 'Full Excel (.xlsx)',
    geojson: isAr ? 'GeoJSON (.geojson)' : 'GeoJSON (.geojson)',
    backup: isAr ? 'نسخة احتياطية (.json)' : 'Full Backup (.json)',
  };

  const formatIcons: Record<string, React.ReactNode> = {
    dxf: <DraftingCompass className="w-5 h-5 text-rose-400" />,
    excel: <FileSpreadsheet className="w-5 h-5 text-emerald-400" />,
    geojson: <Globe className="w-5 h-5 text-sky-400" />,
    backup: <Save className="w-5 h-5 text-amber-400" />,
  };

  const handleExport = () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');

      if (exportFormat === 'dxf') {
        if (targetCadPoints.length === 0) {
          showToast(isAr ? 'لا توجد نقاط مساحية للتصدير في هذا النطاق' : 'No points to export in this scope', 'warning');
          return;
        }

        if (dxfOptions.cadFormat === 'scr') {
          exportProjectToScript(points, dxfOptions);
          showToast(isAr ? 'تم تصدير السكريبت بنجاح - اسحبه إلى الأوتوكاد وسيعمل التقريب تلقائياً' : 'AutoCAD Script (.scr) exported - Drag into AutoCAD', 'success');
        } else {
          exportProjectToDxf(points, annotations, dxfOptions);
          showToast(isAr ? 'تم تصدير DXF بنجاح - بعد الفتح في أوتوكاد اضغط Z ثم E لعمل Zoom Extents' : 'DXF exported - Type Z then E to Zoom Extents', 'success');
        }
      } else if (exportFormat === 'excel') {
        exportFullProjectToExcel(points, annotations, language);
      } else if (exportFormat === 'geojson') {
        const geojson = exportToGeoJSON(points, annotations);
        const jsonStr = JSON.stringify(geojson, null, 2);
        const fileName = `Almussah_Project_${year}-${month}-${day}_${hours}-${mins}.geojson`;
        triggerFileDownload(jsonStr, fileName, 'application/geo+json;charset=utf-8;');
        showToast(getTranslation(language, 'exportSuccess'), 'success');
      } else if (exportFormat === 'backup') {
        const pinStyle = useStore.getState().pinStyle;
        const pinSize = useStore.getState().pinSize;
        const pointLabelSize = useStore.getState().pointLabelSize;
        const pointLabelPosition = useStore.getState().pointLabelPosition;
        const showPointLabels = useStore.getState().showPointLabels;
        const settings = {
          activeTileLayer,
          manualZoneOverride,
          isSnappingEnabled: true,
          isContinuousAddMode,
          autoFetchElevation,
          pinStyle,
          pinSize,
          pointLabelSize,
          pointLabelPosition,
          showPointLabels,
        };
        const currentCats = useStore.getState().categories;
        const backup = exportFullBackup(points, annotations, settings, language, currentCats);
        const jsonStr = JSON.stringify(backup, null, 2);
        const fileName = `Almussah_Backup_${year}-${month}-${day}_${hours}-${mins}.json`;
        triggerFileDownload(jsonStr, fileName, 'application/json;charset=utf-8;');
        showToast(getTranslation(language, 'exportSuccess'), 'success');
      }

      setActiveModal(null);
    } catch {
      showToast(getTranslation(language, 'exportFailed'), 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 pt-safe pb-safe overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800/90 flex items-center justify-center border border-slate-700 text-rose-400">
              {formatIcons[exportFormat] || <Download className="w-4 h-4 text-slate-300" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">
                {exportFormat === 'dxf'
                  ? isAr ? 'تصدير النقاط إلى AutoCAD' : 'Export Points to AutoCAD'
                  : getTranslation(language, 'exportPreview')}
              </h3>
              <p className="text-[11px] text-slate-400">
                {exportFormat === 'dxf'
                  ? isAr ? 'إخراج النقاط الهندسية والمناسيب لبرنامج AutoCAD' : 'Export survey coordinates & elevations to AutoCAD'
                  : formatLabels[exportFormat]}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-right dir-rtl max-h-[82vh] overflow-y-auto">
          {exportFormat === 'dxf' ? (
            /* AutoCAD Export Panel */
            <div className="space-y-4">
              {/* 1. Format Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>{isAr ? 'صيغة التصدير' : 'CAD Export Format'}</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {isAr ? 'اختر الصيغة المناسبة للأوتوكاد' : 'Select target format'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Script (.scr) */}
                  <button
                    type="button"
                    onClick={() => setDxfOptions({ ...dxfOptions, cadFormat: 'scr' })}
                    className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                      dxfOptions.cadFormat === 'scr'
                        ? 'bg-rose-500/15 border-rose-500/80 text-rose-200 ring-1 ring-rose-500/50'
                        : 'bg-slate-800/50 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-rose-400" />
                        <span className="font-bold text-xs text-slate-100">AutoCAD Script (.scr)</span>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {isAr ? 'الأسرع والأسهل' : 'Recommended'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {isAr ? 'سحب وإفلات مباشر داخل الأوتوكاد' : 'Drag & drop directly into AutoCAD'}
                    </span>
                  </button>

                  {/* DXF */}
                  <button
                    type="button"
                    onClick={() => setDxfOptions({ ...dxfOptions, cadFormat: 'dxf' })}
                    className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                      dxfOptions.cadFormat === 'dxf'
                        ? 'bg-rose-500/15 border-rose-500/80 text-rose-200 ring-1 ring-rose-500/50'
                        : 'bg-slate-800/50 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-2">
                        <DraftingCompass className="w-4 h-4 text-cyan-400" />
                        <span className="font-bold text-xs text-slate-100">AutoCAD Drawing (.dxf)</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        R12-2026
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {isAr ? 'ملف رسم كاد قياسي (File > Open)' : 'Standard CAD Drawing file'}
                    </span>
                  </button>
                </div>
              </div>

              {/* 2. Points Scope */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAr ? 'نطاق النقاط والمجلدات' : 'Points Scope'}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    {targetCadPoints.length} {isAr ? 'نقطة محددة' : 'points'}
                  </span>
                </div>

                {/* Scope selector tabs */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDxfOptions({ ...dxfOptions, selectedCategory: 'all' })}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border ${
                      dxfOptions.selectedCategory === 'all'
                        ? 'bg-rose-500/20 text-rose-200 border-rose-500/60 shadow-sm'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/70 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{isAr ? 'جميع النقاط' : 'All Points'} ({points.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (dxfOptions.selectedCategory === 'all') {
                        setDxfOptions({
                          ...dxfOptions,
                          selectedCategory: projectFolders[0] || '__uncategorized__',
                        });
                      }
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border ${
                      dxfOptions.selectedCategory !== 'all'
                        ? 'bg-amber-500/20 text-amber-200 border-amber-500/60 shadow-sm'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/70 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>{isAr ? 'مجلد محدد' : 'Specific Folder'}</span>
                  </button>
                </div>

                {/* Folder Pills */}
                {dxfOptions.selectedCategory !== 'all' && (
                  <div className="pt-2 border-t border-slate-800/70 space-y-1.5">
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-900/60 rounded-lg border border-slate-800">
                      {projectFolders.map((folder) => {
                        const count = points.filter((p) => p.category === folder).length;
                        const isSelected = dxfOptions.selectedCategory === folder;
                        return (
                          <button
                            key={folder}
                            type="button"
                            onClick={() => setDxfOptions({ ...dxfOptions, selectedCategory: folder })}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950 font-bold border-amber-400 shadow-sm'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            <Folder className="w-3 h-3 text-amber-500" />
                            <span>{folder}</span>
                            <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}

                      {uncategorizedCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setDxfOptions({ ...dxfOptions, selectedCategory: '__uncategorized__' })}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                            dxfOptions.selectedCategory === '__uncategorized__'
                              ? 'bg-amber-400 text-slate-950 font-bold border-amber-400 shadow-sm'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <span>{isAr ? 'غير مصنف' : 'Uncategorized'}</span>
                          <span className={`text-[10px] px-1 rounded ${dxfOptions.selectedCategory === '__uncategorized__' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
                            {uncategorizedCount}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Output Options */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 space-y-2.5">
                <span className="text-xs font-semibold text-slate-300 block">
                  {isAr ? 'خيارات الرسم والطبقات' : 'Layer & Display Options'}
                </span>

                {/* Text Height selector */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400">{isAr ? 'حجم النصوص (ارتفاع الخط بالمتر):' : 'Text Height:'}</span>
                  <div className="flex items-center gap-1">
                    {[0.5, 1.0, 2.0, 5.0].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setDxfOptions({ ...dxfOptions, textHeight: val })}
                        className={`py-1 px-2.5 rounded-lg text-xs font-mono font-semibold border transition-all ${
                          dxfOptions.textHeight === val
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-sm'
                            : 'bg-slate-800/60 text-slate-400 border-slate-700/80 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {val}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggle chips */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setDxfOptions({ ...dxfOptions, includeElevation: !dxfOptions.includeElevation })}
                    className={`p-2 rounded-lg text-xs font-medium border flex items-center gap-2 text-right transition-all ${
                      dxfOptions.includeElevation
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800/40 text-slate-400 border-slate-800'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${dxfOptions.includeElevation ? 'bg-emerald-500 text-slate-950 font-bold' : 'border border-slate-600'}`}>
                      {dxfOptions.includeElevation && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-[11px]">{isAr ? 'المنسوب (Elevation Z)' : 'Elevation (Z)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDxfOptions({ ...dxfOptions, includePointNames: !dxfOptions.includePointNames })}
                    className={`p-2 rounded-lg text-xs font-medium border flex items-center gap-2 text-right transition-all ${
                      dxfOptions.includePointNames
                        ? 'bg-sky-500/10 text-sky-300 border-sky-500/40'
                        : 'bg-slate-800/40 text-slate-400 border-slate-800'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${dxfOptions.includePointNames ? 'bg-sky-500 text-slate-950 font-bold' : 'border border-slate-600'}`}>
                      {dxfOptions.includePointNames && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-[11px]">{isAr ? 'اسم / رقم النقطة (Name)' : 'Point Name / ID'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDxfOptions({ ...dxfOptions, includeDescriptions: !dxfOptions.includeDescriptions })}
                    className={`p-2 rounded-lg text-xs font-medium border flex items-center gap-2 text-right transition-all ${
                      dxfOptions.includeDescriptions
                        ? 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/40'
                        : 'bg-slate-800/40 text-slate-400 border-slate-800'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${dxfOptions.includeDescriptions ? 'bg-fuchsia-500 text-slate-950 font-bold' : 'border border-slate-600'}`}>
                      {dxfOptions.includeDescriptions && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-[11px]">{isAr ? 'الوصف والكود (Desc)' : 'Description / Code'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDxfOptions({ ...dxfOptions, includeLines: !dxfOptions.includeLines })}
                    className={`p-2 rounded-lg text-xs font-medium border flex items-center gap-2 text-right transition-all ${
                      dxfOptions.includeLines
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800/40 text-slate-400 border-slate-800'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${dxfOptions.includeLines ? 'bg-amber-500 text-slate-950 font-bold' : 'border border-slate-600'}`}>
                      {dxfOptions.includeLines && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-[11px]">{isAr ? 'الخطوط والمسارات' : 'Annotation Lines'}</span>
                  </button>
                </div>

                {/* Quick CAD Hint */}
                <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-200/90 flex items-start gap-2">
                  <span className="text-sm">💡</span>
                  <div className="leading-relaxed">
                    {dxfOptions.cadFormat === 'scr' ? (
                      <span>
                        {isAr
                          ? 'بمجرد سحب ملف السكريبت (.scr) وإفلاته داخل نافذة الأوتوكاد، سيتم رسم كافة النقاط والمناسيب والأسماء وعمل تقريب تلقائي (Zoom Extents) فوراً.'
                          : 'Drag & drop the .scr file into AutoCAD; it will draw points, names, elevations, and auto-zoom to extents.'}
                      </span>
                    ) : (
                      <span>
                        {isAr
                          ? 'نظراً لأن الإحداثيات هي UTM حقيقية بالملايين، بعد فتح ملف الـ DXF في الأوتوكاد اضغط مرتين على عجلة الماوس أو اكتب في سطر الأوامر Z ثم Enter ثم E ثم Enter (Zoom Extents) لتوسيط النقاط فوراً.'
                          : 'Since coordinates are real UTM meters, after opening the DXF in AutoCAD, double-click the mouse wheel or type Z then E (Zoom Extents) to center the points.'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Standard Summary Box for Excel/GeoJSON/Backup */
            <div className="bg-slate-950/30 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                  <p className="text-slate-400 text-[11px] mb-0.5">{isAr ? 'النقاط المساحية' : 'Survey Points'}</p>
                  <p className="font-bold text-slate-100 text-sm">{points.length}</p>
                </div>

                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                  <p className="text-slate-400 text-[11px] mb-0.5">{isAr ? 'الخطوط والمسارات' : 'Lines'}</p>
                  <p className="font-bold text-slate-100 text-sm">{lineCount}</p>
                </div>

                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                  <p className="text-slate-400 text-[11px] mb-0.5">{isAr ? 'النصوص' : 'Labels'}</p>
                  <p className="font-bold text-slate-100 text-sm">{labelCount}</p>
                </div>

                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                  <p className="text-slate-400 text-[11px] mb-0.5">{getTranslation(language, 'totalSize')}</p>
                  <p className="font-bold text-amber-400 text-sm">{sizeText}</p>
                </div>
              </div>

              <div className="pt-2 flex justify-between text-xs text-slate-400 border-t border-slate-800 px-1">
                <span>{isAr ? 'نطاق إحداثيات UTM:' : 'UTM Zones in project:'}</span>
                <span className="font-semibold text-slate-200">{zonesText}</span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-1 flex items-center gap-2.5">
            <button
              onClick={handleExport}
              className="flex-1 py-2.5 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 shadow-rose-500/20"
            >
              <Download className="w-4 h-4" />
              <span>
                {exportFormat === 'dxf'
                  ? isAr
                    ? `تصدير (${dxfOptions.cadFormat.toUpperCase()}) - ${targetCadPoints.length} نقطة`
                    : `Export (${dxfOptions.cadFormat.toUpperCase()}) - ${targetCadPoints.length} pts`
                  : getTranslation(language, 'exportProject')}
              </span>
            </button>
            <button
              onClick={() => setActiveModal(null)}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-all"
            >
              {getTranslation(language, 'cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
