import { SurveyPoint, Annotation } from '../types';
import { triggerFileDownload } from './exportImport';

export type CadFormat = 'scr' | 'dxf';

export interface DxfExportOptions {
  cadFormat: CadFormat;          // 'scr' (Script), 'dxf' (CAD drawing)
  selectedCategory: string;      // 'all' | '__uncategorized__' | specific folder name
  separateLayersByFolder: boolean; // Create distinct layers for each folder/category
  textHeight: number;            // Text height in meters (e.g., 0.5, 1.0, 2.0, 5.0)
  includeElevation: boolean;     // Include Z-coordinates and elevation text
  includePointNames: boolean;    // Include point labels/numbers
  includeDescriptions: boolean;  // Include category and description labels
  includeLines: boolean;         // Include annotation lines (false by default for points-only)
  pointMarkerSize: number;       // Point display symbol size (PDSIZE)
  pointMarkerType: 35 | 3 | 2 | 34; // 35: Circle with X, 3: X, 2: Cross, 34: Circle with cross
}

export const defaultDxfOptions: DxfExportOptions = {
  cadFormat: 'scr',
  selectedCategory: 'all',
  separateLayersByFolder: true,
  textHeight: 1.0,
  includeElevation: true,
  includePointNames: true,
  includeDescriptions: true,
  includeLines: false, // Default to false: user wants points only
  pointMarkerSize: 1.0,
  pointMarkerType: 35,
};

/**
 * Filter points based on category / folder scope
 */
export function filterPointsByScope(
  points: SurveyPoint[],
  scope: string
): SurveyPoint[] {
  if (!scope || scope === 'all') {
    return points;
  }
  if (scope === '__uncategorized__') {
    return points.filter((p) => !p.category || p.category.trim() === '');
  }
  return points.filter((p) => p.category === scope);
}

/**
 * Sanitizes layer names for AutoCAD (alphanumeric, underscores, hyphens)
 */
export function sanitizeLayerName(name: string, prefix = 'PT'): string {
  if (!name || name.trim() === '') return `${prefix}_POINTS`;
  const cleaned = name
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 25);
  return `${prefix}_${cleaned || 'POINTS'}`;
}

/**
 * Sanitizes text to be safe for ASCII/UTF-8 DXF and Script format
 */
function sanitizeDxfText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[\^;"]/g, ' ')
    .trim();
}

/**
 * Generates an AutoCAD Script (.scr) file.
 * Universally compatible with AutoCAD 2000 through 2026.
 * Executes automatically: creates layers, plots points & text, and runs Zoom Extents.
 */
export function generateAutoCadScript(
  points: SurveyPoint[],
  options: Partial<DxfExportOptions> = {}
): string {
  const opts: DxfExportOptions = { ...defaultDxfOptions, ...options };
  const filteredPoints = filterPointsByScope(points, opts.selectedCategory);
  const th = Math.max(0.1, opts.textHeight);

  if (filteredPoints.length === 0) {
    return '; No points to export\r\n';
  }

  const lines: string[] = [];

  // Script Header
  lines.push('; ========================================================');
  lines.push('; ALMUSSAH GIS SURVEYOR - AUTOCAD SCRIPT (.SCR)');
  lines.push('; Universal AutoCAD Point Import (All versions 2000-2026)');
  lines.push('; How to run: Drag & Drop into AutoCAD or type SCRIPT');
  lines.push('; ========================================================');

  // Disable prompts & object snap during execution
  lines.push('_CMDECHO 0');
  lines.push('_OSMODE 0');
  lines.push(`_PDMODE ${opts.pointMarkerType || 35}`);
  lines.push(`_PDSIZE ${opts.pointMarkerSize || 1.0}`);

  // Setup text style ALM_TXT with height 0 so _TEXT command prompts are completely predictable
  // In AutoCAD: -STYLE <Name> <Font> <Height> <Width> <Angle> <Backwards> <UpsideDown>
  lines.push('-STYLE ALM_TXT Arial 0.0 1.0 0 N N');
  lines.push(''); // Blank line to finish -STYLE

  // Create layers in one go, followed by blank line to cleanly exit -LAYER command
  lines.push('-LAYER M PT_POINTS C 2 PT_POINTS M PT_NAMES C 4 PT_NAMES M PT_ELEVATIONS C 3 PT_ELEVATIONS M PT_DESCRIPTIONS C 6 PT_DESCRIPTIONS ');
  lines.push(''); // Crucial blank line to exit -LAYER

  // 1. Draw Points under layer PT_POINTS
  lines.push('CLAYER PT_POINTS');
  filteredPoints.forEach((p) => {
    const x = p.utm.easting.toFixed(4);
    const y = p.utm.northing.toFixed(4);
    const z = (opts.includeElevation && p.elevation !== undefined ? p.elevation : 0).toFixed(4);
    lines.push(`_POINT ${x},${y},${z}`);
  });
  lines.push('');

  const textOffsetX = 0.7 * th;

  // 2. Draw Point Names under layer PT_NAMES
  if (opts.includePointNames) {
    lines.push('CLAYER PT_NAMES');
    filteredPoints.forEach((p, idx) => {
      const ptName = sanitizeDxfText(p.name || `P${idx + 1}`);
      const nameX = (p.utm.easting + textOffsetX).toFixed(4);
      const nameY = (p.utm.northing + 0.35 * th).toFixed(4);
      const z = (opts.includeElevation && p.elevation !== undefined ? p.elevation : 0).toFixed(4);
      lines.push(`_TEXT ${nameX},${nameY},${z} ${th.toFixed(3)} 0 ${ptName}`);
      lines.push(''); // Crucial blank line to finish TEXT prompt
    });
  }

  // 3. Draw Elevations under layer PT_ELEVATIONS
  if (opts.includeElevation) {
    lines.push('CLAYER PT_ELEVATIONS');
    filteredPoints.forEach((p) => {
      if (p.elevation !== undefined) {
        const elevText = `${p.elevation.toFixed(2)}m`;
        const elevX = (p.utm.easting + textOffsetX).toFixed(4);
        const elevY = (p.utm.northing - 0.9 * th).toFixed(4);
        const z = p.elevation.toFixed(4);
        lines.push(`_TEXT ${elevX},${elevY},${z} ${(th * 0.85).toFixed(3)} 0 ${elevText}`);
        lines.push(''); // Crucial blank line to finish TEXT prompt
      }
    });
  }

  // 4. Draw Descriptions under layer PT_DESCRIPTIONS
  if (opts.includeDescriptions) {
    lines.push('CLAYER PT_DESCRIPTIONS');
    filteredPoints.forEach((p) => {
      const desc = sanitizeDxfText(p.description || p.category || '');
      if (desc) {
        const descX = (p.utm.easting + textOffsetX).toFixed(4);
        const descY = (p.utm.northing - (p.elevation !== undefined ? 1.95 : 0.9) * th).toFixed(4);
        const z = (opts.includeElevation && p.elevation !== undefined ? p.elevation : 0).toFixed(4);
        lines.push(`_TEXT ${descX},${descY},${z} ${(th * 0.8).toFixed(3)} 0 ${desc}`);
        lines.push(''); // Crucial blank line to finish TEXT prompt
      }
    });
  }

  // Auto Zoom Extents immediately so user sees all points centered on screen
  lines.push('; --- AUTO ZOOM EXTENTS & FINALIZE ---');
  lines.push('_ZOOM');
  lines.push('_E');
  lines.push('_REGEN');
  lines.push('_CMDECHO 1');
  lines.push('');

  return lines.join('\r\n');
}

/**
 * Generates an AutoCAD-compatible DXF (Drawing Exchange Format) string.
 * Strictly formatted to AutoCAD R12 (AC1009) specification.
 * 100% compatible with AutoCAD 2000-2026, Civil 3D, QGIS, and all CAD tools.
 */
export function generateDxfContent(
  points: SurveyPoint[],
  annotations: Annotation[] = [],
  options: Partial<DxfExportOptions> = {}
): string {
  const opts: DxfExportOptions = { ...defaultDxfOptions, ...options };
  const filteredPoints = filterPointsByScope(points, opts.selectedCategory);
  const th = Math.max(0.1, opts.textHeight);

  // Compute extents (Bounding Box)
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  filteredPoints.forEach((p) => {
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

  const lines: string[] = [];

  const add = (code: number, value: string | number) => {
    lines.push(code.toString().padStart(3, ' '));
    lines.push(value.toString());
  };

  // 1. HEADER SECTION (Strict R12 AC1009)
  add(0, 'SECTION');
  add(2, 'HEADER');
  add(9, '$ACADVER');
  add(1, 'AC1009');
  add(9, '$PDMODE');
  add(70, opts.pointMarkerType || 35);
  add(9, '$PDSIZE');
  add(40, opts.pointMarkerSize || 1.0);
  add(9, '$EXTMIN');
  add(10, minX.toFixed(4));
  add(20, minY.toFixed(4));
  add(30, minZ.toFixed(4));
  add(9, '$EXTMAX');
  add(10, maxX.toFixed(4));
  add(20, maxY.toFixed(4));
  add(30, maxZ.toFixed(4));
  add(0, 'ENDSEC');

  // 2. TABLES SECTION (Standard R12 LAYER table)
  add(0, 'SECTION');
  add(2, 'TABLES');
  add(0, 'TABLE');
  add(2, 'LAYER');
  add(70, 6);

  // Layer 0
  add(0, 'LAYER');
  add(2, '0');
  add(70, 0);
  add(62, 7);
  add(6, 'CONTINUOUS');

  // PT_POINTS
  add(0, 'LAYER');
  add(2, 'PT_POINTS');
  add(70, 0);
  add(62, 2); // Yellow
  add(6, 'CONTINUOUS');

  // PT_NAMES
  add(0, 'LAYER');
  add(2, 'PT_NAMES');
  add(70, 0);
  add(62, 4); // Cyan
  add(6, 'CONTINUOUS');

  // PT_ELEVATIONS
  add(0, 'LAYER');
  add(2, 'PT_ELEVATIONS');
  add(70, 0);
  add(62, 3); // Green
  add(6, 'CONTINUOUS');

  // PT_DESCRIPTIONS
  add(0, 'LAYER');
  add(2, 'PT_DESCRIPTIONS');
  add(70, 0);
  add(62, 6); // Magenta
  add(6, 'CONTINUOUS');

  // SURVEY_LINES
  add(0, 'LAYER');
  add(2, 'SURVEY_LINES');
  add(70, 0);
  add(62, 1); // Red
  add(6, 'CONTINUOUS');

  add(0, 'ENDTAB');
  add(0, 'ENDSEC');

  // 3. ENTITIES SECTION
  add(0, 'SECTION');
  add(2, 'ENTITIES');

  const textOffsetX = 0.7 * th;

  filteredPoints.forEach((point, idx) => {
    const x = point.utm.easting;
    const y = point.utm.northing;
    const z = opts.includeElevation && point.elevation !== undefined ? point.elevation : 0;

    // 1. POINT entity
    add(0, 'POINT');
    add(8, 'PT_POINTS');
    add(10, x.toFixed(4));
    add(20, y.toFixed(4));
    add(30, z.toFixed(4));

    // 2. Point Name / ID Text (Top-Right)
    if (opts.includePointNames) {
      const ptName = sanitizeDxfText(point.name || `P${idx + 1}`);
      const nameY = y + 0.35 * th;
      add(0, 'TEXT');
      add(8, 'PT_NAMES');
      add(10, (x + textOffsetX).toFixed(4));
      add(20, nameY.toFixed(4));
      add(30, z.toFixed(4));
      add(40, th.toFixed(3));
      add(1, ptName);
      add(50, 0.0);
    }

    // 3. Elevation Text (Bottom-Right)
    if (opts.includeElevation && point.elevation !== undefined) {
      const elevY = y - 0.9 * th;
      const elevStr = `${point.elevation.toFixed(2)}m`;
      add(0, 'TEXT');
      add(8, 'PT_ELEVATIONS');
      add(10, (x + textOffsetX).toFixed(4));
      add(20, elevY.toFixed(4));
      add(30, z.toFixed(4));
      add(40, (th * 0.85).toFixed(3));
      add(1, elevStr);
      add(50, 0.0);
    }

    // 4. Description / Category Text (Lower-Right)
    if (opts.includeDescriptions) {
      const desc = sanitizeDxfText(point.description || point.category || '');
      if (desc) {
        const descY = y - (point.elevation !== undefined ? 1.95 : 0.9) * th;
        add(0, 'TEXT');
        add(8, 'PT_DESCRIPTIONS');
        add(10, (x + textOffsetX).toFixed(4));
        add(20, descY.toFixed(4));
        add(30, z.toFixed(4));
        add(40, (th * 0.8).toFixed(3));
        add(1, desc);
        add(50, 0.0);
      }
    }
  });

  // Export Annotation Lines
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
      }
    });
  }

  add(0, 'ENDSEC');
  add(0, 'EOF');

  return lines.join('\r\n') + '\r\n';
}

/**
 * Triggers downloading the project as an AutoCAD Script (.scr)
 */
export function exportProjectToScript(
  points: SurveyPoint[],
  options: Partial<DxfExportOptions> = {}
): void {
  const content = generateAutoCadScript(points, options);
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const scopeSuffix = options.selectedCategory && options.selectedCategory !== 'all'
    ? `_${options.selectedCategory.replace(/\s+/g, '_')}`
    : '_AllPoints';

  const fileName = `AutoCAD_Points${scopeSuffix}_${year}${month}${day}.scr`;
  triggerFileDownload(content, fileName, 'application/x-autocad;charset=utf-8;');
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

  const scopeSuffix = options.selectedCategory && options.selectedCategory !== 'all'
    ? `_${options.selectedCategory.replace(/\s+/g, '_')}`
    : '_AllPoints';

  const fileName = `AutoCAD_Drawing${scopeSuffix}_${year}${month}${day}.dxf`;
  triggerFileDownload(content, fileName, 'application/dxf;charset=utf-8;');
}
