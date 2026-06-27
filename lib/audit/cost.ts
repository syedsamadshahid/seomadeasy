import { prisma } from "@/lib/db";
import { NonRetriableError } from "inngest";
import type { Plan } from "@prisma/client";

// Hard per-audit cost ceiling in US cents ($2.00). Aborts if exceeded.
export const PER_AUDIT_CEILING_CENTS = 200;

// Page caps per plan (Free 3 / Pro 50 / Agency 150)
export function pageCapForPlan(plan: Plan): number {
  if (plan === "agency") return 150;
  if (plan === "pro") return 50;
  return 3;
}

export async function assertUnderCeiling(auditId: string): Promise<void> {
  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
    select: { costCents: true },
  });
  if (!audit) return;
  if (audit.costCents >= PER_AUDIT_CEILING_CENTS) {
    await prisma.audit.update({
      where: { id: auditId },
      data: { status: "failed" },
    });
    throw new NonRetriableError(
      `Audit ${auditId} exceeded cost ceiling of $${(PER_AUDIT_CEILING_CENTS / 100).toFixed(2)}`,
    );
  }
}
