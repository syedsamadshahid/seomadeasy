import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { prisma } from "@/lib/db";
import { planFeatures } from "@/lib/plan/features";
import { ShaderBackground } from "@/components/ui/ShaderBackground";
import { KpiCard } from "@/components/ui/KpiCard";
import { EngineCard } from "@/components/ui/EngineCard";
import { StatusPill } from "@/components/ui/StatusPill";

const ENGINES = ["chatgpt", "perplexity", "gemini", "google_aio"] as const;
type Engine = (typeof ENGINES)[number];

function scoreVariant(score: number | null): "good" | "warning" | "critical" {
  if (score === null) return "warning";
  if (score >= 80) return "good";
  if (score >= 60) return "warning";
  return "critical";
}

function timeAgo(date: Date | null): string {
  if (!date) return "—";
  const diffMs = Date.now() - date.getTime();
  const diffH = Math.floor(diffMs / 3_600_000);
  if (diffH < 1) return "< 1h ago";
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const features = planFeatures(user.plan);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const firstName = user.email.split("@")[0];

  // Fetch recent completed audits for KPI + table
  const recentAudits = await prisma.audit.findMany({
    where: { project: { userId: user.id }, status: "done" },
    orderBy: { finishedAt: "desc" },
    take: 5,
    select: {
      id: true,
      overallScore: true,
      finishedAt: true,
      project: { select: { id: true, domain: true, displayName: true } },
      results: { where: { category: "geo" }, select: { score: true }, take: 1 },
      _count: { select: { pages: true } },
    },
  });

  const latestAudit = recentAudits[0] ?? null;
  const seoScore = latestAudit?.overallScore ?? null;
  const geoScore = latestAudit?.results[0]?.score ?? null;

  // GEO engine stats across all user audits
  const geoRuns = await prisma.geoRun.findMany({
    where: { audit: { project: { userId: user.id } } },
    select: { engine: true, mentioned: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  function isEngineLocked(engine: Engine): boolean {
    if (features.aiEngines >= 4) return false;
    if (features.aiEngines >= 3) return engine === "google_aio";
    return engine !== "gemini";
  }

  const engineStats = ENGINES.map((engine) => {
    const runs = geoRuns.filter((r) => r.engine === engine);
    return {
      engine,
      mentionRate:
        runs.length > 0
          ? Math.round((runs.filter((r) => r.mentioned).length / runs.length) * 100)
          : null,
      locked: isEngineLocked(engine),
    };
  });

  // Total keywords tracked
  const keywordCount = await prisma.keyword.count({
    where: { audit: { project: { userId: user.id } } },
  });

  const hasAudit = recentAudits.length > 0;

  return (
    <>
      <ShaderBackground />

      <div className="p-8 space-y-8 max-w-[1400px]">
        {/* Welcome row */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="opacity-0 animate-pop-in">
            <h1 className="text-4xl font-black text-on-background tracking-tight">
              {greeting}, {firstName}
            </h1>
            <p className="text-text-secondary flex items-center gap-2 mt-1 font-medium">
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              {formattedDate}
            </p>
          </div>
          <div className="flex items-center gap-2 opacity-0 animate-pop-in stagger-1">
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md border border-white/40 px-3 py-1.5 rounded-lg text-sm font-bold text-[#0F172A]">
              <span className="size-2 rounded-full bg-success" />
              All Systems Online
            </div>
          </div>
        </section>

        {/* KPI cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            label="SEO Score"
            value={seoScore !== null ? `${seoScore}/100` : null}
            ring={{ value: seoScore, color: "#4648d4" }}
            trend={hasAudit ? { direction: "up", text: "Latest audit" } : null}
            stagger={1}
          />
          <KpiCard
            label="AI Visibility Score"
            value={geoScore !== null ? `${geoScore}%` : null}
            ring={{ value: geoScore, color: "#00687a" }}
            trend={hasAudit && geoScore !== null ? { direction: "up", text: "Across engines" } : null}
            stagger={2}
          />
          <KpiCard
            label="Issues Found"
            value={hasAudit ? latestAudit._count.pages : null}
            badge={
              hasAudit && seoScore !== null && seoScore < 80 ? (
                <span className="bg-error-container text-on-error-container px-2 py-1 rounded-md text-xs font-black uppercase tracking-wider">
                  {scoreVariant(seoScore) === "critical" ? "Critical" : "Review"}
                </span>
              ) : null
            }
            stagger={3}
          />
          <KpiCard
            label="Keywords Tracked"
            value={keywordCount > 0 ? keywordCount.toLocaleString() : null}
            trend={keywordCount > 0 ? { direction: "flat", text: "Across all audits" } : null}
            stagger={4}
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: AI engines + Quick Actions */}
          <section className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between opacity-0 animate-pop-in stagger-5">
              <h2 className="text-lg font-black text-[#0F172A]">AI Search Engines</h2>
              <Link href="/dashboard/ai-visibility" className="text-primary text-sm font-bold hover:underline">
                Full Analytics
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {engineStats.map((s, i) => (
                <EngineCard
                  key={s.engine}
                  engine={s.engine as Engine}
                  mentionRate={s.mentionRate}
                  locked={s.locked}
                  stagger={6 + i}
                />
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white/30 backdrop-blur-lg border border-white/40 p-6 rounded-xl opacity-0 animate-pop-in stagger-8">
              <h3 className="font-black text-[#0F172A] mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/dashboard/sites"
                  className="w-full flex items-center gap-3 p-3 bg-white/60 hover:bg-white hover:scale-[1.02] border border-white/40 rounded-lg transition-all text-sm font-bold text-[#0F172A]"
                >
                  <span className="material-symbols-outlined text-primary">add_chart</span>
                  Start New Site Audit
                </Link>
                <Link
                  href="/dashboard/ai-visibility"
                  className="w-full flex items-center gap-3 p-3 bg-white/60 hover:bg-white hover:scale-[1.02] border border-white/40 rounded-lg transition-all text-sm font-bold text-[#0F172A]"
                >
                  <span className="material-symbols-outlined text-secondary">visibility</span>
                  Check AI Visibility
                </Link>
                <Link
                  href="/dashboard/reports"
                  className="w-full flex items-center gap-3 p-3 bg-white/60 hover:bg-white hover:scale-[1.02] border border-white/40 rounded-lg transition-all text-sm font-bold text-[#0F172A]"
                >
                  <span className="material-symbols-outlined text-tertiary">description</span>
                  View Reports
                </Link>
              </div>
            </div>
          </section>

          {/* Right column: Recent Audits table + banner */}
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4 opacity-0 animate-pop-in stagger-5">
              <h2 className="text-lg font-black text-[#0F172A]">Recent Audits</h2>
              <Link
                href="/dashboard/audits"
                className="text-text-secondary hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">more_horiz</span>
              </Link>
            </div>

            {hasAudit ? (
              <div className="mirror-card rounded-xl overflow-hidden opacity-0 animate-pop-in stagger-9 hover:scale-[1.005] transition-transform">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/30 border-b border-white/20">
                      <th className="px-6 py-4 text-xs font-black text-text-secondary uppercase tracking-widest">Site</th>
                      <th className="px-6 py-4 text-xs font-black text-text-secondary uppercase tracking-widest">SEO / AI</th>
                      <th className="px-6 py-4 text-xs font-black text-text-secondary uppercase tracking-widest hidden sm:table-cell">Last Run</th>
                      <th className="px-6 py-4 text-xs font-black text-text-secondary uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-xs font-black text-text-secondary uppercase tracking-widest"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/20">
                    {recentAudits.map((audit) => {
                      const initial = (audit.project.displayName ?? audit.project.domain).slice(0, 1).toUpperCase();
                      const geo = audit.results[0]?.score ?? null;
                      const variant = scoreVariant(audit.overallScore);

                      return (
                        <tr key={audit.id} className="hover:bg-white/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded bg-primary-light flex items-center justify-center font-black text-primary text-sm flex-shrink-0">
                                {initial}
                              </div>
                              <div>
                                <p className="text-sm font-black text-[#0F172A] truncate max-w-[120px]">
                                  {audit.project.displayName ?? audit.project.domain}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <div className="size-2 rounded-full bg-primary" />
                                <span className="text-sm font-black text-[#0F172A]">
                                  {audit.overallScore ?? "—"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="size-2 rounded-full bg-secondary" />
                                <span className="text-sm font-black text-[#0F172A]">{geo ?? "—"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden sm:table-cell">
                            <p className="text-sm font-medium text-text-secondary">
                              {timeAgo(audit.finishedAt)}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <StatusPill variant={variant} />
                          </td>
                          <td className="px-6 py-4">
                            <Link
                              href={`/dashboard/audits/${audit.id}`}
                              className="text-primary hover:text-primary-container font-black text-sm"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="p-4 bg-white/20 text-center">
                  <Link href="/dashboard/audits" className="text-sm font-black text-primary hover:underline">
                    View All Audits
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mirror-card rounded-xl p-12 flex flex-col items-center justify-center text-center opacity-0 animate-pop-in stagger-9">
                <span className="material-symbols-outlined text-primary text-5xl mb-4 opacity-60">
                  assignment_turned_in
                </span>
                <h3 className="text-lg font-black text-[#0F172A] mb-2">No audits yet</h3>
                <p className="text-text-secondary text-sm mb-6 max-w-xs">
                  Run your first SEO &amp; AI Visibility audit to see your dashboard come to life.
                </p>
                <Link
                  href="/dashboard/sites"
                  className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-primary-container transition-colors"
                >
                  Start First Audit
                </Link>
              </div>
            )}

            {/* Predictive Visibility Index banner */}
            <div className="mt-8 relative h-48 rounded-xl overflow-hidden opacity-0 animate-pop-in stagger-9">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(70,72,212,0.85) 0%, rgba(0,104,122,0.7) 100%)",
                }}
              />
              <div className="absolute inset-0 flex items-center p-8">
                <div className="text-white max-w-sm">
                  <h3 className="text-xl font-black mb-2">Predictive Visibility Index</h3>
                  <p className="text-sm font-medium opacity-90 mb-4">
                    Run audits across your sites to see AI-powered predictions on how to improve
                    your visibility in ChatGPT, Perplexity, and Google AI Overviews.
                  </p>
                  <Link
                    href="/dashboard/ai-visibility"
                    className="inline-block bg-white text-primary px-4 py-2 rounded-lg text-sm font-black hover:bg-opacity-90 hover:scale-105 transition-all"
                  >
                    Explore AI Visibility
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
