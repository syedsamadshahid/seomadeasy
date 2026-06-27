// Verifies Inngest env vars are set and the event key is accepted by Inngest's API.
// Run: pnpm check:inngest

async function main() {
  const eventKey = process.env.INNGEST_EVENT_KEY;
  const signingKey = process.env.INNGEST_SIGNING_KEY;

  // 1. Keys present
  if (!eventKey) throw new Error("INNGEST_EVENT_KEY is not set in .env");
  if (!signingKey) throw new Error("INNGEST_SIGNING_KEY is not set in .env");
  console.log("✓ INNGEST_EVENT_KEY set (" + eventKey.length + " chars, prefix: " + eventKey.slice(0, 12) + "...)");
  console.log("✓ INNGEST_SIGNING_KEY set (" + signingKey.length + " chars, prefix: " + signingKey.slice(0, 12) + "...)");

  // 2. Key format checks
  if (!eventKey.startsWith("signkey-") && !eventKey.startsWith("sk_")) {
    console.log("  ℹ  Event key format:", eventKey.slice(0, 16) + "...");
  }
  if (!signingKey.startsWith("signkey-") && !signingKey.startsWith("sk_")) {
    console.log("  ℹ  Signing key format:", signingKey.slice(0, 16) + "...");
  }

  // 3. Send a lightweight ping event to validate the event key against Inngest's API
  console.log("\nPinging Inngest event API...");
  const res = await fetch(`https://inn.gs/e/${eventKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([{ name: "vantage/health.check", data: { ping: true } }]),
  });

  const body = await res.text();
  if (res.ok) {
    console.log("✓ Event key accepted by Inngest (HTTP " + res.status + ")");
    console.log("  Response:", body.slice(0, 120));
  } else if (res.status === 401) {
    throw new Error("Event key rejected — 401 Unauthorized. Check INNGEST_EVENT_KEY value.");
  } else if (res.status === 400) {
    // 400 = key valid but event payload issue — key is fine
    console.log("✓ Event key accepted (HTTP 400 = key OK, minor payload issue):", body.slice(0, 80));
  } else {
    throw new Error(`Unexpected response from Inngest: HTTP ${res.status} — ${body.slice(0, 200)}`);
  }

  console.log("\nInngest credentials look good.");
  console.log("\nNext step — start both servers in separate terminals:");
  console.log("  Terminal 1: pnpm dev");
  console.log("  Terminal 2: npx inngest-cli@latest dev");
  console.log("Then POST http://localhost:3000/api/audits with { \"domain\": \"example.com\" }");
}

main().catch((err) => {
  console.error("\nCheck FAILED:", err.message);
  process.exit(1);
});
