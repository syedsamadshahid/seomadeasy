"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

type Project = { id: string; domain: string; displayName: string | null };
type TrackedKw = { id: string; term: string; project: { domain: string } };

type Props = {
  projects: Project[];
  tracked: TrackedKw[];
};

export function TrackedKeywords({ projects, tracked }: Props) {
  const [term, setTerm] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!term.trim() || !projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, term: term.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to add keyword.");
        return;
      }
      setTerm("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, kw: string) {
    if (!confirm(`Remove "${kw}" from tracked keywords?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/keywords/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to remove keyword.");
        return;
      }
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-on-background uppercase tracking-wider">Tracked Keywords</h2>
          <p className="text-xs text-text-secondary mt-0.5">Pin keywords you want to monitor across audits.</p>
        </div>
        <span className="material-symbols-outlined text-primary text-xl opacity-60">bookmarks</span>
      </div>

      {/* Add form */}
      <div className="px-6 py-4 border-b border-border bg-surface-alt/40">
        {projects.length === 0 ? (
          <p className="text-sm text-text-secondary">
            Add a site first to start tracking keywords.{" "}
            <Link href="/dashboard/sites" className="text-primary font-semibold underline underline-offset-2">
              Go to My Sites
            </Link>
          </p>
        ) : (
          <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2">
            <Select value={projectId} onValueChange={(v) => setProjectId(v ?? "")}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.displayName ?? p.domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="e.g. best crm for law firms"
              className="w-64"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !term.trim()}>
              {loading ? "Adding…" : "Add keyword"}
            </Button>
          </form>
        )}
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      </div>

      {/* Tracked list */}
      {tracked.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-text-secondary">No tracked keywords yet. Add one above.</p>
        </div>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-alt border-b border-border">
              <th className="px-6 py-3 text-xs font-black text-text-secondary uppercase tracking-widest">Keyword</th>
              <th className="px-6 py-3 text-xs font-black text-text-secondary uppercase tracking-widest hidden sm:table-cell">Site</th>
              <th className="px-6 py-3 w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tracked.map((kw) => (
              <tr key={kw.id} className="hover:bg-surface-alt/50 transition-colors">
                <td className="px-6 py-3">
                  <span className="text-sm font-bold text-on-background font-mono">{kw.term}</span>
                </td>
                <td className="px-6 py-3 hidden sm:table-cell">
                  <span className="text-xs text-text-secondary">{kw.project.domain}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={deletingId === kw.id}
                    onClick={() => handleDelete(kw.id, kw.term)}
                    className="text-text-secondary hover:text-destructive"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {deletingId === kw.id ? "hourglass_empty" : "delete"}
                    </span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
