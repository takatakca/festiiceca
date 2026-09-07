import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { havanaPhotos, type HavanaPhoto } from "@/lib/havana-media";
import { PhotoLightbox } from "@/components/site/PhotoLightbox";

type GalleryCategory = {
  id: string;
  label: string;
  blurb: string;
  photos: HavanaPhoto[];
};

const categories: GalleryCategory[] = [
  {
    id: "domaine",
    label: "Le domaine",
    blurb:
      "Le Havana Resort tel qu'il est aujourd'hui : ses rues, ses terrasses et son petit train.",
    photos: [
      havanaPhotos.sign,
      havanaPhotos.playera,
      havanaPhotos.rueTrain,
      havanaPhotos.train,
      havanaPhotos.mojito,
    ],
  },
  {
    id: "lumieres",
    label: "Les lumières",
    blurb:
      "Des installations lumineuses grand format déjà présentes sur le domaine.",
    photos: [
      havanaPhotos.arbreGeant,
      havanaPhotos.fleurs,
      havanaPhotos.arbre,
      havanaPhotos.pompier,
      havanaPhotos.pieux,
    ],
  },
  {
    id: "ambiances",
    label: "Les ambiances",
    blurb: "Les allées guirlandées, les foyers extérieurs et les coins photo.",
    photos: [
      havanaPhotos.rueGuirlandes,
      havanaPhotos.guirlandes,
      havanaPhotos.foyer,
      havanaPhotos.feu,
      havanaPhotos.photobooth,
    ],
  },
];

export function HavanaGallery() {
  const [catIndex, setCatIndex] = useState(0);
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);

  const category = categories[catIndex]!;
  const photos = category.photos;
  const current = photos[index] ?? photos[0]!;

  const go = (delta: number) =>
    setIndex((i) => (i + delta + photos.length) % photos.length);

  const selectCategory = (i: number) => {
    setCatIndex(i);
    setIndex(0);
  };

  return (
    <section className="px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow">Découvrez l'expérience</p>
        <h2 className="mt-4 max-w-2xl text-[clamp(2rem,6vw,3.5rem)]">
          Le Havana Resort, <span className="text-ice">une fois la nuit tombée.</span>
        </h2>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Photos actuelles du domaine qui accueillera FESTI-ICE. Le parcours sur
          glace sera présenté pour la première fois lors de la saison inaugurale.
        </p>

        <div className="mt-10 flex flex-wrap gap-2" role="tablist" aria-label="Catégories de photos">
          {categories.map((c, i) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={i === catIndex}
              onClick={() => selectCategory(i)}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-widest transition-colors ${
                i === catIndex
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm text-muted-foreground">{category.blurb}</p>

        <div
          className="relative mt-6 overflow-hidden rounded-2xl border border-border/50 shadow-lg shadow-background/40"
          onTouchStart={(e) => {
            touchX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const start = touchX.current;
            const end = e.changedTouches[0]?.clientX ?? null;
            if (start === null || end === null) return;
            if (Math.abs(end - start) > 40) go(end < start ? 1 : -1);
            touchX.current = null;
          }}
        >
          <button
            type="button"
            onClick={() => setLightbox(index)}
            className="block w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            aria-label={`Agrandir : ${current.captionFr}`}
          >
            <img
              key={current.key}
              src={current.url}
              alt={current.altFr}
              width={current.width}
              height={current.height}
              loading="lazy"
              decoding="async"
              sizes="(min-width: 1024px) 1024px, 100vw"
              style={{ objectPosition: current.focal }}
              className="aspect-[4/5] w-full animate-fade-in object-cover sm:aspect-[16/9]"
            />
          </button>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-background/90 to-transparent p-4 sm:p-6">
            <p className="max-w-md text-sm text-foreground/90">{current.captionFr}</p>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {index + 1} / {photos.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Photo précédente"
            className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-border/60 bg-background/70 p-2 backdrop-blur transition-colors hover:bg-background sm:block"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Photo suivante"
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-border/60 bg-background/70 p-2 backdrop-blur transition-colors hover:bg-background sm:block"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <ul className="mt-4 hidden gap-3 sm:grid sm:grid-cols-5">
          {photos.map((p, i) => (
            <li key={p.key}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Voir : ${p.captionFr}`}
                aria-current={i === index}
                className={`block w-full overflow-hidden rounded-lg border transition-opacity ${
                  i === index
                    ? "border-primary opacity-100"
                    : "border-border/50 opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={p.url}
                  alt=""
                  width={p.width}
                  height={p.height}
                  loading="lazy"
                  decoding="async"
                  sizes="200px"
                  style={{ objectPosition: p.focal }}
                  className="aspect-[4/3] w-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex justify-center gap-2 sm:hidden">
          {photos.map((p, i) => (
            <span
              key={p.key}
              className={`h-1 rounded-full transition-all ${
                i === index ? "w-6 bg-primary" : "w-2 bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      <PhotoLightbox
        photos={photos}
        index={lightbox}
        onClose={() => setLightbox(null)}
        onIndexChange={(i) => {
          setLightbox(i);
          if (typeof i === "number") setIndex(i);
        }}
      />
    </section>
  );
}
