# FESTI-ICE — Architecture / decision record
2026-10-14

1. **GitHub primary:** `takatakca/festiiceca` `main`; incremental commits, no destructive pushes. Respect `AGENTS.md` and existing design; do not restart the app.
2. **Business identity:** One continuous illuminated skating experience through Havana Resort in Maricourt. No invented multiple worlds, distances, opening dates or fabricated live availability.
3. **Separate product:** FESTI-ICE public UI stays independent of GROUPE TAKATAK dashboard. TAKATAK master identity may integrate later through scoped entitlements and APIs; merchant/order data remains tenant-contained, never leaked cross-product.
4. **Authoritative data:** Actual published seasons, ticket types and session capacities must come from verified Supabase, not frontend fallback arrays. Customer checkout amounts always recalculated server-side in CAD integer cents.
5. **Safe ticket sales:** Default closed until Stripe secret + webhook configuration + DB migrations + valid origin + explicit `FESTIICE_CHECKOUT_ENABLED=true` and integration checks. No fake payment success paths.
6. **Security:** No client service-role secret, SQL SECURITY DEFINER RPC calls limited to server role, verify Stripe webhook signatures and use idempotent durable DB processing. QR tokens are secrets.
7. **Deployment:** GitHub CI green is not production. Existing Coolify Docker packaging is optional; target and canonical domain need real verification.
8. **Compatibility:** Keep legacy npm and bun locks until reconciled in dedicated work. CI presently uses npm-install and semantic ESLint due pre-existing generated formatting drift; track technical debt rather than disguising it.
