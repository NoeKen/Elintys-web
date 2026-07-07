'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/shared/hooks/useAuth';
import { Avatar } from '@/shared/ui/Avatar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { IconMenu } from '@/lib/icons';
import { fadeSlideDown } from '@/lib/animations';
import { cn } from '@/shared/lib/utils';

const BREADCRUMBS: Record<string, string> = {
  '/tableau-de-bord': 'Tableau de bord',
  '/invites': 'Invités',
  '/billetterie': 'Billetterie',
  '/parametres': 'Paramètres',
  '/messages': 'Messages',
  '/favoris': 'Favoris',
  '/evenements': 'Événements',
  '/prestataires': 'Prestataires',
};

function getBreadcrumb(pathname: string): string {
  const match = Object.keys(BREADCRUMBS)
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname.startsWith(key));
  return match ? BREADCRUMBS[match] : '';
}

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const prefersReduced = useReducedMotion();
  const breadcrumb = getBreadcrumb(pathname);

  const headerVariants = prefersReduced ? {} : fadeSlideDown;

  return (
    <motion.header
      variants={headerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'sticky top-0 z-40 flex h-14 items-center gap-4 px-4',
        'bg-surface/80 backdrop-blur-[20px]',
        'shadow-[0_1px_0_rgba(13,30,53,0.06)]'
      )}
    >
      <button
        onClick={onMenuClick}
        aria-label="Ouvrir le menu"
        className="flex h-8 w-8 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-low transition-colors md:hidden"
      >
        <IconMenu size={18} />
      </button>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {breadcrumb && (
            <motion.p
              key={breadcrumb}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-semibold text-on-surface"
            >
              {breadcrumb}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        {user && (
          <Avatar
            src={user.avatarUrl}
            fallback={`${user.firstName[0]}${user.lastName[0]}`}
            alt={`${user.firstName} ${user.lastName}`}
            size="sm"
          />
        )}
      </div>
    </motion.header>
  );
}
