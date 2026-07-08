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
    <footer className="border-t border-white/[0.06]">
      <div
        aria-hidden="true"
        className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
      />
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 md:flex-row">
        <Link href="/" className="text-xl font-semibold tracking-tight text-white/80">
          el<span className="text-accent">i</span>ntys
        </Link>

        <nav className="flex flex-wrap justify-center gap-6">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-white/40 transition-colors hover:text-white/70"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex flex-col items-end gap-1 text-right">
          <a
            href="mailto:contact@elintys.com"
            className="group relative text-sm text-white/40 transition-colors hover:text-white/70"
          >
            contact@elintys.com
            <span className="absolute -bottom-0.5 left-0 h-px w-0 origin-left bg-white/40 transition-all duration-300 group-hover:w-full" />
          </a>
          <p className="text-xs text-white/22">© 2026 Elintys. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
