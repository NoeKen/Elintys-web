'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { IconClose } from '@/lib/icons';
import { cn } from '@/shared/lib/utils';
import { modalOverlay } from '@/lib/animations';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: 'left' | 'right';
  title?: string;
  children: React.ReactNode;
}

export function Sheet({ open, onOpenChange, side = 'right', title, children }: SheetProps) {
  const xInitial = side === 'right' ? 24 : -24;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-primary/30 backdrop-blur-sm"
                variants={modalOverlay}
                initial="hidden"
                animate="visible"
                exit="exit"
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
                initial={{ opacity: 0, x: xInitial }}
                animate={{ opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } }}
                exit={{ opacity: 0, x: xInitial, transition: { duration: 0.21, ease: [0.55, 0, 1, 0.45] } }}
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
