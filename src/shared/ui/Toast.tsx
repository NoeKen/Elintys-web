'use client';

import * as RadixToast from '@radix-ui/react-toast';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { toastSlide } from '@/lib/animations';
import { IconClose, IconCheck, IconWarning, IconInfo } from '@/lib/icons';
import { cn } from '@/shared/lib/utils';

interface ToastProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
}

const VARIANT_STYLES: Record<NonNullable<ToastProps['variant']>, string> = {
  success: 'border-l-4 border-l-accent bg-accent-light text-accent',
  error: 'border-l-4 border-l-destructive bg-destructive/5 text-destructive',
  warning: 'border-l-4 border-l-amber bg-amber/5 text-amber',
  info: 'border-l-4 border-l-primary bg-primary/5 text-primary',
};

const VARIANT_ICONS: Record<NonNullable<ToastProps['variant']>, React.ElementType> = {
  success: IconCheck,
  error: IconWarning,
  warning: IconWarning,
  info: IconInfo,
};

export function Toast({ open, onOpenChange, title, description, variant = 'info' }: ToastProps) {
  const Icon = VARIANT_ICONS[variant];
  const shouldReduceMotion = useReducedMotion();

  return (
    <RadixToast.Provider swipeDirection="right">
      <AnimatePresence>
        {open && (
          <RadixToast.Root asChild open={open} onOpenChange={onOpenChange} forceMount>
            <motion.div
              className={cn(
                'flex items-start gap-3 rounded-[8px] p-4 shadow-[0px_4px_16px_rgba(13,30,53,0.10)]',
                'bg-surface-lowest',
                VARIANT_STYLES[variant]
              )}
              variants={shouldReduceMotion ? {} : toastSlide}
              initial={shouldReduceMotion ? false : 'hidden'}
              animate="visible"
              exit={shouldReduceMotion ? {} : 'exit'}
            >
              <Icon size={18} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <RadixToast.Title className="text-sm font-semibold">{title}</RadixToast.Title>
                {description && (
                  <RadixToast.Description className="mt-0.5 text-xs opacity-80">
                    {description}
                  </RadixToast.Description>
                )}
              </div>
              <RadixToast.Close aria-label="Fermer" className="ml-2">
                <IconClose size={14} className="opacity-50 hover:opacity-100" />
              </RadixToast.Close>
            </motion.div>
          </RadixToast.Root>
        )}
      </AnimatePresence>
      <RadixToast.Viewport className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80" />
    </RadixToast.Provider>
  );
}
