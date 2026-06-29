import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/dev-user";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();

  const kw = await prisma.trackedKeyword.findUnique({
    where: { id },
    select: { project: { select: { userId: true } } },
  });

  if (!kw || kw.project.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.trackedKeyword.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
