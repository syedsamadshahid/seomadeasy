"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ExportMenu } from "@/components/reports/ExportMenu";
import { ShareDialog } from "@/components/reports/ShareDialog";
import type { PlanFeatures } from "@/lib/plan/features";

// Serializable subset of assembleResults return type
type AuditData = {
  id?: string;
  status: string;
  overallScore: number | null;
  finishedAt: Date | string | null;
  costCents: number;
  results: Array<{ category: string; score: number | null; payload: unknown }>;
  pages: Array<{
    url: string;
    estTraffic: number | null;
    onPageIssues: unknown;
    perf: unknown;
  }>;
  keywords: Array<{
    term: string;
    volume: number | null;
    difficulty: number | null;
    cpc: number | null;
    position: number | null;
    intent: string | null;
  }>;
  geoRuns: Array<{
    engine: string;
    prompt: string;
    mentioned: boolean;
    cited: boolean;
    prominence: number | null;
    sentiment: string | null;
    competitorsNamed: unknown;
  }>;
};

type Props = { audit: AuditData; features: PlanFeatures; auditId: string };

const CATEGORY_LABELS: Record<string, string> = {
  onpage: "On-Page SEO",
  perf: "Performance",
  links: "Backlinks",
  authority: "Domain Authority",
  keywords: "Keywords",
  traffic: "Traffic",
  geo: "AI Visibility",
  content: "Content",
};

export function AuditReport({ audit, features, auditId }: Props) {
  const geoResult = audit.results.find((r) => r.category === "geo");
  const geoScore = geoResult?.score ?? null;

  return (
    <div className="space-y-8">
      {/* Header + actions */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit Report</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {audit.finishedAt ? new Date(audit.finishedAt).toLocaleDateString() : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {features.canShare && <ShareDialog auditId={auditId} />}
          <ExportMenu auditId={auditId} features={features} />
        </div>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-4xl font-bold">{audit.overallScore ?? "–"}</div>
            <div className="mt-1 text-sm text-muted-foreground">Overall Score</div>
          </CardContent>
        </Card>
        <Card className="border-primary/30">
          <CardContent className="pt-6">
            <div className="text-4xl font-bold text-primary">{geoScore ?? "–"}</div>
            <div className="mt-1 text-sm text-muted-foreground">AI Visibility</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold">{audit.keywords.length}</div>
            <div className="mt-1 text-sm text-muted-foreground">Keywords</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold">{audit.pages.length}</div>
            <div className="mt-1 text-sm text-muted-foreground">Pages</div>
          </CardContent>
        </Card>
      </div>

      {/* Category results */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Category Scores</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {audit.results.map((r) => (
            <Card key={r.category}>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {CATEGORY_LABELS[r.category] ?? r.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{r.score ?? "–"}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* GEO detail */}
      {audit.geoRuns.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">AI Engine Visibility</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {audit.geoRuns.map((run, i) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium capitalize">
                      {run.engine.replace("_", " ")}
                    </span>
                    <div className="flex gap-1">
                      {run.mentioned && <Badge variant="secondary">Mentioned</Badge>}
                      {run.cited && <Badge>Cited</Badge>}
                      {run.sentiment && (
                        <Badge
                          variant={
                            run.sentiment === "positive"
                              ? "default"
                              : run.sentiment === "negative"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {run.sentiment}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{run.prompt}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Separator />

      {/* Keywords */}
      {audit.keywords.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Top Keywords</h2>
          <div className="overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  {["Keyword", "Volume", "Difficulty", "CPC", "Position", "Intent"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2 text-left font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {audit.keywords.slice(0, 20).map((kw, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{kw.term}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {kw.volume?.toLocaleString() ?? "–"}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{kw.difficulty ?? "–"}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {kw.cpc != null ? `$${kw.cpc.toFixed(2)}` : "–"}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{kw.position ?? "–"}</td>
                    <td className="px-4 py-2 capitalize text-muted-foreground">
                      {kw.intent ?? "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
