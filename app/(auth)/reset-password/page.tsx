"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { getClientAuth } from "@/lib/auth/firebase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { isFirebaseConfiguredClient } = await import("@/lib/auth/firebase-client");
      if (!isFirebaseConfiguredClient()) {
        setSent(true);
        return;
      }
      await sendPasswordResetEmail(getClientAuth(), email);
      setSent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send reset email";
      setError(msg.replace("Firebase: ", "").replace(/ \(auth\/.*\)/, ""));
    } finally {
      setIsLoading(false);
    }
  }

  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(true);

  useEffect(() => {
    import("@/lib/auth/firebase-client").then((m) => {
      setIsFirebaseConfigured(m.isFirebaseConfiguredClient());
    });
  }, []);

  if (sent) {
    return (
      <div className="rounded-xl border bg-card p-8 shadow-sm text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Vantage</p>
        <div className="mt-6 text-4xl">✉️</div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a password reset link to <strong>{email}</strong>
        </p>
        {!isFirebaseConfigured && (
          <p className="mt-2 text-xs text-amber-600 bg-amber-50 rounded border border-amber-200 p-2">
            Note: Running in Developer Fallback mode. No email was actually sent.
          </p>
        )}
        <Link
          href="/login"
          className="mt-6 block text-sm font-medium text-foreground hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-8 shadow-sm">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Vantage</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Reset password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll send a reset link to your email
        </p>
        {!isFirebaseConfigured && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
            <strong>Developer Fallback Mode Active:</strong> Firebase is not configured in .env. Click submit to bypass.
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Remember your password?{" "}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
