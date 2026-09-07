'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/shared/hooks/useAuth';
import { buildMobileNav, type NavItem } from '@/shared/layout/sidebar-nav';
import { NavIcon } from '@/shared/layout/nav-icons';

function isActive(pathname: string, href: string): boolean {
  // `/tableau-de-bord` est un préfixe de presque tout : il ne peut être actif
  // que sur une correspondance exacte.
  return href === '/tableau-de-bord' ? pathname === href : pathname.startsWith(href);
}

function NavLink({
  item,
  active,
  onNavigate,
  variant,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
  variant: 'bar' | 'sheet';
}) {
  const prefersReduced = useReducedMotion();

  if (variant === 'sheet') {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal',
          active ? 'bg-teal/10 text-teal-dark' : 'text-on-surface hover:bg-surface-low',
        )}
      >
        <NavIcon name={item.icon} size={18} />
        <span>{item.label}</span>
        {item.badge ? (
          <span className="ml-auto rounded-full bg-teal px-2 py-0.5 text-xs font-bold text-white">
            {item.badge}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-full transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal',
        active ? 'text-teal-dark' : 'text-on-surface-variant hover:text-on-surface',
      )}
    >
      <motion.div
        whileTap={prefersReduced ? undefined : { scale: 0.88 }}
        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
        className="flex flex-col items-center gap-0.5"
      >
        {/* `pointer-events-none` : l'icône ne doit jamais être la cible du
            clic, sinon elle intercepte l'événement destiné au lien. */}
        <div className="pointer-events-none relative">
          <NavIcon name={item.icon} size={20} />
          <AnimatePresence>
            {active && (
              <motion.div
                layoutId="mobile-nav-indicator"
                className="absolute -bottom-1 left-1/2 h-1 w-5 -translate-x-1/2 rounded-full bg-accent"
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              />
            )}
          </AnimatePresence>
        </div>
        <span className="pointer-events-none text-[10px] font-semibold leading-none">
          {item.label}
        </span>
      </motion.div>
    </Link>
  );
}

/**
 * Navigation mobile, dérivée des RÔLES de l'utilisateur.
 *
 * Elle était codée en dur et identique pour tous. Comme la barre latérale est
 * `hidden md:flex`, un prestataire ou un gestionnaire n'avait, sous 768 px,
 * aucun chemin vers ses propres écrans : ses fonctions existaient mais étaient
 * inatteignables au doigt.
 *
 * La source est `buildMobileNav`, projection de `buildNavSections` : il n'y a
 * pas de seconde logique de rôle à maintenir.
 */
export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const prefersReduced = useReducedMotion();
  const [moreOpen, setMoreOpen] = useState(false);

  const { primary, overflow } = buildMobileNav(user?.roles ?? []);

  if (primary.length === 0) return null;

  return (
    <Dialog.Root open={moreOpen} onOpenChange={setMoreOpen}>
      <nav
        className="fixed bottom-4 left-4 right-4 z-40 flex h-16 rounded-full border border-white/50 bg-white/78 shadow-nav backdrop-blur-[24px] md:hidden"
        aria-label="Navigation mobile"
        data-testid="mobile-nav"
      >
        {primary.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
            variant="bar"
          />
        ))}

        {overflow.length > 0 && (
          <Dialog.Trigger asChild>
            <button
              type="button"
              aria-label="Plus de destinations"
              data-testid="mobile-nav-more"
              className={cn(
                'flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-full transition-colors',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal',
                moreOpen ? 'text-teal-dark' : 'text-on-surface-variant hover:text-on-surface',
              )}
            >
              <MoreHorizontal size={20} aria-hidden="true" className="pointer-events-none" />
              <span className="pointer-events-none text-[10px] font-semibold leading-none">
                Plus
              </span>
            </button>
          </Dialog.Trigger>
        )}
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-40 bg-navy/20 backdrop-blur-[2px] md:hidden"
                initial={prefersReduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={prefersReduced ? undefined : { opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                id="mobile-nav-more"
                className="fixed bottom-24 left-4 right-4 z-50 rounded-2xl border border-white/50 bg-white p-2 shadow-nav focus:outline-none md:hidden"
                initial={prefersReduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReduced ? undefined : { opacity: 0, y: 12 }}
              >
                <Dialog.Title className="sr-only">Plus de destinations</Dialog.Title>
                <ul className="space-y-1">
                  {overflow.map((item) => (
                    <li key={item.href}>
                      <NavLink
                        item={item}
                        active={isActive(pathname, item.href)}
                        onNavigate={() => setMoreOpen(false)}
                        variant="sheet"
                      />
                    </li>
                  ))}
                </ul>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
