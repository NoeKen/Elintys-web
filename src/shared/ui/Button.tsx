'use client';

import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { buttonPress } from '@/lib/animations';
import { IconLoader } from '@/lib/icons';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        primary:     '[background:var(--gradient-premium-button)] text-white shadow-[var(--shadow-soft-line),0_14px_30px_rgba(30,61,79,0.20)] hover:shadow-[var(--shadow-soft-line),0_18px_42px_rgba(30,61,79,0.26)]',
        accent:      '[background:var(--gradient-premium-button)] text-white shadow-[var(--shadow-soft-line),0_14px_30px_rgba(30,61,79,0.20)] hover:shadow-[var(--shadow-soft-line),0_18px_42px_rgba(30,61,79,0.26)]',
        secondary:   'border border-accent/30 bg-white/70 text-teal-dark shadow-[var(--shadow-soft-line)] hover:bg-teal-pale',
        tertiary:    'bg-transparent text-accent underline-offset-4 hover:underline',
        outline:     'border border-outline-variant/70 bg-white/70 text-on-surface shadow-[var(--shadow-soft-line)] hover:bg-white/90',
        ghost:       'text-on-surface hover:bg-white/65',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
        link:        'text-accent underline-offset-4 hover:underline',
      },
      size: {
        sm:   'h-8 px-3 text-xs',
        md:   'h-10 px-5',
        lg:   'h-12 px-7 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';

  return (
    <motion.div
      whileTap={buttonPress.tap}
      whileHover={{ y: -1, filter: 'brightness(1.04)' }}
      transition={{ duration: 0.15 }}
      style={{ display: 'inline-flex' }}
    >
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled ?? loading}
        {...props}
      >
        {loading ? (
          <IconLoader className="animate-spin" size={16} />
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            {children}
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </Comp>
    </motion.div>
  );
}
