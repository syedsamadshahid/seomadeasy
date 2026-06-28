import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { prisma } from "@/lib/db";
import { NewAuditDialog } from "@/components/dashboard/NewAuditDialog";
import { StatusPill } from "@/components/ui/StatusPill";

function scoreVariant(score: number | null): "good" | "warning" | "critical" {
  if (score === null) return "warning";
  if (score >= 80) return "good";
  if (score >= 60) return "warning";
  return "critical";
}

export default async function SitesPage() {
  const user = await getCurrentUser();

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      audits: {
        where: { status: "done" },
        orderBy: { finishedAt: "desc" },
        take: 1,
        select: {
          id: true,
          overallScore: true,
          finishedAt: true,
          results: { where: { category: "geo" }, select: { score: true }, take: 1 },
        },
      },
    },
  });

  return (
    <div className="p-8 bg-background min-h-full">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-on-background tracking-tight">My Sites</h1>
            <p className="text-text-secondary text-sm mt-1">{projects.length} site{projects.length !== 1 ? "s" : ""} tracked</p>
          </div>
          <NewAuditDialog />
        </div>

        {projects.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-16 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-primary text-5xl mb-4 opacity-60">language</span>
            <h3 className="text-lg font-black text-on-background mb-2">No sites yet</h3>
            <p className="text-text-secondary text-sm mb-6 max-w-xs">Add your first domain to start tracking SEO and AI visibility.</p>
            <NewAuditDialog />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const latest = project.audits[0];
              const geo = latest?.results[0]?.score ?? null;
              const variant = scoreVariant(latest?.overallScore ?? null);

              return (
                <Link key={project.id} href={`/dashboard/ai-visibility/${project.id}`} className="block group">
                  <div className="bg-white border border-border rounded-xl p-6 shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start gap-2 mb-4">
                      <div className="size-10 rounded-lg bg-primary-light flex items-center justify-center font-black text-primary text-base flex-shrink-0">
                        {(project.displayName ?? project.domain).slice(0, 1).toUpperCase()}
                      </div>
                      {latest && <StatusPill variant={variant} />}
                    </div>
                    <h3 className="text-base font-bold text-on-background group-hover:text-primary transition-colors truncate">
                      {project.displayName ?? project.domain}
                    </h3>
                    <p className="text-xs text-text-secondary truncate mt-0.5">{project.domain}</p>

                    <div className="mt-4 pt-4 border-t border-border">
                      {latest ? (
                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <div className="text-xl font-extrabold text-on-background">{latest.overallScore ?? "—"}</div>
                            <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">SEO</div>
                          </div>
                          <div>
                            <div className="text-xl font-extrabold text-primary">{geo ?? "—"}</div>
                            <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">AI</div>
                          </div>
                          <div className="ml-auto text-[10px] text-text-secondary font-medium">
                            {latest.finishedAt
                              ? new Date(latest.finishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                              : ""}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-text-secondary flex items-center gap-1.5 font-medium">
                          <span className="size-2 bg-amber-500 rounded-full animate-pulse" />
                          No audits completed
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
