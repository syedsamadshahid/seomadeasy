import { ENGINE_META } from "@/components/dashboard/engine-meta";
import { SectionCard } from "./ui";

export type GeoRunRow = {
  engine: string;
  prompt: string;
  mentioned: boolean;
  cited: boolean;
  prominence: number | null;
  sentiment: string | null;
  competitorsNamed: unknown;
};

type Props = { runs: GeoRunRow[] };

function sentimentClass(s: string | null): string {
  if (s === "positive") return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (s === "negative") return "bg-red-50 text-red-700 border border-red-200";
  return "bg-slate-100 text-slate-600 border border-slate-200";
}

function asNames(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function prominenceColor(p: number): string {
  if (p >= 7) return "bg-emerald-500";
  if (p >= 4) return "bg-amber-500";
  return "bg-red-500";
}

export function GeoVisibilitySection({ runs }: Props) {
  if (runs.length === 0) return null;

  return (
    <SectionCard id="geo" icon="auto_awesome" title="AI Engine Visibility">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-alt border-b border-border">
              <th className="px-6 py-3 text-xs font-black text-text-secondary uppercase tracking-widest">Engine</th>
              <th className="px-6 py-3 text-xs font-black text-text-secondary uppercase tracking-widest">Prompt</th>
              <th className="px-4 py-3 text-xs font-black text-text-secondary uppercase tracking-widest">Mentioned</th>
              <th className="px-4 py-3 text-xs font-black text-text-secondary uppercase tracking-widest">Cited</th>
              <th className="px-4 py-3 text-xs font-black text-text-secondary uppercase tracking-widest">Prominence</th>
              <th className="px-4 py-3 text-xs font-black text-text-secondary uppercase tracking-widest">Sentiment</th>
              <th className="px-6 py-3 text-xs font-black text-text-secondary uppercase tracking-widest">Competitors named</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {runs.map((run, i) => {
              const meta = ENGINE_META[run.engine];
              const competitors = asNames(run.competitorsNamed);
              const prom = run.prominence ?? 0;
              return (
                <tr key={i} className="hover:bg-surface-alt/50 transition-colors align-top">
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
                  <td className="px-6 py-4 max-w-[220px]">
                    <p className="text-sm text-on-background line-clamp-2" title={run.prompt}>{run.prompt}</p>
                  </td>
                  <td className="px-4 py-4">
                    {run.mentioned ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold">
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        Yes
                      </span>
                    ) : (
                      <span className="text-text-secondary text-xs">No</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {run.cited ? (
                      <span className="inline-flex items-center gap-1 text-primary text-xs font-bold">
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
                        Yes
                      </span>
                    ) : (
                      <span className="text-text-secondary text-xs">No</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2" title={`${prom}/10`}>
                      <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${prominenceColor(prom)}`} style={{ width: `${prom * 10}%` }} />
                      </div>
                      <span className="text-xs font-mono text-text-secondary">{prom}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${sentimentClass(run.sentiment)}`}>
                      {run.sentiment ?? "neutral"}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-[220px]">
                    {competitors.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {competitors.map((c) => (
                          <span key={c} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface-alt border border-border text-text-secondary truncate max-w-[120px]" title={c}>
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-text-secondary text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
