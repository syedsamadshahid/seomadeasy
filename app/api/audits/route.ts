import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { createAudit } from "@/lib/audit/create";
import { inngest, auditRequested } from "@/inngest/client";

const bodySchema = z.object({
  domain: z
    .string()
    .min(1)
    .transform((v) => v.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, ""))
    .refine(
      (v) => /^[a-z0-9]([a-z0-9-]*\.)+[a-z]{2,}$/.test(v),
      { message: "Invalid domain" },
    ),
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

  const { domain } = parsed.data;
  const { auditId } = await createAudit(user.id, domain);

  await inngest.send(auditRequested.create({ auditId }));

  return NextResponse.json({ auditId }, { status: 201 });
}
