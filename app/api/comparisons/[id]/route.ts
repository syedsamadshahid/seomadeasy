import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const group = await prisma.comparisonGroup.findFirst({
    where: { id, project: { userId: user.id } },
    select: {
      id: true,
      status: true,
      primaryAuditId: true,
      resultPayload: true,
      audits: { select: { id: true, status: true } },
    },
  });

  if (!group) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const total = group.audits.length;
  const completed = group.audits.filter((a) => a.status === "done" || a.status === "failed").length;

  return NextResponse.json({
    groupId: group.id,
    status: group.status,
    primaryAuditId: group.primaryAuditId,
    total,
    completed,
    result: group.resultPayload ?? null,
  });
}
