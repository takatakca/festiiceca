# FESTI-ICE — Project status

**Checked:** 2026-10-16 America/Toronto
**GitHub:** `takatakca/festiiceca`, `main`
**Most recent application commit at this review:** `dd5e65e1a3126e1ff80a4e77e51a6966442ba17f`

## Delivered in GitHub

- Responsive French public site, TanStack Start SSR and Nitro; public schedules/tariffs sourced from published Supabase records, no fictional sell-out claims. Tickets remain closed unless runtime gating, Stripe, database, email and server-role approvals match.
- Database migrations authored for orders, serialized capacity holds, idempotent paid fulfillment, QR issuance and server-only RPCs. **These latest migrations have not been applied or tested against the authoritative production database.**
- Stripe checkout API, signature-verified webhook, paid QR email delivery via Resend with idempotency key, staff OTP and role-gated scanner. The checkout shutdown now **does not stop already-paid webhook fulfillment**.
- Security: patched TanStack Start >=1.168.60, aligned React Router/core/plugin, reproducible npm and Bun lockfiles committed at `1fb78add91d4`; dedicated unit tests verify mode, approved database ref, delivery dependencies and paused checkout semantics.
- CI: repeatable `npm ci`, semantic lint, Node SSR build + smoke (including closed checkout), explicit Vercel SSR build/output check. `/api/health` added at `dd5e65e1`.
- GitHub Git integration automatically creates Vercel production-target builds. Updated Vercel project `prj_qGUb3ABR8oP4OwPGUce9LF9soMAp` to `tanstack-start`, Node 24, `npm ci`, `npm run build:vercel`, auto-detected SSR output. A confirmed `READY` production-target build exists for Git SHA `0114b084633970aa0847eadc5b1beec9abe63feb` (deployment `dpl_8JqFuufvKAy9Jm7RZYmSgXr1Fojk`). Newer builds require separate confirmation.

## Not complete / release blockers

1. Project `supabase/config.toml` names `xsozkxcnjmyjjaorkxlx`, which is not among currently connected projects. Connected `FESTI ICE` ref `anyiaszbjsyrxfgjbwdt` was `ACTIVE_HEALTHY` but had zero public tables and migrations in the Oct 16 review. **Do not apply source migrations to a similarly named empty database without proof of ownership and intent.** The latter additionally shows a security advisor warning that `public.rls_auto_enable()` SECURITY DEFINER can be called by public roles. Remediation requires confirming this is the relevant environment.
2. No Stripe/Resend live or test paid-order end-to-end evidence, staff roles/seats verification, refund/rebook, audit log and operational back office. Preserve fail-closed sales.
3. Vercel `READY` is not a public-domain smoke test. Only `.vercel.app` domains were listed and they require team SSO. No confirmed custom domain/DNS/HTTPS/public availability. Conflict between `festiice.ca` (current request) and `festi-ice.ca` (legacy README).
4. Old marketing copy, app accessibility/E2E, authoritative production calendar and TENANT/TAKATAK entitlement decisions remain open.
5. CI still excludes repository-wide legacy Prettier issues; semantic lint and builds run. Keep complete dependency lockfile and vulnerability checks on future updates.

**Production sales: disabled / not validated. App production-target build: YES (Vercel READY), domain availability: UNVERIFIED.** See `TASK_QUEUE.md`.

## 16 October 2026 — checkout hardening implementation

- Added `tests/stripe-signature.test.ts`: HMAC v1 raw request body, 5-minute clock tolerance, altered-body/secret, malformed header, duplicate timestamp, oversize and replay rejection. Verified passing in GitHub Actions at `d1bdf44c`.
- Added SQL migration `20261016150000_checkout_session_guards.sql`: before-insert checkout guard rejects sessions already started (5-minute buffer), demo seasons, closed/publication-disabled slots, sales outside season bounds and more than three pending unpaid orders per email within 20 minutes, with advisory-lock serialization. Tested against isolated PostgreSQL 17 in `.github/workflows/database-guards.yml`.
- Public session list now hides elapsed local Montréal slots, demo seasons and displays checkout readiness only during valid season sales periods; pure slot-time tests added.
- Added SQL migration `20261016160000_stripe_full_refund_reconciliation.sql`, `charge.refunded` webhook processing for *full refunds only*, idempotent payment ledger and QR revocation. Partial refunds explicitly require human review. Isolated database integration assertions were added and passed at commit `188ed274`.
- Payment processing now remains enabled for already-paid webhook and refund events when Resend is temporarily unavailable; NEW checkout still requires operational Resend credentials and explicit sale enablement.
- `main` at start of this follow-up was `ecb7622d`; latest feature implementation prior to this documentation update is `6da6786b65572def2f83eb630116bda869e0476f`. Multiple CI and Vercel revisions are automatically triggered and must be checked by SHA, not inferred from a prior green run.
- The Vercel project variables inventory returned **no configured project environment variables** (only key names were inspected; no decrypted secrets). Do not open ticket sales or apply DB migrations as a consequence of the Vercel `READY` build.

**Important:** The PostgreSQL fixtures are simplified proof of the *new guard and refund functions*, not an end-to-end test of all original Supabase migrations, Stripe settlement, email receipt, QR scan, or identity integration. Live production checkout remains **OFF / NOT ACCEPTED**.

## New: operator-grade operational slot control (16 October 2026)

- `src/routes/operations.tsx`: real responsive back-office for upcoming event sessions, authorizations via current staff session, visible publish/test/slot status, explicit close/reopen confirmation with 10-character minimum written reason. It never displays ticket purchaser contact data.
- `src/routes/api/operations/sessions.ts`: GET/PATCH with checked Supabase JWT and the existing product's `user_roles`. Reading requires SUPERVISOR/OPERATIONS/ADMIN/SUPER_ADMIN; changes require OPERATIONS/ADMIN/SUPER_ADMIN. Server-only service role, CSRF Origin check on PATCH, strict Zod validation, and no untrusted user-defined Supabase queries.
- `supabase/migrations/20261016170000_operational_slot_controls.sql`: privileged audited status transitions, PostgreSQL advisory lock shared with capacity holds, rejects reopening cancelled/advisory/demo/unpublished/outside-sale or elapsed slots. Dedicated audit table has RLS enabled with service-role-only grants.
- `tests/sql/operations-fixtures.sql`, `tests/sql/operations-assertions.sql`, and updated CI workflow run actual PostgreSQL 17 checks (unauthorized gate staff, authorized close/open, audit idempotence, demo and invalid reason rejection). Successful build and DB test runs at commit `4ce8b291a941c606ef5b3c727987d5141b125081`; Vercel deployment `dpl_1H2dz3MCR2dFaQYCLpQy1SX6t66X` READY at exactly the same SHA.

**Identity caveat:** The existing FESTI-ICE staff login and `user_roles` are local Supabase scaffolding. GROUPE TAKATAK's source of truth is central TAKATAK identity, enforced by product/tenant membership. The centralized entitlement bridge is NOT wired to FESTI-ICE. Do not activate privileged live operations or broaden roles until that mapping and authoritative DB environment are approved.

## 2026-10-16 — QR gate, foundational checkout integration, and finance exception recovery

- `20261016183000_secure_ticket_redemption.sql` replaces the old QR redemption logic with **server-role-only** authorization and transaction locks in the same order as refunds (order first, ticket second). It checks staff role, paid order, matching ticket session, valid admission date in Montréal, published/open slot and active non-demo season; refunded and already-used tickets do not allow entry. No purchaser details returned.
- `tests/sql/gate-fixtures.sql` and `gate-assertions.sql` verify role denial, unpaid/refunded tickets, wrong dates, closed/demo sessions, first valid entry, and duplicate scans in ephemeral PostgreSQL.
- `tests/sql/checkout-integration-fixtures.sql` and `checkout-integration-assertions.sql` now apply the **actual 20261014190000 foundational checkout migration** to a second disposable database, verifying CAD prices/taxes, atomic holds, pending checkout, Stripe session match, paid ticket issue and random QR, webhook replay, cancellation and preventing oversell. This is more complete than the earlier guard-only mock fixture; it still does not prove an authorized Supabase/Stripe E2E.
- `20261016193000_financial_event_review_ledger.sql` keeps an idempotent, service-role-only record of Stripe partial refunds, ambiguous refunds, and disputes. Signed financial webhook events are acknowledged only once this ledger is durably written, not merely printed to logs. A private read-only dashboard was added at `/operations/reviews`, with `GET /api/operations/financial-reviews` requiring verified JWT and role ADMIN/SUPER_ADMIN. No live refund is initiated by the page.
- GitHub tests at `cd56a534`: `38956304449` (application) and `38956304352` (PostgreSQL guards, gate, foundation and finance) **both successful**.
- **Deployment:** the newest Vercel deployment confirmed READY at document-authoring time is `dpl_HGJMfSNBZnrYWuHhoyAiumDgQgxx` for commit `41871005`; later commits, including `cd56a534`, are pushed to `main` but a matching READY deployment has not yet been observed. Do not claim updated public release until the exact SHA and HTTPS response are checked.

### Remaining hard blocks
Canonical public domain is unverified (`festiice.ca` vs `festi-ice.ca`) and browser access was unavailable during checks. The configured Vercel project had no FESTI-ICE service environment variables in its inspected metadata. The Supabase code ref `xsozkxcnjmyjjaorkxlx` is different from the connected `FESTI ICE` project ref `anyiaszbjsyrxfgjbwdt` (reported empty). The TAKATAK master entitlement integration and Stripe/Resend real test payments remain incomplete. **Sales remain OFF.**
