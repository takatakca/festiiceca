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
import pieux from "@/assets/havana-guirlandes-pieux.webp.asset.json";
import photobooth from "@/assets/havana-photobooth.webp.asset.json";
import foyer from "@/assets/havana-foyer-terrasse.webp.asset.json";
import pompier from "@/assets/havana-camion-pompier.webp.asset.json";
import arbreGeant from "@/assets/havana-arbre-geant.webp.asset.json";
import rueTrain from "@/assets/havana-rue-train.webp.asset.json";
import rueGuirlandes from "@/assets/havana-rue-guirlandes.webp.asset.json";
import carte from "@/assets/havana-carte.webp.asset.json";

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
  pieux: {
    key: "havana-guirlandes-pieux",
    url: pieux.url,
    width: 895,
    height: 1195,
    focal: "50% 50%",
    altFr: "Guirlandes lumineuses tendues entre des pieux de bois colorés au Havana Resort",
    altEn: "String lights hung between colourful wooden posts at Havana Resort",
    captionFr: "Les allées guirlandées du domaine",
    captionEn: "The resort's string-lit pathways",
    category: "LIGHT_INSTALLATION",
  },
  photobooth: {
    key: "havana-photobooth",
    url: photobooth.url,
    width: 895,
    height: 1185,
    focal: "50% 45%",
    altFr: "Coin photo Havana Resort décoré de lumières blanches, palmiers et étoiles",
    altEn: "Havana Resort photo booth decorated with white lights, palm trees and stars",
    captionFr: "Le coin photo du Havana Resort",
    captionEn: "Havana Resort's photo corner",
    category: "FAMILY",
  },
  foyer: {
    key: "havana-foyer-terrasse",
    url: foyer.url,
    width: 895,
    height: 1185,
    focal: "50% 50%",
    altFr: "Foyer allumé entouré de chaises Adirondack devant le casse-croûte du Havana Resort",
    altEn: "Lit fire pit surrounded by Adirondack chairs by the Havana Resort snack bar",
    captionFr: "Se réchauffer près du foyer",
    captionEn: "Warming up by the fire",
    category: "FOOD_AREA",
  },
  pompier: {
    key: "havana-camion-pompier",
    url: pompier.url,
    width: 895,
    height: 1183,
    focal: "50% 50%",
    altFr: "Camion de pompier vintage rouge illuminé de guirlandes au Havana Resort",
    altEn: "Vintage red fire truck covered in string lights at Havana Resort",
    captionFr: "Le camion de pompier illuminé",
    captionEn: "The illuminated vintage fire truck",
    category: "LIGHT_INSTALLATION",
  },
  arbreGeant: {
    key: "havana-arbre-geant",
    url: arbreGeant.url,
    width: 895,
    height: 1185,
    focal: "50% 45%",
    altFr: "Très grand arbre entièrement habillé de lumières dorées et bleues",
    altEn: "Large tree fully wrapped in golden and blue lights",
    captionFr: "L'arbre-signature du domaine",
    captionEn: "The resort's signature tree",
    category: "LIGHT_INSTALLATION",
  },
  rueTrain: {
    key: "havana-rue-train",
    url: rueTrain.url,
    width: 895,
    height: 1180,
    focal: "50% 45%",
    altFr: "Petit train du Havana Resort stationné sous des rangées de guirlandes lumineuses",
    altEn: "Havana Resort's little train parked under rows of string lights",
    captionFr: "Le petit train et la rue principale",
    captionEn: "The little train and the main street",
    category: "EXPERIENCE",
  },
  rueGuirlandes: {
    key: "havana-rue-guirlandes",
    url: rueGuirlandes.url,
    width: 895,
    height: 1185,
    focal: "50% 55%",
    altFr: "Ciel de guirlandes lumineuses au-dessus de la zone piétonne du Havana Resort",
    altEn: "Canopy of string lights above the Havana Resort pedestrian zone",
    captionFr: "Un ciel de lumières au-dessus du domaine",
    captionEn: "A sky of lights above the resort",
    category: "EXPERIENCE",
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
  havanaPhotos.arbreGeant,
  havanaPhotos.rueTrain,
  havanaPhotos.pompier,
  havanaPhotos.foyer,
  havanaPhotos.photobooth,
  havanaPhotos.pieux,
  havanaPhotos.rueGuirlandes,
];

/** Official Havana Resort property map (supplied by the resort). */
export const havanaMap = {
  url: carte.url,
  width: 1920,
  height: 1242,
  altFr:
    "Carte officielle du Camping Havana Resort montrant les rues, le lac, les chalets et les services",
  altEn:
    "Official Camping Havana Resort map showing streets, the lake, chalets and services",
};

