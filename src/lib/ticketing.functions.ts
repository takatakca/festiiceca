/**
 * Read-only public ticketing catalogue. A published event date with a published
 * OPEN slot is the ONLY source for the customer calendar; static concept
 * programming is never a sales calendar.
 *
 * This endpoint deliberately never creates holds, orders, payments or tickets.
 * Those require a separate server-authoritative checkout and Stripe webhooks.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { TicketType } from "@/lib/festi-data";

export type PublicTicketing = {
  dates: { date: string; slots: { id: string; startTime: string; remaining: number }[] }[];
  ticketTypes: TicketType[];
  flexOption: { nameFr: string; descriptionFr: string; priceCents: number } | null;
  checkoutEnabled: boolean;
};

const EMPTY: PublicTicketing = { dates: [], ticketTypes: [], flexOption: null, checkoutEnabled: false };

export const getPublicTicketing = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicTicketing> => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return EMPTY;

    try {
      const supabase = createClient<Database>(url, key, {
        auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (input, init) => {
            const headers = new Headers(init?.headers);
            if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
              headers.delete("Authorization");
            }
            headers.set("apikey", key);
            return fetch(input, { ...init, headers });
          },
        },
      });
      const season = await supabase
        .from("seasons")
        .select("id")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (season.error || !season.data) return EMPTY;

      // Québec local date, not UTC (the event is in Maricourt).
      const today = new Date().toLocaleDateString("en-CA", {
        timeZone: "America/Toronto",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      const [dateResult, priceResult] = await Promise.all([
        supabase
          .from("event_dates")
          .select("id, event_date")
          .eq("season_id", season.data.id)
          .eq("published", true)
          .eq("is_test", false)
          .eq("status", "OPEN")
          .gte("event_date", today)
          .order("event_date")
          .limit(120),
        supabase
          .from("ticket_types")
          .select("code, name_fr, description_fr, price_cents, minimum_quantity, maximum_quantity, maximum_adults, minimum_group_size, counts_as_adult, is_addon, sort_order")
          .eq("season_id", season.data.id)
          .eq("active", true)
          .order("sort_order"),
      ]);
      if (dateResult.error || priceResult.error) {
        console.error("[ticketing] public catalogue query failed");
        return EMPTY;
      }

      const eventDates = dateResult.data ?? [];
      const slotResult = eventDates.length
        ? await supabase
            .from("time_slots")
            .select("id, event_date_id, start_time")
            .in("event_date_id", eventDates.map((d) => d.id))
            .eq("published", true)
            .eq("status", "OPEN")
            .order("start_time")
        : null;
      if (slotResult?.error) {
        console.error("[ticketing] published sessions query failed");
        return EMPTY;
      }

      const prices = priceResult.data ?? [];
      // Capacity must be read by the trusted server. An unavailable capacity
      // service fails CLOSED rather than pretending every published slot has seats.
      const { paymentConfigured, getPublishedRemainingCapacity } = await import("@/lib/checkout.server");
      const capacity = await getPublishedRemainingCapacity();
      const flex = prices.find((p) => p.code === "FLEX_WEATHER" && p.is_addon);
      return {
        checkoutEnabled: paymentConfigured() && eventDates.some((date) =>
          (slotResult?.data ?? []).some((slot) => slot.event_date_id === date.id &&
            (capacity.get(slot.id) ?? 0) > 0)),
        dates: eventDates.map((d) => ({
          date: d.event_date,
          slots: (slotResult?.data ?? [])
            .filter((slot) => slot.event_date_id === d.id && (capacity.get(slot.id) ?? 0) > 0)
            .map((slot) => ({ id: slot.id, startTime: slot.start_time, remaining: capacity.get(slot.id)! })),
        })),
        ticketTypes: prices.filter((p) => !p.is_addon).map((p) => ({
          id: p.code,
          code: p.code,
          nameFr: p.name_fr,
          descriptionFr: p.description_fr ?? "",
          priceCents: p.price_cents,
          minimumQuantity: p.minimum_quantity,
          maximumQuantity: p.maximum_quantity,
          maximumAdults: p.maximum_adults ?? undefined,
          minimumGroupSize: p.minimum_group_size ?? undefined,
          countsAsAdult: p.counts_as_adult,
          active: true,
          sortOrder: p.sort_order,
          pricingMode: "FIXED" as const,
        })),
        flexOption: flex ? {
          nameFr: flex.name_fr,
          descriptionFr: flex.description_fr ?? "",
          priceCents: flex.price_cents,
        } : null,
      };
    } catch (error) {
      console.error("[ticketing] unable to load public catalogue", error);
      return EMPTY;
    }
  },
);
