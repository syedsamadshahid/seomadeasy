"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";

const STATUS_STEPS: Record<string, number> = {
  queued: 5,
  running: 50,
  done: 100,
  failed: 100,
};

type Props = { auditId: string; initialStatus: string };

export function AuditProgress({ auditId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const router = useRouter();

  useEffect(() => {
    if (status === "done" || status === "failed") return;
    const controller = new AbortController();

    const poll = async () => {
      try {
        const res = await fetch(`/api/audits/${auditId}`, { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        setStatus(data.status);
        if (data.status === "done" || data.status === "failed") {
          router.refresh();
        }
      } catch {
        // aborted or network error — retry on next interval
      }
    };

    poll();
    const id = setInterval(poll, 2500);
    return () => {
      clearInterval(id);
      controller.abort();
    };
  }, [auditId, status, router]);

  const progress = STATUS_STEPS[status] ?? 10;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Running audit…</h1>
      <p className="text-sm text-muted-foreground capitalize">Status: {status}</p>
      <Progress value={progress} className="h-2" />
      <p className="text-sm text-muted-foreground">
        {status === "queued" ? "Queued — starting soon" : "Auditing pages, checking AI visibility…"}
      </p>
    </div>
  );
}
