import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { assembleResults } from "@/lib/audit/create";
import { planFeatures } from "@/lib/plan/features";
import { AuditReport } from "@/components/dashboard/AuditReport";
import { AuditProgress } from "@/components/dashboard/AuditProgress";

export default async function AuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: auditId } = await params;
  const user = await getCurrentUser();
  const features = planFeatures(user.plan);

  const audit = await assembleResults(auditId, user.id);
  if (!audit) notFound();

  if (audit.status === "queued" || audit.status === "running") {
    return (
      <div className="p-8 bg-background min-h-full">
        <AuditProgress auditId={auditId} initialStatus={audit.status} />
      </div>
    );
  }

  if (audit.status === "failed") {
    return (
      <div className="p-8 bg-background min-h-full">
        <AuditProgress auditId={auditId} initialStatus="failed" />
      </div>
    );
  }

  return (
    <div className="p-8 bg-background min-h-full">
      <div className="max-w-[1200px] mx-auto">
        <AuditReport audit={audit} features={features} auditId={auditId} />
      </div>
    </div>
  );
}
