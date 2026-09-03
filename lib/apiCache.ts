type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const cacheMap = new Map<string, CacheEntry<any>>();

export function getFromCache<T>(key: string): T | null {
  const entry = cacheMap.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cacheMap.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setInCache<T>(key: string, data: T, ttlMs: number = 60_000): void {
  if (cacheMap.size > 500) {
    const now = Date.now();
    for (const [k, v] of cacheMap.entries()) {
      if (now > v.expiresAt) {
        cacheMap.delete(k);
      }
    }
  }
  cacheMap.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    cacheMap.clear();
    return;
  }
  for (const k of cacheMap.keys()) {
    if (k.startsWith(prefix)) {
      cacheMap.delete(k);
    }
  }
}
