import { generateContent } from "@/lib/clients/content";
import { cacheKey } from "@/lib/cache";
import type { Plan } from "@prisma/client";

export interface PageRewrite {
  url: string;
  originalTitle: string | null;
  suggestedTitle: string;
  originalMeta: string | null;
  suggestedMeta: string;
  reasoning: string;
}

export async function generateRewrites(
  pages: Array<{
    url: string;
    title: string | null;
    description: string | null;
    h1: string[];
    keywords: string[];
  }>,
  domain: string,
  plan: Plan,
  userId: string,
  auditId: string,
): Promise<PageRewrite[]> {
  // Pro: top pages only, Agency: all crawled pages
  const pagesToRewrite = plan === "agency" ? pages : pages.slice(0, 5);
  if (pagesToRewrite.length === 0) return [];

  const pageList = pagesToRewrite
    .map(
      (p, i) =>
        `${i + 1}. URL: ${p.url}
   Title: ${p.title ?? "(missing)"}
   Meta: ${p.description ?? "(missing)"}
   H1: ${p.h1[0] ?? "(missing)"}
   Keywords: ${p.keywords.slice(0, 5).join(", ")}`,
    )
    .join("\n\n");

  const prompt = `You are an SEO copywriter. Rewrite the title tags and meta descriptions for these pages.

Domain: ${domain}
Pages:
${pageList}

Rules:
- Titles: 50-60 characters, include primary keyword, compelling and specific
- Meta descriptions: 150-160 characters, include keyword, clear value proposition, action-oriented
- Keep the brand voice professional but approachable
- Each meta should make someone want to click

Return a JSON array where each object has:
- url: string (exactly as provided)
- originalTitle: string | null
- suggestedTitle: string
- originalMeta: string | null
- suggestedMeta: string
- reasoning: string (1 sentence why this rewrite is better)

No other text.`;

  const key = cacheKey("content", "rewrites", { domain, urls: pagesToRewrite.map((p) => p.url) });
  const raw = await generateContent(prompt, plan, userId, auditId, key);

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as PageRewrite[]) : [];
  } catch {
    return [];
  }
}
