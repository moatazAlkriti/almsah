/**
 * Utility to fetch digital elevation data (SRTM) for lat/lng coordinates.
 * Primary API: Open-Elevation (api.open-elevation.com)
 * Fallback API: OpenTopoData (api.opentopodata.org)
 */

interface OpenElevationResponse {
  results?: Array<{
    elevation?: number;
    latitude?: number;
    longitude?: number;
  }>;
}

interface OpenTopoDataResponse {
  results?: Array<{
    elevation?: number | null;
  }>;
  status?: string;
}

export async function fetchElevation(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<number | null> {
  // Validate coordinates
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  // Create an internal timeout signal if none provided
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  const activeSignal = signal || controller.signal;

  try {
    // 1. Try Open-Elevation API first
    const primaryUrl = `https://api.open-elevation.com/api/v1/lookup?locations=${lat.toFixed(6)},${lng.toFixed(6)}`;
    const response = await fetch(primaryUrl, {
      signal: activeSignal,
      headers: { Accept: 'application/json' },
    });

    if (response.ok) {
      const data: OpenElevationResponse = await response.json();
      if (data?.results && data.results.length > 0) {
        const elev = data.results[0].elevation;
        if (typeof elev === 'number' && !isNaN(elev)) {
          clearTimeout(timeoutId);
          return Math.round(elev * 10) / 10; // Round to 1 decimal place
        }
      }
    }
  } catch (err) {
    if (signal?.aborted) {
      clearTimeout(timeoutId);
      return null;
    }
  }

  // 2. Try OpenTopoData (SRTM 30m) as fallback
  try {
    const fallbackUrl = `https://api.opentopodata.org/v1/srtm30m?locations=${lat.toFixed(6)},${lng.toFixed(6)}`;
    const fallbackResponse = await fetch(fallbackUrl, {
      signal: activeSignal,
      headers: { Accept: 'application/json' },
    });

    if (fallbackResponse.ok) {
      const fallbackData: OpenTopoDataResponse = await fallbackResponse.json();
      if (fallbackData?.results && fallbackData.results.length > 0) {
        const elev = fallbackData.results[0].elevation;
        if (typeof elev === 'number' && !isNaN(elev)) {
          clearTimeout(timeoutId);
          return Math.round(elev * 10) / 10;
        }
      }
    }
  } catch (err) {
    // Silence errors to keep experience non-blocking
  } finally {
    clearTimeout(timeoutId);
  }

  return null;
}

export interface ProfileSamplePoint {
  distanceMeters: number;
  distanceKm: number;
  formattedDistance: string;
  elevation: number;
  lat: number;
  lng: number;
  name?: string;
  pointId?: string;
  slopePercent?: number;
}

export interface ProfileSummary {
  minElev: number;
  maxElev: number;
  elevRange: number;
  totalDistanceMeters: number;
  formattedTotalDistance: string;
  elevationGain: number;
  elevationLoss: number;
  points: ProfileSamplePoint[];
}

/**
 * Calculates geodesic distance between two lat/lng coordinates in meters using Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10;
}

/**
 * Format distance in meters or kilometers nicely
 */
export function formatDistance(meters: number, isAr = false): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} ${isAr ? 'كم' : 'km'}`;
  }
  return `${meters.toFixed(1)} ${isAr ? 'م' : 'm'}`;
}

/**
 * Batch fetch elevation from Open-Elevation or fallback
 */
export async function fetchBatchElevations(
  coords: Array<{ lat: number; lng: number }>,
  signal?: AbortSignal
): Promise<Array<number | null>> {
  if (!coords || coords.length === 0) return [];

  // 1. Try Open-Elevation POST API (can handle multiple coordinates)
  try {
    const locations = coords.map((c) => ({
      latitude: parseFloat(c.lat.toFixed(6)),
      longitude: parseFloat(c.lng.toFixed(6)),
    }));

    const response = await fetch('https://api.open-elevation.com/api/v1/lookup', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ locations }),
      signal: signal || AbortSignal.timeout(7000),
    });

    if (response.ok) {
      const data: OpenElevationResponse = await response.json();
      if (data?.results && data.results.length === coords.length) {
        return data.results.map((r) =>
          typeof r.elevation === 'number' && !isNaN(r.elevation)
            ? Math.round(r.elevation * 10) / 10
            : null
        );
      }
    }
  } catch (e) {
    // Continue to individual or fallback
  }

  // 2. Sequential fallback with small batches
  const results: Array<number | null> = [];
  for (const c of coords) {
    const elev = await fetchElevation(c.lat, c.lng, signal);
    results.push(elev);
  }
  return results;
}

/**
 * Interpolate points evenly between two coordinates
 */
export function interpolateLinePoints(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  numSegments = 25
): Array<{ lat: number; lng: number; ratio: number }> {
  const points: Array<{ lat: number; lng: number; ratio: number }> = [];
  for (let i = 0; i <= numSegments; i++) {
    const ratio = i / numSegments;
    const lat = startLat + (endLat - startLat) * ratio;
    const lng = startLng + (endLng - startLng) * ratio;
    points.push({ lat, lng, ratio });
  }
  return points;
}

/**
 * Calculate profile summary from sampled points
 */
export function calculateProfileSummary(
  rawPoints: Array<{ lat: number; lng: number; elevation?: number | null; name?: string; id?: string }>,
  isAr = false
): ProfileSummary {
  if (rawPoints.length === 0) {
    return {
      minElev: 0,
      maxElev: 0,
      elevRange: 0,
      totalDistanceMeters: 0,
      formattedTotalDistance: '0 m',
      elevationGain: 0,
      elevationLoss: 0,
      points: [],
    };
  }

  let accumulatedDist = 0;
  let gain = 0;
  let loss = 0;
  let minE = Infinity;
  let maxE = -Infinity;

  const points: ProfileSamplePoint[] = [];

  for (let i = 0; i < rawPoints.length; i++) {
    const cur = rawPoints[i];
    if (i > 0) {
      const prev = rawPoints[i - 1];
      const legDist = calculateDistanceMeters(prev.lat, prev.lng, cur.lat, cur.lng);
      accumulatedDist += legDist;
    }

    const elev = typeof cur.elevation === 'number' && !isNaN(cur.elevation) ? cur.elevation : 0;
    if (elev < minE) minE = elev;
    if (elev > maxE) maxE = elev;

    if (i > 0) {
      const prevElev = points[i - 1].elevation;
      const diff = elev - prevElev;
      if (diff > 0) gain += diff;
      else loss += Math.abs(diff);
    }

    const prevPt = i > 0 ? points[i - 1] : null;
    const legDist = prevPt ? accumulatedDist - prevPt.distanceMeters : 0;
    const slope =
      prevPt && legDist > 0 ? Math.round(((elev - prevPt.elevation) / legDist) * 1000) / 10 : 0;

    points.push({
      distanceMeters: Math.round(accumulatedDist * 10) / 10,
      distanceKm: Math.round((accumulatedDist / 1000) * 100) / 100,
      formattedDistance: formatDistance(accumulatedDist, isAr),
      elevation: Math.round(elev * 10) / 10,
      lat: cur.lat,
      lng: cur.lng,
      name: cur.name || (isAr ? `نقطة ${i + 1}` : `Point ${i + 1}`),
      pointId: cur.id,
      slopePercent: slope,
    });
  }

  if (minE === Infinity) minE = 0;
  if (maxE === -Infinity) maxE = 0;

  return {
    minElev: minE,
    maxElev: maxE,
    elevRange: Math.round((maxE - minE) * 10) / 10,
    totalDistanceMeters: Math.round(accumulatedDist * 10) / 10,
    formattedTotalDistance: formatDistance(accumulatedDist, isAr),
    elevationGain: Math.round(gain * 10) / 10,
    elevationLoss: Math.round(loss * 10) / 10,
    points,
  };
}
