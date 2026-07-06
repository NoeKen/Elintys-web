import type { Variants } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';

export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: { duration: 0.24, ease: [0.55, 0, 1, 0.45] },
  },
};

export const fadeSlideDown: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.18, ease: [0.55, 0, 1, 0.45] },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 8,
    transition: { duration: 0.18, ease: [0.55, 0, 1, 0.45] },
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    x: 16,
    transition: { duration: 0.21, ease: [0.55, 0, 1, 0.45] },
  },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    x: -16,
    transition: { duration: 0.21, ease: [0.55, 0, 1, 0.45] },
  },
};

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const cardHover = {
  rest: { y: 0, boxShadow: '0px 4px 16px rgba(13,30,53,0.04)' },
  hover: {
    y: -2,
    boxShadow: '0px 12px 32px rgba(13,30,53,0.10)',
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
};

export const buttonPress = {
  tap: { scale: 0.97, transition: { duration: 0.15 } },
};

export const chipBounce: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 500, damping: 20 },
  },
};

export function useReducedMotionVariants<T>(full: T, reduced: T): T {
  const prefersReduced = useReducedMotion();
  return prefersReduced ? reduced : full;
}

// Floating label animation states for Input component
export const floatingLabelTransition = {
  duration: 0.2,
  ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
};

export const floatingLabelUp = { y: -20, scale: 0.8 };
export const floatingLabelDown = { y: 0, scale: 1 };

// Error reveal for Input (used with AnimatePresence)
export const inputErrorReveal = {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};
