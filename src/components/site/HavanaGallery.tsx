import { useState } from "react";
import { galleryPhotos } from "@/lib/havana-media";
import { PhotoLightbox } from "@/components/site/PhotoLightbox";

export function HavanaGallery() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow">Le domaine</p>
        <h2 className="mt-4 max-w-2xl text-[clamp(2rem,6vw,3.5rem)]">
          Le Havana Resort, <span className="text-ice">une fois la nuit tombée.</span>
        </h2>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Photos actuelles du Havana Resort, le domaine qui accueillera FESTI-ICE.
          Le parcours sur glace sera présenté pour la première fois lors de la
          saison inaugurale.
        </p>

        <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {galleryPhotos.map((p, i) => (
            <li key={p.key} className={i === 0 ? "col-span-2 lg:col-span-1" : ""}>
              <button
                type="button"
                onClick={() => setOpen(i)}
                className="group block w-full overflow-hidden rounded-xl border border-border/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                aria-label={`Agrandir : ${p.captionFr}`}
              >
                <img
                  src={p.url}
                  alt={p.altFr}
                  width={p.width}
                  height={p.height}
                  loading="lazy"
                  decoding="async"
                  style={{ objectPosition: p.focal }}
                  className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] sm:aspect-[3/4]"
                />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <PhotoLightbox
        photos={galleryPhotos}
        index={open}
        onClose={() => setOpen(null)}
        onIndexChange={setOpen}
      />
    </section>
  );
}
