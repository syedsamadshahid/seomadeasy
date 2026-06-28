import type { Plan } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface GeoRecheckContext {
  auditId: string;
  previousAuditId: string;
  domain: string;
  plan: Plan;
  userId: string;
  keywords: string[];
  previousGeoScore: number | null;
}

export async function createGeoRecheckAudit(
  projectId: string,
): Promise<GeoRecheckContext | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      user: { select: { id: true, plan: true } },
      audits: {
        where: { status: "done" },
        orderBy: { finishedAt: "desc" },
        take: 1,
        include: {
          keywords: { orderBy: { volume: "desc" }, take: 20, select: { term: true } },
          results: { where: { category: "geo" }, select: { score: true } },
        },
      },
    },
  });

  if (!project) return null;
  const latestAudit = project.audits[0];
  if (!latestAudit) return null;

  const newAudit = await prisma.audit.create({
    data: { projectId, status: "queued" },
  });

  return {
    auditId: newAudit.id,
    previousAuditId: latestAudit.id,
    domain: project.domain,
    plan: project.user.plan,
    userId: project.user.id,
    keywords: latestAudit.keywords.map((k) => k.term),
    previousGeoScore: latestAudit.results[0]?.score ?? null,
  };
}
