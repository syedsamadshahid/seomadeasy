import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { planFeatures } from "@/lib/plan/features";
import { saveShareLink } from "@/lib/share/token";
import { prisma } from "@/lib/db";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: auditId } = await params;
  const user = await getCurrentUser();

  const features = planFeatures(user.plan);
  if (!features.canShare) {
    return NextResponse.json({ error: "Upgrade to Pro to share reports" }, { status: 403 });
  }

  // Verify user owns this audit
  const audit = await prisma.audit.findFirst({
    where: { id: auditId, project: { userId: user.id } },
    select: { id: true },
  });
  if (!audit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const expiresAt =
    features.shareExpiryDays != null
      ? new Date(Date.now() + features.shareExpiryDays * 24 * 60 * 60 * 1000)
      : null;

  const link = await saveShareLink(auditId, expiresAt);
  const url = `${APP_URL}/share/${link.token}`;

  return NextResponse.json({ token: link.token, url, expiresAt: link.expiresAt }, { status: 201 });
}
