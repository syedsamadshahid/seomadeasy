import type { Plan } from "@prisma/client";
import { prisma } from "@/lib/db";
import { planFeatures } from "@/lib/plan/features";
import { assertCanRunAudit } from "@/lib/plan/enforce";
import { normalizeDomain } from "@/lib/validation/domain";

export class ComparisonError extends Error {
  constructor(
    message: string,
    public readonly code: "limit" | "no_competitors" | "invalid",
    public readonly upgrade = false,
  ) {
    super(message);
    this.name = "ComparisonError";
  }
}

export interface CreateComparisonResult {
  groupId: string;
  primaryAuditId: string;
  memberAuditIds: string[];
}

/**
 * Creates a comparison group: the user's own audit plus one audit per competitor
 * domain. All member audits share the group so the GEO head-to-head uses one
 * shared prompt set. Enforces the per-plan competitor cap and reserves monthly
 * audit slots for every member up front (no partial groups).
 */
export async function createComparison(
  userId: string,
  plan: Plan,
  rawDomain: string,
  rawCompetitors: string[],
): Promise<CreateComparisonResult> {
  const domain = normalizeDomain(rawDomain);

  // Normalize, dedupe, drop the primary domain itself.
  const competitors = [...new Set(rawCompetitors.map(normalizeDomain))].filter(
    (d) => d.length > 0 && d !== domain,
  );

  if (competitors.length === 0) {
    throw new ComparisonError("Add at least one competitor domain to compare.", "no_competitors");
  }

  const { maxCompetitors } = planFeatures(plan);
  if (competitors.length > maxCompetitors) {
    throw new ComparisonError(
      `Your ${plan} plan allows up to ${maxCompetitors} competitor${maxCompetitors === 1 ? "" : "s"} per comparison.`,
      "limit",
      true,
    );
  }

  // Reserve a monthly audit slot for the primary + every competitor (atomic).
  await assertCanRunAudit(userId, plan, competitors.length + 1);

  // Ensure the user's project exists (mirrors createAudit's upsert).
  const project = await prisma.project.upsert({
    where: { userId_domain: { userId, domain } },
    create: { userId, domain, displayName: domain },
    update: {},
  });

  // Create the group and all member audits in one transaction.
  return prisma.$transaction(async (tx) => {
    const group = await tx.comparisonGroup.create({
      data: { projectId: project.id, status: "queued" },
    });

    const primary = await tx.audit.create({
      data: { projectId: project.id, status: "queued", comparisonGroupId: group.id },
    });

    const competitorAudits = await Promise.all(
      competitors.map((competitorDomain) =>
        tx.audit.create({
          data: {
            projectId: project.id,
            status: "queued",
            subjectDomain: competitorDomain,
            comparisonGroupId: group.id,
          },
        }),
      ),
    );

    await tx.comparisonGroup.update({
      where: { id: group.id },
      data: { primaryAuditId: primary.id },
    });

    return {
      groupId: group.id,
      primaryAuditId: primary.id,
      memberAuditIds: [primary.id, ...competitorAudits.map((a) => a.id)],
    };
  });
}
