import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the redis module before importing metrics
vi.mock("../lib/cache/redis", () => ({
  redis: {
    incr: vi.fn().mockResolvedValue(1),
    mget: vi.fn().mockResolvedValue([]),
  },
}));

import { trackCacheHit, trackCacheMiss, getCacheStats } from "../lib/cache/metrics";
import { redis } from "../lib/cache/redis";

describe("cache metrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("trackCacheHit calls redis.incr with the hit key", async () => {
    trackCacheHit("gemini");
    // Fire-and-forget — wait a tick
    await Promise.resolve();
    expect(redis.incr).toHaveBeenCalledWith("cachemetrics:gemini:hit");
  });

  it("trackCacheMiss calls redis.incr with the miss key", async () => {
    trackCacheMiss("openai");
    await Promise.resolve();
    expect(redis.incr).toHaveBeenCalledWith("cachemetrics:openai:miss");
  });

  it("getCacheStats returns empty byVendor when all zeros", async () => {
    vi.mocked(redis.mget).mockResolvedValue([]);
    const stats = await getCacheStats();
    expect(stats.byVendor).toHaveLength(0);
    expect(stats.overall.hitRate).toBe(0);
  });

  it("getCacheStats computes hit rate correctly", async () => {
    // dataforseo: 80 hits, 20 misses → 80%
    // pagespeed: 0 hits, 0 misses → omitted
    const values = [80, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    vi.mocked(redis.mget).mockResolvedValue(values);
    const stats = await getCacheStats();
    const dfs = stats.byVendor.find((v) => v.vendor === "dataforseo");
    expect(dfs?.hitRate).toBe(80);
    expect(stats.overall.hitRate).toBe(80);
  });
});
