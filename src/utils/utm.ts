import proj4 from 'proj4';
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

export function getLatitudeBand(lat: number): string {
  if (lat >= 84 || lat < -80) return '';
  const bands = 'CDEFGHJKLMNPQRSTUVWX';
  const index = Math.floor((lat + 80) / 8);
  return bands.charAt(Math.max(0, Math.min(19, index)));
}

/**
 * Formats UTM coordinate as readable string e.g. "37S 452100.50 m E, 2735100.20 m N"
 */
export function formatUTMString(utm: UTMCoordinate, lang: 'ar' | 'en' = 'ar'): string {
  const { lat } = utmToLatLng(utm);
  const band = getLatitudeBand(lat) || utm.hemisphere;
  
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
  const band = getLatitudeBand(lat) || utm.hemisphere;
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
