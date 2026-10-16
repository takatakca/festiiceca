# FESTI-ICE — Prioritized task queue

Updated 2026-10-16. Tasks marked complete mean code/CI verification only when so specified; do not equate with paid integration acceptance.

| Priority | State | Task and acceptance |
| --- | --- | --- |
| P0 | DONE in repo, CI validated | Patch TanStack XSS, align package versions and npm/Bun locks; run repeatable install, regression tests, Node + Vercel SSR builds. |
| P0 | DONE at application build level | Repair Vercel framework/output settings. Verify deployment `dpl_8JqFuufvKAy9Jm7RZYmSgXr1Fojk` READY at SHA `0114b084`; confirm newer build separately. |
| P0 | BLOCKED: authoritative DB unknown | Identify FESTI-ICE database `xsozkxcnjmyjjaorkxlx` or the actual backend from deployment environment without revealing credentials. Verify tables, migration versions, default grants, RLS and backups before migrations. Do not create a billable Supabase project. |
| P0 | BLOCKED: payment integration | In approved isolated staging apply migrations, verify holds/replay/Stripe test payments and customer ticket email, plus webhook retries on paused sales. Only after approval allow actual sales. |
| P0 | BLOCKED: domain ownership | Identify preferred domain `festiice.ca` or `festi-ice.ca`, map DNS and Vercel settings, remove/adjust protection only when authorized; verify HTTPS public responses and actual deployed SHA. |
| P1 | PARTLY CODED | Test authorized scanner roles, successful and repeated QR scans and invalid tokens against DB in staging; enforce tenant-scoped TAKATAK identity rules if applicable. |
| P1 | TODO | Operations dashboard for seasons, staff, events, capacity/prices, weather notices, ticket issuance, refunds and rescheduling. |
| P1 | TODO | Paid-session expiration race, refund/reconciliation and email recovery with audit trail, webhook event persistence; verify Resend provider idempotency contract before launch. |
| P1 | TODO | Integrate real operational capacity/status, final dates and copy from owner-approved sources; remove placeholders and inactive program concepts. |
| P2 | TODO | User acceptance on tablets/mobile, accessibility, English localization, mail deliverability, security audit, privacy/legal policies. |
| P2 | TODO | Normalize legacy Prettier formatting and add e2e, integration and stress tests without silencing code defects. |

Continue from the earliest executable task. Document blockages, no speculative secrets, no fake checkout success or unverified production claims.

## October 16 follow-up: next executable checkpoints

| Priority | Status | Evidence / exact follow-up |
| --- | --- | --- |
| P0 | Implemented; PostgreSQL CI green | New `20261016150000_checkout_session_guards.sql` blocks expired/demo/off-sale sessions and excessive unpaid reservations. Run with real checkout RPC on a verified isolated Supabase clone before production. |
| P0 | Implemented; PostgreSQL CI green | New `20261016160000_stripe_full_refund_reconciliation.sql` revokes QR on signed full refund; replay/idempotence fixture tested. Extend to partial refunds, disputes and explicit manual-review queue. |
| P0 | Implemented; JS CI green | Stripe signature/time tests and public stale-session filters. Confirm on the latest branch commit after all CI jobs conclude. |
| P0 | Blocked: no approved production credentials | Vercel project `festiiceca` lists zero configured project variables. Identify the real database `xsozkxcnjmyjjaorkxlx` and validated Stripe/Resend configurations; do not create billable Supabase projects. |
| P0 | Blocked: authoritative domain | Only SSO-protected Vercel aliases; choose domain `festiice.ca` or `festi-ice.ca` from approved owner records and verify public TLS/health response. |
| P1 | Next independent code task | Build production-grade staff operations dashboard with server-checked role/tenant entitlements; review existing `user_roles` and TAKATAK identity authority before writing any privileged API. |
| P1 | Test-gate pending | Verify Stripe payment -> ticket issuance -> Resend email -> QR scan -> full refund -> revoked ticket in isolated test mode. Include failures, webhook ordering and rate-limit contention. |

## Updated after operational controls

| Priority | State | Task |
| --- | --- | --- |
| P1 | CODED / CI PASS | `/operations` role-protected schedule viewer and audited OPEN/CLOSED change API; migration `20261016170000_operational_slot_controls.sql`. CI runs `38943418966` and `38943418754` green on `4ce8b291`. |
| P0 | BLOCKED / IDENTITY | Replace local FESTI-ICE staff authentication authority with verified TAKATAK master identity and explicit `product=festiice`, client/tenant membership. Existing `user_roles` must not independently grant cross-product access. Do not guess or create an undocumented TAKATAK API. |
| P0 | BLOCKED / INTEGRATIONS | Vercel missing real FESTI-ICE Supabase/Stripe/Resend variables, target Supabase project not verified and custom domain absent. Must prove successful authorized staff access and slot changes on isolated DB before enabling production operation. |
| P1 | NEXT | Audit and implement weather advice/cancellations and rebooking, refunds/chargebacks and operational alerting; add staff activity review and client ticket resend with verified order ownership. |

## New queue checkpoint — QR and signed financial events

| Priority | State | Specific work |
| --- | --- | --- |
| P0 | DONE in code; ephemeral DB PASS | Secure QR admission on paid booked day only, atomic order/ticket locks, role and revoked-status checks, tests plus tightened gateway HTTP smoke. |
| P0 | DONE in code; ephemeral DB PASS | Foundation checkout migration integrated with test schema; assert holds, real totals, paid QR issuance, Stripe event replay and capacity. No live Stripe account was used. |
| P1 | DONE in code; ephemeral DB PASS | Durable signed Stripe partial-refund/dispute review ledger + admin-only read API and standalone read-only dashboard; ensure full real backend migration and role review before use. |
| P0 | BLOCKED | Resolve actual Supabase project, owner-approved tenant and TAKATAK product entitlement, domain, Vercel environment secrets and real Stripe/Resend event testing. |
| P0 | NEEDS VERIFICATION | For latest `main` SHA, verify both GitHub Actions and matching Vercel production-target READY; publicly check HTTPS `/api/health` only after canonical domain set. |
| P1 | TODO | Reliable webhook delivery recovery and reconciliation after retry window, partial-refund staff state/audit, chargebacks, weather/rescheduling and explicit customer ticket resend by verified owner. |

## Active deployment blocker

**P0 BLOCKED:** Vercel POST /v13/deployments denied team access with 403 `takatakcas-projects`. Check a team-authorized Vercel connection and existing Git integration, then confirm a `READY` deployment with the latest `main` SHA and a public HTTP 200 on the approved custom domain. This is not a code compilation failure. Never override project protections or assume a prior READY represents new commits.

## Reprise Stripe — 16 octobre 2026

| Priorité | Statut | Prochaine action vérifiable |
| --- | --- | --- |
| P0 | TERMINÉ en code, CI verte | Webhook de paiement indépendant de Resend, commit `c411cf0a` puis `9b3182d8`. |
| P0 | TERMINÉ en code, CI PostgreSQL verte | Compensation de commande Stripe non liée, après expiration Stripe confirmée, sans libérer la réservation d'une autre session: migration `20261016200000_checkout_session_compensation.sql`, test d'intégration `38957983184`. |
| P0 | BLOQUÉ — droits Vercel | Restaurer l'autorisation équipe `takatakcas-projects` ou vérifier son Git auto-deploy, publier le SHA courant, puis comparer au SHA de `GET /api/health` sur HTTPS public. Le plus récent READY observé est `e69cfccf` seulement. |
| P0 | BLOQUÉ — environnement | Confirmer le vrai projet Supabase et les secrets protégés Stripe/Resend, domaine officiel et droits TAKATAK; ensuite seulement les tests E2E. |
| P1 | NON RÉALISÉ | Clôture auditée des dossiers `financial_event_reviews` par administrateur avec raison obligatoire; aucune action financière automatique. |
| P1 | NON RÉALISÉ | Réconciliation / renvoi des emails de billets après épuisement des retries Stripe; traitement météo, annulation et reprogrammation réels. |

## Finance review closure and operations — 2026-10-16

| Priorité | État | Preuve et prochaine étape |
| --- | --- | --- |
| P1 | CODE & POSTGRESQL CI | Admin financial review resolution with reason, actor audit, idempotent decision: `20261016210000_financial_review_resolution.sql`. Reviewer page + API connected. |
| P0 | SAFE GATE OFF | Set `FESTIICE_FINANCE_REVIEW_WRITES_ENABLED=true` only after approved TAKATAK centralized product/tenant entitlement and right Supabase environment; do NOT enable now. |
| P0 | UNVERIFIED RELEASE | Confirm a Vercel READY SHA matching latest `main`; previous deployment ready at `9e74fa87` only. Authorized custom domain + public HTTPS /api/health still unavailable. |
| P0 | BLOCKED | Verify authoritative Supabase project, backup/migrations, Stripe/Resend test event lifecycle, staff role integration and canonical FESTI-ICE domain before operating real finance review writes or ticket sales. |
