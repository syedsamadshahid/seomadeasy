import type { ReactNode } from "react";
import { ScoreRing } from "./ScoreRing";

type TrendDir = "up" | "down" | "flat";

type Props = {
  label: string;
  value: string | number | null;
  trend?: { direction: TrendDir; text: string } | null;
  ring?: { value: number | null; color?: string } | null;
  badge?: ReactNode;
  stagger?: number;
};

export function KpiCard({ label, value, trend, ring, badge, stagger }: Props) {
  const trendColor =
    trend?.direction === "up"
      ? "text-success"
      : trend?.direction === "down"
      ? "text-error"
      : "text-text-secondary";

  const trendIcon =
    trend?.direction === "up"
      ? "trending_up"
      : trend?.direction === "down"
      ? "trending_down"
      : "trending_flat";

  return (
    <div
      className={[
        "mirror-card p-6 rounded-xl flex items-center justify-between opacity-0 animate-pop-in",
        "hover:scale-[1.02] hover:bg-white/80 transition-all duration-300 group",
        stagger ? `stagger-${stagger}` : "",
      ].join(" ")}
    >
      <div>
        <p className="text-text-secondary text-sm font-bold mb-1 uppercase tracking-tight">{label}</p>
        <h3 className="text-3xl font-black text-[#0F172A]">
          {value !== null && value !== undefined ? value : "—"}
        </h3>
        {badge && <div className="mt-2">{badge}</div>}
        {trend && (
          <p className={`text-sm flex items-center gap-1 mt-2 font-bold ${trendColor}`}>
            <span className="material-symbols-outlined text-[16px]">{trendIcon}</span>
            {trend.text}
          </p>
        )}
      </div>
      {ring && (
        <div className="group-hover:brightness-110 transition-all">
          <ScoreRing value={ring.value} color={ring.color} size={48} />
        </div>
      )}
    </div>
  );
}
