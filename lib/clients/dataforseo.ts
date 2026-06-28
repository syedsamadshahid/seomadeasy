import { cacheKey, withCache } from "@/lib/cache";
import { logUsage } from "@/lib/usage";
import { fetchJson } from "@/lib/clients/http";
import { withRateLimit } from "@/lib/clients/ratelimit";

// TTLs per CLAUDE.md caching spec
const TTL = {
  rankedPages: 7 * 24 * 60 * 60, // 7 days
  onPage: 24 * 60 * 60, // 24 hours
  backlinks: 7 * 24 * 60 * 60, // 7 days
  domainRank: 30 * 24 * 60 * 60, // 30 days
  keywords: 7 * 24 * 60 * 60, // 7 days
  serp: 24 * 60 * 60, // 24 hours
} as const;

const BASE_URL = "https://api.dataforseo.com";

function authHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    throw new Error("DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD must be set");
  }
  return "Basic " + Buffer.from(`${login}:${password}`).toString("base64");
}

async function dfsPost<T>(path: string, body: unknown): Promise<T> {
  return withRateLimit("dataforseo", () =>
    fetchJson<T>(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  );
}

// ── Normalized types returned by this client ─────────────────────────────────

export interface RankedPage {
  url: string;
  estTraffic: number;
}

export interface OnPageResult {
  url: string;
  title: string | null;
  description: string | null;
  h1: string[];
  canonical: string | null;
  robots: string | null;
  hasSchema: boolean;
  wordCount: number;
  issues: string[];
}

export interface BacklinkSummary {
  totalBacklinks: number;
  referringDomains: number;
  domainAuthority: number;
}

export interface DomainRank {
  rank: number;
  backlinks: number;
  referringDomains: number;
}

export interface KeywordMetrics {
  keyword: string;
  volume: number;
  difficulty: number;
  cpc: number;
  intent: string | null;
  topUrl: string | null;
}

// ── Raw DataForSEO shapes (internal) ─────────────────────────────────────────

interface DfsTask<TResult> {
  status_code: number;
  cost: number;
  result: TResult[] | null;
}

interface DfsResponse<TResult> {
  tasks: DfsTask<TResult>[];
}

interface DfsKeywordsForSiteItem {
  page_from?: string;
  keyword?: string;
  metrics?: { organic?: { etv?: number } };
}

interface DfsOnPageItem {
  url?: string;
  meta?: {
    title?: string;
    description?: string;
    htags?: Record<string, string[]>;
    canonical?: string;
    robots?: string;
    content?: { words_count?: number };
  };
  checks?: Record<string, boolean>;
  schema?: unknown[];
  on_page_score?: number;
}

interface DfsBacklinkItem {
  total?: number;
  referring_domains?: number;
}

interface DfsDomainRankItem {
  rank?: number;
  backlinks?: number;
  referring_domains?: number;
}

interface DfsKeywordItem {
  keyword?: string;
  keyword_info?: {
    search_volume?: number;
    competition_level?: string;
    cpc?: number;
  };
  keyword_difficulty?: number;
  serp_info?: { serp_item_types?: string[] };
  ranked_serp_element?: { serp_item?: { relative_url?: string } };
}

// ── Step 1: Resolve top pages for a domain ───────────────────────────────────

export async function rankedPages(
  domain: string,
  userId: string,
  auditId: string,
  { limit = 20 }: { limit?: number } = {},
): Promise<RankedPage[]> {
  const key = cacheKey("dataforseo", "keywords_for_site", { domain, limit });

  return withCache(key, TTL.rankedPages, async () => {
    type Resp = DfsResponse<DfsKeywordsForSiteItem>;
    const raw = await dfsPost<Resp>("/v3/dataforseo_labs/google/keywords_for_site/live", [
      { target: domain, language_code: "en", location_code: 2840, limit: 1000 },
    ]);

    const cost = Math.ceil((raw.tasks?.[0]?.cost ?? 0) * 100);
    await logUsage({ userId, auditId, vendor: "dataforseo", endpoint: "keywords_for_site", costCents: cost });

    const items = raw.tasks?.[0]?.result ?? [];
    const traffic = new Map<string, number>();

    for (const item of items) {
      const url = item.page_from;
      if (!url) continue;
      const etv = item.metrics?.organic?.etv ?? 0;
      traffic.set(url, (traffic.get(url) ?? 0) + etv);
    }

    return [...traffic.entries()]
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([url, estTraffic]) => ({ url, estTraffic: Math.round(estTraffic) }));
  });
}

// ── Step 2: On-page SEO for a list of URLs ───────────────────────────────────

export async function onPage(
  urls: string[],
  userId: string,
  auditId: string,
): Promise<OnPageResult[]> {
  const key = cacheKey("dataforseo", "on_page_content_parsing", { urls: [...urls].sort() });

  return withCache(key, TTL.onPage, async () => {
    type Resp = DfsResponse<DfsOnPageItem>;
    const raw = await dfsPost<Resp>("/v3/on_page/content_parsing/live", [
      { urls },
    ]);

    const cost = Math.ceil((raw.tasks?.[0]?.cost ?? 0) * 100);
    await logUsage({ userId, auditId, vendor: "dataforseo", endpoint: "on_page_content_parsing", costCents: cost });

    const items = raw.tasks?.[0]?.result ?? [];
    return items.map(normalizeOnPageItem);
  });
}

function normalizeOnPageItem(item: DfsOnPageItem): OnPageResult {
  const meta = item.meta ?? {};
  const h1s = meta.htags?.h1 ?? [];
  const issues: string[] = [];

  if (!meta.title) issues.push("missing_title");
  if (!meta.description) issues.push("missing_description");
  if (h1s.length === 0) issues.push("missing_h1");
  if (h1s.length > 1) issues.push("multiple_h1");
  if (!meta.canonical) issues.push("missing_canonical");

  return {
    url: item.url ?? "",
    title: meta.title ?? null,
    description: meta.description ?? null,
    h1: h1s,
    canonical: meta.canonical ?? null,
    robots: meta.robots ?? null,
    hasSchema: Array.isArray(item.schema) && item.schema.length > 0,
    wordCount: meta.content?.words_count ?? 0,
    issues,
  };
}

// ── Step 5: Backlinks summary ─────────────────────────────────────────────────

export async function backlinks(
  domain: string,
  userId: string,
  auditId: string,
): Promise<BacklinkSummary> {
  const key = cacheKey("dataforseo", "backlinks_summary", { domain });

  return withCache(key, TTL.backlinks, async () => {
    type Resp = DfsResponse<DfsBacklinkItem>;
    const raw = await dfsPost<Resp>("/v3/backlinks/summary/live", [
      { target: domain, target_type: "site_with_subdomains" },
    ]);

    const cost = Math.ceil((raw.tasks?.[0]?.cost ?? 0) * 100);
    await logUsage({ userId, auditId, vendor: "dataforseo", endpoint: "backlinks_summary", costCents: cost });

    const item = raw.tasks?.[0]?.result?.[0] ?? {};
    return {
      totalBacklinks: item.total ?? 0,
      referringDomains: item.referring_domains ?? 0,
      domainAuthority: 0,
    };
  });
}

// ── Step 6: Domain rank ───────────────────────────────────────────────────────

export async function domainRank(
  domain: string,
  userId: string,
  auditId: string,
): Promise<DomainRank> {
  const key = cacheKey("dataforseo", "domain_rank", { domain });

  return withCache(key, TTL.domainRank, async () => {
    type Resp = DfsResponse<DfsDomainRankItem>;
    const raw = await dfsPost<Resp>("/v3/dataforseo_labs/google/domain_rank_overview/live", [
      { target: domain, language_code: "en", location_code: 2840 },
    ]);

    const cost = Math.ceil((raw.tasks?.[0]?.cost ?? 0) * 100);
    await logUsage({ userId, auditId, vendor: "dataforseo", endpoint: "domain_rank_overview", costCents: cost });

    const item = raw.tasks?.[0]?.result?.[0] ?? {};
    return {
      rank: item.rank ?? 0,
      backlinks: item.backlinks ?? 0,
      referringDomains: item.referring_domains ?? 0,
    };
  });
}

// ── GEO: Google AI Overview via DataForSEO SERP ──────────────────────────────

interface DfsAioItem {
  type?: string;
  text?: string;
  items?: DfsAioItem[];
}

interface DfsSerpResult {
  items?: DfsAioItem[];
}

export async function aiOverview(
  query: string,
  userId: string,
  auditId: string | undefined,
): Promise<string> {
  const key = cacheKey("dataforseo", "google_aio", { query });

  return withCache<string>(key, TTL.serp, async () => {
    type Resp = DfsResponse<DfsSerpResult>;
    const raw = await dfsPost<Resp>("/v3/serp/google/organic/live/advanced", [
      {
        keyword: query,
        language_code: "en",
        location_code: 2840,
        depth: 10,
      },
    ]);

    const cost = Math.ceil((raw.tasks?.[0]?.cost ?? 0) * 100);
    await logUsage({
      userId,
      auditId,
      vendor: "dataforseo",
      endpoint: "serp_google_aio",
      costCents: cost,
    });

    const items = raw.tasks?.[0]?.result?.[0]?.items ?? [];
    const aioItem = items.find((i) => i.type === "ai_overview");
    if (!aioItem) return "";

    function extractText(node: DfsAioItem): string {
      if (node.text) return node.text;
      if (node.items) return node.items.map(extractText).join(" ");
      return "";
    }

    return extractText(aioItem).trim();
  });
}

// ── Step 7: Keyword data ──────────────────────────────────────────────────────

export async function keywordData(
  domain: string,
  userId: string,
  auditId: string,
  { limit = 50 }: { limit?: number } = {},
): Promise<KeywordMetrics[]> {
  const key = cacheKey("dataforseo", "ranked_keywords", { domain, limit });

  return withCache(key, TTL.keywords, async () => {
    type Resp = DfsResponse<DfsKeywordItem>;
    const raw = await dfsPost<Resp>("/v3/dataforseo_labs/google/ranked_keywords/live", [
      { target: `https://${domain}/`, language_code: "en", location_code: 2840, limit },
    ]);

    const cost = Math.ceil((raw.tasks?.[0]?.cost ?? 0) * 100);
    await logUsage({ userId, auditId, vendor: "dataforseo", endpoint: "ranked_keywords", costCents: cost });

    const items = raw.tasks?.[0]?.result ?? [];
    return items.map((item) => ({
      keyword: item.keyword ?? "",
      volume: item.keyword_info?.search_volume ?? 0,
      difficulty: item.keyword_difficulty ?? 0,
      cpc: item.keyword_info?.cpc ?? 0,
      intent: item.keyword_info?.competition_level ?? null,
      topUrl: item.ranked_serp_element?.serp_item?.relative_url ?? null,
    }));
  });
}
