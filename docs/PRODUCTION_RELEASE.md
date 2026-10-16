# FESTI-ICE — Production release checklist

The site is a TanStack Start SSR application, not a static Vite bundle. The
current `npm run build` produces a Node server under `.output/server/index.mjs`.
Never upload only `.output/public` as a complete deployment.

## Current safety state (2026-10-14)

- Published `event_dates` and `time_slots` in Supabase now drive the
  public ticket calendar. If none exist or the DB is unavailable, no dates
  are offered. Prices and Flex come from active season `ticket_types` rows.
- The screen shows an estimate only: **no payment, order, hold, or QR ticket
  is created by the current UI.** Never describe it publicly as live sales.
- SQL migration added by PR #1 revokes public execution of hold/scan/capacity
  RPCs. It is merged in GitHub, but MUST be applied and checked on the live
  Supabase instance separately.
- The repository had no deploy workflow. `FESTI-ICE CI` now builds on
  GitHub pushes; it does NOT silently deploy anywhere.
- Existing Vercel project `takatakcas-projects/festiiceca` showed a failed
  deploy in the GitHub PR history. On 2026-10-14, authenticated access to
  that Vercel team from the available connector returned HTTP 403.
- The codebase and documentation disagree about the canonical domain:
  `festiice.ca` versus `festi-ice.ca`. Resolve DNS and preferred domain
  before enabling indexed checkout, transactional email, or Stripe redirect URLs.

## Required before public ticket sales

1. Authoritatively configure published future event dates, open arrival slots,
   operational status, season, and ticket types in production Supabase.
2. Implement backend-issued, atomic capacity holds and a real payment session
   with prices validated on the server; prevent overselling and replay.
3. Verify Stripe webhook signatures, idempotency, fulfilled PAID orders,
   tickets with cryptographically random QR tokens, and duplicate-scan lockout.
4. Add customer communications, support and tested refund/weather flows.
5. Complete access-controlled admin and gate-scanner screens.
6. Secure production runtime secrets, choose the hosting target, configure
   main-branch continuous deployment, and verify public HTTPS + rollback.
7. Run build, E2E, abuse/security, accessibility, and mobile acceptance tests
   before calling the system production ready.

Do not add a fake payment success page or demo ticket confirmation.

## Optional self-hosted deployment (Coolify / Contabo)

A multi-stage Dockerfile is provided at `Dockerfile.coolify`.
It runs the same Node/Nitro SSR output as `npm run build`, listening
on port `8080` (environment: `PORT=8080`, `HOST=0.0.0.0`).
It does **not** switch DNS or auto-deploy by itself.

- Create a separate Coolify service from this GitHub repository using
  Dockerfile build mode, `Dockerfile.coolify`, and internal port `8080`.
- Connect and verify the chosen domain after confirming whether it is
  `festiice.ca` or `festi-ice.ca`, and keep the current site operational
  until HTTPS + public paths have been checked.
- In Coolify's protected runtime variables set `SUPABASE_URL` and
  `SUPABASE_PUBLISHABLE_KEY` for the **correct** backend, never expose
  `SUPABASE_SERVICE_ROLE_KEY` to the public environment.
- Use Coolify GitHub push webhook for automatic deployment from `main`
  after building a verified first revision; keep rollback available.
- Confirm `/` and `/billets` return real HTML over HTTPS before switching DNS.

**Important:** `supabase/config.toml` points at Supabase project
`xsozkxcnjmyjjaorkxlx`, which is **not** the same as the connected
Supabase project named FESTI ICE (`anyiaszbjsyrxfgjbwdt`). The latter
was restored on 2026-10-14 and was empty (zero public tables) after
restoration. Do not apply migrations to it or assign its URL as this
application's production backend without confirming ownership and intent.

## October 16, 2026 addendum

The formerly broken automatic Vercel production-target deployment is now buildable:
project `prj_qGUb3ABR8oP4OwPGUce9LF9soMAp`, framework `tanstack-start`,
Node 24, `npm run build:vercel`, output auto-detected as Nitro Vercel SSR.
The first confirmed READY build: `dpl_8JqFuufvKAy9Jm7RZYmSgXr1Fojk`
at `0114b084633970aa0847eadc5b1beec9abe63feb`.

TanStack Start has been upgraded to the CVE-2026-102989 patched version and both
dependency lockfiles regenerated. The build command for self-hosted Coolify is
`npm run build:node`, using `npm ci`. Source `vercel.json` is part of the
repository. A dedicated health handler exists at `/api/health`.

**Not yet production acceptance:** custom domain/SSO HTTPS accessibility,
Stripe test/live end-to-end checks, correct Supabase DB schema and migrations,
actual QR email / staff scan acceptance, weather and refund flows. Maintain
`FESTIICE_CHECKOUT_ENABLED=false` until verified.

## Pending checkout migrations — 16 October 2026

After identifying and backing up the actual FESTI-ICE Supabase project,
review/apply the additive checkout security migrations in numeric order:
`20261016150000_checkout_session_guards.sql` and
`20261016160000_stripe_full_refund_reconciliation.sql`. These require
`20261014190000_checkout_transactional_foundation.sql` first.
The related GitHub Action `database-guards.yml` runs their relevant
SQL on a fresh throwaway PostgreSQL 17 fixture; it does **not** exercise
a real Supabase or Stripe account. Keep sales OFF until real service
authorization and integration tests are complete.

## 2026-10-16 additional operations migration

The service-role-only `20261016170000_operational_slot_controls.sql` follows
checkout, session guards and full-refund migrations. It introduces the
`slot_operational_audit` RLS-protected table and atomic slot status RPC.
Only a verified staff/TAKATAK entitlement bridge and authorized production
database may enable real `/operations` changes. The isolated PostgreSQL
17 CI tests verify role denial, audit and reopening guard; they are NOT an
authorized production staff login test.

## Additional prelaunch financial and gate migrations (2026-10-16)

Only after confirmed production database ref, verified backup and isolated full
lifecycle testing, apply the gate migration
`20261016183000_secure_ticket_redemption.sql`, followed by
`20261016193000_financial_event_review_ledger.sql`. Database CI now tests
the base checkout migration in a second throwaway PostgreSQL 17 database,
including pgcrypto from `extensions` (matching Supabase extension layout).
The private review dashboard `/operations/reviews` is read-only and requires
finance admin permission. No active payments or refunds were created in these
offline tests. Any Vercel `READY` claim must be paired with the exact source
commit and an independent HTTPS domain check.

## 2026-10-16 manual financial-review release gate

Run `20261016210000_financial_review_resolution.sql` only after identifying and backing up the approved Supabase project and applying the foundational finance-review ledger. PostgreSQL disposable fixtures validate the SQL; these do not constitute a real Stripe test. To enable administrative writes, confirm central TAKATAK product/tenant entitlements, then set `FESTIICE_FINANCE_REVIEW_WRITES_ENABLED=true` in protected server environment and validate a real authorized review without money movement. Default flag absent/false keeps PATCH at HTTP 503.

Vercel `READY` last confirmed for older `9e74fa87` only, custom .ca domain unverified. Verify deployed SHA/HTTPS before any announcement.
