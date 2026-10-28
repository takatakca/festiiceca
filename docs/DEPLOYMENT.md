## 2026-10-28 — Stripe: ambiguous session creation is not a safe release condition

- GitHub pushed `147c498b1b8c53376dbb08ac072d745e68356264` (WORKLOG claim), `8bd6e0b4cba5e7856e138cd6e6d457e70ce30806` (compensation code/tests).
- `src/lib/checkout.server.ts`: a potentially completed Stripe Checkout creation can lose its HTTP response. The server **keeps** the existing 45-min hold if creation was attempted but the session outcome is unknown; it does NOT release capacity speculatively. When a session ID is known, the server expires the exact Stripe session and verifies returned `status=expired` and matching `id` before calling service-only `cancel_checkout_order`.
- `src/lib/checkout-compensation.ts` and `tests/checkout-compensation.test.ts`: deterministic regression tests for pre-attempt cancellation, uncertain response, verified expiration, wrong session and wrong status.
- CI `40739976622` (application Node tests, lint, builds/SSR) and `40739977433` (isolated PostgreSQL) **SUCCESS** at `8bd6e0b4cba5e7856e138cd6e6d457e70ce30806`.
- Vercel `dpl_7KxRRbqgrjLHJ8ykm7CKgcpAhBMa` production-target **READY** at the same SHA `8bd6e0b4cba5e7856e138cd6e6d457e70ce30806`. Not proof of a public `.ca` website or real payment test.
- Earlier handoff `3d969875` and Drive handoff: https://docs.google.com/document/d/1adqsb88_NGVUja-YCtEnE-f-rjxMabo2AeRp8zLvwsU/edit . Note the final documentation SHA is later; the next agent should resolve it from the current `main`.
- No live Supabase changes, no Stripe charges, no customer data, no new domain or deployment override, no recurring job enabled. Sales and financial admin writes remain OFF.

**Operational rollback behavior:** Post-Stripe network uncertainty keeps inventory held for its database TTL (45 minutes) instead of releasing immediately. If Stripe returns a session ID even with an invalid Checkout redirect URL, cleanup attempts expiration; only a response with matching `cs_...` and `status=expired` allows the DB cancellation. This prevents inventory overselling while a potentially payable checkout exists. No live Stripe request was executed in this session.

## 2026-10-28 — Récupération privée de courriels de billets

Endpoint `GET /api/cron/recover-tickets` : **non planifié et fermé par défaut**. Paramètres nécessaires après validation de production :
- `FESTIICE_DELIVERY_RECOVERY_ENABLED=true` pour autoriser l'appel;
- `FESTIICE_DELIVERY_RECOVERY_SECRET` : clé privée aléatoire >=32 caractères, envoyée via `Authorization: Bearer …` depuis un scheduler privé approuvé;
- variables Supabase/Stripe/Resend et sender validés déjà requis par `fulfillmentConfigured()`.

L'endpoint retourne un résumé sans coordonnées client : `{attempted,delivered,failures,overdue}`. Trois commandes maximum par invocation, payées depuis >=2 minutes et <23 heures; clé Idempotency-Key existante réutilisée. Si `failures>0`, HTTP 503; sinon 200. Les dossiers `overdue` ont besoin d'une intervention humaine afin de ne pas dépasser les 24 heures de rétention d'idempotence fournisseur. Une configuration Vercel Cron est volontairement omise tant que le projet/domaine autorisé et les secrets n'ont pas été validés. **N'ajouter aucune valeur de secret à GitHub.**

GitHub `dbfa3134`, Actions `40739247114` et `40739246902` **SUCCESS**. Vercel READY cible production au SHA exact : `dpl_Hs4nMusEPqa6vvuS7UvDPdCNrQtp`; projet encore `live:false` et domaine `.ca` non configuré. Docs Drive agents: https://docs.google.com/document/d/1adqsb88_NGVUja-YCtEnE-f-rjxMabo2AeRp8zLvwsU/edit. Test HTTPS sur domaine officiel manquant.

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

## October 16 — operations module

- Route `/operations` lists future dates/slots after an authorized staff login; direct `GET/PATCH /api/operations/sessions` rejects requests without approved Supabase project and server role. Writes require a verified operator role, Origin, approved status and reason, plus a transactional audit record.
- New migration after checkout and refund migrations: `supabase/migrations/20261016170000_operational_slot_controls.sql`. Apply ONLY to the correctly identified and backed-up FESTI-ICE database.
- Operational changes use the exact same PostgreSQL advisory slot lock as checkout holds. Reopening refuses elapsed, test/unpublished, non-active or out-of-sales-period sessions. Do not mutate production without full dedicated-role and TAKATAK entitlement verification.
- `38943418966` GitHub application CI and `38943418754` database guard suite passed at `4ce8b291`; Vercel `dpl_1H2dz3MCR2dFaQYCLpQy1SX6t66X` READY with matching SHA. **No public domain or payment launch verified.**

## 2026-10-16 — Gateway and financial exception migrations

After the correctly identified database is backed up and prior migrations are present, review and apply in order:
`20261016183000_secure_ticket_redemption.sql` then
`20261016193000_financial_event_review_ledger.sql`.
The first refuses any scanner token unless the authenticated actor has an approved staff role, order is paid, ticket is active and today's Montréal local date matches the purchased open session; locks align with full-refund transaction. Public roles cannot execute the RPC. The second introduces an RLS-protected private ledger of signed Stripe disputes, partial refunds and unknown refund events with durable idempotence.

The authorized operator can read exceptions at `/operations/reviews` via an ADMIN/SUPER_ADMIN-only API. The page has no action to refund customers. Current Vercel production variables and the real Supabase identity/project have NOT been verified: application build success does not make finance or scanning live.

`database-guards.yml` now runs (1) the original legacy-style fixtures with QR/finance hardening, and (2) a **second isolated Postgres database** applying the actual foundation checkout RPC migration, then transaction tests of pricing, holds, paid QR issuance, replay, cancellation and capacity. Both do not touch real production or Supabase.

## Final verification and deployment access blocker — 2026-10-16

- `fed69b87e62391332e1cdb91c3262c7d6922f9dc` passed both GitHub checks: `38956624758` (application) and `38956624629` (disposable PostgreSQL).
- At last check, the newest Vercel deployment listed `READY` is `dpl_HGJMfSNBZnrYWuHhoyAiumDgQgxx` for **older** SHA `41871005e8f971e39444939547025e1c5df03550`. No Vercel READY proof for latest SHA was returned.
- An authorized-scope explicit deployment request to existing team `team_5evutKT6yGLTYxyLNsFfl1eH`, project `prj_qGUb3ABR8oP4OwPGUce9LF9soMAp`, targeting production from `main`, failed with **HTTP 403 forbidden**, access to `takatakcas-projects` denied. No deployment was created and no force or bypass attempted. A team-authorized Vercel connection/CI credential is required to publish later commits. Git integration may resume separately; always verify actual SHA and public HTTPS.

## Incident et vérifications du 16 octobre (dernière reprise)

- Version GitHub validée en CI: `9b3182d8`, app `38957983237`, PostgreSQL `38957983184`, réussis. Le commit final de documentation est à vérifier séparément.
- Vercel projet `prj_qGUb3ABR8oP4OwPGUce9LF9soMAp`: dernière version READY retournée par le connecteur `dpl_Bhs6FEcmhLA5xUeoP7473c2kMFAv`, SHA ancien `e69cfccf`. POST déploiement explicite antérieur: HTTP 403 scope `takatakcas-projects`. Ne pas le répéter sans changement d'autorisation.
- Liste des domaines du projet: uniquement `festiiceca.vercel.app` (vérifié au sens de configuration Vercel), aucun domaine `.ca`. Le HTTP/HTTPS public et le hash déployé ne sont pas validés.
- Migration non déployée `20261016200000_checkout_session_compensation.sql` après toutes les migrations de billetterie précédentes. Vérifier l'ID Supabase et une sauvegarde avant toute application.
- Pour une erreur lors de la création de Stripe Checkout: le serveur expire d'abord la session Stripe active; ensuite il libère la réservation, même si le rattachement Stripe à la commande a échoué. Ne pas libérer si l'expiration ne peut pas être confirmée. Le webhook de paiement demeure indépendant de la panne du fournisseur de courriels.

## Admin-only financial review decisions — 2026-10-16

New migration, **not applied to any live Supabase project:** `20261016210000_financial_review_resolution.sql`, dependent on `20261016193000_financial_event_review_ledger.sql` and existing `user_roles`. It adds a review reason and service-role-only RPC for audited REVIEWED/DISMISSED status. No money movement. PostgreSQL CI tests role restriction, reason audit and replay safety.

`GET /api/operations/financial-reviews` remains restricted to ADMIN/SUPER_ADMIN. `PATCH` additionally requires `FESTIICE_FINANCE_REVIEW_WRITES_ENABLED=true` on the server, a verified Supabase project, same Origin, valid JWT, ADMIN/SUPER_ADMIN and a database re-check. The flag defaults OFF: do not configure it until the central TAKATAK entitlement bridge, correct tenant and authorized production credentials are tested.

Vercel most recent observed READY `dpl_BtNDZxtMSu3HTvNdtV4Maj87wqpD` points to older `9e74fa87`. No latest-code/public `.ca` proof. To release: authorized Vercel team access, Git SHA match, public HTTPS `/api/health` match, then vendor E2E in an approved test environment.

## Verified final implementation — 2026-10-16

- **Last green feature commit:** `2499eba57510735679f4752740728260f725369c`. GitHub app CI run `38961413268` completed SUCCESS (semantic lint, all unit tests, Node SSR smoke including default-disabled PATCH, Vercel output build). PostgreSQL CI run `38961413271` completed SUCCESS (payment/QR/refund/manual-review integration, least-privilege checks).
- Earlier commits `cb8fd28e`, `3b9e69ca`, `c385dc0d` had SSR handler registration/brace mistakes. Fixed correctly by `2499eba5`: PATCH is nested under `server.handlers` and both scopes close. Do not reinstate any failed route structure.
- No source deployment to Vercel can be confirmed for `2499eba5`. The last listed READY remains `dpl_BtNDZxtMSu3HTvNdtV4Maj87wqpD` at older Git SHA `9e74fa87`; manual Vercel team deploy authorization previously returned HTTP 403. No official domain attached or public response verified.
- Default-disabled config must remain: `FESTIICE_FINANCE_REVIEW_WRITES_ENABLED=false` (or absent), `FESTIICE_CHECKOUT_ENABLED=false`. No Supabase application migrations have been applied to a verified live environment, and no real financial transaction was tested.
