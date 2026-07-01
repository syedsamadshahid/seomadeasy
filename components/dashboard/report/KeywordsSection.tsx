"use client";
import { useState } from "react";
import { SectionCard } from "./ui";

export type KeywordRow = {
  term: string;
  volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  position: number | null;
  intent: string | null;
};

type Props = { keywords: KeywordRow[] };

const INITIAL = 20;

function difficultyColor(d: number | null): string {
  if (d === null) return "bg-slate-100";
  if (d <= 30) return "bg-emerald-500";
  if (d <= 60) return "bg-amber-500";
  return "bg-red-500";
}

export function KeywordsSection({ keywords }: Props) {
  const [showAll, setShowAll] = useState(false);
  if (keywords.length === 0) return null;

  const rows = showAll ? keywords : keywords.slice(0, INITIAL);

  // Intent distribution summary.
  const intentCounts = keywords.reduce<Record<string, number>>((acc, k) => {
    const key = k.intent ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <SectionCard
      id="keywords"
      icon="key"
      title="Keywords"
      right={
        <p className="text-xs text-text-secondary font-medium">
          Showing {rows.length} of {keywords.length}
        </p>
      }
    >
      {/* Intent distribution */}
      <div className="px-6 py-3 border-b border-border flex flex-wrap gap-2">
        {Object.entries(intentCounts)
          .sort(([, a], [, b]) => b - a)
          .map(([intent, count]) => (
            <span
              key={intent}
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-alt border border-border text-text-secondary capitalize"
            >
              {intent}: <span className="font-mono text-on-background">{count}</span>
            </span>
          ))}
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
            {rows.map((kw, i) => (
              <tr key={i} className="hover:bg-surface-alt/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-sm text-on-background">{kw.term}</td>
                <td className="px-6 py-4 text-sm text-text-secondary font-mono">
                  {kw.volume != null ? kw.volume.toLocaleString() : "—"}
                </td>
                <td className="px-6 py-4">
                  {kw.difficulty != null ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${difficultyColor(kw.difficulty)}`} style={{ width: `${kw.difficulty}%` }} />
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
                    <span className={kw.position <= 10 ? "text-emerald-700 font-bold" : "text-text-secondary"}>#{kw.position}</span>
                  ) : "—"}
                </td>
                <td className="px-6 py-4">
                  {kw.intent ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-light text-primary capitalize">{kw.intent}</span>
                  ) : (
                    <span className="text-text-secondary text-sm">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {keywords.length > INITIAL && (
        <div className="px-6 py-3 border-t border-border">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-xs font-bold text-primary hover:underline"
          >
            {showAll ? "Show less" : `Show all ${keywords.length} keywords`}
          </button>
        </div>
      )}
    </SectionCard>
  );
}
