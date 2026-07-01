"use client";
import { ExportMenu } from "@/components/reports/ExportMenu";
import { ShareDialog } from "@/components/reports/ShareDialog";
import type { PlanFeatures } from "@/lib/plan/features";
import { getPayload, type ReportResult } from "@/lib/audit/report-types";
import { scoreColor, scoreBg, scoreLabel } from "@/components/dashboard/report/ui";
import { OnPageSection } from "@/components/dashboard/report/OnPageSection";
import { PerformanceSection } from "@/components/dashboard/report/PerformanceSection";
import { AuthoritySection } from "@/components/dashboard/report/AuthoritySection";
import { BrokenLinksSection } from "@/components/dashboard/report/BrokenLinksSection";
import { GeoVisibilitySection } from "@/components/dashboard/report/GeoVisibilitySection";
import { KeywordsSection } from "@/components/dashboard/report/KeywordsSection";
import { PagesSection } from "@/components/dashboard/report/PagesSection";
import { ContentRecommendations } from "@/components/dashboard/report/ContentRecommendations";

type AuditData = {
  id?: string;
  status: string;
  overallScore: number | null;
  finishedAt: Date | string | null;
  costCents: number;
  results: ReportResult[];
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
  domain?: string | null;
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
  links: "Broken Links",
  authority: "Backlinks",
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

function ScoreRing({ value, color, size = 80 }: { value: number | null; color: string; size?: number }) {
  const pct = value !== null ? Math.round(value) : 0;
  const bg =
    value !== null
      ? `radial-gradient(closest-side, white 79%, transparent 80% 100%), conic-gradient(${color} ${pct}%, #e2e8f0 0)`
      : `radial-gradient(closest-side, white 79%, transparent 80% 100%), conic-gradient(#e2e8f0 100%)`;
  return <div style={{ width: size, height: size, background: bg, borderRadius: "50%" }} aria-hidden />;
}

export function AuditReport({ audit, features, auditId }: Props) {
  const geoScore = audit.results.find((r) => r.category === "geo")?.score ?? null;
  const scoreFor = (cat: string) => audit.results.find((r) => r.category === cat)?.score ?? null;

  const onpage = getPayload(audit.results, "onpage");
  const perf = getPayload(audit.results, "perf");
  const links = getPayload(audit.results, "links");
  const authority = getPayload(audit.results, "authority");
  const content = getPayload(audit.results, "content");

  const finishedDate = audit.finishedAt
    ? new Date(audit.finishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-on-background tracking-tight">Audit Report</h1>
          {finishedDate && <p className="text-sm text-text-secondary mt-1">Completed {finishedDate}</p>}
        </div>
        <div className="flex items-center gap-2">
          {features.canShare && <ShareDialog auditId={auditId} />}
          <ExportMenu auditId={auditId} features={features} />
        </div>
      </div>

      {/* Top score strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-xl p-5 flex flex-col items-center gap-2">
          <ScoreRing value={audit.overallScore} color="#4648d4" size={72} />
          <div className="text-center">
            <p className="text-2xl font-black text-on-background leading-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {audit.overallScore ?? "—"}
            </p>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-1">Overall Score</p>
          </div>
        </div>

        <div className="bg-white border border-primary/20 rounded-xl p-5 flex flex-col items-center gap-2">
          <ScoreRing value={geoScore} color="#00687a" size={72} />
          <div className="text-center">
            <p className="text-2xl font-black text-primary leading-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {geoScore ?? "—"}
            </p>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-1">AI Visibility</p>
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl p-5 flex flex-col justify-center items-center gap-1">
          <span className="material-symbols-outlined text-primary text-2xl">key</span>
          <p className="text-3xl font-black text-on-background" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {audit.keywords.length}
          </p>
          <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Keywords</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-5 flex flex-col justify-center items-center gap-1">
          <span className="material-symbols-outlined text-text-secondary text-2xl">web</span>
          <p className="text-3xl font-black text-on-background" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {audit.pages.length}
          </p>
          <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Pages</p>
        </div>
      </div>

      {/* Category Scores — each tile jumps to its detailed section */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-black text-on-background">Category Scores</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-border">
          {audit.results.map((r) => (
            <a key={r.category} href={`#${r.category}`} className="p-5 flex flex-col gap-3 hover:bg-surface-alt/50 transition-colors">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-text-secondary text-[18px]">
                  {CATEGORY_ICONS[r.category] ?? "analytics"}
                </span>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  {CATEGORY_LABELS[r.category] ?? r.category}
                </p>
              </div>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-black leading-none" style={{ color: scoreColor(r.score), fontFamily: "'JetBrains Mono', monospace" }}>
                  {r.score ?? "—"}
                </p>
                {r.score !== null && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${scoreBg(r.score)}`}>
                    {scoreLabel(r.score)}
                  </span>
                )}
              </div>
              {r.score !== null && (
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${r.score}%`, backgroundColor: scoreColor(r.score) }} />
                </div>
              )}
            </a>
          ))}
        </div>
      </div>

      {/* Detailed sections */}
      <OnPageSection payload={onpage} score={scoreFor("onpage")} />
      <PerformanceSection payload={perf} />
      <AuthoritySection payload={authority} score={scoreFor("authority")} />
      <BrokenLinksSection payload={links} />
      <GeoVisibilitySection runs={audit.geoRuns} />
      <KeywordsSection keywords={audit.keywords} />
      <PagesSection pages={audit.pages} />
      <ContentRecommendations payload={content} />

      {/* Cost footnote */}
      {audit.costCents > 0 && (
        <p className="text-xs text-text-secondary text-right">Audit cost: ${(audit.costCents / 100).toFixed(3)}</p>
      )}
    </div>
  );
}
