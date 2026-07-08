'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { IconClose } from '@/lib/icons';
import { cn } from '@/shared/lib/utils';
import { scaleIn, modalOverlay } from '@/lib/animations';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onOpenChange, title, description, children, className }: ModalProps) {
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
                  'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
                  'w-full max-w-lg rounded-[14px] p-6',
                  'bg-white/85 backdrop-blur-[20px]',
                  'shadow-[0px_12px_32px_rgba(13,30,53,0.12)]',
                  'focus:outline-none',
                  className
                )}
                variants={shouldReduceMotion ? {} : scaleIn}
                initial={shouldReduceMotion ? false : 'hidden'}
                animate="visible"
                exit={shouldReduceMotion ? {} : 'exit'}
              >
                {title && (
                  <Dialog.Title className="mb-1 font-serif text-xl text-on-surface">
                    {title}
                  </Dialog.Title>
                )}
                {description && (
                  <Dialog.Description className="mb-4 text-sm text-on-surface-variant">
                    {description}
                  </Dialog.Description>
                )}
                {children}
                <Dialog.Close asChild>
                  <button
                    aria-label="Fermer"
                    className="absolute right-4 top-4 rounded-md p-1 text-on-surface-variant hover:bg-surface-low focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <IconClose size={18} />
                  </button>
                </Dialog.Close>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
