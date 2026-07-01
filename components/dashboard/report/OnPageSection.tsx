"use client";
import { useState } from "react";
import type { OnPagePayload } from "@/lib/audit/report-types";
import { SectionCard, PassFail, EmptyRow, issueLabel, scoreBg } from "./ui";

type Props = { payload: OnPagePayload | null; score: number | null };

export function OnPageSection({ payload, score }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const pages = payload?.pages ?? [];
  if (pages.length === 0) return null;

  const pagesWithIssues = pages.filter((p) => p.issues.length > 0).length;

  return (
    <SectionCard
      id="onpage"
      icon="checklist"
      title="On-Page SEO"
      right={
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${scoreBg(score)}`}>
          {pagesWithIssues === 0
            ? "All pages clean"
            : `${pagesWithIssues} page${pagesWithIssues === 1 ? "" : "s"} with issues`}
        </span>
      }
    >
      <ul className="divide-y divide-border">
        {pages.map((page) => {
          const isOpen = open === page.url;
          return (
            <li key={page.url}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : page.url)}
                className="w-full px-6 py-4 flex items-center gap-4 text-left hover:bg-surface-alt/50 transition-colors"
              >
                <span
                  className={`material-symbols-outlined text-[18px] text-text-secondary transition-transform ${
                    isOpen ? "rotate-90" : ""
                  }`}
                >
                  chevron_right
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-mono text-on-background truncate" title={page.url}>
                    {page.url}
                  </span>
                  <span className="mt-1.5 flex flex-wrap gap-1.5">
                    <PassFail ok={!!page.title} label="Title" />
                    <PassFail ok={!!page.description} label="Meta" />
                    <PassFail ok={page.h1.length === 1} label="H1" />
                    <PassFail ok={!!page.canonical} label="Canonical" />
                    <PassFail ok={page.hasSchema} label="Schema" />
                  </span>
                </span>
                <span className="text-right flex-shrink-0">
                  <span
                    className="block text-sm font-black text-on-background"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {page.wordCount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider">words</span>
                </span>
              </button>

              {isOpen && (
                <div className="px-6 pb-5 pl-16 space-y-3 bg-surface-alt/30">
                  <Field label="Title" value={page.title} />
                  <Field label="Meta description" value={page.description} />
                  <Field label="H1" value={page.h1[0] ?? null} extra={page.h1.length > 1 ? `+${page.h1.length - 1} more` : undefined} />
                  <Field label="Canonical" value={page.canonical} mono />
                  <Field label="Robots" value={page.robots} mono />
                  {page.issues.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5">
                        Issues
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {page.issues.map((issue) => (
                          <span
                            key={issue}
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200"
                          >
                            {issueLabel(issue)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {pages.length === 0 && <EmptyRow>No pages analyzed.</EmptyRow>}
    </SectionCard>
  );
}

function Field({
  label,
  value,
  mono,
  extra,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
  extra?: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-0.5">{label}</p>
      <p className={`text-sm text-on-background break-words ${mono ? "font-mono" : ""}`}>
        {value ? value : <span className="text-red-600 italic">missing</span>}
        {extra && <span className="ml-2 text-xs text-text-secondary">{extra}</span>}
      </p>
    </div>
  );
}
