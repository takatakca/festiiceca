# Work log

Newest first, one line per piece of work. Rule: `AGENTS.md` › Work log rule.
Format: `YYYY-MM-DD | agent | branch → PR | status | what | next step`

- 2026-10-16 | GPT-6 (GitHub/Vercel) | main → direct | done: critical deployment fixes; blocked: public domain and checkout acceptance | Separated paid webhook fulfillment from sales switch, added readiness regression tests, fixed CVE-2026-102989 TanStack dependencies, regenerated npm/Bun lockfiles, fixed Vercel SSR preset/config, obtained READY deploy at 0114b084, added /api/health at dd5e65e1; docs refreshed | confirm newest CI/deploy SHA, public custom DNS and HTTPS, verify authoritative Supabase project and staged real Stripe/Resend/scanner tests before opening sales

- 2026-10-14 | GPT-6 (reprise) | main → direct | done (code; live sales blocked) | Added five handoff documents, guarded Stripe/RPC/QR/email/scanner backend, capacity, gated checkout, and green build | October 16 handoff below

- 2026-10-14 | GPT-6 (GitHub agent) | main → direct | blocked: production deployment (Vercel team HTTP 403; Supabase project ID mismatch; Stripe payment/QR integration pending) | Merged ticket-RPC security fix, connected published date/price catalogue, removed simulated payments, added SSR fallback, green CI and Coolify Dockerfile | reconcile authoritative Supabase project and domain; configure Coolify/GitHub hook; finish Stripe webhooks, capacity, QR/scanner/admin, then release after verification

- 2026-10-08 | claude (owner setup) | default branch | done | Added the work log rule, this log and the stop reminder | every agent follows AGENTS.md › Work log rule
