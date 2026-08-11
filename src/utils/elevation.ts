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
