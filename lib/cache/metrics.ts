import { redis } from "./redis";

export interface CacheVendorStats {
  vendor: string;
  hits: number;
  misses: number;
  hitRate: number;
}

export interface CacheStats {
  overall: { hits: number; misses: number; hitRate: number };
  byVendor: CacheVendorStats[];
}

function hitKey(vendor: string): string {
  return `cachemetrics:${vendor}:hit`;
}

function missKey(vendor: string): string {
  return `cachemetrics:${vendor}:miss`;
}

export function trackCacheHit(vendor: string): void {
  // Fire-and-forget: never block the calling path or throw
  redis.incr(hitKey(vendor)).catch(() => {});
}

export function trackCacheMiss(vendor: string): void {
  redis.incr(missKey(vendor)).catch(() => {});
}

const KNOWN_VENDORS = [
  "dataforseo",
  "pagespeed",
  "gemini",
  "openai",
  "perplexity",
  "anthropic",
  "deepseek",
  "gsc",
];

export async function getCacheStats(): Promise<CacheStats> {
  const keys = KNOWN_VENDORS.flatMap((v) => [hitKey(v), missKey(v)]);
  const values = await redis.mget<number[]>(...keys);

  const byVendor: CacheVendorStats[] = [];
  let totalHits = 0;
  let totalMisses = 0;

  KNOWN_VENDORS.forEach((vendor, i) => {
    const hits = values[i * 2] ?? 0;
    const misses = values[i * 2 + 1] ?? 0;
    if (hits === 0 && misses === 0) return;
    const total = hits + misses;
    const hitRate = total > 0 ? Math.round((hits / total) * 100) : 0;
    byVendor.push({ vendor, hits, misses, hitRate });
    totalHits += hits;
    totalMisses += misses;
  });

  const overallTotal = totalHits + totalMisses;
  return {
    overall: {
      hits: totalHits,
      misses: totalMisses,
      hitRate: overallTotal > 0 ? Math.round((totalHits / overallTotal) * 100) : 0,
    },
    byVendor,
  };
}
