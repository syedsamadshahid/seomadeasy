import { NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { assembleResults } from "@/lib/audit/create";
import { planFeatures } from "@/lib/plan/features";
import { AuditReportPdf } from "@/lib/pdf/AuditReportPdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: auditId } = await params;
  const user = await getCurrentUser();

  const audit = await assembleResults(auditId, user.id);
  if (!audit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const features = planFeatures(user.plan);
  const project = await import("@/lib/db").then(({ prisma }) =>
    prisma.project.findFirst({
      where: { audits: { some: { id: auditId } } },
      select: { domain: true, brandLogoUrl: true, brandColor: true },
    }),
  );

  const geoResult = audit.results.find((r) => r.category === "geo");
  const geoScore = geoResult?.score ?? null;

  const stream = await renderToStream(
    AuditReportPdf({
      domain: project?.domain ?? "Unknown",
      overallScore: audit.overallScore,
      geoScore,
      results: audit.results,
      keywords: audit.keywords,
      geoRuns: audit.geoRuns,
      brandLogoUrl: features.canWhiteLabel ? project?.brandLogoUrl : null,
      brandColor: features.canCustomColor ? project?.brandColor : null,
      finishedAt: audit.finishedAt,
    }),
  );

  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const pdf = Buffer.concat(chunks);

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="vantage-report-${auditId}.pdf"`,
    },
  });
}
