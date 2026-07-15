'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { Avatar } from '@/shared/ui/Avatar';
import { Skeleton } from '@/shared/ui/Skeleton';
import { useAuth } from '@/shared/hooks/useAuth';
import { cn, getInitials } from '@/shared/lib/utils';
import type { User } from '@/shared/types';

const NAV_LINKS = [
  { label: 'Événements', href: '/evenements' },
  { label: 'Prestataires', href: '/prestataires' },
  { label: 'Lieux', href: '/lieux' },
  { label: 'Comment ça marche', href: '/comment-ca-marche' },
] as const;

interface PublicNavbarProps {
  showWaitlistCta?: boolean;
  fixed?: boolean;
}

type NavAuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: User }
  | { status: 'anonymous' };

function AuthStateView({
  authState,
  loading,
  authenticated,
  anonymous,
}: {
  authState: NavAuthState;
  loading: () => ReactNode;
  authenticated: (user: User) => ReactNode;
  anonymous: () => ReactNode;
}) {
  if (authState.status === 'loading') return loading();
  if (authState.status === 'authenticated') return authenticated(authState.user);
  return anonymous();
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/evenements' && pathname.startsWith(href));
  return (
    <Link href={href} className="navbar-link" aria-current={isActive ? 'page' : undefined}>
      {label}
    </Link>
  );
}

function DesktopAuthActions({
  authState,
  showWaitlistCta = false,
}: {
  authState: NavAuthState;
  showWaitlistCta?: boolean;
}) {
  return (
    <AuthStateView
      authState={authState}
      loading={() => (
      <div className="hidden items-center gap-3 md:flex" aria-hidden="true">
        <Skeleton className="h-9 w-24 rounded-full bg-white/60" />
        <Skeleton className="h-10 w-36 rounded-full bg-white/70 shadow-[var(--shadow-soft-line)]" />
      </div>
      )}
      authenticated={(user) => {
        const fullName = `${user.firstName} ${user.lastName}`.trim();

        return (
          <Link
            href="/tableau-de-bord/profil"
            className="navbar-profile hidden md:flex"
            aria-label="Ouvrir le profil utilisateur"
          >
            <span className="navbar-profile-copy">
              <span className="navbar-profile-label">Profil</span>
              <span className="navbar-profile-name">{user.firstName || user.email}</span>
            </span>
            <Avatar
              src={user.avatarUrl}
              fallback={getInitials(fullName || user.email)}
              alt={fullName || user.email}
              size="sm"
            />
            <ChevronDown className="h-4 w-4 text-on-surface-variant" aria-hidden="true" />
          </Link>
        );
      }}
      anonymous={() => (
        <div className="navbar-actions hidden md:flex">
          <Link href="/connexion" className="navbar-link-tertiary">
            Se connecter
          </Link>
          {showWaitlistCta && (
            <>
              <Link href="/inscription" className="navbar-btn-secondary">
                S&apos;inscrire
              </Link>
              <a href="#cta" className="navbar-btn-primary">
                Rejoindre le mouvement
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </>
          )}
          {!showWaitlistCta && (
            <Link href="/inscription" className="navbar-btn-primary">
              S&apos;inscrire gratuitement
            </Link>
          )}
        </div>
      )}
    />
  );
}

function MobileAuthActions({
  authState,
  showWaitlistCta = false,
}: {
  authState: NavAuthState;
  showWaitlistCta?: boolean;
}) {
  return (
    <AuthStateView
      authState={authState}
      loading={() => (
        <div className="navbar-mobile-skeleton" aria-hidden="true">
          <Skeleton className="h-7 w-32 rounded-full bg-white/15" />
          <Skeleton className="h-12 w-full rounded-[18px] bg-white/12" />
        </div>
      )}
      authenticated={(user) => {
        const fullName = `${user.firstName} ${user.lastName}`.trim();

        return (
          <Link href="/tableau-de-bord/profil" className="navbar-mobile-profile">
            <Avatar
              src={user.avatarUrl}
              fallback={getInitials(fullName || user.email)}
              alt={fullName || user.email}
              size="sm"
            />
            <span>
              <span>Profil utilisateur</span>
              <small>{user.firstName || user.email}</small>
            </span>
          </Link>
        );
      }}
      anonymous={() => (
        <>
          <Link href="/connexion" className="navbar-mobile-muted">
            Se connecter
          </Link>
          {showWaitlistCta && (
            <>
              <Link href="/inscription" className="navbar-mobile-muted">
                S&apos;inscrire
              </Link>
              <a href="#cta" className="navbar-btn-primary">
                Rejoindre le mouvement
              </a>
            </>
          )}
          {!showWaitlistCta && (
            <Link href="/inscription" className="navbar-btn-primary">
              S&apos;inscrire gratuitement
            </Link>
          )}
        </>
      )}
    />
  );
}

export function PublicNavbar({ showWaitlistCta = false, fixed = false }: PublicNavbarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const { scrollY } = useScroll();
  const solidProgress = useTransform(scrollY, [0, 72], [0, 1]);
  const backgroundColor = useTransform(
    solidProgress,
    [0, 1],
    ['rgba(255,255,255,0.54)', 'rgba(255,255,255,0.86)'],
  );
  const borderColor = useTransform(
    solidProgress,
    [0, 1],
    ['rgba(255,255,255,0.28)', 'rgba(30,61,79,0.12)'],
  );
  const boxShadow = useTransform(
    solidProgress,
    [0, 1],
    ['0 18px 50px rgba(15,34,48,0.08)', '0 18px 50px rgba(15,34,48,0.14)'],
  );
  const backdropFilter = useTransform(solidProgress, [0, 1], ['blur(14px)', 'blur(24px)']);
  const authState: NavAuthState = isLoading
    ? { status: 'loading' }
    : user
      ? { status: 'authenticated', user }
      : { status: 'anonymous' };

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <motion.nav
        className={cn('public-navbar solid', fixed && 'is-fixed')}
        style={fixed ? { backgroundColor, borderColor, boxShadow, backdropFilter, WebkitBackdropFilter: backdropFilter } : undefined}
      >
        <Link href="/" className="navbar-logo">
          Elintys
        </Link>

        <div className="navbar-links hidden md:flex">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.href} href={l.href} label={l.label} />
          ))}
        </div>

        <DesktopAuthActions authState={authState} showWaitlistCta={showWaitlistCta} />

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
      </motion.nav>

      {menuOpen && (
        <div className="navbar-mobile-drawer" onClick={() => setMenuOpen(false)}>
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="navbar-mobile-link">
              {l.label}
            </Link>
          ))}
          <MobileAuthActions authState={authState} showWaitlistCta={showWaitlistCta} />
        </div>
      )}
    </>
  );
}
