const CONCURRENCY = 10;
const TIMEOUT_MS = 10_000;
const USER_AGENT = "VantageBot/1.0 (+https://vantage.app/bot)";

export interface LinkCheckResult {
  url: string;
  status: number | null;
  broken: boolean;
  redirectedTo: string | null;
}

// Cache parsed robots.txt per host to avoid re-fetching within a single run
const robotsCache = new Map<string, Set<string>>();

async function isDisallowed(url: string): Promise<boolean> {
  try {
    const { hostname, protocol } = new URL(url);
    if (!robotsCache.has(hostname)) {
      const robotsUrl = `${protocol}//${hostname}/robots.txt`;
      const res = await fetch(robotsUrl, {
        signal: AbortSignal.timeout(5_000),
        headers: { "User-Agent": USER_AGENT },
      });
      const disallowed = new Set<string>();
      if (res.ok) {
        const text = await res.text();
        let inVantageBot = false;
        for (const line of text.split("\n")) {
          const trimmed = line.trim();
          if (trimmed.toLowerCase().startsWith("user-agent:")) {
            const agent = trimmed.slice(11).trim().toLowerCase();
            inVantageBot = agent === "*" || agent === "vantagebot";
          } else if (inVantageBot && trimmed.toLowerCase().startsWith("disallow:")) {
            const path = trimmed.slice(9).trim();
            if (path) disallowed.add(path);
          }
        }
      }
      robotsCache.set(hostname, disallowed);
    }
    const disallowed = robotsCache.get(hostname)!;
    const { pathname } = new URL(url);
    return [...disallowed].some((p) => pathname.startsWith(p));
  } catch {
    return false;
  }
}

async function checkOne(url: string): Promise<LinkCheckResult> {
  const disallowed = await isDisallowed(url);
  if (disallowed) {
    return { url, status: null, broken: false, redirectedTo: null };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });

    // Some servers reject HEAD; fall back to GET with a range limit
    if (res.status === 405) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT, Range: "bytes=0-0" },
      });
    }

    clearTimeout(timer);

    const finalUrl = res.url !== url ? res.url : null;
    return {
      url,
      status: res.status,
      broken: res.status >= 400,
      redirectedTo: finalUrl,
    };
  } catch {
    return { url, status: null, broken: true, redirectedTo: null };
  }
}

export async function checkBrokenLinks(
  urls: string[],
): Promise<LinkCheckResult[]> {
  robotsCache.clear();

  const results: LinkCheckResult[] = [];
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(checkOne));
    results.push(...batchResults);
  }

  return results;
}
