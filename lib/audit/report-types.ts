// Typed views over the JSON payloads stored on each AuditResult row.
// The pipeline (inngest/functions/run-audit.ts) writes these shapes; the report
// UI reads them back as `unknown` and narrows here so no `any` leaks into the
// components. Types are re-exported from the vendor clients and content
// generators that produce them, keeping a single source of truth.
//
// `import type` is erased at build time, so importing these from server-only
// client modules does NOT pull server code into the client bundle.

import type {
  OnPageResult,
  BacklinkSummary,
  DomainRank,
  RankedPage,
} from "@/lib/clients/dataforseo";
import type { PageSpeedResult } from "@/lib/clients/pagespeed";
import type { LinkCheckResult } from "@/lib/audit/links";
import type { Fix } from "@/lib/content/fixes";
import type { PageRewrite } from "@/lib/content/rewrites";
import type { GeoBrief } from "@/lib/content/geo-brief";
import type { ContentGapAnalysis } from "@/lib/content/gaps";

export type {
  OnPageResult,
  PageSpeedResult,
  LinkCheckResult,
  BacklinkSummary,
  DomainRank,
  RankedPage,
  Fix,
  PageRewrite,
  GeoBrief,
  ContentGapAnalysis,
};

// ── Per-category payload shapes (mirror run-audit.ts step writers) ───────────

export interface TrafficPayload {
  totalEstTraffic: number;
  topPages: RankedPage[];
}

export interface OnPagePayload {
  pages: OnPageResult[];
}

export interface PerfPayload {
  pages: PageSpeedResult[];
}

export interface LinksPayload {
  links: LinkCheckResult[];
  brokenCount: number;
}

export interface AuthorityPayload {
  backlinks: BacklinkSummary;
  domainRank: DomainRank;
}

export interface GeoCompetitor {
  name: string;
  count: number;
}

export interface GeoPayload {
  score: number;
  competitors: GeoCompetitor[];
  enginesProbed: string[];
}

export interface ContentPayload {
  fixList: Fix[];
  rewrites: PageRewrite[];
  geoBrief: GeoBrief;
  gaps: ContentGapAnalysis | null;
}

export interface ReportPayloadMap {
  traffic: TrafficPayload;
  onpage: OnPagePayload;
  perf: PerfPayload;
  links: LinksPayload;
  authority: AuthorityPayload;
  geo: GeoPayload;
  content: ContentPayload;
}

export interface ReportResult {
  category: string;
  score: number | null;
  payload: unknown;
}

/**
 * Find an AuditResult by category and return its payload typed to the matching
 * shape, or null when the category is absent or the payload is not an object.
 * Trusted internal data — we narrow by category key rather than deep-validating.
 */
export function getPayload<K extends keyof ReportPayloadMap>(
  results: ReportResult[],
  category: K,
): ReportPayloadMap[K] | null {
  const found = results.find((r) => r.category === category);
  if (!found || found.payload == null || typeof found.payload !== "object") {
    return null;
  }
  return found.payload as ReportPayloadMap[K];
}

/** Narrow a Page.onPageIssues JSON blob to an OnPageResult. */
export function asOnPageResult(value: unknown): OnPageResult | null {
  if (value == null || typeof value !== "object") return null;
  return value as OnPageResult;
}

/** Narrow a Page.perf JSON blob to a PageSpeedResult. */
export function asPageSpeed(value: unknown): PageSpeedResult | null {
  if (value == null || typeof value !== "object") return null;
  return value as PageSpeedResult;
}
