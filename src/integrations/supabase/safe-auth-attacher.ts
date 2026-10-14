/**
 * Public SSR is available without a configured Supabase connection.
 * This client-side middleware only ATTACHES a token when it exists.
 * Server-side requireSupabaseAuth and staff-role checks still enforce access.
 */
import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./client";

export const safeAttachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const url = import.meta.env["VITE_SUPABASE_URL"] ||
      (typeof process !== "undefined" ? process.env["SUPABASE_URL"] : undefined);
    const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
      (typeof process !== "undefined" ? process.env["SUPABASE_PUBLISHABLE_KEY"] : undefined);
    if (!url || !key) return next({ headers: {} });
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      return next({ headers: token ? { Authorization: "Bearer " + token } : {} });
    } catch {
      // A public server function remains anonymous. Protected functions reject
      // missing/invalid tokens independently on the server.
      return next({ headers: {} });
    }
  },
);
