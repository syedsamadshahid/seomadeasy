"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { VendorCost } from "@/lib/usage/aggregates";

type Props = { data: VendorCost[] };

export function CostByVendorChart({ data }: Props) {
  const formatted = data.map((d) => ({
    vendor: d.vendor,
    dollars: +(d.totalCents / 100).toFixed(2),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={formatted} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="vendor" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
        <YAxis tickFormatter={(v: number) => `$${v}`} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
        <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, "Cost"]} />
        <Bar dataKey="dollars" fill="var(--chart-1, #2563eb)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
