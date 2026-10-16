import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

/** Finance is restricted more tightly than session operations. No public read. */
const FINANCE_ROLES = new Set(["ADMIN","SUPER_ADMIN"]);
const ResolvePayload = z.object({
  reviewId: z.string().uuid(),
  resolution: z.enum(["REVIEWED", "DISMISSED"]),
  reason: z.string().trim().min(10).max(500),
}).strict();

export const Route = createFileRoute("/api/operations/financial-reviews")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const ref = process.env["FESTIICE_APPROVED_SUPABASE_PROJECT_REF"];
        const url = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
        if (!ref || !/^[a-z0-9]{20}$/.test(ref) ||
            url !== "https://" + ref + ".supabase.co" || !key) {
          return new Response("Not configured", { status: 503 });
        }
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ") || authHeader.length > 4096)
          return new Response("Unauthorized", { status: 401 });
        try {
          const db = createClient(url, key, {
            auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
            global: { fetch: (input, init) => {
              const headers = new Headers(init?.headers);
              if (key.startsWith("sb_") &&
                  headers.get("Authorization") === "Bearer " + key)
                headers.delete("Authorization");
              headers.set("apikey", key);
              return fetch(input, { ...init, headers });
            }},
          });
          const { data: auth, error: authError } =
            await db.auth.getUser(authHeader.slice("Bearer ".length));
          if (authError || !auth.user) return new Response("Unauthorized", { status: 401 });
          const { data: roles, error: rolesError } = await db.from("user_roles")
            .select("role").eq("user_id",auth.user.id);
          if (rolesError) return new Response("Unavailable", { status: 503 });
          if (!(roles ?? []).some(r=>FINANCE_ROLES.has(r.role)))
            return new Response("Forbidden", { status: 403 });
          const { data, error } = await db.from("financial_event_reviews")
            .select("id,provider_event_id,event_type,payment_intent_id,amount_cents,category,status,created_at")
            .eq("status","OPEN").order("created_at",{ascending:false}).limit(100);
          if (error) {
            console.error("[finance] review query failed",error.code);
            return new Response("Unavailable", { status: 503 });
          }
          return Response.json({ reviews: data ?? [] }, {
            headers: {
              "Cache-Control":"private,no-store",
              "X-Content-Type-Options":"nosniff",
            },
          });
        } catch {
          return new Response("Unavailable", { status: 503 });
        }
      },
    },
      PATCH: async ({ request }) => {
        // Default CLOSED: legacy local Supabase roles are not enough to
        // authorize a financial write in GROUPE TAKATAK production.
        if (process.env["FESTIICE_FINANCE_REVIEW_WRITES_ENABLED"] !== "true")
          return new Response("Financial updates disabled", { status: 503 });
        const origin = process.env["FESTIICE_CANONICAL_ORIGIN"];
        if (!origin || request.headers.get("origin") !== origin ||
          !request.headers.get("content-type")?.startsWith("application/json"))
          return new Response("Forbidden", { status: 403 });
        const ref = process.env["FESTIICE_APPROVED_SUPABASE_PROJECT_REF"];
        const url = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
        if (!ref || !/^[a-z0-9]{20}$/.test(ref) ||
          url !== "https://" + ref + ".supabase.co" || !key)
          return new Response("Unavailable", { status: 503 });
        const bearer = request.headers.get("authorization");
        if (!bearer?.startsWith("Bearer ") || bearer.length > 4096)
          return new Response("Unauthorized", { status: 401 });
        if (Number(request.headers.get("content-length") ?? "0") > 4096)
          return new Response("Too large", { status: 413 });
        let input: z.infer<typeof ResolvePayload>;
        try {
          const raw = await request.text();
          if (raw.length > 4096) return new Response("Too large", { status: 413 });
          const parsed = ResolvePayload.safeParse(JSON.parse(raw));
          if (!parsed.success)
            return new Response("Invalid review decision", { status: 400 });
          input = parsed.data;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        try {
          const admin = createClient(url, key, {
            auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
            global: { fetch: (resource, opts) => {
              const headers = new Headers(opts?.headers);
              if (key.startsWith("sb_") &&
                  headers.get("Authorization") === "Bearer " + key)
                headers.delete("Authorization");
              headers.set("apikey", key);
              return fetch(resource, { ...opts, headers });
            }},
          });
          const { data: auth, error: authError } = await admin.auth.getUser(bearer.slice(7));
          if (authError || !auth.user)
            return new Response("Unauthorized", { status: 401 });
          const { data: roles, error: roleError } = await admin.from("user_roles")
            .select("role").eq("user_id", auth.user.id);
          if (roleError) return new Response("Unavailable", { status: 503 });
          if (!(roles ?? []).some(role => FINANCE_ROLES.has(role.role)))
            return new Response("Forbidden", { status: 403 });
          const { data, error } = await admin.rpc("resolve_financial_review", {
            _review_id: input.reviewId,
            _actor: auth.user.id,
            _resolution: input.resolution,
            _reason: input.reason,
          });
          if (error) {
            console.error("[finance] denied review resolution", error.code);
            return new Response("Review update rejected", { status: 409 });
          }
          return Response.json(data, {
            headers: { "Cache-Control": "private,no-store" },
          });
        } catch {
          return new Response("Review service unavailable", { status: 503 });
        }
      },
  },
});
