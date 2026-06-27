import { generateContent } from "@/lib/clients/content";
import { cacheKey } from "@/lib/cache";
import type { Plan } from "@prisma/client";

export interface GeoBrief {
  summary: string;
  answerFirstStructure: string;
  faqSchema: string;
  entityClarityTips: string[];
  topicalGaps: string[];
  competitorAdvantages: string[];
}

export async function generateGeoBrief(
  domain: string,
  geoScore: number,
  geoPrompts: string[],
  competitors: string[],
  mentioned: boolean,
  cited: boolean,
  plan: Plan,
  userId: string,
  auditId: string,
): Promise<GeoBrief> {
  const prompt = `You are a Generative Engine Optimization (GEO) expert. Create a detailed content brief to improve ${domain}'s visibility in AI-generated answers.

Current AI visibility:
- GEO score: ${geoScore}/100
- Brand mentioned: ${mentioned}
- Brand cited as source: ${cited}
- Sample queries where brand should appear:
${geoPrompts.slice(0, 5).map((q) => `  • ${q}`).join("\n")}
- Competitors appearing instead: ${competitors.slice(0, 5).join(", ") || "none identified"}

Generate a comprehensive GEO content brief with:

1. summary: 2-3 sentence assessment of current AI visibility and the main opportunity
2. answerFirstStructure: A content structure template that directly answers queries in the first paragraph (show the actual template with [placeholders])
3. faqSchema: Complete JSON-LD FAQ schema markup (valid JSON-LD, 5 Q&A pairs based on the sample queries above)
4. entityClarityTips: Array of 4-6 specific tips to make ${domain}'s brand entity clearer to AI models
5. topicalGaps: Array of 4-6 content topics the site should cover to appear in AI answers (based on competitor content patterns)
6. competitorAdvantages: Array of 3-5 specific reasons competitors appear instead, with how to counter each

Return a JSON object with exactly those 6 keys. The faqSchema must be valid JSON-LD as a string. No other text.`;

  const key = cacheKey("content", "geo-brief", { domain, geoScore, competitors: competitors.slice(0, 5) });
  const raw = await generateContent(prompt, plan, userId, auditId, key);

  try {
    const parsed = JSON.parse(raw) as Partial<GeoBrief>;
    return {
      summary: parsed.summary ?? "",
      answerFirstStructure: parsed.answerFirstStructure ?? "",
      faqSchema: parsed.faqSchema ?? "",
      entityClarityTips: Array.isArray(parsed.entityClarityTips) ? parsed.entityClarityTips : [],
      topicalGaps: Array.isArray(parsed.topicalGaps) ? parsed.topicalGaps : [],
      competitorAdvantages: Array.isArray(parsed.competitorAdvantages) ? parsed.competitorAdvantages : [],
    };
  } catch {
    return {
      summary: "",
      answerFirstStructure: "",
      faqSchema: "",
      entityClarityTips: [],
      topicalGaps: [],
      competitorAdvantages: [],
    };
  }
}
