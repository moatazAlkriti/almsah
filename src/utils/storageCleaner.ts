/**
 * Storage & Cache Cleaner Utility
 * Handles automatic cleanup of bloated opaque tile caches and monitors storage quota.
 */

export interface StorageEstimateInfo {
  usageMB: number;
  quotaMB: number;
  usageGB: number;
  quotaGB: number;
  usageFormatted: string;
  quotaFormatted: string;
  isSupported: boolean;
}

/**
 * Formats bytes to human-readable format (MB / GB)
 */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(2)} GB`;
  }
  return `${mb.toFixed(1)} MB`;
}

/**
 * Query current browser storage usage and quota
 */
export async function getStorageEstimate(): Promise<StorageEstimateInfo> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const usageMB = usage / (1024 * 1024);
      const quotaMB = quota / (1024 * 1024);

      return {
        usageMB: Math.round(usageMB * 10) / 10,
        quotaMB: Math.round(quotaMB * 10) / 10,
        usageGB: Math.round((usageMB / 1024) * 100) / 100,
        quotaGB: Math.round((quotaMB / 1024) * 100) / 100,
        usageFormatted: formatBytes(usage),
        quotaFormatted: formatBytes(quota),
        isSupported: true,
      };
    } catch (e) {
      console.warn('Failed to get storage estimate:', e);
    }
  }

  return {
    usageMB: 0,
    quotaMB: 0,
    usageGB: 0,
    quotaGB: 0,
    usageFormatted: '---',
    quotaFormatted: '---',
    isSupported: false,
  };
}

/**
 * Automatically cleans bloated ServiceWorker CacheStorage (especially opaque tile caches)
 * Note: Preserves IndexedDB user survey data (points, lines, settings).
 */
export async function cleanBloatedCache(): Promise<{ deletedCaches: string[]; freedBytesEstimated: number }> {
  const deletedCaches: string[] = [];
  let freedBytesEstimated = 0;

  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cacheNames = await window.caches.keys();
      for (const name of cacheNames) {
        // Delete map-tiles-cache, workbox runtime opaque caches, or old bloated caches
        if (
          name.includes('map-tiles') ||
          name.includes('tiles') ||
          name.includes('runtime') ||
          name.startsWith('workbox-runtime')
        ) {
          await window.caches.delete(name);
          deletedCaches.push(name);
        }
      }
    } catch (err) {
      console.warn('Error purging bloated cache:', err);
    }
  }

  return { deletedCaches, freedBytesEstimated };
}

/**
 * Full cache purge requested by user in Settings modal
 */
export async function purgeAllCaches(): Promise<boolean> {
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cacheNames = await window.caches.keys();
      await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
      return true;
    } catch (err) {
      console.error('Error clearing caches:', err);
      return false;
    }
  }
  return false;
}
