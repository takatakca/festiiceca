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
