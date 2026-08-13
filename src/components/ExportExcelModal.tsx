import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { exportPointsToExcel, generateExportData } from '../utils/excel';
import { X, Check, FileSpreadsheet, LayoutList, Columns, Folder, ArrowUpDown } from 'lucide-react';
import { ExportColumnKey, ExportSettings } from '../types';

export const ExportExcelModal: React.FC = () => {
  const activeModal = useStore((s) => s.activeModal);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const language = useStore((s) => s.language);
  const points = useStore((s) => s.points);
  const storeCategories = useStore((s) => s.categories);
  const exportSettings = useStore((s) => s.exportSettings);
  const setExportSettings = useStore((s) => s.setExportSettings);
  const showToast = useStore((s) => s.showToast);

  const [localSettings, setLocalSettings] = useState<ExportSettings>(exportSettings);

  const isAr = language === 'ar';

  const allFolders = useMemo(() => {
    const setF = new Set<string>();
    points.forEach((p) => {
      setF.add(p.category || (isAr ? 'نقاط عامة' : 'General Points'));
    });
    storeCategories.forEach((c) => {
      if (c) setF.add(c);
    });
    return Array.from(setF);
  }, [points, storeCategories, isAr]);

  const [selectedFolders, setSelectedFolders] = useState<string[]>(allFolders);

  useEffect(() => {
    if (activeModal === 'export_excel') {
      setLocalSettings(exportSettings);
      setSelectedFolders(allFolders);
    }
  }, [activeModal, exportSettings, allFolders]);

  if (activeModal !== 'export_excel') return null;

  const exportPoints = points.filter((p) =>
    selectedFolders.includes(p.category || (isAr ? 'نقاط عامة' : 'General Points'))
  );

  const ALL_COLUMNS: { key: ExportColumnKey; ar: string; en: string }[] = [
    { key: 'seq', ar: 'التسلسل (ت)', en: 'Sequence (#)' },
    { key: 'name', ar: 'اسم النقطة', en: 'Name' },
    { key: 'zone', ar: 'المنطقة (Zone)', en: 'UTM Zone' },
    { key: 'easting', ar: 'الإحداثي الشرقي (X)', en: 'Easting (X)' },
    { key: 'northing', ar: 'الإحداثي الشمالي (Y)', en: 'Northing (Y)' },
    { key: 'elevation', ar: 'الارتفاع (Z)', en: 'Elevation (Z)' },
    { key: 'mgrs', ar: 'إحداثيات MGRS', en: 'MGRS Coordinates' },
    { key: 'latitude', ar: 'خط العرض (Lat)', en: 'Latitude' },
    { key: 'longitude', ar: 'خط الطول (Lng)', en: 'Longitude' },
    { key: 'category', ar: 'التصنيف', en: 'Category' },
    { key: 'description', ar: 'الوصف والبيانات', en: 'Description' },
    { key: 'timestamp', ar: 'التاريخ والوقت', en: 'Timestamp' },
    { key: 'id', ar: 'معرف النقطة (ID)', en: 'Point ID' },
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

  const handleToggleFolder = (folderName: string) => {
    setSelectedFolders((prev) =>
      prev.includes(folderName) ? prev.filter((f) => f !== folderName) : [...prev, folderName]
    );
  };

  const handleExport = () => {
    if (localSettings.selectedColumns.length === 0) {
      showToast(isAr ? 'يجب اختيار عمود واحد على الأقل' : 'At least one column must be selected', 'warning');
      return;
    }
    if (exportPoints.length === 0) {
      showToast(isAr ? 'لم يتم اختيار أي نقاط للتصدير من المجلدات المحددة' : 'No points selected for export', 'warning');
      return;
    }
    setExportSettings(localSettings);
    exportPointsToExcel(exportPoints, language, localSettings);
    showToast(isAr ? `تم تصدير ${exportPoints.length} نقطة بنجاح 📊` : `Exported ${exportPoints.length} points 📊`, 'success');
    setActiveModal(null);
  };

  const previewData = generateExportData(exportPoints.slice(0, 3), language, localSettings);

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
          {/* Folders Selection Section */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <Folder className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'تحديد المجلدات للتصدير' : 'Select Folders to Export'}</span>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                  {exportPoints.length} / {points.length} {isAr ? 'نقطة' : 'pts'}
                </span>
              </h3>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedFolders(allFolders)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  {isAr ? 'جميع المجلدات' : 'Select All Folders'}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {allFolders.map((f) => {
                const isSel = selectedFolders.includes(f);
                const count = points.filter((p) => (p.category || (isAr ? 'نقاط عامة' : 'General Points')) === f).length;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => handleToggleFolder(f)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      isSel
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Folder className={`w-3.5 h-3.5 ${isSel ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span>{f}</span>
                    <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded-md text-slate-400 font-mono">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          
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

            {/* Layout Orientation & Sorting */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-200">
                  {isAr ? 'اتجاه الجدول' : 'Table Orientation'}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setLocalSettings(prev => ({ ...prev, orientation: 'horizontal' }))}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${
                      localSettings.orientation === 'horizontal'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <LayoutList className="w-6 h-6" />
                    <span className="font-medium text-xs">{isAr ? 'أفقي (صفوف = نقاط)' : 'Horizontal'}</span>
                  </button>
                  
                  <button
                    onClick={() => setLocalSettings(prev => ({ ...prev, orientation: 'vertical' }))}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${
                      localSettings.orientation === 'vertical'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <Columns className="w-6 h-6" />
                    <span className="font-medium text-xs">{isAr ? 'عمودي (أعمدة = نقاط)' : 'Vertical'}</span>
                  </button>
                </div>
              </div>

              {/* Sort Order Selector */}
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-sky-400" />
                  <span>{isAr ? 'ترتيب تسلسل النقاط في الجدول' : 'Points Sort Order'}</span>
                </h3>
                <div className="space-y-2">
                  {[
                    {
                      id: 'chronological_asc',
                      ar: '⏳ حسب تاريخ الإضافة: من الأقدم للأحدث (النقطة الأولى TH 1 هي رقم 1)',
                      en: 'Chronological (Oldest First - Point 1 = Seq 1)',
                    },
                    {
                      id: 'chronological_desc',
                      ar: '⌛ حسب تاريخ الإضافة: من الأحدث للأقدم (النقطة الأخيرة هي رقم 1)',
                      en: 'Chronological (Newest First)',
                    },
                    {
                      id: 'name_numeric',
                      ar: '🔢 حسب اسم النقطة: ترتيب رقمي ذكي (TH 1, TH 2, TH 3...)',
                      en: 'By Name (Smart Numeric: TH 1, TH 2...)',
                    },
                    {
                      id: 'name_alpha',
                      ar: '🔤 حسب اسم النقطة: ترتيب أبجدي تلقائي',
                      en: 'By Name (Alphabetical)',
                    },
                  ].map((opt) => {
                    const activeSort = localSettings.sortBy || 'chronological_asc';
                    const isSelected = activeSort === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setLocalSettings((prev) => ({
                            ...prev,
                            sortBy: opt.id as any,
                          }))
                        }
                        className={`w-full text-start p-2.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-sky-500/15 border-sky-500/50 text-sky-300 font-bold'
                            : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{isAr ? opt.ar : opt.en}</span>
                        {isSelected && <Check className="w-4 h-4 text-sky-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
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
