import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Music4,
  Snowflake,
  Sparkles,
  Users,
  MapPin,
  Clock,
} from "lucide-react";
import heroImg from "@/assets/hero-festi-ice.jpg";
import tunnelImg from "@/assets/ambiance-tunnel.jpg";
import havanaImg from "@/assets/havana-winter.jpg";
import familleImg from "@/assets/ambiance-famille.jpg";
import { havanaPhotos } from "@/lib/havana-media";
import { HavanaGallery } from "@/components/site/HavanaGallery";
import {
  formatCents,
  practicalInfo,
  ticketTypes,
  venue,
} from "@/lib/festi-data";
import { getSiteContent } from "@/lib/content.functions";
import {
  resolveContent,
  SiteContentProvider,
  useSiteContent,
} from "@/lib/site-content";

export const Route = createFileRoute("/")({
  loader: () => getSiteContent(),
  head: () => ({
    meta: [
      { title: "FESTI-ICE — Patinez dans la lumière | Maricourt, Québec" },
      {
        name: "description",
        content:
          "Patinage extérieur illuminé au Havana Resort de Maricourt : 263 acres, un parcours continu, une musique différente chaque soirée. Activité d'hiver familiale dans les Cantons-de-l'Est.",
      },
      { property: "og:title", content: "FESTI-ICE — Patinez dans la lumière" },
      {
        property: "og:description",
        content:
          "Un parcours sur glace illuminé au cœur du Havana Resort. Une seule expérience, jamais la même ambiance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: () => (
    <main className="mx-auto max-w-2xl px-4 py-32">
      <h1 className="text-3xl">Contenu momentanément indisponible</h1>
      <p className="mt-4 text-muted-foreground">
        Rechargez la page dans quelques instants.
      </p>
    </main>
  ),
  notFoundComponent: () => (
    <main className="mx-auto max-w-2xl px-4 py-32">
      <h1 className="text-3xl">Page introuvable</h1>
    </main>
  ),
  component: Home,
});

function Home() {
  const content = resolveContent(Route.useLoaderData());
  return (
    <SiteContentProvider value={content}>
      <main>
        <Hero />
        <WhatIs />
        <OneWorld />
        <Journey />
        <Programming />
        <Highlights />
        <Havana />
        <HavanaGallery />
        <Stay />
        <Practical />
        <Tickets />
        <Location />
        <Faq />
      </main>
    </SiteContentProvider>
  );
}


/* 01 — HERO */
function Hero() {
  const { season } = useSiteContent();
  return (
    <section className="relative flex min-h-[92svh] items-end overflow-hidden">
      <img
        src={heroImg}
        alt="Patineurs sur un parcours de glace illuminé la nuit, entouré de structures lumineuses"
        width={1920}
        height={1088}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[var(--gradient-night)]" />
      <div className="absolute inset-0 bg-midnight/35" />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-32 sm:px-6 lg:pb-24">
        {season.isInauguralSeason && (
          <p className="eyebrow mb-4">Saison inaugurale · {season.label}</p>
        )}
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-silver">
          Maricourt, Québec
        </p>
        <h1 className="mt-4 text-[clamp(2.75rem,12vw,7.5rem)]">
          Patinez
          <br />
          dans la
          <br />
          <span className="text-ice">lumière.</span>
        </h1>
        <p className="mt-6 max-w-lg text-base text-silver sm:text-lg">
          Un parcours sur glace illuminé au cœur du Havana Resort, où musique,
          lumière et hiver se rencontrent.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/billets"
            className="rounded-full bg-primary px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground glow"
          >
            Billets
          </Link>
          <a
            href="#experience"
            className="rounded-full border border-polar/40 px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-foreground backdrop-blur-sm"
          >
            Découvrir l'expérience
          </a>
        </div>

        <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-xs font-semibold uppercase tracking-[0.16em] text-silver">
          <li className="flex items-center gap-2">
            <MapPin size={14} className="text-primary" /> Havana Resort
          </li>
          <li className="flex items-center gap-2">
            <Users size={14} className="text-primary" /> Expérience familiale
          </li>
          <li className="flex items-center gap-2">
            <Music4 size={14} className="text-primary" /> Soirées musicales
          </li>
        </ul>
      </div>

      <ChevronDown
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 animate-bounce text-silver/70 lg:block"
        size={22}
        aria-hidden
      />
    </section>
  );
}

/* 02 — WHAT IS FESTI-ICE */
function WhatIs() {
  return (
    <section id="experience" className="scroll-mt-24 px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="eyebrow">L'expérience</p>
          <h2 className="mt-4 text-[clamp(2rem,6vw,4rem)]">
            Une seule expérience.
            <br />
            <span className="text-ice">Jamais la même ambiance.</span>
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            À FESTI-ICE, on ne visite pas une série d'attractions séparées. On
            patine à travers le Havana Resort lui-même. De rue en rue, la
            lumière change, la musique change, l'atmosphère change — mais le
            parcours, lui, ne s'interrompt jamais.
          </p>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Un domaine naturel de {venue.acres} acres devient, le temps d'une
            soirée d'hiver, un seul grand terrain de jeu illuminé.
          </p>
        </div>
        <div className="relative">
          <img
            src={tunnelImg}
            alt="Tunnel de lumières au-dessus d'un sentier glacé enneigé"
            loading="lazy"
            width={1200}
            height={900}
            className="w-full rounded-2xl object-cover shadow-[var(--glow-soft)]"
          />
          <div className="shimmer-line pointer-events-none absolute inset-x-0 bottom-0 h-px" />
        </div>
      </div>
    </section>
  );
}

/* 03 — ONE WORLD, ALWAYS CHANGING (scroll-driven ambiance) */
function OneWorld() {
  const { routeSegments } = useSiteContent();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const nodes = ref.current?.querySelectorAll<HTMLElement>("[data-seg]");
    if (!nodes) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number(e.target.getAttribute("data-seg")));
        });
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    nodes.forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, []);

  const seg = routeSegments[active] ?? routeSegments[0]!;

  return (
    <section
      id="parcours"
      ref={ref}
      className="scroll-mt-24 transition-colors duration-700"
      style={{ backgroundColor: seg.background }}
    >
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
        <p className="eyebrow" style={{ color: seg.accent }}>
          Le parcours
        </p>
        <h2 className="mt-4 text-[clamp(2rem,6vw,4rem)]">
          Un monde.
          <br />
          <span style={{ color: seg.accent }}>Plusieurs ambiances.</span>
        </h2>

        <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_1.1fr]">
          {/* luminous route visualization */}
          <div className="lg:sticky lg:top-28 lg:h-fit">
            <div className="surface-frost rounded-2xl p-6">
              <svg viewBox="0 0 200 320" className="w-full" role="img" aria-label="Tracé lumineux du parcours FESTI-ICE">
                <path
                  d="M30 300 C 20 240 70 230 60 180 C 52 138 130 140 128 100 C 126 62 80 60 100 20"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <path
                  d="M30 300 C 20 240 70 230 60 180 C 52 138 130 140 128 100 C 126 62 80 60 100 20"
                  fill="none"
                  stroke={seg.accent}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="1000"
                  strokeDashoffset={1000 - ((active + 1) / routeSegments.length) * 1000}
                  style={{ transition: "stroke-dashoffset 700ms ease, stroke 700ms ease" }}
                />
                {routeSegments.map((s, i) => {
                  const pts = [
                    [30, 300],
                    [58, 224],
                    [58, 168],
                    [112, 138],
                    [128, 88],
                    [100, 20],
                  ][i] as [number, number];
                  return (
                    <circle
                      key={s.id}
                      cx={pts[0]}
                      cy={pts[1]}
                      r={i === active ? 7 : 4}
                      fill={i <= active ? seg.accent : "var(--muted-foreground)"}
                      style={{ transition: "all 500ms ease" }}
                    />
                  );
                })}
              </svg>
              <div className="mt-4 border-t border-border/50 pt-4">
                <p className="eyebrow" style={{ color: seg.accent }}>
                  {seg.street}
                </p>
                <p className="font-display text-xl">{seg.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {seg.musicStyle} · {seg.lightingStyle}
                </p>
              </div>
            </div>
          </div>

          <ol className="space-y-6">
            {routeSegments.map((s, i) => (
              <li
                key={s.id}
                data-seg={i}
                className={`rounded-2xl border p-6 transition-all duration-500 ${
                  i === active
                    ? "border-transparent bg-card/80 shadow-[var(--glow-soft)]"
                    : "border-border/40 bg-card/20 opacity-60"
                }`}
                style={i === active ? { borderColor: s.accent } : undefined}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {String(s.order).padStart(2, "0")} · {s.street}
                </p>
                <h3 className="mt-2 text-2xl" style={{ color: i === active ? s.accent : undefined }}>
                  {s.name}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {s.descriptionFr}
                </p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {s.musicStyle} — {s.lightingStyle}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* 04 — THE SKATING JOURNEY */
function Journey() {
  const steps = [
    { t: "Arrivée", d: "Stationnement gratuit sur le domaine du Havana Resort." },
    { t: "Accueil", d: "Vous scannez votre billet QR à l'entrée de FESTI-ICE." },
    { t: "Préparation", d: "Zone d'enfilage des patins et aires chauffées." },
    { t: "Le parcours", d: "Vous entrez sur la glace et suivez les rues illuminées." },
    { t: "Les pauses", d: "Points de restauration, photos et arrêts en chemin." },
    { t: "Le retour", d: "Sortie près de l'accueil — et l'envie de revenir." },
  ];
  return (
    <section className="px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow">Le déroulement</p>
        <h2 className="mt-4 max-w-2xl text-[clamp(2rem,6vw,3.5rem)]">
          De la voiture <span className="text-ice">à la glace</span> en quelques
          minutes.
        </h2>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.t} className="bg-card p-7">
              <span className="font-display text-3xl text-ice">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-lg">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* 05 — PROGRAMMING */
function Programming() {
  const { programs } = useSiteContent();
  const [selected, setSelected] = useState(
    (programs[2] ?? programs[0])!.dayIndex,
  );
  const p = programs.find((x) => x.dayIndex === selected) ?? programs[0]!;

  return (
    <section
      id="programmation"
      className="scroll-mt-24 border-y border-border/60 bg-card/30 px-4 py-24 sm:px-6 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow">Programmation</p>
        <h2 className="mt-4 max-w-3xl text-[clamp(2rem,6vw,3.5rem)]">
          La glace est la même.
          <br />
          <span className="text-ice">La soirée, jamais.</span>
        </h2>

        <div className="mt-12 grid gap-8 lg:grid-cols-[300px_1fr]">
          <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {programs.map((prog) => (
              <button
                key={prog.dayIndex}
                type="button"
                onClick={() => setSelected(prog.dayIndex)}
                aria-pressed={selected === prog.dayIndex}
                className={`shrink-0 rounded-xl border px-5 py-4 text-left transition-colors lg:w-full ${
                  selected === prog.dayIndex
                    ? "border-primary bg-primary/10"
                    : "border-border/60 hover:border-primary/50"
                }`}
              >
                <span className="block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {prog.dayShortFr}
                </span>
                <span className="mt-1 block text-sm font-semibold">{prog.title}</span>
              </button>
            ))}
          </div>

          <div className="surface-frost rounded-2xl p-7 sm:p-10">
            <p className="eyebrow">{p.dayLongFr}</p>
            <h3 className="mt-3 text-[clamp(2rem,7vw,3.5rem)] text-ice">{p.title}</h3>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-silver">
              {p.styles}
            </p>
            <dl className="mt-8 grid gap-6 sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Horaire
                </dt>
                <dd className="mt-1 font-semibold">
                  {p.startTime} – {p.endTime}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Public
                </dt>
                <dd className="mt-1 font-semibold">{p.recommendedAge}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Disponibilité
                </dt>
                <dd className="mt-1 font-semibold">
                  {p.status === "LOW_AVAILABILITY"
                    ? "Peu de disponibilités"
                    : p.status === "SOLD_OUT"
                      ? "Complet"
                      : "Billets disponibles"}
                </dd>
              </div>
            </dl>
            <p className="mt-6 text-sm text-muted-foreground">{p.note}</p>
            <Link
              to="/billets"
              search={{ theme: p.title }}
              className="mt-8 inline-block rounded-full bg-primary px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground"
            >
              Choisir cette soirée
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 06 — HIGHLIGHTS */
function Highlights() {
  const items = [
    {
      icon: Sparkles,
      t: "Installations lumineuses grand format",
      d: "Des structures illuminées spectaculaires réparties le long du parcours.",
    },
    {
      icon: Music4,
      t: "Une identité musicale par soirée",
      d: "Latin, pop, country, électro ou familial : la soirée change d'humeur.",
    },
    {
      icon: Snowflake,
      t: "Le vrai hiver québécois",
      d: "Neige, forêt, air froid et lumière. Une expérience extérieure assumée.",
    },
    {
      icon: Users,
      t: "Pensé pour les familles",
      d: "Enfants, ados, parents et grands-parents patinent sur le même parcours.",
    },
  ];
  return (
    <section className="px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
        <img
          src={familleImg}
          alt="Famille patinant sur un sentier illuminé bordé de sculptures lumineuses"
          loading="lazy"
          width={1200}
          height={900}
          className="w-full rounded-2xl object-cover shadow-[var(--glow-soft)]"
        />
        <ul className="space-y-8">
          {items.map((i) => (
            <li key={i.t} className="flex gap-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-primary/40 text-primary">
                <i.icon size={18} />
              </span>
              <div>
                <h3 className="text-lg">{i.t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{i.d}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* 07 — HAVANA */
function Havana() {
  return (
    <section id="havana" className="scroll-mt-24 relative overflow-hidden">
      <img
        src={havanaImg}
        alt="Vue aérienne nocturne du domaine enneigé du Havana Resort"
        loading="lazy"
        width={1600}
        height={1000}
        className="absolute inset-0 h-full w-full object-cover opacity-35"
      />
      <div className="absolute inset-0 bg-midnight/60" />
      <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 lg:py-40">
        <p className="eyebrow">Le lieu</p>
        <h2 className="mt-4 text-[clamp(2.25rem,8vw,5rem)]">
          {venue.acres} acres
          <br />
          à découvrir
          <br />
          <span className="text-ice">sur glace.</span>
        </h2>
        <p className="mt-6 max-w-xl text-base text-silver">
          FESTI-ICE prend vie au Havana Resort, un vaste domaine naturel de
          Maricourt dans les Cantons-de-l'Est.
        </p>
        <dl className="mt-12 grid max-w-2xl gap-6 sm:grid-cols-3">
          {venue.travelTimes.map((t) => (
            <div key={t.from} className="surface-frost rounded-xl p-5">
              <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {t.from}
              </dt>
              <dd className="mt-1 font-display text-xl">{t.minutes}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          Les temps de déplacement sont approximatifs.
        </p>

        <div className="mt-14 grid items-center gap-8 rounded-2xl border border-border/50 bg-background/40 p-6 sm:grid-cols-2">
          <img
            src={havanaPhotos.sign.url}
            alt={havanaPhotos.sign.altFr}
            width={havanaPhotos.sign.width}
            height={havanaPhotos.sign.height}
            loading="lazy"
            decoding="async"
            style={{ objectPosition: havanaPhotos.sign.focal }}
            className="aspect-[4/3] w-full rounded-xl object-cover"
          />
          <address className="not-italic">
            <p className="eyebrow">Adresse</p>
            <p className="mt-4 font-display text-2xl">Havana Resort</p>
            <p className="mt-2 text-sm leading-relaxed text-silver">
              631, 7e Rang
              <br />
              Maricourt, QC
              <br />
              J0E 2L2
            </p>
          </address>
        </div>

      </div>
    </section>
  );
}

/* 08 — STAY THE NIGHT */
function Stay() {
  const { accommodations } = useSiteContent();
  return (
    <section className="px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow">Hébergement</p>
        <h2 className="mt-4 text-[clamp(2rem,6vw,3.5rem)]">
          Patinez.
          <br />
          <span className="text-ice">Restez dormir.</span>
        </h2>
        <p className="mt-6 max-w-xl text-sm text-muted-foreground">
          Le Havana Resort dispose de son propre inventaire d'hébergement
          quatre-saisons sur le domaine. Les forfaits combinés avec FESTI-ICE ne
          sont pas encore en vente.
        </p>
        <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-5">
          {accommodations.map((a) => (
            <li key={a.label} className="bg-card p-7 text-center">
              <p className="font-display text-4xl text-ice">{a.count}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {a.label}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* 09 — PRACTICAL INFORMATION */
function Practical() {
  return (
    <section
      id="infos"
      className="scroll-mt-24 border-y border-border/60 bg-card/30 px-4 py-24 sm:px-6 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow">Infos pratiques</p>
        <h2 className="mt-4 text-[clamp(2rem,6vw,3.5rem)]">
          Tout ce qu'il faut <span className="text-ice">savoir.</span>
        </h2>
        <dl className="mt-12 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {practicalInfo.map((i) => (
            <div key={i.label} className="border-t border-border/60 pt-4">
              <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {i.label}
              </dt>
              <dd className="mt-1.5 text-sm font-semibold">{i.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock size={14} /> La durée moyenne du parcours et les détails de
          location de patins seront confirmés avant l'ouverture.
        </p>
      </div>
    </section>
  );
}

/* 10 — TICKETS */
function Tickets() {
  const visible = ticketTypes.filter((t) =>
    ["GENERAL", "SENIOR", "CHILD", "FAMILY", "TODDLER"].includes(t.code),
  );
  return (
    <section className="px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow">Billets</p>
        <h2 className="mt-4 text-[clamp(2rem,6vw,3.5rem)]">
          Des tarifs <span className="text-ice">clairs.</span>
        </h2>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {visible.map((t) => (
            <li key={t.id} className="rounded-2xl border border-border/60 bg-card p-6">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {t.nameFr}
              </p>
              <p className="mt-3 font-display text-3xl text-ice">
                {formatCents(t.priceCents)}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">{t.descriptionFr}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">
          Billet ouvert et tarif de groupe (15 personnes et plus) offerts à la
          billetterie. Taxes en sus, affichées avant le paiement.
        </p>
        <Link
          to="/billets"
          className="mt-8 inline-block rounded-full bg-primary px-10 py-4 text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground glow"
        >
          Choisir mes billets
        </Link>
      </div>
    </section>
  );
}

/* 11 — LOCATION */
function Location() {
  return (
    <section className="border-t border-border/60 px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="eyebrow">Lieu</p>
          <h2 className="mt-4 text-[clamp(2rem,6vw,3.5rem)]">Havana Resort</h2>
          <p className="mt-5 text-base text-muted-foreground">
            {venue.address}
            <br />
            {venue.city} {venue.postalCode}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={venue.directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-primary px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground"
            >
              Itinéraire
            </a>
            <a
              href="#infos"
              className="rounded-full border border-border px-8 py-4 text-xs font-bold uppercase tracking-[0.18em]"
            >
              Planifier ma visite
            </a>
          </div>
        </div>
        <div className="surface-frost rounded-2xl p-8">
          <p className="eyebrow">Repères</p>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>Stationnement gratuit sur le domaine</li>
            <li>Accès par le 7e Rang, à Maricourt</li>
            <li>Cantons-de-l'Est, Québec</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

/* 12 — FAQ */
function Faq() {
  const { faq } = useSiteContent();
  return (
    <section className="border-t border-border/60 bg-card/30 px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto max-w-4xl">
        <p className="eyebrow">FAQ</p>
        <h2 className="mt-4 text-[clamp(2rem,6vw,3.5rem)]">
          Avez-vous des <span className="text-ice">questions ?</span>
        </h2>
        <div className="mt-12 space-y-10">
          {faq.map((group) => (
            <div key={group.group}>
              <h3 className="text-sm tracking-[0.2em] text-muted-foreground">
                {group.group}
              </h3>
              <div className="mt-4 divide-y divide-border/50 border-y border-border/50">
                {group.items.map((item) => (
                  <details key={item.q} className="group py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
                      {item.q}
                      <ChevronDown
                        size={16}
                        className="shrink-0 text-primary transition-transform group-open:rotate-180"
                      />
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
