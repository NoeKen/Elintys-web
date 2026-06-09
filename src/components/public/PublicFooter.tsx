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
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              style={{ fontSize: 14, opacity: 0.70, color: 'white', textDecoration: 'none', transition: 'opacity 200ms' }}
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
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,255,255,0.60)',
        transition: 'border-color 200ms, color 200ms',
        textDecoration: 'none',
      }}
    >
      {children}
    </a>
  );
}

export function PublicFooter() {
  return (
    <footer style={{ background: 'var(--color-navy)', color: 'white', padding: '64px 0 32px' }}>
      <div className="container-public">
        <div className="footer-grid">
          <div>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: 'var(--color-teal-light)' }}>
              Elintys
            </span>
            <p style={{ fontSize: 13, opacity: 0.55, marginTop: 14, lineHeight: 1.75, maxWidth: 260 }}>
              L&apos;art de la curation événementielle. Nous connectons les esprits créatifs aux
              expériences les plus mémorables de Montréal.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <SocialIcon href="https://instagram.com" label="Instagram">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://tiktok.com" label="TikTok">
                <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://linkedin.com" label="LinkedIn">
                <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </SocialIcon>
            </div>
          </div>

          <FooterColumn title="PLATEFORME" links={PLATFORM_LINKS} />
          <FooterColumn title="COMPAGNIE" links={COMPANY_LINKS} />

          <div>
            <h4 className="footer-col-title">NEWSLETTER</h4>
            <p style={{ fontSize: 13, opacity: 0.60, marginBottom: 16, lineHeight: 1.65 }}>
              Recevez chaque jeudi notre sélection exclusive directement dans votre boîte.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="email"
                placeholder="Email"
                aria-label="Adresse courriel pour la newsletter"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                  color: 'white',
                  fontSize: 14,
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                  minWidth: 0,
                }}
              />
              <button
                style={{
                  padding: '10px 16px',
                  background: 'var(--color-teal)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  flexShrink: 0,
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 24,
            marginTop: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 12, opacity: 0.35 }}>
            © 2025 Elintys. L&apos;art de la curation événementielle.
          </span>
          <div style={{ display: 'flex', gap: 24 }}>
            {BOTTOM_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                style={{ fontSize: 12, opacity: 0.45, textDecoration: 'none', color: 'white' }}
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
