# CLAUDE.md — Vantage

Guidance for Claude Code when working in this repository.

---

## Project Overview

**Vantage** is an SEO + GEO (Generative Engine Optimization) audit SaaS for US SMBs. A user enters a domain; the system audits top pages and returns SEO health, performance, backlinks, keywords, traffic estimates, **AI visibility across ChatGPT/Perplexity/Gemini/Google AI Overviews**, and AI-generated content fixes.

**The differentiator is AI visibility (GEO).** Build everything else lean using licensed vendor data; invest engineering effort in the GEO layer.

Read `SPEC.md` for full product detail. Read the phase files (`PHASE_1_FOUNDATION.md` … `PHASE_8_PRICING_LAUNCH.md`, at the repo root) for the build sequence. Authentication and pricing/billing are intentionally the LAST phases — do not build them early.

---

## Current State (read first)

This repo is **documentation only** right now — these planning docs and nothing else. No `package.json`, no `node_modules`, **no git repository**, no application code.

- **Start at Phase 1** (`PHASE_1_FOUNDATION.md`). Its first task is `git init`; Critical Rule #1 forbids file changes without a working git repo, so initialize git before writing any code.
- Phase files live at the **repo root** (`PHASE_1_FOUNDATION.md` … `PHASE_8_PRICING_LAUNCH.md`), not in a `phases/` subfolder, despite references to "`phases/`" elsewhere.
- The Phase 1 scaffold (`npx create-next-app@latest`) establishes the toolchain and the commands below.

---

## Commands

None of these work yet — they arrive with the Phase 1 scaffold (`create-next-app`, Prisma, Inngest). After scaffolding:

| Task | Command |
|---|---|
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| Lint | `npm run lint` |
| DB migration (dev) | `npx prisma migrate dev` |
| Regenerate Prisma client | `npx prisma generate` |
| Browse the database | `npx prisma studio` |
| Inngest dev server | `npx inngest-cli@latest dev` |

Pick one package manager when you run `create-next-app` and stay consistent. No test framework is chosen yet — add one when the first deterministic logic lands; the versioned GEO scoring (Phase 3) is the natural first target.

---

## Tech Stack (do not deviate without discussion)

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Neon PostgreSQL + Prisma ORM |
| Cache | Upstash Redis |
| Job pipeline | Inngest (durable steps) |
| Crawler | Crawlee + Playwright on Cloud Run |
| AI — parsing | Gemini Flash 2.0 |
| AI — content (Pro) | Gemini Pro 2.0 |
| AI — content (Agency) | Claude Sonnet 4.6 |
| GEO probes | GPT-4o mini, Perplexity Sonar, Gemini Flash, Google AI Overviews (DataForSEO) |
| Data APIs | DataForSEO, Google PageSpeed |
| Auth | Firebase Auth (LAST phase) |
| Storage | Firebase Storage |
| Payments | Stripe (LAST phase) |
| Hosting | Vercel (app) + Cloud Run (crawler) |

**Never use DeepSeek** — US SMB market trust/compliance issue.
**Payments = Stripe, never Razorpay** — target market is US.

---

## Critical Rules

1. **Git first.** The repo must be initialized before any code is written. Commit frequently with clear messages. Never make file changes without a working git repo.
2. **Cache everything.** Every paid vendor/LLM call checks Redis first using key `vendor:endpoint:hash(params)`. This is a first-class concern, not an optimization.
3. **Log every paid call.** Write a `UsageEvent` row (vendor, endpoint, units, costCents) for every external paid call. Unit economics must be observable.
4. **Per-audit cost ceiling.** A hard cost cap aborts runaway jobs. Per-plan monthly audit/page caps enforced.
5. **Thin API routes.** Route handlers only enqueue or read. All logic lives in Inngest functions and `lib/`.
6. **Zod-validate all inputs.** Every API input validated; audit/result endpoints scoped to the owning user.
7. **Secrets server-side only.** Nothing secret in the client bundle.

---

## Architecture

```
Browser → Next.js (App Router)
            • marketing + dashboard UI
            • thin API routes (enqueue/read)
                  │ emits event
                  ▼
          Inngest — audit pipeline (durable steps)
          resolve pages → on-page → perf → links →
          authority → keywords → traffic → AI visibility →
          content → aggregate/score
                  │
        ┌─────────┼──────────┐
        ▼         ▼          ▼
   lib/clients  Crawler   Upstash Redis
   (vendors,    (Crawlee/  (cache +
    LLMs)       Playwright) rate limit)
        │
   external: DataForSEO, PageSpeed, Gemini,
   Anthropic, OpenAI, Perplexity, Google APIs
```

---

## Directory Convention

```
/app              Next.js App Router (UI + API routes)
/lib
  /clients        Vendor wrappers (DataForSEO, Gemini, Claude, OpenAI, Perplexity)
  /geo            AI visibility probing + scoring logic
  /cache          Redis cache helpers
  /crypto         Token encryption (AES-256-GCM)
/inngest          Durable pipeline functions
/prisma           schema.prisma + migrations
/components        shadcn/ui + custom UI
/crawler          Cloud Run worker (Crawlee + Playwright)
```

---

## Data Model (Prisma)

- **User** — id, firebaseUid, email, plan, stripeCustomerId, createdAt
- **Project** — id, userId, domain, displayName
- **GoogleConnection** — id, userId, encryptedRefreshToken, scopes, ga4PropertyId, gscSiteUrl
- **Audit** — id, projectId, status (queued|running|done|failed), startedAt, finishedAt, overallScore, costCents
- **AuditResult** — id, auditId, category (onpage|perf|links|authority|keywords|traffic|geo|content), score, payload (JSONB)
- **Page** — id, auditId, url, estTraffic, onPageIssues (JSONB), perf (JSONB)
- **Keyword** — id, auditId, term, volume, difficulty, cpc, position, intent, cluster
- **GeoRun** — id, auditId, engine, prompt, mentioned, cited, prominence, sentiment, competitorsNamed (JSONB), createdAt
- **UsageEvent** — id, userId, auditId, vendor, endpoint, units, costCents

---

## GEO Methodology (the core feature)

1. **Generate prompts** — category-relevant questions a user might ask an AI engine (e.g. "best CRM for small law firms").
2. **Probe engines** — send each prompt to ChatGPT, Perplexity, Gemini; pull Google AI Overviews via DataForSEO.
3. **Parse responses (Gemini Flash)** — extract: is the brand mentioned? cited with a link? how prominent? sentiment? which competitors appeared instead?
4. **Score 0–100** — weighted by mention, citation, prominence across engines.
5. **Recommend** — GEO fixes: answer-first structure, FAQ/schema markup, entity clarity, topical gaps vs cited competitors.

Keep all probes behind ONE interface. Version the scoring so trends remain comparable when model outputs change.

---

## Caching TTLs

| Data | TTL |
|---|---|
| Backlinks / domain rank | 7–30 days |
| Keyword volume | 7 days |
| SERP / AI Overview | 24 hours |
| PageSpeed | 24 hours |
| LLM generation | by prompt hash |

Domain-level data is shared across all audits of the same domain — cache aggressively.

---

## Build Order

Follow the `PHASE_*.md` files in sequence. **Authentication (Phase 7) and Pricing/Billing (Phase 8) are LAST.** Build and test the core audit + GEO engine first with a hardcoded dev user; wire auth and payments only once the product works.

---

## Coding Conventions

- TypeScript strict mode.
- Prefer named exports.
- Vendor clients return typed results; never leak raw API shapes into the UI.
- All external calls wrapped with retry + exponential backoff on 429.
- Errors logged with context; no silent failures in the pipeline.
- Keep components server-first; use client components only when needed.
