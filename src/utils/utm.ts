import proj4 from 'proj4';
import * as mgrs from 'mgrs';
import { UTMCoordinate, Hemisphere } from '../types';

// WGS84 Projection string
const WGS84 = '+proj=longlat +datum=WGS84 +no_defs';

/**
 * Helper to construct proj4 UTM definition string
 */
function getUTMProjString(zone: number, hemisphere: Hemisphere): string {
  const southFlag = hemisphere === 'S' ? ' +south' : '';
  return `+proj=utm +zone=${zone}${southFlag} +datum=WGS84 +units=m +no_defs`;
}

/**
 * Calculates default UTM zone from Longitude (-180 to 180)
 */
export function getUTMZoneFromLng(lng: number): number {
  const normalizedLng = ((lng + 180) % 360 + 360) % 360 - 180;
  const zone = Math.floor((normalizedLng + 180) / 6) + 1;
  return Math.max(1, Math.min(60, zone));
}

/**
 * Calculates Hemisphere ('N' or 'S') from Latitude
 */
export function getHemisphereFromLat(lat: number): Hemisphere {
  return lat >= 0 ? 'N' : 'S';
}

/**
 * Converts Geographic (Lat, Lng) to UTM (Easting, Northing, Zone, Hemisphere)
 */
export function latLngToUTM(
  lat: number,
  lng: number,
  forcedZone?: number | null
): UTMCoordinate {
  const zone = forcedZone && forcedZone >= 1 && forcedZone <= 60 
    ? forcedZone 
    : getUTMZoneFromLng(lng);
  
  const hemisphere = getHemisphereFromLat(lat);
  const utmProj = getUTMProjString(zone, hemisphere);

  // Proj4 takes [lng, lat]
  const [easting, northing] = proj4(WGS84, utmProj, [lng, lat]);

  return {
    easting: Math.round(easting * 100) / 100, // Round to 2 decimal places (centimeter precision)
    northing: Math.round(northing * 100) / 100,
    zone,
    hemisphere,
  };
}

/**
 * Converts UTM (Easting, Northing, Zone, Hemisphere) to Geographic (Lat, Lng)
 */
export function utmToLatLng(utm: UTMCoordinate): { lat: number; lng: number } {
  const utmProj = getUTMProjString(utm.zone, utm.hemisphere);

  // Proj4 returns [lng, lat]
  const [lng, lat] = proj4(utmProj, WGS84, [utm.easting, utm.northing]);

  return {
    lat: Math.round(lat * 1e7) / 1e7,
    lng: Math.round(lng * 1e7) / 1e7,
  };
}

const MGRS_BANDS = 'CDEFGHJKLMNPQRSTUVWX'; // 20 نطاقاً، كل نطاق 8 درجات بدءاً من -80

export function getMGRSBandFromLat(lat: number): string {
  if (lat < -80 || lat > 84) return 'Z';
  const idx = Math.floor((lat + 80) / 8);
  return MGRS_BANDS[Math.min(idx, 19)];
}

export function getLatitudeBand(lat: number): string {
  return getMGRSBandFromLat(lat);
}

export function mgrsToLatLng(mgrsStr: string): { lat: number; lng: number } | null {
  try {
    const cleanStr = mgrsStr.replace(/\s+/g, '').toUpperCase();
    if (!cleanStr) return null;
    const [lng, lat] = mgrs.toPoint(cleanStr);
    if (isNaN(lat) || isNaN(lng)) return null;
    return {
      lat: Math.round(lat * 1e7) / 1e7,
      lng: Math.round(lng * 1e7) / 1e7,
    };
  } catch (err) {
    return null;
  }
}

export function mgrsToUTM(mgrsStr: string, forcedZone?: number | null): UTMCoordinate | null {
  const coords = mgrsToLatLng(mgrsStr);
  if (!coords) return null;
  return latLngToUTM(coords.lat, coords.lng, forcedZone);
}

/**
 * Calculates Azimuth Bearing in degrees (0 to 360) between two Lat/Lng coordinates
 */
export function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(radLat2);
  const x =
    Math.cos(radLat1) * Math.sin(radLat2) -
    Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLng);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round(((brng + 360) % 360) * 100) / 100;
}

/**
 * Converts DMS (Degrees, Minutes, Seconds) to Decimal Degrees
 */
export function dmsToDecimal(
  deg: number,
  min: number,
  sec: number,
  dir: 'N' | 'S' | 'E' | 'W'
): number {
  let dec = Math.abs(deg) + min / 60 + sec / 3600;
  if (dir === 'S' || dir === 'W') dec = -dec;
  return Math.round(dec * 1e7) / 1e7;
}

/**
 * Converts Decimal Degrees to DMS (Degrees, Minutes, Seconds)
 */
export function decimalToDMS(
  dec: number,
  isLat: boolean
): { deg: number; min: number; sec: number; dir: 'N' | 'S' | 'E' | 'W' } {
  const dir = isLat ? (dec >= 0 ? 'N' : 'S') : dec >= 0 ? 'E' : 'W';
  const abs = Math.abs(dec);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = Math.round((minFloat - min) * 60 * 100) / 100;
  return { deg, min, sec, dir };
}

/**
 * Converts Geographic (Lat, Lng) coordinates to full MGRS grid string e.g. "38S MB 12345 67890"
 */
export function latLngToMGRS(lat: number, lng: number): string {
  try {
    const raw = mgrs.forward([lng, lat], 5); // 5 digits = 1 meter precision
    const match = raw.match(/^(\d+)([A-Z])([A-Z]{2})(\d{5})(\d{5})$/);
    if (match) {
      const [_, zone, band, sq, east, north] = match;
      return `${zone}${band} ${sq} ${east} ${north}`;
    }
    return raw;
  } catch (err) {
    return '';
  }
}

/**
 * Formats UTM coordinate as readable string e.g. "37S 452100.50 m E, 2735100.20 m N"
 */
export function formatUTMString(utm: UTMCoordinate, lang: 'ar' | 'en' = 'ar'): string {
  const { lat } = utmToLatLng(utm);
  const band = getMGRSBandFromLat(lat);
  
  const eastFormatted = utm.easting.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const northFormatted = utm.northing.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const hemiLabel = utm.hemisphere === 'N' 
    ? (lang === 'ar' ? 'شمال' : 'N') 
    : (lang === 'ar' ? 'جنوب' : 'S');

  if (lang === 'ar') {
    return `المنطقة ${utm.zone}${band} (${hemiLabel}) | E: ${eastFormatted} م | N: ${northFormatted} م`;
  }
  return `Zone ${utm.zone}${band} | E: ${eastFormatted}m | N: ${northFormatted}m`;
}

/**
 * Formats UTM coordinate compact version
 */
export function formatUTMCompact(utm: UTMCoordinate): string {
  const { lat } = utmToLatLng(utm);
  const band = getMGRSBandFromLat(lat);
  return `${utm.zone}${band} E:${utm.easting.toFixed(2)} N:${utm.northing.toFixed(2)}`;
}

/**
 * Calculates Euclidean 2D distance between two UTM coordinates in same zone
 * If zones differ, converts both to Lat/Lng and calculates Haversine distance in meters.
 */
export function calculateUTMDistance(utm1: UTMCoordinate, utm2: UTMCoordinate): number {
  if (utm1.zone === utm2.zone && utm1.hemisphere === utm2.hemisphere) {
    const dx = utm1.easting - utm2.easting;
    const dy = utm1.northing - utm2.northing;
    return Math.sqrt(dx * dx + dy * dy);
  } else {
    // Cross-zone Haversine calculation
    const pt1 = utmToLatLng(utm1);
    const pt2 = utmToLatLng(utm2);
    return calculateHaversineDistance(pt1.lat, pt1.lng, pt2.lat, pt2.lng);
  }
}

/**
 * Calculates the azimuth/bearing angle between two UTM coordinates
 * 0/360 = North, 90 = East, 180 = South, 270 = West
 */
export function calculateUTMAngle(utm1: UTMCoordinate, utm2: UTMCoordinate): number {
  const dx = utm2.easting - utm1.easting;
  const dy = utm2.northing - utm1.northing;
  let angle = Math.atan2(dx, dy) * (180 / Math.PI);
  return (angle + 360) % 360;
}

/**
 * Haversine distance formula in meters
 */
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds points within a given distance radius (in meters) of a target UTM coordinate
 */
export function findNearbyPoints<T extends { utm: UTMCoordinate }>(
  targetUtm: UTMCoordinate,
  points: T[],
  maxRadiusMeters: number = 500
): { point: T; distanceMeters: number }[] {
  return points
    .map((point) => {
      const dist = calculateUTMDistance(targetUtm, point.utm);
      return { point, distanceMeters: Math.round(dist * 100) / 100 };
    })
    .filter((item) => item.distanceMeters <= maxRadiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/**
 * Validates UTM bounds
 */
export function validateUTM(utm: Partial<UTMCoordinate>): { valid: boolean; error?: string } {
  if (!utm.zone || utm.zone < 1 || utm.zone > 60) {
    return { valid: false, error: 'رقم المنطقة يجب أن يكون بين 1 و 60 (Zone must be 1-60)' };
  }
  if (!utm.hemisphere || (utm.hemisphere !== 'N' && utm.hemisphere !== 'S')) {
    return { valid: false, error: 'نصف الكرة يجب أن يكون N أو S (Hemisphere must be N or S)' };
  }
  if (utm.easting === undefined || isNaN(utm.easting) || utm.easting < 100000 || utm.easting > 900000) {
    return { valid: false, error: 'الإحداثي الشرقي Easting غير صحيح (عادة بين 100,000 و 900,000)' };
  }
  if (utm.northing === undefined || isNaN(utm.northing) || utm.northing < 0 || utm.northing > 10000000) {
    return { valid: false, error: 'الإحداثي الشمالي Northing غير صحيح (عادة بين 0 و 10,000,000)' };
  }
  return { valid: true };
}
