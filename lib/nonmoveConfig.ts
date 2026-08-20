export const NONMOVE_BUCKET_ORDER = [
  "30-60",
  "61-90",
  "91-120",
  "121-180",
  "181-210",
  "211-270",
  "271-365",
  "365+",
] as const;

export type NonmoveBucket = typeof NONMOVE_BUCKET_ORDER[number];

// Default cutoff: 121 days and above is classified as HIGH non-move
export const HIGH_NONMOVE_CUTOFF: NonmoveBucket = "121-180";

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

export function classifyNonmove(bucket?: string | null): "HIGH" | "OK" {
  if (!bucket) return "OK";
  const cleanBucket = bucket.trim();
  const idx = NONMOVE_BUCKET_ORDER.indexOf(cleanBucket as NonmoveBucket);
  const cutoffIdx = NONMOVE_BUCKET_ORDER.indexOf(HIGH_NONMOVE_CUTOFF);
  if (idx === -1) return "OK";
  return idx >= cutoffIdx ? "HIGH" : "OK";
}

export function getWorstBucket(buckets: string[]): string {
  if (!buckets || buckets.length === 0) return "30-60";
  let maxIdx = -1;
  let worst = buckets[0];
  for (const b of buckets) {
    const clean = (b || "").trim() as NonmoveBucket;
    const idx = NONMOVE_BUCKET_ORDER.indexOf(clean);
    if (idx > maxIdx) {
      maxIdx = idx;
      worst = clean;
    }
  }
  return worst;
}
