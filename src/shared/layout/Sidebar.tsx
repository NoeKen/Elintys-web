"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import type { ComponentType } from "react";
import { cn } from "@/shared/lib/utils";
import { Avatar } from "@/shared/ui/Avatar";
import { useAuth } from "@/shared/hooks/useAuth";
import {
  buildNavSections,
  type SidebarIconName,
} from "@/shared/layout/sidebar-nav";

interface SidebarProps {
  session?: { id: string; email: string; role: string };
}

const ICON_MAP: Record<SidebarIconName, ComponentType<{ className?: string; size?: number }>> = {
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

function SidebarIcon({
  name,
  className,
}: {
  name: SidebarIconName;
  className?: string;
}) {
  const Icon = ICON_MAP[name];
  return <Icon className={className} size={18} />;
}

export function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  void session;

  if (!user) return null;

  const sections = buildNavSections(user.roles ?? []);

  return (
    <aside className="flex h-full w-60 flex-col border-r border-outline-variant bg-surface py-6">
      <div className="px-6 mb-8">
        <span className="font-serif text-2xl font-normal text-primary">Elintys</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {sections.map((section, sectionIndex) => (
          <div key={`${section.label}-${sectionIndex}`} className="mb-2">
            {section.label && (
              <p
                className={cn(
                  "px-3 mb-1 text-[10px] font-medium uppercase tracking-wider text-on-surface-variant",
                  sectionIndex > 0 && "mt-4 pt-4 border-t border-outline-variant"
                )}
              >
                {section.label}
              </p>
            )}

            {section.items.map((item) => {
              const active =
                item.href === "/tableau-de-bord"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent-light text-accent"
                      : "text-on-surface-variant hover:bg-surface-low hover:text-on-surface"
                  )}
                >
                  <SidebarIcon name={item.icon} className="h-[18px] w-[18px] flex-shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={cn(
                        "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                        active ? "bg-accent text-white" : "bg-accent-light text-accent"
                      )}
                    >
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-outline-variant px-3 pt-4">
        <div className="mt-3 flex items-center gap-3 px-3 py-2">
          <Avatar
            src={user.avatarUrl}
            fallback={`${user.firstName[0]}${user.lastName[0]}`}
            alt={`${user.firstName} ${user.lastName}`}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-on-surface">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-on-surface-variant">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
