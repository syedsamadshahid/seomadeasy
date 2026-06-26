# Phase 1 — Foundation & Project Setup

**Goal:** A running Next.js app with database, ORM, and a hardcoded dev user. No auth yet, no billing yet.

**Duration:** ~Week 1

---

## Why First

Everything depends on the project scaffold and data layer. We use a hardcoded dev user so we can build and test the entire audit + GEO engine without touching authentication (that's Phase 7).

---

## Tasks

### 1.1 Git + Repo Init
- [ ] `git init` — **first command, before anything else**
- [ ] Create GitHub repo, push initial commit
- [ ] Add `.gitignore` (node_modules, .env, .next, .vercel)
- [ ] Set up commit convention (feat:, fix:, chore:)

### 1.2 Next.js Setup
- [ ] `npx create-next-app@latest` — App Router, TypeScript, Tailwind
- [ ] Install shadcn/ui, configure base components
- [ ] Set up folder structure (see CLAUDE.md directory convention)
- [ ] Configure TypeScript strict mode
- [ ] Add `.env.example` with all required keys (no real values)

### 1.3 Database — Neon + Prisma
- [ ] Create Neon project, get connection string
- [ ] Install Prisma, run `prisma init`
- [ ] Write full `schema.prisma` (all tables — see CLAUDE.md data model)
- [ ] Use `@neondatabase/serverless` HTTP driver (avoid connection pool exhaustion)
- [ ] Run first migration
- [ ] Seed a hardcoded dev user (id: "dev-user", plan: "agency")

### 1.4 Redis — Upstash
- [ ] Create Upstash Redis database
- [ ] Install `@upstash/redis`
- [ ] Write `lib/cache` helper with get/set + TTL support
- [ ] Test cache round-trip

### 1.5 Base Layout
- [ ] Marketing landing page shell (placeholder)
- [ ] Dashboard layout shell (sidebar + main area)
- [ ] Hardcode dev user context (no auth — replace in Phase 7)

---

## Deliverable

A deployed Next.js app on Vercel that connects to Neon + Upstash, with a seeded dev user and an empty dashboard. Running `prisma studio` shows all tables.

---

## Exit Criteria

- [ ] Repo on GitHub with clean history
- [ ] App runs locally and deploys to Vercel
- [ ] All Prisma tables created and migrated
- [ ] Redis cache helper works
- [ ] Dev user seeded; dashboard loads with hardcoded user

---

## Notes

- **Do NOT build auth here.** Use a hardcoded user object. Auth is Phase 7.
- **Do NOT build billing here.** Everyone is treated as Agency plan during dev. Billing is Phase 8.
- Use `.env.local` for secrets; never commit them.
