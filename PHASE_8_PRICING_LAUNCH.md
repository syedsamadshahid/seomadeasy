# Phase 8 — Pricing, Billing & Launch (FINAL PHASE)

**Goal:** Wire Stripe, enforce real plan limits, verify cost-per-audit, and launch.

**Duration:** ~Week 7–8

---

## Why This Is Last (On Purpose)

Billing only matters once the product works AND has real users (Phase 7). Plan gates were already built into the UI in Phase 5 — now we connect them to real subscriptions and enforce limits. Launch happens at the end of this phase.

**Do not build this before authentication (Phase 7) is working.**

---

## Final Pricing (locked)

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
| GEO trend | — | 3 months | 6 months |
| Content recs | — | Gemini Pro | Claude Sonnet |
| White-label PDF | — | Yes | Yes |
| CSV export | — | Yes | Yes |
| GSC connect | — | Yes (beta) | Yes |
| Shareable link | — | 30 days | Permanent |

---

## Tasks

### 8.1 Stripe Setup
- [ ] Create Stripe account (US entity / target US customers)
- [ ] Create products + prices: Pro $99/mo, Agency $199/mo
- [ ] Install Stripe SDK
- [ ] **Use Stripe, NOT Razorpay** — target market is US
- [ ] Enable Stripe Tax for US sales tax handling

### 8.2 Checkout & Subscription
- [ ] Stripe Checkout for upgrade
- [ ] `POST /api/stripe/webhook` — signed, handles subscription lifecycle
- [ ] On subscription change → update `User.plan` + `User.stripeCustomerId`
- [ ] Customer portal for plan changes / cancellation
- [ ] Smart dunning for failed payments (Stripe handles)

### 8.3 Plan Enforcement
- [ ] Connect the Phase 5 plan gates to real `User.plan`
- [ ] Enforce: website count, pages pool, keywords tracked, AI engines, prompts, retention windows
- [ ] Hard block + upgrade prompt at limits (e.g. adding a 4th website on Pro → upsell Agency)
- [ ] Monthly pool reset via cron

### 8.4 Cost Verification (CRITICAL — before launch)
- [ ] Run 10 real end-to-end audits across plan tiers
- [ ] Sum `UsageEvent` costs per audit
- [ ] Confirm: Pro cost/user ~$17 (83% margin), Agency ~$28 (86% margin)
- [ ] Adjust caps if any tier's margin is below 80%

### 8.5 Landing Page & Marketing
- [ ] Marketing site: lead with AI visibility (GEO), not site count
- [ ] Pricing page with the table above
- [ ] Positioning copy vs SEMrush ("AI visibility they don't have, 3x cheaper")
- [ ] Waitlist → convert to signups

### 8.6 Launch
- [ ] Final QA pass
- [ ] Confirm Google OAuth verification status (GSC stays "beta" if pending)
- [ ] Soft launch to waitlist
- [ ] Public launch

---

## Deliverable

A fully monetized product: users subscribe via Stripe, plan limits are enforced, margins are verified at 80%+, and the product is live.

---

## Exit Criteria

- [ ] Stripe checkout + webhooks work
- [ ] All plan limits enforced against real subscriptions
- [ ] 10-audit cost verification done; margins confirmed 80%+
- [ ] Upgrade prompts fire at correct limits
- [ ] Landing + pricing pages live
- [ ] Product launched

---

## Post-Launch (not this phase)

- Raise Agency toward $249 after 30–50 paying users (grandfather existing)
- v2: SimilarWeb demographics (once Agency base supports the fixed cost)
- v2: Public API access
- v2: More locales beyond US English
