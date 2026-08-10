import * as XLSX from 'xlsx';
import { SurveyPoint, Language, PointCategory, Hemisphere, ExportSettings, ExportColumnKey } from '../types';
import { utmToLatLng, latLngToUTM, getUTMZoneFromLng, getHemisphereFromLat } from './utm';

/**
 * Category translation helper
 */
export function getCategoryLabel(category?: PointCategory, lang: Language = 'ar'): string {
  if (!category) return lang === 'ar' ? 'عام' : 'General';
  
  const labels: Record<PointCategory, { ar: string; en: string }> = {
    control_point: { ar: 'نقطة ضبط أرضي (GCP)', en: 'Ground Control Point' },
    boundary: { ar: 'نقطة حدود', en: 'Boundary Marker' },
    elevation: { ar: 'نقطة منسوب', en: 'Elevation Point' },
    infrastructure: { ar: 'بنية تحتية', en: 'Infrastructure' },
    feature: { ar: 'معلم جغرافي', en: 'Feature' },
    other: { ar: 'أخرى', en: 'Other' },
  };

  return labels[category]?.[lang] || (lang === 'ar' ? 'عام' : 'General');
}

/**
 * Parses label back to PointCategory enum
 */
export function parseCategoryLabel(labelStr?: string): PointCategory {
  if (!labelStr) return 'other';
  const str = labelStr.toLowerCase();
  if (str.includes('ضبط') || str.includes('gcp') || str.includes('control')) return 'control_point';
  if (str.includes('حدود') || str.includes('bound')) return 'boundary';
  if (str.includes('منسوب') || str.includes('ارتفاع') || str.includes('elev')) return 'elevation';
  if (str.includes('تحتية') || str.includes('infrastr')) return 'infrastructure';
  if (str.includes('معلم') || str.includes('feat')) return 'feature';
  return 'other';
}

export function generateExportData(points: SurveyPoint[], lang: Language, settings: ExportSettings) {
  const isAr = lang === 'ar';
  
  const getColName = (key: ExportColumnKey) => {
    const colNames = {
      id: isAr ? 'معرف النقطة (ID)' : 'Point ID',
      name: isAr ? 'اسم النقطة' : 'Point Name',
      description: isAr ? 'الوصف والبيانات' : 'Description',
      category: isAr ? 'التصنيف' : 'Category',
      zone: isAr ? 'منطقة UTM (Zone)' : 'UTM Zone',
      hemisphere: isAr ? 'نصف الكرة (Hemisphere)' : 'Hemisphere',
      easting: isAr ? 'الإحداثي الشرقي Easting (m)' : 'Easting X (m)',
      northing: isAr ? 'الإحداثي الشمالي Northing (m)' : 'Northing Y (m)',
      elevation: isAr ? 'الارتفاع (متر)' : 'Elevation Z (m)',
      latitude: isAr ? 'خط العرض (Latitude)' : 'Latitude',
      longitude: isAr ? 'خط الطول (Longitude)' : 'Longitude',
      timestamp: isAr ? 'تاريخ التسجيل' : 'Timestamp',
    };
    return colNames[key];
  };

  const dataRows = points.map((p) => {
    const row: Record<string, any> = {};
    settings.selectedColumns.forEach((col) => {
      const colName = getColName(col);
      switch (col) {
        case 'id': row[colName] = p.id; break;
        case 'name': row[colName] = p.name; break;
        case 'description': row[colName] = p.description || ''; break;
        case 'category': row[colName] = getCategoryLabel(p.category, lang); break;
        case 'zone': row[colName] = p.utm.zone; break;
        case 'hemisphere': row[colName] = p.utm.hemisphere === 'N' ? (isAr ? 'شمال (N)' : 'N') : (isAr ? 'جنوب (S)' : 'S'); break;
        case 'easting': row[colName] = p.utm.easting; break;
        case 'northing': row[colName] = p.utm.northing; break;
        case 'elevation': row[colName] = p.elevation !== undefined ? p.elevation : '-'; break;
        case 'latitude': row[colName] = p.lat; break;
        case 'longitude': row[colName] = p.lng; break;
        case 'timestamp': row[colName] = new Date(p.timestamp).toLocaleString(isAr ? 'ar-SA' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }); break;
      }
    });
    return row;
  });

  if (settings.orientation === 'vertical') {
    // Transpose data
    const transposed: Record<string, any>[] = [];
    settings.selectedColumns.forEach((col) => {
      const row: Record<string, any> = { 'Field / Point': getColName(col) };
      points.forEach((p, idx) => {
        row[`Point ${idx + 1}`] = dataRows[idx][getColName(col)];
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
    selectedColumns: ['id', 'name', 'description', 'category', 'zone', 'hemisphere', 'easting', 'northing', 'elevation', 'timestamp'],
    orientation: 'horizontal'
  };
  
  const activeSettings = settings || defaultSettings;
  const dataRows = generateExportData(points, lang, activeSettings);

  // Create sheet & workbook
  const worksheet = XLSX.utils.json_to_sheet(dataRows);

  // Set standard column widths if horizontal
  if (activeSettings.orientation === 'horizontal') {
    const colWidths = activeSettings.selectedColumns.map(col => {
      switch(col) {
        case 'id': return { wch: 16 };
        case 'name': return { wch: 20 };
        case 'description': return { wch: 30 };
        case 'category': return { wch: 22 };
        case 'zone': return { wch: 18 };
        case 'hemisphere': return { wch: 22 };
        case 'easting': return { wch: 26 };
        case 'northing': return { wch: 26 };
        case 'elevation': return { wch: 16 };
        case 'latitude': return { wch: 20 };
        case 'longitude': return { wch: 20 };
        case 'timestamp': return { wch: 24 };
        default: return { wch: 20 };
      }
    });
    worksheet['!cols'] = colWidths;
  } else {
    // vertical width
    const colWidths = [{ wch: 25 }, ...points.map(() => ({ wch: 20 }))];
    worksheet['!cols'] = colWidths;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, isAr ? 'نقاط المساحة UTM' : 'UTM Survey Points');

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
          const categoryStr = getValue('تصنيف', 'category', 'type', 'نوع') || 'other';
          const category = parseCategoryLabel(String(categoryStr));

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
