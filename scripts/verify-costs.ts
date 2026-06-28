/**
 * Cost Verification Script — Phase 8.4
 *
 * Sums UsageEvent costs per audit across plan tiers, computes average
 * cost-per-audit, and prints a margin analysis table.
 *
 * Run: pnpm check:costs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface TierStats {
  plan: string;
  revenue: number;
  auditCount: number;
  totalCostCents: number;
  avgCostPerAuditCents: number;
  marginPct: number;
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║       Vantage — Cost Verification (Phase 8.4)          ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  // Gather all completed audits with their user plan and cost
  const audits = await prisma.audit.findMany({
    where: { status: "done", costCents: { gt: 0 } },
    select: {
      id: true,
      costCents: true,
      finishedAt: true,
      project: {
        select: {
          domain: true,
          user: { select: { plan: true } },
        },
      },
    },
    orderBy: { finishedAt: "desc" },
  });

  if (audits.length === 0) {
    console.log("⚠  No completed audits with cost data found.\n");
    console.log("Run some audits first, then re-run this script.\n");
    return;
  }

  console.log(`Found ${audits.length} completed audit(s) with cost data.\n`);

  // ── Per-audit detail ───────────────────────────────────────────────────
  console.log("── Top 10 audits by cost ──\n");
  const topAudits = [...audits].sort((a, b) => b.costCents - a.costCents).slice(0, 10);

  console.log(
    "  " +
      "Domain".padEnd(30) +
      "Plan".padEnd(10) +
      "Cost".padStart(10) +
      "  Date",
  );
  console.log("  " + "─".repeat(70));

  for (const a of topAudits) {
    const cost = `$${(a.costCents / 100).toFixed(2)}`;
    const date = a.finishedAt
      ? a.finishedAt.toISOString().slice(0, 10)
      : "—";
    console.log(
      "  " +
        a.project.domain.padEnd(30) +
        a.project.user.plan.padEnd(10) +
        cost.padStart(10) +
        `  ${date}`,
    );
  }

  // ── Tier aggregation ────────────────────────────────────────────────────
  const revenueByPlan: Record<string, number> = {
    free: 0,
    pro: 9900,    // $99.00/mo in cents
    agency: 19900, // $199.00/mo in cents
  };

  const byTier = new Map<string, { count: number; totalCents: number }>();
  for (const a of audits) {
    const plan = a.project.user.plan;
    const existing = byTier.get(plan) ?? { count: 0, totalCents: 0 };
    existing.count += 1;
    existing.totalCents += a.costCents;
    byTier.set(plan, existing);
  }

  const tiers: TierStats[] = [];
  for (const [plan, stats] of byTier.entries()) {
    const revenue = revenueByPlan[plan] ?? 0;
    const avgCost = Math.round(stats.totalCents / stats.count);
    const margin = revenue > 0 ? Math.round(((revenue - avgCost) / revenue) * 100) : 0;
    tiers.push({
      plan,
      revenue,
      auditCount: stats.count,
      totalCostCents: stats.totalCents,
      avgCostPerAuditCents: avgCost,
      marginPct: margin,
    });
  }

  console.log("\n\n── Margin Analysis by Tier ──\n");
  console.log(
    "  " +
      "Plan".padEnd(10) +
      "Audits".padStart(8) +
      "Avg Cost".padStart(12) +
      "Revenue".padStart(12) +
      "Margin".padStart(10),
  );
  console.log("  " + "─".repeat(52));

  for (const t of tiers) {
    const avgCost = `$${(t.avgCostPerAuditCents / 100).toFixed(2)}`;
    const revenue = t.revenue > 0 ? `$${(t.revenue / 100).toFixed(2)}` : "—";
    const margin = t.revenue > 0 ? `${t.marginPct}%` : "n/a";
    const flag = t.revenue > 0 && t.marginPct < 80 ? " ⚠ BELOW 80%" : "";

    console.log(
      "  " +
        t.plan.padEnd(10) +
        String(t.auditCount).padStart(8) +
        avgCost.padStart(12) +
        revenue.padStart(12) +
        margin.padStart(10) +
        flag,
    );
  }

  // ── Targets ────────────────────────────────────────────────────────────
  console.log("\n\n── Target vs Actual ──\n");
  const proTier = tiers.find((t) => t.plan === "pro");
  const agencyTier = tiers.find((t) => t.plan === "agency");

  if (proTier) {
    const target = 1700; // $17 target cost
    const actual = proTier.avgCostPerAuditCents;
    console.log(
      `  Pro:    target ≤ $17.00/audit (83% margin), actual = $${(actual / 100).toFixed(2)}/audit → ${
        actual <= target ? "✅ PASS" : "⚠ OVER TARGET"
      }`,
    );
  } else {
    console.log("  Pro:    no audit data");
  }

  if (agencyTier) {
    const target = 2800; // $28 target cost
    const actual = agencyTier.avgCostPerAuditCents;
    console.log(
      `  Agency: target ≤ $28.00/audit (86% margin), actual = $${(actual / 100).toFixed(2)}/audit → ${
        actual <= target ? "✅ PASS" : "⚠ OVER TARGET"
      }`,
    );
  } else {
    console.log("  Agency: no audit data");
  }

  console.log("\nDone.\n");
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
