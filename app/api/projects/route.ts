import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/dev-user";

const CreateProjectSchema = z.object({
  domain: z
    .string()
    .min(1)
    .transform((v) => v.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase().trim())
    .refine((v) => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(v), "Invalid domain"),
  displayName: z.string().max(100).optional(),
});

export async function GET() {
  const user = await getCurrentUser();

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      audits: {
        where: { status: "done" },
        orderBy: { finishedAt: "desc" },
        take: 1,
        select: { id: true, overallScore: true, finishedAt: true, costCents: true },
      },
    },
  });

  return NextResponse.json(
    projects.map((p) => ({
      id: p.id,
      domain: p.domain,
      displayName: p.displayName,
      createdAt: p.createdAt,
      latestAudit: p.audits[0] ?? null,
    })),
  );
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const body = await req.json().catch(() => ({}));
  const parsed = CreateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { domain, displayName } = parsed.data;

  const project = await prisma.project.upsert({
    where: { userId_domain: { userId: user.id, domain } },
    create: { userId: user.id, domain, displayName: displayName ?? domain },
    update: { displayName: displayName ?? domain },
  });

  return NextResponse.json({ id: project.id, domain: project.domain, displayName: project.displayName }, { status: 201 });
}
