# FESTI-ICE — Prioritized execution queue
Updated: 2026-10-14. Mark items done only after observable verification.

| Priority | State | Task | Completion proof |
| --- | --- | --- | --- |
| P0 | BLOCKED: authoritative project unknown | Determine which Supabase project is serving the active website. Verify migration history, RLS, grants, data and backups before writing. | Project ref, schema and migration checks documented without secrets. |
| P0 | IN PROGRESS | Implement transactional Stripe checkout using server-validated DB ticket types, short-lived atomic holds, hosted payment redirect and webhook fulfillment. | Integration tests + Stripe test events + no oversell/idempotent ticket issuing. |
| P0 | BLOCKED: Vercel 403 | Identify canonical domain and authorized target host (Vercel, MochaHost or Coolify/Contabo). | Host access, HTTPS, DNS, exact deploy SHA and rollback verified. |
| P1 | TODO | QR ticket delivery, resend, cryptographically strong codes, duplicate scan protection and staff-specific auth. | End-to-end paid/test order, email received, scanner rejects second scan. |
| P1 | TODO | Back office for seasons, sessions, slot capacity, ticket prices, operations, weather status, sales and refund handling. | Role-based write/read/deny test matrix. |
| P1 | TODO | Improve public availability: server remaining capacity, near sellout, operational notices, no simulated programming. | DB-driven dates, slots, statuses. |
| P2 | TODO | French/English complete UI, accessible focus/keyboard interactions and verified media optimization. | Mobile + accessibility acceptance. |
| P2 | TODO | Lockfile reconciliation, formatting baseline, unit+integration+E2E CI and deployment pipeline. | Reproducible build and protected deploy. |
| P2 | TODO | Analytics by opt-in, SEO review, transactional support policies and season lifecycle. | Production acceptance checklist. |

Avoid parallel duplicate work: claim a task in `WORKLOG.md` first. Never force-push. **No fictional success messages.**
