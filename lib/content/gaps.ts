import { generateContent } from "@/lib/clients/content";
import { cacheKey } from "@/lib/cache";
import type { Plan } from "@prisma/client";

export interface ContentGap {
  topic: string;
  whyGap: string;
  targetKeywords: string[];
}

export interface ContentOutline {
  title: string;
  targetKeyword: string;
  sections: string[];
  geoAngle: string;
}

export interface ContentGapAnalysis {
  competitors: string[];
  keywordGaps: ContentGap[];
  outlines: ContentOutline[];
}

export async function generateContentGaps(
  domain: string,
  brandKeywords: string[],
  competitors: string[],
  geoPrompts: string[],
  plan: Plan,
  userId: string,
  auditId: string,
): Promise<ContentGapAnalysis | null> {
  if (plan !== "agency") return null;

  const top3 = competitors.slice(0, 3);
  if (top3.length === 0) return null;

  const prompt = `You are an SEO and content strategy expert. Analyze the keyword gaps between ${domain} and its top competitors, then create content outlines to close those gaps.

Brand domain: ${domain}
Brand's current keywords: ${brandKeywords.slice(0, 20).join(", ") || "none"}
Top competitors (appearing in AI answers instead of the brand): ${top3.join(", ")}
AI queries where the brand should appear:
${geoPrompts.slice(0, 5).map((q) => `  • ${q}`).join("\n")}

Identify 4-6 keyword gap themes these competitors likely dominate that ${domain} is missing, then create exactly 3 content outlines to capture that traffic AND improve AI visibility.

Return a JSON object with exactly these keys:
- competitors: array of the 3 competitor domains you analyzed
- keywordGaps: array of 4-6 objects, each with:
  - topic: the content theme gap (e.g. "pricing comparison guides")
  - whyGap: 1 sentence explaining why this gap hurts AI visibility
  - targetKeywords: array of 2-4 specific keyword phrases to target
- outlines: array of exactly 3 objects, each with:
  - title: compelling article title including primary keyword
  - targetKeyword: the primary keyword phrase
  - sections: array of 4-6 H2/H3 section headings for the article
  - geoAngle: 1 sentence explaining how this article wins AI-answer inclusion (answer-first, FAQ schema, entity authority, etc.)

No other text. Return valid JSON only.`;

  const key = cacheKey("content", "gaps", { domain, competitors: top3 });
  const raw = await generateContent(prompt, plan, userId, auditId, key);

  try {
    const parsed = JSON.parse(raw) as Partial<ContentGapAnalysis>;
    return {
      competitors: Array.isArray(parsed.competitors) ? parsed.competitors : top3,
      keywordGaps: Array.isArray(parsed.keywordGaps) ? parsed.keywordGaps : [],
      outlines: Array.isArray(parsed.outlines) ? parsed.outlines : [],
    };
  } catch {
    return { competitors: top3, keywordGaps: [], outlines: [] };
  }
}
