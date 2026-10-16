import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, ArrowLeft, RefreshCcw, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/operations/reviews")({
  head: () => ({ meta: [
    { title: "FESTI-ICE — Révision des incidents financiers" },
    { name: "robots", content: "noindex,nofollow" },
  ] }),
  component: FinanceReviewsPage,
});
type Review = {
  id: string;
  provider_event_id: string;
  event_type: string;
  payment_intent_id: string | null;
  amount_cents: number | null;
  category: string;
  status: string;
  created_at: string;
};
function FinanceReviewsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({data,error})=>{
      if (!active) return;
      if (error) setError("Impossible de vérifier votre session.");
      else setSession(data.session);
    }).catch(()=>{ if (active) setError("Authentification indisponible."); });
    const {data} = supabase.auth.onAuthStateChange((_event, next)=>{
      if (active) setSession(next);
    });
    return ()=>{active=false;data.subscription.unsubscribe();};
  },[]);
  useEffect(()=>{
    if (!session) {setReviews(null);return;}
    let active = true;
    const load = async () => {
      setLoading(true);setError("");
      try {
        const response = await fetch("/api/operations/financial-reviews",{
          headers:{Authorization:"Bearer "+session.access_token},
          cache:"no-store",
        });
        if (response.status===403)
          throw new Error("Seuls les responsables financiers autorisés peuvent consulter ce registre.");
        if (response.status===401) throw new Error("Votre session a expiré.");
        if (!response.ok) throw new Error("Le registre n'est pas disponible.");
        const payload = await response.json() as {reviews?:Review[]};
        if (!Array.isArray(payload.reviews)) throw new Error("Réponse invalide.");
        if (active) setReviews(payload.reviews);
      } catch(e) {
        if (active) setError(e instanceof Error?e.message:"Lecture impossible.");
      } finally {if (active) setLoading(false);}
    };
    void load();
    return ()=>{active=false;};
  },[session,refresh]);

  return (
    <main className="mx-auto max-w-4xl px-4 pb-32 pt-28 sm:px-6">
      <a href="/operations" className="inline-flex items-center gap-2 text-sm text-primary">
        <ArrowLeft size={16} aria-hidden/> Retour aux séances
      </a>
      <div className="mt-7 flex items-center gap-3 text-primary">
        <ShieldCheck aria-hidden/>
        <span className="text-xs font-semibold uppercase tracking-[0.16em]">
          Contrôle financier — accès restreint
        </span>
      </div>
      <h1 className="mt-5 text-3xl font-semibold sm:text-4xl">
        Événements à réviser
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Remboursements partiels, litiges et événements de remboursement
        nécessitant une vérification humaine. Ce registre provient des
        événements signés par Stripe, pas de données simulées.
      </p>
      <div className="mt-5 flex items-start gap-3 rounded-xl border border-border p-4 text-sm">
        <AlertTriangle className="shrink-0 text-primary" aria-hidden/>
        <p>
          Cette page est une liste en lecture seule. Pour traiter un litige,
          consulter le dossier dans l'espace Stripe autorisé.
          Aucun remboursement ni changement de commande n'est effectué ici.
        </p>
      </div>
      {!session && (
        <p className="mt-7 rounded-lg border border-border p-5 text-sm">
          Connexion du personnel requise. <a href="/personnel" className="text-primary underline">
          Accéder à la connexion</a>
        </p>
      )}
      {session && (
        <button type="button" disabled={loading}
          onClick={()=>setRefresh(x=>x+1)}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary px-5 py-2 text-xs font-bold uppercase text-primary disabled:opacity-50">
          <RefreshCcw size={16} aria-hidden/>
          {loading?"Actualisation…":"Actualiser les événements"}
        </button>
      )}
      {error && <p role="alert" className="mt-6 rounded-lg border border-destructive/40 p-4 text-sm text-destructive">{error}</p>}
      {reviews && reviews.length===0 && (
        <p role="status" className="mt-6 rounded-lg border border-border p-5 text-sm">
          Aucun événement ouvert n'a été retourné par le registre.
        </p>
      )}
      {reviews && reviews.length>0 && (
        <div className="mt-6 space-y-3">
          {reviews.map(review=>(
            <article key={review.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold">{review.category.replaceAll("_"," ")}</h2>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleString("fr-CA")}
                </span>
              </div>
              <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Événement</dt>
                  <dd className="break-all">{review.event_type}</dd></div>
                <div><dt className="text-muted-foreground">Référence Stripe</dt>
                  <dd className="break-all">{review.provider_event_id}</dd></div>
                <div><dt className="text-muted-foreground">Paiement</dt>
                  <dd className="break-all">{review.payment_intent_id??"Non renseigné"}</dd></div>
                <div><dt className="text-muted-foreground">Montant signalé</dt>
                  <dd>{review.amount_cents===null?"Non précisé":
                    (review.amount_cents/100).toLocaleString("fr-CA",{style:"currency",currency:"CAD"})}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
