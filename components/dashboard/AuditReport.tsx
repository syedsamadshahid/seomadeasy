"use client";
import { ExportMenu } from "@/components/reports/ExportMenu";
import { ShareDialog } from "@/components/reports/ShareDialog";
import type { PlanFeatures } from "@/lib/plan/features";

type AuditData = {
  id?: string;
  status: string;
  overallScore: number | null;
  finishedAt: Date | string | null;
  costCents: number;
  results: Array<{ category: string; score: number | null; payload: unknown }>;
  pages: Array<{
    url: string;
    estTraffic: number | null;
    onPageIssues: unknown;
    perf: unknown;
  }>;
  keywords: Array<{
    term: string;
    volume: number | null;
    difficulty: number | null;
    cpc: number | null;
    position: number | null;
    intent: string | null;
  }>;
  geoRuns: Array<{
    engine: string;
    prompt: string;
    mentioned: boolean;
    cited: boolean;
    prominence: number | null;
    sentiment: string | null;
    competitorsNamed: unknown;
  }>;
};

type Props = { audit: AuditData; features: PlanFeatures; auditId: string };

const CATEGORY_LABELS: Record<string, string> = {
  onpage: "On-Page SEO",
  perf: "Performance",
  links: "Backlinks",
  authority: "Domain Authority",
  keywords: "Keywords",
  traffic: "Traffic",
  geo: "AI Visibility",
  content: "Content",
};

const CATEGORY_ICONS: Record<string, string> = {
  onpage: "checklist",
  perf: "speed",
  links: "link",
  authority: "verified",
  keywords: "key",
  traffic: "trending_up",
  geo: "auto_awesome",
  content: "article",
};

const ENGINE_META: Record<string, { label: string; initial: string; color: string }> = {
  chatgpt: { label: "ChatGPT", initial: "G", color: "#10a37f" },
  perplexity: { label: "Perplexity", initial: "P", color: "#6e56cf" },
  gemini: { label: "Gemini", initial: "G", color: "#4285f4" },
  google_aio: { label: "Google AIO", initial: "A", color: "#ea4335" },
};

function scoreColor(score: number | null): string {
  if (score === null) return "#94a3b8";
  if (score >= 80) return "#16a34a";
  if (score >= 60) return "#d97706";
  return "#dc2626";
}

function scoreBg(score: number | null): string {
  if (score === null) return "bg-slate-100 text-slate-500";
  if (score >= 80) return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (score >= 60) return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-red-50 text-red-700 border border-red-200";
}

function difficultyColor(d: number | null): string {
  if (d === null) return "bg-slate-100";
  if (d <= 30) return "bg-emerald-500";
  if (d <= 60) return "bg-amber-500";
  return "bg-red-500";
}

function sentimentClass(s: string | null): string {
  if (s === "positive") return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (s === "negative") return "bg-red-50 text-red-700 border border-red-200";
  return "bg-slate-100 text-slate-600 border border-slate-200";
}

function ScoreRing({ value, color, size = 80 }: { value: number | null; color: string; size?: number }) {
  const pct = value !== null ? Math.round(value) : 0;
  const bg = value !== null
    ? `radial-gradient(closest-side, white 79%, transparent 80% 100%), conic-gradient(${color} ${pct}%, #e2e8f0 0)`
    : `radial-gradient(closest-side, white 79%, transparent 80% 100%), conic-gradient(#e2e8f0 100%)`;
  return (
    <div style={{ width: size, height: size, background: bg, borderRadius: "50%" }} aria-hidden />
  );
}

export function AuditReport({ audit, features, auditId }: Props) {
  const geoResult = audit.results.find((r) => r.category === "geo");
  const geoScore = geoResult?.score ?? null;
  const finishedDate = audit.finishedAt
    ? new Date(audit.finishedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-on-background tracking-tight">Audit Report</h1>
          {finishedDate && (
            <p className="text-sm text-text-secondary mt-1">
              Completed {finishedDate}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {features.canShare && <ShareDialog auditId={auditId} />}
          <ExportMenu auditId={auditId} features={features} />
        </div>
      </div>

      {/* Top score strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Overall */}
        <div className="bg-white border border-border rounded-xl p-5 flex flex-col items-center gap-2">
          <ScoreRing value={audit.overallScore} color="#4648d4" size={72} />
          <div className="text-center">
            <p
              className="text-2xl font-black text-on-background leading-none"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {audit.overallScore ?? "—"}
            </p>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-1">
              Overall Score
            </p>
          </div>
        </div>

        {/* AI Visibility */}
        <div className="bg-white border border-primary/20 rounded-xl p-5 flex flex-col items-center gap-2">
          <ScoreRing value={geoScore} color="#00687a" size={72} />
          <div className="text-center">
            <p
              className="text-2xl font-black text-primary leading-none"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {geoScore ?? "—"}
            </p>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-1">
              AI Visibility
            </p>
          </div>
        </div>

        {/* Keywords */}
        <div className="bg-white border border-border rounded-xl p-5 flex flex-col justify-center items-center gap-1">
          <span className="material-symbols-outlined text-primary text-2xl">key</span>
          <p
            className="text-3xl font-black text-on-background"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {audit.keywords.length}
          </p>
          <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Keywords</p>
        </div>

        {/* Pages */}
        <div className="bg-white border border-border rounded-xl p-5 flex flex-col justify-center items-center gap-1">
          <span className="material-symbols-outlined text-text-secondary text-2xl">web</span>
          <p
            className="text-3xl font-black text-on-background"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {audit.pages.length}
          </p>
          <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Pages</p>
        </div>
      </div>

      {/* Category Scores */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-black text-on-background">Category Scores</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-border">
          {audit.results.map((r) => (
            <div key={r.category} className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-text-secondary text-[18px]">
                  {CATEGORY_ICONS[r.category] ?? "analytics"}
                </span>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  {CATEGORY_LABELS[r.category] ?? r.category}
                </p>
              </div>
              <div className="flex items-end gap-2">
                <p
                  className="text-2xl font-black leading-none"
                  style={{ color: scoreColor(r.score), fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {r.score ?? "—"}
                </p>
                {r.score !== null && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${scoreBg(r.score)}`}>
                    {r.score >= 80 ? "Good" : r.score >= 60 ? "Fair" : "Poor"}
                  </span>
                )}
              </div>
              {r.score !== null && (
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${r.score}%`, backgroundColor: scoreColor(r.score) }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Engine Visibility */}
      {audit.geoRuns.length > 0 && (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            <h2 className="text-base font-black text-on-background">AI Engine Visibility</h2>
          </div>
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
                {audit.geoRuns.map((run, i) => {
                  const meta = ENGINE_META[run.engine];
                  return (
                    <tr key={i} className="hover:bg-surface-alt/50 transition-colors">
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
                      <td className="px-6 py-4 max-w-[240px]">
                        <p className="text-sm text-on-background truncate" title={run.prompt}>{run.prompt}</p>
                      </td>
                      <td className="px-6 py-4">
                        {run.mentioned ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold">
                            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            Yes
                          </span>
                        ) : (
                          <span className="text-text-secondary text-xs">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {run.cited ? (
                          <span className="inline-flex items-center gap-1 text-primary text-xs font-bold">
                            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
                            Yes
                          </span>
                        ) : (
                          <span className="text-text-secondary text-xs">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${sentimentClass(run.sentiment)}`}>
                          {run.sentiment ?? "neutral"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Keywords */}
      {audit.keywords.length > 0 && (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-text-secondary text-[20px]">key</span>
              <h2 className="text-base font-black text-on-background">Top Keywords</h2>
            </div>
            <p className="text-xs text-text-secondary font-medium">
              Showing {Math.min(audit.keywords.length, 20)} of {audit.keywords.length}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-alt border-b border-border">
                  {["Keyword", "Volume", "Difficulty", "CPC", "Position", "Intent"].map((h) => (
                    <th key={h} className="px-6 py-3 text-xs font-black text-text-secondary uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {audit.keywords.slice(0, 20).map((kw, i) => (
                  <tr key={i} className="hover:bg-surface-alt/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-sm text-on-background">{kw.term}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary font-mono">
                      {kw.volume != null ? kw.volume.toLocaleString() : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {kw.difficulty != null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${difficultyColor(kw.difficulty)}`}
                              style={{ width: `${kw.difficulty}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-text-secondary">{kw.difficulty}</span>
                        </div>
                      ) : (
                        <span className="text-text-secondary text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary font-mono">
                      {kw.cpc != null ? `$${kw.cpc.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono">
                      {kw.position != null ? (
                        <span className={kw.position <= 10 ? "text-emerald-700 font-bold" : "text-text-secondary"}>
                          #{kw.position}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {kw.intent ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-light text-primary capitalize">
                          {kw.intent}
                        </span>
                      ) : (
                        <span className="text-text-secondary text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pages */}
      {audit.pages.length > 0 && (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-text-secondary text-[20px]">web</span>
              <h2 className="text-base font-black text-on-background">Audited Pages</h2>
            </div>
            <p className="text-xs text-text-secondary font-medium">
              {audit.pages.length} page{audit.pages.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-alt border-b border-border">
                  <th className="px-6 py-3 text-xs font-black text-text-secondary uppercase tracking-widest">URL</th>
                  <th className="px-6 py-3 text-xs font-black text-text-secondary uppercase tracking-widest">Est. Traffic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {audit.pages.slice(0, 15).map((page, i) => (
                  <tr key={i} className="hover:bg-surface-alt/50 transition-colors">
                    <td className="px-6 py-3 max-w-[420px]">
                      <p className="text-sm text-on-background truncate font-mono" title={page.url}>
                        {page.url}
                      </p>
                    </td>
                    <td className="px-6 py-3 text-sm text-text-secondary font-mono">
                      {page.estTraffic != null ? page.estTraffic.toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cost footnote */}
      {audit.costCents > 0 && (
        <p className="text-xs text-text-secondary text-right">
          Audit cost: ${(audit.costCents / 100).toFixed(3)}
        </p>
      )}
    </div>
  );
}
