"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { sendEmailVerification } from "firebase/auth";
import { getClientAuth } from "@/lib/auth/firebase-client";

export default function VerifyEmailPage() {
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(true);

  useEffect(() => {
    import("@/lib/auth/firebase-client").then((m) => {
      setIsFirebaseConfigured(m.isFirebaseConfiguredClient());
    });
  }, []);

  async function handleResend() {
    if (!isFirebaseConfigured) {
      setResent(true);
      return;
    }
    if (!getClientAuth().currentUser) return;
    try {
      await sendEmailVerification(getClientAuth().currentUser!);
      setResent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend");
    }
  }

  return (
    <div className="rounded-xl border bg-card p-8 shadow-sm text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">Vantage</p>
      <div className="mt-6 text-4xl">✉️</div>
      <h1 className="mt-4 text-xl font-semibold tracking-tight">Verify your email</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We sent a verification link to your email address. Click the link to activate your account.
      </p>
      {!isFirebaseConfigured && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 text-left">
          <strong>Developer Fallback Mode Active:</strong> Firebase is not configured in .env. Click &quot;Sign in&quot; below to bypass directly to the dashboard.
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
      )}

      {resent ? (
        <p className="mt-4 text-sm text-emerald-600">Verification email resent!</p>
      ) : (
        <button
          type="button"
          onClick={handleResend}
          className="mt-4 text-sm font-medium text-foreground hover:underline"
        >
          Resend verification email
        </button>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Already verified?{" "}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
