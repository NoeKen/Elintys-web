'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { tooltipScale } from '@/lib/animations';
import { cn } from '@/shared/lib/utils';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  return (
    <RadixTooltip.Provider delayDuration={300}>
      <RadixTooltip.Root open={open} onOpenChange={setOpen}>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <AnimatePresence>
          {open && (
            <RadixTooltip.Portal forceMount>
              <RadixTooltip.Content forceMount side={side} sideOffset={6} asChild>
                <motion.div
                  variants={shouldReduceMotion ? {} : tooltipScale}
                  initial={shouldReduceMotion ? false : 'hidden'}
                  animate="visible"
                  exit={shouldReduceMotion ? {} : 'exit'}
                  className={cn(
                    'z-50 rounded-[6px] px-3 py-1.5 text-xs font-medium',
                    'bg-on-surface text-surface-lowest',
                    'shadow-[0px_4px_12px_rgba(13,30,53,0.16)]',
                    className
                  )}
                >
                  {content}
                </motion.div>
              </RadixTooltip.Content>
            </RadixTooltip.Portal>
          )}
        </AnimatePresence>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
