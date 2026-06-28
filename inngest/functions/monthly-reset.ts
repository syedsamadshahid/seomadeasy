import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { planFeatures } from "@/lib/plan/features";

/**
 * Monthly usage summary logger.
 * Runs on the 1st of each month at midnight UTC.
 *
 * Usage enforcement already counts from start-of-month dynamically,
 * so no actual "reset" is needed. This function logs a snapshot of
 * each user's prior-month usage for auditing and analytics.
 */
export const monthlyUsageSummary = inngest.createFunction(
  {
    id: "monthly-usage-summary",
    name: "Monthly Usage Summary",
    triggers: [{ cron: "0 0 1 * *" }],
  },
  async ({ step }) => {
    // Compute the previous month boundary
    const now = new Date();
    const monthEnd = new Date(now.getFullYear(), now.getMonth(), 1); // 1st of current month
    const monthStart = new Date(monthEnd);
    monthStart.setMonth(monthStart.getMonth() - 1);

    const users = await step.run("load-active-users", async () => {
      return prisma.user.findMany({
        where: {
          plan: { in: ["pro", "agency"] },
        },
        select: { id: true, email: true, plan: true },
      });
    });

    for (const user of users) {
      await step.run(`log-usage-${user.id}`, async () => {
        const features = planFeatures(user.plan);

        const [auditCount, pageCount, kwCount, totalCostCents] =
          await Promise.all([
            prisma.audit.count({
              where: {
                project: { userId: user.id },
                createdAt: { gte: monthStart, lt: monthEnd },
              },
            }),
            prisma.page.count({
              where: {
                audit: {
                  project: { userId: user.id },
                  createdAt: { gte: monthStart, lt: monthEnd },
                },
              },
            }),
            prisma.keyword.count({
              where: {
                audit: {
                  project: { userId: user.id },
                  createdAt: { gte: monthStart, lt: monthEnd },
                },
              },
            }),
            prisma.usageEvent
              .aggregate({
                where: {
                  userId: user.id,
                  createdAt: { gte: monthStart, lt: monthEnd },
                },
                _sum: { costCents: true },
              })
              .then((r) => r._sum.costCents ?? 0),
          ]);

        // Log a summary usage event for the prior month
        await prisma.usageEvent.create({
          data: {
            userId: user.id,
            vendor: "system",
            endpoint: "monthly-summary",
            units: 1,
            costCents: 0,
          },
        });

        console.log(
          `[monthly-usage] user=${user.id} plan=${user.plan} ` +
            `audits=${auditCount} pages=${pageCount}/${features.pagesPoolPerMonth} ` +
            `keywords=${kwCount}/${features.keywordsTracked} ` +
            `cost=$${(totalCostCents / 100).toFixed(2)}`,
        );
      });
    }
  },
);
