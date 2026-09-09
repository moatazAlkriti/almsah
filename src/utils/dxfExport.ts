import { SurveyPoint, Annotation } from '../types';
import { triggerFileDownload } from './exportImport';

export interface DxfExportOptions {
  textHeight: number;            // Text height in meters (e.g., 0.5, 1.0, 2.0)
  includeElevation: boolean;     // Include Z-coordinates and elevation text
  includePointNames: boolean;    // Include point labels/numbers
  includeDescriptions: boolean;  // Include category and description labels
  includeLines: boolean;         // Include annotation lines and polylines
  pointMarkerSize: number;       // Point display symbol size (PDSIZE)
  pointMarkerType: 35 | 3 | 2 | 34; // 35: Circle with X, 3: X, 2: Cross, 34: Circle with cross
}

export const defaultDxfOptions: DxfExportOptions = {
  textHeight: 1.0,
  includeElevation: true,
  includePointNames: true,
  includeDescriptions: true,
  includeLines: true,
  pointMarkerSize: 1.0,
  pointMarkerType: 35,
};

/**
 * Sanitizes text to be safe for ASCII/UTF-8 DXF format
 */
function sanitizeDxfText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[\^;]/g, ' ')
    .trim();
}

/**
 * Generates an AutoCAD-compatible DXF (Drawing Exchange Format) string
 * Compatible with AutoCAD R12 through 2026, Civil 3D, QGIS, and all CAD viewers.
 */
export function generateDxfContent(
  points: SurveyPoint[],
  annotations: Annotation[] = [],
  options: Partial<DxfExportOptions> = {}
): string {
  const opts: DxfExportOptions = { ...defaultDxfOptions, ...options };
  const th = Math.max(0.1, opts.textHeight);

  // Compute extents (Bounding Box)
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  points.forEach((p) => {
    const x = p.utm.easting;
    const y = p.utm.northing;
    const z = opts.includeElevation && p.elevation !== undefined ? p.elevation : 0;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  });

  if (opts.includeLines) {
    annotations.forEach((a) => {
      if (a.type === 'line') {
        a.points.forEach((pt) => {
          const x = pt.utm.easting;
          const y = pt.utm.northing;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        });
      } else if (a.type === 'text') {
        const x = a.utm.easting;
        const y = a.utm.northing;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    });
  }

  if (minX === Infinity) {
    minX = 0;
    maxX = 100;
    minY = 0;
    maxY = 100;
    minZ = 0;
    maxZ = 0;
  }

  const paddingX = Math.max(10, (maxX - minX) * 0.1);
  const paddingY = Math.max(10, (maxY - minY) * 0.1);
  const extMinX = minX - paddingX;
  const extMaxX = maxX + paddingX;
  const extMinY = minY - paddingY;
  const extMaxY = maxY + paddingY;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const viewHeight = Math.max(20, (maxY - minY) * 1.25);
  const aspectRatio = (maxX - minX) / Math.max(1, maxY - minY) || 1.33;

  const lines: string[] = [];

  const add = (code: number, value: string | number) => {
    lines.push(code.toString().padStart(3, ' '));
    lines.push(value.toString());
  };

  // ----------------------------------------------------
  // 1. HEADER SECTION
  // ----------------------------------------------------
  add(0, 'SECTION');
  add(2, 'HEADER');

  // AutoCAD Version: AC1009 (R12 ASCII DXF - universally compatible without dependencies)
  add(9, '$ACADVER');
  add(1, 'AC1009');

  // Insertion Units: 4 = Meters
  add(9, '$INSUNITS');
  add(70, 4);

  // Measurement: 1 = Metric
  add(9, '$MEASUREMENT');
  add(70, 1);

  // Point display style & size
  add(9, '$PDMODE');
  add(70, opts.pointMarkerType);
  add(9, '$PDSIZE');
  add(40, opts.pointMarkerSize);

  // Drawing Extents
  add(9, '$EXTMIN');
  add(10, extMinX.toFixed(4));
  add(20, extMinY.toFixed(4));
  add(30, minZ.toFixed(4));

  add(9, '$EXTMAX');
  add(10, extMaxX.toFixed(4));
  add(20, extMaxY.toFixed(4));
  add(30, maxZ.toFixed(4));

  add(0, 'ENDSEC');

  // ----------------------------------------------------
  // 2. TABLES SECTION
  // ----------------------------------------------------
  add(0, 'SECTION');
  add(2, 'TABLES');

  // Active Viewport (Auto-centers on project upon opening)
  add(0, 'TABLE');
  add(2, 'VPORT');
  add(70, 1);
  add(0, 'VPORT');
  add(2, '*ACTIVE');
  add(70, 0);
  add(10, 0.0);
  add(20, 0.0);
  add(11, 1.0);
  add(21, 1.0);
  add(12, centerX.toFixed(4));
  add(22, centerY.toFixed(4));
  add(13, 0.0);
  add(23, 0.0);
  add(14, 1.0);
  add(24, 1.0);
  add(15, 0.0);
  add(25, 0.0);
  add(40, viewHeight.toFixed(4));
  add(41, aspectRatio.toFixed(4));
  add(76, 1);
  add(0, 'ENDTAB');

  // Line Types Table
  add(0, 'TABLE');
  add(2, 'LTYPE');
  add(70, 1);
  add(0, 'LTYPE');
  add(2, 'CONTINUOUS');
  add(70, 0);
  add(3, 'Solid line');
  add(72, 65);
  add(73, 0);
  add(40, 0.0);
  add(0, 'ENDTAB');

  // Layers Table (Professional Surveying Layers with Standard ACI Colors)
  add(0, 'TABLE');
  add(2, 'LAYER');
  add(70, 5);

  // Layer 1: SURVEY_POINTS (Yellow = Color 2)
  add(0, 'LAYER');
  add(2, 'SURVEY_POINTS');
  add(70, 0);
  add(62, 2); // Yellow
  add(6, 'CONTINUOUS');

  // Layer 2: POINT_NAMES (Cyan = Color 4)
  add(0, 'LAYER');
  add(2, 'POINT_NAMES');
  add(70, 0);
  add(62, 4); // Cyan
  add(6, 'CONTINUOUS');

  // Layer 3: POINT_ELEVATIONS (Green = Color 3)
  add(0, 'LAYER');
  add(2, 'POINT_ELEVATIONS');
  add(70, 0);
  add(62, 3); // Green
  add(6, 'CONTINUOUS');

  // Layer 4: POINT_DESCRIPTIONS (Magenta = Color 6)
  add(0, 'LAYER');
  add(2, 'POINT_DESCRIPTIONS');
  add(70, 0);
  add(62, 6); // Magenta
  add(6, 'CONTINUOUS');

  // Layer 5: SURVEY_LINES (Red = Color 1)
  add(0, 'LAYER');
  add(2, 'SURVEY_LINES');
  add(70, 0);
  add(62, 1); // Red
  add(6, 'CONTINUOUS');

  add(0, 'ENDTAB');

  // Styles Table
  add(0, 'TABLE');
  add(2, 'STYLE');
  add(70, 1);
  add(0, 'STYLE');
  add(2, 'STANDARD');
  add(70, 0);
  add(40, 0.0);
  add(41, 1.0);
  add(50, 0.0);
  add(71, 0);
  add(42, 0.2);
  add(3, 'txt');
  add(4, '');
  add(0, 'ENDTAB');

  add(0, 'ENDSEC');

  // ----------------------------------------------------
  // 3. BLOCKS SECTION (Empty)
  // ----------------------------------------------------
  add(0, 'SECTION');
  add(2, 'BLOCKS');
  add(0, 'ENDSEC');

  // ----------------------------------------------------
  // 4. ENTITIES SECTION
  // ----------------------------------------------------
  add(0, 'SECTION');
  add(2, 'ENTITIES');

  // Export Points
  points.forEach((point) => {
    const x = point.utm.easting;
    const y = point.utm.northing;
    const z = opts.includeElevation && point.elevation !== undefined ? point.elevation : 0;

    // 1. POINT entity
    add(0, 'POINT');
    add(8, 'SURVEY_POINTS');
    add(10, x.toFixed(4));
    add(20, y.toFixed(4));
    add(30, z.toFixed(4));

    // Spacing offsets for clean, non-overlapping surveyor text
    const textOffsetX = 0.7 * th;

    // 2. Point Name / ID Text (Top-Right)
    if (opts.includePointNames && point.name) {
      const nameY = y + 0.35 * th;
      add(0, 'TEXT');
      add(8, 'POINT_NAMES');
      add(10, (x + textOffsetX).toFixed(4));
      add(20, nameY.toFixed(4));
      add(30, z.toFixed(4));
      add(40, th.toFixed(3));
      add(1, sanitizeDxfText(point.name));
      add(50, 0.0);
    }

    // 3. Elevation Text (Bottom-Right)
    if (opts.includeElevation && point.elevation !== undefined) {
      const elevY = y - 0.9 * th;
      const elevStr = `${point.elevation.toFixed(2)}m`;
      add(0, 'TEXT');
      add(8, 'POINT_ELEVATIONS');
      add(10, (x + textOffsetX).toFixed(4));
      add(20, elevY.toFixed(4));
      add(30, z.toFixed(4));
      add(40, (th * 0.85).toFixed(3));
      add(1, elevStr);
      add(50, 0.0);
    }

    // 4. Description / Category Text (Lower-Right)
    if (opts.includeDescriptions) {
      const desc = point.description || point.category;
      if (desc) {
        const descY = y - (point.elevation !== undefined ? 1.95 : 0.9) * th;
        add(0, 'TEXT');
        add(8, 'POINT_DESCRIPTIONS');
        add(10, (x + textOffsetX).toFixed(4));
        add(20, descY.toFixed(4));
        add(30, z.toFixed(4));
        add(40, (th * 0.8).toFixed(3));
        add(1, sanitizeDxfText(desc));
        add(50, 0.0);
      }
    }
  });

  // Export Annotation Lines & Polylines
  if (opts.includeLines && annotations.length > 0) {
    annotations.forEach((annot) => {
      if (annot.type === 'line' && annot.points && annot.points.length > 1) {
        for (let i = 0; i < annot.points.length - 1; i++) {
          const p1 = annot.points[i];
          const p2 = annot.points[i + 1];

          add(0, 'LINE');
          add(8, 'SURVEY_LINES');
          add(10, p1.utm.easting.toFixed(4));
          add(20, p1.utm.northing.toFixed(4));
          add(30, 0.0);
          add(11, p2.utm.easting.toFixed(4));
          add(21, p2.utm.northing.toFixed(4));
          add(31, 0.0);
        }
      } else if (annot.type === 'text') {
        add(0, 'TEXT');
        add(8, 'POINT_DESCRIPTIONS');
        add(10, annot.utm.easting.toFixed(4));
        add(20, annot.utm.northing.toFixed(4));
        add(30, 0.0);
        add(40, (th * 1.2).toFixed(3));
        add(1, sanitizeDxfText(annot.content));
        add(50, (annot.rotation || 0.0).toFixed(1));
      }
    });
  }

  add(0, 'ENDSEC');

  // ----------------------------------------------------
  // 5. END OF FILE
  // ----------------------------------------------------
  add(0, 'EOF');

  return lines.join('\r\n') + '\r\n';
}

/**
 * Generates Civil 3D PNEZD format (Point, Northing, Easting, Elevation, Description)
 * Comma-separated format natively imported into Civil 3D COGO Points
 */
export function generateCivil3dPointsCSV(points: SurveyPoint[]): string {
  const rows: string[] = ['Point,Northing,Easting,Elevation,Description'];

  points.forEach((p, index) => {
    const pointNum = p.name ? p.name.replace(/,/g, ' ') : `${index + 1}`;
    const northing = p.utm.northing.toFixed(4);
    const easting = p.utm.easting.toFixed(4);
    const elevation = (p.elevation !== undefined ? p.elevation : 0).toFixed(3);
    const desc = (p.description || p.category || 'SURVEY').replace(/,/g, ' ');

    rows.push(`${pointNum},${northing},${easting},${elevation},${desc}`);
  });

  return rows.join('\r\n');
}

/**
 * Triggers downloading the project as an AutoCAD DXF file
 */
export function exportProjectToDxf(
  points: SurveyPoint[],
  annotations: Annotation[] = [],
  options: Partial<DxfExportOptions> = {}
): void {
  const content = generateDxfContent(points, annotations, options);
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');

  const fileName = `Almussah_CAD_${year}-${month}-${day}_${hours}-${mins}.dxf`;
  triggerFileDownload(content, fileName, 'application/dxf;charset=utf-8;');
}

/**
 * Triggers downloading Civil 3D PNEZD CSV
 */
export function exportCivil3dCSV(points: SurveyPoint[]): void {
  const content = generateCivil3dPointsCSV(points);
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');

  const fileName = `Civil3D_PNEZD_${year}-${month}-${day}_${hours}-${mins}.csv`;
  triggerFileDownload(content, fileName, 'text/csv;charset=utf-8;');
}
