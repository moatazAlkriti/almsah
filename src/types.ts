export type Hemisphere = 'N' | 'S';

export interface UTMCoordinate {
  easting: number;     // X (Meters, usually 100,000 to 900,000)
  northing: number;    // Y (Meters, 0 to 10,000,000)
  zone: number;        // UTM Zone (1 to 60)
  hemisphere: Hemisphere; // 'N' for Northern, 'S' for Southern
}

export type PointCategory = string;

export interface SurveyPoint {
  id: string;
  name: string;
  description?: string;
  utm: UTMCoordinate;
  lat: number;
  lng: number;
  timestamp: string; // ISO date string
  color?: string;
  category?: PointCategory;
  elevation?: number; // Optional Z elevation in meters
  isLocked?: boolean; // Locked points cannot be dragged or accidentally deleted
}

export interface PointMoveHistory {
  pointId: string;
  pointName: string;
  previousLat: number;
  previousLng: number;
  previousUtm: UTMCoordinate;
  newLat: number;
  newLng: number;
  newUtm: UTMCoordinate;
  distanceMeters: number;
}

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  text: string;
  type?: ToastType;
}

export interface MapPopoverCoords {
  lat: number;
  lng: number;
  utm: UTMCoordinate;
  x: number;
  y: number;
  elevation?: number;
}

export interface TempMapClickCoords {
  lat: number;
  lng: number;
  utm: UTMCoordinate;
  elevation?: number;
  category?: string;
}

export interface ContextMenuData {
  pointId: string;
  x: number;
  y: number;
}

export type TileLayerType = 'satellite' | 'hybrid' | 'streets' | 'topo' | 'dark';

export type Language = 'ar' | 'en';

export type ExportColumnKey = 
  | 'seq'
  | 'id'
  | 'name'
  | 'description'
  | 'category'
  | 'zone'
  | 'hemisphere'
  | 'easting'
  | 'northing'
  | 'elevation'
  | 'latitude'
  | 'longitude'
  | 'mgrs'
  | 'timestamp';

export interface ExportSettings {
  selectedColumns: ExportColumnKey[];
  orientation: 'horizontal' | 'vertical';
  sortBy?: 'chronological_asc' | 'chronological_desc' | 'name_numeric' | 'name_alpha';
}

export interface MeasurePoint {
  id: string;
  lat: number;
  lng: number;
  utm: UTMCoordinate;
  elevation?: number;
  fromPointId?: string;
  fromPointName?: string;
}

export interface DistanceMeasurement {
  points: MeasurePoint[];
  totalDistanceMeters: number;
}

export type AnnotationType = 'line' | 'text';

export interface AnnotationPoint { lat: number; lng: number; utm: UTMCoordinate; }

export interface AnnotationLine {
  id: string; type: 'line'; name: string;
  points: AnnotationPoint[];
  color: string; weight: number; dashArray?: string;
  createdAt: string;
}

export interface AnnotationText {
  id: string; type: 'text'; content: string;
  lat: number; lng: number; utm: UTMCoordinate;
  fontSize: number; color: string;
  backgroundColor?: string; rotation?: number;
  createdAt: string;
}

export type Annotation = AnnotationLine | AnnotationText;

export type PinStyle = 'google_pin' | 'classic_marker' | 'circle_dot';
export type PointLabelPosition = 'bottom' | 'top' | 'right' | 'left' | 'hidden';

export interface ImportResult {
  pointsCount: number;
  linesCount: number;
  labelsCount: number;
  warnings: string[];
}
