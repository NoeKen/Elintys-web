import Link from 'next/link';

const LINKS = [
  { label: 'Problème', href: '#probleme' },
  { label: 'Solution', href: '#solution' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Accès bêta', href: '#cta' },
  { label: 'Confidentialité', href: '/confidentialite' },
  { label: 'Conditions', href: '/conditions' },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-outline-variant/60">
      <div
        aria-hidden="true"
        className="h-px w-full bg-gradient-to-r from-transparent via-outline-variant to-transparent"
      />
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 md:flex-row">
        <Link href="/" className="font-serif text-2xl text-primary transition-opacity hover:opacity-80">
          Elintys
        </Link>

        <nav className="flex flex-wrap justify-center gap-6">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex flex-col items-end gap-1 text-right">
          <a
            href="mailto:contact@elintys.com"
            className="group relative text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
          >
            contact@elintys.com
            <span className="absolute -bottom-0.5 left-0 h-px w-0 origin-left bg-primary/40 transition-all duration-300 group-hover:w-full" />
          </a>
          <p className="text-xs text-on-surface-variant/70">© 2026 Elintys. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
