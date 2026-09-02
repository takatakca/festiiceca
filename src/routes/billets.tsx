import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Minus,
  Plus,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import {
  flexOption,
  formatCents,
  programs,
  taxes,
  ticketTypes,
  timeSlots,
  venue,
} from "@/lib/festi-data";

type Search = { date?: string; theme?: string };

export const Route = createFileRoute("/billets")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    date: typeof search["date"] === "string" ? search["date"] : undefined,
    theme: typeof search["theme"] === "string" ? search["theme"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Billets FESTI-ICE — Patinage illuminé au Havana Resort" },
      {
        name: "description",
        content:
          "Choisissez votre date, votre séance et vos billets pour FESTI-ICE, le parcours sur glace illuminé du Havana Resort à Maricourt.",
      },
      { property: "og:title", content: "Billets FESTI-ICE" },
      {
        property: "og:description",
        content:
          "Calendrier, séances d'arrivée, tarifs familiaux et Option Flex Météo. Achat en ligne sécurisé.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BilletsPage,
});

const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];
const DAY_LETTERS = ["L", "M", "M", "J", "V", "S", "D"];

/** ISO weekday 1..7 (Mon..Sun) */
function isoDay(d: Date) {
  return d.getDay() === 0 ? 7 : d.getDay();
}
function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
function programForDate(d: Date) {
  return programs.find((p) => p.dayIndex === isoDay(d));
}

function BilletsPage() {
  const search = Route.useSearch();
  const [cursor, setCursor] = useState(() => new Date());
  const [dateKey, setDateKey] = useState<string | undefined>(search.date);
  const [slot, setSlot] = useState<string | undefined>(undefined);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [flex, setFlex] = useState(false);
  const [promo, setPromo] = useState("");
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(search.date ? 2 : 1);
  const [placed, setPlaced] = useState(false);

  const selectedDate = dateKey ? new Date(`${dateKey}T12:00:00`) : undefined;
  const program = selectedDate ? programForDate(selectedDate) : undefined;

  const lines = useMemo(
    () =>
      ticketTypes
        .filter((t) => (quantities[t.id] ?? 0) > 0)
        .map((t) => ({ type: t, qty: quantities[t.id] ?? 0 })),
    [quantities],
  );

  const totalTickets = lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = lines.reduce((n, l) => n + l.qty * l.type.priceCents, 0);
  const flexTotal = flex ? totalTickets * flexOption.priceCents : 0;
  const taxable = subtotal + flexTotal;
  const taxLines = taxes.map((t) => ({
    code: t.code,
    cents: Math.round(taxable * t.rate),
  }));
  const total = taxable + taxLines.reduce((n, t) => n + t.cents, 0);

  // Server-side rules mirrored client-side (never trusted alone).
  const errors: string[] = [];
  const familyQty = quantities["tt-family"] ?? 0;
  if (familyQty > 0 && familyQty < 3)
    errors.push("La passe familiale exige un minimum de 3 billets.");
  if (familyQty > 6)
    errors.push("La passe familiale est limitée à 6 billets.");
  const adultsWithFamily = ticketTypes
    .filter((t) => t.countsAsAdult)
    .reduce((n, t) => n + (quantities[t.id] ?? 0), 0);
  if (familyQty > 0 && adultsWithFamily > 2)
    errors.push("La passe familiale permet un maximum de 2 adultes.");
  const groupQty = quantities["tt-group"] ?? 0;
  if (groupQty > 0 && groupQty < 15)
    errors.push("Le tarif de groupe s'applique à partir de 15 personnes.");

  const canContinueTickets = totalTickets > 0 && errors.length === 0;

  const setQty = (id: string, delta: number) =>
    setQuantities((q) => {
      const type = ticketTypes.find((t) => t.id === id)!;
      const next = Math.max(0, Math.min(type.maximumQuantity, (q[id] ?? 0) + delta));
      return { ...q, [id]: next };
    });

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const pad = isoDay(first) - 1;
    const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = Array.from({ length: pad }, () => null);
    for (let i = 1; i <= count; i++)
      cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), i));
    return cells;
  }, [cursor]);

  if (placed) {
    return <Success date={selectedDate} slot={slot} tickets={totalTickets} total={total} program={program?.title} />;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-40 pt-28 sm:px-6 lg:pt-32">
      <a
        href="/"
        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} /> Retour
      </a>

      <h1 className="mt-6 text-4xl sm:text-6xl">
        Vos billets <span className="text-ice">FESTI-ICE</span>
      </h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Date, séance d'arrivée, billets, paiement. Quatre étapes, aucun frais
        surprise.
      </p>

      <Steps step={step} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          {/* STEP 1 — DATE */}
          <Panel active={step >= 1} n="01" title="Choisir une date">
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-label="Mois précédent"
                onClick={() =>
                  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
                }
                className="rounded-full border border-border px-3 py-1.5 text-sm"
              >
                ‹
              </button>
              <p className="font-display text-lg">
                {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
              </p>
              <button
                type="button"
                aria-label="Mois suivant"
                onClick={() =>
                  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
                }
                className="rounded-full border border-border px-3 py-1.5 text-sm"
              >
                ›
              </button>
            </div>

            <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
              {DAY_LETTERS.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {days.map((d, i) => {
                if (!d) return <span key={i} />;
                const p = programForDate(d);
                const key = toKey(d);
                const past = d < new Date(new Date().toDateString());
                const disabled = !p || past || p.status === "SOLD_OUT";
                const selected = key === dateKey;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    aria-label={`${d.getDate()} ${MONTHS[d.getMonth()]}${p ? ` — ${p.title}` : " — fermé"}`}
                    onClick={() => {
                      setDateKey(key);
                      setSlot(undefined);
                      setStep(2);
                    }}
                    className={`aspect-square rounded-lg border text-sm transition-colors ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground font-bold"
                        : disabled
                          ? "border-transparent text-muted-foreground/35"
                          : "border-border/70 hover:border-primary/70"
                    }`}
                  >
                    <span className="block leading-none">{d.getDate()}</span>
                    {!disabled && !selected && (
                      <span
                        className={`mx-auto mt-1 block h-1 w-1 rounded-full ${
                          p?.status === "LOW_AVAILABILITY" ? "bg-coral" : "bg-primary"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <i className="inline-block h-1.5 w-1.5 rounded-full bg-primary" /> Disponible
              </span>
              <span className="flex items-center gap-2">
                <i className="inline-block h-1.5 w-1.5 rounded-full bg-coral" /> Peu de
                disponibilités
              </span>
              <span className="text-muted-foreground/60">Grisé — fermé ou complet</span>
            </p>
          </Panel>

          {/* STEP 2 — TIME */}
          {step >= 2 && selectedDate && (
            <Panel active n="02" title="Choisir votre heure d'arrivée">
              {program && (
                <div className="mb-5 rounded-xl border border-primary/25 bg-primary/5 p-4">
                  <p className="eyebrow">{program.dayLongFr} · {program.styles}</p>
                  <p className="font-display text-xl">{program.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {program.startTime} – {program.endTime} · {program.note}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {timeSlots.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setSlot(t);
                      setStep(3);
                    }}
                    className={`rounded-full border py-2.5 text-sm font-semibold transition-colors ${
                      slot === t
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/70 hover:border-primary/70"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Panel>
          )}

          {/* STEP 3 — TICKETS */}
          {step >= 3 && slot && (
            <Panel active n="03" title="Choisir vos billets">
              <ul className="divide-y divide-border/50">
                {ticketTypes
                  .filter((t) => t.active)
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((t) => (
                    <li key={t.id} className="flex items-center gap-4 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{t.nameFr}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {t.descriptionFr}
                        </p>
                        <p className="mt-1 text-sm font-bold text-primary">
                          {formatCents(t.priceCents)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <button
                          type="button"
                          aria-label={`Retirer un billet ${t.nameFr}`}
                          onClick={() => setQty(t.id, -1)}
                          className="grid h-9 w-9 place-items-center rounded-full border border-border disabled:opacity-30"
                          disabled={(quantities[t.id] ?? 0) === 0}
                        >
                          <Minus size={15} />
                        </button>
                        <span className="w-5 text-center text-sm font-bold tabular-nums">
                          {quantities[t.id] ?? 0}
                        </span>
                        <button
                          type="button"
                          aria-label={`Ajouter un billet ${t.nameFr}`}
                          onClick={() => setQty(t.id, 1)}
                          className="grid h-9 w-9 place-items-center rounded-full border border-primary/60 text-primary"
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>

              {errors.length > 0 && (
                <ul
                  role="alert"
                  className="mt-4 space-y-1 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm"
                >
                  {errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}

              <div className="mt-6 rounded-xl border border-aurora/30 bg-aurora/5 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={flex}
                    onChange={(e) => setFlex(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-[var(--cyan-ice)]"
                  />
                  <span>
                    <span className="text-sm font-semibold">
                      {flexOption.nameFr} — {formatCents(flexOption.priceCents)} / billet
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {flexOption.descriptionFr}
                    </span>
                  </span>
                </label>
              </div>

              <button
                type="button"
                disabled={!canContinueTickets}
                onClick={() => setStep(4)}
                className="mt-6 w-full rounded-full bg-primary py-4 text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground disabled:opacity-40"
              >
                Continuer
              </button>
            </Panel>
          )}

          {/* STEP 4 — DETAILS */}
          {step >= 4 && (
            <Panel active n="04" title="Vos informations">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Prénom" name="firstName" />
                <Field label="Nom" name="lastName" />
                <Field label="Courriel" name="email" type="email" />
                <Field label="Téléphone" name="phone" type="tel" />
                <Field label="Code postal" name="postal" />
                <div>
                  <label
                    htmlFor="lang"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    Langue des communications
                  </label>
                  <select
                    id="lang"
                    className="w-full rounded-lg border border-input bg-card px-3 py-3 text-sm"
                  >
                    <option>Français</option>
                    <option>English</option>
                  </select>
                </div>
              </div>
              <label className="mt-5 flex items-start gap-3 text-xs text-muted-foreground">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--cyan-ice)]" />
                Je souhaite recevoir les nouvelles et offres FESTI-ICE. (facultatif)
              </label>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="mt-6 w-full rounded-full bg-primary py-4 text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground"
              >
                Aller au paiement
              </button>
            </Panel>
          )}

          {/* STEP 5 — PAYMENT */}
          {step >= 5 && (
            <Panel active n="05" title="Paiement">
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <ShieldCheck className="mx-auto mb-3 text-primary" />
                <p className="text-sm font-semibold">Paiement sécurisé</p>
                <p className="mx-auto mt-2 max-w-sm text-xs text-muted-foreground">
                  Le module de paiement (carte, Apple&nbsp;Pay, Google&nbsp;Pay) est
                  branché à la prochaine phase, avec vérification serveur et émission
                  des billets QR.
                </p>
              </div>
              <div className="mt-5">
                <label
                  htmlFor="promo"
                  className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                >
                  Code promotionnel
                </label>
                <input
                  id="promo"
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-input bg-card px-3 py-3 text-sm"
                  placeholder="Facultatif"
                />
              </div>
              <button
                type="button"
                onClick={() => setPlaced(true)}
                className="mt-6 w-full rounded-full bg-primary py-4 text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground glow"
              >
                Payer {formatCents(total)}
              </button>
            </Panel>
          )}
        </div>

        {/* SUMMARY */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="surface-frost rounded-2xl p-5">
            <p className="eyebrow">Votre commande</p>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Date" value={
                selectedDate
                  ? `${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]}`
                  : "—"
              } />
              <Row label="Heure" value={slot ?? "—"} />
              <Row label="Ambiance" value={program?.title ?? "—"} />
            </dl>
            <div className="my-4 h-px bg-border/60" />
            {lines.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun billet sélectionné.</p>
            ) : (
              <dl className="space-y-2 text-sm">
                {lines.map((l) => (
                  <Row
                    key={l.type.id}
                    label={`${l.qty} × ${l.type.nameFr}`}
                    value={formatCents(l.qty * l.type.priceCents)}
                  />
                ))}
                {flex && (
                  <Row
                    label={`${totalTickets} × Option Flex Météo`}
                    value={formatCents(flexTotal)}
                  />
                )}
                <div className="my-3 h-px bg-border/60" />
                <Row label="Sous-total" value={formatCents(taxable)} />
                {taxLines.map((t) => (
                  <Row key={t.code} label={t.code} value={formatCents(t.cents)} muted />
                ))}
                <div className="my-3 h-px bg-border/60" />
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-lg">Total</span>
                  <span className="font-display text-lg text-ice">
                    {formatCents(total)}
                  </span>
                </div>
              </dl>
            )}
            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <Ticket size={14} className="mt-0.5 shrink-0" />
              Aucuns frais cachés. Les taxes applicables sont affichées ci-dessus.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Steps({ step }: { step: number }) {
  const labels = ["Date", "Heure", "Billets", "Infos", "Paiement"];
  return (
    <ol className="mt-8 flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.16em]">
      {labels.map((l, i) => (
        <li
          key={l}
          className={`rounded-full border px-3 py-1.5 font-semibold ${
            step > i + 1
              ? "border-primary/50 text-primary"
              : step === i + 1
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/60 text-muted-foreground"
          }`}
        >
          {step > i + 1 ? "✓ " : ""}
          {l}
        </li>
      ))}
    </ol>
  );
}

function Panel({
  n,
  title,
  children,
  active,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border border-border/60 bg-card/60 p-5 sm:p-6 ${
        active ? "" : "opacity-50"
      }`}
    >
      <h2 className="mb-5 flex items-baseline gap-3 text-lg">
        <span className="text-ice">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={muted ? "text-muted-foreground" : ""}>{label}</dt>
      <dd className={`shrink-0 tabular-nums ${muted ? "text-muted-foreground" : "font-semibold"}`}>
        {value}
      </dd>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
}: {
  label: string;
  name: string;
  type?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        className="w-full rounded-lg border border-input bg-card px-3 py-3 text-sm"
      />
    </div>
  );
}

function Success({
  date,
  slot,
  tickets,
  total,
  program,
}: {
  date?: Date;
  slot?: string;
  tickets: number;
  total: number;
  program?: string;
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 pb-32 pt-32 text-center sm:px-6">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground glow">
        <Check size={30} />
      </div>
      <h1 className="mt-8 text-4xl sm:text-5xl">À bientôt sur la glace.</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Votre commande est enregistrée. Les billets QR seront transmis par courriel
        dès l'activation du module de paiement.
      </p>
      <dl className="surface-frost mt-8 space-y-3 rounded-2xl p-6 text-left text-sm">
        <Row
          label="Date"
          value={date ? `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}` : "—"}
        />
        <Row label="Séance d'arrivée" value={slot ?? "—"} />
        <Row label="Ambiance de la soirée" value={program ?? "—"} />
        <Row label="Billets" value={String(tickets)} />
        <Row label="Total payé" value={formatCents(total)} />
      </dl>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a
          href={venue.directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-primary/60 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-primary"
        >
          Itinéraire
        </a>
        <a
          href="/"
          className="rounded-full bg-primary px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground"
        >
          Préparer ma visite
        </a>
      </div>
    </main>
  );
}
