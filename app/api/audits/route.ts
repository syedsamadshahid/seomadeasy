import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { createAudit } from "@/lib/audit/create";
import { createComparison, ComparisonError } from "@/lib/audit/comparison";
import { inngest, auditRequested, comparisonRequested } from "@/inngest/client";
import { assertCanRunAudit, PlanLimitError } from "@/lib/plan/enforce";
import { domainSchema } from "@/lib/validation/domain";

const bodySchema = z.object({
  domain: domainSchema,
  // Optional per-audit competitor override; when present, runs a comparison.
  competitors: z.array(domainSchema).max(10).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { domain, competitors } = parsed.data;

  // Comparison flow: primary + one audit per competitor, grouped.
  if (competitors && competitors.length > 0) {
    try {
      const { groupId } = await createComparison(user.id, user.plan, domain, competitors);
      await inngest.send(comparisonRequested.create({ groupId }));
      return NextResponse.json({ groupId, comparison: true }, { status: 201 });
    } catch (err) {
      if (err instanceof ComparisonError) {
        return NextResponse.json({ error: err.message, upgrade: err.upgrade }, { status: err.code === "limit" ? 402 : 400 });
      }
      if (err instanceof PlanLimitError) {
        return NextResponse.json({ error: err.message, upgrade: true }, { status: 402 });
      }
      throw err;
    }
  }

  // Single-audit flow.
  try {
    await assertCanRunAudit(user.id, user.plan);
  } catch (err) {
    if (err instanceof PlanLimitError) {
      return NextResponse.json({ error: err.message, upgrade: true }, { status: 402 });
    }
    throw err;
  }

  const { auditId } = await createAudit(user.id, domain);

  await inngest.send(auditRequested.create({ auditId }));

  return NextResponse.json({ auditId }, { status: 201 });
}
