import { createHash } from "node:crypto";
import { redis } from "./redis";
import { trackCacheHit, trackCacheMiss } from "./metrics";

// First-class caching layer (CLAUDE.md Critical Rule #2). Every paid vendor /
// LLM call in later phases checks Redis first via these helpers.

/**
 * Build a stable cache key: `vendor:endpoint:sha256(params)`.
 * Params are serialized deterministically so equivalent inputs collide.
 */
export function cacheKey(
  vendor: string,
  endpoint: string,
  params: unknown,
): string {
  const hash = createHash("sha256").update(stableStringify(params)).digest("hex");
  return `${vendor}:${endpoint}:${hash}`;
}

export async function getCached<T>(key: string): Promise<T | null> {
  const value = await redis.get<T>(key);
  return value ?? null;
}

export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  await redis.set(key, value, { ex: ttlSeconds });
}

/**
 * Cache-first wrapper: return the cached value, or run `fn`, store, and return.
 * The building block every vendor client wraps its calls in.
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  const vendor = key.split(":")[0] ?? "unknown";
  const cached = await getCached<T>(key);
  if (cached !== null) {
    trackCacheHit(vendor);
    return cached;
  }
  trackCacheMiss(vendor);
  const fresh = await fn();
  await setCached(key, fresh, ttlSeconds);
  return fresh;
}

// Deterministic JSON with sorted object keys so {a,b} and {b,a} hash equally.
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
  return `{${entries.join(",")}}`;
}
