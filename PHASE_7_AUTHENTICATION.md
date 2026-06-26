# Phase 7 — Authentication (LATE PHASE)

**Goal:** Replace the hardcoded dev user with real Firebase Auth. Scope all data to real users.

**Duration:** ~Week 6–7

---

## Why This Is Late (On Purpose)

The entire audit + GEO engine was built and tested with a hardcoded dev user. Auth is plumbing — it doesn't add product value, and building it early would slow down the core engine work. Now that the product works, we wire in real accounts.

**Do not build this before Phases 1–6 are working.**

---

## Tasks

### 7.1 Firebase Auth Setup
- [ ] Create Firebase project, enable Auth
- [ ] Enable providers: Email/password + Google sign-in
- [ ] Install Firebase SDK (client + admin)
- [ ] Configure environment keys (server-side admin key secret)

### 7.2 Auth Flow
- [ ] Sign up / sign in / sign out UI
- [ ] Email verification
- [ ] Password reset
- [ ] Session management via Firebase session cookies
- [ ] Next.js middleware to protect dashboard + API routes

### 7.3 Replace Dev User
- [ ] Remove hardcoded dev user
- [ ] On first sign-in, create a `User` row (firebaseUid, email, default plan: free)
- [ ] Map Firebase UID → `User.firebaseUid`
- [ ] Scope every query to the authenticated user
- [ ] Audit/result/project endpoints: row-level access control by userId

### 7.4 Security Pass
- [ ] All API routes require a valid session (except shareable read-only links)
- [ ] Verify no data leaks across users
- [ ] Secrets server-side only
- [ ] Re-confirm GoogleConnection tokens still encrypted and user-scoped

---

## Deliverable

Real users can sign up, log in, and only see their own projects, audits, and results. The hardcoded dev user is gone.

---

## Exit Criteria

- [ ] Firebase Auth works (email + Google)
- [ ] Email verification + password reset work
- [ ] Middleware protects all dashboard/API routes
- [ ] Every user sees only their own data (verified)
- [ ] Shareable links still work without auth
- [ ] No hardcoded user remains in code

---

## Why Firebase Auth (not Clerk)

- Free up to 50K MAU
- You already know it from past projects
- Saves ~$25/mo vs Clerk
- Native Google sign-in (useful since we use Google APIs anyway)

The tradeoff is you build the auth UI yourself (Clerk gives prebuilt components). That's acceptable for the cost saving.
