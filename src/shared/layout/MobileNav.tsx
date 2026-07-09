'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { LayoutGrid } from 'lucide-react';
import { IconCalendar, IconRequests, IconSearch, IconSettings } from '@/lib/icons';
import type { ComponentType } from 'react';
import { cn } from '@/shared/lib/utils';

interface MobileNavItem {
  href: string;
  label: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
}

const MOBILE_ITEMS: MobileNavItem[] = [
  { href: '/tableau-de-bord', label: 'Accueil', Icon: LayoutGrid },
  { href: '/evenements', label: 'Événements', Icon: IconCalendar },
  { href: '/messages', label: 'Messages', Icon: IconRequests },
  { href: '/prestataires', label: 'Explorer', Icon: IconSearch },
  { href: '/parametres', label: 'Paramètres', Icon: IconSettings },
];

export function MobileNav() {
  const pathname = usePathname();
  const prefersReduced = useReducedMotion();

  return (
    <nav
      className="fixed bottom-4 left-4 right-4 z-40 flex h-16 rounded-full border border-white/50 bg-white/78 shadow-nav backdrop-blur-[24px] md:hidden"
      aria-label="Navigation mobile"
    >
      {MOBILE_ITEMS.map(({ href, label, Icon }) => {
        const active =
          href === '/tableau-de-bord'
            ? pathname === href
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 rounded-full transition-colors',
              active ? 'text-teal-dark' : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            <motion.div
              whileTap={prefersReduced ? undefined : { scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className="flex flex-col items-center gap-0.5"
            >
              <div className="relative">
                <Icon size={20} />
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
              <span className="text-[10px] font-semibold leading-none">{label}</span>
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}
