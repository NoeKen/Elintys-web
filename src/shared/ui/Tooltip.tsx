'use client';

import * as RadixTooltip from '@radix-ui/react-tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={300}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content side={side} sideOffset={6} asChild>
            <motion.div
              className={cn(
                'rounded-[6px] bg-primary px-2.5 py-1.5 text-xs font-medium text-white',
                'shadow-[0px_4px_16px_rgba(13,30,53,0.10)]',
                'max-w-[200px] text-center',
                className
              )}
              initial={{ opacity: 0, scale: 0.92, y: side === 'top' ? 4 : -4 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.15 } }}
              exit={{ opacity: 0, scale: 0.92 }}
            >
              {content}
              <RadixTooltip.Arrow className="fill-primary" />
            </motion.div>
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
