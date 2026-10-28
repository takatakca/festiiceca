# FESTI-ICE — Architectural decisions and security log

Updated: 2026-10-16.

1. Maintain `takatakca/festiiceca` `main` as source of truth. Respect existing standalone FESTI-ICE branding and layout, not TAKATAK homepage or another vertical. TAKATAK remains the master identity authority if integration is subsequently approved; tenant authorization is server enforced.
2. App is SSR TanStack Start/Nitro; never publish just static `dist`. Vercel project is configured `tanstack-start`, Node 24, `npm run build:vercel` with automatically detected server output, while Docker uses `npm run build:node`.
3. Do not bypass Vercel's known XSS blocker. TanStack Start 1.168.60+, React Router 1.170.41, Router Core 1.171.34, Router Plugin 1.168.42; locked npm/Bun installation and CI security checks.
4. Two operational flags: `fulfillmentConfigured()` validates trusted DB/payment/email credentials, `paymentConfigured()` adds `FESTIICE_CHECKOUT_ENABLED=true`. Pausing NEW checkout does not block signed webhooks for existing customer payments. Stripe mode requires explicit `test` or `live`, matching key prefix.
5. Server validates ticket prices in CAD cents and holds capacity through database transaction. No simulated payment or order confirmation; Stripe Checkout URL only after DB slot hold and persisted session. Webhook signature checked; QR tokens issued after paid confirmation and email delivery uses idempotency key.
6. Do not activate paid functions or migrate unknown database: app `supabase/config.toml` uses `xsozkxcnjmyjjaorkxlx`, connected named project `anyiaszbjsyrxfgjbwdt` is a different empty project. No billable project to be created.
7. Vercel `READY` is not equal to public domain availability. Deployment domains are SSO-protected, and canonical custom domain undecided (`festiice.ca` vs `festi-ice.ca`). Public HTTPS and operational Stripe integration require separate release gates.
8. Staff scanning only with verified Supabase JWT and explicit user role; preserve strict merchant data separation, no service-role key on public UI.
9. Security advisor on the connected but not authorized FESTI ICE project flagged public `SECURITY DEFINER public.rls_auto_enable()`; review after identifying correct target, do not blindly run DDL.
10. Formatting debt: CI temporarily disables legacy Prettier rule; lint, native regression tests, SSR smoke, Vercel artifact check remain required before new releases.

## 2026-10-16 security / operations addenda

11. Paid event receipt must be independent of email provider availability. New sales require successful email configuration, but signed Stripe paid/refunded events continue to reconcile records when email is down. A failed customer ticket email should receive a retryable webhook response.
12. New `PENDING_PAYMENT` order inserts fail closed when the selected session has already started/within five minutes, when season/event is demo or closed/outside approved sale window, or when a normalized email address has >=3 pending reservations in the preceding 20 minutes. The SQL before-insert guard runs atomically in the checkout transaction, and uses transaction advisory locks; public API roles cannot execute its trigger function.
13. Public availability hides elapsed local Montréal slots and excludes active demo seasons, but PostgreSQL remains the authoritative source of booking eligibility.
14. Signed Stripe `charge.refunded` with confirmed full refund and CAD amount reconciles payment status and revokes all associated QR tickets idempotently. Partial refunds/disputes are NOT auto-processed: manual review is required. This code does **not** initiate any Stripe refund.
15. The isolated PostgreSQL 17 CI tests verify new SQL guards, not all historical schema migrations or paid integration. No live DB mutation until project mismatch resolved, backup checked and sandbox payment tests pass.

## Operator security decisions — 16 October 2026

16. Site operational control uses a private token-bearing API, not public client writes. The server validates Supabase JWT and product staff roles; PostgreSQL checks the actor's OPERATION/ADMIN/SUPER_ADMIN entitlement again inside its SECURITY DEFINER function; execute is revoked for anon/authenticated roles.
17. A slot OPEN/CLOSED transition is serialized under the same advisory lock as capacity holds, requires 10–500 character reason and appends an audit row. No transition from CANCELLED/ADVISORY; reopening must pass season/event published, non-test and future-time checks. Duplicate no-op changes do not create duplicate audit records.
18. GROUPE TAKATAK **central identity remains the intended authority**. Current local FESTI-ICE `user_roles` is legacy scaffolding, not a validated shared TAKATAK master identity/tenant grant. A signed and reviewed bridge is required before releasing operational role changes to public production.

## 2026-10-16 — Admission safety and webhook exception durability

19. A QR token is NOT enough to enter: service role validates staff permission, locks the order before ticket (consistent with refunds), requires a paid order plus matching booked session and same Montréal date, checks non-demo active/open published season/date/slot, then marks a single valid ticket USED. A refunded ticket/order or stale-day ticket is rejected, and repeated scans return ALREADY_USED without admitting a second person. No customer PII is returned.
20. The foundation `create_checkout_order` migration itself must pass a disposable PostgreSQL integration test with tax totals, capacity, delayed finalization, missing/mismatched Stripe sessions, duplicate payment events, and cancellation. The newer CI now checks this in addition to individual later migrations; it does not replace real Stripe webhook tests.
21. Do not acknowledge signed Stripe partial refund, ambiguous refund or dispute events only by logging; persist a minimal opaque record with unique event ID before returning success to Stripe. Records are service-role only, with read-only STAFF ADMIN/SUPER_ADMIN view; this queue never initiates money transfers. Full-refund reconciliation remains separate.
22. The financial-review UI is a non-nested route `/operations/reviews` because `/operations` is already a standalone TanStack Router page (without an Outlet). It does not inherit unrelated operational component data. An authentic central TAKATAK role/tenant bridge is still a production prerequisite.

## 16 octobre — correctifs de continuité de paiement

23. Les webhooks Stripe de paiements déjà payés NE doivent PAS exiger des identifiants Resend actifs pour persister le statut financier. `paymentProcessingConfigured` protège l'enregistrement; la livraison des QR vérifie `fulfillmentConfigured` séparément. Ne pas ouvrir de nouveaux achats sans Resend.
24. Un checkout Stripe peut avoir été créé mais ne pas avoir été persisté dans `orders`. La compensation n'est permise qu'après une requête Stripe d'expiration réellement réussie ou événement d'expiration signé, et seulement pour commande encore `PENDING_PAYMENT`. Une autre session Stripe persistée est protégée contre la cancellation. Migration et essais PostgreSQL isolés: `20261016200000_checkout_session_compensation.sql`.
25. La clôture administrative d'une revue financière n'a pas été publiée dans cette session. Ne pas présenter l'interface actuelle, en lecture seule, comme une interface de résolution.

## Finance review write policy — 2026-10-16

26. Manual financial event review is NOT an actual Stripe refund, and never modifies ticket/ledger payment amounts. Only state `REVIEWED` or `DISMISSED` with a meaningful 10–500 character reason. Record the human administrator's subject ID and time; hold a row lock and never overwrite an already completed resolution on replay.
27. The protected PATCH endpoint checks both the present Supabase JWT/ADMIN role and SQL-level actor role through a service_role-only RPC. A separate `FESTIICE_FINANCE_REVIEW_WRITES_ENABLED` server flag remains false until the master TAKATAK entitlement/tenant bridge and authoritative database are verified. Browser request validation alone is not sufficient.
28. Do not conflate a Vercel `READY` for an old SHA with a successful release of current code. No paid ticketing or financial-write enablement without a verified production environment and DNS.

## Implementation verification and rollout — 2026-10-16

29. `PATCH /api/operations/financial-reviews` is a proper TanStack Start server handler alongside GET. The SSR HTTP smoke test must prove write endpoint returns 503 while the `FESTIICE_FINANCE_REVIEW_WRITES_ENABLED` flag is unset. This caught and resolved a real route registration error (latest verified app CI `38961413268`).
30. The financial decision SQL is service-role only, uses an authenticated actor's admin role re-check, records reason/time/actor and refuses overwriting a resolved record. PostgreSQL validation `38961413271` is GREEN; live finance writes remain OFF and require central TAKATAK product authorization and canonical Supabase project.

## 2026-10-28 — Sécurité de la récupération des billets

31. La clé Resend Idempotency-Key est conservée 24h seulement selon la documentation officielle. Les nouvelles reprises automatiques sont bornées à moins de 23h depuis `paid_at`; hors délai ou date invalide, l'envoi échoue fermé et le dossier est laissé pour révision humaine. La fenêtre protège aussi les anciens retries Stripe contre les doubles courriels après expiration de la clé.
32. L'endpoint privé n'est pas ouvert ni programmé sans vérification : `FESTIICE_DELIVERY_RECOVERY_ENABLED`, secret de >=32 caractères, auth Bearer à comparaison constante, backend/Resend valide, maximum 3 commandes par invocation. Aucun PII client ni QR token dans la réponse ou les logs de relance.
33. READY sur Vercel au SHA du code ne remplace ni l'association d'un domaine `.ca`, ni la santé HTTPS publique, ni le paiement/QR E2E sur fournisseurs réels. Maintenir vente et écriture financière désactivées.
