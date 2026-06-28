import { cacheKey, withCache } from "@/lib/cache";
import { logUsage } from "@/lib/usage";
import { fetchJson } from "@/lib/clients/http";
import { withRateLimit } from "@/lib/clients/ratelimit";

const TTL_SECONDS = 24 * 60 * 60; // 24 hours

export interface PageSpeedResult {
  url: string;
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  fcp: number | null;
  tbt: number | null;
  performanceScore: number | null;
}

interface PsiResponse {
  lighthouseResult?: {
    categories?: { performance?: { score?: number } };
    audits?: {
      "largest-contentful-paint"?: { numericValue?: number };
      "cumulative-layout-shift"?: { numericValue?: number };
      "total-blocking-time"?: { numericValue?: number };
      "first-contentful-paint"?: { numericValue?: number };
      "interaction-to-next-paint"?: { numericValue?: number };
    };
  };
}

export async function fetchPageSpeed(
  url: string,
  userId: string,
  auditId: string,
): Promise<PageSpeedResult> {
  const key = cacheKey("pagespeed", "runPagespeed", { url });

  return withCache(key, TTL_SECONDS, async () => {
    return withRateLimit("pagespeed", async () => {
      const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
      const params = new URLSearchParams({
        url,
        strategy: "mobile",
        category: "PERFORMANCE",
        ...(apiKey ? { key: apiKey } : {}),
      });

      const raw = await fetchJson<PsiResponse>(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`,
      );

      await logUsage({
        userId,
        auditId,
        vendor: "pagespeed",
        endpoint: "runPagespeed",
        units: 1,
        costCents: 0,
      });

      const audits = raw.lighthouseResult?.audits;
      const perfScore = raw.lighthouseResult?.categories?.performance?.score;

      return {
        url,
        lcp: audits?.["largest-contentful-paint"]?.numericValue ?? null,
        cls: audits?.["cumulative-layout-shift"]?.numericValue ?? null,
        inp: audits?.["interaction-to-next-paint"]?.numericValue ?? null,
        fcp: audits?.["first-contentful-paint"]?.numericValue ?? null,
        tbt: audits?.["total-blocking-time"]?.numericValue ?? null,
        performanceScore: perfScore != null ? Math.round(perfScore * 100) : null,
      };
    });
  });
}
