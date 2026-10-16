import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, CalendarDays, LockKeyhole, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/operations")({
  head: () => ({ meta: [
    { title: "FESTI-ICE — Exploitation des séances" },
    { name: "robots", content: "noindex,nofollow" },
  ] }),
  component: OperationsPage,
});
type EventDay = {
  id: string; event_date: string; published: boolean;
  status: string; is_test: boolean; season_id: string;
};
type SessionSlot = {
  id: string; event_date_id: string; start_time: string;
  capacity: number; published: boolean; status: string;
};
type Inventory = { days: EventDay[]; slots: SessionSlot[] };
type Editing = { slot: SessionSlot; next: "OPEN" | "CLOSED" };

function OperationsPage() {
  const [session,setSession] = useState<Session | null>(null);
  const [inventory,setInventory] = useState<Inventory | null>(null);
  const [editing,setEditing] = useState<Editing | null>(null);
  const [reason,setReason] = useState("");
  const [notice,setNotice] = useState("");
  const [loading,setLoading] = useState(false);
  const [refreshCount,setRefreshCount] = useState(0);
  const [failure,setFailure] = useState("");

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({data,error}) => {
      if (active) {
        if (error) setFailure("Le service d'authentification est indisponible.");
        else setSession(data.session);
      }
    }).catch(() => { if (active) setFailure("Connexion indisponible."); });
    const {data} = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) setSession(next);
    });
    return () => { active=false; data.subscription.unsubscribe(); };
  },[]);

  useEffect(() => {
    if (!session) { setInventory(null); return; }
    let active = true;
    const load = async () => {
      setLoading(true); setFailure("");
      try {
        const response = await fetch("/api/operations/sessions", {
          headers: { Authorization: "Bearer " + session.access_token },
          cache: "no-store",
        });
        if (response.status === 403) throw new Error("Accès réservé au personnel d'exploitation autorisé.");
        if (response.status === 401) throw new Error("Session expirée. Reconnectez-vous.");
        if (!response.ok) throw new Error("Impossible de consulter les séances.");
        const data = await response.json() as Inventory;
        if (!Array.isArray(data.days) || !Array.isArray(data.slots)) throw new Error("Réponse invalide.");
        if (active) setInventory(data);
      } catch(error) {
        if (active) setFailure(error instanceof Error ? error.message : "Erreur de chargement.");
      } finally { if (active) setLoading(false); }
    };
    void load();
    return () => { active=false; };
  },[session, refreshCount]);

  async function updateStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || !session || loading || reason.trim().length < 10) return;
    setLoading(true);setFailure("");setNotice("");
    try {
      const response = await fetch("/api/operations/sessions",{
        method:"PATCH",
        headers: {
          Authorization:"Bearer " + session.access_token,
          "Content-Type":"application/json",
        },
        body:JSON.stringify({
          slotId:editing.slot.id,
          status:editing.next,
          reason:reason.trim(),
        }),
      });
      if (response.status === 403) throw new Error("Autorisation insuffisante pour modifier cette séance.");
      if (!response.ok) throw new Error("Modification refusée. Vérifiez l'état du programme.");
      setNotice(editing.next === "CLOSED" ? "Séance fermée et journalisée." :
        "Séance rouverte et journalisée.");
      setEditing(null);setReason("");setRefreshCount(n=>n+1);
    } catch(error) {
      setFailure(error instanceof Error ? error.message : "Modification impossible.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-32 pt-28 sm:px-6">
      <div className="flex items-center gap-3 text-primary">
        <ShieldCheck size={20} aria-hidden/>
        <span className="text-xs font-semibold uppercase tracking-[0.15em]">Espace sécurisé</span>
      </div>
      <h1 className="mt-5 text-4xl sm:text-5xl">Exploitation des séances</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Gestion des créneaux FESTI-ICE. Toutes les modifications exigent un rôle autorisé,
        une confirmation et un motif archivé. Aucun renseignement de commande client n'est affiché.
      </p>
      {!session && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <LockKeyhole className="mb-3 text-primary" aria-hidden/>
          <p className="text-sm">Connectez-vous avec votre compte de personnel autorisé.</p>
          <a href="/personnel" className="mt-4 inline-flex rounded-full border border-primary px-6 py-3 text-xs font-bold uppercase text-primary">
            Connexion du personnel
          </a>
        </div>
      )}
      {notice && <p role="status" className="mt-6 rounded-xl border border-primary/40 p-4 text-sm">{notice}</p>}
      {failure && <p role="alert" className="mt-6 rounded-xl border border-destructive/50 p-4 text-sm text-destructive">{failure}</p>}
      {session && (
        <>
          <button type="button" disabled={loading} onClick={() => setRefreshCount(n=>n+1)}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-xs font-bold uppercase disabled:opacity-40">
            <RefreshCw size={16} aria-hidden/> Actualiser
          </button>
          {loading && <p role="status" className="mt-4 text-sm">Chargement ou enregistrement…</p>}
          {inventory && inventory.days.length === 0 && (
            <p className="mt-8 rounded-xl border border-border p-6 text-sm">
              Aucune date à venir n'est encore configurée dans le calendrier officiel.
            </p>
          )}
          {inventory?.days.map(day => (
            <section key={day.id} className="mt-7 rounded-2xl border border-border bg-card p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-3">
                <CalendarDays className="text-primary" aria-hidden />
                <h2 className="text-xl font-semibold">{day.event_date}</h2>
                <span className="text-xs text-muted-foreground">
                  {day.is_test ? "TEST — non vendable" : day.published ? "Publié" : "Non publié"} · {day.status}
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {inventory.slots.filter(slot=>slot.event_date_id===day.id).map(slot=>(
                  <div key={slot.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4">
                    <div>
                      <p className="font-semibold">{slot.start_time.slice(0,5)} · {slot.status}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Capacité configurée : {slot.capacity} · {slot.published ? "Publié" : "Non publié"}
                      </p>
                    </div>
                    {(slot.status === "OPEN" || slot.status === "CLOSED") && (
                      <button type="button" disabled={loading}
                        onClick={() => { setEditing({slot,next:slot.status==="OPEN"?"CLOSED":"OPEN"});setReason("");setFailure(""); }}
                        className="rounded-full border border-primary px-5 py-2 text-xs font-bold uppercase text-primary disabled:opacity-40">
                        {slot.status === "OPEN" ? "Fermer cette séance" : "Demander la réouverture"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
          {editing && (
            <form onSubmit={updateStatus} className="mt-8 rounded-2xl border border-primary/40 bg-card p-6">
              <h2 className="text-xl font-semibold">
                Confirmer : {editing.next === "CLOSED" ? "fermer" : "rouvrir"} la séance {editing.slot.start_time.slice(0,5)}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Cette décision modifie réellement le statut de la séance et sera inscrite au journal d'audit.
              </p>
              <label htmlFor="operation-reason" className="mt-5 block text-sm font-semibold">Motif de l'intervention (10 caractères minimum)</label>
              <textarea id="operation-reason" rows={3} minLength={10} maxLength={500}
                required value={reason} onChange={e=>setReason(e.target.value)}
                className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-3 text-sm" />
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="submit" disabled={loading || reason.trim().length < 10}
                  className="rounded-full bg-primary px-6 py-3 text-xs font-bold uppercase text-primary-foreground disabled:opacity-40">
                  Confirmer le changement
                </button>
                <button type="button" onClick={() => {setEditing(null);setReason("");}}
                  className="rounded-full border border-border px-6 py-3 text-xs font-bold uppercase">Annuler</button>
              </div>
            </form>
          )}
        </>
      )}
    </main>
  );
}
