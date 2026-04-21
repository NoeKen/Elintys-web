"use client";

import * as RadixAvatar from "@radix-ui/react-avatar";
import { cn } from "@/shared/lib/utils";

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-base" };

export function Avatar({ src, alt, fallback, size = "md", className }: AvatarProps) {
  return (
    <RadixAvatar.Root className={cn("relative flex shrink-0 overflow-hidden rounded-full", sizeMap[size], className)}>
      <RadixAvatar.Image src={src} alt={alt} className="aspect-square h-full w-full object-cover" />
      <RadixAvatar.Fallback className="flex h-full w-full items-center justify-center bg-accent-light font-semibold text-accent">
        {fallback.slice(0, 2).toUpperCase()}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}
