import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import {
  formatCents,
  programs,
  taxes,
  support,
} from "@/lib/festi-data";
import { getPublicTicketing } from "@/lib/ticketing.functions";

type Search = { date?: string | undefined; theme?: string | undefined; checkout?: "return" | "cancelled" | undefined };

export const Route = createFileRoute("/billets")({
  loader: () => getPublicTicketing(),
  validateSearch: (search: Record<string, unknown>): Search => ({
    date: typeof search["date"] === "string" ? search["date"] : undefined,
    theme: typeof search["theme"] === "string" ? search["theme"] : undefined,
    checkout: search["checkout"] === "return" || search["checkout"] === "cancelled"
      ? search["checkout"] : undefined,
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
          "Consultez les séances publiées et les tarifs de FESTI-ICE. La vente en ligne sera activée après validation du paiement.",
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
  const inventory = Route.useLoaderData();
  const ticketTypes = inventory.ticketTypes;
  const [cursor, setCursor] = useState(() => new Date());
  const [dateKey, setDateKey] = useState<string | undefined>(search.date);
  const [slot, setSlot] = useState<string | undefined>(undefined);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [flex, setFlex] = useState(false);
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [familyAdults, setFamilyAdults] = useState(2);
  const [paymentError, setPaymentError] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(search.date ? 2 : 1);

  const selectedDay = inventory.dates.find((d) => d.date === dateKey);
  const selectedDate = selectedDay ? new Date(`${selectedDay.date}T12:00:00`) : undefined;
  const program = selectedDate ? programForDate(selectedDate) : undefined;

  const lines = useMemo(
    () =>
      ticketTypes
        .filter((t) => (quantities[t.id] ?? 0) > 0)
        .map((t) => ({ type: t, qty: quantities[t.id] ?? 0 })),
    [quantities, ticketTypes],
  );

  const totalTickets = lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = lines.reduce((n, l) => n + l.qty * l.type.priceCents, 0);
  const flexTotal = flex && inventory.flexOption ? totalTickets * inventory.flexOption.priceCents : 0;
  const taxable = subtotal + flexTotal;
  const taxLines = taxes.map((t) => ({
    code: t.code,
    cents: Math.round(taxable * t.rate),
  }));
  const total = taxable + taxLines.reduce((n, t) => n + t.cents, 0);

  // Server-side rules mirrored client-side (never trusted alone).
  const errors: string[] = [];
  const familyQty = quantities["FAMILY"] ?? 0;
  if (familyQty > 0 && familyQty < 3)
    errors.push("La passe familiale exige un minimum de 3 billets.");
  if (familyQty > 6)
    errors.push("La passe familiale est limitée à 6 billets.");
  const adultsWithFamily = ticketTypes
    .filter((t) => t.countsAsAdult)
    .reduce((n, t) => n + (quantities[t.id] ?? 0), 0);
  if (familyQty > 0 && adultsWithFamily > 2)
    errors.push("La passe familiale permet un maximum de 2 adultes.");
  const groupQty = quantities["GROUP"] ?? 0;
  if (groupQty > 0 && groupQty < 15)
    errors.push("Le tarif de groupe s'applique à partir de 15 personnes.");
  if (totalTickets > 0 && totalTickets === (quantities["TODDLER"] ?? 0))
    errors.push("Les billets gratuits doivent accompagner une admission payante.");
  if (familyQty > 0 && familyAdults + adultsWithFamily > 2)
    errors.push("La passe familiale ne peut comporter plus de 2 adultes au total.");

  const selectedCapacity = selectedDay?.slots.find((entry) => entry.startTime.slice(0, 5) === slot)?.remaining;
  if (selectedCapacity !== undefined && totalTickets > selectedCapacity)
    errors.push("Le nombre de billets dépasse les places restantes pour cette séance.");
  const canContinueTickets = totalTickets > 0 && errors.length === 0;

  const setQty = (id: string, delta: number) =>
    setQuantities((q) => {
      const type = ticketTypes.find((t) => t.id === id)!;
      const next = Math.max(0, Math.min(type.maximumQuantity, (q[id] ?? 0) + delta));
      return { ...q, [id]: next };
    });

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inventory.checkoutEnabled || !canContinueTickets || isPaying) return;
    const slotId = selectedDay?.slots.find((entry) => entry.startTime.slice(0, 5) === slot)?.id;
    if (!slotId) { setPaymentError("Séance introuvable, veuillez choisir une autre heure."); return; }
    setPaymentError(""); setIsPaying(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId,
          items: lines.map((line) => ({ code: line.type.code, quantity: line.qty })),
          flex, familyAdults: familyQty > 0 ? familyAdults : 0, customer,
        }),
      });
      const payload: unknown = await response.json();
      const result = payload as { url?: unknown; error?: unknown };
      if (!response.ok || typeof result.url !== "string" ||
          !result.url.startsWith("https://checkout.stripe.com/"))
        throw new Error(typeof result.error === "string" ? result.error : "Paiement indisponible.");
      window.location.assign(result.url);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Paiement indisponible.");
      setIsPaying(false);
    }
  }

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const pad = isoDay(first) - 1;
    const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = Array.from({ length: pad }, () => null);
    for (let i = 1; i <= count; i++)
      cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), i));
    return cells;
  }, [cursor]);

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
        {inventory.checkoutEnabled
          ? "Sélectionnez votre séance et vos billets, puis payez en toute sécurité."
          : "Consultez les séances publiées et estimez votre panier. Aucun paiement ni aucune réservation ne sont effectués sur cette page pour le moment."}
      </p>

      <Steps step={step} />

      {!inventory.checkoutEnabled && (
        <p role="status" className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
          La billetterie est en préparation. Seules les dates et les catégories configurées dans le système officiel sont affichées; aucun paiement ne sera accepté tant que le parcours sécurisé n’est pas activé.
        </p>
      )}
      {search.checkout === "return" && (
        <p role="status" className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
          Retour du prestataire de paiement. La commande doit encore être vérifiée côté serveur; ce retour ne constitue pas une confirmation de paiement. Communiquez avec le soutien si vous ne recevez pas de confirmation officielle.
        </p>
      )}
      {search.checkout === "cancelled" && (
        <p role="status" className="mt-5 rounded-xl border border-border p-4 text-sm">
          Vous avez quitté le paiement. Aucune réservation n’est confirmée sur cette page.
        </p>
      )}
      {inventory.dates.length === 0 && (
        <p role="status" className="mt-4 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Aucune date de vente n’est encore publiée. Consultez cette page ultérieurement pour les annonces officielles.
        </p>
      )}

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
                const key = toKey(d);
                const past = d < new Date(new Date().toDateString());
                const published = inventory.dates.find((item) => item.date === key);
                const disabled = past || !published || published.slots.length === 0;
                const selected = key === dateKey;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    aria-label={`${d.getDate()} ${MONTHS[d.getMonth()]} — ${disabled ? "séance non publiée" : "séance publiée"}`}
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
                        className="mx-auto mt-1 block h-1 w-1 rounded-full bg-primary"
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <i className="inline-block h-1.5 w-1.5 rounded-full bg-primary" /> Séance annoncée
              </span>
              <span className="text-muted-foreground/60">Grisé — fermée, complète ou non publiée</span>
            </p>
          </Panel>

          {/* STEP 2 — TIME */}
          {step >= 2 && selectedDate && (
            <Panel active n="02" title="Choisir votre heure d'arrivée">
              {program && (
                <div className="mb-5 rounded-xl border border-primary/25 bg-primary/5 p-4">
                  <p className="eyebrow">Programmation indicative · {program.dayLongFr} · {program.styles}</p>
                  <p className="font-display text-xl">{program.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {program.startTime} – {program.endTime} · {program.note}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {(selectedDay?.slots ?? []).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSlot(t.startTime.slice(0, 5));
                      setStep(3);
                    }}
                    className={`rounded-full border py-2.5 text-sm font-semibold transition-colors ${
                      slot === t.startTime.slice(0, 5)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/70 hover:border-primary/70"
                    }`}
                  >
                    {t.startTime.slice(0, 5)} <span className="block text-[0.6rem] font-normal">{t.remaining} places</span>
                  </button>
                ))}
              </div>
            </Panel>
          )}

          {/* STEP 3 — TICKETS */}
          {step >= 3 && slot && (
            <Panel active n="03" title="Choisir vos billets">
              {ticketTypes.length === 0 && <p className="text-sm text-muted-foreground">Aucune catégorie de billets publiée.</p>}
              <ul className="divide-y divide-border/50">
                {ticketTypes
                  .filter((t) => t.active && (!inventory.checkoutEnabled || t.code !== "OPEN_DATE"))
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
                          disabled={(quantities[t.id] ?? 0) >= t.maximumQuantity}
                          className="grid h-9 w-9 place-items-center rounded-full border border-primary/60 text-primary disabled:opacity-30"
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

              {inventory.flexOption && <div className="mt-6 rounded-xl border border-aurora/30 bg-aurora/5 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={flex}
                    onChange={(e) => setFlex(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-[var(--cyan-ice)]"
                  />
                  <span>
                    <span className="text-sm font-semibold">
                      {inventory.flexOption.nameFr} — {formatCents(inventory.flexOption.priceCents)} / billet
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {inventory.flexOption.descriptionFr}
                    </span>
                  </span>
                </label>
              </div>}

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

          {/* STEP 4 — REAL PAYMENT, ONLY WHEN BACKEND IS EXPLICITLY ENABLED */}
          {step >= 4 && inventory.checkoutEnabled && (
            <Panel active n="04" title="Vos coordonnées et paiement">
              <form className="space-y-4" onSubmit={handleCheckout}>
                <label className="block text-sm">
                  Nom complet
                  <input required autoComplete="name" value={customer.name}
                    onChange={(e) => setCustomer((p) => ({ ...p, name: e.target.value }))}
                    minLength={2} maxLength={160}
                    className="mt-2 w-full rounded-lg border border-input bg-card px-3 py-3" />
                </label>
                <label className="block text-sm">
                  Adresse courriel
                  <input required type="email" autoComplete="email" value={customer.email}
                    onChange={(e) => setCustomer((p) => ({ ...p, email: e.target.value }))}
                    maxLength={254}
                    className="mt-2 w-full rounded-lg border border-input bg-card px-3 py-3" />
                </label>
                <label className="block text-sm">
                  Téléphone (facultatif)
                  <input type="tel" autoComplete="tel" value={customer.phone}
                    onChange={(e) => setCustomer((p) => ({ ...p, phone: e.target.value }))}
                    maxLength={40}
                    className="mt-2 w-full rounded-lg border border-input bg-card px-3 py-3" />
                </label>
                {familyQty > 0 && (
                  <label className="block text-sm">
                    Nombre d’adultes compris dans la passe familiale
                    <select value={familyAdults} onChange={(e) => setFamilyAdults(Number(e.target.value))}
                      className="mt-2 w-full rounded-lg border border-input bg-card px-3 py-3">
                      <option value={1}>1 adulte</option>
                      <option value={2}>2 adultes</option>
                    </select>
                  </label>
                )}
                {errors.length > 0 && <p role="alert" className="text-sm text-destructive">{errors.join(" ")}</p>}
                {paymentError && <p role="alert" className="text-sm text-destructive">{paymentError}</p>}
                <p className="text-xs text-muted-foreground">
                  Le total sera recalculé au serveur et votre place sera réservée temporairement
                  avant la redirection vers Stripe. Le paiement confirmé active les billets.
                </p>
                <button type="submit" disabled={!canContinueTickets || isPaying}
                  className="w-full rounded-full bg-primary py-4 text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground disabled:opacity-40">
                  {isPaying ? "Préparation du paiement…" : "Payer " + formatCents(total)}
                </button>
              </form>
            </Panel>
          )}
          {step >= 4 && !inventory.checkoutEnabled && (
            <Panel active n="04" title="Préparer votre visite">
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
                <ShieldCheck className="mb-3 text-primary" aria-hidden />
                <h3 className="text-lg font-semibold">Aucun paiement n’est effectué</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Ceci est une estimation seulement. Votre date et vos billets ne sont pas réservés.
                  La vente sera ouverte après validation du paiement et des capacités.
                </p>
                <a href={"mailto:" + support.festiIce.email + "?subject=Billetterie%20FESTI-ICE"}
                  className="mt-5 inline-flex rounded-full border border-primary/60 px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  Contacter l’équipe FESTI-ICE
                </a>
              </div>
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
                  <span className="font-display text-lg">Estimation</span>
                  <span className="font-display text-lg text-ice">
                    {formatCents(total)}
                  </span>
                </div>
              </dl>
            )}
            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <Ticket size={14} className="mt-0.5 shrink-0" />
              Montants indicatifs, taxes estimées. Aucune commande ni aucun paiement enregistré.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Steps({ step }: { step: number }) {
  const labels = ["Date", "Heure", "Billets", "Coordonnées"];
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

