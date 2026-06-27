import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { renderToStream } from "@react-pdf/renderer";
import { AuditReportPdf } from "@/lib/pdf/AuditReportPdf";
import { resend, FROM_EMAIL } from "@/lib/email/resend";
import { reportEmailHtml } from "@/lib/email/report-email";
import { planFeatures } from "@/lib/plan/features";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const scheduledReports = inngest.createFunction(
  { id: "scheduled-reports", name: "Scheduled Reports", triggers: [{ cron: "0 9 * * *" }] },
  async ({ step }) => {
    const now = new Date();

    const due = await step.run("find-due-reports", async () => {
      return prisma.scheduledReport.findMany({
        where: { enabled: true },
        include: {
          project: {
            include: {
              user: { select: { email: true, plan: true } },
              audits: {
                where: { status: "done" },
                orderBy: { finishedAt: "desc" },
                take: 1,
                include: {
                  results: { where: { category: "geo" }, select: { score: true } },
                },
              },
            },
          },
        },
      });
    });

    for (const schedule of due) {
      // Check if due based on cadence
      const isDue = (() => {
        if (!schedule.lastRunAt) return true;
        const elapsed = now.getTime() - new Date(schedule.lastRunAt).getTime();
        const dayMs = 24 * 60 * 60 * 1000;
        return schedule.cadence === "weekly"
          ? elapsed >= 7 * dayMs
          : elapsed >= 30 * dayMs;
      })();

      if (!isDue) continue;

      const latestAudit = schedule.project.audits[0];
      if (!latestAudit) continue;

      const auditId = latestAudit.id;
      const domain = schedule.project.domain;
      const userEmail = schedule.project.user.email;
      const geoScore = latestAudit.results[0]?.score ?? null;

      await step.run(`send-report-${schedule.id}`, async () => {
        // Enforce plan gate — disable schedule if user downgraded
        const { canSchedule } = planFeatures(schedule.project.user.plan);
        if (!canSchedule) {
          await prisma.scheduledReport.update({
            where: { id: schedule.id },
            data: { enabled: false },
          });
          return;
        }

        // Generate PDF
        const allAuditData = await prisma.audit.findUnique({
          where: { id: auditId },
          include: {
            results: true,
            keywords: { orderBy: { volume: "desc" }, take: 100 },
            geoRuns: true,
          },
        });

        if (!allAuditData) return;

        const stream = await renderToStream(
          AuditReportPdf({
            domain,
            overallScore: allAuditData.overallScore,
            geoScore,
            results: allAuditData.results,
            keywords: allAuditData.keywords,
            geoRuns: allAuditData.geoRuns,
            brandLogoUrl: schedule.project.brandLogoUrl,
            brandColor: schedule.project.brandColor,
            finishedAt: allAuditData.finishedAt,
          }),
        );

        const chunks: Buffer[] = [];
        for await (const chunk of stream as AsyncIterable<Buffer>) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const pdfBuffer = Buffer.concat(chunks);

        const reportUrl = `${APP_URL}/dashboard/audits/${auditId}`;
        const pdfUrl = `${APP_URL}/api/audits/${auditId}/pdf`;

        const html = reportEmailHtml({
          domain,
          overallScore: allAuditData.overallScore,
          geoScore,
          reportUrl,
          pdfUrl,
        });

        if (resend) {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: userEmail,
            subject: `Your Vantage report for ${domain} is ready`,
            html,
            attachments: [
              {
                filename: `vantage-report-${domain}.pdf`,
                content: pdfBuffer.toString("base64"),
              },
            ],
          });
        }

        await prisma.scheduledReport.update({
          where: { id: schedule.id },
          data: { lastRunAt: now },
        });
      });
    }
  },
);
