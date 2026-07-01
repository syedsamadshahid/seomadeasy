"use client";
import { useState } from "react";
import type { ContentPayload, Fix } from "@/lib/audit/report-types";
import { SectionCard } from "./ui";

type Props = { payload: ContentPayload | null };

const IMPACT_ORDER: Record<Fix["impact"], number> = { high: 0, medium: 1, low: 2 };
const IMPACT_CLASS: Record<Fix["impact"], string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-50 text-slate-600 border-slate-200",
};

export function ContentRecommendations({ payload }: Props) {
  if (!payload) return null;
  const { fixList, rewrites, geoBrief, gaps } = payload;

  const hasBrief =
    geoBrief &&
    (geoBrief.summary ||
      geoBrief.answerFirstStructure ||
      geoBrief.faqSchema ||
      geoBrief.entityClarityTips.length > 0 ||
      geoBrief.topicalGaps.length > 0 ||
      geoBrief.competitorAdvantages.length > 0);

  const hasAnything =
    fixList.length > 0 || rewrites.length > 0 || hasBrief || (gaps && (gaps.keywordGaps.length > 0 || gaps.outlines.length > 0));

  if (!hasAnything) return null;

  const sortedFixes = [...fixList].sort((a, b) => IMPACT_ORDER[a.impact] - IMPACT_ORDER[b.impact]);

  return (
    <div id="content" className="space-y-6 scroll-mt-24">
      <div className="flex items-center gap-2">
        <span
          className="material-symbols-outlined text-primary text-[22px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          article
        </span>
        <h2 className="text-lg font-black text-on-background tracking-tight">Content Recommendations</h2>
      </div>

      {/* Prioritized fix list */}
      {sortedFixes.length > 0 && (
        <SectionCard icon="task_alt" title="Prioritized Fixes" right={<span className="text-xs text-text-secondary font-medium">{sortedFixes.length}</span>}>
          <ul className="divide-y divide-border">
            {sortedFixes.map((fix, i) => (
              <li key={i} className="px-6 py-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${IMPACT_CLASS[fix.impact]}`}>
                    {fix.impact}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-light text-primary">
                    {fix.category}
                  </span>
                </div>
                <p className="text-sm font-bold text-on-background">{fix.issue}</p>
                {fix.why && <p className="mt-1 text-sm text-text-secondary">{fix.why}</p>}
                {fix.howToFix && (
                  <p className="mt-1.5 text-sm text-on-background">
                    <span className="font-bold text-primary">Fix: </span>
                    {fix.howToFix}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* Title / meta rewrites */}
      {rewrites.length > 0 && (
        <SectionCard icon="edit_note" title="Title & Meta Rewrites" right={<span className="text-xs text-text-secondary font-medium">{rewrites.length} page{rewrites.length === 1 ? "" : "s"}</span>}>
          <ul className="divide-y divide-border">
            {rewrites.map((r, i) => (
              <li key={i} className="px-6 py-4 space-y-2">
                <p className="text-sm font-mono text-text-secondary truncate" title={r.url}>{r.url}</p>
                <BeforeAfter label="Title" before={r.originalTitle} after={r.suggestedTitle} />
                <BeforeAfter label="Meta" before={r.originalMeta} after={r.suggestedMeta} />
                {r.reasoning && <p className="text-xs text-text-secondary italic">{r.reasoning}</p>}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* GEO brief */}
      {hasBrief && (
        <SectionCard icon="auto_awesome" title="GEO Content Brief">
          <div className="p-6 space-y-5">
            {geoBrief.summary && <p className="text-sm text-on-background">{geoBrief.summary}</p>}

            {geoBrief.answerFirstStructure && (
              <Block label="Answer-first structure">
                <pre className="text-xs font-mono text-on-background bg-surface-alt border border-border rounded-lg p-3 whitespace-pre-wrap overflow-x-auto">
                  {geoBrief.answerFirstStructure}
                </pre>
              </Block>
            )}

            {geoBrief.faqSchema && <FaqSchema schema={geoBrief.faqSchema} />}

            <TipList label="Entity clarity tips" items={geoBrief.entityClarityTips} />
            <TipList label="Topical gaps to cover" items={geoBrief.topicalGaps} />
            <TipList label="Why competitors win (and how to counter)" items={geoBrief.competitorAdvantages} />
          </div>
        </SectionCard>
      )}

      {/* Content gaps + outlines (agency) */}
      {gaps && (gaps.keywordGaps.length > 0 || gaps.outlines.length > 0) && (
        <SectionCard icon="lightbulb" title="Content Gap Analysis">
          <div className="p-6 space-y-5">
            {gaps.keywordGaps.length > 0 && (
              <Block label="Keyword gaps">
                <div className="space-y-3">
                  {gaps.keywordGaps.map((g, i) => (
                    <div key={i} className="rounded-lg border border-border p-3">
                      <p className="text-sm font-bold text-on-background">{g.topic}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{g.whyGap}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {g.targetKeywords.map((k) => (
                          <span key={k} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary-light text-primary">{k}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Block>
            )}

            {gaps.outlines.length > 0 && (
              <Block label="Suggested article outlines">
                <div className="space-y-3">
                  {gaps.outlines.map((o, i) => (
                    <div key={i} className="rounded-lg border border-border p-3">
                      <p className="text-sm font-bold text-on-background">{o.title}</p>
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        Target: <span className="font-semibold text-primary">{o.targetKeyword}</span>
                      </p>
                      <ul className="mt-2 space-y-1">
                        {o.sections.map((s, j) => (
                          <li key={j} className="text-xs text-on-background flex gap-2">
                            <span className="text-text-secondary font-mono">{j + 1}.</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                      {o.geoAngle && (
                        <p className="mt-2 text-xs text-text-secondary italic">
                          <span className="font-bold not-italic text-primary">GEO angle: </span>
                          {o.geoAngle}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Block>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function BeforeAfter({ label, before, after }: { label: string; before: string | null; after: string }) {
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      <div className="rounded-lg bg-surface-alt border border-border p-2.5">
        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-0.5">{label} · before</p>
        <p className="text-sm text-text-secondary break-words">{before ?? <span className="italic text-red-600">missing</span>}</p>
      </div>
      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5">
        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-0.5">{label} · suggested</p>
        <p className="text-sm text-on-background break-words">{after}</p>
      </div>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">{label}</p>
      {children}
    </div>
  );
}

function TipList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <Block label={label}>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-on-background flex gap-2">
            <span
              className="material-symbols-outlined text-primary text-[16px] mt-0.5 flex-shrink-0"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              chevron_right
            </span>
            {item}
          </li>
        ))}
      </ul>
    </Block>
  );
}

function FaqSchema({ schema }: { schema: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(schema);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Block label="FAQ schema (JSON-LD)">
      <div className="relative">
        <button
          type="button"
          onClick={copy}
          className="absolute top-2 right-2 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md bg-white border border-border text-text-secondary hover:text-primary hover:border-primary/40 transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">{copied ? "check" : "content_copy"}</span>
          {copied ? "Copied" : "Copy"}
        </button>
        <pre className="text-xs font-mono text-on-background bg-surface-alt border border-border rounded-lg p-3 pr-20 whitespace-pre-wrap overflow-x-auto max-h-72">
          {schema}
        </pre>
      </div>
    </Block>
  );
}
