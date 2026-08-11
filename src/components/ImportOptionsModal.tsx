import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getTranslation } from '../utils/translations';
import { parseBackupFile, parseGeoJSONFile, processImportedGeoJSON, ImportResult } from '../utils/exportImport';
import { X, RefreshCw, Layers, Settings, FileSpreadsheet, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const ImportOptionsModal: React.FC = () => {
  const activeModal = useStore((s) => s.activeModal);
  const language = useStore((s) => s.language);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const points = useStore((s) => s.points);
  const importFile = useStore((s) => s.importFile);
  const importFileType = useStore((s) => s.importFileType);
  const replaceProjectData = useStore((s) => s.replaceProjectData);
  const mergeProjectData = useStore((s) => s.mergeProjectData);
  const setImportResult = useStore((s) => s.setImportResult);
  const showToast = useStore((s) => s.showToast);

  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');
  const [importSettings, setImportSettings] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (activeModal !== 'import_options' || !importFile || !importFileType) return null;

  const isAr = language === 'ar';

  const handleImport = async () => {
    setIsProcessing(true);
    try {
      if (importFileType === 'backup') {
        const backup = await parseBackupFile(importFile);
        
        if (importMode === 'replace') {
          replaceProjectData(
            backup.data.points,
            backup.data.annotations,
            importSettings ? backup.data.settings : undefined
          );
        } else {
          mergeProjectData(backup.data.points, backup.data.annotations);
        }

        const lines = backup.data.annotations.filter((a) => a.type === 'line').length;
        const labels = backup.data.annotations.filter((a) => a.type === 'text').length;

        setImportResult({
          pointsCount: backup.data.points.length,
          linesCount: lines,
          labelsCount: labels,
          warnings: [],
        });
        
        showToast(getTranslation(language, 'importSuccess'), 'success');
        setActiveModal('import_result');
      } else if (importFileType === 'geojson') {
        const geojson = await parseGeoJSONFile(importFile);
        const processed = processImportedGeoJSON(geojson, importMode === 'merge' ? points : []);

        if (importMode === 'replace') {
          replaceProjectData(processed.points, processed.annotations);
        } else {
          mergeProjectData(processed.points, processed.annotations);
        }

        setImportResult({
          pointsCount: processed.pointsCount,
          linesCount: processed.linesCount,
          labelsCount: processed.labelsCount,
          warnings: processed.warnings,
        });

        showToast(getTranslation(language, 'importSuccess'), 'success');
        setActiveModal('import_result');
      }
    } catch (err: any) {
      let errKey = 'importFailed';
      if (err?.message === 'invalid_app' || err?.message === 'invalid_json' || err?.message === 'invalid_data_structure') {
        errKey = 'invalidBackupFile';
      } else if (err?.message === 'unsupported_version') {
        errKey = 'unsupportedVersion';
      }
      showToast(getTranslation(language, errKey as any) || err?.message || 'Failed to import file', 'error');
      setActiveModal(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 pt-safe pb-safe">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
              <RefreshCw className={`w-4 h-4 text-sky-400 ${isProcessing ? 'animate-spin' : ''}`} />
            </div>
            <h3 className="font-bold text-slate-100 text-sm">
              {importFileType === 'backup'
                ? getTranslation(language, 'importBackup')
                : getTranslation(language, 'importGeoJSON')}
            </h3>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-right dir-rtl">
          {/* File summary */}
          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-2xl flex flex-col gap-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">{isAr ? 'اسم الملف:' : 'File name:'}</span>
              <span className="font-bold text-slate-200 truncate max-w-[200px]">{importFile.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{isAr ? 'نوع البيانات:' : 'Data type:'}</span>
              <span className="font-semibold text-slate-300">
                {importFileType === 'backup' ? (isAr ? 'نسخة احتياطية للمشروع' : 'Full Backup') : 'GeoJSON'}
              </span>
            </div>
          </div>

          {/* Import options */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-400">
              {isAr ? 'اختر طريقة الاستيراد:' : 'Choose import method:'}
            </label>

            <div className="space-y-2">
              {/* Option 1: Merge */}
              <button
                type="button"
                onClick={() => setImportMode('merge')}
                className={`w-full p-4 rounded-2xl border text-right transition-all flex gap-3.5 items-start ${
                  importMode === 'merge'
                    ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/5'
                    : 'border-slate-800 bg-slate-950/20 hover:border-slate-700'
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  importMode === 'merge' ? 'border-sky-400' : 'border-slate-600'
                }`}>
                  {importMode === 'merge' && <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />}
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-xs text-slate-200">
                    {getTranslation(language, 'mergeWithExisting')}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isAr
                      ? 'يضيف البيانات الجديدة مع الاحتفاظ بجميع نقاطك وخطوطك الحالية، ويتجنب تكرار العناصر المتطابقة.'
                      : 'Appends new records to your existing workspace while safely avoiding duplicates.'}
                  </p>
                </div>
              </button>

              {/* Option 2: Replace */}
              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`w-full p-4 rounded-2xl border text-right transition-all flex gap-3.5 items-start ${
                  importMode === 'replace'
                    ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/5'
                    : 'border-slate-800 bg-slate-950/20 hover:border-slate-700'
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  importMode === 'replace' ? 'border-amber-400' : 'border-slate-600'
                }`}>
                  {importMode === 'replace' && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-xs text-slate-200">
                    {getTranslation(language, 'replaceAll')}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {isAr
                      ? 'يمسح جميع بيانات المشروع الحالية ويستبدلها بالبيانات المستوردة تماماً. استخدم هذا الخيار لاستعادة مشروع سابق.'
                      : 'Overwrites all current data in the application and replaces it with the backup content.'}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Backup specific: Import Settings toggle */}
          {importFileType === 'backup' && importMode === 'replace' && (
            <label className="flex items-center gap-2.5 p-3.5 bg-slate-950/40 border border-slate-800 rounded-2xl cursor-pointer select-none">
              <input
                type="checkbox"
                checked={importSettings}
                onChange={(e) => setImportSettings(e.target.checked)}
                className="rounded text-sky-500 focus:ring-sky-500/40 w-4 h-4 bg-slate-800 border-slate-700"
              />
              <div className="space-y-0.5 text-right">
                <span className="text-xs font-bold text-slate-200 block">
                  {isAr ? 'استعادة إعدادات التطبيق' : 'Restore application settings'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {isAr
                    ? 'يشمل تثبيت المنطقة ونوع خريطة الأساس المفضلة.'
                    : 'Includes manual zone override and base map tile preference.'}
                </span>
              </div>
            </label>
          )}

          {/* Warnings about overwrite */}
          {importMode === 'replace' && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] rounded-xl flex gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                {isAr
                  ? 'تحذير: سيتم حذف جميع النقاط والمقاييس والخطوط الحالية بشكل كامل ولا يمكن التراجع.'
                  : 'Warning: This action completely removes all your current points and drawings.'}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleImport}
              disabled={isProcessing}
              className={`flex-1 py-3 px-4 text-white rounded-2xl text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-1.5 ${
                isProcessing
                  ? 'bg-slate-700 cursor-not-allowed shadow-none'
                  : importMode === 'replace'
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                  : 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isProcessing
                  ? (isAr ? 'جاري الاستيراد...' : 'Importing...')
                  : (isAr ? 'بدء الاستيراد' : 'Start Import')}
              </span>
            </button>
            <button
              onClick={() => setActiveModal(null)}
              disabled={isProcessing}
              className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-semibold transition-all disabled:opacity-50"
            >
              {getTranslation(language, 'cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
