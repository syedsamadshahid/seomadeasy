# Phase 3 — AI Visibility (GEO) — THE DIFFERENTIATOR

**Goal:** The core feature. Probe AI engines, parse responses, score brand visibility 0–100, track competitors, and store trend data.

**Duration:** ~Week 3

---

## Why This Matters Most

This is the entire reason Vantage exists. SEMrush, Ahrefs, Moz don't have this. Every other feature is context that makes the GEO insights actionable. Spend the most engineering care here.

---

## Tasks

### 3.1 Prompt Generation
- [ ] From the domain + its keywords, generate category-relevant questions a user might ask an AI engine
- [ ] Use Gemini Flash to generate the prompt set
- [ ] Enforce per-plan prompt caps (Free 3 / Pro 10 / Agency 20)
- [ ] Store the generated prompts for reuse across re-checks

### 3.2 Engine Probe Layer (ONE interface)
- [ ] Build `lib/geo/probe.ts` — single interface, multiple engine backends
- [ ] **ChatGPT** — GPT-4o mini
- [ ] **Perplexity** — Perplexity Sonar
- [ ] **Gemini** — Gemini Flash 2.0
- [ ] **Google AI Overviews** — via DataForSEO SERP
- [ ] Per-plan engine count (Free 1 / Pro 3 / Agency 4)
- [ ] Cache probe results 24h; log every call as `UsageEvent`

### 3.3 Response Parsing (Gemini Flash)
- [ ] Build `lib/geo/parse.ts` using Gemini Flash (cheap, high volume)
- [ ] Extract per response:
  - Is the brand mentioned? (boolean)
  - Is it cited with a link? (boolean)
  - Prominence (position/emphasis in the answer)
  - Sentiment (positive/neutral/negative)
  - Which competitors appeared instead?
- [ ] Write a `GeoRun` row per engine per prompt

### 3.4 Scoring
- [ ] Build `lib/geo/score.ts` — weighted 0–100 score
- [ ] Weight by mention + citation + prominence across engines
- [ ] **Version the scoring algorithm** so trends stay comparable when models change
- [ ] Store `engineVersion` on each GeoRun

### 3.5 Competitor Tracking (Agency)
- [ ] Aggregate competitor names extracted across all prompts/engines
- [ ] Rank by frequency: "who appeared instead of you"
- [ ] Store as JSONB on GeoRun / aggregate view

### 3.6 Trend Data
- [ ] GeoRun rows power trend charts over time
- [ ] `GET /api/projects/:id/trends` returns AI-visibility history
- [ ] Pro = 3 months retention, Agency = 6 months

---

## Deliverable

Run an audit and get a complete AI visibility report: a 0–100 score, per-engine mention/citation/sentiment, a competitor list, and the data needed for a trend chart.

---

## Exit Criteria

- [ ] All 4 engines probe-able behind one interface
- [ ] Gemini Flash parses responses reliably
- [ ] Score is deterministic and versioned
- [ ] Competitor extraction works
- [ ] GeoRun rows stored for trends
- [ ] Per-plan engine + prompt caps enforced

---

## Cost Reminder

GEO probes scale fastest in cost. Confirm: Perplexity per-request fee is the main driver. Use base Sonar (not Sonar Pro). Sum `UsageEvent` after a full audit — target ~$0.14 added for GEO on a fresh audit.
