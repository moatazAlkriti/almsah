import { SurveyPoint } from '../types';

/**
 * Scans all existing points to find the highest sequence number in point names.
 * If a prefix is supplied (e.g. "TH" or "P"), it prioritizes numbers following that prefix.
 */
export function getHighestPointNumber(points: SurveyPoint[], prefix?: string): number {
  if (!points || points.length === 0) return 0;

  let maxNumWithPrefix = 0;
  let maxNumGeneral = 0;

  const cleanPrefix = prefix ? prefix.trim().toLowerCase() : '';

  for (const pt of points) {
    if (!pt.name) continue;
    const name = pt.name.trim();

    // Check matching prefix if prefix is provided
    if (cleanPrefix) {
      const escapedPrefix = cleanPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match pattern like "TH 100", "TH-100", "TH_100", "TH100"
      const regex = new RegExp(`(?:^|\\b)${escapedPrefix}[\\s\\-_]*(\\d+)`, 'i');
      const match = name.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNumWithPrefix) {
          maxNumWithPrefix = num;
        }
      }
    }

    // Also track general numbers found in point names
    const numbers = name.match(/\d+/g);
    if (numbers) {
      for (const nStr of numbers) {
        const num = parseInt(nStr, 10);
        if (!isNaN(num) && num < 100000) {
          if (num > maxNumGeneral) {
            maxNumGeneral = num;
          }
        }
      }
    }
  }

  if (cleanPrefix && maxNumWithPrefix > 0) {
    return maxNumWithPrefix;
  }

  return maxNumGeneral;
}

/**
 * Returns the next recommended point sequence number (highest existing + 1, default 1)
 */
export function getNextPointSequenceNumber(points: SurveyPoint[], prefix?: string): number {
  const highest = getHighestPointNumber(points, prefix);
  return highest > 0 ? highest + 1 : 1;
}

/**
 * Detects the most common text prefix in existing point names (e.g. "TH", "P", "PT", "نقطة", or "" for plain numbers)
 */
export function detectMostCommonPrefix(points: SurveyPoint[]): string {
  if (!points || points.length === 0) return '';
  
  let pureNumberCount = 0;
  const prefixCounts: Record<string, number> = {};

  for (const pt of points) {
    if (!pt.name) continue;
    const trimmed = pt.name.trim();
    if (/^\d+$/.test(trimmed)) {
      pureNumberCount++;
      continue;
    }
    const match = trimmed.match(/^([a-zA-Z\u0600-\u06FF\s\-_]+?)\s*\d+$/);
    if (match && match[1]) {
      const p = match[1].trim();
      if (p.length <= 15) {
        prefixCounts[p] = (prefixCounts[p] || 0) + 1;
      }
    }
  }

  let bestPrefix = '';
  let maxCount = 0;

  for (const [p, count] of Object.entries(prefixCounts)) {
    if (count > maxCount) {
      maxCount = count;
      bestPrefix = p;
    }
  }

  // If pure numbers are more common than any prefixed format, return empty string for plain numbers
  if (pureNumberCount >= maxCount && pureNumberCount > 0) {
    return '';
  }

  return bestPrefix;
}

/**
 * Extracts numeric sequence from a point name string (e.g. "15" -> 15, "TH 102" -> 102, "Point 7" -> 7)
 */
export function extractPointNumber(pointName?: string): number | null {
  if (!pointName) return null;
  const trimmed = pointName.trim();
  const match = trimmed.match(/(\d+)/);
  if (match && match[1]) {
    const num = parseInt(match[1], 10);
    return isNaN(num) ? null : num;
  }
  return null;
}
