"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Plan } from "@prisma/client";

type Props = {
  currentPlan: Plan;
  hasSubscription: boolean;
};

export function UpgradeButtons({ currentPlan, hasSubscription }: Props) {
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

  async function handleManage() {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
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

  return (
    <div className="flex flex-wrap gap-3">
      {currentPlan === "free" && (
        <>
          <Button
            onClick={() => handleUpgrade("pro")}
            disabled={loading !== null}
          >
            {loading === "pro" ? "Redirecting…" : "Upgrade to Pro — $99/mo"}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleUpgrade("agency")}
            disabled={loading !== null}
          >
            {loading === "agency"
              ? "Redirecting…"
              : "Upgrade to Agency — $199/mo"}
          </Button>
        </>
      )}
      {currentPlan === "pro" && (
        <Button
          onClick={() => handleUpgrade("agency")}
          disabled={loading !== null}
        >
          {loading === "agency"
            ? "Redirecting…"
            : "Upgrade to Agency — $199/mo"}
        </Button>
      )}
      {hasSubscription && (
        <Button
          variant="outline"
          onClick={handleManage}
          disabled={loading !== null}
        >
          {loading === "portal" ? "Redirecting…" : "Manage subscription"}
        </Button>
      )}
    </div>
  );
}
