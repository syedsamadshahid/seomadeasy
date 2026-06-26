# Phase 5 — Dashboard, Reports & Exports

**Goal:** The user-facing product. A clean dashboard with the audit report, AI-visibility trend charts, white-label PDF, CSV export, and shareable links.

**Duration:** ~Week 4–5

---

## Why Here

The engine works; now make it usable and shareable. This is what the customer actually sees and pays for. White-label + GEO trend charts are key selling points.

---

## Tasks

### 5.1 Dashboard UI
- [ ] Project list (saved domains)
- [ ] `POST /api/projects` / `GET /api/projects` — manage saved domains
- [ ] Audit detail view with per-category sections (onpage, perf, links, authority, keywords, traffic, geo, content)
- [ ] Live audit progress (poll `GET /api/audits/:id` while running)
- [ ] Overall score + AI visibility score prominently displayed

### 5.2 AI Visibility Trend Charts
- [ ] Pull from `GET /api/projects/:id/trends`
- [ ] Line chart: GEO score over time (Recharts)
- [ ] Per-engine breakdown
- [ ] Competitor appearance frequency (Agency)
- [ ] Pro = 3 months, Agency = 6 months

### 5.3 White-Label PDF Export
- [ ] Generate branded PDF report (React-PDF — no headless browser needed)
- [ ] Custom logo + domain (Pro + Agency)
- [ ] Custom color (Agency)
- [ ] Store in Firebase Storage
- [ ] Present download link

### 5.4 CSV Export
- [ ] Export keywords, issues, GEO data as CSV
- [ ] Pro + Agency

### 5.5 Shareable Links
- [ ] Read-only report link
- [ ] Pro = 30-day expiry, Agency = permanent
- [ ] Scope to report; no auth required to view

### 5.6 Multi-Site Dashboard (Agency)
- [ ] Overview across all 15 sites
- [ ] Aggregate scores, recent audits, GEO trends per site

### 5.7 Scheduled Reports (Agency)
- [ ] Weekly/monthly PDF delivery
- [ ] Inngest cron triggers generation + email (Resend)

---

## Deliverable

A polished dashboard where a user runs an audit, watches it complete live, explores the full report, sees their AI-visibility trend, and exports a white-label PDF.

---

## Exit Criteria

- [ ] Dashboard renders full audit report cleanly
- [ ] Trend charts work with real GeoRun data
- [ ] White-label PDF generates with logo/domain
- [ ] CSV export works
- [ ] Shareable links work with correct expiry per plan
- [ ] Multi-site dashboard works for Agency

---

## Note

Plan-gating here is enforced with the hardcoded dev user's plan field. Real plan enforcement comes with billing in Phase 8 — but build the gates now so they're ready.
