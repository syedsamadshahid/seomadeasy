import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { prisma } from "@/lib/db";
import { getProjectTrends } from "@/lib/audit/trends";

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

  const data = await getProjectTrends(projectId, user.plan);
  return NextResponse.json({ projectId, ...data });
}
