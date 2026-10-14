# FESTI-ICE — Project status
Last assessed: 2026-10-14 (America/Toronto). Repository: `takatakca/festiiceca`, default/deployment branch: `main`.

## Implemented in `main`
- React 19 / TanStack Start SSR, responsive French-first homepage, route visual, media, FAQ, program concepts, ticket estimator, public Supabase reads.
- Database schema migrations checked into source for seasons, published sessions, ticket types, holds, orders, payments, QR tickets, staffing roles, and the subsequent service-role-only permission patch.
- The estimate screen does not pretend to charge money. No simulated order/payment success is shown.
- GitHub Actions CI: installs, checks semantic lint, and builds SSR. Successful at base commit `bb9123e8d731`.
- Self-hosted `Dockerfile.coolify` is present, but no verified deploy has been performed.

## Not yet production-complete
- Authoritative Supabase database not identified: repo's `supabase/config.toml` uses `xsozkxcnjmyjjaorkxlx`, whereas connected "FESTI ICE" `anyiaszbjsyrxfgjbwdt` was recovered and had **zero public tables** at inspection. Do not migrate or point production at it merely because the name matches.
- No verified Stripe Checkout/webhook fulfillment flow, ticket delivery, staff scanner, refund or weather rebooking lifecycle, staffed admin UX, or authenticated account flow.
- No verified primary domain: requests/docs use both `festiice.ca` and `festi-ice.ca`.
- Vercel team `takatakcas-projects` API returned 403 in the preceding session. Not proof of live deployment.
- Legacy `package-lock.json` inconsistent with `package.json`; CI uses `npm install` rather than `npm ci`. Legacy Prettier issues are excluded from semantic lint. Reconcile both before final release.

**Launch status: NOT VERIFIED; checkout must remain disabled until payment, stock and ticket issuance are validated in an authorized production environment.**

See `TASK_QUEUE.md` and `PRODUCTION_RELEASE.md` for work and release gates.
