import { NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { assembleResults } from "@/lib/audit/create";
import { planFeatures } from "@/lib/plan/features";
import { AuditReportPdf } from "@/lib/pdf/AuditReportPdf";
import { getPayload } from "@/lib/audit/report-types";

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

  const authority = getPayload(audit.results, "authority");
  const perf = getPayload(audit.results, "perf");
  const content = getPayload(audit.results, "content");

  const backlinks = authority
    ? {
        totalBacklinks: authority.backlinks.totalBacklinks,
        referringDomains: authority.backlinks.referringDomains,
        rank: authority.domainRank.rank,
      }
    : null;

  const perfPages = (perf?.pages ?? [])
    .filter((p) => p.lcp !== null || p.cls !== null || p.inp !== null)
    .slice(0, 5)
    .map((p) => ({ url: p.url, lcp: p.lcp, cls: p.cls, inp: p.inp }));

  const fixes = (content?.fixList ?? [])
    .slice(0, 8)
    .map((f) => ({ category: f.category, impact: f.impact, issue: f.issue }));

  const stream = await renderToStream(
    AuditReportPdf({
      domain: project?.domain ?? "Unknown",
      overallScore: audit.overallScore,
      geoScore,
      results: audit.results,
      keywords: audit.keywords,
      geoRuns: audit.geoRuns,
      backlinks,
      perfPages,
      fixes,
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
