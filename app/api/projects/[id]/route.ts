import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/dev-user";

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
