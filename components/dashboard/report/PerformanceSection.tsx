import type { PerfPayload } from "@/lib/audit/report-types";
import { SectionCard } from "./ui";

type Props = { payload: PerfPayload | null };

type Rating = "good" | "ni" | "poor";

const RATING_CLASS: Record<Rating, string> = {
  good: "text-emerald-700",
  ni: "text-amber-700",
  poor: "text-red-700",
};

// Core Web Vitals thresholds (mobile). LCP/FCP/INP/TBT in ms, CLS unitless.
function rate(value: number | null, good: number, poor: number): Rating {
  if (value === null) return "ni";
  if (value <= good) return "good";
  if (value <= poor) return "ni";
  return "poor";
}

function ms(value: number | null): string {
  if (value === null) return "—";
  return value >= 1000 ? `${(value / 1000).toFixed(2)}s` : `${Math.round(value)}ms`;
}

function cls(value: number | null): string {
  return value === null ? "—" : value.toFixed(3);
}

// Lighthouse performance score: good ≥ 90, needs improvement 50–89, poor < 50.
function rateScore(value: number | null): Rating {
  if (value === null) return "ni";
  if (value >= 90) return "good";
  if (value >= 50) return "ni";
  return "poor";
}

const COLS = [
  { key: "lcp", label: "LCP", good: 2500, poor: 4000 },
  { key: "inp", label: "INP", good: 200, poor: 500 },
  { key: "cls", label: "CLS", good: 0.1, poor: 0.25 },
  { key: "fcp", label: "FCP", good: 1800, poor: 3000 },
  { key: "tbt", label: "TBT", good: 200, poor: 600 },
] as const;

export function PerformanceSection({ payload }: Props) {
  const pages = (payload?.pages ?? []).filter(
    (p) => p.lcp !== null || p.cls !== null || p.inp !== null || p.performanceScore !== null,
  );
  if (pages.length === 0) return null;

  return (
    <SectionCard
      id="perf"
      icon="speed"
      title="Performance — Core Web Vitals"
      right={<span className="text-xs text-text-secondary font-medium">Mobile · {pages.length} page{pages.length === 1 ? "" : "s"}</span>}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-alt border-b border-border">
              <th className="px-6 py-3 text-xs font-black text-text-secondary uppercase tracking-widest">Page</th>
              <th className="px-4 py-3 text-xs font-black text-text-secondary uppercase tracking-widest text-right">Score</th>
              {COLS.map((c) => (
                <th key={c.key} className="px-4 py-3 text-xs font-black text-text-secondary uppercase tracking-widest text-right" title={`${c.label} — good ≤ ${c.key === "cls" ? c.good : ms(c.good)}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pages.map((p) => (
              <tr key={p.url} className="hover:bg-surface-alt/50 transition-colors">
                <td className="px-6 py-3 max-w-[260px]">
                  <p className="text-sm font-mono text-on-background truncate" title={p.url}>{p.url}</p>
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`text-sm font-black ${RATING_CLASS[rateScore(p.performanceScore)]}`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {p.performanceScore ?? "—"}
                  </span>
                </td>
                <td className={`px-4 py-3 text-right text-sm font-mono ${RATING_CLASS[rate(p.lcp, 2500, 4000)]}`}>{ms(p.lcp)}</td>
                <td className={`px-4 py-3 text-right text-sm font-mono ${RATING_CLASS[rate(p.inp, 200, 500)]}`}>{ms(p.inp)}</td>
                <td className={`px-4 py-3 text-right text-sm font-mono ${RATING_CLASS[rate(p.cls, 0.1, 0.25)]}`}>{cls(p.cls)}</td>
                <td className={`px-4 py-3 text-right text-sm font-mono ${RATING_CLASS[rate(p.fcp, 1800, 3000)]}`}>{ms(p.fcp)}</td>
                <td className={`px-4 py-3 text-right text-sm font-mono ${RATING_CLASS[rate(p.tbt, 200, 600)]}`}>{ms(p.tbt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-border flex flex-wrap gap-4 text-[11px] text-text-secondary">
        <Legend color="text-emerald-700" label="Good" />
        <Legend color="text-amber-700" label="Needs improvement" />
        <Legend color="text-red-700" label="Poor" />
      </div>
    </SectionCard>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-2 rounded-full ${color.replace("text-", "bg-")}`} />
      <span>{label}</span>
    </span>
  );
}
