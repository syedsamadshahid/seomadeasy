# Vantage — Documentation Index

Complete build documentation for **Vantage**, an SEO + GEO audit SaaS for US SMBs.

---

## Read In This Order

1. **SPEC.md** — Full product & technical specification. Start here.
2. **CLAUDE.md** — Guidance for Claude Code. Place this at repo root.
3. **phases/** — Step-by-step build sequence (8 phases).

---

## Phase Sequence

| Phase | File | What | When |
|---|---|---|---|
| 1 | PHASE_1_FOUNDATION.md | Next.js + Neon + Prisma + Redis + dev user | Week 1 |
| 2 | PHASE_2_PIPELINE.md | Inngest audit pipeline + DataForSEO + crawler | Week 2 |
| 3 | PHASE_3_AI_VISIBILITY.md | **GEO — the differentiator** | Week 3 |
| 4 | PHASE_4_CONTENT.md | Content recommendations + GEO briefs | Week 3–4 |
| 5 | PHASE_5_DASHBOARD.md | Dashboard + reports + white-label PDF | Week 4–5 |
| 6 | PHASE_6_AUTOMATION_GSC.md | Scheduled re-audits + GSC + cache hardening | Week 5–6 |
| 7 | PHASE_7_AUTHENTICATION.md | Firebase Auth (replaces dev user) | Week 6–7 |
| 8 | PHASE_8_PRICING_LAUNCH.md | Stripe + plan enforcement + launch | Week 7–8 |

---

## Key Decisions (locked)

**Auth and Pricing are deliberately the LAST two phases.** The core audit + GEO engine is built and tested with a hardcoded dev user first. Auth and billing are plumbing — they get wired in once the product works.

**Tech:** Next.js + Firebase Auth + Neon + Prisma + Upstash + Inngest + Cloud Run + Stripe.

**AI models:** Gemini Flash (parsing), Gemini Pro (Pro content), Claude Sonnet (Agency content), GPT-4o mini + Perplexity + Gemini + Google AI Overviews (GEO probes). Never DeepSeek.

**Payments:** Stripe only (US market). Never Razorpay.

**Pricing:** Free / Pro $99 / Agency $199. Margins 83–86%.

---

## The 3 Unbreakable Rules

1. **Git on Day 1** — initialize the repo before writing any code.
2. **Cache everything** — every paid call checks Redis first.
3. **Don't block launch on Google OAuth** — ship with estimated traffic; GSC is a "beta" upgrade.

---

## The Wedge

Lead with **AI visibility (GEO)**. SEMrush, Ahrefs, and Moz don't have it. Everything else is table-stakes context. Don't compete on crawl volume — own the GEO category.
