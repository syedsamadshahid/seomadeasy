import type { Plan } from "@prisma/client";
import { prisma } from "@/lib/db";
import { planFeatures } from "./features";

export class PlanLimitError extends Error {
  constructor(
    message: string,
    public readonly limit: "website" | "audit",
  ) {
    super(message);
    this.name = "PlanLimitError";
  }
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
    const upgrade = plan === "free" ? "Pro" : "Agency";
    throw new PlanLimitError(
      `Your ${plan} plan supports up to ${websiteLimit} website${websiteLimit === 1 ? "" : "s"}. Upgrade to ${upgrade} to add more.`,
      "website",
    );
  }
}

export async function assertCanRunAudit(
  userId: string,
  plan: Plan,
): Promise<void> {
  const { monthlyAuditLimit } = planFeatures(plan);
  if (monthlyAuditLimit === null) return; // unlimited

  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const count = await prisma.audit.count({
    where: {
      project: { userId },
      createdAt: { gte: startOfMonth },
    },
  });

  if (count >= monthlyAuditLimit) {
    throw new PlanLimitError(
      `You've used all ${monthlyAuditLimit} free audit${monthlyAuditLimit === 1 ? "" : "s"} this month. Upgrade to Pro for unlimited audits.`,
      "audit",
    );
  }
}
