import { generateContent } from "@/lib/clients/content";
import { cacheKey } from "@/lib/cache";
import type { Plan } from "@prisma/client";

export interface CompetitorBrief {
  summary: string;
  whereYouLose: string[];
  quickWins: string[];
  geoStrategy: string[];
}

export interface CompetitorBriefInput {
  domain: string;
  overallScore: number | null;
  // category -> your score
  yourScores: Record<string, number | null>;
  competitors: Array<{
    domain: string;
    overallScore: number | null;
    scores: Record<string, number | null>;
  }>;
  // GEO questions where a competitor beat you (you absent / less prominent).
  geoGaps: Array<{ prompt: string; engine: string; winner: string }>;
}

const EMPTY: CompetitorBrief = { summary: "", whereYouLose: [], quickWins: [], geoStrategy: [] };

export async function generateCompetitorBrief(
  input: CompetitorBriefInput,
  plan: Plan,
  userId: string,
  auditId: string,
): Promise<CompetitorBrief> {
  const fmt = (s: Record<string, number | null>) =>
    Object.entries(s)
      .map(([cat, v]) => `${cat}=${v ?? "n/a"}`)
      .join(", ");

  const competitorLines = input.competitors
    .map((c) => `  • ${c.domain} — overall ${c.overallScore ?? "n/a"} (${fmt(c.scores)})`)
    .join("\n");

  const gapLines =
    input.geoGaps.slice(0, 12).map((g) => `  • "${g.prompt}" on ${g.engine} → won by ${g.winner}`).join("\n") ||
    "  • (none — you lead the AI answers)";

  const prompt = `You are an SEO + Generative Engine Optimization (GEO) strategist. Compare "${input.domain}" against its competitors and explain, concretely, how it can win.

Your site "${input.domain}" — overall ${input.overallScore ?? "n/a"} (${fmt(input.yourScores)})

Competitors:
${competitorLines}

AI-answer questions where a competitor currently beats you:
${gapLines}

Scores are 0–100 (higher is better) across: onpage (on-page SEO), perf (performance), links (broken links), authority (domain authority/backlinks), keywords, traffic, geo (AI visibility).

Produce a JSON object with exactly these keys:
1. summary: 2-3 sentences — who is ahead overall and the single biggest opportunity for ${input.domain}.
2. whereYouLose: array of 3-6 specific observations naming the competitor and the category/question they beat you on, with the likely reason.
3. quickWins: array of 4-6 prioritized, concrete actions to close the gaps fastest.
4. geoStrategy: array of 3-5 GEO-specific moves (answer-first structure, FAQ/schema, entity clarity, topical coverage) to win the AI-answer questions above.

Return only the JSON object. No other text.`;

  const key = cacheKey("content", "competitor-brief", {
    domain: input.domain,
    competitors: input.competitors.map((c) => c.domain),
    gaps: input.geoGaps.length,
  });

  const raw = await generateContent(prompt, plan, userId, auditId, key);

  try {
    const parsed = JSON.parse(raw) as Partial<CompetitorBrief>;
    return {
      summary: parsed.summary ?? "",
      whereYouLose: Array.isArray(parsed.whereYouLose) ? parsed.whereYouLose : [],
      quickWins: Array.isArray(parsed.quickWins) ? parsed.quickWins : [],
      geoStrategy: Array.isArray(parsed.geoStrategy) ? parsed.geoStrategy : [],
    };
  } catch {
    return EMPTY;
  }
}
