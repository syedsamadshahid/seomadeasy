import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/dev-user";

const CreateSchema = z.object({
  projectId: z.string().min(1),
  term: z.string().min(1).max(255).transform((v) => v.trim()),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const body = await req.json().catch(() => ({}));
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { projectId, term } = parsed.data;

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { userId: true } });
  if (!project || project.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const kw = await prisma.trackedKeyword.create({ data: { projectId, term } });
    return NextResponse.json(kw, { status: 201 });
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "Already tracking this keyword" }, { status: 409 });
    }
    throw err;
  }
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { userId: true } });
    if (!project || project.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const keywords = await prisma.trackedKeyword.findMany({
    where: projectId
      ? { projectId }
      : { project: { userId: user.id } },
    orderBy: { createdAt: "desc" },
    select: { id: true, term: true, projectId: true, createdAt: true, project: { select: { domain: true } } },
  });

  return NextResponse.json(keywords);
}
