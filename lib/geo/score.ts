import { prisma } from "@/lib/db";

// Increment this when the scoring formula changes so trend comparisons stay valid.
export const SCORING_VERSION = "v1";

// Per-run breakdown: mention=30, citation=40, prominence=20 (scaled 0–10), sentiment=10
export function scoreRun(run: {
  mentioned: boolean;
  cited: boolean;
  prominence: number | null;
  sentiment: string | null;
}): number {
  let score = 0;
  if (run.mentioned) score += 30;
  if (run.cited) score += 40;
  score += Math.round(((run.prominence ?? 0) / 10) * 20);
  if (run.sentiment === "positive") score += 10;
  else if (run.sentiment === "negative") score -= 10;
  return Math.min(100, Math.max(0, score));
}

export async function computeGeoScore(auditId: string): Promise<number> {
  const runs = await prisma.geoRun.findMany({
    where: { auditId },
    select: { mentioned: true, cited: true, prominence: true, sentiment: true },
  });
  if (runs.length === 0) return 0;

  const total = runs.reduce((sum, r) => sum + scoreRun(r), 0);
  return Math.round(total / runs.length);
}

// Aggregate competitor frequency across all runs for an audit
export async function topCompetitors(
  auditId: string,
  limit = 10,
): Promise<Array<{ name: string; count: number }>> {
  const runs = await prisma.geoRun.findMany({
    where: { auditId },
    select: { competitorsNamed: true },
  });

  const freq = new Map<string, number>();
  for (const run of runs) {
    const names = Array.isArray(run.competitorsNamed) ? (run.competitorsNamed as string[]) : [];
    for (const name of names) {
      freq.set(name, (freq.get(name) ?? 0) + 1);
    }
  }

  return [...freq.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}
