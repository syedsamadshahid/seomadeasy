// Dev user removed in Phase 7 — real users are created on first Firebase sign-in.
export {};

async function main() {
  console.log("Seed: nothing to seed (dev user removed in Phase 7).");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
