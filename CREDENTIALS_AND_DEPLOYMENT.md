# Vantage — Credentials & Deployment Guide

Everything you need to go from local dev to a live production deployment.

---

## Table of Contents

1. [Minimum to run locally with real data](#1-minimum-to-run-locally-with-real-data)
2. [Full credential reference](#2-full-credential-reference)
   - [Database — Neon Postgres](#21-database--neon-postgres)
   - [Cache — Upstash Redis](#22-cache--upstash-redis)
   - [Job pipeline — Inngest](#23-job-pipeline--inngest)
   - [Vendor data APIs](#24-vendor-data-apis)
   - [LLMs](#25-llms)
   - [Email — Resend](#26-email--resend)
   - [Google OAuth (Search Console)](#27-google-oauth--search-console-integration)
   - [Auth — Firebase](#28-auth--firebase)
   - [Payments — Stripe](#29-payments--stripe)
3. [Deployment to Vercel](#3-deployment-to-vercel)
4. [Post-deploy checklist](#4-post-deploy-checklist)
5. [Quick-start for just the audit pipeline](#5-quick-start-for-just-the-audit-pipeline)
6. [Generating secret keys locally](#6-generating-secret-keys-locally)

---

## 1. Minimum to run locally with real data

These are the variables you **must** fill in before the audit pipeline produces real results.
Auth (Firebase) and Payments (Stripe) can be skipped at this stage — the app falls back to a
hardcoded dev user automatically when Firebase vars are absent.

```
DATABASE_URL=
DIRECT_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=
GOOGLE_PAGESPEED_API_KEY=
GEMINI_API_KEY=
OPENAI_API_KEY=
PERPLEXITY_API_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Start the app + Inngest dev server side-by-side:

```bash
pnpm dev
# in a second terminal:
npx inngest-cli@latest dev
```

---

## 2. Full Credential Reference

---

### 2.1 Database — Neon Postgres

**Service:** https://neon.tech  
**Pricing:** Free tier (0.5 GB storage, 1 compute unit) — sufficient for development and small-scale launch.  
**Paid tier needed when:** > 0.5 GB data or you need auto-scaling, connection pooling above 100.

#### How to obtain

1. Sign up / log in at neon.tech.
2. Click **New Project** → choose a region close to your Vercel deployment region (e.g. `us-east-1`).
3. After creation, go to **Connection Details**.
4. Copy the **Pooled connection string** — this is `DATABASE_URL`. The host will contain `-pooler`.
5. Copy the **Direct connection string** — this is `DIRECT_URL`. Same host but without `-pooler`.

```env
# Pooled — used by the running app at request time
DATABASE_URL=postgresql://username:password@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require

# Direct — used by Prisma Migrate and prisma studio
DIRECT_URL=postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

#### After setting these

Run the database migration and seed the dev user:

```bash
pnpm db:migrate
pnpm db:seed
```

---

### 2.2 Cache — Upstash Redis

**Service:** https://upstash.com  
**Pricing:** Free tier (10,000 commands/day) — sufficient for development. Upgrade to Pay-As-You-Go (~$0.20 per 100K commands) for production.

#### How to obtain

1. Sign up at upstash.com.
2. Click **Create Database** → select **Redis** → choose a region matching your Neon region.
3. After creation, go to the database dashboard.
4. Under **REST API**, copy **UPSTASH_REDIS_REST_URL** and **UPSTASH_REDIS_REST_TOKEN**.

```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### What it's used for

Every paid vendor/LLM call is cached here first (cache-first pattern). TTLs:
- Backlinks / domain rank: 7–30 days
- Keyword volume: 7 days
- SERP / AI Overviews: 24 hours
- PageSpeed: 24 hours
- LLM generations: keyed by prompt hash (permanent until invalidated)

---

### 2.3 Job Pipeline — Inngest

**Service:** https://inngest.com  
**Pricing:** Free tier (50,000 runs/month). Pay-as-you-go above that.

Inngest runs the durable audit pipeline (the 13-step Inngest function in `inngest/functions/run-audit.ts`).
Without it, submitting an audit domain does nothing.

#### How to obtain

1. Sign up at inngest.com.
2. Create a new app (name it "vantage" or similar).
3. Go to **Manage → Event Keys** → copy the **Event Key**.
4. Go to **Manage → Signing Keys** → copy the **Signing Key**.

```env
INNGEST_EVENT_KEY=evt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
INNGEST_SIGNING_KEY=signkey-prod-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Local dev

Run the Inngest dev server alongside `pnpm dev`. It discovers your local Inngest functions automatically:

```bash
npx inngest-cli@latest dev
# opens http://localhost:8288 — you can replay events here
```

#### Production (Vercel)

In the Inngest dashboard, under your app, add a **Sync URL**:
```
https://yourdomain.com/api/inngest
```
Inngest will POST events to this endpoint and your Vercel function handles them.

---

### 2.4 Vendor Data APIs

#### DataForSEO

**Service:** https://dataforseo.com  
**Pricing:** Pay-per-use. A typical audit costs $0.01–$0.10 depending on pages + keyword lookups.
New accounts get $1 free credit.

Used for: keyword data, backlinks, SERP results, Google AI Overviews (GEO probe).

1. Sign up at dataforseo.com.
2. Your login email IS the `DATAFORSEO_LOGIN`.
3. Your account password IS the `DATAFORSEO_PASSWORD`.

```env
DATAFORSEO_LOGIN=you@youremail.com
DATAFORSEO_PASSWORD=yourpassword
```

> These are sent as HTTP Basic auth on each API call — they are server-side only and never reach the client bundle.

#### Google PageSpeed API

**Service:** https://console.cloud.google.com  
**Pricing:** Free (25,000 queries/day quota).

1. Go to console.cloud.google.com.
2. Create or select a project.
3. Search for **PageSpeed Insights API** → Enable it.
4. Go to **APIs & Services → Credentials → Create Credentials → API Key**.
5. (Optional but recommended) Restrict the key to the PageSpeed Insights API.

```env
GOOGLE_PAGESPEED_API_KEY=AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

### 2.5 LLMs

All four LLMs are needed for the full GEO audit. They are gated by plan:
- **Free plan:** Gemini only.
- **Pro plan:** Gemini + ChatGPT + Perplexity.
- **Agency plan:** All four (adds Google AI Overviews via DataForSEO).

#### Gemini (Google AI Studio)

**Service:** https://aistudio.google.com  
**Pricing:** Gemini Flash 2.0 is very cheap (~$0.075/M input tokens). Gemini Pro 2.0 is ~$1.25/M.

1. Go to aistudio.google.com → Sign in.
2. Click **Get API key → Create API key**.

```env
GEMINI_API_KEY=AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Used for: GEO probing (Free/Pro/Agency), parsing LLM responses, content generation (Pro plan).

#### OpenAI (GPT-4o mini)

**Service:** https://platform.openai.com  
**Pricing:** GPT-4o mini is ~$0.15/M input tokens. Very cheap per audit.

1. Go to platform.openai.com → Sign in.
2. Go to **API Keys → Create new secret key**.

```env
OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Used for: GEO probing (Pro + Agency plans).

#### Perplexity

**Service:** https://www.perplexity.ai/api  
**Pricing:** Pay-as-you-go. Sonar model (online search) is ~$1/M tokens.

1. Go to perplexity.ai/api → Sign in.
2. Go to **API → API Keys → Generate**.

```env
PERPLEXITY_API_KEY=pplx-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Used for: GEO probing (Pro + Agency plans).

#### Anthropic (Claude Sonnet 4.6)

**Service:** https://console.anthropic.com  
**Pricing:** Claude Sonnet 4.6 is ~$3/M input tokens.

1. Go to console.anthropic.com → Sign in.
2. Go to **API Keys → Create Key**.

```env
ANTHROPIC_API_KEY=sk-ant-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Used for: Content generation (Agency plan only).

---

### 2.6 Email — Resend

**Service:** https://resend.com  
**Pricing:** Free tier (3,000 emails/month, 100/day). Paid from $20/month.

Used for: sending audit completion emails and PDF report emails.

1. Sign up at resend.com.
2. Go to **API Keys → Create API Key** (with full access or Sending access only).
3. Go to **Domains → Add Domain** → verify your sending domain via DNS records.
   - If you don't have a custom domain yet, you can temporarily use `onboarding@resend.dev` but this only works in test mode.

```env
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
RESEND_FROM_EMAIL=reports@yourdomain.com
```

---

### 2.7 Google OAuth — Search Console Integration

**Service:** https://console.cloud.google.com  
**Pricing:** Free.

Used for: connecting a user's Google Search Console so the dashboard can pull real GSC data (impressions, clicks, positions).

#### How to obtain

1. Go to console.cloud.google.com → same project you used for PageSpeed.
2. Go to **APIs & Services → Enabled APIs** → enable:
   - **Google Search Console API**
   - **Google Analytics Data API** (optional, for GA4 integration)
3. Go to **APIs & Services → OAuth consent screen**:
   - User type: **External**
   - App name: Vantage
   - Add scopes: `https://www.googleapis.com/auth/webmasters.readonly`
4. Go to **Credentials → Create Credentials → OAuth 2.0 Client ID**:
   - Application type: **Web application**
   - Authorised redirect URIs: `http://localhost:3000/api/integrations/google/callback` (local) and `https://yourdomain.com/api/integrations/google/callback` (production).
5. Copy **Client ID** and **Client Secret**.

#### Token encryption key

OAuth refresh tokens are stored encrypted in the database using AES-256-GCM (`lib/crypto`).
Generate a 32-byte key:

```bash
# in terminal
openssl rand -hex 32
```

```env
TOKEN_ENCRYPTION_KEY=64-character-hex-string-from-openssl-rand-hex-32
GOOGLE_OAUTH_CLIENT_ID=XXXXXXXXXXXX-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/integrations/google/callback
```

> For production, change `GOOGLE_OAUTH_REDIRECT_URI` to `https://yourdomain.com/api/integrations/google/callback`.

---

### 2.8 Auth — Firebase

**Service:** https://firebase.google.com (Google Firebase Console)  
**Pricing:** Free Spark plan handles thousands of MAUs. Blaze (pay-as-you-go) needed for Cloud Functions/Storage at scale.

#### Firebase project setup

1. Go to console.firebase.google.com → **Add project**.
2. Project name: `vantage` (or similar).
3. Disable Google Analytics if you don't need it (simplifies setup).

#### Enable Authentication

4. In the Firebase Console, go to **Authentication → Sign-in method**.
5. Enable **Email/Password**.
6. Enable **Google** (requires OAuth consent screen in Google Cloud — same project as above).

#### Admin SDK (server-side, secret)

7. Go to **Project Settings → Service accounts**.
8. Click **Generate new private key** → downloads a JSON file.
9. Extract values from the JSON:

```env
FIREBASE_PROJECT_ID=vantage-xxxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@vantage-xxxxx.iam.gserviceaccount.com
# The private key has literal \n characters — keep them as-is in .env, or wrap in quotes.
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXXXXX...\n-----END PRIVATE KEY-----\n"
```

> On Vercel, paste the full private key value with literal newlines — Vercel handles it correctly.

#### Client SDK (public, safe to expose)

10. Go to **Project Settings → General → Your apps → Add app → Web (</>)**.
11. Register the app (name: "Vantage Web").
12. Copy the `firebaseConfig` object values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=vantage-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=vantage-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=vantage-xxxxx.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxxxxxxxxxxxxxxxx
```

#### Authorized domains

13. In Firebase Console → **Authentication → Settings → Authorized domains**, add your production domain (e.g. `vantage.yourdomain.com`).

---

### 2.9 Payments — Stripe

**Service:** https://dashboard.stripe.com  
**Pricing:** 2.9% + 30¢ per successful card charge. No monthly fee.

#### Test vs Live keys

Use **test keys** (`sk_test_...`, `pk_test_...`) while developing and **live keys** (`sk_live_...`, `pk_live_...`) for production. They are separate and do not share data.

#### How to obtain

1. Sign up / log in at dashboard.stripe.com.
2. Go to **Developers → API Keys**:
   - `STRIPE_SECRET_KEY` = Secret key (`sk_live_...` or `sk_test_...`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = Publishable key (`pk_live_...` or `pk_test_...`)

#### Create products and prices

3. Go to **Product Catalog → Add Product**:
   - Create **Vantage Pro** — set recurring price (e.g. $49/month). Copy the Price ID (`price_...`).
   - Create **Vantage Agency** — set recurring price (e.g. $149/month). Copy the Price ID.

```env
STRIPE_PRICE_PRO=price_XXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_PRICE_AGENCY=price_XXXXXXXXXXXXXXXXXXXXXXXX
```

#### Webhook secret

4. Go to **Developers → Webhooks → Add endpoint**:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
5. After creating, click **Reveal signing secret**. Copy it.

```env
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
```

#### Local webhook testing

Use the Stripe CLI to forward webhook events to your local server:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# it prints a webhook signing secret — use that as STRIPE_WEBHOOK_SECRET for local dev
```

---

## 3. Deployment to Vercel

### Step 1 — Push to GitHub

```bash
git push origin main
```

### Step 2 — Import project in Vercel

1. Go to vercel.com → **Add New Project → Import Git Repository**.
2. Select your repo.
3. Framework preset: **Next.js** (auto-detected).
4. Root directory: leave blank (project root).

### Step 3 — Set environment variables

In Vercel → Project Settings → **Environment Variables**, add every variable from the full list.
Key differences from local `.env`:

```env
# Update these two for production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
GOOGLE_OAUTH_REDIRECT_URI=https://yourdomain.com/api/integrations/google/callback
```

For `FIREBASE_PRIVATE_KEY`, paste the full key value with real newlines — Vercel handles multiline values correctly in the UI.

### Step 4 — Set up Inngest sync

After first deploy, go to the Inngest dashboard → your app → **Sync URL**:
```
https://yourdomain.com/api/inngest
```

### Step 5 — Run database migration on production

Use Neon's direct connection (no pooling) for migrations:

```bash
# Set DATABASE_URL to the DIRECT_URL value temporarily, then:
pnpm db:migrate
```

Or connect via Vercel's deploy hook or a one-off migration script.

### Step 6 — Add Stripe webhook endpoint

Stripe Dashboard → Developers → Webhooks:
```
https://yourdomain.com/api/stripe/webhook
```
Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

### Step 7 — Add Firebase authorized domain

Firebase Console → Authentication → Settings → Authorized domains → Add `yourdomain.com`.

---

## 4. Post-Deploy Checklist

- [ ] `pnpm db:migrate` run against production Neon database
- [ ] All env vars set in Vercel (use Preview + Production environments)
- [ ] Inngest sync URL registered and shows as active
- [ ] Stripe webhook endpoint added, signing secret in env vars
- [ ] Firebase authorized domain includes production domain
- [ ] Google OAuth redirect URI includes production URL
- [ ] Test a full audit end-to-end (submit domain → watch Inngest dashboard → check results)
- [ ] Verify Stripe test checkout completes and plan upgrades in DB
- [ ] Check `/api/admin/costs` for usage tracking (or `pnpm check:costs`)

---

## 5. Quick-Start for Just the Audit Pipeline

If you want real audits **without** auth or payments (dev user only):

```env
# .env — minimum viable set for real audit data
DATABASE_URL=             # from Neon
DIRECT_URL=               # from Neon
UPSTASH_REDIS_REST_URL=   # from Upstash
UPSTASH_REDIS_REST_TOKEN= # from Upstash
INNGEST_EVENT_KEY=        # from Inngest
INNGEST_SIGNING_KEY=      # from Inngest
DATAFORSEO_LOGIN=         # your dataforseo.com email
DATAFORSEO_PASSWORD=      # your dataforseo.com password
GOOGLE_PAGESPEED_API_KEY= # from Google Cloud Console
GEMINI_API_KEY=           # from Google AI Studio (free tier)
OPENAI_API_KEY=           # from OpenAI
PERPLEXITY_API_KEY=       # from Perplexity
ANTHROPIC_API_KEY=        # from Anthropic Console
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Then:

```bash
pnpm db:migrate && pnpm db:seed
pnpm dev
# second terminal:
npx inngest-cli@latest dev
```

Submit any domain via the dashboard. Watch the pipeline run at `http://localhost:8288`.

---

## 6. Generating Secret Keys Locally

```bash
# TOKEN_ENCRYPTION_KEY (32-byte AES-256 key)
openssl rand -hex 32

# Or with Node.js if openssl is not available
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Cost Estimate per Audit (Agency plan)

| Service | Est. cost |
|---|---|
| DataForSEO (keywords + backlinks + SERP) | $0.05–$0.15 |
| Google PageSpeed | Free |
| Gemini Flash (GEO probes + parsing) | $0.01–$0.03 |
| GPT-4o mini (GEO probe) | $0.005–$0.01 |
| Perplexity Sonar (GEO probe) | $0.01–$0.03 |
| Claude Sonnet (content rewrites, Agency) | $0.05–$0.20 |
| **Total per audit** | **~$0.13–$0.42** |

The hard cost ceiling in the code is **$2.00 per audit** (`lib/audit/cost.ts`).

---

*This file is gitignored-safe — it contains no real secrets, only instructions on where to get them.*
