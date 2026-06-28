import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { prisma } from "@/lib/db";
import { getProjectTrends } from "@/lib/audit/trends";
import { planFeatures } from "@/lib/plan/features";
import { GeoTrendChart } from "@/components/charts/GeoTrendChart";

type Engine = "chatgpt" | "perplexity" | "gemini" | "google_aio";

const ENGINE_META: Record<Engine, { label: string; initial: string; color: string }> = {
  chatgpt: { label: "ChatGPT", initial: "G", color: "#10a37f" },
  perplexity: { label: "Perplexity", initial: "P", color: "#6e56cf" },
  gemini: { label: "Gemini", initial: "G", color: "#4285f4" },
  google_aio: { label: "Google AIO", initial: "A", color: "#ea4335" },
};

function scoreRun(run: {
  mentioned: boolean;
  cited: boolean;
  prominence: number | null;
  sentiment: string | null;
}): number {
  let score = 0;
  if (run.mentioned) score += 30;
  if (run.cited) score += 40;
  score += Math.round(((run.prominence ?? 0) / 10) * 20);
  if (run.sentiment === "positive") score += 10;
  else if (run.sentiment === "negative") score -= 10;
  return Math.min(100, Math.max(0, score));
}

function sentimentBadge(sentiment: string | null) {
  if (sentiment === "positive") return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (sentiment === "negative") return "bg-red-50 text-red-700 border border-red-200";
  return "bg-slate-100 text-slate-600 border border-slate-200";
}

export default async function AiVisibilityProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await getCurrentUser();
  const features = planFeatures(user.plan);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, userId: true, domain: true, displayName: true },
  });

  if (!project || project.userId !== user.id) notFound();

  // Latest completed audit with GeoRuns + geo AuditResult
  const latestAudit = await prisma.audit.findFirst({
    where: { projectId, status: "done" },
    orderBy: { finishedAt: "desc" },
    select: {
      id: true,
      finishedAt: true,
      overallScore: true,
      results: {
        where: { category: "geo" },
        select: { score: true, payload: true },
        take: 1,
      },
      geoRuns: {
        select: {
          id: true,
          engine: true,
          prompt: true,
          mentioned: true,
          cited: true,
          prominence: true,
          sentiment: true,
          competitorsNamed: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const trends = await getProjectTrends(projectId, user.plan);

  // Aggregate per-engine stats from latest audit
  type EngineStats = { mentionRate: number; citationRate: number; avgScore: number; count: number };
  const engineStats = new Map<string, EngineStats>();

  if (latestAudit) {
    const byEngine = new Map<string, typeof latestAudit.geoRuns>();
    for (const run of latestAudit.geoRuns) {
      const arr = byEngine.get(run.engine) ?? [];
      arr.push(run);
      byEngine.set(run.engine, arr);
    }
    for (const [engine, runs] of byEngine) {
      const mentioned = runs.filter((r) => r.mentioned).length;
      const cited = runs.filter((r) => r.cited).length;
      const avgScore = Math.round(
        runs.reduce((sum, r) => sum + scoreRun(r), 0) / runs.length,
      );
      engineStats.set(engine, {
        mentionRate: Math.round((mentioned / runs.length) * 100),
        citationRate: Math.round((cited / runs.length) * 100),
        avgScore,
        count: runs.length,
      });
    }
  }

  const geoScore = latestAudit?.results[0]?.score ?? null;
  const geoPayload = latestAudit?.results[0]?.payload as Record<string, unknown> | null;
  const recommendations: string[] =
    Array.isArray((geoPayload as { recommendations?: unknown })?.recommendations)
      ? ((geoPayload as { recommendations: string[] }).recommendations).slice(0, 6)
      : [];

  const ENGINES: Engine[] = ["chatgpt", "perplexity", "gemini", "google_aio"];

  function isLocked(engine: Engine): boolean {
    if (features.aiEngines >= 4) return false;
    if (features.aiEngines >= 3) return engine === "google_aio";
    return engine !== "gemini";
  }

  const recentRuns = latestAudit?.geoRuns.slice(0, 10) ?? [];

  return (
    <div className="p-8 bg-background min-h-full">
      <div className="max-w-[1200px] mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/dashboard/ai-visibility"
                className="text-sm text-text-secondary hover:text-primary font-medium transition-colors"
              >
                AI Visibility
              </Link>
              <span className="text-text-secondary">/</span>
              <span className="text-sm font-semibold text-on-background">
                {project.displayName ?? project.domain}
              </span>
            </div>
            <h1 className="text-2xl font-black text-on-background tracking-tight">
              {project.displayName ?? project.domain}
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">{project.domain}</p>
          </div>
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="text-sm font-semibold text-primary hover:text-primary-container transition-colors"
          >
            Full audit report →
          </Link>
        </div>

        {/* Hero — Overall AI Visibility Score */}
        <div className="bg-white border border-border rounded-xl p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Big score ring */}
            <div className="flex-shrink-0 flex flex-col items-center gap-3">
              {geoScore !== null ? (
                <>
                  <div
                    className="rounded-full flex items-center justify-center"
                    style={{
                      width: 120,
                      height: 120,
                      background: `radial-gradient(closest-side, white 79%, transparent 80% 100%), conic-gradient(#4648d4 ${geoScore}%, #e2e8f0 0)`,
                    }}
                  >
                    <span
                      className="text-3xl font-black text-on-background"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {geoScore}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                    AI Visibility Score
                  </p>
                </>
              ) : (
                <div className="w-[120px] h-[120px] rounded-full bg-surface-alt border-4 border-dashed border-slate-200 flex items-center justify-center">
                  <span className="text-2xl font-black text-text-secondary">—</span>
                </div>
              )}
            </div>

            {/* Narrative */}
            <div className="flex-1">
              <h2 className="text-xl font-black text-on-background mb-2">
                {geoScore === null
                  ? "No AI visibility data yet"
                  : geoScore >= 70
                  ? "Strong AI presence detected"
                  : geoScore >= 40
                  ? "Moderate AI visibility"
                  : "Low AI visibility — action needed"}
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
                {geoScore === null
                  ? "Run your first audit to see how ChatGPT, Perplexity, Gemini, and Google AI Overviews perceive your brand."
                  : geoScore >= 70
                  ? `${project.displayName ?? project.domain} appears consistently in AI-generated answers across checked engines. Focus on maintaining citation quality and expanding topical coverage to defend this position.`
                  : geoScore >= 40
                  ? `${project.displayName ?? project.domain} is mentioned in some AI answers but lacks strong citation signals. Improve structured content, FAQ markup, and entity clarity to raise this score.`
                  : `${project.displayName ?? project.domain} has limited AI representation. Competitors are likely capturing these queries. Prioritize answer-first content, FAQ schema, and brand entity signals.`}
              </p>
              {latestAudit && (
                <p className="text-xs text-text-secondary mt-3 font-medium">
                  Based on audit from{" "}
                  {latestAudit.finishedAt
                    ? new Date(latestAudit.finishedAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "unknown date"}
                </p>
              )}
            </div>

            {/* Quick stat pills */}
            {latestAudit && (
              <div className="flex flex-col gap-3 flex-shrink-0">
                <div className="bg-surface-alt rounded-lg px-4 py-3 text-center min-w-[100px]">
                  <p className="text-xl font-black text-on-background">
                    {latestAudit.geoRuns.filter((r) => r.mentioned).length}
                    <span className="text-text-secondary font-normal text-sm">
                      /{latestAudit.geoRuns.length}
                    </span>
                  </p>
                  <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mt-0.5">
                    Mentions
                  </p>
                </div>
                <div className="bg-surface-alt rounded-lg px-4 py-3 text-center min-w-[100px]">
                  <p className="text-xl font-black text-on-background">
                    {latestAudit.geoRuns.filter((r) => r.cited).length}
                    <span className="text-text-secondary font-normal text-sm">
                      /{latestAudit.geoRuns.length}
                    </span>
                  </p>
                  <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mt-0.5">
                    Citations
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Engine Cards */}
        <div>
          <h2 className="text-lg font-black text-on-background mb-4">Engine Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ENGINES.map((engine) => {
              const meta = ENGINE_META[engine];
              const stats = engineStats.get(engine);
              const locked = isLocked(engine);
              return (
                <div
                  key={engine}
                  className={[
                    "bg-white border rounded-xl p-5 flex flex-col gap-3 transition-all",
                    locked
                      ? "border-dashed border-slate-200 opacity-60"
                      : "border-border hover:shadow-sm",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="size-8 rounded-lg flex items-center justify-center text-white text-xs font-black"
                      style={{ backgroundColor: meta.color }}
                    >
                      {meta.initial}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-on-background leading-tight">{meta.label}</p>
                      {locked && (
                        <p className="text-[10px] text-text-secondary">Upgrade to unlock</p>
                      )}
                    </div>
                    {locked && (
                      <span className="material-symbols-outlined text-text-secondary text-[16px]">
                        lock
                      </span>
                    )}
                  </div>

                  {locked || !stats ? (
                    <div className="space-y-2">
                      <div className="h-2 bg-slate-100 rounded-full" />
                      <p className="text-2xl font-black text-text-secondary">—</p>
                      <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
                        Mention Rate
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-end gap-1">
                        <span
                          className="text-2xl font-black text-on-background"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {stats.mentionRate}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${stats.mentionRate}%`,
                            backgroundColor: meta.color,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-text-secondary font-bold uppercase tracking-wider">
                        <span>Mention Rate</span>
                        <span className="text-on-background">{stats.citationRate}% cited</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main content: Trend + Strategic Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Trend chart — 2/3 */}
          <div className="lg:col-span-2 bg-white border border-border rounded-xl p-6">
            <h2 className="text-base font-black text-on-background mb-4">Visibility Trend</h2>
            {trends.trend.length > 1 ? (
              <GeoTrendChart data={trends.trend} />
            ) : (
              <div className="h-[220px] flex flex-col items-center justify-center text-center text-text-secondary">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-40">show_chart</span>
                <p className="text-sm font-medium">Run multiple audits to see trends</p>
              </div>
            )}
          </div>

          {/* Strategic Analysis — 1/3 */}
          <div className="bg-white border border-border rounded-xl p-6">
            <h2 className="text-base font-black text-on-background mb-4">Strategic Analysis</h2>
            {recommendations.length > 0 ? (
              <ul className="space-y-3">
                {recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span
                      className="material-symbols-outlined text-primary text-[16px] mt-0.5 flex-shrink-0"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      task_alt
                    </span>
                    <span className="text-text-secondary leading-snug">{rec}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-center text-text-secondary">
                <span className="material-symbols-outlined text-3xl mb-2 opacity-40">
                  psychology
                </span>
                <p className="text-sm font-medium">
                  Recommendations appear after your first completed audit.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent LLM Inquiries */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-black text-on-background">Recent LLM Inquiries</h2>
            <p className="text-xs text-text-secondary font-medium">
              {recentRuns.length} prompts from latest audit
            </p>
          </div>
          {recentRuns.length === 0 ? (
            <div className="p-12 text-center text-text-secondary">
              <span className="material-symbols-outlined text-4xl mb-3 opacity-40">chat</span>
              <p className="text-sm font-medium">No LLM inquiry data yet. Run an audit to see results.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-alt border-b border-border">
                    <th className="px-6 py-3 text-xs font-black text-text-secondary uppercase tracking-widest">Engine</th>
                    <th className="px-6 py-3 text-xs font-black text-text-secondary uppercase tracking-widest">Prompt</th>
                    <th className="px-6 py-3 text-xs font-black text-text-secondary uppercase tracking-widest">Mentioned</th>
                    <th className="px-6 py-3 text-xs font-black text-text-secondary uppercase tracking-widest">Cited</th>
                    <th className="px-6 py-3 text-xs font-black text-text-secondary uppercase tracking-widest">Sentiment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentRuns.map((run) => {
                    const meta = ENGINE_META[run.engine as Engine];
                    return (
                      <tr key={run.id} className="hover:bg-surface-alt/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="size-6 rounded flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
                              style={{ backgroundColor: meta?.color ?? "#888" }}
                            >
                              {meta?.initial ?? "?"}
                            </div>
                            <span className="text-xs font-semibold text-on-background whitespace-nowrap">
                              {meta?.label ?? run.engine}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-[280px]">
                          <p className="text-sm text-on-background truncate" title={run.prompt}>
                            {run.prompt}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {run.mentioned ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold">
                              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                              Yes
                            </span>
                          ) : (
                            <span className="text-text-secondary text-xs font-medium">No</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {run.cited ? (
                            <span className="inline-flex items-center gap-1 text-primary text-xs font-bold">
                              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
                              Yes
                            </span>
                          ) : (
                            <span className="text-text-secondary text-xs font-medium">No</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${sentimentBadge(run.sentiment)}`}
                          >
                            {run.sentiment ?? "neutral"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Competitor intel */}
        {trends.competitors.length > 0 && (
          <div className="bg-white border border-border rounded-xl p-6">
            <h2 className="text-base font-black text-on-background mb-4">
              Competitor Frequency in AI Answers
            </h2>
            <div className="space-y-3">
              {trends.competitors.slice(0, 6).map((comp) => (
                <div key={comp.name} className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-on-background w-40 truncate">{comp.name}</p>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/60 rounded-full"
                      style={{
                        width: `${Math.round(
                          (comp.count / (trends.competitors[0]?.count ?? 1)) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-text-secondary w-16 text-right font-mono">
                    {comp.count}×
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No data CTA */}
        {!latestAudit && (
          <div className="bg-primary-light border border-primary/20 rounded-xl p-10 text-center">
            <span className="material-symbols-outlined text-primary text-5xl mb-4 block opacity-70">
              auto_awesome
            </span>
            <h3 className="text-lg font-black text-on-background mb-2">
              No AI visibility data yet
            </h3>
            <p className="text-sm text-text-secondary mb-6 max-w-sm mx-auto">
              Run a full audit to see how ChatGPT, Perplexity, Gemini, and Google AI Overviews
              respond to questions about {project.displayName ?? project.domain}.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Start New Audit
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
