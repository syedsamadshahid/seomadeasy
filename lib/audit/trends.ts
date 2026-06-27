import { prisma } from "@/lib/db";
import { planFeatures } from "@/lib/plan/features";
import type { Plan } from "@prisma/client";

// Reuse the same per-run scoring formula from lib/geo/score.ts
function scoreRun(run: {
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

export type TrendPoint = {
  auditId: string;
  date: Date | null;
  overallScore: number | null;
  geoScore: number | null;
};

export type EnginePoint = {
  auditId: string;
  date: Date | null;
  engine: string;
  score: number;
};

export type CompetitorFreq = {
  name: string;
  count: number;
};

export type TrendData = {
  trend: TrendPoint[];
  perEngine: EnginePoint[];
  competitors: CompetitorFreq[];
};

export async function getProjectTrends(
  projectId: string,
  plan: Plan,
): Promise<TrendData> {
  const { trendDays } = planFeatures(plan);
  const since = new Date(Date.now() - trendDays * 24 * 60 * 60 * 1000);

  const audits = await prisma.audit.findMany({
    where: {
      projectId,
      status: "done",
      finishedAt: { gte: since },
    },
    orderBy: { finishedAt: "asc" },
    select: {
      id: true,
      finishedAt: true,
      overallScore: true,
      results: {
        where: { category: "geo" },
        select: { score: true },
      },
      geoRuns: {
        select: {
          engine: true,
          mentioned: true,
          cited: true,
          prominence: true,
          sentiment: true,
          competitorsNamed: true,
        },
      },
    },
  });

  const trend: TrendPoint[] = audits.map((a) => ({
    auditId: a.id,
    date: a.finishedAt,
    overallScore: a.overallScore,
    geoScore: a.results[0]?.score ?? null,
  }));

  // Per-engine: average score per engine per audit
  const perEngine: EnginePoint[] = [];
  for (const audit of audits) {
    // Group runs by engine
    const byEngine = new Map<string, typeof audit.geoRuns>();
    for (const run of audit.geoRuns) {
      const arr = byEngine.get(run.engine) ?? [];
      arr.push(run);
      byEngine.set(run.engine, arr);
    }
    for (const [engine, runs] of byEngine) {
      const avg = Math.round(
        runs.reduce((sum, r) => sum + scoreRun(r), 0) / runs.length,
      );
      perEngine.push({ auditId: audit.id, date: audit.finishedAt, engine, score: avg });
    }
  }

  // Competitors: frequency across all audits in window
  const freq = new Map<string, number>();
  for (const audit of audits) {
    for (const run of audit.geoRuns) {
      const names = Array.isArray(run.competitorsNamed)
        ? (run.competitorsNamed as string[])
        : [];
      for (const name of names) {
        freq.set(name, (freq.get(name) ?? 0) + 1);
      }
    }
  }
  const competitors: CompetitorFreq[] = [...freq.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  return { trend, perEngine, competitors };
}
