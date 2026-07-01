import type { ReactNode } from "react";

// Shared presentational primitives for the audit report sections.
// Mirrors the existing card / score visual language used across the dashboard.

export function scoreColor(score: number | null): string {
  if (score === null) return "#94a3b8";
  if (score >= 80) return "#16a34a";
  if (score >= 60) return "#d97706";
  return "#dc2626";
}

export function scoreBg(score: number | null): string {
  if (score === null) return "bg-slate-100 text-slate-500";
  if (score >= 80) return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (score >= 60) return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-red-50 text-red-700 border border-red-200";
}

export function scoreLabel(score: number): string {
  return score >= 80 ? "Good" : score >= 60 ? "Fair" : "Poor";
}

export function SectionCard({
  id,
  icon,
  title,
  right,
  children,
}: {
  id?: string;
  icon?: string;
  title: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div id={id} className="bg-white border border-border rounded-xl overflow-hidden scroll-mt-24">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon && (
            <span className="material-symbols-outlined text-text-secondary text-[20px]">{icon}</span>
          )}
          <h2 className="text-base font-black text-on-background">{title}</h2>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export function StatPill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-lg px-4 py-3 border ${
        accent ? "bg-primary-light border-primary/20" : "bg-surface-alt border-border"
      }`}
    >
      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{label}</span>
      <span
        className={`text-xl font-black ${accent ? "text-primary" : "text-on-background"}`}
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {value}
      </span>
    </div>
  );
}

export function PassFail({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
        ok
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-red-50 text-red-700 border border-red-200"
      }`}
    >
      <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
        {ok ? "check_circle" : "cancel"}
      </span>
      {label}
    </span>
  );
}

export function EmptyRow({ children }: { children: ReactNode }) {
  return <div className="px-6 py-8 text-center text-sm text-text-secondary">{children}</div>;
}

const ISSUE_LABELS: Record<string, string> = {
  missing_title: "Missing title tag",
  missing_description: "Missing meta description",
  missing_h1: "Missing H1",
  multiple_h1: "Multiple H1 tags",
  missing_canonical: "Missing canonical",
};

/** Human-readable label for an on-page issue code. */
export function issueLabel(code: string): string {
  return ISSUE_LABELS[code] ?? code.replace(/_/g, " ");
}
