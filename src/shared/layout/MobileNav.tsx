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
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 bg-surface/90 backdrop-blur-[20px] shadow-[0_-1px_0_rgba(13,30,53,0.06)] md:hidden"
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
              'flex flex-1 flex-col items-center justify-center gap-1',
              active ? 'text-accent' : 'text-on-surface-variant'
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
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-accent"
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    />
                  )}
                </AnimatePresence>
              </div>
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}
