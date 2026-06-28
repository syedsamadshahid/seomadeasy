"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const PLAN_BENEFITS: Record<string, string[]> = {
  pro: [
    "3 websites",
    "Unlimited audits",
    "50 pages per audit · 3,000 pages/month",
    "400 keywords tracked",
    "3 AI engines (ChatGPT, Perplexity, Gemini)",
    "Weekly GEO re-checks",
    "CSV export + white-label PDF",
    "GSC connect (beta)",
  ],
  agency: [
    "15 websites",
    "Unlimited audits",
    "150 pages per audit · 40,000 pages/month",
    "1,300 keywords tracked",
    "All 4 AI engines",
    "Weekly full re-audits",
    "Competitor tracking",
    "Permanent shareable links",
    "White-label + custom colour",
  ],
};

type Props = {
  open: boolean;
  onClose: () => void;
  message: string;
  suggestedPlan?: "pro" | "agency";
};

export function UpgradePrompt({
  open,
  onClose,
  message,
  suggestedPlan = "pro",
}: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleUpgrade(plan: "pro" | "agency") {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setLoading(null);
    }
  }

  const benefits = PLAN_BENEFITS[suggestedPlan] ?? PLAN_BENEFITS.pro!;
  const price = suggestedPlan === "agency" ? "$199" : "$99";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade to unlock more</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-sm font-medium">
            {suggestedPlan === "agency" ? "Agency" : "Pro"} plan — {price}/mo
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-2">
                <span className="text-green-500 shrink-0">✓</span> {b}
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter>
          <Button
            onClick={() => handleUpgrade(suggestedPlan)}
            disabled={loading !== null}
          >
            {loading === suggestedPlan
              ? "Redirecting…"
              : `Upgrade to ${suggestedPlan === "agency" ? "Agency" : "Pro"}`}
          </Button>
          {suggestedPlan === "pro" && (
            <Button
              variant="outline"
              onClick={() => handleUpgrade("agency")}
              disabled={loading !== null}
            >
              {loading === "agency" ? "Redirecting…" : "Or go Agency — $199/mo"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
