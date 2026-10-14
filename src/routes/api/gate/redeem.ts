import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const ScannerRequest = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i),
}).strict();
const STAFF = new Set(["GATE_STAFF", "SUPERVISOR", "OPERATIONS", "ADMIN", "SUPER_ADMIN"]);

export const Route = createFileRoute("/api/gate/redeem")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ref = process.env["FESTIICE_APPROVED_SUPABASE_PROJECT_REF"];
        const url = process.env["SUPABASE_URL"];
        const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
        const allowedOrigin = process.env["FESTIICE_CANONICAL_ORIGIN"];
        if (!ref || !url || url !== "https://" + ref + ".supabase.co" ||
          !serviceKey || !allowedOrigin) return new Response("Service unavailable", { status: 503 });
        if (request.headers.get("origin") !== allowedOrigin ||
          !request.headers.get("content-type")?.startsWith("application/json"))
          return new Response("Forbidden", { status: 403 });
        const authorization = request.headers.get("authorization") ?? "";
        if (!authorization.startsWith("Bearer ") || authorization.length > 4096)
          return new Response("Unauthorized", { status: 401 });
        try {
          const admin = createClient(url, serviceKey, {
            auth: { storage: undefined, autoRefreshToken: false, persistSession: false },
            global: { fetch: (input, init) => {
              const headers = new Headers(init?.headers);
              if (serviceKey.startsWith("sb_") &&
                headers.get("Authorization") === "Bearer " + serviceKey)
                headers.delete("Authorization");
              headers.set("apikey", serviceKey);
              return fetch(input, { ...init, headers });
            }},
          });
          const { data: auth, error: userError } =
            await admin.auth.getUser(authorization.slice("Bearer ".length));
          if (userError || !auth.user) return new Response("Unauthorized", { status: 401 });
          const { data: roles, error: roleError } = await admin.from("user_roles")
            .select("role").eq("user_id", auth.user.id);
          if (roleError) return new Response("Unavailable", { status: 503 });
          if (!(roles ?? []).some(r => STAFF.has(r.role)))
            return new Response("Forbidden", { status: 403 });
          const body = await request.text();
          if (body.length > 512) return new Response("Too large", { status: 413 });
          const parsed = ScannerRequest.safeParse(JSON.parse(body));
          if (!parsed.success) return new Response("Invalid QR", { status: 400 });
          const { data: result, error: redeemError } = await admin.rpc("redeem_ticket", {
            _qr_token: parsed.data.token.toLowerCase(), _scanner: auth.user.id,
          });
          if (redeemError) {
            console.error("[gate] redeem failed", redeemError.code);
            return new Response("Scanner unavailable", { status: 503 });
          }
          // Never include email, contact details, or the QR token in the response/log.
          const data = result as { result?: string; ticket_type?: string; scanned_at?: string };
          return Response.json({
            result: data.result === "VALID" ? "VALID" :
              data.result === "ALREADY_USED" ? "ALREADY_USED" : "INVALID",
            ticketType: data.ticket_type ?? null,
            scannedAt: data.scanned_at ?? null,
          }, { headers: { "Cache-Control": "no-store" } });
        } catch {
          return new Response("Scanner unavailable", { status: 503 });
        }
      },
    },
  },
});
