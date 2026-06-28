import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { prisma } from "@/lib/db";
import { StatusPill } from "@/components/ui/StatusPill";
import { NewAuditDialog } from "@/components/dashboard/NewAuditDialog";

function statusVariant(status: string): "queued" | "running" | "good" | "failed" {
  if (status === "done") return "good";
  if (status === "running") return "running";
  if (status === "failed") return "failed";
  return "queued";
}

export default async function AuditsPage() {
  const user = await getCurrentUser();

  const audits = await prisma.audit.findMany({
    where: { project: { userId: user.id } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      status: true,
      overallScore: true,
      createdAt: true,
      finishedAt: true,
      project: { select: { domain: true, displayName: true } },
      results: { where: { category: "geo" }, select: { score: true }, take: 1 },
    },
  });

  return (
    <div className="p-8 bg-background min-h-full">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-on-background tracking-tight">SEO Audits</h1>
            <p className="text-text-secondary text-sm mt-1">{audits.length} audit{audits.length !== 1 ? "s" : ""} total</p>
          </div>
          <NewAuditDialog />
        </div>

        {audits.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-16 flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-primary text-5xl mb-4 opacity-60">assignment_turned_in</span>
            <h3 className="text-lg font-black text-on-background mb-2">No audits yet</h3>
            <p className="text-text-secondary text-sm mb-6 max-w-xs">Run your first SEO audit to see results here.</p>
            <NewAuditDialog />
          </div>
        ) : (
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-alt border-b border-border">
                  <th className="px-6 py-4 text-xs font-black text-text-secondary uppercase tracking-widest">Site</th>
                  <th className="px-6 py-4 text-xs font-black text-text-secondary uppercase tracking-widest">SEO / AI</th>
                  <th className="px-6 py-4 text-xs font-black text-text-secondary uppercase tracking-widest hidden sm:table-cell">Run Date</th>
                  <th className="px-6 py-4 text-xs font-black text-text-secondary uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-black text-text-secondary uppercase tracking-widest"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {audits.map((audit, i) => (
                  <tr key={audit.id} className={`hover:bg-surface-alt transition-colors ${i % 2 === 0 ? "" : "bg-surface-alt/50"}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded bg-primary-light flex items-center justify-center font-black text-primary text-sm flex-shrink-0">
                          {(audit.project.displayName ?? audit.project.domain).slice(0, 1).toUpperCase()}
                        </div>
                        <p className="text-sm font-bold text-on-background truncate max-w-[150px]">
                          {audit.project.displayName ?? audit.project.domain}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-sm font-black text-on-background">
                        <span>{audit.overallScore ?? "—"}</span>
                        <span className="text-text-secondary font-normal">/</span>
                        <span className="text-primary">{audit.results[0]?.score ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <p className="text-sm text-text-secondary">
                        {new Date(audit.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill variant={statusVariant(audit.status)} />
                    </td>
                    <td className="px-6 py-4">
                      {audit.status === "done" && (
                        <Link href={`/dashboard/audits/${audit.id}`} className="text-primary hover:text-primary-container font-black text-sm">
                          View
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
