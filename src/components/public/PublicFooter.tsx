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
      <h2 className="footer-col-title">{title}</h2>
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
          </div>

          <FooterColumn title="PLATEFORME" links={PLATFORM_LINKS} />
          <FooterColumn title="COMPAGNIE" links={COMPANY_LINKS} />

          <div>
            <h2 className="footer-col-title">NEWSLETTER</h2>
            <p className="text-sm leading-6 text-on-surface-variant">
              L’infolettre est en préparation. Aucune adresse n’est collectée pour le moment.
            </p>
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
