import { createFileRoute } from "@tanstack/react-router";

/**
 * Public health probe: no customer data, credentials or database internals.
 * A 200 means the SSR/API handler is serving requests, NOT that checkout
 * or Supabase/Stripe integrations have been verified.
 */
export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(
          {
            ok: true,
            service: "festiice",
            deploymentSha:
              process.env["VERCEL_GIT_COMMIT_SHA"] ??
              process.env["APP_GIT_SHA"] ??
              null,
          },
          {
            headers: {
              "Cache-Control": "no-store",
              "X-Content-Type-Options": "nosniff",
            },
          },
        ),
    },
  },
});
