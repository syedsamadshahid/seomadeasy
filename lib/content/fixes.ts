import { generateContent } from "@/lib/clients/content";
import { cacheKey } from "@/lib/cache";
import type { Plan } from "@prisma/client";

export interface Fix {
  category: string;
  issue: string;
  impact: "high" | "medium" | "low";
  why: string;
  howToFix: string;
}

const IMPACT_CAP: Record<Plan, number> = { free: 5, pro: 10, agency: 999 };

export async function generateFixList(
  auditSummary: {
    domain: string;
    onpageScore: number | null;
    perfScore: number | null;
    linksScore: number | null;
    authorityScore: number | null;
    keywordsScore: number | null;
    geoScore: number | null;
    topIssues: string[];
    topKeywords: string[];
    geoMentioned: boolean;
    geoCited: boolean;
    topCompetitors: string[];
  },
  plan: Plan,
  userId: string,
  auditId: string,
): Promise<Fix[]> {
  const cap = IMPACT_CAP[plan];

  const prompt = `You are an SEO and AI visibility expert. Generate a prioritized list of fixes for this website audit.

Domain: ${auditSummary.domain}
Scores (0-100):
- On-page SEO: ${auditSummary.onpageScore ?? "N/A"}
- Performance: ${auditSummary.perfScore ?? "N/A"}
- Broken Links: ${auditSummary.linksScore ?? "N/A"}
- Domain Authority: ${auditSummary.authorityScore ?? "N/A"}
- Keywords: ${auditSummary.keywordsScore ?? "N/A"}
- AI Visibility (GEO): ${auditSummary.geoScore ?? "N/A"}

Key issues found: ${auditSummary.topIssues.slice(0, 10).join(", ") || "none"}
Top keywords: ${auditSummary.topKeywords.slice(0, 8).join(", ") || "none"}
AI visibility: mentioned=${auditSummary.geoMentioned}, cited=${auditSummary.geoCited}
Competitors appearing instead: ${auditSummary.topCompetitors.slice(0, 5).join(", ") || "none"}

Generate exactly ${Math.min(cap, 15)} fixes ranked by business impact. For each fix return:
- category: one of "onpage", "performance", "links", "authority", "keywords", "geo"
- issue: specific problem found (1 sentence)
- impact: "high", "medium", or "low"
- why: business reason this matters (1-2 sentences)
- howToFix: concrete action steps (2-4 sentences)

Return a JSON array of fix objects. No other text.`;

  const key = cacheKey("content", "fixes", { domain: auditSummary.domain, scores: { o: auditSummary.onpageScore, g: auditSummary.geoScore } });
  const raw = await generateContent(prompt, plan, userId, auditId, key);

  try {
    const parsed = JSON.parse(raw) as unknown;
    const arr = Array.isArray(parsed) ? parsed : [];
    return (arr as Fix[]).slice(0, cap);
  } catch {
    return [];
  }
}
