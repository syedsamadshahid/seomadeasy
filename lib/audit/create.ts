import { prisma } from "@/lib/db";

export async function createAudit(
  userId: string,
  domain: string,
): Promise<{ auditId: string }> {
  const project = await prisma.project.upsert({
    where: { userId_domain: { userId, domain } },
    create: { userId, domain, displayName: domain },
    update: {},
  });

  const audit = await prisma.audit.create({
    data: { projectId: project.id, status: "queued" },
  });

  return { auditId: audit.id };
}

export async function assembleResults(auditId: string, userId: string) {
  const audit = await prisma.audit.findFirst({
    where: { id: auditId, project: { userId } },
    include: {
      results: true,
      pages: { orderBy: { estTraffic: "desc" } },
      keywords: { orderBy: { volume: "desc" }, take: 100 },
      geoRuns: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!audit) return null;

  return {
    id: audit.id,
    status: audit.status,
    overallScore: audit.overallScore,
    costCents: audit.costCents,
    startedAt: audit.startedAt,
    finishedAt: audit.finishedAt,
    results: audit.results.map((r) => ({
      category: r.category,
      score: r.score,
      payload: r.payload,
    })),
    pages: audit.pages.map((p) => ({
      url: p.url,
      estTraffic: p.estTraffic,
      onPageIssues: p.onPageIssues,
      perf: p.perf,
    })),
    keywords: audit.keywords.map((k) => ({
      term: k.term,
      volume: k.volume,
      difficulty: k.difficulty,
      cpc: k.cpc,
      position: k.position,
      intent: k.intent,
    })),
    geoRuns: audit.geoRuns.map((g) => ({
      engine: g.engine,
      prompt: g.prompt,
      mentioned: g.mentioned,
      cited: g.cited,
      prominence: g.prominence,
      sentiment: g.sentiment,
      competitorsNamed: g.competitorsNamed,
      engineVersion: g.engineVersion,
    })),
  };
}
