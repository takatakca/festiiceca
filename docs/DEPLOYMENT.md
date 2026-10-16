# FESTI-ICE — Deployment and operations

**Updated:** 2026-10-16. Repo `takatakca/festiiceca`, branch `main`.

## Hosting actually discovered
- Vercel project ID `prj_qGUb3ABR8oP4OwPGUce9LF9soMAp` under team `team_5evutKT6yGLTYxyLNsFfl1eH` (`takatakcas-projects`). GitHub pushes to `main` automatically trigger production-target deployments. No manual deployment is needed for normal commits.
- Updated Vercel framework to `tanstack-start`, `buildCommand=npm run build:vercel`, install `npm ci --no-audit --no-fund`, Node 24, output auto-detected. `vercel.json` tracks corresponding repository configuration. SSR API must remain supported: no `dist` static-only configuration.
- Latest confirmed READY: `dpl_8JqFuufvKAy9Jm7RZYmSgXr1Fojk` at SHA `0114b084633970aa0847eadc5b1beec9abe63feb`. Inspector: https://vercel.com/takatakcas-projects/festiiceca/8JqFuufvKAy9Jm7RZYmSgXr1Fojk
- Vercel reported aliases `festiiceca.vercel.app`, `festiiceca-takatakcas-projects.vercel.app`, `festiiceca-git-main-takatakcas-projects.vercel.app`; protected by team SSO. Not proof that custom domain works.
- Independent optional self-hosted Coolify/Contabo target: `Dockerfile.coolify` runs `npm ci`, `npm run build:node`; Node runtime `PORT=8080`, `HOST=0.0.0.0`. Not verified live on Coolify/MochaHost.

## Commands / CI
- `npm ci --no-audit --no-fund`
- `node --experimental-strip-types --test tests/payment-readiness.test.ts`
- `npx eslint . --rule 'prettier/prettier: off'` (legacy baseline)
- `npm run build:node` for Docker, `npm run build:vercel` for Vercel; GitHub CI verifies both and `.vercel/output/config.json`.
- `/api/health` returns `{ok:true,service:"festiice",deploymentSha:<sha|null>}`. 200 proves HTTP application handler only, not upstream Stripe/database integration.
- GitHub workflow `lockfile-sync.yml` automatically commits `bun.lock` and `package-lock.json` after manifest changes if installs/tests/build pass; no force pushes. Vercel Git integration deploys each `main` commit.

## Required production variables (protect secrets at Vercel; never paste values into Git)
`FESTIICE_APPROVED_SUPABASE_PROJECT_REF` (actual reviewed Supabase project), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `FESTIICE_PAYMENT_MODE=test|live`, `FESTIICE_CANONICAL_ORIGIN`, `RESEND_API_KEY`, `FESTIICE_TICKET_FROM_EMAIL`. Set `FESTIICE_CHECKOUT_ENABLED=false` until staged positive paid-order, email, capacity and staff scan tests pass. When pausing sales, keep webhook fulfillment credentials so previously-paid orders can still complete.

## Launch and rollback gates
1. Verify domain ownership/canonical origin (conflicting `festiice.ca` and `festi-ice.ca`) and DNS/SSL; protect staging with SSO, approve deliberate public access at the custom domain.
2. Verify Supabase project ref in code versus connected account (not equal). Back up before applying/reviewing migrations and test RLS/RPC scopes.
3. Test Stripe signatures, test payments, duplicate webhooks, expired hold race, refunds, payment-to-QR and delivery replays; staff-specific scanner tests.
4. Confirm exact deploy SHA in `/api/health`, HTTPS GET `/` and `/billets`, no secrets in output, and rollback mechanism. A `READY` build alone is not proof of customer-facing launch.
5. If errors occur, set checkout OFF; continue processing already-paid webhooks and reconcile unsettled orders. Roll back Vercel from its deployment history without destructively rolling back paid tickets/data.

**Public website domain status:** not verified. **Vercel production-target build:** READY at `0114b084`. **Ticket sales:** not activated.

## 2026-10-16 follow-up — dependency and security gates

- The Vercel project `prj_qGUb3ABR8oP4OwPGUce9LF9soMAp` has no project-level environment keys configured according to its inspected inventory (values were not decrypted). A Vercel `READY` SSR build cannot execute a live paid checkout without trusted Supabase/Stripe/Resend settings.
- Hardened Stripe signature tests execute within `FESTI-ICE CI` and SQL-specific checkout/refund tests execute in ephemeral PostgreSQL 17 (`.github/workflows/database-guards.yml`).
- Migration order after verified project identification, backup and review: existing `20261014190000_checkout_transactional_foundation.sql`, then `20261016150000_checkout_session_guards.sql`, then `20261016160000_stripe_full_refund_reconciliation.sql`. All remain unapplied to production.
- The `FESTIICE_CHECKOUT_ENABLED` variable blocks **new** sales, not webhook settlement and refunds for previous orders. The payment processing readiness requirements exclude Resend availability; the email worker checks Resend separately and webhook returns a retryable response if ticket delivery fails.
- Customer-readable time slots filter out session starts within five minutes of the server's Québec local clock, and the database hardening trigger independently validates the same cutoff.
- Keep SSO protection until a public domain and DNS are authorized and verified. Query `/api/health` over the resulting HTTPS hostname; compare the returned SHA to GitHub and Vercel.
