import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { HavanaPhoto } from "@/lib/havana-media";

export function PhotoLightbox({
  photos,
  index,
  onClose,
  onIndexChange,
}: {
  photos: HavanaPhoto[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const [touchX, setTouchX] = useState<number | null>(null);
  const open = index !== null;

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      onIndexChange((index + delta + photos.length) % photos.length);
    },
    [index, onIndexChange, photos.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, go, onClose]);

  if (index === null) return null;
  const photo = photos[index]!;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Galerie photo du Havana Resort"
      className="fixed inset-0 z-[100] flex flex-col bg-midnight/95 backdrop-blur-sm"
      onTouchStart={(e) => setTouchX(e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        if (touchX === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? touchX) - touchX;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        setTouchX(null);
      }}
    >
      <div className="flex items-center justify-between px-4 py-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-silver">
          {index + 1} / {photos.length}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la galerie"
          className="grid h-11 w-11 place-items-center rounded-full border border-border/70 text-foreground"
        >
          <X size={18} />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Photo précédente"
          className="absolute left-2 hidden h-12 w-12 place-items-center rounded-full border border-border/70 text-foreground sm:grid"
        >
          <ChevronLeft size={20} />
        </button>
        <img
          src={photo.url}
          alt={photo.altFr}
          width={photo.width}
          height={photo.height}
          className="max-h-full max-w-full rounded-xl object-contain"
        />
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Photo suivante"
          className="absolute right-2 hidden h-12 w-12 place-items-center rounded-full border border-border/70 text-foreground sm:grid"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <p className="px-4 py-6 text-center text-sm text-silver sm:px-6">
        {photo.captionFr}
      </p>
    </div>
  );
}
