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
  if (!name || name.trim() === '') return `${prefix}_DEFAULT`;
  // Clean special characters while allowing Arabic / English letters and numbers
  const cleaned = name
    .trim()
    .replace(/[\s\/\\]+/g, '_')
    .replace(/[^\w\u0600-\u06FF\-_]/g, '');
  return `${prefix}_${cleaned || 'DEFAULT'}`;
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
 * This is universally compatible with every AutoCAD version (2000 through 2026).
 * Users can simply drag & drop the .scr file into AutoCAD or type SCRIPT command.
 */
export function generateAutoCadScript(
  points: SurveyPoint[],
  options: Partial<DxfExportOptions> = {}
): string {
  const opts: DxfExportOptions = { ...defaultDxfOptions, ...options };
  const filteredPoints = filterPointsByScope(points, opts.selectedCategory);
  const th = Math.max(0.1, opts.textHeight);

  const lines: string[] = [
    '; ========================================================',
    '; ALMUSSAH GIS SURVEYOR - AUTOCAD SCRIPT (.SCR)',
    '; Point Coordinate Import Script',
    '; How to run: Drag & Drop this file into an open AutoCAD window,',
    '; or type SCRIPT in the AutoCAD command bar and select this file.',
    '; ========================================================',
    '_CMDECHO 0',
    '_OSMODE 0',
    `_PDMODE ${opts.pointMarkerType}`,
    `_PDSIZE ${opts.pointMarkerSize}`,
    // Set standard text style height to 0.0 to ensure predictable text command parameters
    '-STYLE STANDARD Arial 0.0 1.0 0 N N N',
    '',
    '; --- LAYER DEFINITIONS ---',
  ];

  // Colors cycle for folder layers (AutoCAD Color Index: 1=Red, 2=Yellow, 3=Green, 4=Cyan, 5=Blue, 6=Magenta)
  const aciColors = [2, 4, 3, 6, 1, 5, 30, 40, 50, 140, 200];
  const uniqueFolders = Array.from(
    new Set(filteredPoints.map((p) => p.category?.trim() || 'UNCATEGORIZED'))
  );

  // Map folders to layers
  const folderLayers = new Map<string, { layer: string; color: number }>();
  uniqueFolders.forEach((folder, idx) => {
    const layerName = sanitizeLayerName(folder, 'PT');
    const color = aciColors[idx % aciColors.length];
    folderLayers.set(folder, { layer: layerName, color });
    lines.push(`-LAYER _M "${layerName}" _C ${color} "${layerName}" `);
  });

  // Base layers for labels and elevations
  lines.push(`-LAYER _M "PT_NAMES" _C 4 "PT_NAMES" `);
  lines.push(`-LAYER _M "PT_ELEVATIONS" _C 3 "PT_ELEVATIONS" `);
  lines.push(`-LAYER _M "PT_DESCRIPTIONS" _C 6 "PT_DESCRIPTIONS" `);
  lines.push('');
  lines.push('; --- INSERT POINTS AND LABELS ---');

  const textOffsetX = 0.7 * th;

  filteredPoints.forEach((p, idx) => {
    const x = p.utm.easting.toFixed(4);
    const y = p.utm.northing.toFixed(4);
    const z = (opts.includeElevation && p.elevation !== undefined ? p.elevation : 0).toFixed(4);

    const folderKey = p.category?.trim() || 'UNCATEGORIZED';
    const folderInfo = folderLayers.get(folderKey) || { layer: 'PT_DEFAULT', color: 2 };

    // 1. Draw Point Entity
    lines.push(`-LAYER _S "${folderInfo.layer}" `);
    lines.push(`_POINT ${x},${y},${z}`);

    // 2. Draw Point Name (Top-Right)
    if (opts.includePointNames) {
      const ptName = sanitizeDxfText(p.name || `P${idx + 1}`);
      const nameX = (p.utm.easting + textOffsetX).toFixed(4);
      const nameY = (p.utm.northing + 0.35 * th).toFixed(4);
      lines.push(`-LAYER _S "PT_NAMES" `);
      lines.push(`_TEXT ${nameX},${nameY},${z} ${th.toFixed(3)} 0 "${ptName}"`);
    }

    // 3. Draw Elevation (Bottom-Right)
    if (opts.includeElevation && p.elevation !== undefined) {
      const elevText = `${p.elevation.toFixed(2)}m`;
      const elevX = (p.utm.easting + textOffsetX).toFixed(4);
      const elevY = (p.utm.northing - 0.9 * th).toFixed(4);
      lines.push(`-LAYER _S "PT_ELEVATIONS" `);
      lines.push(`_TEXT ${elevX},${elevY},${z} ${(th * 0.85).toFixed(3)} 0 "${elevText}"`);
    }

    // 4. Draw Description / Category (Lower-Right)
    if (opts.includeDescriptions) {
      const desc = sanitizeDxfText(p.description || p.category || '');
      if (desc) {
        const descX = (p.utm.easting + textOffsetX).toFixed(4);
        const descY = (p.utm.northing - (p.elevation !== undefined ? 1.95 : 0.9) * th).toFixed(4);
        lines.push(`-LAYER _S "PT_DESCRIPTIONS" `);
        lines.push(`_TEXT ${descX},${descY},${z} ${(th * 0.8).toFixed(3)} 0 "${desc}"`);
      }
    }
  });

  lines.push('');
  lines.push('; --- FINALIZE VIEW ---');
  lines.push('_ZOOM _E');
  lines.push('_REGEN');
  lines.push('_CMDECHO 1');
  lines.push('');

  return lines.join('\r\n');
}

/**
 * Generates an AutoCAD-compatible DXF (Drawing Exchange Format) string.
 * Compatible with AutoCAD R12 through 2026, Civil 3D, QGIS, and CAD viewers.
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

  // AC1009 (AutoCAD R12 ASCII DXF) - standard universally supported
  add(9, '$ACADVER');
  add(1, 'AC1009');

  add(9, '$DWGCODEPAGE');
  add(3, 'ANSI_1252');

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

  // Layers Table
  const uniqueFolders = Array.from(
    new Set(filteredPoints.map((p) => p.category?.trim() || 'UNCATEGORIZED'))
  );
  const totalLayers = uniqueFolders.length + 4; // Folders + Names + Elevations + Descriptions + Lines

  add(0, 'TABLE');
  add(2, 'LAYER');
  add(70, totalLayers);

  const aciColors = [2, 4, 3, 6, 1, 5, 30, 40, 50, 140, 200];
  uniqueFolders.forEach((folder, idx) => {
    const layerName = sanitizeLayerName(folder, 'PT');
    const color = aciColors[idx % aciColors.length];
    add(0, 'LAYER');
    add(2, layerName);
    add(70, 0);
    add(62, color);
    add(6, 'CONTINUOUS');
  });

  // Common label layers
  add(0, 'LAYER');
  add(2, 'POINT_NAMES');
  add(70, 0);
  add(62, 4); // Cyan
  add(6, 'CONTINUOUS');

  add(0, 'LAYER');
  add(2, 'POINT_ELEVATIONS');
  add(70, 0);
  add(62, 3); // Green
  add(6, 'CONTINUOUS');

  add(0, 'LAYER');
  add(2, 'POINT_DESCRIPTIONS');
  add(70, 0);
  add(62, 6); // Magenta
  add(6, 'CONTINUOUS');

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

  const textOffsetX = 0.7 * th;

  filteredPoints.forEach((point, idx) => {
    const x = point.utm.easting;
    const y = point.utm.northing;
    const z = opts.includeElevation && point.elevation !== undefined ? point.elevation : 0;

    const folderKey = point.category?.trim() || 'UNCATEGORIZED';
    const folderLayer = sanitizeLayerName(folderKey, 'PT');

    // 1. POINT entity
    add(0, 'POINT');
    add(8, folderLayer);
    add(10, x.toFixed(4));
    add(20, y.toFixed(4));
    add(30, z.toFixed(4));

    // 2. Point Name / ID Text (Top-Right)
    if (opts.includePointNames) {
      const ptName = sanitizeDxfText(point.name || `P${idx + 1}`);
      const nameY = y + 0.35 * th;
      add(0, 'TEXT');
      add(8, 'POINT_NAMES');
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
      const desc = sanitizeDxfText(point.description || point.category || '');
      if (desc) {
        const descY = y - (point.elevation !== undefined ? 1.95 : 0.9) * th;
        add(0, 'TEXT');
        add(8, 'POINT_DESCRIPTIONS');
        add(10, (x + textOffsetX).toFixed(4));
        add(20, descY.toFixed(4));
        add(30, z.toFixed(4));
        add(40, (th * 0.8).toFixed(3));
        add(1, desc);
        add(50, 0.0);
      }
    }
  });

  // Export Annotation Lines & Polylines only if explicitly requested
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

  // ----------------------------------------------------
  // 5. END OF FILE
  // ----------------------------------------------------
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
