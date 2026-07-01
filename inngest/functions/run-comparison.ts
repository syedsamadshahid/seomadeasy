import { NonRetriableError } from "inngest";
import { inngest, comparisonRequested } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { generateGeoPrompts } from "@/lib/geo/prompts";
import { runAudit } from "@/inngest/functions/run-audit";
import { computeComparison } from "@/lib/audit/comparison-compute";

export const runComparison = inngest.createFunction(
  { id: "run-comparison", retries: 1, triggers: [{ event: comparisonRequested }] },
  async ({ event, step }) => {
    const { groupId } = event.data;

    const group = await step.run("load-group", async () => {
      const g = await prisma.comparisonGroup.findUnique({
        where: { id: groupId },
        include: {
          project: {
            select: {
              domain: true,
              userId: true,
              user: { select: { plan: true } },
              trackedKeywords: { select: { term: true }, take: 20 },
            },
          },
          audits: { select: { id: true } },
        },
      });
      if (!g) throw new NonRetriableError(`ComparisonGroup ${groupId} not found`);
      return g;
    });

    const userId = group.project.userId;
    const plan = group.project.user.plan;
    const primaryAuditId = group.primaryAuditId ?? group.audits[0]?.id;

    await step.run("mark-running", async () => {
      await prisma.comparisonGroup.update({
        where: { id: groupId },
        data: { status: "running" },
      });
    });

    // Generate ONE shared GEO prompt set from the primary domain + tracked keywords.
    // Every member audit reuses it so the head-to-head is apples-to-apples.
    await step.run("generate-shared-prompts", async () => {
      const existing = await prisma.comparisonGroup.findUnique({
        where: { id: groupId },
        select: { sharedPrompts: true },
      });
      if (Array.isArray(existing?.sharedPrompts) && existing.sharedPrompts.length > 0) return;

      const keywords = group.project.trackedKeywords.map((k) => k.term);
      const prompts = await generateGeoPrompts(
        group.project.domain,
        keywords,
        plan,
        userId,
        primaryAuditId ?? groupId,
      );
      await prisma.comparisonGroup.update({
        where: { id: groupId },
        data: { sharedPrompts: prompts },
      });
    });

    try {
      // Fan out: run every member audit (primary + competitors) and wait for all.
      // step.invoke waits for full completion (including retries); a competitor that
      // ultimately fails is tolerated so the comparison still renders with the rest.
      await Promise.all(
        group.audits.map((a) =>
          step
            .invoke(`audit-${a.id}`, { function: runAudit, data: { auditId: a.id } })
            .catch(() => null),
        ),
      );

      // Fan in: compute the head-to-head report from all member audits.
      await step.run("compute-comparison", async () => {
        await computeComparison(groupId);
      });
    } catch (err) {
      await prisma.comparisonGroup
        .update({ where: { id: groupId }, data: { status: "failed" } })
        .catch(() => {});
      throw err;
    }

    return { groupId };
  },
);
