import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { assembleResults } from "@/lib/audit/create";
import { planFeatures } from "@/lib/plan/features";
import { keywordsCsv, geoRunsCsv, issuesCsv, fixesCsv } from "@/lib/export/csv";
import { getPayload } from "@/lib/audit/report-types";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: auditId } = await params;
  const user = await getCurrentUser();

  const features = planFeatures(user.plan);
  if (!features.canExportCsv) {
    return NextResponse.json({ error: "Upgrade to Pro to export data" }, { status: 403 });
  }

  const audit = await assembleResults(auditId, user.id);
  if (!audit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const type = new URL(req.url).searchParams.get("type") ?? "keywords";

  let csv: string;
  let filename: string;

  if (type === "geo") {
    csv = geoRunsCsv(audit.geoRuns);
    filename = `geo-${auditId}.csv`;
  } else if (type === "issues") {
    const pages = audit.pages.map((p) => ({
      url: p.url,
      issues: JSON.stringify(p.onPageIssues ?? {}),
    }));
    csv = issuesCsv(pages);
    filename = `issues-${auditId}.csv`;
  } else if (type === "content") {
    const content = getPayload(audit.results, "content");
    csv = fixesCsv(content?.fixList ?? []);
    filename = `content-fixes-${auditId}.csv`;
  } else {
    csv = keywordsCsv(audit.keywords);
    filename = `keywords-${auditId}.csv`;
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
