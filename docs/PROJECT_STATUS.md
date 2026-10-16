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
