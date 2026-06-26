# Vantage — Product & Technical Specification

**Status:** v1.0 Final · **Type:** SEO + GEO Audit SaaS · **Target:** US SMBs

---

## 1. What Vantage Is

A single-input SEO + GEO audit platform. User enters a domain → system audits the site's top pages → returns on-page SEO, performance, broken links, backlinks, domain authority, keyword data, traffic estimates, **AI visibility (GEO)**, and AI-generated content optimizations.

**The wedge:** GEO — Generative Engine Optimization. Whether a brand surfaces in ChatGPT, Perplexity, Gemini, and Google AI Overviews. Incumbents (SEMrush, Ahrefs, Moz) don't have this. It's the one feature that can't be commoditized by reselling a keyword index.

**Strategy:** Lead with AI visibility as the headline product. Classic SEO audit is table-stakes context powered by licensed vendor data — no years spent building crawl infrastructure.

---

## 2. Goals & Non-Goals

**Goals**
- Single-input audit: enter a domain, get a complete report.
- Differentiated AI-visibility scoring that trends over time.
- Actionable content recommendations, not just metrics.
- Predictable per-audit cost via heavy caching.

**Non-Goals (v1)**
- Building a proprietary web crawl index or backlink graph (license instead).
- Real-time rank tracking at massive scale.
- Full competitor-suite parity with Ahrefs/SEMrush.
- A content management / publishing system.
- SimilarWeb demographics (defer — fixed cost).
- Public API access (defer — wrong phase).

---

## 3. Users & Use Cases

| Persona | Wants |
|---|---|
| SMB owner / marketer | "Is my site healthy, and do I show up in AI answers?" |
| SEO freelancer / agency | Fast client audits + white-label reports |
| Content/growth team | Concrete fixes and AI-optimized content drafts |
| Founder doing own marketing | Cheap, self-serve check without hiring an agency |

**Primary flow:** paste domain → scored report across all dimensions → act on prioritized recommendations → re-run later to see AI-visibility trend.

---

## 4. Feature Specification

### 4.1 On-page SEO audit — *build*
Crawl top pages: title tags, meta descriptions, H1–H6, image alt text, canonical tags, robots/meta-robots, schema.org, URL structure, internal linking, indexability, mobile-friendliness, duplicate content flags.
**Source:** DataForSEO On-Page API (primary) + Crawlee/Playwright (JS pages).

### 4.2 Performance — *build via hosted Lighthouse*
Core Web Vitals (LCP, CLS, INP), performance/accessibility/best-practices/SEO scores per page.
**Source:** Google PageSpeed Insights API (free).

### 4.3 Broken links — *build*
Internal + outbound links; 4xx/5xx, redirect chains, orphan pages.
**Source:** crawler + HTTP status checks.

### 4.4 Backlinks — *license*
Referring domains, total backlinks, anchor-text distribution, dofollow/nofollow, new/lost links, toxic signals.
**Source:** DataForSEO Backlinks API.

### 4.5 Domain authority — *license*
0–100 authority metric (vendor's domain rank) + page-level rank. Labeled as vendor metric, not Google's.
**Source:** DataForSEO.

### 4.6 Keyword research — *license + build*
Ranking keywords, volume, difficulty, CPC, SERP features, long-tail suggestions, keyword gaps. Continuous weekly rank tracking. LLM assists clustering + intent.
**Source:** DataForSEO + Gemini Flash (clustering/intent).

### 4.7 Traffic — *license (estimate) + OAuth (real)*
- **Estimated:** organic/paid estimates, labeled "estimated."
- **Real:** GA4 + Search Console via Google OAuth (read-only).
**Source:** DataForSEO (estimate) · GSC API (real).

### 4.8 AI Visibility (GEO) — *build* — **THE DIFFERENTIATOR**
Whether the brand appears in AI engine answers for category-relevant questions, with prominence and sentiment, tracked over time.
**Source:** OpenAI, Perplexity, Gemini APIs + Google AI Overviews (via DataForSEO SERP) + our parsing/scoring.

### 4.9 Content optimization — *build*
Prioritized fix list, rewritten titles/metas, content-gap outlines, GEO-oriented suggestions (answer-first structure, FAQ schema, entity clarity).
**Source:** Gemini Pro (Pro plan) / Claude Sonnet (Agency plan), grounded in audit data.

---

## 5. Data Sources & Integrations

| Integration | Provides | Auth | Cost |
|---|---|---|---|
| DataForSEO | Keywords, backlinks, domain rank, SERP, AI Overviews, traffic, on-page | HTTP Basic | Pay-per-call |
| Google PageSpeed | Lighthouse/CWV | API key | Free |
| Gemini (Google AI) | Parsing, clustering, content gen, GEO probe | API key | Per-token |
| Anthropic (Claude) | Agency content gen | API key | Per-token |
| OpenAI | ChatGPT GEO probe | API key | Per-token |
| Perplexity | Perplexity GEO probe | API key | Per-token + per-request |
| Google OAuth → GA4 + GSC | Real traffic | OAuth 2.0 read-only | Free |
| Stripe | Billing | API key | % of revenue |
| Firebase Auth | User auth | SDK | Free (50K MAU) |
| Firebase Storage | PDF report storage | SDK | Free (5GB) |

---

## 6. Pricing & Plans (FINAL)

| Feature | Free | Pro $99 | Agency $199 |
|---|---|---|---|
| Websites | 1 | 3 | 15 |
| Full audits/mo | 2 | Unlimited | Unlimited |
| Pages/audit cap | 3 | 50 | 150 |
| Pages pool/mo | 50 | 3,000 | 40,000 |
| Keywords tracked | 10 | 400 | 1,300 |
| AI engines | 1 | 3 | 4 |
| AI prompts/audit | 3 | 10 | 20 |
| GEO re-checks | — | Weekly | Weekly |
| Weekly full audit | — | — | Yes |
| Competitor tracking | — | — | Yes |
| GEO trend history | — | 3 months | 6 months |
| Content recs | — | Gemini Pro | Claude Sonnet |
| White-label PDF | — | Yes | Yes |
| CSV export | — | Yes | Yes |
| GSC connect | — | Yes (beta) | Yes |
| Shareable link | — | 30 days | Permanent |
| Scheduled reports | — | — | Yes |
| Multi-site dashboard | — | — | Yes |

**Cost/user:** Pro ~$17 (83% margin) · Agency ~$28 (86% margin)

**Price increase plan:** Raise Agency toward $249 after 30–50 paying users, grandfathering existing customers.

---

## 7. Positioning vs Competitors

| | SEMrush Pro $139 | SEMrush Guru $249 | Vantage Pro $99 | Vantage Agency $199 |
|---|---|---|---|---|
| Websites | 5 | 15 | 3 | 15 |
| Keywords | 500 | 1,500 | 400 | 1,300 |
| AI Visibility | No | No | Yes (3 engines) | Yes (4 engines) |
| Weekly GEO | No | No | Yes | Yes |
| White-label PDF | No | No | Yes | Yes |
| Price | $139.95 | $249.95 | $99 | $199 |

**Don't compete with SEMrush on crawl volume.** Own the GEO/AI visibility category. Target SMBs and small freelancers who can't justify $139+ but need AI visibility.

---

## 8. AI Model Strategy

| Task | Model | Reason |
|---|---|---|
| GEO response parsing | Gemini Flash 2.0 | ~100x cheaper than Haiku |
| Keyword clustering / intent | Gemini Flash 2.0 | Cheap, fast |
| ChatGPT GEO probe | GPT-4o mini | Cheap + accurate |
| Perplexity GEO probe | Perplexity Sonar | Best Perplexity coverage |
| Gemini GEO probe | Gemini Flash | Dual-use |
| Google AI Overviews | DataForSEO SERP | Only reliable source |
| Pro content recs | Gemini Pro 2.0 | Cost/quality balance |
| Agency content recs | Claude Sonnet 4.6 | Premium quality differentiator |

**Never use DeepSeek** — Chinese servers, US SMB trust/compliance killer.

---

## 9. Risks & Open Questions

- **Crowded market** — mitigated only by GEO wedge. Keep classic audit lean.
- **Vendor cost volatility** — caching + caps are the defense. Verify all pricing in sandbox.
- **AI engine instability** — keep probes behind one interface; version scoring so trends stay comparable.
- **Google OAuth verification** — sensitive-scope review takes weeks. Don't gate launch; ship estimates first.
- **AI Overview access** — confirm DataForSEO returns AI Overview content for target locales.
- **Estimate accuracy** — always label vendor traffic numbers as estimates.

**Launch locale:** US English only at launch.

---

## 10. Glossary

- **SEO** — Search Engine Optimization (ranking in classic search).
- **GEO** — Generative Engine Optimization; appearing in AI-generated answers. *(This product's wedge.)*
- **AI visibility** — whether/how prominently a brand appears in AI engine responses.
- **AI Overviews** — Google's AI-generated answer block above classic results.
- **Domain rank / authority** — vendor 0–100 metric (not an official Google score).
- **Core Web Vitals** — Google's UX metrics: LCP, CLS, INP.
- **SERP** — Search Engine Results Page.
- **GA4 / GSC** — Google Analytics 4 / Google Search Console.
