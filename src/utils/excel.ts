import * as XLSX from 'xlsx';
import { SurveyPoint, Language, PointCategory, Hemisphere, ExportSettings, ExportColumnKey, Annotation, AnnotationLine, AnnotationText } from '../types';
import { utmToLatLng, latLngToUTM, getUTMZoneFromLng, getHemisphereFromLat, getMGRSBandFromLat, latLngToMGRS } from './utm';

/**
 * Category translation helper
 */
export function getCategoryLabel(category?: PointCategory, lang: Language = 'ar'): string {
  if (!category) return lang === 'ar' ? 'عام' : 'General';
  
  const labels: Record<string, { ar: string; en: string }> = {
    control_point: { ar: 'نقطة ضبط أرضي (GCP)', en: 'Ground Control Point' },
    boundary: { ar: 'نقطة حدود', en: 'Boundary Marker' },
    elevation: { ar: 'نقطة منسوب', en: 'Elevation Point' },
    infrastructure: { ar: 'بنية تحتية', en: 'Infrastructure' },
    feature: { ar: 'معلم جغرافي', en: 'Feature' },
    other: { ar: 'أخرى', en: 'Other' },
  };

  return labels[category]?.[lang] || category;
}

/**
 * Parses label back to PointCategory string
 */
export function parseCategoryLabel(labelStr?: string): PointCategory {
  if (!labelStr) return '';
  return labelStr.trim();
}

/**
 * Helper to sort points by chosen order (Default: Chronological Ascending - Oldest / First Created first)
 */
export function sortPointsList(points: SurveyPoint[], sortBy: ExportSettings['sortBy'] = 'chronological_asc'): SurveyPoint[] {
  const sorted = [...points];
  switch (sortBy) {
    case 'chronological_asc':
      return sorted.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        if (timeA !== timeB) return timeA - timeB;
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      });
    case 'chronological_desc':
      return sorted.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        if (timeA !== timeB) return timeB - timeA;
        return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
      });
    case 'name_numeric':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    case 'name_alpha':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return sorted.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        if (timeA !== timeB) return timeA - timeB;
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      });
  }
}

export function generateExportData(points: SurveyPoint[], lang: Language, settings: ExportSettings) {
  const isAr = lang === 'ar';
  const sortedPoints = sortPointsList(points, settings.sortBy || 'chronological_asc');
  
  const getColName = (key: ExportColumnKey) => {
    const colNames = {
      seq: isAr ? 'ت' : 'Seq',
      id: isAr ? 'معرف النقطة (ID)' : 'Point ID',
      name: isAr ? 'اسم النقطة' : 'Point Name',
      description: isAr ? 'الوصف والبيانات' : 'Description',
      category: isAr ? 'التصنيف' : 'Category',
      zone: isAr ? 'منطقة UTM (Zone)' : 'UTM Zone',
      hemisphere: isAr ? 'نصف الكرة (Hemisphere)' : 'Hemisphere',
      easting: isAr ? 'الإحداثي الشرقي Easting (m)' : 'Easting X (m)',
      northing: isAr ? 'الإحداثي الشمالي Northing (m)' : 'Northing Y (m)',
      elevation: isAr ? 'الارتفاع Elevation (m)' : 'Elevation Z (m)',
      latitude: isAr ? 'خط العرض (Latitude)' : 'Latitude',
      longitude: isAr ? 'خط الطول (Longitude)' : 'Longitude',
      mgrs: isAr ? 'إحداثيات MGRS العسكرية' : 'MGRS Coordinates',
      timestamp: isAr ? 'تاريخ التسجيل' : 'Timestamp',
    };
    return colNames[key];
  };

  const dataRows = sortedPoints.map((p, index) => {
    const row: Record<string, any> = {};
    settings.selectedColumns.forEach((col) => {
      const colName = getColName(col);
      switch (col) {
        case 'seq': row[colName] = index + 1; break;
        case 'id': row[colName] = p.id; break;
        case 'name': row[colName] = p.name; break;
        case 'description': row[colName] = p.description || ''; break;
        case 'category': row[colName] = getCategoryLabel(p.category, lang); break;
        case 'zone': {
          const band = getMGRSBandFromLat(p.lat);
          row[colName] = `${p.utm.zone}${band}`;
          break;
        }
        case 'hemisphere': row[colName] = p.utm.hemisphere === 'N' ? (isAr ? 'شمال (N)' : 'N') : (isAr ? 'جنوب (S)' : 'S'); break;
        case 'easting': row[colName] = p.utm.easting; break;
        case 'northing': row[colName] = p.utm.northing; break;
        case 'elevation': row[colName] = p.elevation !== undefined ? p.elevation : ''; break;
        case 'latitude': row[colName] = p.lat; break;
        case 'longitude': row[colName] = p.lng; break;
        case 'mgrs': row[colName] = latLngToMGRS(p.lat, p.lng); break;
        case 'timestamp': row[colName] = new Date(p.timestamp).toLocaleString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }); break;
      }
    });
    return row;
  });

  if (settings.orientation === 'vertical') {
    // Transpose data
    const transposed: Record<string, any>[] = [];
    settings.selectedColumns.forEach((col) => {
      const row: Record<string, any> = { [isAr ? 'الحقل / النقطة' : 'Field / Point']: getColName(col) };
      sortedPoints.forEach((p, idx) => {
        row[`${isAr ? 'نقطة' : 'Point'} ${idx + 1}`] = dataRows[idx][getColName(col)];
      });
      transposed.push(row);
    });
    return transposed;
  }

  return dataRows;
}

/**
 * Exports Survey Points to a formatted Excel file (.xlsx)
 */
export function exportPointsToExcel(points: SurveyPoint[], lang: Language = 'ar', settings?: ExportSettings): void {
  if (points.length === 0) {
    alert(lang === 'ar' ? 'لا توجد نقاط لتصديرها!' : 'No points to export!');
    return;
  }

  const isAr = lang === 'ar';
  const defaultSettings: ExportSettings = {
    selectedColumns: ['seq', 'name', 'zone', 'easting', 'northing', 'elevation', 'mgrs', 'latitude', 'longitude', 'category', 'description', 'timestamp'],
    orientation: 'horizontal'
  };
  
  const activeSettings = settings || defaultSettings;
  const dataRows = generateExportData(points, lang, activeSettings);

  // Create sheet & workbook
  const worksheet = XLSX.utils.json_to_sheet(dataRows);

  // Enable Right-to-Left (RTL) view for Arabic
  if (isAr) {
    worksheet['!views'] = [{ RTL: true }];
  }

  // Set standard column widths if horizontal
  if (activeSettings.orientation === 'horizontal') {
    const colWidths = activeSettings.selectedColumns.map(col => {
      switch(col) {
        case 'seq': return { wch: 8 };
        case 'id': return { wch: 16 };
        case 'name': return { wch: 22 };
        case 'description': return { wch: 30 };
        case 'category': return { wch: 22 };
        case 'zone': return { wch: 16 };
        case 'hemisphere': return { wch: 18 };
        case 'easting': return { wch: 22 };
        case 'northing': return { wch: 22 };
        case 'elevation': return { wch: 16 };
        case 'latitude': return { wch: 18 };
        case 'longitude': return { wch: 18 };
        case 'mgrs': return { wch: 22 };
        case 'timestamp': return { wch: 24 };
        default: return { wch: 18 };
      }
    });
    worksheet['!cols'] = colWidths;
  } else {
    // vertical width
    const colWidths = [{ wch: 25 }, ...points.map(() => ({ wch: 20 }))];
    worksheet['!cols'] = colWidths;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, isAr ? 'نقاط UTM' : 'UTM Survey Points');

  // Format date for filename
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const fileName = `UTM_Survey_Points_${dateStr}_${timeStr}.xlsx`;

  // Write file
  XLSX.writeFile(workbook, fileName);
}

/**
 * Parses imported Excel File (.xlsx, .xls, .csv) into SurveyPoint array
 */
export async function parseExcelToPoints(file: File): Promise<SurveyPoint[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

        if (!rawJson || rawJson.length === 0) {
          throw new Error('ملف إكسل فارغ أو غير صالحة بياناته');
        }

        const importedPoints: SurveyPoint[] = [];

        rawJson.forEach((row, idx) => {
          // Normalize key names
          const normalizedRow: Record<string, any> = {};
          Object.keys(row).forEach((k) => {
            normalizedRow[k.trim().toLowerCase()] = row[k];
          });

          // Helper to search value across potential header names
          const getValue = (...keys: string[]) => {
            for (const key of keys) {
              for (const rowKey of Object.keys(normalizedRow)) {
                if (rowKey.includes(key.toLowerCase())) {
                  return normalizedRow[rowKey];
                }
              }
            }
            return undefined;
          };

          const name = getValue('اسم', 'name', 'label', 'نقطة') || `نقطة مستوردة ${idx + 1}`;
          const description = getValue('وصف', 'desc', 'notes', 'بيانات', 'تفاصيل') || '';
          const categoryRaw = getValue('مجلد', 'المجلد', 'تصنيف', 'التصنيف', 'category', 'folder', 'layer', 'group', 'type', 'نوع');
          const categoryStr = categoryRaw ? String(categoryRaw).trim() : '';
          const category = (categoryStr && !['other', 'Other', 'OTHER', 'أخرى', 'عام', 'General', 'general'].includes(categoryStr))
            ? categoryStr
            : undefined;

          // Look for UTM values
          let easting = parseFloat(getValue('easting', 'شرقي', 'الشرقي', 'x') || 0);
          let northing = parseFloat(getValue('northing', 'شمالي', 'الشمالي', 'y') || 0);
          let zone = parseInt(getValue('zone', 'منطقة', 'المنطقة') || 0, 10);
          let hemisphereVal = String(getValue('hemisphere', 'نصف', 'كرة', 'شمال/جنوب') || 'N').toUpperCase();
          const hemisphere: Hemisphere = hemisphereVal.includes('S') || hemisphereVal.includes('جنوب') ? 'S' : 'N';

          let elevation = parseFloat(getValue('ارتفاع', 'منسوب', 'elevation', 'z') || 0);
          if (isNaN(elevation)) elevation = undefined as any;

          // Check if Easting & Northing are available
          if (!isNaN(easting) && !isNaN(northing) && easting > 0 && northing > 0) {
            // Default zone to 37 if missing
            if (!zone || isNaN(zone) || zone < 1 || zone > 60) {
              zone = 37; // Standard Middle East default zone if omitted
            }

            const utm = { easting, northing, zone, hemisphere };
            const { lat, lng } = utmToLatLng(utm);

            importedPoints.push({
              id: `pt_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
              name: String(name),
              description: String(description),
              category,
              utm,
              lat,
              lng,
              elevation,
              timestamp: new Date().toISOString(),
              color: '#10b981', // Default emerald green
            });
          } else {
            // Check if Lat & Lng exist instead
            let lat = parseFloat(getValue('lat', 'latitude', 'عرض') || 0);
            let lng = parseFloat(getValue('lng', 'lon', 'longitude', 'طول') || 0);

            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
              const utm = latLngToUTM(lat, lng, zone > 0 ? zone : null);
              importedPoints.push({
                id: `pt_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
                name: String(name),
                description: String(description),
                category,
                utm,
                lat,
                lng,
                elevation,
                timestamp: new Date().toISOString(),
                color: '#3b82f6', // Default blue
              });
            }
          }
        });

        resolve(importedPoints);
      } catch (err: any) {
        reject(err?.message || 'تعذر قراءة ملف الإكسل');
      }
    };

    reader.onerror = () => reject('حدث خطأ أثناء تحميل الملف');
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Helper to calculate line length for annotation lines
 */
function getLineLength(pts: { lat: number; lng: number }[]): number {
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const phi1 = (pts[i].lat * Math.PI) / 180;
    const phi2 = (pts[i + 1].lat * Math.PI) / 180;
    const deltaPhi = ((pts[i + 1].lat - pts[i].lat) * Math.PI) / 180;
    const deltaLambda = ((pts[i + 1].lng - pts[i].lng) * Math.PI) / 180;
    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    total += 6371000 * c;
  }
  return Math.round(total * 100) / 100;
}

/**
 * Exports full project data (Points + Lines + Labels + Summary) to a styled Excel workbook with 4 sheets
 */
export function exportFullProjectToExcel(points: SurveyPoint[], annotations: Annotation[], lang: Language = 'ar'): void {
  const isAr = lang === 'ar';
  const workbook = XLSX.utils.book_new();

  const sortedPoints = sortPointsList(points, 'chronological_asc');

  // ----------------------------------------------------
  // Sheet 1: Survey Points
  // ----------------------------------------------------
  const pointsHeaders = isAr
    ? {
        seq: 'ت',
        name: 'اسم النقطة',
        zone: 'منطقة UTM',
        easting: 'الإحداثي الشرقي (X)',
        northing: 'الإحداثي الشمالي (Y)',
        elevation: 'الارتفاع (Z)',
        mgrs: 'إحداثيات MGRS',
        latitude: 'خط العرض',
        longitude: 'خط الطول',
        category: 'التصنيف',
        description: 'الوصف',
        locked: 'مقفلة؟',
        color: 'اللون',
        timestamp: 'التاريخ',
        id: 'معرف النقطة (ID)',
      }
    : {
        seq: 'Seq',
        name: 'Name',
        zone: 'Zone',
        easting: 'Easting (X)',
        northing: 'Northing (Y)',
        elevation: 'Elevation (Z)',
        mgrs: 'MGRS Coordinates',
        latitude: 'Latitude',
        longitude: 'Longitude',
        category: 'Category',
        description: 'Description',
        locked: 'Locked',
        color: 'Color',
        timestamp: 'Timestamp',
        id: 'Point ID',
      };

  const pointsRows = sortedPoints.map((p, index) => ({
    [pointsHeaders.seq]: index + 1,
    [pointsHeaders.name]: p.name,
    [pointsHeaders.zone]: `${p.utm.zone}${getMGRSBandFromLat(p.lat)}`,
    [pointsHeaders.easting]: p.utm.easting,
    [pointsHeaders.northing]: p.utm.northing,
    [pointsHeaders.elevation]: p.elevation !== undefined ? p.elevation : '',
    [pointsHeaders.mgrs]: latLngToMGRS(p.lat, p.lng),
    [pointsHeaders.latitude]: p.lat,
    [pointsHeaders.longitude]: p.lng,
    [pointsHeaders.category]: getCategoryLabel(p.category, lang),
    [pointsHeaders.description]: p.description || '',
    [pointsHeaders.locked]: p.isLocked ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No'),
    [pointsHeaders.color]: p.color || '#10b981',
    [pointsHeaders.timestamp]: p.timestamp,
    [pointsHeaders.id]: p.id,
  }));

  const pointsSheet = XLSX.utils.json_to_sheet(pointsRows);
  if (isAr) pointsSheet['!views'] = [{ RTL: true }];
  pointsSheet['!cols'] = [
    { wch: 8 },  // seq
    { wch: 22 }, // name
    { wch: 14 }, // zone
    { wch: 20 }, // easting
    { wch: 20 }, // northing
    { wch: 16 }, // elevation
    { wch: 22 }, // mgrs
    { wch: 18 }, // lat
    { wch: 18 }, // lng
    { wch: 22 }, // category
    { wch: 25 }, // description
    { wch: 10 }, // locked
    { wch: 10 }, // color
    { wch: 24 }, // timestamp
    { wch: 18 }, // id
  ];
  XLSX.utils.book_append_sheet(workbook, pointsSheet, isAr ? 'النقاط' : 'Survey Points');

  // ----------------------------------------------------
  // Sheet 2: Annotation Lines
  // ----------------------------------------------------
  const linesHeaders = isAr
    ? {
        id: 'معرف الخط',
        name: 'اسم الخط',
        color: 'اللون',
        weight: 'السماكة',
        style: 'النمط',
        dashArray: 'نمط التقطيع',
        pointsCount: 'عدد العقد',
        totalLength: 'الطول الإجمالي (متر)',
        pointsUtm: 'نقاط (UTM)',
        pointsWgs: 'نقاط (WGS84)',
        createdAt: 'تاريخ الإنشاء',
      }
    : {
        id: 'ID',
        name: 'Name',
        color: 'Color',
        weight: 'Weight',
        style: 'Style',
        dashArray: 'Dash Array',
        pointsCount: 'Points Count',
        totalLength: 'Total Length (m)',
        pointsUtm: 'Points (UTM)',
        pointsWgs: 'Points (WGS84)',
        createdAt: 'Created At',
      };

  const lineAnnotations = annotations.filter((a) => a.type === 'line') as AnnotationLine[];
  const linesRows = lineAnnotations.map((line) => {
    const totalLen = getLineLength(line.points);
    const utmCoordsStr = line.points.map((pt) => `${pt.utm.easting},${pt.utm.northing}`).join(' | ');
    const wgsCoordsStr = line.points.map((pt) => `${pt.lat},${pt.lng}`).join(' | ');

    return {
      [linesHeaders.id]: line.id,
      [linesHeaders.name]: line.name,
      [linesHeaders.color]: line.color || '#ef4444',
      [linesHeaders.weight]: line.weight || 3,
      [linesHeaders.style]: line.dashArray ? (isAr ? 'متقطع' : 'Dashed') : (isAr ? 'متصل' : 'Solid'),
      [linesHeaders.dashArray]: line.dashArray || '',
      [linesHeaders.pointsCount]: line.points.length,
      [linesHeaders.totalLength]: totalLen,
      [linesHeaders.pointsUtm]: utmCoordsStr,
      [linesHeaders.pointsWgs]: wgsCoordsStr,
      [linesHeaders.createdAt]: line.createdAt,
    };
  });

  const linesSheet = XLSX.utils.json_to_sheet(linesRows);
  linesSheet['!cols'] = [
    { wch: 18 }, // id
    { wch: 20 }, // name
    { wch: 10 }, // color
    { wch: 10 }, // weight
    { wch: 12 }, // style
    { wch: 14 }, // dashArray
    { wch: 14 }, // pointsCount
    { wch: 18 }, // totalLength
    { wch: 40 }, // pointsUtm
    { wch: 40 }, // pointsWgs
    { wch: 24 }, // createdAt
  ];
  XLSX.utils.book_append_sheet(workbook, linesSheet, isAr ? 'الخطوط التوضيحية' : 'Annotation Lines');

  // ----------------------------------------------------
  // Sheet 3: Text Labels
  // ----------------------------------------------------
  const labelsHeaders = isAr
    ? {
        id: 'معرف النص',
        content: 'محتوى النص',
        zone: 'منطقة UTM',
        easting: 'الإحداثي الشرقي',
        northing: 'الإحداثي الشمالي',
        latitude: 'خط العرض',
        longitude: 'خط الطول',
        fontSize: 'حجم الخط',
        color: 'اللون',
        background: 'لون الخلفية',
        rotation: 'التدوير (درجات)',
        createdAt: 'تاريخ الإنشاء',
      }
    : {
        id: 'ID',
        content: 'Content',
        zone: 'Zone',
        easting: 'Easting',
        northing: 'Northing',
        latitude: 'Latitude',
        longitude: 'Longitude',
        fontSize: 'Font Size',
        color: 'Color',
        background: 'Background',
        rotation: 'Rotation',
        createdAt: 'Created At',
      };

  const textAnnotations = annotations.filter((a) => a.type === 'text') as AnnotationText[];
  const labelsRows = textAnnotations.map((text) => ({
    [labelsHeaders.id]: text.id,
    [labelsHeaders.content]: text.content,
    [labelsHeaders.zone]: text.utm.zone,
    [labelsHeaders.easting]: text.utm.easting,
    [labelsHeaders.northing]: text.utm.northing,
    [labelsHeaders.latitude]: text.lat,
    [labelsHeaders.longitude]: text.lng,
    [labelsHeaders.fontSize]: text.fontSize || 16,
    [labelsHeaders.color]: text.color || '#ffffff',
    [labelsHeaders.background]: text.backgroundColor || 'transparent',
    [labelsHeaders.rotation]: text.rotation || 0,
    [labelsHeaders.createdAt]: text.createdAt,
  }));

  const labelsSheet = XLSX.utils.json_to_sheet(labelsRows);
  labelsSheet['!cols'] = [
    { wch: 18 }, // id
    { wch: 25 }, // content
    { wch: 12 }, // zone
    { wch: 18 }, // easting
    { wch: 18 }, // northing
    { wch: 16 }, // lat
    { wch: 16 }, // lng
    { wch: 12 }, // fontSize
    { wch: 10 }, // color
    { wch: 16 }, // background
    { wch: 12 }, // rotation
    { wch: 24 }, // createdAt
  ];
  XLSX.utils.book_append_sheet(workbook, labelsSheet, isAr ? 'النصوص التوضيحية' : 'Text Labels');

  // ----------------------------------------------------
  // Sheet 4: Project Summary
  // ----------------------------------------------------
  const summaryHeaders = isAr
    ? {
        field: 'الحقل / العنصر',
        value: 'القيمة',
      }
    : {
        field: 'Field',
        value: 'Value',
      };

  const uniqueZones = Array.from(new Set(points.map((p) => `${p.utm.zone}${p.utm.hemisphere}`)));

  const summaryRows = [
    { [summaryHeaders.field]: isAr ? 'اسم التطبيق' : 'App Name', [summaryHeaders.value]: 'المساح (Almussah)' },
    { [summaryHeaders.field]: isAr ? 'تاريخ التصدير' : 'Export Date', [summaryHeaders.value]: new Date().toLocaleString(isAr ? 'ar-SA-u-nu-latn' : 'en-US') },
    { [summaryHeaders.field]: isAr ? 'إجمالي النقاط' : 'Total Points', [summaryHeaders.value]: points.length },
    { [summaryHeaders.field]: isAr ? 'إجمالي الخطوط التوضيحية' : 'Total Lines', [summaryHeaders.value]: lineAnnotations.length },
    { [summaryHeaders.field]: isAr ? 'إجمالي النصوص التوضيحية' : 'Total Labels', [summaryHeaders.value]: textAnnotations.length },
    { [summaryHeaders.field]: isAr ? 'مناطق UTM المستخدمة' : 'UTM Zones Used', [summaryHeaders.value]: uniqueZones.join(', ') || '-' },
    { [summaryHeaders.field]: isAr ? 'لغة التطبيق' : 'Language', [summaryHeaders.value]: lang === 'ar' ? 'العربية' : 'English' },
    { [summaryHeaders.field]: isAr ? 'إصدار الملف' : 'Version', [summaryHeaders.value]: '1.0' },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet['!cols'] = [
    { wch: 30 }, // field
    { wch: 35 }, // value
  ];
  XLSX.utils.book_append_sheet(workbook, summarySheet, isAr ? 'ملخص المشروع' : 'Project Summary');

  // Generate Filename
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const fileName = `Almussah_Project_${year}-${month}-${day}_${hours}-${mins}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}

