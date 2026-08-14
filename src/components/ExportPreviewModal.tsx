import React from 'react';
import { useStore } from '../store/useStore';
import { getTranslation } from '../utils/translations';
import { exportFullProjectToExcel } from '../utils/excel';
import { exportToGeoJSON, exportFullBackup, triggerFileDownload } from '../utils/exportImport';
import { X, FileSpreadsheet, Globe, Save, Download, HelpCircle, Info } from 'lucide-react';

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

  const formatLabels = {
    excel: isAr ? 'Excel شامل (.xlsx)' : 'Full Excel (.xlsx)',
    geojson: isAr ? 'GeoJSON (.geojson)' : 'GeoJSON (.geojson)',
    backup: isAr ? 'نسخة احتياطية (.json)' : 'Full Backup (.json)',
  };

  const formatIcons = {
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

      if (exportFormat === 'excel') {
        exportFullProjectToExcel(points, annotations, language);
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
        const backup = exportFullBackup(points, annotations, settings, language);
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

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 pt-safe pb-safe">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
        <div className="p-5 space-y-4 text-right dir-rtl">
          {/* Format indicator */}
          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-2xl flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {isAr ? 'صيغة التصدير المستهدفة:' : 'Target export format:'}
            </span>
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-200">
              {formatIcons[exportFormat]}
              <span>{formatLabels[exportFormat]}</span>
            </div>
          </div>

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
                <p className="text-slate-400 text-[11px] mb-0.5">{isAr ? 'الخطوط التوضيحية' : 'Annotation Lines'}</p>
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

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex-1 py-3 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-sky-500/20 active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>{getTranslation(language, 'exportProject')}</span>
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
