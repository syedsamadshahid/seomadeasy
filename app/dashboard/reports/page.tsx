import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { prisma } from "@/lib/db";
import { StatusPill } from "@/components/ui/StatusPill";

export default async function ReportsPage() {
  const user = await getCurrentUser();

  const completedAudits = await prisma.audit.findMany({
    where: { project: { userId: user.id }, status: "done" },
    orderBy: { finishedAt: "desc" },
    take: 30,
    select: {
      id: true,
      overallScore: true,
      finishedAt: true,
      createdAt: true,
      project: { select: { id: true, domain: true, displayName: true } },
      results: { where: { category: "geo" }, select: { score: true }, take: 1 },
    },
  });

  return (
    <div className="p-8 bg-background min-h-full">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-on-background tracking-tight">Reports</h1>
            <p className="text-text-secondary text-sm mt-1">
              {completedAudits.length} completed audit{completedAudits.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {completedAudits.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-16 flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-primary text-5xl mb-4 opacity-60">description</span>
            <h3 className="text-lg font-black text-on-background mb-2">No reports yet</h3>
            <p className="text-text-secondary text-sm mb-6 max-w-xs">
              Reports are generated from completed audits. Run an audit to get started.
            </p>
            <Link href="/dashboard/sites" className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-primary-container transition-colors">
              Start an Audit
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {completedAudits.map((audit) => {
              const geo = audit.results[0]?.score ?? null;
              const score = audit.overallScore;

              return (
                <div key={audit.id} className="bg-white border border-border rounded-xl p-6 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-primary-light flex items-center justify-center font-black text-primary flex-shrink-0">
                      {(audit.project.displayName ?? audit.project.domain).slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-background">
                        {audit.project.displayName ?? audit.project.domain}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {audit.finishedAt
                          ? new Date(audit.finishedAt).toLocaleDateString("en-US", {
                              month: "long", day: "numeric", year: "numeric",
                            })
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center hidden sm:block">
                      <p className="text-lg font-black text-on-background">{score ?? "—"}</p>
                      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">SEO</p>
                    </div>
                    <div className="text-center hidden sm:block">
                      <p className="text-lg font-black text-primary">{geo ?? "—"}</p>
                      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">AI</p>
                    </div>
                    <StatusPill
                      variant={score !== null && score >= 80 ? "good" : score !== null && score >= 60 ? "warning" : "critical"}
                    />
                    <Link
                      href={`/dashboard/audits/${audit.id}`}
                      className="bg-primary/10 hover:bg-primary/20 text-primary font-black text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      View Report
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
