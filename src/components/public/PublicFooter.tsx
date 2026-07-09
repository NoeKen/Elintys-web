import Link from 'next/link';

const PLATFORM_LINKS = [
  { label: 'Événements', href: '/evenements' },
  { label: 'Prestataires', href: '/prestataires' },
  { label: "Lieux d'exception", href: '/lieux' },
  { label: 'Tarification', href: '/tarification' },
];

const COMPANY_LINKS = [
  { label: 'À propos', href: '/a-propos' },
  { label: 'Blog', href: '/blog' },
  { label: 'Partenaires', href: '/partenaires' },
  { label: 'Contact', href: '/contact' },
];

const BOTTOM_LINKS = [
  { label: 'Confidentialité', href: '/confidentialite' },
  { label: 'Conditions', href: '/conditions' },
  { label: 'Stripe Connect', href: '/stripe-connect' },
];

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="footer-col-title">{title}</h4>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm text-on-surface-variant no-underline transition-colors hover:text-primary"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant/70 bg-white/60 text-on-surface-variant no-underline shadow-[var(--shadow-soft-line)] transition-colors hover:border-teal/30 hover:text-teal"
    >
      {children}
    </a>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-outline-variant/60 bg-white/30 py-12 backdrop-blur-md">
      <div className="container-public">
        <div className="footer-grid">
          <div>
            <span className="font-serif text-2xl text-primary">
              Elintys
            </span>
            <p className="mt-3 max-w-[270px] text-sm leading-7 text-on-surface-variant">
              L&apos;art de la curation événementielle. Nous connectons les esprits créatifs aux
              expériences les plus mémorables de Montréal.
            </p>
            <div className="mt-5 flex gap-2.5">
              <SocialIcon href="https://instagram.com" label="Instagram">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://tiktok.com" label="TikTok">
                <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://linkedin.com" label="LinkedIn">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6ZM2 9h4v12H2z" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </SocialIcon>
            </div>
          </div>

          <FooterColumn title="PLATEFORME" links={PLATFORM_LINKS} />
          <FooterColumn title="COMPAGNIE" links={COMPANY_LINKS} />

          <div>
            <h4 className="footer-col-title">NEWSLETTER</h4>
            <p className="mb-4 text-sm leading-6 text-on-surface-variant">
              Recevez chaque jeudi notre sélection exclusive directement dans votre boîte.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email"
                aria-label="Adresse courriel pour la newsletter"
                className="premium-input min-w-0 flex-1 text-sm"
              />
              <button
                className="premium-button min-h-11 shrink-0 px-5 py-2 text-sm"
              >
                OK
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/60 pt-6">
          <span className="text-xs text-on-surface-variant/70">
            © 2026 Elintys. L&apos;art de la curation événementielle.
          </span>
          <div className="flex gap-6">
            {BOTTOM_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs text-on-surface-variant/70 no-underline transition-colors hover:text-primary"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
