"use client";

import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@/shared/types";
import { cn } from "@/shared/lib/utils";

interface RoleCardProps {
  icon: LucideIcon;
  iconClassName: string;
  title: string;
  description: string;
  value: UserRole;
  selected: boolean;
  onSelect: (value: UserRole) => void;
}

export function RoleCard({
  icon: Icon,
  iconClassName,
  title,
  description,
  value,
  selected,
  onSelect,
}: RoleCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(value)}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-2xl text-left cursor-pointer hover-lift",
        "border transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        selected
          ? "bg-teal-pale/85 border-teal shadow-float"
          : "bg-white/70 border-outline-variant hover:border-teal/40 hover:bg-white/90"
      )}
    >
      <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center shrink-0", iconClassName)}>
        <Icon size={20} />
      </div>

      {/* Texte */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-on-surface">{title}</p>
        <p className="text-xs text-on-surface-variant mt-0.5">{description}</p>
      </div>

      {/* Radio visuel */}
      <div
        className={cn(
          "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
          selected ? "border-teal bg-teal" : "border-outline-variant bg-white/70"
        )}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-white" />}
      </div>
    </button>
  );
}
