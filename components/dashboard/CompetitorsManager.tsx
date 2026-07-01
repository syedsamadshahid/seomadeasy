"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Competitor = { id: string; domain: string };

type Props = {
  projectId: string;
  initial: Competitor[];
  maxCompetitors: number;
};

export function CompetitorsManager({ projectId, initial, maxCompetitors }: Props) {
  const [competitors, setCompetitors] = useState<Competitor[]>(initial);
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const atLimit = competitors.length >= maxCompetitors;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!domain.trim() || atLimit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/competitors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to add competitor.");
        return;
      }
      setCompetitors((prev) => [...prev, { id: data.id, domain: data.domain }]);
      setDomain("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, dom: string) {
    if (!confirm(`Remove "${dom}" from competitors?`)) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/competitors/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to remove competitor.");
        return;
      }
      setCompetitors((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add competitor domains to compare against in your next audit. Every audit you run will
        also audit these domains and produce a head-to-head report.{" "}
        <span className="font-medium text-foreground">
          {competitors.length} / {maxCompetitors} used
        </span>
      </p>

      <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2">
        <Input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="e.g. competitor.com"
          className="w-72"
          disabled={loading || atLimit}
        />
        <Button type="submit" disabled={loading || atLimit || !domain.trim()}>
          {loading ? "Adding…" : "Add competitor"}
        </Button>
        {atLimit && (
          <span className="text-xs text-muted-foreground">
            Plan limit reached — upgrade to add more.
          </span>
        )}
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {competitors.length > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competitor domain</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitors.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-sm">{c.domain}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === c.id}
                      onClick={() => handleDelete(c.id, c.domain)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      {deletingId === c.id ? "Removing…" : "Remove"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
