'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_LINKS = [
  { label: 'Événements', href: '/evenements' },
  { label: 'Prestataires', href: '/prestataires' },
  { label: 'Lieux', href: '/lieux' },
  { label: 'Comment ça marche', href: '/comment-ca-marche' },
] as const;

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/evenements' && pathname.startsWith(href));
  return (
    <Link href={href} aria-current={isActive ? 'page' : undefined}>
      {label}
    </Link>
  );
}

export function PublicNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isTransparentPage =
    pathname === '/evenements' || pathname.startsWith('/evenements/');

  useEffect(() => {
    if (!isTransparentPage) return;
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isTransparentPage]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isSolid = !isTransparentPage || scrolled;

  return (
    <>
      <nav className={`public-navbar${isSolid ? ' solid' : ''}`}>
        <Link href="/evenements" className="navbar-logo">
          Elintys
        </Link>

        <div className="navbar-links hidden md:flex">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.href} href={l.href} label={l.label} />
          ))}
        </div>

        <div className="navbar-actions hidden md:flex">
          <Link href="/connexion" className="navbar-link-tertiary">
            Se connecter
          </Link>
          <Link href="/inscription" className="navbar-btn-primary">
            S&apos;inscrire gratuitement
          </Link>
        </div>

        <button
          className="navbar-hamburger md:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {menuOpen && (
        <div className="navbar-mobile-drawer">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
          <Link href="/connexion" style={{ opacity: 0.65 }}>
            Se connecter
          </Link>
          <Link
            href="/inscription"
            className="navbar-btn-primary"
            style={{ textAlign: 'center', marginTop: 8 }}
          >
            S&apos;inscrire gratuitement
          </Link>
        </div>
      )}
    </>
  );
}
