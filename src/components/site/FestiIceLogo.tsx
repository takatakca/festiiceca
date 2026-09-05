import logoAsset from "@/assets/festi-ice-logo.png.asset.json";

type Variant = "header" | "footer" | "compact" | "large";

const SIZES: Record<Variant, string> = {
  compact: "h-7 sm:h-8",
  header: "h-9 sm:h-11 lg:h-12",
  footer: "h-14 sm:h-16",
  large: "h-20 sm:h-28",
};

/**
 * Official FESTI-ICE brand mark (Camping Havana Resort + FESTI-ICE wordmark).
 * Single source of truth — never redraw or recompose the artwork.
 */
export function FestiIceLogo({
  variant = "header",
  className = "",
  priority = false,
}: {
  variant?: Variant;
  className?: string;
  priority?: boolean;
}) {
  return (
    <img
      src={logoAsset.url}
      alt="FESTI-ICE au Havana Resort"
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`${SIZES[variant]} w-auto object-contain ${className}`}
    />
  );
}
