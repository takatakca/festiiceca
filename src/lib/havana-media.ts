/**
 * Real photography of the Havana Resort — the venue that will host FESTI-ICE.
 *
 * IMPORTANT EDITORIAL RULE: these are photographs of the existing resort, not
 * of a past FESTI-ICE edition (2026-2027 is the inaugural season). Captions
 * must never claim otherwise.
 */
import sign from "@/assets/havana-sign.webp.asset.json";
import fleurs from "@/assets/havana-fleurs-geantes.webp.asset.json";
import arbre from "@/assets/havana-arbre-lumieres.webp.asset.json";
import train from "@/assets/havana-train.webp.asset.json";
import playera from "@/assets/havana-la-playera.webp.asset.json";
import mojito from "@/assets/havana-mojito-bar.webp.asset.json";
import guirlandes from "@/assets/havana-guirlandes.webp.asset.json";
import feu from "@/assets/havana-feu-exterieur.webp.asset.json";

export type HavanaPhoto = {
  key: string;
  url: string;
  width: number;
  height: number;
  /** object-position keeping the meaningful subject in frame on narrow screens */
  focal: string;
  altFr: string;
  altEn: string;
  captionFr: string;
  captionEn: string;
  category:
    | "HAVANA_DESTINATION"
    | "EXPERIENCE"
    | "LIGHT_INSTALLATION"
    | "FOOD_AREA"
    | "FAMILY"
    | "ROUTE";
};

export const havanaPhotos = {
  sign: {
    key: "havana-sign",
    url: sign.url,
    width: 1448,
    height: 1086,
    focal: "50% 45%",
    altFr:
      "Enseigne lumineuse Havana Resort et voiture vintage éclairées la nuit en forêt",
    altEn: "Illuminated Havana Resort sign and vintage car at night in the forest",
    captionFr: "Le Havana Resort, site hôte de FESTI-ICE",
    captionEn: "Havana Resort, home of FESTI-ICE",
    category: "HAVANA_DESTINATION",
  },
  fleurs: {
    key: "havana-fleurs-geantes",
    url: fleurs.url,
    width: 1086,
    height: 1448,
    focal: "50% 40%",
    altFr:
      "Grande fleur lumineuse et cygne décoratif illuminés dans le boisé du Havana Resort",
    altEn: "Giant illuminated flower and decorative swan in the Havana Resort woods",
    captionFr: "Installations lumineuses grand format au Havana Resort",
    captionEn: "Large-scale light installations at Havana Resort",
    category: "LIGHT_INSTALLATION",
  },
  arbre: {
    key: "havana-arbre-lumieres",
    url: arbre.url,
    width: 1086,
    height: 1448,
    focal: "50% 40%",
    altFr: "Arbre mature entièrement habillé de lumières blanches et bleues la nuit",
    altEn: "Mature tree fully wrapped in white and blue lights at night",
    captionFr: "Découvrez le décor qui accueillera FESTI-ICE cet hiver",
    captionEn: "Discover the destination that will host FESTI-ICE this winter",
    category: "LIGHT_INSTALLATION",
  },
  train: {
    key: "havana-train",
    url: train.url,
    width: 1086,
    height: 1448,
    focal: "35% 50%",
    altFr: "Petit train du Havana Resort stationné sous des guirlandes lumineuses",
    altEn: "Havana Resort trolley train parked under string lights",
    captionFr: "Un resort à découvrir autrement",
    captionEn: "A resort to discover differently",
    category: "FAMILY",
  },
  playera: {
    key: "havana-la-playera",
    url: playera.url,
    width: 1448,
    height: 1086,
    focal: "65% 45%",
    altFr: "Bâtiment tropical La Playera illuminé le soir au Havana Resort",
    altEn: "La Playera tropical building lit up in the evening at Havana Resort",
    captionFr: "La Playera, l'un des espaces du domaine",
    captionEn: "La Playera, one of the resort's spaces",
    category: "HAVANA_DESTINATION",
  },
  mojito: {
    key: "havana-mojito-bar",
    url: mojito.url,
    width: 1448,
    height: 1086,
    focal: "50% 45%",
    altFr: "Aire de rassemblement extérieure du Havana Resort décorée de lumières",
    altEn: "Outdoor gathering area at Havana Resort decorated with lights",
    captionFr: "Les aires de rassemblement du domaine",
    captionEn: "The resort's gathering areas",
    category: "FOOD_AREA",
  },
  guirlandes: {
    key: "havana-guirlandes",
    url: guirlandes.url,
    width: 1086,
    height: 1448,
    focal: "50% 40%",
    altFr: "Zone piétonne du Havana Resort sous des rangées de guirlandes lumineuses",
    altEn: "Havana Resort pedestrian zone under rows of string lights",
    captionFr: "La zone piétonne, une fois la nuit tombée",
    captionEn: "The pedestrian zone after dark",
    category: "EXPERIENCE",
  },
  feu: {
    key: "havana-feu-exterieur",
    url: feu.url,
    width: 1086,
    height: 1448,
    focal: "50% 45%",
    altFr: "Foyer extérieur entouré de chaises Adirondack au Havana Resort le soir",
    altEn: "Outdoor fire pit surrounded by Adirondack chairs at Havana Resort",
    captionFr: "Les espaces chaleureux du Havana Resort",
    captionEn: "Havana Resort's warm gathering spots",
    category: "FOOD_AREA",
  },
} satisfies Record<string, HavanaPhoto>;

/** Cinematic gallery sequence — mixed portrait/landscape on purpose. */
export const galleryPhotos: HavanaPhoto[] = [
  havanaPhotos.train,
  havanaPhotos.playera,
  havanaPhotos.guirlandes,
  havanaPhotos.mojito,
  havanaPhotos.feu,
  havanaPhotos.fleurs,
];
