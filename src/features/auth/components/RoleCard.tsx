"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface RoleCardProps {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  value: string;
  selected: boolean;
  onSelect: (value: string) => void;
}

export function RoleCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  description,
  value,
  selected,
  onSelect,
}: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-xl text-left cursor-pointer",
        "border-[1.5px] transition-colors duration-150",
        selected
          ? "bg-accent-light border-accent"
          : "bg-surface border-outline-variant hover:border-accent/40"
      )}
    >
      {/* Icône */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={20} style={{ color: iconColor }} />
      </div>

      {/* Texte */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-on-surface">{title}</p>
        <p className="text-xs text-on-surface-variant mt-0.5">{description}</p>
      </div>

      {/* Radio visuel */}
      <div
        className={cn(
          "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
          selected ? "border-accent" : "border-outline-variant"
        )}
      >
        {selected && <div className="w-2 h-2 rounded-full bg-accent" />}
      </div>
    </button>
  );
}
