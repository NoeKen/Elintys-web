'use client';

import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { buttonPress } from '@/lib/animations';
import { IconLoader } from '@/lib/icons';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        primary:     'bg-accent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] hover:bg-accent/90',
        accent:      'bg-accent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] hover:bg-accent/90',
        secondary:   'border border-accent text-accent bg-transparent hover:bg-accent hover:text-white',
        tertiary:    'text-accent hover:underline underline-offset-4 bg-transparent',
        outline:     'border border-outline-variant bg-surface text-on-surface hover:bg-surface-low',
        ghost:       'text-on-surface hover:bg-surface-low',
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
