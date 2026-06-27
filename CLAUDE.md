# CLAUDE.md — Vantage

Guidance for Claude Code when working in this repository.

---

## Project Overview

**Vantage** is an SEO + GEO (Generative Engine Optimization) audit SaaS for US SMBs. A user enters a domain; the system audits top pages and returns SEO health, performance, backlinks, keywords, traffic estimates, **AI visibility across ChatGPT/Perplexity/Gemini/Google AI Overviews**, and AI-generated content fixes.

**The differentiator is AI visibility (GEO).** Build everything else lean using licensed vendor data; invest engineering effort in the GEO layer.

Read `SPEC.md` for full product detail. Read the phase files (`PHASE_1_FOUNDATION.md` … `PHASE_8_PRICING_LAUNCH.md`, at the repo root) for the build sequence. Authentication and pricing/billing are intentionally the LAST phases — do not build them early.

---

## Current State

**Phase 2 (Audit + GEO Pipeline) is implemented** on top of the Phase 1 foundation. The core audit engine runs end-to-end behind the hardcoded dev user — Inngest durable pipeline, all vendor clients, the full GEO layer, content generators, and thin API routes are all in place. Auth and billing remain the last phases (7 and 8).

- Phase files live at the **repo root** (`PHASE_1_FOUNDATION.md` … `PHASE_8_PRICING_LAUNCH.md`), not in a `phases/` subfolder.
- Real secrets live in `.env` (gitignored); `.env.example` lists every key grouped by phase.
  - Phase 1: `DATABASE_URL`, `DIRECT_URL` (Neon), `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (Upstash).
  - Phase 2: `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`, `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`, `GOOGLE_PAGESPEED_API_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `PERPLEXITY_API_KEY`, `ANTHROPIC_API_KEY`.
- Local pipeline development requires `pnpm dev` **and** the Inngest dev server running alongside (`inngest-cli dev`).

---

## Commands

Package manager is **pnpm**.

| Task | Command |
|---|---|
| Dev server | `pnpm dev` |
| Production build | `pnpm build` |
| Lint | `pnpm lint` |
| Type-check | `pnpm typecheck` |
| DB migration (dev) | `pnpm db:migrate` |
| Seed the dev user | `pnpm db:seed` |
| Browse the database | `pnpm db:studio` |
| Regenerate Prisma client | `pnpm exec prisma generate` (also runs on `postinstall`) |
| Cache round-trip check | `pnpm check:cache` |
| Audit pipeline smoke test | `pnpm check:audit` |
| GEO pipeline end-to-end | `pnpm check:geo` (needs `GEMINI_API_KEY` or `USE_DEEPSEEK_TEST=true`) |
| Inngest key verification | `pnpm check:inngest` |

No test framework is chosen yet — add one when the first deterministic logic lands; the versioned GEO scoring (`lib/geo/score.ts`) is the natural first target.

---

## Tech Stack (do not deviate without discussion)

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Neon PostgreSQL + Prisma ORM (6.x) |
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
> **Test-only override (2026-06-27):** DeepSeek is temporarily permitted for local pipeline testing while real LLM keys are not yet set. Set `USE_DEEPSEEK_TEST=true` + `DEEPSEEK_API_KEY` in `.env` to route ALL LLM calls through DeepSeek (`lib/clients/deepseek.ts`). GEO scores produced under this flag are synthetic — DeepSeek is not a real visibility surface. This flag must be removed before production deployment.

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

## Phase 2 Implementation Map

### Pipeline (`inngest/functions/run-audit.ts`)

Triggered by the `auditRequested` event (`{ auditId }`). Durable `step.run()` stages in order:

`load` → `mark-running` → `resolve-pages` → `on-page` → `perf` → `links` → `authority` → `keywords` → `geo-prompts` → `geo-probe` → `geo-parse` → `content` → `finalize`

`assertUnderCeiling()` (from `lib/audit/cost.ts`) runs before every paid step; 401/403 errors are marked non-retryable.

### Vendor Clients (`lib/clients/`)

Every client follows the same contract: **cache-first** → call vendor → **log usage**.

- `withCache(key, ttlSeconds, fn)` checks Redis; `cacheKey(vendor, endpoint, params)` builds the key as `vendor:endpoint:sha256(params)`.
- After the vendor call, `logUsage()` writes a `UsageEvent` row and increments `audit.costCents`.
- `http.ts` → `fetchJson()` with 3-attempt exponential backoff (500ms → 1s → 2s), honours `Retry-After` on 429/5xx.
- `content.ts` → routes by plan: Agency → Claude Sonnet 4.6, Pro → Gemini Pro 2.0, Free → Gemini Flash.

### GEO Layer (`lib/geo/`)

`prompts.ts` → `probe.ts` → `parse.ts` → `score.ts`

- `probeEngine(engine, prompt, domain, ...)` is the single interface over all 4 engines.
- Engines gated by plan: Free = Gemini only; Pro = +ChatGPT +Perplexity; Agency = +Google AIO.
- Scoring versioned via `SCORING_VERSION` constant and `GeoRun.engineVersion` field — increment both when the formula changes to keep trends comparable.
- Score formula per run: mention(30) + citation(40) + prominence/10×20 + sentiment(±10), capped 0–100.

### Content (`lib/content/`)

`generateFixList` · `generateRewrites` · `generateGeoBrief` — all route through `lib/clients/content.ts`.

### Audit (`lib/audit/`)

`createAudit(userId, domain)` — upserts Project, creates Audit (queued).
`assembleResults(auditId, userId)` — returns full audit with all Pages, Keywords, AuditResults, GeoRuns.
`assertUnderCeiling()` — throws `NonRetriableError` if `audit.costCents ≥ 200` ($2.00 hard cap).

### API Routes (`app/api/`)

All handlers only enqueue or read — no business logic.

| Route | Methods |
|---|---|
| `/api/audits` | POST (create + enqueue), GET (list) |
| `/api/audits/[id]` | GET (full results, user-scoped) |
| `/api/projects` | GET, POST |
| `/api/projects/[id]` | GET, DELETE |
| `/api/projects/[id]/trends` | GET (GEO trend history) |
| `/api/inngest` | GET/POST/PUT (Inngest webhook) |

### Per-Plan Limits

| Limit | Free | Pro | Agency |
|---|---|---|---|
| Pages per audit | 3 | 50 | 150 |
| GEO prompts | 3 | 10 | 20 |
| GEO engines | Gemini | +ChatGPT, +Perplexity | +Google AIO |
| Content fixes | 5 | 10 | unlimited |
| Content rewrites | none | top 5 pages | all pages |
| Trends retention | 30 days | 90 days | 180 days |
| Cost ceiling | $2.00 / audit (200¢) | ← same | ← same |

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
- **GeoRun** — id, auditId, engine (`GeoEngine` enum: chatgpt|perplexity|gemini|google_aio), prompt, mentioned, cited, prominence, sentiment (`Sentiment` enum: positive|neutral|negative), competitorsNamed (JSONB), engineVersion (e.g. "v1"), createdAt
- **UsageEvent** — id, userId, auditId, vendor, endpoint, units, costCents

`Page` has a unique constraint on `(auditId, url)` to deduplicate crawl results.

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

Follow the `PHASE_*.md` files in sequence. Phases 1 and 2 are complete. **Authentication (Phase 7) and Pricing/Billing (Phase 8) are LAST.** Build and test the core audit + GEO engine first with a hardcoded dev user; wire auth and payments only once the product works.

---

## Coding Conventions

- TypeScript strict mode.
- Prefer named exports.
- Vendor clients return typed results; never leak raw API shapes into the UI.
- All external calls wrapped with retry + exponential backoff on 429.
- Errors logged with context; no silent failures in the pipeline.
- Keep components server-first; use client components only when needed.
