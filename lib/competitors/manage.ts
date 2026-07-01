import { prisma } from "@/lib/db";
import { planFeatures } from "@/lib/plan/features";
import type { Plan } from "@prisma/client";

export class CompetitorError extends Error {
  constructor(
    message: string,
    public readonly code: "not_found" | "limit" | "duplicate" | "self" | "invalid",
  ) {
    super(message);
    this.name = "CompetitorError";
  }
}

export type CompetitorRow = { id: string; domain: string; createdAt: Date };

// Verify the project belongs to the user; returns the project's own domain.
async function ownedProjectDomain(projectId: string, userId: string): Promise<string> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true, domain: true },
  });
  if (!project || project.userId !== userId) {
    throw new CompetitorError("Project not found", "not_found");
  }
  return project.domain;
}

export async function listCompetitors(
  projectId: string,
  userId: string,
): Promise<CompetitorRow[]> {
  await ownedProjectDomain(projectId, userId);
  return prisma.competitor.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: { id: true, domain: true, createdAt: true },
  });
}

export async function addCompetitor(
  projectId: string,
  userId: string,
  plan: Plan,
  domain: string,
): Promise<CompetitorRow> {
  const ownDomain = await ownedProjectDomain(projectId, userId);

  if (domain === ownDomain) {
    throw new CompetitorError("A project cannot compete against itself.", "self");
  }

  const { maxCompetitors } = planFeatures(plan);
  const existing = await prisma.competitor.count({ where: { projectId } });
  if (existing >= maxCompetitors) {
    throw new CompetitorError(
      `Your ${plan} plan allows up to ${maxCompetitors} competitor${maxCompetitors === 1 ? "" : "s"} per project.`,
      "limit",
    );
  }

  try {
    return await prisma.competitor.create({
      data: { projectId, domain },
      select: { id: true, domain: true, createdAt: true },
    });
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
      throw new CompetitorError("This competitor is already tracked.", "duplicate");
    }
    throw err;
  }
}

export async function removeCompetitor(
  competitorId: string,
  userId: string,
): Promise<void> {
  const competitor = await prisma.competitor.findUnique({
    where: { id: competitorId },
    select: { project: { select: { userId: true } } },
  });
  if (!competitor || competitor.project.userId !== userId) {
    throw new CompetitorError("Competitor not found", "not_found");
  }
  await prisma.competitor.delete({ where: { id: competitorId } });
}
