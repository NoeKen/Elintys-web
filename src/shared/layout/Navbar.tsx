"use client";

import { Bell } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Avatar } from "@/shared/ui/Avatar";
import { useAuth } from "@/shared/hooks/useAuth";

export function Navbar() {
  const { user } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-outline-variant bg-surface px-6">
      <div />
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell size={18} />
        </Button>
        {user && (
          <Avatar
            src={user.avatarUrl}
            fallback={`${user.firstName[0]}${user.lastName[0]}`}
            alt={`${user.firstName} ${user.lastName}`}
            size="sm"
          />
        )}
      </div>
    </header>
  );
}
