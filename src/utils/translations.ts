import { Language } from '../types';

export const translations = {
  ar: {
    appTitle: 'المساح',
    appSubtitle: 'أداة احترافية لجمع نقاط الرفع المساحي بنظام إحداثيات UTM والتصدير إلى Excel',
    
    // Header & Actions
    addPoint: 'إضافة نقطة جديدة',
    addByClick: 'انقر على الخريطة لتحديد نقطة',
    addManual: 'إدخال يدوي بإحداثيات UTM',
    measureDistance: 'قياس المسافات',
    exportExcel: 'تصدير إكسل (.xlsx)',
    importExcel: 'استيراد إكسل',
    clearAll: 'مسح جميع النقاط',
    confirmClear: 'هل أنت أصلًا متاكد من مسح كافة النقاط المساحية؟ لا يمكن التراجع بعد ذلك.',
    languageToggle: 'English',
    zoneOverride: 'تثبيت المنطقة UTM Zone',
    allZones: 'تلقائي حسب الموقع',
    
    // Search & Sidebar
    searchPlaceholder: 'ابحث باسم النقطة، الوصف، أو رقم Zone...',
    allCategories: 'جميع التصنيفات',
    totalPoints: 'إجمالي النقاط',
    activeZone: 'المنطقة النشطة',
    noPointsFound: 'لم يتم العثور على نقاط مساحية طابق البحث.',
    noPointsYet: 'لا توجد نقاط مساحية مسجلة بعد. انقر على الخريطة أو زر الإضافة للبدء.',
    
    // Map Controls & Tile Layers
    satellite: 'أقمار صناعية (Satellite)',
    hybrid: 'هجين (Hybrid)',
    streets: 'خرائط الطرق (Streets)',
    topo: 'خرائط تضاريس (Topo)',
    dark: 'النمط الداكن (Dark)',
    
    // Point Form / Details
    pointDetails: 'تفاصيل النقطة المساحية',
    pointName: 'اسم النقطة',
    pointNamePlaceholder: 'مثال: نقطة ضبط رقم 101',
    description: 'الوصف والبيانات',
    descriptionPlaceholder: 'ملاحظات المعاينة الحقلية، نوع الشاخص، الخ...',
    category: 'التصنيف المساحي',
    eastingX: 'الإحداثي الشرقي Easting (X)',
    northingY: 'الإحداثي الشمالي Northing (Y)',
    zone: 'المنطقة (UTM Zone)',
    hemisphere: 'نصف الكرة',
    elevationZ: 'الارتفاع المنسوب Z (متر)',
    colorMarker: 'لون العلامة على الخريطة',
    savePoint: 'حفظ النقطة',
    updatePoint: 'تحديث البيانات',
    cancel: 'إلغاء',
    delete: 'حذف النقطة',
    edit: 'تعديل البيانات',
    zoomTo: 'الانتقال المباشر للنقطة',
    
    // Categories
    control_point: 'نقطة ضبط أرضي (GCP)',
    boundary: 'نقطة حدود',
    elevation: 'نقطة منسوب ارتفاع',
    infrastructure: 'بنية تحتية',
    feature: 'معلم جغرافي',
    other: 'تحديد عام / أخرى',
    
    // Coordinates Bar
    cursorUtm: 'إحداثيات المؤشر UTM:',
    clickToAddPrompt: 'اضغط على أي مكان بالخريطة لوضع النقطة المساحية مباشرة',
    measuringPrompt: 'اضغط على الخريطة لإضافة نقاط المسار وحساب المسافة المساحية',
    totalDistance: 'إجمالي المسافة المساحية:',
    resetMeasure: 'إعادة القياس',
    
    // Toast Notifications
    pointAdded: 'تمت إضافة النقطة المساحية بنجاح!',
    pointUpdated: 'تم تحديث بيانات النقطة بنجاح!',
    pointDeleted: 'تم حذف النقطة المساحية.',
    pointsImported: 'تم استيراد النقاط من ملف الإكسل بنجاح!',
    pointsExported: 'تم تصدير ملف Excel بنجاح!',
  },
  en: {
    appTitle: 'Al-Mussah (المساح)',
    appSubtitle: 'Professional Geographic UTM Coordinate Collector & Surveying Tool',
    
    // Header & Actions
    addPoint: 'Add New Point',
    addByClick: 'Click Map to Add Point',
    addManual: 'Manual UTM Entry',
    measureDistance: 'Measure Distance',
    exportExcel: 'Export Excel (.xlsx)',
    importExcel: 'Import Excel',
    clearAll: 'Clear All Points',
    confirmClear: 'Are you sure you want to clear all survey points? This cannot be undone.',
    languageToggle: 'العربية',
    zoneOverride: 'Lock UTM Zone',
    allZones: 'Auto (By Location)',
    
    // Search & Sidebar
    searchPlaceholder: 'Search by point name, description, or zone...',
    allCategories: 'All Categories',
    totalPoints: 'Total Points',
    activeZone: 'Active Zone',
    noPointsFound: 'No survey points matched your search criteria.',
    noPointsYet: 'No survey points logged yet. Click on the map or the add button to begin.',
    
    // Map Controls & Tile Layers
    satellite: 'Satellite Imagery',
    hybrid: 'Hybrid Imagery',
    streets: 'Street Map',
    topo: 'Topographic Map',
    dark: 'Dark Canvas',
    
    // Point Form / Details
    pointDetails: 'Survey Point Details',
    pointName: 'Point Name',
    pointNamePlaceholder: 'e.g., Control Point GCP-101',
    description: 'Description / Field Notes',
    descriptionPlaceholder: 'Monument details, benchmark notes, ground conditions...',
    category: 'Survey Category',
    eastingX: 'Easting (X)',
    northingY: 'Northing (Y)',
    zone: 'UTM Zone',
    hemisphere: 'Hemisphere',
    elevationZ: 'Elevation Z (Meters)',
    colorMarker: 'Marker Icon Color',
    savePoint: 'Save Survey Point',
    updatePoint: 'Update Point',
    cancel: 'Cancel',
    delete: 'Delete Point',
    edit: 'Edit Point',
    zoomTo: 'Zoom To Point',
    
    // Categories
    control_point: 'Ground Control Point (GCP)',
    boundary: 'Boundary Marker',
    elevation: 'Elevation / Benchmark',
    infrastructure: 'Infrastructure',
    feature: 'Geographic Feature',
    other: 'General / Other',
    
    // Coordinates Bar
    cursorUtm: 'Cursor UTM Coords:',
    clickToAddPrompt: 'Click anywhere on the map to place a survey point',
    measuringPrompt: 'Click on the map to add path nodes & calculate total geodesic distance',
    totalDistance: 'Total Survey Distance:',
    resetMeasure: 'Reset Path',
    
    // Toast Notifications
    pointAdded: 'Survey point added successfully!',
    pointUpdated: 'Point details updated successfully!',
    pointDeleted: 'Survey point removed.',
    pointsImported: 'Points successfully imported from Excel file!',
    pointsExported: 'Excel file exported successfully!',
  }
};

export function getTranslation(lang: Language, key: keyof typeof translations['ar']): string {
  return translations[lang]?.[key] || translations['ar'][key] || key;
}
