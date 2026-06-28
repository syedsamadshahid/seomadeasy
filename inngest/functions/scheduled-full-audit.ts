import { inngest, auditRequested } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { planFeatures } from "@/lib/plan/features";
import { createAudit } from "@/lib/audit/create";

const REAUDIT_INTERVAL_DAYS = 7;

export const scheduledFullAudit = inngest.createFunction(
  { id: "scheduled-full-audit", name: "Weekly Full Re-audits", triggers: [{ cron: "0 7 * * 1" }] },
  async ({ step }) => {
    const cutoff = new Date(Date.now() - REAUDIT_INTERVAL_DAYS * 24 * 60 * 60 * 1000);

    const projects = await step.run("find-due-agency-projects", async () => {
      return prisma.project.findMany({
        where: {
          user: { plan: "agency" },
          audits: {
            some: {
              status: "done",
              finishedAt: { lte: cutoff },
            },
          },
        },
        include: {
          user: { select: { id: true, plan: true } },
        },
      });
    });

    for (const project of projects) {
      const { canFullReaudit } = planFeatures(project.user.plan);
      if (!canFullReaudit) continue;

      await step.run(`full-reaudit-${project.id}`, async () => {
        const { auditId } = await createAudit(project.user.id, project.domain);
        await inngest.send(auditRequested.create({ auditId }));
      });
    }
  },
);
