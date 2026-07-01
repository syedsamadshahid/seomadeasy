"use client";

import { useState } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { getClientAuth } from "@/lib/auth/firebase-client";

export function SignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    setIsLoading(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      const { isFirebaseConfiguredClient } = await import("@/lib/auth/firebase-client");
      if (isFirebaseConfiguredClient()) {
        await signOut(getClientAuth());
        router.push("/login");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch {
      router.push("/");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isLoading}
      className="mt-2 w-full rounded text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {isLoading ? "Signing out…" : "Sign out"}
    </button>
  );
}
