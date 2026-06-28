"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { getClientAuth } from "@/lib/auth/firebase-client";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { isFirebaseConfiguredClient } = await import("@/lib/auth/firebase-client");
      if (!isFirebaseConfiguredClient()) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      const credential = await createUserWithEmailAndPassword(getClientAuth(), email, password);
      await sendEmailVerification(credential.user);

      const idToken = await credential.user.getIdToken();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) throw new Error("Failed to create session");
      router.push("/verify-email");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-up failed";
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

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center p-1 bg-slate-100 rounded-lg w-fit">
        <Link
          href="/login"
          className="px-6 py-1.5 text-xs font-semibold rounded-md text-text-secondary hover:text-slate-800 transition-colors"
        >
          Log in
        </Link>
        <span className="px-6 py-1.5 text-xs font-bold rounded-md bg-white text-slate-800 shadow-sm">
          Sign up
        </span>
      </div>

      <header className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Create your account</h2>
        <p className="text-sm text-text-secondary">Start auditing your SEO &amp; AI visibility</p>
        <div className="mt-2 inline-flex items-center px-3 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-emerald-200">
          <span className="material-symbols-outlined text-[12px] mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
          Free — no credit card
        </div>
        {!isFirebaseConfigured && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
            <strong>Developer Fallback Mode Active:</strong> Firebase is not configured in .env. Click any button to bypass.
          </div>
        )}
      </header>

      {/* Social Auth */}
      <GoogleSignInButton label="Sign up with Google" />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-text-secondary font-semibold">Or continue with</span>
        </div>
      </div>

      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border-slate-200 focus:border-primary px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-bold text-slate-700 uppercase tracking-wider">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8+ characters"
            className="w-full border-slate-200 focus:border-primary px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive font-medium">{error}</p>
        )}

        <Button type="submit" className="w-full bg-primary hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg shadow-sm" disabled={isLoading}>
          {isLoading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
