/**
 * SEO + consent kit: the ONE settings file per site.
 *
 * Rules:
 * - Only facts already present in this repo. Never invent an address, hours, phone, rating or review.
 * - Unknown values stay `undefined` with a `TODO(owner)` comment; the JSON-LD builder skips them.
 * - `url` is the real production domain (see foodhubca/private/hosting/MOCHAHOST_DOMAINS.md), never *.lovable.app.
 */
import { support, venue } from "@/lib/festi-data";

export type SchemaType =
  "Organization" | "LocalBusiness" | "Restaurant" | "NGO" | "SportsOrganization" | "Event";

export type PostalAddress = {
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode?: string | undefined;
  addressCountry: string;
};

export type SiteConfig = {
  /** Public business name. */
  name: string;
  /** Legal name if different (TODO(owner) when unknown). */
  legalName?: string | undefined;
  /** Real production origin, no trailing slash. */
  url: string;
  /** <html lang>. French first (Québec). */
  lang: "fr-CA";
  /** Open Graph locale. */
  locale: "fr_CA";
  defaultTitle: string;
  defaultDescription: string;
  /** Default share image: path under /public or absolute URL. undefined = no og:image. */
  ogImage?: string | undefined;
  /** Logo: path under /public or absolute URL. */
  logo?: string | undefined;
  schemaType: SchemaType;
  email?: string | undefined;
  /** E.164, e.g. "+15145550000". */
  phone?: string | undefined;
  address?: PostalAddress | undefined;
  /** Real social profile URLs only (no "#", no generic facebook.com). */
  sameAs: string[];
  /** Privacy policy route, used by the cookie banner. undefined = no page yet (TODO(owner)). */
  privacyPath?: string | undefined;
  /** Law 25 privacy officer. */
  privacyOfficer: { name?: string | undefined; email?: string | undefined };
};

export const SITE: SiteConfig = {
  name: "FESTI-ICE",
  // TODO(owner): legal name of the company that runs FESTI-ICE, if different.
  legalName: undefined,
  url: "https://festiice.ca",
  lang: "fr-CA",
  locale: "fr_CA",
  // Existing French title and description of the site (src/routes/__root.tsx).
  defaultTitle: "FESTI-ICE — Patinez dans la lumière | Havana Resort, Maricourt",
  defaultDescription:
    "FESTI-ICE : un parcours sur glace illuminé au cœur du Havana Resort, à Maricourt. Musique, lumière et hiver québécois, pour toute la famille.",
  // Real FESTI-ICE + Havana Resort logo already in public/ (2048x682).
  // TODO(owner): a 1200x630 share image (photo of the site) would display better.
  ogImage: "/festi-ice-logo.jpeg",
  logo: "/festi-ice-logo.jpeg",
  // Ticketed attraction at a fixed place (Havana Resort). No Event node: no event dates are published yet.
  schemaType: "LocalBusiness",
  // TODO(owner): the contact email uses festi-ice.ca (with a hyphen) but the site is festiice.ca. Confirm.
  email: support.festiIce.email,
  // The only phone in the repo is the Havana Resort one (accommodation), not a FESTI-ICE number.
  phone: undefined,
  // Venue address from src/lib/festi-data.ts.
  address: {
    streetAddress: venue.address,
    addressLocality: "Maricourt",
    addressRegion: "QC",
    postalCode: venue.postalCode,
    addressCountry: "CA",
  },
  // TODO(owner): real FESTI-ICE social profile URLs, if any.
  sameAs: [],
  // TODO(owner): no privacy policy page yet (Law 25). Add one, then set its path here.
  privacyPath: undefined,
  // TODO(owner): name + email of the person responsible for personal information (Law 25).
  privacyOfficer: { name: undefined, email: undefined },
};
