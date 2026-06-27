import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/dev-user";

// ── PATCH helpers ──────────────────────────────────────────────

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function safeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

const patchSchema = z.object({
  displayName: z.string().max(100).optional(),
  brandLogoUrl: z
    .string()
    .optional()
    .nullable()
    .refine((v) => v == null || safeUrl(v), { message: "Logo must be a valid http/https URL" }),
  brandColor: z
    .string()
    .optional()
    .nullable()
    .refine((v) => v == null || HEX_COLOR.test(v), { message: "Color must be a 6-digit hex (#RRGGBB)" }),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project || project.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const audits = await prisma.audit.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      status: true,
      overallScore: true,
      costCents: true,
      startedAt: true,
      finishedAt: true,
    },
  });

  return NextResponse.json({
    id: project.id,
    domain: project.domain,
    displayName: project.displayName,
    createdAt: project.createdAt,
    audits,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { userId: true } });
  if (!project || project.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.project.delete({ where: { id: projectId } });
  return new NextResponse(null, { status: 204 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });
  if (!project || project.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}
