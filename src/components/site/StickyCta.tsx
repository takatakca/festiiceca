import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function StickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.85);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 px-4 pb-4 transition-all duration-300 lg:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <Link
        to="/billets"
        className="surface-frost flex items-center justify-center rounded-full bg-primary/95 py-4 text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground glow"
      >
        Choisir mes billets
      </Link>
    </div>
  );
}
