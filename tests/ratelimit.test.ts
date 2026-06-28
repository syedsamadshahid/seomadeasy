import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/cache/redis", () => ({
  redis: {
    incr: vi.fn(),
    expire: vi.fn().mockResolvedValue(1),
  },
}));

import { withRateLimit } from "../lib/clients/ratelimit";
import { redis } from "../lib/cache/redis";

describe("withRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls fn and returns its value when under limit", async () => {
    vi.mocked(redis.incr).mockResolvedValue(1);
    const fn = vi.fn().mockResolvedValue("result");
    const result = await withRateLimit("gemini", fn);
    expect(result).toBe("result");
    expect(fn).toHaveBeenCalledOnce();
  });

  it("calls fn for unknown vendors without checking Redis", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withRateLimit("unknown_vendor_xyz", fn);
    expect(result).toBe("ok");
    expect(redis.incr).not.toHaveBeenCalled();
  });

  it("sets expire on first increment (count === 1)", async () => {
    vi.mocked(redis.incr).mockResolvedValue(1);
    await withRateLimit("gemini", () => Promise.resolve("x"));
    expect(redis.expire).toHaveBeenCalled();
  });

  it("proceeds after max waits when over limit (fail open)", async () => {
    // Always over limit
    vi.mocked(redis.incr).mockResolvedValue(9999);
    const fn = vi.fn().mockResolvedValue("fallthrough");
    // Stub setTimeout to avoid real delays
    vi.useFakeTimers();
    const p = withRateLimit("gemini", fn);
    await vi.runAllTimersAsync();
    const result = await p;
    expect(result).toBe("fallthrough");
    vi.useRealTimers();
  });

  it("fails open when Redis throws", async () => {
    vi.mocked(redis.incr).mockRejectedValue(new Error("redis down"));
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withRateLimit("gemini", fn);
    expect(result).toBe("ok");
  });
});
