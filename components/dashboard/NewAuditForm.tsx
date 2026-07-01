"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";

type Props = {
  onSuccess?: () => void;
};

export function NewAuditForm({ onSuccess }: Props = {}) {
  const [domain, setDomain] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [competitorInput, setCompetitorInput] = useState("");
  const [showCompetitors, setShowCompetitors] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);
  const router = useRouter();

  function addCompetitor() {
    const val = competitorInput.trim().toLowerCase();
    if (!val || competitors.includes(val)) {
      setCompetitorInput("");
      return;
    }
    setCompetitors((prev) => [...prev, val]);
    setCompetitorInput("");
  }

  function handleCompetitorKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addCompetitor();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!domain.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const body: { domain: string; competitors?: string[] } = { domain: domain.trim() };
      if (competitors.length > 0) body.competitors = competitors;

      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 402 && data.upgrade) {
          setUpgradeMsg(data.error ?? "You've reached your plan limit.");
          return;
        }
        setError(data.error ?? "Failed to start audit. Please try again.");
        return;
      }
      const data = await res.json();
      onSuccess?.();
      if (data.comparison && data.groupId) {
        router.push(`/dashboard/comparisons/${data.groupId}`);
      } else {
        router.push(`/dashboard/audits/${data.auditId}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            className="w-48"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !domain.trim()}>
            {loading ? "Starting…" : competitors.length > 0 ? "Run comparison" : "Run audit"}
          </Button>
          <button
            type="button"
            onClick={() => setShowCompetitors((v) => !v)}
            className="text-xs font-semibold text-primary hover:underline whitespace-nowrap"
          >
            {showCompetitors ? "Hide competitors" : "+ Compare competitors"}
          </button>
        </div>

        {showCompetitors && (
          <div className="rounded-lg border border-border bg-surface-alt/40 p-3 space-y-2">
            <p className="text-xs text-text-secondary">
              Add competitor domains to run a head-to-head comparison.
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={competitorInput}
                onChange={(e) => setCompetitorInput(e.target.value)}
                onKeyDown={handleCompetitorKey}
                placeholder="competitor.com"
                className="w-48"
                disabled={loading}
              />
              <Button type="button" variant="outline" size="sm" onClick={addCompetitor} disabled={!competitorInput.trim()}>
                Add
              </Button>
            </div>
            {competitors.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {competitors.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 text-xs font-medium bg-white border border-border rounded-full pl-2.5 pr-1 py-0.5"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => setCompetitors((prev) => prev.filter((x) => x !== c))}
                      className="text-text-secondary hover:text-destructive"
                      aria-label={`Remove ${c}`}
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </form>
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
      <UpgradePrompt
        open={upgradeMsg !== null}
        onClose={() => setUpgradeMsg(null)}
        message={upgradeMsg ?? ""}
      />
    </>
  );
}
