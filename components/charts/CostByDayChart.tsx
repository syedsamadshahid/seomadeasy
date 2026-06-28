"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { DailyCost } from "@/lib/usage/aggregates";

type Props = { data: DailyCost[] };

export function CostByDayChart({ data }: Props) {
  const formatted = data.map((d) => ({
    date: d.date.slice(5), // MM-DD
    dollars: +(d.totalCents / 100).toFixed(2),
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={formatted} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
        <YAxis tickFormatter={(v: number) => `$${v}`} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
        <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, "Spend"]} />
        <Line type="monotone" dataKey="dollars" stroke="var(--chart-1, #2563eb)" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
