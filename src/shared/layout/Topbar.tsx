'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { Avatar } from '@/shared/ui/Avatar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { IconMenu } from '@/lib/icons';
import { fadeSlideDown } from '@/lib/animations';
import { cn, getInitials } from '@/shared/lib/utils';

const BREADCRUMBS: Record<string, string> = {
  '/tableau-de-bord': 'Tableau de bord',
  '/tableau-de-bord/profil': 'Profil utilisateur',
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
  const router = useRouter();
  const { logout, user } = useAuth();
  const prefersReduced = useReducedMotion();
  const breadcrumb = getBreadcrumb(pathname);

  const headerVariants = prefersReduced ? {} : fadeSlideDown;

  const handleLogout = async () => {
    await logout();
    router.replace('/connexion');
    router.refresh();
  };

  return (
    <motion.header
      variants={headerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'sticky top-3 z-40 mx-3 mt-3 flex h-14 items-center gap-4 rounded-full border border-white/50 px-4',
        'bg-white/70 shadow-nav backdrop-blur-[24px]'
      )}
    >
      <button
        onClick={onMenuClick}
        aria-label="Ouvrir le menu"
        className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-teal-pale hover:text-primary md:hidden"
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
              className="text-sm font-bold text-on-surface"
            >
              {breadcrumb}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Se déconnecter"
          title="Se déconnecter"
          className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-terracotta-pale hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <LogOut size={17} aria-hidden="true" />
        </button>
        {user && (
          <Link
            href="/tableau-de-bord/profil"
            aria-label="Ouvrir le profil utilisateur"
            title="Profil utilisateur"
            className="rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Avatar
              src={user.avatarUrl}
              fallback={getInitials(`${user.firstName} ${user.lastName}`)}
              alt={`${user.firstName} ${user.lastName}`}
              size="sm"
            />
          </Link>
        )}
      </div>
    </motion.header>
  );
}
