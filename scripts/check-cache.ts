import { cacheKey, getCached, setCached, withCache } from "../lib/cache";

// Phase 1 smoke test for the Upstash cache layer. Run with real creds:
//   pnpm check:cache   (tsx --env-file=.env scripts/check-cache.ts)

async function main() {
  // 1. set/get round-trip
  const key = cacheKey("dev", "cache-check", { ts: "fixed" });
  const payload = { hello: "vantage", n: 42 };
  await setCached(key, payload, 30);
  const read = await getCached<typeof payload>(key);
  if (!read || read.hello !== "vantage" || read.n !== 42) {
    throw new Error(`Round-trip failed: ${JSON.stringify(read)}`);
  }
  console.log("✓ set/get round-trip OK:", read);

  // 2. withCache memoizes (fn runs once)
  let calls = 0;
  const compute = async () => {
    calls += 1;
    return { computedAt: calls };
  };
  const k2 = cacheKey("dev", "withcache-check", { ts: "fixed" });
  const a = await withCache(k2, 30, compute);
  const b = await withCache(k2, 30, compute);
  if (a.computedAt !== 1 || b.computedAt !== 1 || calls !== 1) {
    throw new Error(`withCache did not cache: calls=${calls}`);
  }
  console.log("✓ withCache memoized (fn ran once)");

  // 3. cacheKey is order-stable
  const k3 = cacheKey("dev", "x", { a: 1, b: 2 });
  const k4 = cacheKey("dev", "x", { b: 2, a: 1 });
  if (k3 !== k4) throw new Error("cacheKey is not order-stable");
  console.log("✓ cacheKey is order-stable");

  console.log("\nAll cache checks passed.");
}

main().catch((err) => {
  console.error("Cache check FAILED:", err);
  process.exit(1);
});
