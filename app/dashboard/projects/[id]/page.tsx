import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { prisma } from "@/lib/db";
import { getProjectTrends } from "@/lib/audit/trends";
import { planFeatures } from "@/lib/plan/features";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GeoTrendChart } from "@/components/charts/GeoTrendChart";
import { EngineBreakdownChart } from "@/components/charts/EngineBreakdownChart";
import { CompetitorFrequencyChart } from "@/components/charts/CompetitorFrequencyChart";
import { BrandingForm } from "@/components/reports/BrandingForm";
import { ScheduleForm } from "@/components/reports/ScheduleForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();
  const features = planFeatures(user.plan);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      audits: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          status: true,
          overallScore: true,
          createdAt: true,
          finishedAt: true,
          costCents: true,
        },
      },
      scheduledReports: { take: 1 },
    },
  });

  if (!project || project.userId !== user.id) notFound();

  const trends = await getProjectTrends(projectId, user.plan);

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-6 py-10">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {project.displayName ?? project.domain}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{project.domain}</p>
        </div>
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="sm">← Projects</Button>
        </Link>
      </header>

      {/* Trend charts */}
      {trends.trend.length > 1 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">AI Visibility Trends</h2>
          <GeoTrendChart data={trends.trend} />
          {features.canMultiSite && trends.perEngine.length > 0 && (
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <EngineBreakdownChart data={trends.perEngine} />
              {trends.competitors.length > 0 && (
                <CompetitorFrequencyChart data={trends.competitors} />
              )}
            </div>
          )}
        </section>
      )}

      <Separator />

      {/* Audit history */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Audit History</h2>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {project.audits.map((audit) => (
                <TableRow key={audit.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(audit.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        audit.status === "done"
                          ? "default"
                          : audit.status === "failed"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {audit.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{audit.overallScore ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    ${(audit.costCents / 100).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {audit.status === "done" && (
                      <Link href={`/dashboard/audits/${audit.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Branding settings */}
      {features.canWhiteLabel && (
        <>
          <Separator />
          <section>
            <h2 className="mb-4 text-lg font-semibold">White-label Branding</h2>
            <BrandingForm
              projectId={projectId}
              initialLogoUrl={project.brandLogoUrl ?? ""}
              initialColor={project.brandColor ?? "#2563eb"}
              canCustomColor={features.canCustomColor}
            />
          </section>
        </>
      )}

      {/* Schedule settings */}
      {features.canSchedule && (
        <>
          <Separator />
          <section>
            <h2 className="mb-4 text-lg font-semibold">Scheduled Reports</h2>
            <ScheduleForm
              projectId={projectId}
              initialCadence={
                (project.scheduledReports[0]?.cadence ?? "weekly") as "weekly" | "monthly"
              }
              initialEnabled={project.scheduledReports[0]?.enabled ?? false}
            />
          </section>
        </>
      )}
    </div>
  );
}
