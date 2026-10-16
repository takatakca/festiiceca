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
