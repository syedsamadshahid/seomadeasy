import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { planFeatures } from "@/lib/plan/features";
import { prisma } from "@/lib/db";

const scheduleSchema = z.object({
  cadence: z.enum(["weekly", "monthly"]),
  enabled: z.boolean().default(true),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();

  const features = planFeatures(user.plan);
  if (!features.canSchedule) {
    return NextResponse.json({ error: "Upgrade to Agency to schedule reports" }, { status: 403 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });
  if (!project || project.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = scheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  // Upsert: one schedule per project — use findFirst + update/create pattern
  const existing = await prisma.scheduledReport.findFirst({ where: { projectId } });
  const schedule = existing
    ? await prisma.scheduledReport.update({
        where: { id: existing.id },
        data: { cadence: parsed.data.cadence, enabled: parsed.data.enabled },
      })
    : await prisma.scheduledReport.create({
        data: { projectId, cadence: parsed.data.cadence, enabled: parsed.data.enabled },
      });

  return NextResponse.json(schedule, { status: 201 });
}
