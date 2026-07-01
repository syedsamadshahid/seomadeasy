import { ENGINE_META } from "@/components/dashboard/engine-meta";
import type {
  ComparisonResult,
  DomainEntry,
  GeoQuestion,
} from "@/lib/audit/comparison-compute";

type Props = { result: ComparisonResult };

const CATEGORY_LABELS: Record<string, string> = {
  overall: "Overall",
  onpage: "On-Page SEO",
  perf: "Performance",
  links: "Backlinks",
  authority: "Domain Authority",
  keywords: "Keywords",
  traffic: "Traffic",
  geo: "AI Visibility",
};

function scoreColor(score: number | null): string {
  if (score === null) return "#94a3b8";
  if (score >= 80) return "#16a34a";
  if (score >= 60) return "#d97706";
  return "#dc2626";
}

function rankedDomains(domains: DomainEntry[]): DomainEntry[] {
  return [...domains].sort((a, b) => (b.overallScore ?? -1) - (a.overallScore ?? -1));
}

function shortDomain(d: string): string {
  return d.replace(/^www\./, "");
}

export function ComparisonReport({ result }: Props) {
  const { domains, scorecard, geo, shareOfVoice, brief } = result;
  const ranked = rankedDomains(domains);
  const labelFor = (auditId: string) => {
    const d = domains.find((x) => x.auditId === auditId);
    return d ? shortDomain(d.domain) : "—";
  };
  const sovMax = shareOfVoice[0]?.mentions ?? 1;
  const sortedSov = [...shareOfVoice].sort((a, b) => b.mentions - a.mentions);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-on-background tracking-tight">Competitor Comparison</h1>
        <p className="text-sm text-text-secondary mt-1">
          Head-to-head across SEO health and AI visibility for {domains.length} domains.
        </p>
      </div>

      {/* Ranked domain strip */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(ranked.length, 4)}, minmax(0, 1fr))` }}>
        {ranked.map((d, i) => (
          <div
            key={d.auditId}
            className={`relative bg-white border rounded-xl p-5 flex flex-col items-center gap-2 ${
              d.isPrimary ? "border-primary/40 ring-1 ring-primary/20" : "border-border"
            }`}
          >
            <span className="absolute top-3 left-3 text-xs font-black text-text-secondary font-mono">#{i + 1}</span>
            {d.isPrimary && (
              <span className="absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full bg-primary-light text-primary uppercase tracking-wider">
                You
              </span>
            )}
            <div
              className="rounded-full flex items-center justify-center mt-2"
              style={{
                width: 64,
                height: 64,
                background: `radial-gradient(closest-side, white 79%, transparent 80% 100%), conic-gradient(${scoreColor(d.overallScore)} ${d.overallScore ?? 0}%, #e2e8f0 0)`,
              }}
            >
              <span className="text-lg font-black text-on-background" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {d.overallScore ?? "—"}
              </span>
            </div>
            <p className="text-xs font-bold text-on-background truncate max-w-full" title={d.domain}>
              {shortDomain(d.domain)}
            </p>
            {d.status === "failed" && <span className="text-[10px] text-destructive">data unavailable</span>}
          </div>
        ))}
      </div>

      {/* Scorecard matrix */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            scoreboard
          </span>
          <h2 className="text-base font-black text-on-background">Scorecard</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-alt border-b border-border">
                <th className="px-6 py-3 text-xs font-black text-text-secondary uppercase tracking-widest">Category</th>
                {domains.map((d) => (
                  <th key={d.auditId} className="px-4 py-3 text-xs font-black text-text-secondary uppercase tracking-widest text-center">
                    <span className={d.isPrimary ? "text-primary" : ""}>{shortDomain(d.domain)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {scorecard.map((row) => (
                <tr key={row.category} className="hover:bg-surface-alt/50 transition-colors">
                  <td className="px-6 py-3 text-sm font-bold text-on-background">
                    {CATEGORY_LABELS[row.category] ?? row.category}
                  </td>
                  {domains.map((d) => {
                    const score = row.scores[d.auditId] ?? null;
                    const isWinner = row.winnerAuditId === d.auditId && domains.length > 1;
                    return (
                      <td key={d.auditId} className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-lg text-sm font-black font-mono ${
                            isWinner ? "bg-emerald-50 ring-1 ring-emerald-200" : ""
                          }`}
                          style={{ color: scoreColor(score) }}
                        >
                          {score ?? "—"}
                          {isWinner && (
                            <span className="material-symbols-outlined text-emerald-600 text-[14px] ml-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                              trophy
                            </span>
                          )}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Share of voice */}
      {sortedSov.some((s) => s.mentions > 0) && (
        <div className="bg-white border border-border rounded-xl p-6">
          <h2 className="text-base font-black text-on-background mb-4">Share of Voice in AI Answers</h2>
          <div className="space-y-2.5">
            {sortedSov.map((s) => {
              const isPrimary = domains.find((d) => d.auditId === s.auditId)?.isPrimary;
              return (
                <div key={s.auditId} className="flex items-center gap-3">
                  <p className={`text-sm w-44 truncate ${isPrimary ? "font-black text-primary" : "font-semibold text-on-background"}`} title={s.domain}>
                    {shortDomain(s.domain)}
                  </p>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isPrimary ? "bg-primary" : "bg-primary/40"}`}
                      style={{ width: `${Math.round((s.mentions / sovMax) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-secondary w-20 text-right font-mono">
                    {s.mentions}× &nbsp;{s.pct}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI-visibility head-to-head */}
      {geo.length > 0 && <GeoHeadToHead geo={geo} domains={domains} labelFor={labelFor} />}

      {/* Gap brief */}
      {(brief.summary || brief.quickWins.length > 0) && (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              emoji_events
            </span>
            <h2 className="text-base font-black text-on-background">How You Can Win</h2>
          </div>
          <div className="p-6 space-y-5">
            {brief.summary && <p className="text-sm text-on-background leading-relaxed">{brief.summary}</p>}
            <BriefList title="Where you lose" icon="trending_down" items={brief.whereYouLose} />
            <BriefList title="Quick wins" icon="bolt" items={brief.quickWins} />
            <BriefList title="GEO strategy" icon="auto_awesome" items={brief.geoStrategy} />
          </div>
        </div>
      )}
    </div>
  );
}

function BriefList({ title, icon, items }: { title: string; icon: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="material-symbols-outlined text-text-secondary text-[16px]">{icon}</span>
        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">{title}</p>
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm text-on-background">
            <span className="text-primary mt-0.5">•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GeoHeadToHead({
  geo,
  domains,
  labelFor,
}: {
  geo: GeoQuestion[];
  domains: DomainEntry[];
  labelFor: (auditId: string) => string;
}) {
  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          forum
        </span>
        <h2 className="text-base font-black text-on-background">AI Visibility — Question by Question</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-alt border-b border-border">
              <th className="px-6 py-3 text-xs font-black text-text-secondary uppercase tracking-widest">Question</th>
              <th className="px-3 py-3 text-xs font-black text-text-secondary uppercase tracking-widest">Engine</th>
              {domains.map((d) => (
                <th key={d.auditId} className="px-3 py-3 text-xs font-black text-text-secondary uppercase tracking-widest text-center">
                  <span className={d.isPrimary ? "text-primary" : ""}>{labelFor(d.auditId)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {geo.slice(0, 40).map((q, qi) => {
              const meta = ENGINE_META[q.engine];
              return (
                <tr key={qi} className="hover:bg-surface-alt/50 transition-colors">
                  <td className="px-6 py-3 max-w-[280px]">
                    <p className="text-sm text-on-background truncate" title={q.prompt}>{q.prompt}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className="inline-flex items-center text-white text-[10px] font-black px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: meta?.color ?? "#888" }}
                      title={meta?.label ?? q.engine}
                    >
                      {meta?.initial ?? q.engine[0].toUpperCase()}
                    </span>
                  </td>
                  {domains.map((d) => {
                    const cell = q.cells.find((c) => c.auditId === d.auditId);
                    const isWinner = q.winnerAuditId === d.auditId && domains.length > 1;
                    return (
                      <td key={d.auditId} className="px-3 py-3 text-center">
                        <div className={`inline-flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg ${isWinner ? "bg-emerald-50 ring-1 ring-emerald-200" : ""}`}>
                          {cell?.cited ? (
                            <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }} title="Cited as source">link</span>
                          ) : cell?.mentioned ? (
                            <span className="material-symbols-outlined text-emerald-600 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }} title="Mentioned">check_circle</span>
                          ) : (
                            <span className="text-slate-300 text-xs" title="Not mentioned">—</span>
                          )}
                          {cell && (cell.mentioned || cell.cited) && cell.prominence != null && (
                            <span className="text-[10px] text-text-secondary font-mono">{cell.prominence}/10</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
