import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const READ = new Set(["SUPERVISOR", "OPERATIONS", "ADMIN", "SUPER_ADMIN"]);
const WRITE = new Set(["OPERATIONS", "ADMIN", "SUPER_ADMIN"]);
const ChangeSchema = z.object({
  slotId: z.string().uuid(),
  status: z.enum(["OPEN","CLOSED"]),
  reason: z.string().trim().min(10).max(500),
}).strict();

async function authorized(request: Request, canWrite: boolean) {
  const ref = process.env["FESTIICE_APPROVED_SUPABASE_PROJECT_REF"];
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!ref || !/^[a-z0-9]{20}$/.test(ref) ||
      url !== "https://" + ref + ".supabase.co" || !key)
    return { response: new Response("Unavailable", { status: 503 }) };
  const token = request.headers.get("authorization");
  if (!token?.startsWith("Bearer ") || token.length > 4096)
    return { response: new Response("Unauthorized", { status: 401 }) };
  const db = createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: { fetch: (input,init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === "Bearer " + key)
        headers.delete("Authorization");
      headers.set("apikey",key);
      return fetch(input,{...init,headers});
    }},
  });
  const { data: auth, error: authError } = await db.auth.getUser(token.slice(7));
  if (authError || !auth.user) return { response: new Response("Unauthorized", { status: 401 }) };
  const { data: roles, error: roleError } = await db.from("user_roles")
    .select("role").eq("user_id",auth.user.id);
  if (roleError) return { response: new Response("Unavailable", { status: 503 }) };
  const accepted = canWrite ? WRITE : READ;
  if (!(roles ?? []).some(x => accepted.has(x.role)))
    return { response: new Response("Forbidden", { status: 403 }) };
  return { db, userId: auth.user.id };
}

export const Route = createFileRoute("/api/operations/sessions")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const gate = await authorized(request,false);
          if (gate.response) return gate.response;
          const today = new Date().toLocaleDateString("en-CA", {
            timeZone: "America/Toronto",year:"numeric",month:"2-digit",day:"2-digit",
          });
          const { data: days, error: daysError } = await gate.db!.from("event_dates")
            .select("id,event_date,published,status,is_test,season_id")
            .gte("event_date",today).order("event_date").limit(90);
          if (daysError) throw daysError;
          const ids = (days ?? []).map(day => day.id);
          if (!ids.length)
            return Response.json({ days:[], slots:[] }, { headers: { "Cache-Control":"no-store" } });
          const { data: slots, error: slotsError } = await gate.db!.from("time_slots")
            .select("id,event_date_id,start_time,capacity,published,status")
            .in("event_date_id",ids).order("start_time").limit(1000);
          if (slotsError) throw slotsError;
          return Response.json({ days, slots }, {
            headers: { "Cache-Control":"no-store","X-Content-Type-Options":"nosniff" },
          });
        } catch {
          return new Response("Operational data unavailable", { status: 503 });
        }
      },
      PATCH: async ({ request }) => {
        if (request.headers.get("origin") !== process.env["FESTIICE_CANONICAL_ORIGIN"] ||
          !request.headers.get("content-type")?.startsWith("application/json"))
          return new Response("Forbidden", { status: 403 });
        try {
          const gate = await authorized(request,true);
          if (gate.response) return gate.response;
          if (Number(request.headers.get("content-length") ?? "0") > 4096)
            return new Response("Too large", { status: 413 });
          const raw = await request.text();
          if (raw.length > 4096) return new Response("Too large", { status: 413 });
          const parsed = ChangeSchema.safeParse(JSON.parse(raw));
          if (!parsed.success)
            return Response.json({ error:"Invalid operational update" }, { status: 400 });
          const { data, error } = await gate.db!.rpc("set_slot_operational_status", {
            _slot_id:parsed.data.slotId,
            _actor:gate.userId!,
            _status:parsed.data.status,
            _reason:parsed.data.reason,
          });
          if (error) {
            console.error("[ops] slot update denied",error.code);
            return new Response("Update denied; verify event and privileges", { status: 409 });
          }
          return Response.json(data, { headers: { "Cache-Control":"no-store" } });
        } catch {
          return new Response("Operational update unavailable", { status: 503 });
        }
      },
    },
  },
});
