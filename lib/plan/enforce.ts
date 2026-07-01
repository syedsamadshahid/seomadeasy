import type { Plan } from "@prisma/client";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/cache/redis";
import { planFeatures } from "./features";

export class PlanLimitError extends Error {
  constructor(
    message: string,
    public readonly limit: "website" | "audit" | "pages_pool" | "keywords",
  ) {
    super(message);
    this.name = "PlanLimitError";
  }
}

function startOfMonth(): Date {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function yearMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function suggestUpgrade(plan: Plan): string {
  return plan === "free" ? "Pro" : "Agency";
}

export async function assertCanAddWebsite(
  userId: string,
  plan: Plan,
  newDomain: string,
): Promise<void> {
  const { websiteLimit } = planFeatures(plan);

  // Count existing projects that are NOT the domain being added (upsert means same domain is fine)
  const existingCount = await prisma.project.count({
    where: { userId, domain: { not: newDomain } },
  });

  if (existingCount >= websiteLimit) {
    const upgrade = suggestUpgrade(plan);
    throw new PlanLimitError(
      `Your ${plan} plan supports up to ${websiteLimit} website${websiteLimit === 1 ? "" : "s"}. Upgrade to ${upgrade} to add more.`,
      "website",
    );
  }
}

export async function assertCanRunAudit(
  userId: string,
  plan: Plan,
  count = 1,
): Promise<void> {
  const { monthlyAuditLimit } = planFeatures(plan);
  if (monthlyAuditLimit === null) return; // unlimited

  const key = `audit-limit:${userId}:${yearMonth()}`;
  const TTL = 33 * 24 * 3600; // outlives any calendar month

  // Seed from DB on cold start (Redis flush, first request of month, etc.).
  // SET NX is atomic — only one concurrent caller wins; the rest proceed to INCRBY.
  if (!(await redis.exists(key))) {
    const dbCount = await prisma.audit.count({
      where: { project: { userId }, createdAt: { gte: startOfMonth() } },
    });
    await redis.set(key, dbCount, { ex: TTL, nx: true });
  }

  // Atomic reserve of `count` audit slots — eliminates the TOCTOU race.
  const newCount = await redis.incrby(key, count);
  if (newCount === count) await redis.expire(key, TTL); // set TTL if incrby created the key

  if (newCount > monthlyAuditLimit) {
    await redis.decrby(key, count); // roll back so limit remains accurate
    const remaining = Math.max(0, monthlyAuditLimit - (newCount - count));
    const suffix =
      count > 1
        ? `This comparison needs ${count} audits but you have ${remaining} left this month.`
        : `You've used all ${monthlyAuditLimit} free audit${monthlyAuditLimit === 1 ? "" : "s"} this month.`;
    throw new PlanLimitError(`${suffix} Upgrade to Pro for unlimited audits.`, "audit");
  }
}

export async function assertPagesPoolUnderLimit(
  userId: string,
  plan: Plan,
): Promise<void> {
  const { pagesPoolPerMonth } = planFeatures(plan);

  const pageCount = await prisma.page.count({
    where: {
      audit: {
        project: { userId },
        createdAt: { gte: startOfMonth() },
      },
    },
  });

  if (pageCount >= pagesPoolPerMonth) {
    const upgrade = suggestUpgrade(plan);
    throw new PlanLimitError(
      `You've used your monthly pages pool (${pagesPoolPerMonth.toLocaleString()} pages). Upgrade to ${upgrade} for more.`,
      "pages_pool",
    );
  }
}

export async function assertKeywordsUnderLimit(
  userId: string,
  plan: Plan,
): Promise<void> {
  const { keywordsTracked } = planFeatures(plan);

  const kwCount = await prisma.keyword.count({
    where: {
      audit: {
        project: { userId },
        createdAt: { gte: startOfMonth() },
      },
    },
  });

  if (kwCount >= keywordsTracked) {
    const upgrade = suggestUpgrade(plan);
    throw new PlanLimitError(
      `You've reached your keyword tracking limit (${keywordsTracked.toLocaleString()} keywords). Upgrade to ${upgrade} for more.`,
      "keywords",
    );
  }
}

export interface UsageSummary {
  websites: { used: number; limit: number };
  auditsThisMonth: { used: number; limit: number | null };
  pagesThisMonth: { used: number; limit: number };
  keywordsThisMonth: { used: number; limit: number };
}

export async function getUsageSummary(
  userId: string,
  plan: Plan,
): Promise<UsageSummary> {
  const features = planFeatures(plan);
  const monthStart = startOfMonth();

  const [websiteCount, auditCount, pageCount, kwCount] = await Promise.all([
    prisma.project.count({ where: { userId } }),
    prisma.audit.count({
      where: { project: { userId }, createdAt: { gte: monthStart } },
    }),
    prisma.page.count({
      where: {
        audit: { project: { userId }, createdAt: { gte: monthStart } },
      },
    }),
    prisma.keyword.count({
      where: {
        audit: { project: { userId }, createdAt: { gte: monthStart } },
      },
    }),
  ]);

  return {
    websites: { used: websiteCount, limit: features.websiteLimit },
    auditsThisMonth: { used: auditCount, limit: features.monthlyAuditLimit },
    pagesThisMonth: { used: pageCount, limit: features.pagesPoolPerMonth },
    keywordsThisMonth: { used: kwCount, limit: features.keywordsTracked },
  };
}
