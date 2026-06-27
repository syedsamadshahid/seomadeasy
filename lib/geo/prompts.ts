import { cacheKey } from "@/lib/cache";
import { geminiGenerate } from "@/lib/clients/gemini";
import type { Plan } from "@prisma/client";

const PROMPT_CAPS: Record<Plan, number> = {
  free: 3,
  pro: 10,
  agency: 20,
};

export function promptCapForPlan(plan: Plan): number {
  return PROMPT_CAPS[plan];
}

export async function generateGeoPrompts(
  domain: string,
  keywords: string[],
  plan: Plan,
  userId: string,
  auditId: string,
): Promise<string[]> {
  const cap = promptCapForPlan(plan);
  const topKeywords = keywords.slice(0, 20).join(", ");

  const prompt = `Generate ${cap} search questions that a user would type into an AI assistant (like ChatGPT or Perplexity) when looking for businesses, tools, or services related to this website.

Domain: ${domain}
Top keywords: ${topKeywords}

Rules:
- Questions must be natural language, as a real user would ask
- Questions should be specific enough that a real business could appear in the answer
- Vary specificity: mix broad industry questions with narrow task-specific ones
- Do NOT mention "${domain}" by name in the questions

Return ONLY a JSON array of ${cap} question strings. No other text.`;

  const key = cacheKey("gemini", "geo-prompts", { domain, topKeywords, cap });

  const raw = await geminiGenerate(prompt, userId, auditId, {
    cacheKey: key,
    ttlSeconds: 7 * 24 * 60 * 60,
    jsonMode: true,
  });

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return (parsed as string[]).slice(0, cap);
    return [];
  } catch {
    return [];
  }
}
