import { Link } from "@tanstack/react-router";
import { season, support, venue } from "@/lib/festi-data";
import { FestiIceLogo } from "@/components/site/FestiIceLogo";
import { ManageCookiesLink } from "@/consent/ManageCookiesLink";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-[color-mix(in_oklab,var(--background)_92%,black)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <FestiIceLogo variant="footer" />
          <p className="mt-5 max-w-xs text-sm text-muted-foreground">
            Le plus grand événement de glace au Canada, au Camping Havana Resort.
          </p>
          {season.isInauguralSeason && (
            <p className="eyebrow mt-4">Saison inaugurale {season.label}</p>
          )}
        </div>

        <div className="text-sm">
          <p className="eyebrow mb-3">Lieu</p>
          <p className="font-semibold">{venue.name}</p>
          <p className="text-muted-foreground">
            {venue.address}
            <br />
            {venue.city} {venue.postalCode}
          </p>
          <a
            href={venue.directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block border-b border-primary/60 pb-0.5 font-semibold text-primary"
          >
            Itinéraire
          </a>
        </div>

        <div className="text-sm">
          <p className="eyebrow mb-3">Contact</p>
          <p className="text-muted-foreground">
            Billetterie et service à la clientèle FESTI-ICE
            <br />
            <a href={`mailto:${support.festiIce.email}`} className="text-foreground">
              {support.festiIce.email}
            </a>
          </p>
          <p className="mt-4 text-muted-foreground">
            Hébergement et informations Havana Resort
            <br />
            <a href={`tel:${support.havana.phone}`} className="text-foreground">
              {support.havana.phone}
            </a>
          </p>
          <Link
            to="/billets"
            className="festival-button mt-5 border border-primary/60 text-primary"
          >
            Choisir mes billets
          </Link>
        </div>
      </div>

      <div className="border-t border-border/50 px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} FESTI-ICE. Tous droits réservés. FESTI-ICE se
        déroule au Havana Resort, Maricourt (Québec).
        <ManageCookiesLink className="ml-3 underline-offset-2 hover:underline" />
      </div>
    </footer>
  );
}
