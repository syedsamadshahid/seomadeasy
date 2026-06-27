"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewAuditForm() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!domain.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      const { auditId } = await res.json();
      router.push(`/dashboard/audits/${auditId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
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
  );
}
