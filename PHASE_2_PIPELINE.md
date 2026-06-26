# Phase 2 — Audit Pipeline & Core Data

**Goal:** A working Inngest pipeline that takes a domain and produces on-page SEO, performance, broken links, backlinks, domain authority, and keyword data.

**Duration:** ~Week 2

---

## Why Second

This is the table-stakes SEO audit. It must work before we layer GEO on top. We get the pipeline skeleton and vendor integrations solid here.

---

## Tasks

### 2.1 Inngest Setup
- [ ] Install Inngest, configure `/api/inngest` endpoint (signed)
- [ ] Create the audit pipeline function skeleton with named steps
- [ ] Wire `POST /api/audits` → emits Inngest event → returns `auditId`
- [ ] Wire `GET /api/audits/:id` → returns status + assembled results (polled by dashboard)
- [ ] Each step writes its `AuditResult` row so partial progress persists

### 2.2 Vendor Client — DataForSEO
- [ ] Build `lib/clients/dataforseo.ts` wrapper (HTTP Basic auth)
- [ ] Cache-first: check Redis before every call
- [ ] Retry + exponential backoff on 429
- [ ] Log every call as a `UsageEvent`
- [ ] Endpoints: On-Page, Backlinks, Domain Rank, Keyword data, SERP

### 2.3 Pipeline Steps
- [ ] **Step 1 — Resolve pages:** get top pages for the domain (DataForSEO ranked pages)
- [ ] **Step 2 — On-page SEO:** DataForSEO On-Page API (titles, meta, H1-H6, schema, etc.)
- [ ] **Step 3 — Performance:** Google PageSpeed Insights API (free) — LCP, CLS, INP per page
- [ ] **Step 4 — Broken links:** crawler HTTP status checks
- [ ] **Step 5 — Backlinks:** DataForSEO Backlinks API
- [ ] **Step 6 — Domain authority:** DataForSEO domain rank
- [ ] **Step 7 — Keywords:** DataForSEO keyword data (volume, difficulty, CPC, SERP features)

### 2.4 Crawler Worker (Cloud Run)
- [ ] Set up Crawlee + Playwright worker
- [ ] Deploy to Cloud Run (containerized, scale-to-zero)
- [ ] Inngest triggers crawl; worker reports back
- [ ] Respect crawl etiquette (rate limit, identify crawler, honor robots)
- [ ] Enforce per-audit page cap (Free 3 / Pro 50 / Agency 150)

### 2.5 Cost Guards
- [ ] Per-audit hard cost ceiling (abort if exceeded)
- [ ] Pages-pool tracking per user per month
- [ ] Stop crawl when monthly pool exhausted

---

## Deliverable

Submit a domain via API, watch the Inngest pipeline run through steps 1–7, and see a complete classic SEO audit assembled in the database with per-category results.

---

## Exit Criteria

- [ ] Pipeline runs end-to-end for a real domain
- [ ] All 7 steps produce `AuditResult` rows
- [ ] Every paid call is cached and logged as `UsageEvent`
- [ ] Crawler runs on Cloud Run, respects page caps
- [ ] Cost ceiling aborts runaway jobs

---

## Cost Reminder

Run one real audit and sum the `UsageEvent` costs. Confirm classic audit is ~$0.10–0.15 per fresh audit. This validates the cost model before adding GEO.
