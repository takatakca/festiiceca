import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (standalone || window.localStorage.getItem("festi-install-dismissed")) return;

    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent));
    const reveal = window.setTimeout(() => setVisible(true), 4500);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => {
      window.clearTimeout(reveal);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  const dismiss = () => {
    window.localStorage.setItem("festi-install-dismissed", "1");
    setVisible(false);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") dismiss();
  };

  if (!visible) return null;

  return (
    <aside className="install-prompt animate-slide-in-right" aria-label="Installer FESTI-ICE">
      <Button
        variant="ghost"
        size="icon"
        onClick={dismiss}
        aria-label="Fermer"
        className="absolute right-2 top-2"
      >
        <X />
      </Button>
      <div className="flex items-start gap-4 pr-9">
        <img src="/icon-192.png" alt="" className="size-12 rounded-lg border border-border" />
        <div>
          <p className="font-display text-sm uppercase">FESTI-ICE sur votre écran</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Accédez rapidement aux billets, à la carte et aux infos de visite.
          </p>
        </div>
      </div>
      {installEvent ? (
        <Button onClick={install} className="mt-4 w-full uppercase">
          <Download /> Installer
        </Button>
      ) : ios ? (
        <p className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <Share className="size-4 shrink-0 text-primary" /> Touchez Partager, puis « Sur l’écran
          d’accueil ».
        </p>
      ) : (
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          Utilisez « Installer l’application » dans le menu de votre navigateur.
        </p>
      )}
    </aside>
  );
}
