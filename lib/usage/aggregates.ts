import { prisma } from "@/lib/db";
import { PER_AUDIT_CEILING_CENTS } from "@/lib/audit/cost";

export interface VendorCost {
  vendor: string;
  totalCents: number;
  callCount: number;
}

export interface DailyCost {
  date: string;
  totalCents: number;
}

export interface TopAudit {
  auditId: string;
  domain: string;
  costCents: number;
  finishedAt: Date | null;
}

export interface CostOverCeiling {
  auditId: string;
  domain: string;
  costCents: number;
  finishedAt: Date | null;
}

export async function costByVendor(sinceDate?: Date): Promise<VendorCost[]> {
  const where = sinceDate ? { createdAt: { gte: sinceDate } } : {};
  const rows = await prisma.usageEvent.groupBy({
    by: ["vendor"],
    where,
    _sum: { costCents: true },
    _count: { id: true },
    orderBy: { _sum: { costCents: "desc" } },
  });
  return rows.map((r) => ({
    vendor: r.vendor,
    totalCents: r._sum.costCents ?? 0,
    callCount: r._count.id,
  }));
}

export async function costByDay(sinceDate?: Date): Promise<DailyCost[]> {
  const since = sinceDate ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const events = await prisma.usageEvent.findMany({
    where: { createdAt: { gte: since }, costCents: { gt: 0 } },
    select: { createdAt: true, costCents: true },
    orderBy: { createdAt: "asc" },
  });

  const byDay = new Map<string, number>();
  for (const e of events) {
    const day = e.createdAt.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + e.costCents);
  }
  return [...byDay.entries()].map(([date, totalCents]) => ({ date, totalCents }));
}

export async function topAuditsByCost(limit = 10): Promise<TopAudit[]> {
  const audits = await prisma.audit.findMany({
    where: { costCents: { gt: 0 } },
    orderBy: { costCents: "desc" },
    take: limit,
    include: { project: { select: { domain: true } } },
  });
  return audits.map((a) => ({
    auditId: a.id,
    domain: a.project.domain,
    costCents: a.costCents,
    finishedAt: a.finishedAt,
  }));
}

export async function auditsOverCeiling(): Promise<CostOverCeiling[]> {
  const audits = await prisma.audit.findMany({
    where: { costCents: { gte: PER_AUDIT_CEILING_CENTS } },
    orderBy: { costCents: "desc" },
    include: { project: { select: { domain: true } } },
  });
  return audits.map((a) => ({
    auditId: a.id,
    domain: a.project.domain,
    costCents: a.costCents,
    finishedAt: a.finishedAt,
  }));
}
