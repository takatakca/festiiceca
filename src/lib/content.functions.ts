/**
 * Public, read-only site content served from Lovable Cloud.
 *
 * Shapes intentionally mirror `@/lib/festi-data` so the UI can consume either
 * source. Static data stays as the fallback when the backend has no content.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Program, RouteSegment, FaqGroup } from "@/lib/festi-data";

export type SiteContent = {
  season: { label: string; isInauguralSeason: boolean } | null;
  status: {
    eventStatus: string;
    iceCondition: string;
    routeStatus: string;
    messageFr: string | null;
  } | null;
  routeSegments: RouteSegment[];
  programs: Program[];
  faq: FaqGroup[];
  accommodations: { count: number; label: string }[];
};

const DAYS_SHORT = ["", "LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];

function splitSubtitle(subtitle: string | null): {
  dayLong: string;
  start: string;
  end: string;
} {
  const [day = "", times = ""] = (subtitle ?? "").split("·").map((s) => s.trim());
  const [start = "", end = ""] = times.split("–").map((s) => s.trim());
  return { dayLong: day, start, end };
}

export const getSiteContent = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteContent> => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const url = process.env["SUPABASE_URL"]!;
    const supabase = createClient<Database>(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const empty: SiteContent = {
      season: null,
      status: null,
      routeSegments: [],
      programs: [],
      faq: [],
      accommodations: [],
    };

    try {
      const [seasonRes, segRes, progRes, faqRes, accRes, statusRes] = await Promise.all([
        supabase
          .from("seasons")
          .select("id, name_fr, is_inaugural")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle(),
        supabase
          .from("route_segments")
          .select(
            "id, slug, sort_order, name_fr, street_name, description_fr, music_style, lighting_style, accent_color, background_color",
          )
          .order("sort_order"),
        supabase
          .from("programs")
          .select("id, slug, title_fr, subtitle_fr, description_fr, music_genre, sort_order")
          .order("sort_order"),
        supabase
          .from("faqs")
          .select("group_fr, question_fr, answer_fr, sort_order")
          .order("sort_order"),
        supabase
          .from("accommodations")
          .select("name_fr, unit_count, sort_order")
          .order("sort_order"),
        supabase
          .from("operational_status")
          .select("event_status, ice_condition, route_status, public_message_fr, effective_from")
          .order("effective_from", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const faqGroups: FaqGroup[] = [];
      for (const row of faqRes.data ?? []) {
        let group = faqGroups.find((g) => g.group === row.group_fr);
        if (!group) {
          group = { group: row.group_fr, items: [] };
          faqGroups.push(group);
        }
        group.items.push({ q: row.question_fr, a: row.answer_fr });
      }

      return {
        season: seasonRes.data
          ? {
              label: seasonRes.data.name_fr.replace(/^Saison\s+/i, ""),
              isInauguralSeason: seasonRes.data.is_inaugural,
            }
          : null,
        status: statusRes.data
          ? {
              eventStatus: statusRes.data.event_status,
              iceCondition: statusRes.data.ice_condition,
              routeStatus: statusRes.data.route_status,
              messageFr: statusRes.data.public_message_fr,
            }
          : null,
        routeSegments: (segRes.data ?? []).map((s) => ({
          id: s.id,
          order: s.sort_order,
          name: s.name_fr,
          street: s.street_name ?? "",
          descriptionFr: s.description_fr ?? "",
          musicStyle: s.music_style ?? "",
          lightingStyle: s.lighting_style ?? "",
          accent: s.accent_color ?? "oklch(0.82 0.14 205)",
          background: s.background_color ?? "oklch(0.15 0.05 259)",
        })),
        programs: (progRes.data ?? []).map((p) => {
          const { dayLong, start, end } = splitSubtitle(p.subtitle_fr);
          return {
            dayIndex: p.sort_order,
            dayShortFr: DAYS_SHORT[p.sort_order] ?? dayLong.slice(0, 3).toUpperCase(),
            dayLongFr: dayLong,
            title: p.title_fr,
            styles: p.music_genre ?? "",
            startTime: start,
            endTime: end,
            note: p.description_fr ?? "",
            familyFriendly: true,
            recommendedAge: "Tout âge",
            status: "AVAILABLE" as const,
          };
        }),
        faq: faqGroups,
        accommodations: (accRes.data ?? []).map((a) => ({
          count: a.unit_count,
          label: a.name_fr,
        })),
      };
    } catch (error) {
      console.error("[content] failed to load site content", error);
      return empty;
    }
  },
);
