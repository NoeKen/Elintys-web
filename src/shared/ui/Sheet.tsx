'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { IconClose } from '@/lib/icons';
import { cn } from '@/shared/lib/utils';
import { modalOverlay, slideInRight, slideInLeft } from '@/lib/animations';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: 'left' | 'right';
  title?: string;
  children: React.ReactNode;
}

export function Sheet({ open, onOpenChange, side = 'right', title, children }: SheetProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-primary/30 backdrop-blur-sm"
                variants={shouldReduceMotion ? {} : modalOverlay}
                initial={shouldReduceMotion ? false : 'hidden'}
                animate="visible"
                exit={shouldReduceMotion ? {} : 'exit'}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className={cn(
                  'fixed top-0 bottom-0 z-50 w-80 p-6',
                  'bg-white/90 backdrop-blur-[20px]',
                  'shadow-[0px_12px_32px_rgba(13,30,53,0.12)]',
                  'focus:outline-none overflow-y-auto',
                  side === 'right' ? 'right-0' : 'left-0'
                )}
                variants={shouldReduceMotion ? {} : (side === 'right' ? slideInRight : slideInLeft)}
                initial={shouldReduceMotion ? false : 'hidden'}
                animate="visible"
                exit={shouldReduceMotion ? {} : 'exit'}
              >
                <div className="mb-6 flex items-center justify-between">
                  {title && (
                    <Dialog.Title className="font-serif text-xl text-on-surface">
                      {title}
                    </Dialog.Title>
                  )}
                  <Dialog.Close asChild>
                    <button
                      aria-label="Fermer"
                      className="ml-auto rounded-md p-1 text-on-surface-variant hover:bg-surface-low focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      <IconClose size={18} />
                    </button>
                  </Dialog.Close>
                </div>
                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
