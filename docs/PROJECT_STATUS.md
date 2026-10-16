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
