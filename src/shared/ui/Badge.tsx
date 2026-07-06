'use client';

import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';
import { chipBounce } from '@/lib/animations';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default:     'bg-primary/10 text-primary',
        accent:      'bg-accent-light text-accent',
        teal:        'bg-accent-light text-accent',
        amber:       'bg-amber/10 text-amber',
        success:     'bg-success/10 text-success',
        error:       'bg-destructive/10 text-destructive',
        destructive: 'bg-destructive/10 text-destructive',
        outline:     'border border-outline-variant text-on-surface-variant',
        neutral:     'border border-outline-variant text-on-surface-variant',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  animate?: boolean;
}

export function Badge({ className, variant, animate = false, ...props }: BadgeProps) {
  if (animate) {
    return (
      <motion.span
        className={cn(badgeVariants({ variant }), className)}
        variants={chipBounce}
        initial="hidden"
        animate="visible"
        {...(props as React.ComponentProps<typeof motion.span>)}
      />
    );
  }

  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
