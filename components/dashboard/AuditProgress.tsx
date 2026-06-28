"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STEPS = [
  { id: "fetch", label: "Fetching pages", icon: "travel_explore" },
  { id: "crawl", label: "Crawling content", icon: "manage_search" },
  { id: "analyze", label: "SEO analysis", icon: "analytics" },
  { id: "ai", label: "AI visibility check", icon: "auto_awesome" },
  { id: "done", label: "Generating report", icon: "description" },
] as const;

function deriveStepIndex(status: string, secondsElapsed: number): number {
  if (status === "done") return STEPS.length;
  if (status === "failed") return -1;
  if (status === "queued") return 0;
  // "running" — animate through steps based on elapsed time
  // rough pacing: each step ~30s, max at step 4 until done
  return Math.min(Math.floor(secondsElapsed / 30) + 1, STEPS.length - 1);
}

type Props = { auditId: string; initialStatus: string };

export function AuditProgress({ auditId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [startedAt] = useState(() => Date.now());
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const router = useRouter();

  // Tick elapsed time
  useEffect(() => {
    const id = setInterval(() => {
      setSecondsElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  // Poll audit status
  useEffect(() => {
    if (status === "done" || status === "failed") return;
    const controller = new AbortController();

    const poll = async () => {
      try {
        const res = await fetch(`/api/audits/${auditId}`, { signal: controller.signal });
        if (!res.ok) return;
        const data = (await res.json()) as { status: string };
        setStatus(data.status);
        if (data.status === "done" || data.status === "failed") {
          router.refresh();
        }
      } catch {
        // aborted or transient network error
      }
    };

    poll();
    const id = setInterval(poll, 2500);
    return () => {
      clearInterval(id);
      controller.abort();
    };
  }, [auditId, status, router]);

  const activeStep = deriveStepIndex(status, secondsElapsed);
  const isFailed = status === "failed";
  const isDone = status === "done";

  // Progress bar pct
  const progressPct = isDone
    ? 100
    : isFailed
    ? 0
    : Math.min(Math.round((activeStep / STEPS.length) * 100) + 5, 95);

  return (
    <div className="max-w-[620px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          {isFailed ? (
            <span className="material-symbols-outlined text-destructive text-2xl">error</span>
          ) : isDone ? (
            <span
              className="material-symbols-outlined text-emerald-600 text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          ) : (
            <span className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin inline-block" />
          )}
          <h1 className="text-2xl font-black text-on-background tracking-tight">
            {isFailed ? "Audit failed" : isDone ? "Audit complete" : "Audit in progress"}
          </h1>
        </div>
        <p className="text-sm text-text-secondary">
          {isFailed
            ? "Something went wrong during the audit. Please try again."
            : isDone
            ? "Your report is ready."
            : "This usually takes 60–120 seconds. You can close this tab."}
        </p>
      </div>

      {/* Progress bar */}
      {!isFailed && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">
              Progress
            </span>
            <span className="text-xs font-bold text-primary">{progressPct}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Stepper */}
      <div className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden mb-6">
        {STEPS.map((step, i) => {
          const done = i < activeStep;
          const active = i === activeStep && !isDone && !isFailed;
          return (
            <div
              key={step.id}
              className={[
                "flex items-center gap-4 px-6 py-4 transition-colors",
                active ? "bg-primary-light/60" : done ? "bg-white" : "bg-surface-alt/40",
              ].join(" ")}
            >
              {/* Status icon */}
              <div
                className={[
                  "size-8 rounded-full flex items-center justify-center flex-shrink-0",
                  done
                    ? "bg-emerald-100"
                    : active
                    ? "bg-primary-light"
                    : "bg-slate-100",
                ].join(" ")}
              >
                {done ? (
                  <span
                    className="material-symbols-outlined text-emerald-600 text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                ) : active ? (
                  <span className="size-3 rounded-full border-2 border-primary border-t-transparent animate-spin block" />
                ) : (
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">
                    {step.icon}
                  </span>
                )}
              </div>

              {/* Label */}
              <div className="flex-1">
                <p
                  className={[
                    "text-sm font-bold",
                    done ? "text-on-background" : active ? "text-primary" : "text-text-secondary",
                  ].join(" ")}
                >
                  {step.label}
                </p>
                {active && (
                  <p className="text-xs text-text-secondary mt-0.5 animate-pulse">
                    Running…
                  </p>
                )}
                {done && (
                  <p className="text-xs text-emerald-600 mt-0.5">Complete</p>
                )}
              </div>

              {/* Step number */}
              <span className="text-xs text-text-secondary font-mono">
                {i + 1}/{STEPS.length}
              </span>
            </div>
          );
        })}
      </div>

      {/* Log area — shows timing */}
      <div className="bg-slate-900 rounded-xl p-5 font-mono text-xs text-slate-300 space-y-1 min-h-[80px]">
        <p className="text-slate-500">// System log</p>
        {status === "queued" && <p><span className="text-cyan-400">→</span> Audit queued, waiting for worker…</p>}
        {status === "running" && activeStep >= 1 && (
          <p><span className="text-cyan-400">→</span> Crawling pages…</p>
        )}
        {status === "running" && activeStep >= 2 && (
          <p><span className="text-cyan-400">→</span> Running SEO checks…</p>
        )}
        {status === "running" && activeStep >= 3 && (
          <p><span className="text-cyan-400">→</span> Probing AI engines…</p>
        )}
        {status === "running" && activeStep >= 4 && (
          <p><span className="text-cyan-400">→</span> Generating content recommendations…</p>
        )}
        {isDone && <p><span className="text-emerald-400">✓</span> Report ready.</p>}
        {isFailed && <p><span className="text-red-400">✗</span> Audit failed. Check logs for details.</p>}
        {!isDone && !isFailed && (
          <p className="text-slate-500">Elapsed: {secondsElapsed}s</p>
        )}
      </div>

      {/* Actions */}
      {isFailed && (
        <div className="mt-6 flex justify-end">
          <Link
            href="/dashboard"
            className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-primary-container transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
