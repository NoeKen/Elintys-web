'use client';

import * as RadixScroll from '@radix-ui/react-scroll-area';
import { cn } from '@/shared/lib/utils';

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  viewportClassName?: string;
}

export function ScrollArea({ children, className, viewportClassName }: ScrollAreaProps) {
  return (
    <RadixScroll.Root className={cn('overflow-hidden', className)}>
      <RadixScroll.Viewport className={cn('h-full w-full', viewportClassName)}>
        {children}
      </RadixScroll.Viewport>
      <RadixScroll.Scrollbar
        className="flex touch-none select-none transition-colors duration-150 ease-out data-[orientation=vertical]:w-1 data-[orientation=horizontal]:h-1 data-[orientation=vertical]:flex-col"
        orientation="vertical"
      >
        <RadixScroll.Thumb className="relative flex-1 rounded-full bg-outline-variant hover:bg-on-surface-variant/30" />
      </RadixScroll.Scrollbar>
      <RadixScroll.Corner />
    </RadixScroll.Root>
  );
}
