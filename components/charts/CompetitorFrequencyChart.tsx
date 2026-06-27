"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { CompetitorFreq } from "@/lib/audit/trends";

type Props = { data: CompetitorFreq[] };

export function CompetitorFrequencyChart({ data }: Props) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">Competitor Appearances</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 0, left: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis type="number" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 10 }}
            stroke="var(--muted-foreground)"
          />
          <Tooltip />
          <Bar dataKey="count" fill="var(--chart-3)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
