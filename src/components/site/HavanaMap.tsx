import { useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { havanaMap } from "@/lib/havana-media";

type Poi = {
  id: string;
  label: string;
  detail: string;
  /** approximate position on the resort map, in % of width/height */
  x: number;
  y: number;
};

/** Approximate positions on the official resort map, used for orientation only. */
const pois: Poi[] = [
  { id: "accueil", label: "Accueil", detail: "Arrivée, billetterie et validation des codes QR.", x: 16, y: 62 },
  { id: "stationnement", label: "Stationnement", detail: "Sur place, gratuit.", x: 9, y: 40 },
  { id: "parcours", label: "Parcours sur glace", detail: "Le tracé illuminé suit les rues du domaine.", x: 52, y: 48 },
  { id: "restauration", label: "Restauration", detail: "Casse-croûte et aires de rassemblement chauffées.", x: 38, y: 66 },
  { id: "hebergements", label: "Hébergements", detail: "Chalets, villas, cabanas, Coolbox et condos-hôtel.", x: 72, y: 33 },
  { id: "lac", label: "Le lac", detail: "Cœur du domaine de 263 acres.", x: 62, y: 70 },
];

export function HavanaMap() {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <section id="carte" className="px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow">Explorez le domaine</p>
        <h2 className="mt-4 max-w-2xl text-[clamp(2rem,6vw,3.5rem)]">
          La carte du <span className="text-ice">Havana Resort.</span>
        </h2>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
          263 acres, un lac, des rues nommées et des hébergements quatre-saisons.
          Déplacez et agrandissez la carte, puis touchez un repère pour en savoir plus.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card">
            <div
              className="relative aspect-[16/10] cursor-grab touch-pan-y active:cursor-grabbing"
              onPointerDown={(e) => {
                drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                const d = drag.current;
                if (!d) return;
                setOffset({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) });
              }}
              onPointerUp={() => {
                drag.current = null;
              }}
            >
              <div
                className="absolute inset-0 origin-center transition-transform duration-150"
                style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
              >
                <img
                  src={havanaMap.url}
                  alt={havanaMap.altFr}
                  width={havanaMap.width}
                  height={havanaMap.height}
                  loading="lazy"
                  decoding="async"
                  sizes="(min-width: 1024px) 900px, 100vw"
                  className="size-full select-none object-cover"
                  draggable={false}
                />
                {pois.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActive(p.id)}
                    aria-label={p.label}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  >
                    <span
                      className={`block rounded-full border-2 shadow-md transition-all ${
                        active === p.id
                          ? "size-4 border-primary bg-primary"
                          : "size-3 border-background bg-primary/80 hover:size-4"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="absolute right-3 top-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, +(z + 0.4).toFixed(2)))}
                aria-label="Agrandir la carte"
                className="rounded-full border border-border/60 bg-background/80 p-2 backdrop-blur"
              >
                <Plus className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, +(z - 0.4).toFixed(2)))}
                aria-label="Réduire la carte"
                className="rounded-full border border-border/60 bg-background/80 p-2 backdrop-blur"
              >
                <Minus className="size-4" />
              </button>
              <button
                type="button"
                onClick={reset}
                aria-label="Recentrer la carte"
                className="rounded-full border border-border/60 bg-background/80 p-2 backdrop-blur"
              >
                <RotateCcw className="size-4" />
              </button>
            </div>
          </div>

          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {pois.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setActive(p.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    active === p.id
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:border-border"
                  }`}
                >
                  <span className="text-sm font-medium">{p.label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {p.detail}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Repères approximatifs — carte officielle du Camping Havana Resort.
        </p>
      </div>
    </section>
  );
}
