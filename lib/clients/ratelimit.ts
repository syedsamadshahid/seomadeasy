import { redis } from "@/lib/cache/redis";

// Fixed-window rate limits (requests per minute) per vendor.
// These are conservative limits well below API maximums to avoid 429s across
// concurrent Inngest jobs.
const RATE_LIMITS: Record<string, number> = {
  dataforseo: 200,
  pagespeed: 50,
  gemini: 12,
  openai: 500,
  perplexity: 15,
  anthropic: 50,
  deepseek: 100,
  gsc: 100,
};

const WINDOW_SECONDS = 60;
const WAIT_MS = 2000;
const MAX_WAITS = 3;

function windowKey(vendor: string): string {
  const window = Math.floor(Date.now() / (WINDOW_SECONDS * 1000));
  return `ratelimit:${vendor}:${window}`;
}

export async function withRateLimit<T>(vendor: string, fn: () => Promise<T>): Promise<T> {
  const limit = RATE_LIMITS[vendor];
  if (!limit) return fn();

  for (let attempt = 0; attempt <= MAX_WAITS; attempt++) {
    try {
      const key = windowKey(vendor);
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, WINDOW_SECONDS + 5);
      }
      if (count <= limit) break;
      // Over limit — wait and retry
      if (attempt < MAX_WAITS) {
        await new Promise((r) => setTimeout(r, WAIT_MS));
        continue;
      }
      // Still over after max waits — proceed anyway (fail open)
    } catch {
      // Redis error — fail open, don't block the call
      break;
    }
  }

  return fn();
}
