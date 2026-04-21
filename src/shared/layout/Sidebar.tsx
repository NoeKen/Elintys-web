"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Briefcase,
  Ticket,
  Settings,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { ROUTES } from "@/shared/constants/routes";
import { Avatar } from "@/shared/ui/Avatar";
import { useAuth } from "@/shared/hooks/useAuth";

interface SidebarProps {
  session?: { id: string; email: string; role: string };
}

const navItems = [
  { label: "Tableau de bord", href: ROUTES.DASHBOARD.HOME, icon: LayoutDashboard },
  { label: "Événements", href: ROUTES.DASHBOARD.EVENTS, icon: CalendarDays },
  { label: "Prestataires", href: ROUTES.DASHBOARD.VENDORS, icon: Briefcase },
  { label: "Invités", href: ROUTES.DASHBOARD.GUESTS, icon: Users },
  { label: "Billetterie", href: ROUTES.DASHBOARD.TICKETS, icon: Ticket },
];

export function Sidebar({ session: _ }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-outline-variant bg-surface py-6">
      <div className="px-6 mb-8">
        <span className="font-serif text-2xl font-normal text-primary">Elintys</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-accent-light text-accent"
                  : "text-on-surface-variant hover:bg-surface-low hover:text-on-surface"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-outline-variant px-3 pt-4">
        <Link
          href={ROUTES.DASHBOARD.SETTINGS}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith(ROUTES.DASHBOARD.SETTINGS)
              ? "bg-accent-light text-accent"
              : "text-on-surface-variant hover:bg-surface-low hover:text-on-surface"
          )}
        >
          <Settings size={18} />
          Paramètres
        </Link>

        {user && (
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
        )}
      </div>
    </aside>
  );
}
