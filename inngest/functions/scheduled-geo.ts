import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { planFeatures } from "@/lib/plan/features";
import { createGeoRecheckAudit } from "@/lib/audit/geo-recheck";
import { assertUnderCeiling } from "@/lib/audit/cost";
import { runGeoForAudit } from "@/lib/geo/run";
import { resend, FROM_EMAIL } from "@/lib/email/resend";
import { geoChangeEmailHtml } from "@/lib/email/change-email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const GEO_ALERT_DELTA = 10;
const RECHECK_INTERVAL_DAYS = 7;

export const scheduledGeo = inngest.createFunction(
  { id: "scheduled-geo", name: "Weekly GEO Re-checks", triggers: [{ cron: "0 8 * * 1" }] },
  async ({ step }) => {
    const cutoff = new Date(Date.now() - RECHECK_INTERVAL_DAYS * 24 * 60 * 60 * 1000);

    const projects = await step.run("find-due-projects", async () => {
      // Find projects with Pro/Agency users whose most recent done audit is older than 7 days
      return prisma.project.findMany({
        where: {
          user: { plan: { in: ["pro", "agency"] } },
          audits: {
            some: {
              status: "done",
              finishedAt: { lte: cutoff },
            },
          },
        },
        include: {
          user: { select: { id: true, email: true, plan: true } },
        },
      });
    });

    for (const project of projects) {
      const { canGeoRecheck } = planFeatures(project.user.plan);
      if (!canGeoRecheck) continue;

      await step.run(`geo-recheck-${project.id}`, async () => {
        const ctx = await createGeoRecheckAudit(project.id);
        if (!ctx) return;

        await prisma.audit.update({
          where: { id: ctx.auditId },
          data: { status: "running", startedAt: new Date() },
        });

        try {
          await assertUnderCeiling(ctx.auditId);
          const { geoScore } = await runGeoForAudit({
            auditId: ctx.auditId,
            domain: ctx.domain,
            plan: ctx.plan,
            userId: ctx.userId,
            keywords: ctx.keywords,
          });

          await prisma.audit.update({
            where: { id: ctx.auditId },
            data: { status: "done", finishedAt: new Date(), overallScore: geoScore },
          });

          // Notify on significant change
          if (
            ctx.previousGeoScore !== null &&
            resend &&
            Math.abs(geoScore - ctx.previousGeoScore) >= GEO_ALERT_DELTA
          ) {
            const reportUrl = `${APP_URL}/dashboard/audits/${ctx.auditId}`;
            await resend.emails.send({
              from: FROM_EMAIL,
              to: project.user.email,
              subject: `AI Visibility change detected for ${ctx.domain}`,
              html: geoChangeEmailHtml({
                domain: ctx.domain,
                previousScore: ctx.previousGeoScore,
                newScore: geoScore,
                reportUrl,
              }),
            });
          }
        } catch {
          await prisma.audit
            .update({ where: { id: ctx.auditId }, data: { status: "failed", finishedAt: new Date() } })
            .catch(() => {});
        }
      });
    }
  },
);
