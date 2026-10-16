import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

/** Finance is restricted more tightly than session operations. No public read. */
const FINANCE_ROLES = new Set(["ADMIN","SUPER_ADMIN"]);
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
  },
});
