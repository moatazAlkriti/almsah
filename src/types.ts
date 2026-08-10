export type Hemisphere = 'N' | 'S';

export interface UTMCoordinate {
  easting: number;     // X (Meters, usually 100,000 to 900,000)
  northing: number;    // Y (Meters, 0 to 10,000,000)
  zone: number;        // UTM Zone (1 to 60)
  hemisphere: Hemisphere; // 'N' for Northern, 'S' for Southern
}

export type PointCategory = 
  | 'control_point'    // نقطة ضبط أرضي (GCP)
  | 'boundary'         // نقطة حدود
  | 'elevation'        // منسوب / ارتفاع
  | 'infrastructure'   // بنية تحتية
  | 'feature'          // معلم جغرافي
  | 'other';           // أخرى

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
}

export interface ContextMenuData {
  pointId: string;
  x: number;
  y: number;
}

export type TileLayerType = 'satellite' | 'hybrid' | 'streets' | 'topo' | 'dark';

export type Language = 'ar' | 'en';

export type ExportColumnKey = 
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
  | 'timestamp';

export interface ExportSettings {
  selectedColumns: ExportColumnKey[];
  orientation: 'horizontal' | 'vertical';
}

export interface MeasurePoint {
  id: string;
  lat: number;
  lng: number;
  utm: UTMCoordinate;
}

export interface DistanceMeasurement {
  points: MeasurePoint[];
  totalDistanceMeters: number;
}
