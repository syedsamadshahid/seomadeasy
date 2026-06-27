import { prisma } from "@/lib/db";

export interface LogUsageParams {
  userId: string;
  auditId?: string;
  vendor: string;
  endpoint: string;
  units?: number;
  costCents?: number;
}

export async function logUsage({
  userId,
  auditId,
  vendor,
  endpoint,
  units = 1,
  costCents = 0,
}: LogUsageParams): Promise<void> {
  await prisma.usageEvent.create({
    data: { userId, auditId, vendor, endpoint, units, costCents },
  });

  if (auditId && costCents > 0) {
    await prisma.audit.update({
      where: { id: auditId },
      data: { costCents: { increment: costCents } },
    });
  }
}
