"use client";

import type { ComponentType } from "react";
import {
  Building2,
  Calendar,
  CalendarCheck,
  CalendarDays,
  Handshake,
  Heart,
  Inbox,
  LayoutGrid,
  MapPin,
  MessageSquare,
  Search,
  Settings,
  Star,
  Ticket,
  Users,
} from "lucide-react";
import type { SidebarIconName } from "@/shared/layout/sidebar-nav";

/**
 * Correspondance icône → composant, PARTAGÉE par la barre latérale et la
 * barre mobile. Une seconde copie divergerait à la première icône ajoutée.
 */
export const NAV_ICONS: Record<
  SidebarIconName,
  ComponentType<{ className?: string; size?: number }>
> = {
  grid: LayoutGrid,
  calendar: Calendar,
  users: Users,
  building: Building2,
  "message-square": MessageSquare,
  star: Star,
  inbox: Inbox,
  handshake: Handshake,
  "map-pin": MapPin,
  "calendar-check": CalendarCheck,
  "calendar-days": CalendarDays,
  ticket: Ticket,
  heart: Heart,
  search: Search,
  settings: Settings,
  "star-half": Star,
};

export function NavIcon({
  name,
  className,
  size = 18,
}: {
  name: SidebarIconName;
  className?: string;
  size?: number;
}) {
  const Icon = NAV_ICONS[name];
  return <Icon className={className} size={size} />;
}
