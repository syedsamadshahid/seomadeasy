import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dev-user";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NewAuditForm } from "@/components/dashboard/NewAuditForm";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      audits: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, status: true, overallScore: true, finishedAt: true },
      },
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex items-end justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <NewAuditForm />
      </header>

      <div className="mt-8 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead>Latest Score</TableHead>
              <TableHead>Last Audit</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No projects yet. Run your first audit above.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((p) => {
                const latest = p.audits[0];
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/projects/${p.id}`} className="hover:underline">
                        {p.displayName ?? p.domain}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {latest?.overallScore != null ? (
                        <span className="text-lg font-semibold">{latest.overallScore}</span>
                      ) : (
                        <Badge variant="secondary">{latest?.status ?? "—"}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {latest?.finishedAt
                        ? new Date(latest.finishedAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/projects/${p.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
