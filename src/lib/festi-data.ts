/**
 * FESTI-ICE content + pricing source of truth for this pass.
 *
 * Everything here is shaped like the future database records (Season,
 * TicketType, Program, RouteSegment, ...) so it can be swapped for Lovable
 * Cloud queries without touching UI components. Money is ALWAYS integer cents.
 */

export type Locale = "fr" | "en";

export const season = {
  id: "season-2026-2027",
  label: "2026 – 2027",
  isInauguralSeason: true,
  slogan: "Patinez dans la lumière.",
  operationalStatus: "OPEN" as
    | "OPEN"
    | "OPEN_WITH_ADVISORY"
    | "PARTIAL"
    | "DELAYED"
    | "CLOSED"
    | "CANCELLED",
  advisory: "",
};

export const venue = {
  name: "Havana Resort",
  address: "631, 7e Rang",
  city: "Maricourt, QC",
  postalCode: "J0E 2L2",
  acres: 263,
  directionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=631+7e+Rang+Maricourt+QC+J0E+2L2",
  travelTimes: [
    { from: "Sherbrooke", minutes: "≈ 35 min" },
    { from: "Drummondville", minutes: "≈ 35 min" },
    { from: "Montréal / Rive-Sud", minutes: "≈ 1 h 15" },
  ],
};

export const support = {
  festiIce: { email: "info@festi-ice.ca" },
  havana: { phone: "514-774-7979", email: "info@havanaresort.ca" },
};

/** Ambiances along ONE continuous route — never called "mondes". */
export type RouteSegment = {
  id: string;
  order: number;
  name: string;
  street: string;
  descriptionFr: string;
  musicStyle: string;
  lightingStyle: string;
  /** oklch accent used by the scroll-driven ambiance transition */
  accent: string;
  background: string;
};

export const routeSegments: RouteSegment[] = [
  {
    id: "seg-latino",
    order: 1,
    name: "Calle Latina",
    street: "Rue Varadero",
    descriptionFr:
      "Le Havana reprend ses droits. Lumières chaudes, rythmes latins et une chaleur inattendue en plein hiver.",
    musicStyle: "Salsa • Reggaeton",
    lightingStyle: "Corail et ambre",
    accent: "oklch(0.74 0.15 32)",
    background: "oklch(0.19 0.055 40)",
  },
  {
    id: "seg-neon",
    order: 2,
    name: "Neon Drive",
    street: "Rue Matanzas",
    descriptionFr:
      "Une section électrique : structures lumineuses géantes, faisceaux mobiles et une glace qui pulse avec la musique.",
    musicStyle: "House • EDM",
    lightingStyle: "Néon électrique",
    accent: "oklch(0.66 0.15 285)",
    background: "oklch(0.17 0.07 288)",
  },
  {
    id: "seg-foret",
    order: 3,
    name: "Forêt animée",
    street: "Rue Cienfuegos",
    descriptionFr:
      "Des installations illuminées grandeur nature apparaissent entre les arbres. La section préférée des enfants.",
    musicStyle: "Familial • Pop",
    lightingStyle: "Sculptures lumineuses",
    accent: "oklch(0.83 0.13 180)",
    background: "oklch(0.17 0.05 200)",
  },
  {
    id: "seg-country",
    order: 4,
    name: "Rang doré",
    street: "Rue Cayo Coco",
    descriptionFr:
      "Guirlandes chaudes, feux extérieurs et une ambiance country le long du rang enneigé.",
    musicStyle: "Country • Folk",
    lightingStyle: "Ambre chaleureux",
    accent: "oklch(0.8 0.13 78)",
    background: "oklch(0.19 0.05 70)",
  },
  {
    id: "seg-final",
    order: 5,
    name: "Grand Final",
    street: "Rue Santiago de Cuba",
    descriptionFr:
      "Le tunnel de lumière et le dernier virage : blanc polaire, minuit profond et une envie immédiate de revenir.",
    musicStyle: "Anthems • 80s–2000s",
    lightingStyle: "Blanc polaire",
    accent: "oklch(0.9 0.03 220)",
    background: "oklch(0.13 0.05 259)",
  },
];

/** Weekly musical programming — labels are CMS-driven in production. */
export type Program = {
  dayIndex: number; // 1 = Monday
  dayShortFr: string;
  dayLongFr: string;
  title: string;
  styles: string;
  startTime: string;
  endTime: string;
  note: string;
  familyFriendly: boolean;
  recommendedAge: string;
  status: "AVAILABLE" | "LOW_AVAILABILITY" | "SOLD_OUT" | "CLOSED";
};

export const programs: Program[] = [
  {
    dayIndex: 4,
    dayShortFr: "JEU",
    dayLongFr: "Jeudi",
    title: "Havana Nights",
    styles: "Salsa • Reggaeton • Latin",
    startTime: "17:00",
    endTime: "21:30",
    note: "Soirée latine avec animation sur glace",
    familyFriendly: true,
    recommendedAge: "Tout âge",
    status: "AVAILABLE",
  },
  {
    dayIndex: 5,
    dayShortFr: "VEN",
    dayLongFr: "Vendredi",
    title: "Neon Friday",
    styles: "Pop • Dance • 2000s",
    startTime: "17:00",
    endTime: "22:00",
    note: "DJ en direct au cœur du parcours",
    familyFriendly: true,
    recommendedAge: "Tout âge",
    status: "LOW_AVAILABILITY",
  },
  {
    dayIndex: 6,
    dayShortFr: "SAM",
    dayLongFr: "Samedi",
    title: "Electric Ice",
    styles: "House • EDM • Dance",
    startTime: "17:00",
    endTime: "22:00",
    note: "Animation spéciale et effets lumineux étendus",
    familyFriendly: true,
    recommendedAge: "Tout âge",
    status: "AVAILABLE",
  },
  {
    dayIndex: 7,
    dayShortFr: "DIM",
    dayLongFr: "Dimanche",
    title: "Dimanche Famille",
    styles: "Familial • Pop • Québec",
    startTime: "16:30",
    endTime: "21:00",
    note: "Volume réduit, sections d'apprentissage ouvertes",
    familyFriendly: true,
    recommendedAge: "Tout âge",
    status: "AVAILABLE",
  },
];

export type PricingMode = "FIXED" | "DYNAMIC";

export type TicketType = {
  id: string;
  code: string;
  nameFr: string;
  descriptionFr: string;
  priceCents: number;
  minimumQuantity: number;
  maximumQuantity: number;
  maximumAdults?: number;
  minimumGroupSize?: number;
  countsAsAdult: boolean;
  active: boolean;
  sortOrder: number;
  pricingMode: PricingMode;
};

export const ticketTypes: TicketType[] = [
  {
    id: "tt-ga",
    code: "GENERAL",
    nameFr: "Admission générale — 13 ans et +",
    descriptionFr: "Accès au parcours illuminé pour la séance choisie.",
    priceCents: 2995,
    minimumQuantity: 0,
    maximumQuantity: 10,
    countsAsAdult: true,
    active: true,
    sortOrder: 1,
    pricingMode: "FIXED",
  },
  {
    id: "tt-senior",
    code: "SENIOR",
    nameFr: "Aîné — 65 ans et +",
    descriptionFr: "Une pièce d'identité peut être demandée à l'entrée.",
    priceCents: 2795,
    minimumQuantity: 0,
    maximumQuantity: 10,
    countsAsAdult: true,
    active: true,
    sortOrder: 2,
    pricingMode: "FIXED",
  },
  {
    id: "tt-child",
    code: "CHILD",
    nameFr: "Enfant — 2 à 12 ans",
    descriptionFr: "Doit être accompagné d'un adulte.",
    priceCents: 1795,
    minimumQuantity: 0,
    maximumQuantity: 10,
    countsAsAdult: false,
    active: true,
    sortOrder: 3,
    pricingMode: "FIXED",
  },
  {
    id: "tt-toddler",
    code: "TODDLER",
    nameFr: "Bambin — moins de 2 ans",
    descriptionFr: "Gratuit. Un billet reste requis pour la capacité.",
    priceCents: 0,
    minimumQuantity: 0,
    maximumQuantity: 4,
    countsAsAdult: false,
    active: true,
    sortOrder: 4,
    pricingMode: "FIXED",
  },
  {
    id: "tt-family",
    code: "FAMILY",
    nameFr: "Passe familiale",
    descriptionFr:
      "Tarif par billet. Minimum 3 billets, maximum 6 billets, maximum 2 adultes.",
    priceCents: 2195,
    minimumQuantity: 3,
    maximumQuantity: 6,
    maximumAdults: 2,
    countsAsAdult: false,
    active: true,
    sortOrder: 5,
    pricingMode: "FIXED",
  },
  {
    id: "tt-open",
    code: "OPEN_DATE",
    nameFr: "Billet ouvert",
    descriptionFr:
      "Valide à toute date de la saison FESTI-ICE, selon les disponibilités.",
    priceCents: 3995,
    minimumQuantity: 0,
    maximumQuantity: 10,
    countsAsAdult: true,
    active: true,
    sortOrder: 6,
    pricingMode: "FIXED",
  },
  {
    id: "tt-group",
    code: "GROUP",
    nameFr: "Groupe — 15 personnes et +",
    descriptionFr: "Tarif par personne. Minimum de 15 billets requis.",
    priceCents: 2696,
    minimumQuantity: 15,
    maximumQuantity: 60,
    minimumGroupSize: 15,
    countsAsAdult: true,
    active: true,
    sortOrder: 7,
    pricingMode: "FIXED",
  },
];

export const flexOption = {
  code: "FLEX_WEATHER",
  nameFr: "Option Flex Météo",
  priceCents: 800,
  descriptionFr:
    "8 $ par billet. Un seul changement de date ou d'heure, selon les disponibilités. Si la nouvelle séance coûte plus cher, la différence est payable. Ajoutable uniquement à l'achat.",
};

export const taxes = [
  { code: "TPS", rate: 0.05 },
  { code: "TVQ", rate: 0.09975 },
];

export const timeSlots = [
  "17:00",
  "17:15",
  "17:30",
  "17:45",
  "18:00",
  "18:15",
  "18:30",
  "19:00",
  "19:15",
  "19:30",
  "19:45",
  "20:00",
  "20:15",
  "20:30",
];

/** Only confirmed practical information is published. */
export const practicalInfo: { label: string; value: string }[] = [
  { label: "Saison", value: "Hiver 2026 – 2027" },
  { label: "Lieu", value: "Havana Resort, Maricourt (QC) J0E 2L2" },
  { label: "Stationnement", value: "Sur place, gratuit" },
  { label: "Âge", value: "Tout âge — expérience familiale" },
  { label: "Activité", value: "Patinage extérieur sur parcours illuminé" },
  { label: "Ambiance", value: "Musique différente selon la soirée" },
  { label: "Météo", value: "Événement extérieur — habillez-vous chaudement" },
  { label: "Billetterie", value: "En ligne, par séance d'arrivée" },
];

export const accommodations = [
  { count: 15, label: "Chalets quatre-saisons" },
  { count: 8, label: "Coolbox" },
  { count: 14, label: "Cabanas" },
  { count: 5, label: "Villas" },
  { count: 6, label: "Condos / hôtel" },
];

export type FaqGroup = { group: string; items: { q: string; a: string }[] };

export const faq: FaqGroup[] = [
  {
    group: "Billets",
    items: [
      {
        q: "Où acheter mes billets ?",
        a: "Directement sur festi-ice.ca. Vous choisissez la date, la séance d'arrivée et vos billets, puis vous recevez vos billets QR par courriel.",
      },
      {
        q: "Dois-je imprimer mon billet ?",
        a: "Non. Le code QR reçu par courriel est suffisant, directement sur votre téléphone.",
      },
      {
        q: "Les bambins de moins de 2 ans sont-ils gratuits ?",
        a: "Oui. Un billet gratuit doit tout de même être ajouté à la commande pour la gestion de la capacité.",
      },
      {
        q: "Comment fonctionne la passe familiale ?",
        a: "Minimum 3 billets, maximum 6 billets, dont un maximum de 2 adultes. La validation se fait à l'achat et à l'entrée.",
      },
      {
        q: "Comment fonctionnent les billets de groupe ?",
        a: "Le tarif de groupe s'applique à partir de 15 personnes. Sous ce seuil, le tarif régulier s'applique.",
      },
    ],
  },
  {
    group: "Météo",
    items: [
      {
        q: "Qu'est-ce que l'Option Flex Météo ?",
        a: "Pour 8 $ par billet, vous pouvez changer une seule fois la date ou l'heure de votre visite, selon les disponibilités. Si la nouvelle séance est plus chère, la différence est payable. L'option s'ajoute uniquement au moment de l'achat.",
      },
      {
        q: "Que se passe-t-il si FESTI-ICE annule une soirée ?",
        a: "Vous êtes contacté par courriel avec les options offertes selon la politique en vigueur : report, crédit ou remboursement.",
      },
    ],
  },
  {
    group: "Sur place",
    items: [
      {
        q: "Le stationnement est-il inclus ?",
        a: "Oui, le stationnement sur le site du Havana Resort est gratuit.",
      },
      {
        q: "Puis-je dormir sur place ?",
        a: "Le Havana Resort offre chalets, villas, cabanas, Coolbox et unités condo-hôtel. Les forfaits combinés avec FESTI-ICE ne sont pas encore en vente.",
      },
    ],
  },
];

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}
