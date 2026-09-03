export const NONMOVE_BUCKET_ORDER = [
  "30-60",
  "61-90",
  "91-120",
  "121 up",
] as const;

export type NonmoveBucket = typeof NONMOVE_BUCKET_ORDER[number];

// Nonmove count from 61 day up: 61-90, 91-120, 121 up are classified as HIGH (non-move)
export const HIGH_NONMOVE_CUTOFF: NonmoveBucket = "61-90";

export const AGING_BUCKET_ORDER = [
  "0-180",
  "181-365",
  "366-545",
  "546 -730",
  "731-910",
  "911-1095",
  "1096-1460",
  "1461-1825",
  "1826-2190",
] as const;

/**
 * Standardize any bucket string to one of the 4 official groups:
 * 1. 30-60
 * 2. 61-90
 * 3. 91-120
 * 4. 121 up
 */
export function mapTo4Buckets(bucket?: string | null): NonmoveBucket {
  if (!bucket) return "30-60";
  const b = bucket.trim().toLowerCase();
  if (b.includes("30-60") || b === "30-60" || b.includes("30 - 60")) return "30-60";
  if (b.includes("61-90") || b.includes("60-90") || b === "61-90" || b.includes("61 - 90")) return "61-90";
  if (b.includes("91-120") || b === "91-120" || b.includes("91 - 120")) return "91-120";
  // Everything else is >= 121 days (e.g. 121-180, 181-210, 211-270, 271-365, 365+, >360, 180-360, 121 up, >120)
  return "121 up";
}

/**
 * Nonmove count from 61 day up:
 * - 30-60: "OK" (normal)
 * - 61-90: "HIGH" (non-move)
 * - 91-120: "HIGH" (non-move)
 * - 121 up: "HIGH" (non-move)
 */
export function classifyNonmove(bucket?: string | null): "HIGH" | "OK" {
  if (!bucket) return "OK";
  const mapped = mapTo4Buckets(bucket);
  return mapped === "30-60" ? "OK" : "HIGH";
}

export function getWorstBucket(buckets: string[]): NonmoveBucket {
  if (!buckets || buckets.length === 0) return "30-60";
  let maxIdx = 0;
  for (const b of buckets) {
    const mapped = mapTo4Buckets(b);
    const idx = NONMOVE_BUCKET_ORDER.indexOf(mapped);
    if (idx > maxIdx) {
      maxIdx = idx;
    }
  }
  return NONMOVE_BUCKET_ORDER[maxIdx];
}
