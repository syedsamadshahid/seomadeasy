# Phase 6 — Scheduled Re-Audits, GSC & Cache Hardening

**Goal:** Automated weekly monitoring, real traffic via Google Search Console, and production-grade caching/cost control.

**Duration:** ~Week 5–6

---

## Why Here

The core product works and is usable. Now add the recurring value (weekly GEO monitoring), the real-traffic upgrade (GSC), and harden caching so unit economics hold at scale.

---

## Tasks

### 6.1 Scheduled GEO Re-Checks
- [ ] Inngest cron: weekly GEO probe for all saved projects (Pro + Agency)
- [ ] GEO-only re-run (cheap ~$0.05) — not a full audit
- [ ] Append new GeoRun rows → trend continues
- [ ] Notify user of significant changes (Resend email)

### 6.2 Scheduled Full Re-Audits (Agency)
- [ ] Inngest cron: weekly full audit for Agency saved sites
- [ ] Respect pages pool
- [ ] Append to history

### 6.3 Google Search Console (real traffic)
- [ ] `GET /api/integrations/google/start` — begin OAuth (read-only scopes)
- [ ] `GET /api/integrations/google/callback` — exchange code
- [ ] Encrypt refresh token (`lib/crypto`, AES-256-GCM with `TOKEN_ENCRYPTION_KEY`)
- [ ] Store in `GoogleConnection`
- [ ] Pull real organic traffic, queries, impressions, clicks
- [ ] **Never request write scopes. Never show a Google password form.**
- [ ] Submit Google OAuth app verification (sensitive scopes — takes weeks)
- [ ] Show "beta" badge until verified; estimates remain the default

### 6.4 Cache Hardening
- [ ] Confirm all TTLs (backlinks 7–30d, keywords 7d, SERP/AIO 24h, PageSpeed 24h, LLM by hash)
- [ ] Domain-level data shared across audits of same domain
- [ ] Measure cache hit rate — target 60%+ on repeat audits
- [ ] Per-vendor rate limiting in client wrappers

### 6.5 Cost Observability
- [ ] Dashboard of `UsageEvent` aggregates (internal/admin)
- [ ] Per-audit cost breakdown
- [ ] Alert if any audit exceeds cost ceiling

---

## Deliverable

Saved projects auto-refresh their AI visibility weekly. Site owners can connect Google for real traffic. Cache hit rate is measured and healthy.

---

## Exit Criteria

- [ ] Weekly GEO re-checks run via cron and extend trends
- [ ] Agency weekly full re-audits run
- [ ] GSC OAuth works; tokens encrypted; read-only scopes
- [ ] OAuth verification submitted to Google
- [ ] Cache hit rate measured at 60%+
- [ ] Cost observability dashboard works

---

## Critical

Do NOT block launch on Google OAuth verification. Ship with estimated traffic; GSC is a "beta" upgrade that activates once Google approves.
