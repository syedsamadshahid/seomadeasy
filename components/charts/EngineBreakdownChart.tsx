"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { EnginePoint } from "@/lib/audit/trends";

type Props = { data: EnginePoint[] };

type ChartRow = Record<string, number | string>;

export function EngineBreakdownChart({ data }: Props) {
  const dateMap = new Map<string, ChartRow>();
  for (const pt of data) {
    const date = pt.date ? new Date(pt.date).toLocaleDateString() : "";
    if (!dateMap.has(date)) dateMap.set(date, { date });
    const row = dateMap.get(date)!;
    row[pt.engine] = pt.score;
  }
  const formatted = [...dateMap.values()];
  const engines = [...new Set(data.map((d) => d.engine))];
  const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">Per-Engine Score</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={formatted} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
          <Tooltip />
          <Legend />
          {engines.map((e, i) => (
            <Line
              key={e}
              type="monotone"
              dataKey={e}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
