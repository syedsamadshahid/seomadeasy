import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { prisma } from "@/lib/db";
import { ComparisonProgress } from "@/components/dashboard/ComparisonProgress";
import { ComparisonReport } from "@/components/dashboard/ComparisonReport";
import type { ComparisonResult } from "@/lib/audit/comparison-compute";

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const group = await prisma.comparisonGroup.findFirst({
    where: { id, project: { userId: user.id } },
    select: {
      id: true,
      status: true,
      resultPayload: true,
      audits: { select: { status: true } },
    },
  });

  if (!group) notFound();

  const total = group.audits.length;
  const completed = group.audits.filter((a) => a.status === "done" || a.status === "failed").length;

  const isReady = group.status === "done" && group.resultPayload !== null;

  return (
    <div className="p-8 bg-background min-h-full">
      <div className="max-w-[1200px] mx-auto">
        {isReady ? (
          <ComparisonReport result={group.resultPayload as unknown as ComparisonResult} />
        ) : (
          <ComparisonProgress
            groupId={group.id}
            initialStatus={group.status}
            initialCompleted={completed}
            total={total}
          />
        )}
      </div>
    </div>
  );
}
