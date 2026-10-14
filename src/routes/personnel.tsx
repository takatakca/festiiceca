import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Camera, ScanLine, ShieldCheck, LogOut } from "lucide-react";

export const Route = createFileRoute("/personnel")({
  head: () => ({ meta: [
    { title: "FESTI-ICE — Contrôle des entrées (personnel)" },
    { name: "robots", content: "noindex,nofollow" },
  ] }),
  component: PersonnelPage,
});

type Scan = { result: "VALID" | "ALREADY_USED" | "INVALID"; ticketType?: string | null; scannedAt?: string | null };
type Detector = { detect: (video: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type DetectorCtor = new (options: { formats: string[] }) => Detector;

function PersonnelPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(false);
  const [camera, setCamera] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const cameraStream = useRef<MediaStream | null>(null);
  const animation = useRef<number | null>(null);
  const isScanning = useRef(false);

  function stopCamera() {
    isScanning.current = false;
    if (animation.current !== null) cancelAnimationFrame(animation.current);
    animation.current = null;
    cameraStream.current?.getTracks().forEach(track => track.stop());
    cameraStream.current = null;
    if (video.current) video.current.srcObject = null;
    setCamera(false);
  }

  useEffect(() => {
    let active = true;
    try {
      supabase.auth.getSession().then(({ data, error }) => {
        if (active) {
          if (error) setMessage("Impossible de vérifier la connexion.");
          else setSession(data.session);
        }
      }).catch(() => active && setMessage("Service de connexion indisponible."));
      const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, next) => {
        if (active) setSession(next);
      });
      return () => {
        active = false;
        authSubscription.subscription.unsubscribe();
        isScanning.current = false;
        if (animation.current !== null) cancelAnimationFrame(animation.current);
        cameraStream.current?.getTracks().forEach(track => track.stop());
      };
    } catch {
      setMessage("L'authentification doit être configurée pour utiliser le scanner.");
    }
  }, []);

  async function sendOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email, options: {
          shouldCreateUser: false,
          emailRedirectTo: window.location.origin + "/personnel",
        },
      });
      if (error) throw error;
      setMessage("Un lien ou un code de connexion a été envoyé si le compte est autorisé.");
    } catch {
      setMessage("Connexion impossible. Vérifiez votre compte de personnel.");
    } finally { setLoading(false); }
  }

  async function confirmOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
      if (error) throw error;
      setMessage("Session vérifiée. Vous pouvez contrôler les billets autorisés.");
      setOtp("");
    } catch {
      setMessage("Code incorrect ou expiré.");
    } finally { setLoading(false); }
  }

  async function redeem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setResult(null);
    if (!session || !/^[a-f0-9]{64}$/i.test(qrToken.trim())) {
      setMessage("Le code QR doit contenir un jeton valide de 64 caractères."); return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/gate/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + session.access_token,
        },
        body: JSON.stringify({ token: qrToken.trim() }),
      });
      if (response.status === 403) throw new Error("Accès réservé au personnel autorisé.");
      if (response.status === 401) throw new Error("Session expirée. Reconnectez-vous.");
      if (!response.ok) throw new Error("Service temporairement indisponible.");
      const payload = await response.json() as Scan;
      setResult(payload);
      setQrToken("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur du scanner.");
    } finally { setLoading(false); }
  }

  async function startCamera() {
    setMessage(""); setResult(null);
    const Barcode = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
    if (!Barcode || !navigator.mediaDevices?.getUserMedia) {
      setMessage("La lecture par caméra n'est pas disponible sur ce navigateur. Utilisez un lecteur externe ou collez le code."); return;
    }
    try {
      const detector = new Barcode({ formats: ["qr_code"] });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }, audio: false,
      });
      cameraStream.current = stream;
      setCamera(true);
      isScanning.current = true;
      // React may not have mounted <video> on this synchronous render yet.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const el = video.current;
      if (!el) { stopCamera(); return; }
      el.srcObject = stream;
      await el.play();
      async function scanFrame() {
        if (!isScanning.current || !el) return;
        try {
          if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            const codes = await detector.detect(el);
            const found = codes.find(code => /^[a-f0-9]{64}$/i.test(code.rawValue.trim()));
            if (found) {
              setQrToken(found.rawValue.trim());
              stopCamera();
              setMessage("Code détecté. Vérifiez puis appuyez sur Valider.");
              return;
            }
          }
        } catch { /* Some camera frames cannot be decoded. Retain manual entry. */ }
        if (isScanning.current) animation.current = requestAnimationFrame(() => { void scanFrame(); });
      }
      void scanFrame();
    } catch {
      stopCamera();
      setMessage("Caméra inaccessible. Accordez la permission ou utilisez la saisie manuelle.");
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 pb-32 pt-28 sm:px-6">
      <div className="flex items-center gap-3 text-primary">
        <ShieldCheck aria-hidden /><span className="text-xs font-semibold uppercase tracking-[0.18em]">Accès réservé</span>
      </div>
      <h1 className="mt-5 text-4xl">Contrôle des billets</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Le personnel autorisé valide chaque billet une seule fois. Aucun accès public sans rôle attribué par l'administration.
      </p>
      {message && <p role="status" className="mt-6 rounded-lg border border-border p-4 text-sm">{message}</p>}
      {!session ? (
        <div className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6">
          <form onSubmit={sendOtp} className="space-y-3">
            <label htmlFor="staff-email" className="block text-sm font-semibold">Courriel du personnel</label>
            <input id="staff-email" type="email" autoComplete="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm"/>
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              Envoyer un lien ou code de connexion
            </button>
          </form>
          <form onSubmit={confirmOtp} className="space-y-3">
            <label htmlFor="staff-otp" className="block text-sm font-semibold">Code reçu par courriel</label>
            <input id="staff-otp" inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={8}
              value={otp} onChange={e => setOtp(e.target.value)} required
              className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm"/>
            <button type="submit" disabled={loading || !email}
              className="w-full rounded-lg border border-primary px-5 py-3 text-sm font-semibold text-primary disabled:opacity-50">
              Vérifier le code
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
            <span>Session du personnel active</span>
            <button type="button" onClick={() => { stopCamera(); void supabase.auth.signOut(); }}
              className="inline-flex items-center gap-2 hover:text-foreground">
              <LogOut size={16}/> Déconnexion
            </button>
          </div>
          {camera && <video ref={video} muted playsInline
            className="w-full rounded-lg border border-primary object-cover" />}
          <button type="button" onClick={() => camera ? stopCamera() : void startCamera()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-5 py-3 text-sm font-semibold text-primary">
            <Camera size={18} aria-hidden /> {camera ? "Arrêter la caméra" : "Scanner avec la caméra"}
          </button>
          <form onSubmit={redeem} className="space-y-3">
            <label htmlFor="qr-token" className="block text-sm font-semibold">Jeton QR (64 caractères)</label>
            <input id="qr-token" required autoComplete="off" spellCheck={false}
              value={qrToken} onChange={e => setQrToken(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm"/>
            <button type="submit" disabled={loading || !/^[a-f0-9]{64}$/i.test(qrToken.trim())}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40">
              <ScanLine size={18}/> {loading ? "Vérification…" : "Valider l'entrée"}
            </button>
          </form>
          {result && (
            <div role="status" aria-live="assertive"
              className="rounded-xl border border-primary/40 bg-primary/5 p-5">
              <h2 className="text-xl font-semibold">
                {result.result === "VALID" ? "Entrée autorisée" :
                  result.result === "ALREADY_USED" ? "Billet déjà utilisé" : "Billet invalide"}
              </h2>
              {result.ticketType && <p className="mt-2 text-sm">Catégorie : {result.ticketType}</p>}
              {result.scannedAt && <p className="mt-2 text-sm">Scanné : {result.scannedAt}</p>}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
