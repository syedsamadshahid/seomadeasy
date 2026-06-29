import { getCurrentUser } from "@/lib/auth/dev-user";
import { prisma } from "@/lib/db";
import Link from "next/link";

const ENGINES = ["chatgpt", "perplexity", "gemini", "google_aio"] as const;

export default async function AiVisibilityPage() {
  const user = await getCurrentUser();

  const geoRuns = await prisma.geoRun.findMany({
    where: { audit: { project: { userId: user.id } } },
    select: { engine: true, mentioned: true, cited: true, prompt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    select: { id: true, domain: true, displayName: true },
    orderBy: { createdAt: "desc" },
  });

  const engineStats = ENGINES.map((engine) => {
    const runs = geoRuns.filter((r) => r.engine === engine);
    return {
      engine,
      mentionRate: runs.length > 0
        ? Math.round((runs.filter((r) => r.mentioned).length / runs.length) * 100)
        : null,
    };
  });

  return (
    <div className="p-8 bg-background min-h-full">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-black text-on-background tracking-tight">AI Visibility</h1>
          <p className="text-text-secondary text-sm mt-1">
            How often AI engines mention your brand across all sites.
          </p>
        </div>

        {geoRuns.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-16 flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-primary text-5xl mb-4 opacity-60">auto_awesome</span>
            <h3 className="text-lg font-black text-on-background mb-2">No AI visibility data yet</h3>
            <p className="text-text-secondary text-sm mb-6 max-w-xs">
              Run an audit to see how ChatGPT, Perplexity, Gemini, and Google AI Overviews mention your brand.
            </p>
            <Link href="/dashboard/sites" className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-primary-container transition-colors">
              Go to My Sites
            </Link>
          </div>
        ) : (
          <>
            <section>
              <h2 className="text-base font-black text-on-background mb-4">Engine Overview</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {engineStats.map((s) => (
                  <div key={s.engine} className="bg-white border border-border rounded-xl p-4 flex flex-col gap-2 hover:border-primary/30 transition-colors">
                    <p className="text-xs font-black uppercase tracking-tight text-text-secondary">
                      {s.engine.replace("_", " ")}
                    </p>
                    <p className="text-2xl font-black text-on-background">
                      {s.mentionRate !== null ? `${s.mentionRate}%` : "—"}
                    </p>
                    <p className="text-xs text-text-secondary">mention rate</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-base font-black text-on-background mb-4">Drill-down by Site</h2>
              <div className="grid gap-3">
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/ai-visibility/${p.id}`}
                    className="bg-white border border-border rounded-xl p-5 flex items-center justify-between hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-primary-light flex items-center justify-center font-black text-primary text-sm">
                        {(p.displayName ?? p.domain).slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-background">{p.displayName ?? p.domain}</p>
                        <p className="text-xs text-text-secondary">{p.domain}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-text-secondary">chevron_right</span>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
