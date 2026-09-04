import { createContext, useContext, type ReactNode } from "react";
import {
  accommodations as staticAccommodations,
  faq as staticFaq,
  programs as staticPrograms,
  routeSegments as staticRouteSegments,
  season as staticSeason,
} from "@/lib/festi-data";
import type { SiteContent } from "@/lib/content.functions";

export type ResolvedContent = {
  season: { label: string; isInauguralSeason: boolean };
  status: SiteContent["status"];
  routeSegments: typeof staticRouteSegments;
  programs: typeof staticPrograms;
  faq: typeof staticFaq;
  accommodations: typeof staticAccommodations;
};

const fallback: ResolvedContent = {
  season: {
    label: staticSeason.label,
    isInauguralSeason: staticSeason.isInauguralSeason,
  },
  status: null,
  routeSegments: staticRouteSegments,
  programs: staticPrograms,
  faq: staticFaq,
  accommodations: staticAccommodations,
};

/** Backend content wins whenever it has rows; static data is the safety net. */
export function resolveContent(content: SiteContent | null | undefined): ResolvedContent {
  if (!content) return fallback;
  return {
    season: content.season ?? fallback.season,
    status: content.status,
    routeSegments: content.routeSegments.length
      ? content.routeSegments
      : fallback.routeSegments,
    programs: content.programs.length ? content.programs : fallback.programs,
    faq: content.faq.length ? content.faq : fallback.faq,
    accommodations: content.accommodations.length
      ? content.accommodations
      : fallback.accommodations,
  };
}

const ContentContext = createContext<ResolvedContent>(fallback);

export function SiteContentProvider({
  value,
  children,
}: {
  value: ResolvedContent;
  children: ReactNode;
}) {
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useSiteContent(): ResolvedContent {
  return useContext(ContentContext);
}
