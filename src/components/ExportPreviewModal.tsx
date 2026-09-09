import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getTranslation } from '../utils/translations';
import { exportFullProjectToExcel } from '../utils/excel';
import { exportToGeoJSON, exportFullBackup, triggerFileDownload } from '../utils/exportImport';
import { exportProjectToDxf, exportCivil3dCSV, defaultDxfOptions, DxfExportOptions } from '../utils/dxfExport';
import {
  X,
  FileSpreadsheet,
  Globe,
  Save,
  Download,
  Info,
  DraftingCompass,
  Layers,
  Settings2,
  FileText,
  Check,
} from 'lucide-react';

export const ExportPreviewModal: React.FC = () => {
  const activeModal = useStore((s) => s.activeModal);
  const language = useStore((s) => s.language);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const points = useStore((s) => s.points);
  const annotations = useStore((s) => s.annotations);
  const exportFormat = useStore((s) => s.exportFormat);
  const activeTileLayer = useStore((s) => s.activeTileLayer);
  const manualZoneOverride = useStore((s) => s.manualZoneOverride);
  const isContinuousAddMode = useStore((s) => s.isContinuousAddMode);
  const autoFetchElevation = useStore((s) => s.autoFetchElevation);
  const showToast = useStore((s) => s.showToast);

  const [dxfOptions, setDxfOptions] = useState<DxfExportOptions>(defaultDxfOptions);
  const [showDxfAdvanced, setShowDxfAdvanced] = useState(false);

  if (activeModal !== 'export_preview' || !exportFormat) return null;

  const isAr = language === 'ar';

  const lineCount = annotations.filter((a) => a.type === 'line').length;
  const labelCount = annotations.filter((a) => a.type === 'text').length;
  
  // Size calculation
  const pointsSize = points.length * 0.4;
  const annotationsSize = annotations.length * 0.6;
  const totalSizeKb = Math.max(1, Math.round(1.5 + pointsSize + annotationsSize));
  const sizeText = totalSizeKb > 1024 
    ? `${(totalSizeKb / 1024).toFixed(2)} MB` 
    : `${totalSizeKb} KB`;

  // UTM Zones
  const uniqueZones = Array.from(new Set(points.map((p) => `${p.utm.zone}${p.utm.hemisphere}`)));
  const zonesText = uniqueZones.join(', ') || (isAr ? 'لا يوجد' : 'None');

  const formatLabels: Record<string, string> = {
    excel: isAr ? 'Excel شامل (.xlsx)' : 'Full Excel (.xlsx)',
    geojson: isAr ? 'GeoJSON (.geojson)' : 'GeoJSON (.geojson)',
    backup: isAr ? 'نسخة احتياطية (.json)' : 'Full Backup (.json)',
    dxf: isAr ? 'AutoCAD كاد (.dxf)' : 'AutoCAD Drawing (.dxf)',
  };

  const formatIcons: Record<string, React.ReactNode> = {
    excel: <FileSpreadsheet className="w-5 h-5 text-emerald-400" />,
    geojson: <Globe className="w-5 h-5 text-sky-400" />,
    backup: <Save className="w-5 h-5 text-amber-400" />,
    dxf: <DraftingCompass className="w-5 h-5 text-rose-400" />,
  };

  const handleExport = () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');

      if (exportFormat === 'excel') {
        exportFullProjectToExcel(points, annotations, language);
      } else if (exportFormat === 'dxf') {
        exportProjectToDxf(points, annotations, dxfOptions);
      } else if (exportFormat === 'geojson') {
        const geojson = exportToGeoJSON(points, annotations);
        const jsonStr = JSON.stringify(geojson, null, 2);
        const fileName = `Almussah_Project_${year}-${month}-${day}_${hours}-${mins}.geojson`;
        triggerFileDownload(jsonStr, fileName, 'application/geo+json;charset=utf-8;');
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
        const categories = useStore.getState().categories;
        const backup = exportFullBackup(points, annotations, settings, language, categories);
        const jsonStr = JSON.stringify(backup, null, 2);
        const fileName = `Almussah_Backup_${year}-${month}-${day}_${hours}-${mins}.json`;
        triggerFileDownload(jsonStr, fileName, 'application/json;charset=utf-8;');
      }

      showToast(getTranslation(language, 'exportSuccess'), 'success');
      setActiveModal(null);
    } catch (err) {
      showToast(getTranslation(language, 'exportFailed'), 'error');
    }
  };

  const handleExportCivil3d = () => {
    try {
      exportCivil3dCSV(points);
      showToast(isAr ? 'تم تصدير ملف Civil 3D بنجاح' : 'Civil 3D file exported successfully', 'success');
    } catch (err) {
      showToast(getTranslation(language, 'exportFailed'), 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 pt-safe pb-safe overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
              <Download className="w-4 h-4 text-slate-300" />
            </div>
            <h3 className="font-bold text-slate-100 text-sm">
              {getTranslation(language, 'exportPreview')}
            </h3>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-right dir-rtl max-h-[80vh] overflow-y-auto">
          {/* Format indicator */}
          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-2xl flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {isAr ? 'صيغة التصدير المستهدفة:' : 'Target export format:'}
            </span>
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-200">
              {formatIcons[exportFormat]}
              <span>{formatLabels[exportFormat] || exportFormat}</span>
            </div>
          </div>

          {/* AutoCAD DXF Options Box */}
          {exportFormat === 'dxf' && (
            <div className="bg-slate-950/40 border border-rose-500/30 rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <DraftingCompass className="w-4 h-4 text-rose-400" />
                  <h4 className="font-bold text-xs text-slate-200">
                    {isAr ? 'إعدادات تصدير الأوتوكاد (AutoCAD DXF)' : 'AutoCAD DXF Options'}
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400 font-mono bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                  R12 / 2000-2026 Ready
                </span>
              </div>

              {/* Text Height Scale Selection */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-medium flex items-center justify-between">
                  <span>{getTranslation(language, 'dxfTextHeight')}</span>
                  <span className="text-amber-400 font-mono font-bold text-xs">{dxfOptions.textHeight} m</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[0.5, 1.0, 2.0, 5.0].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDxfOptions({ ...dxfOptions, textHeight: val })}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold font-mono border transition-all ${
                        dxfOptions.textHeight === val
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-sm'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {val} m
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Toggles */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDxfOptions({ ...dxfOptions, includeElevation: !dxfOptions.includeElevation })}
                  className={`p-2 rounded-xl text-xs font-medium border flex items-center gap-2 text-right transition-all ${
                    dxfOptions.includeElevation
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800/40 text-slate-400 border-slate-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${dxfOptions.includeElevation ? 'bg-emerald-500 text-slate-950 font-bold' : 'border border-slate-600'}`}>
                    {dxfOptions.includeElevation && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-[11px]">{getTranslation(language, 'dxfIncludeElevation')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDxfOptions({ ...dxfOptions, includePointNames: !dxfOptions.includePointNames })}
                  className={`p-2 rounded-xl text-xs font-medium border flex items-center gap-2 text-right transition-all ${
                    dxfOptions.includePointNames
                      ? 'bg-sky-500/10 text-sky-300 border-sky-500/40'
                      : 'bg-slate-800/40 text-slate-400 border-slate-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${dxfOptions.includePointNames ? 'bg-sky-500 text-slate-950 font-bold' : 'border border-slate-600'}`}>
                    {dxfOptions.includePointNames && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-[11px]">{getTranslation(language, 'dxfIncludePointNames')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDxfOptions({ ...dxfOptions, includeDescriptions: !dxfOptions.includeDescriptions })}
                  className={`p-2 rounded-xl text-xs font-medium border flex items-center gap-2 text-right transition-all ${
                    dxfOptions.includeDescriptions
                      ? 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/40'
                      : 'bg-slate-800/40 text-slate-400 border-slate-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${dxfOptions.includeDescriptions ? 'bg-fuchsia-500 text-slate-950 font-bold' : 'border border-slate-600'}`}>
                    {dxfOptions.includeDescriptions && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-[11px]">{getTranslation(language, 'dxfIncludeDescriptions')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDxfOptions({ ...dxfOptions, includeLines: !dxfOptions.includeLines })}
                  className={`p-2 rounded-xl text-xs font-medium border flex items-center gap-2 text-right transition-all ${
                    dxfOptions.includeLines
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800/40 text-slate-400 border-slate-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${dxfOptions.includeLines ? 'bg-amber-500 text-slate-950 font-bold' : 'border border-slate-600'}`}>
                    {dxfOptions.includeLines && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-[11px]">{getTranslation(language, 'dxfIncludeLines')}</span>
                </button>
              </div>

              {/* Organized CAD Layers Information */}
              <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                  <Layers className="w-3.5 h-3.5 text-rose-400" />
                  <span>{getTranslation(language, 'dxfLayersInfo')}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px] font-mono">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0" />
                    <span>SURVEY_POINTS</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
                    <span>POINT_NAMES</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>POINT_ELEVATIONS</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 shrink-0" />
                    <span>POINT_DESCRIPTIONS</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                    <span>SURVEY_LINES</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Box */}
          <div className="bg-slate-950/20 border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <h4 className="font-bold text-slate-300 text-xs pb-1 border-b border-slate-800/60 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAr ? 'محتويات الملف المُصدَّر' : 'Export File Contents'}</span>
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800">
                <p className="text-slate-400 text-[11px] mb-0.5">{isAr ? 'النقاط' : 'Survey Points'}</p>
                <p className="font-bold text-slate-100 text-sm">{points.length}</p>
              </div>

              <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800">
                <p className="text-slate-400 text-[11px] mb-0.5">{isAr ? 'الخطوط والمسارات' : 'Annotation Lines'}</p>
                <p className="font-bold text-slate-100 text-sm">{lineCount}</p>
              </div>

              <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800">
                <p className="text-slate-400 text-[11px] mb-0.5">{isAr ? 'النصوص وعلامات التوضيح' : 'Text Labels'}</p>
                <p className="font-bold text-slate-100 text-sm">{labelCount}</p>
              </div>

              <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800">
                <p className="text-slate-400 text-[11px] mb-0.5">{getTranslation(language, 'totalSize')}</p>
                <p className="font-bold text-amber-400 text-sm">{sizeText}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-between text-xs text-slate-400 border-t border-slate-800/60 px-1">
              <span>{isAr ? 'نطاق إحداثيات UTM:' : 'UTM Zones in project:'}</span>
              <span className="font-semibold text-slate-200">{zonesText}</span>
            </div>
          </div>

          {/* Civil 3D Alternative Button for CAD */}
          {exportFormat === 'dxf' && (
            <div className="p-3 bg-slate-950/30 border border-slate-800 rounded-2xl flex items-center justify-between gap-2">
              <div className="text-xs">
                <p className="font-bold text-slate-200">{isAr ? 'تصدير لبرنامج Civil 3D' : 'Export for Civil 3D'}</p>
                <p className="text-[11px] text-slate-400">{isAr ? 'صيغة PNEZD CSV لإنشاء COGO Points' : 'PNEZD CSV format for COGO Points'}</p>
              </div>
              <button
                type="button"
                onClick={handleExportCivil3d}
                className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'تحميل CSV' : 'Download CSV'}</span>
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex-1 py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-rose-500/20 active:scale-95 flex items-center justify-center gap-1.5"
            >
              {exportFormat === 'dxf' ? (
                <>
                  <DraftingCompass className="w-4 h-4" />
                  <span>{isAr ? 'تصدير وتحميل ملف AutoCAD (.dxf)' : 'Export & Download AutoCAD (.dxf)'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{getTranslation(language, 'exportProject')}</span>
                </>
              )}
            </button>
            <button
              onClick={() => setActiveModal(null)}
              className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-semibold transition-all"
            >
              {getTranslation(language, 'cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
