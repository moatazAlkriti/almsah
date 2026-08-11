import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { parseExcelToPoints } from '../utils/excel';
import { getTranslation } from '../utils/translations';
import { SurveyPoint } from '../types';
import { Upload, X, FileSpreadsheet, Check, AlertCircle, FileCheck } from 'lucide-react';

export const ExcelImportModal: React.FC = () => {
  const activeModal = useStore((s) => s.activeModal);
  const language = useStore((s) => s.language);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const importPoints = useStore((s) => s.importPoints);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewPoints, setPreviewPoints] = useState<SurveyPoint[] | null>(null);

  if (activeModal !== 'import_excel') return null;

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const parsed = await parseExcelToPoints(file);
      if (parsed.length === 0) {
        setError('لم نتمكن من استخراج أي نقاط إحداثيات UTM صالحة من الملف');
      } else {
        setPreviewPoints(parsed);
      }
    } catch (err: any) {
      setError(err?.toString() || 'حدث خطأ أثناء قراءة ملف الإكسل');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (previewPoints && previewPoints.length > 0) {
      importPoints(previewPoints);
      setActiveModal(null);
      setPreviewPoints(null);
    }
  };

  const handleClose = () => {
    setActiveModal(null);
    setPreviewPoints(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 pt-safe pb-safe">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-100 text-base">
              {getTranslation(language, 'importExcel')} (.xlsx, .xls)
            </h3>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {!previewPoints ? (
            /* Dropzone Area */
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className="border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-3xl p-8 text-center bg-slate-950/40 hover:bg-slate-950/80 transition-all cursor-pointer group"
            >
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                id="excel-file-input"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <label htmlFor="excel-file-input" className="cursor-pointer space-y-3 block">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200 text-sm mb-1">
                    اسحب وأسقط ملف إكسل هنا أو انقر للاختيار
                  </h4>
                  <p className="text-xs text-slate-400">
                    يدعم ملفات (.xlsx, .xls, .csv) المشتملة على أعمدة Easting, Northing, Zone أو Lat/Lng
                  </p>
                </div>
              </label>

              {isLoading && (
                <div className="mt-4 text-xs text-sky-400 font-semibold animate-pulse">
                  جاري جلب وتحليل النقاط من ملف الإكسل...
                </div>
              )}
            </div>
          ) : (
            /* Preview Table */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <FileCheck className="w-4 h-4" />
                  <span>تم التعرف على {previewPoints.length} نقطة بنجاح</span>
                </div>
                <button
                  onClick={() => setPreviewPoints(null)}
                  className="text-slate-400 hover:text-white underline text-xs"
                >
                  اختيار ملف آخر
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950">
                <table className="w-full text-right dir-rtl text-xs">
                  <thead className="bg-slate-900 text-slate-400 sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">اسم النقطة</th>
                      <th className="p-2.5">Zone</th>
                      <th className="p-2.5">Easting (X)</th>
                      <th className="p-2.5">Northing (Y)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {previewPoints.slice(0, 50).map((pt) => (
                      <tr key={pt.id} className="hover:bg-slate-900/50">
                        <td className="p-2.5 font-sans font-bold text-slate-100">{pt.name}</td>
                        <td className="p-2.5 text-amber-400">{pt.utm.zone}{pt.utm.hemisphere}</td>
                        <td className="p-2.5 text-emerald-400">{pt.utm.easting.toFixed(2)} m</td>
                        <td className="p-2.5 text-sky-400">{pt.utm.northing.toFixed(2)} m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>

            {previewPoints && (
              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>إضافة النقاط إلى الخريطة ({previewPoints.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
