import { SurveyPoint, Annotation, AnnotationLine, AnnotationText, Language, TileLayerType, PinStyle, PointLabelPosition } from '../types';
import { latLngToUTM } from './utm';

export interface FullBackup {
  version: string;           // "1.0"
  app: string;               // "Almussah"
  exportDate: string;        // ISO date
  language: Language;
  data: {
    points: SurveyPoint[];
    annotations: Annotation[];
    categories?: string[];
    settings: {
      activeTileLayer: TileLayerType;
      manualZoneOverride: number | null;
      isSnappingEnabled: boolean;
      isContinuousAddMode: boolean;
      autoFetchElevation: boolean;
      pinStyle?: PinStyle;
      pinSize?: number;
      pointLabelSize?: number;
      pointLabelPosition?: PointLabelPosition;
      showPointLabels?: boolean;
    };
  };
}

export interface ImportResult {
  pointsCount: number;
  linesCount: number;
  labelsCount: number;
  warnings: string[];
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point' | 'LineString';
    coordinates: any;
  };
  properties: Record<string, any>;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  name: string;
  exportDate: string;
  features: GeoJSONFeature[];
}

/**
 * Helper to trigger browser download of a string content
 */
export function triggerFileDownload(content: string, fileName: string, contentType: string): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper to reliably extract folder / category name from any standard GIS properties
 */
export function extractPointCategory(props: Record<string, any>): string | undefined {
  if (!props || typeof props !== 'object') return undefined;

  const candidateKeys = [
    'category', 'Category', 'CATEGORY',
    'folder', 'Folder', 'FOLDER',
    'folderName', 'folder_name', 'FolderName', 'FOLDER_NAME', 'folder_Name',
    'layer', 'Layer', 'LAYER',
    'layerName', 'layer_name', 'LayerName', 'LAYER_NAME',
    'group', 'Group', 'GROUP',
    'groupName', 'group_name', 'GroupName',
    'directory', 'Directory',
    'classification', 'Classification',
    'type', 'Type',
    'collection', 'Collection',
    'tag', 'Tag',
  ];

  for (const key of candidateKeys) {
    const val = props[key];
    if (val !== undefined && val !== null) {
      const strVal = String(val).trim();
      // Only treat as a folder/category if it's not empty and not generic placeholder
      if (
        strVal &&
        !['other', 'Other', 'OTHER', 'أخرى', 'عام', 'General', 'general', 'undefined', 'null', '[object Object]'].includes(strVal)
      ) {
        return strVal;
      }
    }
  }

  return undefined;
}

/**
 * 2) Export to GeoJSON
 */
export function exportToGeoJSON(points: SurveyPoint[], annotations: Annotation[]): GeoJSONFeatureCollection {
  const features: GeoJSONFeature[] = [];

  // 1. Survey Points
  points.forEach((p) => {
    const categoryName = (p.category || '').trim();
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [p.lng, p.lat],
      },
      properties: {
        featureType: 'survey_point',
        id: p.id,
        name: p.name,
        description: p.description || '',
        category: categoryName || undefined,
        folder: categoryName || undefined,
        folderName: categoryName || undefined,
        layer: categoryName || undefined,
        group: categoryName || undefined,
        elevation: p.elevation !== undefined ? p.elevation : null,
        color: p.color || '#10b981',
        isLocked: !!p.isLocked,
        utm: {
          zone: p.utm.zone,
          hemisphere: p.utm.hemisphere,
          easting: p.utm.easting,
          northing: p.utm.northing,
        },
        timestamp: p.timestamp,
      },
    });
  });

  // 2. Annotations
  annotations.forEach((ann) => {
    if (ann.type === 'line') {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: ann.points.map((pt) => [pt.lng, pt.lat]),
        },
        properties: {
          featureType: 'annotation_line',
          id: ann.id,
          name: ann.name,
          color: ann.color || '#ef4444',
          weight: ann.weight || 3,
          dashArray: ann.dashArray || null,
          totalLengthMeters: calculateLineLength(ann.points),
          createdAt: ann.createdAt,
        },
      });
    } else if (ann.type === 'text') {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [ann.lng, ann.lat],
        },
        properties: {
          featureType: 'text_label',
          id: ann.id,
          content: ann.content,
          fontSize: ann.fontSize || 16,
          color: ann.color || '#ffffff',
          backgroundColor: ann.backgroundColor || 'transparent',
          rotation: ann.rotation || 0,
          utm: {
            zone: ann.utm.zone,
            hemisphere: ann.utm.hemisphere,
            easting: ann.utm.easting,
            northing: ann.utm.northing,
          },
          createdAt: ann.createdAt,
        },
      });
    }
  });

  return {
    type: 'FeatureCollection',
    name: 'Almussah_Project',
    exportDate: new Date().toISOString(),
    features,
  };
}

/**
 * Calculates geodesic length of line segments in meters
 */
function calculateLineLength(points: { lat: number; lng: number }[]): number {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    total += haversineDistance(p1.lat, p1.lng, p2.lat, p2.lng);
  }
  return Math.round(total * 100) / 100;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * 3) Export Full Backup
 */
export function exportFullBackup(
  points: SurveyPoint[],
  annotations: Annotation[],
  settings: {
    activeTileLayer: TileLayerType;
    manualZoneOverride: number | null;
    isSnappingEnabled: boolean;
    isContinuousAddMode: boolean;
    autoFetchElevation: boolean;
    pinStyle?: PinStyle;
    pinSize?: number;
    pointLabelSize?: number;
    pointLabelPosition?: PointLabelPosition;
    showPointLabels?: boolean;
  },
  language: Language,
  categories?: string[]
): FullBackup {
  const allCategories = Array.from(
    new Set([
      ...(categories || []),
      ...points
        .map((p) => (p.category || '').trim())
        .filter(
          (c) =>
            c !== '' &&
            !['other', 'Other', 'OTHER', 'أخرى', 'عام', 'General', 'general'].includes(c)
        ),
    ])
  );

  return {
    version: '1.0',
    app: 'Almussah',
    exportDate: new Date().toISOString(),
    language,
    data: {
      points,
      annotations,
      categories: allCategories,
      settings,
    },
  };
}

/**
 * 4) Import Full Backup from JSON
 */
export async function parseBackupFile(file: File): Promise<FullBackup> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const backup = JSON.parse(text) as FullBackup;

        if (!backup || typeof backup !== 'object') {
          reject(new Error('invalid_json'));
          return;
        }

        if (backup.app !== 'Almussah') {
          reject(new Error('invalid_app'));
          return;
        }

        if (backup.version !== '1.0') {
          reject(new Error('unsupported_version'));
          return;
        }

        if (!backup.data || !Array.isArray(backup.data.points) || !Array.isArray(backup.data.annotations)) {
          reject(new Error('invalid_data_structure'));
          return;
        }

        resolve(backup);
      } catch (err) {
        reject(new Error('corrupt_file'));
      }
    };
    reader.onerror = () => reject(new Error('read_error'));
    reader.readAsText(file);
  });
}

/**
 * 5) Import GeoJSON from file
 */
export async function parseGeoJSONFile(file: File): Promise<GeoJSONFeatureCollection> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const geojson = JSON.parse(text) as GeoJSONFeatureCollection;

        if (!geojson || geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
          reject(new Error('invalid_geojson_structure'));
          return;
        }

        resolve(geojson);
      } catch (err) {
        reject(new Error('corrupt_file'));
      }
    };
    reader.onerror = () => reject(new Error('read_error'));
    reader.readAsText(file);
  });
}

/**
 * Convert GeoJSON FeatureCollection to application models
 */
export function processImportedGeoJSON(geojson: GeoJSONFeatureCollection, existingPoints: SurveyPoint[]): ImportResult & {
  points: SurveyPoint[];
  annotations: Annotation[];
  categories: string[];
} {
  const points: SurveyPoint[] = [];
  const annotations: Annotation[] = [];
  const warnings: string[] = [];
  const categorySet = new Set<string>();
  let pointsCount = 0;
  let linesCount = 0;
  let labelsCount = 0;

  const existingIds = new Set(existingPoints.map((p) => p.id));
  const existingNames = new Set(existingPoints.map((p) => p.name.trim().toLowerCase()));

  geojson.features.forEach((feature, idx) => {
    try {
      const props = feature.properties || {};
      const geom = feature.geometry;

      if (!geom || !geom.type || !geom.coordinates) {
        warnings.push(`Feature #${idx + 1} lacks valid geometry, skipped.`);
        return;
      }

      const featureType = props.featureType;

      // Classify if not explicitly marked
      let resolvedType: 'survey_point' | 'annotation_line' | 'text_label' | null = null;
      if (featureType === 'survey_point' || featureType === 'annotation_line' || featureType === 'text_label') {
        resolvedType = featureType;
      } else {
        if (geom.type === 'Point') {
          if (props.content !== undefined || props.text !== undefined || props.label !== undefined) {
            resolvedType = 'text_label';
          } else {
            resolvedType = 'survey_point';
          }
        } else if (geom.type === 'LineString') {
          resolvedType = 'annotation_line';
        }
      }

      if (!resolvedType) {
        warnings.push(`Feature #${idx + 1} has unknown geometry type ${geom.type}, skipped.`);
        return;
      }

      if (resolvedType === 'survey_point') {
        const coords = geom.coordinates as [number, number];
        const [lng, lat] = coords;

        if (isNaN(lng) || isNaN(lat)) {
          warnings.push(`Feature #${idx + 1} contains invalid coordinate values, skipped.`);
          return;
        }

        // Calculate UTM
        let utm = props.utm;
        if (!utm || isNaN(utm.easting) || isNaN(utm.northing)) {
          utm = latLngToUTM(lat, lng);
        }

        const id = props.id || `pt_imported_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
        let name = (props.name || `GCP-${String(idx + 1).padStart(3, '0')}`).trim();

        // Avoid exact duplicate ID or name+coords in existing points
        if (existingIds.has(id)) {
          warnings.push(`Point ID "${id}" duplicate. Generating a unique ID.`);
        }

        const finalId = existingIds.has(id) ? `pt_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}` : id;

        // Extract folder / category properly
        const category = extractPointCategory(props);
        if (category) {
          categorySet.add(category);
        }

        points.push({
          id: finalId,
          name,
          description: props.description || '',
          utm,
          lat,
          lng,
          category: category || undefined,
          elevation: props.elevation !== undefined && props.elevation !== null ? Number(props.elevation) : undefined,
          color: props.color || '#10b981',
          isLocked: !!props.isLocked,
          timestamp: props.timestamp || new Date().toISOString(),
        });
        pointsCount++;
      } else if (resolvedType === 'annotation_line') {
        const coordsList = geom.coordinates as [number, number][];
        if (!Array.isArray(coordsList) || coordsList.length < 2) {
          warnings.push(`Line #${idx + 1} has insufficient points, skipped.`);
          return;
        }

        const linePoints = coordsList.map(([lng, lat]) => ({
          lat,
          lng,
          utm: latLngToUTM(lat, lng),
        }));

        annotations.push({
          id: props.id || `line_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          type: 'line',
          name: props.name || `Line-${String(idx + 1).padStart(3, '0')}`,
          points: linePoints,
          color: props.color || '#ef4444',
          weight: Number(props.weight) || 3,
          dashArray: props.dashArray || undefined,
          createdAt: props.createdAt || new Date().toISOString(),
        } as AnnotationLine);
        linesCount++;
      } else if (resolvedType === 'text_label') {
        const coords = geom.coordinates as [number, number];
        const [lng, lat] = coords;

        if (isNaN(lng) || isNaN(lat)) {
          warnings.push(`Text label #${idx + 1} contains invalid coordinates, skipped.`);
          return;
        }

        let utm = props.utm;
        if (!utm || isNaN(utm.easting) || isNaN(utm.northing)) {
          utm = latLngToUTM(lat, lng);
        }

        annotations.push({
          id: props.id || `text_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          type: 'text',
          content: props.content || props.text || props.label || 'Text Label',
          lat,
          lng,
          utm,
          fontSize: Number(props.fontSize) || 16,
          color: props.color || '#ffffff',
          backgroundColor: props.backgroundColor || 'transparent',
          rotation: Number(props.rotation) || 0,
          createdAt: props.createdAt || new Date().toISOString(),
        } as AnnotationText);
        labelsCount++;
      }
    } catch (err: any) {
      warnings.push(`Error processing feature #${idx + 1}: ${err?.message || 'unknown error'}`);
    }
  });

  return {
    points,
    annotations,
    categories: Array.from(categorySet),
    pointsCount,
    linesCount,
    labelsCount,
    warnings,
  };
}
