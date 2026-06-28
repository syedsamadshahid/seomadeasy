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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!domain.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim() }),
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
      const { auditId } = await res.json();
      onSuccess?.();
      router.push(`/dashboard/audits/${auditId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="example.com"
          className="w-48"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !domain.trim()}>
          {loading ? "Starting…" : "Run audit"}
        </Button>
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
