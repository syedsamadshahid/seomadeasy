import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { planFeatures } from "@/lib/plan/features";

export async function GET(
  _req: Request,
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

  const { trendDays } = planFeatures(user.plan);
  const since = new Date(Date.now() - trendDays * 24 * 60 * 60 * 1000);

  const audits = await prisma.audit.findMany({
    where: {
      projectId,
      status: "done",
      finishedAt: { gte: since },
    },
    orderBy: { finishedAt: "asc" },
    select: {
      id: true,
      finishedAt: true,
      overallScore: true,
      results: {
        where: { category: "geo" },
        select: { score: true, payload: true },
      },
    },
  });

  const trend = audits.map((a) => ({
    auditId: a.id,
    date: a.finishedAt,
    overallScore: a.overallScore,
    geoScore: a.results[0]?.score ?? null,
    geoPayload: a.results[0]?.payload ?? null,
  }));

  return NextResponse.json({ projectId, trend });
}
