'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Building2, Calendar, CalendarCheck, CalendarDays, Handshake,
  Heart, Inbox, LayoutGrid, MapPin, MessageSquare, Search,
  Settings, Star, Ticket, Users,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '@/shared/lib/utils';
import { Avatar } from '@/shared/ui/Avatar';
import { Tooltip } from '@/shared/ui/Tooltip';
import { useAuth } from '@/shared/hooks/useAuth';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { IconSidebarCollapse, IconSidebarExpand } from '@/lib/icons';
import { buildNavSections, type SidebarIconName } from '@/shared/layout/sidebar-nav';
import { staggerContainer, staggerItem } from '@/lib/animations';

const ICON_MAP: Record<SidebarIconName, ComponentType<{ className?: string; size?: number }>> = {
  grid: LayoutGrid,
  calendar: Calendar,
  users: Users,
  building: Building2,
  'message-square': MessageSquare,
  star: Star,
  inbox: Inbox,
  handshake: Handshake,
  'map-pin': MapPin,
  'calendar-check': CalendarCheck,
  'calendar-days': CalendarDays,
  ticket: Ticket,
  heart: Heart,
  search: Search,
  settings: Settings,
  'star-half': Star,
};

function SidebarIcon({ name, className }: { name: SidebarIconName; className?: string }) {
  const Icon = ICON_MAP[name];
  return <Icon className={className} size={18} />;
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const prefersReduced = useReducedMotion();

  if (!user) return null;

  const sections = buildNavSections(user.roles ?? []);

  const sidebarTransition = prefersReduced
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 300, damping: 30 };

  const navVariants = prefersReduced
    ? {}
    : staggerContainer;

  const itemVariants = prefersReduced
    ? {}
    : staggerItem;

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={sidebarTransition}
      className="relative flex h-full flex-shrink-0 flex-col bg-surface-low py-6 overflow-hidden"
    >
      {/* Logo */}
      <div className="px-4 mb-8 flex items-center justify-between overflow-hidden">
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="font-serif text-2xl font-normal text-primary whitespace-nowrap"
            >
              Elintys
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Étendre la barre latérale' : 'Réduire la barre latérale'}
          className="ml-auto flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface transition-colors"
        >
          {collapsed ? <IconSidebarExpand size={16} /> : <IconSidebarCollapse size={16} />}
        </button>
      </div>

      {/* Nav */}
      <motion.nav
        className="flex flex-1 flex-col gap-1 px-2 overflow-y-auto overflow-x-hidden"
        variants={navVariants}
        initial="hidden"
        animate="visible"
      >
        {sections.map((section, sectionIndex) => (
          <motion.div key={`${section.label}-${sectionIndex}`} className="mb-2" variants={itemVariants}>
            {section.label && !collapsed && (
              <p className={cn(
                'px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant',
                sectionIndex > 0 && 'mt-4 pt-4'
              )}>
                {section.label}
              </p>
            )}

            {section.items.map((item) => {
              const active = item.href === '/tableau-de-bord'
                ? pathname === item.href
                : pathname.startsWith(item.href);

              const linkContent = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm font-medium transition-colors',
                    collapsed ? 'justify-center' : '',
                    active
                      ? 'text-accent'
                      : 'text-on-surface-variant hover:bg-surface hover:text-on-surface'
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-active-indicator"
                      className="absolute inset-0 rounded-[8px] bg-accent-light"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex-shrink-0">
                    <SidebarIcon name={item.icon} className="h-[18px] w-[18px]" />
                  </span>

                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="relative z-10 flex-1 truncate overflow-hidden whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {!collapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className={cn(
                      'relative z-10 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                      active ? 'bg-accent text-white' : 'bg-accent-light text-accent'
                    )}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              );

              return collapsed ? (
                <Tooltip key={item.href} content={item.label} side="right">
                  {linkContent}
                </Tooltip>
              ) : linkContent;
            })}
          </motion.div>
        ))}
      </motion.nav>

      {/* User footer */}
      <div className="px-2 pt-4">
        {!collapsed && (
          <div className="flex items-center justify-end px-3 py-1">
            <NotificationBell />
          </div>
        )}
        <div className={cn('flex items-center gap-3 px-3 py-2', collapsed && 'justify-center')}>
          <Avatar
            src={user.avatarUrl}
            fallback={`${user.firstName[0]}${user.lastName[0]}`}
            alt={`${user.firstName} ${user.lastName}`}
            size="sm"
          />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="min-w-0 overflow-hidden"
              >
                <p className="truncate text-sm font-medium text-on-surface whitespace-nowrap">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-xs text-on-surface-variant whitespace-nowrap">{user.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
