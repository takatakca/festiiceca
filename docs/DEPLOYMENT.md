# FESTI-ICE — Deployment runbook
See also `PRODUCTION_RELEASE.md`.

## Application
TanStack Start / Nitro Node SSR (React + Vite). Build: `npm run build`. Run: `node .output/server/index.mjs` with `PORT=8080`, `HOST=0.0.0.0`. A tested `Dockerfile.coolify` is present for off-host compilation; do not attempt heavy npm builds on constrained production hosting.

## Environment selection
- The registered GitHub main is source of truth.
- **No target has been verified as production**. Previous Vercel team returned 403; do not claim deployment on the strength of a successful CI job.
- Canonical domain **unresolved**: `festiice.ca` / `festi-ice.ca`. Do not silently redirect traffic until official DNS ownership/config is confirmed.

## Server-only secrets
`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `FESTIICE_CHECKOUT_ENABLED`, `FESTIICE_CANONICAL_ORIGIN`. Keep service/Stripe secrets in protected runtime settings and NEVER `VITE_*` variables or client bundles. Use separate Stripe test/live credentials and webhook endpoints. Never log raw customer/QR data.

## Release gates
1. Confirm target identity, `main` SHA, correct Supabase project ref, migrated functions/RLS, backed-up DB, and current event calendar.
2. Run `npm install`, semantic lint, `npm run build`; first reconcile `package-lock.json` for deterministic `npm ci`.
3. Deploy to isolated preview environment (Coolify SSR image or verified Vercel target); set Stripe *test* secrets and `FESTIICE_CHECKOUT_ENABLED=false`.
4. Verify `/`, `/billets`, status endpoints, CSP/HTTPS and 404/500 behaviors, then test Stripe Checkout and webhook receipt against an isolated test DB with realistic slots and duplicate events.
5. Confirm no oversold slot, verified payment before QR issuance, customer email, staff scan and refund/weather behavior.
6. Enable production only with operations approval, confirm exact deployed commit, smoke checks and rollback. Do not automatically activate ticket purchases through unrelated GitHub pushes.

## Rollback
Keep the previously working deployment artifact, roll application back using host deployment history. Revert DB changes only using reviewed additive migrations/forward fixes—never destroy paid orders or tickets. If checkout breaks, set `FESTIICE_CHECKOUT_ENABLED=false` immediately and investigate payment webhooks independently.

**Status: not deployed/verified during current session.**
