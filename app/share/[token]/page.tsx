import { notFound } from "next/navigation";
import { resolveShareLink } from "@/lib/share/token";
import { assembleResults } from "@/lib/audit/create";
import { prisma } from "@/lib/db";
import { AuditReport } from "@/components/dashboard/AuditReport";
import type { PlanFeatures } from "@/lib/plan/features";

// Public page — no auth, read-only features
const PUBLIC_FEATURES: PlanFeatures = {
  trendDays: 0,
  canExportCsv: false,
  canWhiteLabel: false,
  canCustomColor: false,
  canShare: false,
  shareExpiryDays: null,
  canMultiSite: false,
  canSchedule: false,
};

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const link = await resolveShareLink(token);
  if (!link) notFound();

  const auditWithUser = await prisma.audit.findUnique({
    where: { id: link.auditId },
    include: { project: { select: { userId: true } } },
  });
  if (!auditWithUser) notFound();

  const audit = await assembleResults(link.auditId, auditWithUser.project.userId);
  if (!audit || audit.status !== "done") notFound();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center gap-2">
        <span className="text-lg font-semibold tracking-tight">Vantage</span>
        <span className="text-sm text-muted-foreground">· Shared Report</span>
      </div>
      <AuditReport audit={audit} features={PUBLIC_FEATURES} auditId={link.auditId} />
    </div>
  );
}
