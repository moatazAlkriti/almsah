import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { exportPointsToExcel, generateExportData } from '../utils/excel';
import { X, Check, FileSpreadsheet, LayoutList, Columns } from 'lucide-react';
import { ExportColumnKey, ExportSettings } from '../types';

export const ExportExcelModal: React.FC = () => {
  const activeModal = useStore((s) => s.activeModal);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const language = useStore((s) => s.language);
  const points = useStore((s) => s.points);
  const exportSettings = useStore((s) => s.exportSettings);
  const setExportSettings = useStore((s) => s.setExportSettings);
  const showToast = useStore((s) => s.showToast);

  const [localSettings, setLocalSettings] = useState<ExportSettings>(exportSettings);

  const isAr = language === 'ar';

  useEffect(() => {
    if (activeModal === 'export_excel') {
      setLocalSettings(exportSettings);
    }
  }, [activeModal, exportSettings]);

  if (activeModal !== 'export_excel') return null;

  const ALL_COLUMNS: { key: ExportColumnKey; ar: string; en: string }[] = [
    { key: 'id', ar: 'معرف النقطة', en: 'Point ID' },
    { key: 'name', ar: 'الاسم', en: 'Name' },
    { key: 'description', ar: 'الوصف', en: 'Description' },
    { key: 'category', ar: 'التصنيف', en: 'Category' },
    { key: 'zone', ar: 'المنطقة (Zone)', en: 'UTM Zone' },
    { key: 'hemisphere', ar: 'نصف الكرة', en: 'Hemisphere' },
    { key: 'easting', ar: 'الإحداثي الشرقي (X)', en: 'Easting (X)' },
    { key: 'northing', ar: 'الإحداثي الشمالي (Y)', en: 'Northing (Y)' },
    { key: 'elevation', ar: 'الارتفاع (Z)', en: 'Elevation (Z)' },
    { key: 'latitude', ar: 'خط العرض (Lat)', en: 'Latitude' },
    { key: 'longitude', ar: 'خط الطول (Lng)', en: 'Longitude' },
    { key: 'timestamp', ar: 'التاريخ والوقت', en: 'Timestamp' },
  ];

  const handleToggleColumn = (col: ExportColumnKey) => {
    setLocalSettings(prev => {
      if (prev.selectedColumns.includes(col)) {
        return { ...prev, selectedColumns: prev.selectedColumns.filter(c => c !== col) };
      } else {
        // preserve order
        const newCols = ALL_COLUMNS.map(c => c.key).filter(c => c === col || prev.selectedColumns.includes(c));
        return { ...prev, selectedColumns: newCols };
      }
    });
  };

  const handleSelectAll = () => {
    setLocalSettings(prev => ({ ...prev, selectedColumns: ALL_COLUMNS.map(c => c.key) }));
  };

  const handleDeselectAll = () => {
    setLocalSettings(prev => ({ ...prev, selectedColumns: [] }));
  };

  const handleExport = () => {
    if (localSettings.selectedColumns.length === 0) {
      showToast(isAr ? 'يجب اختيار عمود واحد على الأقل' : 'At least one column must be selected', 'warning');
      return;
    }
    setExportSettings(localSettings);
    exportPointsToExcel(points, language, localSettings);
    showToast(isAr ? 'تم التصدير بنجاح 📊' : 'Exported successfully 📊', 'success');
    setActiveModal(null);
  };

  const previewData = generateExportData(points.slice(0, 3), language, localSettings);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-800/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            {isAr ? 'تخصيص تصدير الإكسل' : 'Customize Excel Export'}
          </h2>
          <button onClick={() => setActiveModal(null)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-8">
          
          {/* Settings Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Columns Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-200">
                  {isAr ? 'الأعمدة المصدرة' : 'Export Columns'}
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  <button onClick={handleSelectAll} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
                    {isAr ? 'تحديد الكل' : 'Select All'}
                  </button>
                  <button onClick={handleDeselectAll} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
                    {isAr ? 'إلغاء الكل' : 'Deselect All'}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {ALL_COLUMNS.map((col) => {
                  const isSelected = localSettings.selectedColumns.includes(col.key);
                  return (
                    <button
                      key={col.key}
                      onClick={() => handleToggleColumn(col.key)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-sm text-start transition-all ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${
                        isSelected ? 'bg-emerald-500 border-emerald-500 text-slate-900' : 'border-slate-600'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="truncate">{isAr ? col.ar : col.en}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Layout Orientation */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-200">
                {isAr ? 'اتجاه الجدول' : 'Table Orientation'}
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => setLocalSettings(prev => ({ ...prev, orientation: 'horizontal' }))}
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all ${
                    localSettings.orientation === 'horizontal'
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <LayoutList className="w-8 h-8" />
                  <span className="font-medium">{isAr ? 'أفقي (صفوف = نقاط)' : 'Horizontal (Rows = Points)'}</span>
                </button>
                
                <button
                  onClick={() => setLocalSettings(prev => ({ ...prev, orientation: 'vertical' }))}
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all ${
                    localSettings.orientation === 'vertical'
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <Columns className="w-8 h-8" />
                  <span className="font-medium">{isAr ? 'عمودي (أعمدة = نقاط)' : 'Vertical (Cols = Points)'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-4">
             <h3 className="text-lg font-semibold text-slate-200">
               {isAr ? 'معاينة (أول 3 صفوف)' : 'Preview (First 3 rows)'}
             </h3>
             <div className="bg-slate-950 rounded-xl overflow-x-auto border border-slate-800 custom-scrollbar">
                {localSettings.selectedColumns.length > 0 ? (
                  <table className="w-full text-left border-collapse text-sm whitespace-nowrap text-slate-300" dir={isAr ? 'rtl' : 'ltr'}>
                    <thead>
                      <tr>
                        {Object.keys(previewData[0] || {}).map((header, i) => (
                          <th key={i} className="px-4 py-3 bg-slate-900 border-b border-slate-800 font-semibold text-slate-100">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-900/50 transition-colors">
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="px-4 py-2 border-b border-slate-800/50 text-slate-400">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    {isAr ? 'لا يوجد أعمدة محددة للعرض' : 'No columns selected for preview'}
                  </div>
                )}
             </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-800/30 flex justify-end gap-3 shrink-0">
          <button
            onClick={() => setActiveModal(null)}
            className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={handleExport}
            className="px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <FileSpreadsheet className="w-5 h-5" />
            {isAr ? 'تصدير الآن' : 'Export Now'}
          </button>
        </div>
      </div>
    </div>
  );
};
