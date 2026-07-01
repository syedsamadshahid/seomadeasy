"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  groupId: string;
  initialStatus: string;
  initialCompleted: number;
  total: number;
};

export function ComparisonProgress({ groupId, initialStatus, initialCompleted, total }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [completed, setCompleted] = useState(initialCompleted);
  const router = useRouter();

  useEffect(() => {
    if (status === "done" || status === "failed") return;
    const controller = new AbortController();

    const poll = async () => {
      try {
        const res = await fetch(`/api/comparisons/${groupId}`, { signal: controller.signal });
        if (!res.ok) return;
        const data = (await res.json()) as { status: string; completed: number };
        setStatus(data.status);
        setCompleted(data.completed);
        if (data.status === "done" || data.status === "failed") router.refresh();
      } catch {
        // aborted or transient error
      }
    };

    poll();
    const id = setInterval(poll, 3000);
    return () => {
      clearInterval(id);
      controller.abort();
    };
  }, [groupId, status, router]);

  const isFailed = status === "failed";
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="max-w-[620px] mx-auto">
      <div className="mb-8 flex items-center gap-3">
        {isFailed ? (
          <span className="material-symbols-outlined text-destructive text-2xl">error</span>
        ) : (
          <span className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin inline-block" />
        )}
        <h1 className="text-2xl font-black text-on-background tracking-tight">
          {isFailed ? "Comparison failed" : "Running comparison"}
        </h1>
      </div>

      <p className="text-sm text-text-secondary mb-6">
        {isFailed
          ? "Something went wrong while auditing the domains. Please try again."
          : `Auditing your site and ${total - 1} competitor${total - 1 === 1 ? "" : "s"} head-to-head. This can take a few minutes.`}
      </p>

      {!isFailed && (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">
              {completed} of {total} audits complete
            </span>
            <span className="text-xs font-bold text-primary">{pct}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
