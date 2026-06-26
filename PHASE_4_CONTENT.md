# Phase 4 — Content Optimization & Recommendations

**Goal:** Turn raw audit data into actionable fixes. Prioritized issue list, rewritten titles/metas, and GEO content briefs.

**Duration:** ~Week 3–4

---

## Why Here

Data alone isn't valuable — fixes are. This is what makes users act and what justifies the subscription. GEO-oriented content suggestions tie back to the differentiator.

---

## Tasks

### 4.1 Content Generation Layer
- [ ] Build `lib/clients/content.ts` with model routing:
  - **Pro plan → Gemini Pro 2.0** (cost/quality balance)
  - **Agency plan → Claude Sonnet 4.6** (premium quality)
- [ ] Cache generation by prompt hash (reuse identical inputs)
- [ ] Log every call as `UsageEvent`

### 4.2 Prioritized Fix List
- [ ] From assembled audit, generate top issues ranked by impact
- [ ] Pro = top 10 issues, Agency = full list
- [ ] Each fix: what's wrong, why it matters, how to fix

### 4.3 Title & Meta Rewrites
- [ ] AI-rewritten title suggestions per page
- [ ] AI-rewritten meta descriptions
- [ ] Agency: rewrites for all crawled pages; Pro: top pages

### 4.4 GEO Content Brief (the differentiated part)
- [ ] For pages where the brand is absent/weak in AI answers, generate:
  - Answer-first content structure
  - FAQ schema markup (actual code)
  - Entity clarity suggestions
  - Topical coverage gaps vs the competitors the engines cited
- [ ] Agency: full brief per site; Pro: basic suggestions

### 4.5 Content Gap Analysis (Agency)
- [ ] Keyword gaps vs top 3 competitors
- [ ] Content outlines for gap topics (3 per audit, Agency)

---

## Deliverable

After an audit completes, the user sees a prioritized, actionable fix list plus GEO-specific content recommendations grounded in their actual audit data.

---

## Exit Criteria

- [ ] Model routing works (Gemini Pro for Pro, Claude Sonnet for Agency)
- [ ] Fix list is prioritized and specific
- [ ] Title/meta rewrites generated
- [ ] GEO content brief produces real, usable suggestions including schema code
- [ ] Generation cached by prompt hash
- [ ] All calls logged as UsageEvent

---

## Cost Reminder

Content gen is the most expensive LLM call. Pro on Gemini Pro keeps it ~$0.80/audit; Agency on Claude Sonnet ~$2.40/audit. The Pro/Agency model split is itself a quality differentiator — keep it.
