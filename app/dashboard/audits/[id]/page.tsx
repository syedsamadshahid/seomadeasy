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
      <div className="mx-auto max-w-5xl px-6 py-10">
        <AuditProgress auditId={auditId} initialStatus={audit.status} />
      </div>
    );
  }

  if (audit.status === "failed") {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-destructive">Audit failed. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <AuditReport audit={audit} features={features} auditId={auditId} />
    </div>
  );
}
