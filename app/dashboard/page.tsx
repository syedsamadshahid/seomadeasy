import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { prisma } from "@/lib/db";
import { planFeatures } from "@/lib/plan/features";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewAuditForm } from "@/components/dashboard/NewAuditForm";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const features = planFeatures(user.plan);

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      audits: {
        where: { status: "done" },
        orderBy: { finishedAt: "desc" },
        take: 1,
        select: {
          id: true,
          overallScore: true,
          finishedAt: true,
          results: { where: { category: "geo" }, select: { score: true } },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {features.canMultiSite ? "All Sites" : "Overview"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground capitalize">
            {user.plan} plan · {user.email}
          </p>
        </div>
        <NewAuditForm />
      </header>

      {projects.length === 0 ? (
        <Card className="mt-8 border-dashed">
          <CardHeader><CardTitle>No projects yet</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Run your first audit to get started. Enter a domain above.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const latest = project.audits[0];
            const geoScore = latest?.results[0]?.score ?? null;
            return (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{project.displayName ?? project.domain}</CardTitle>
                    <p className="text-xs text-muted-foreground">{project.domain}</p>
                  </CardHeader>
                  <CardContent>
                    {latest ? (
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <div className="text-2xl font-bold">{latest.overallScore ?? "–"}</div>
                          <div className="text-xs text-muted-foreground">Overall</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">{geoScore ?? "–"}</div>
                          <div className="text-xs text-muted-foreground">AI Visibility</div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No audits yet</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
