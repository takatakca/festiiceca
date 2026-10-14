# FESTI-ICE — Agent handoff

**As of:** 2026-10-14 (America/Toronto)
**Repository/branch:** `takatakca/festiiceca` / `main`
**Last known successful pre-session commit:** `bb9123e8d731f1655cbc23c7191df0cdcfb4cb2f`.
**Current task:** establish safe, server-authoritative ticket checkout in code while leaving sales disabled until the official Supabase database and Stripe environment are verified.
**Previous completed task:** `bb9123e8` — CI green and Coolify packaging documented in `WORKLOG.md`.
**Current session changes:** these project-status, queue, deployment, decisions and handoff documents; subsequent work and final commit are recorded in the latest `WORKLOG.md` entry.

## Verification already performed
- GitHub `main` ref, recursive tree, last 12 commits, open PRs/issues, and last 10 CI runs inspected via the connected GitHub tools.
- CI for base SHA `bb9123e8d731` completed successfully: install, lint (with Prettier rule excluded), Nitro SSR build.
- Checked `AGENTS.md`, `WORKLOG.md`, `docs/PRODUCTION_RELEASE.md`, TypeScript routes, Supabase read functions and SQL migrations.
- No open PRs or issues reported by GitHub for this repository.

## Known blockers (do not conceal)
1. Supabase `supabase/config.toml` ref `xsozkxcnjmyjjaorkxlx` != connected "FESTI ICE" ref `anyiaszbjsyrxfgjbwdt`. On recovery, latter reported zero public tables. Do not apply data-destructive or production migrations to the wrong project.
2. Last attempt to reach Vercel `takatakcas-projects` was HTTP 403; production deployment unverified.
3. Canonical site domain undecided: `festiice.ca` vs `festi-ice.ca`.
4. Stripe runtime secret/webhook endpoint, operator email, and approved live date/capacities remain unverified.
5. Existing `npm ci` fails due to stale lockfile; CI temporary workaround uses `npm install`.

## Access required (no secrets in Git)
- Authorized Supabase project **reference** and migration access for the active FESTI-ICE site.
- Authorized deployment project/team or configured Coolify/MochaHost GitHub integration.
- Stripe test and live **environment secret variables** created in hosting settings (do not paste values into Git or chat); webhook secret and configured HTTPS event destination.
- Confirmed canonical domain, operations-approved event calendar, price rules and refund policy.

## Deployment status
**Not verified / no live deployment from this session.** A successful CI build is not proof of an online release. `Dockerfile.coolify` supports future staging.

## Exact next action
Read `AGENTS.md`, `WORKLOG.md`, this file and `TASK_QUEUE.md`; fetch current `main` and CI. Continue server-side checkout and DB migration from the next uncompleted task, run CI and correct errors. Reconcile actual Supabase project before applying migrations; do not enable checkout until authorization, schema and Stripe test-mode verification succeed. Recheck project/deploy SHA and update this file in the last commit of every session.
