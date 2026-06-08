import Link from "next/link";
import { cn } from "@/shared/lib/utils";

const FOOTER_LINKS = {
  Plateforme: [
    { label: "Événements", href: "/evenements" },
    { label: "Prestataires", href: "/prestataires" },
    { label: "Lieux", href: "/lieux" },
    { label: "Comment ça marche", href: "/comment-ca-marche" },
  ],
  Créateurs: [
    { label: "Organiser un événement", href: "/inscription" },
    { label: "Offrir des services", href: "/inscription" },
    { label: "Proposer un lieu", href: "/inscription" },
  ],
  Légal: [
    { label: "Conditions d'utilisation", href: "/conditions-utilisation" },
    { label: "Confidentialité", href: "/confidentialite" },
    { label: "Cookies", href: "/cookies" },
  ],
  Support: [
    { label: "Aide", href: "/aide" },
    { label: "Contact", href: "/contact" },
  ],
} as const;

export function PublicFooter() {
  return (
    <footer className="bg-primary text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md bg-accent",
                  "text-sm font-bold text-white"
                )}
              >
                E
              </div>
              <span className="font-serif text-xl font-bold">Elintys</span>
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              Plateforme événementielle québécoise tout-en-un.
            </p>
            <p className="mt-3 text-xs text-white/40">Fait au Québec.</p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/40">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={`${link.href}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <p className="text-center text-xs text-white/30">
            © 2026 Elintys. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
