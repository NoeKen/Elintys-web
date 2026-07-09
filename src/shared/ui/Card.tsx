'use client';

import { motion, type Variants } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { cardHover } from '@/lib/animations';

const cardHoverVariants = cardHover as Variants;

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  glass?: boolean;
}

export function Card({ className, interactive = false, glass = false, ...props }: CardProps) {
  const base = cn(
    'rounded-2xl border p-6',
    glass
      ? 'border-white/50 bg-white/72 backdrop-blur-[24px]'
      : 'border-outline-variant/60 bg-white/78',
    'shadow-[var(--shadow-float)]',
    className
  );

  if (interactive) {
    return (
      <motion.div
        className={base}
        variants={cardHoverVariants}
        initial="rest"
        whileHover="hover"
        animate="rest"
        {...(props as React.ComponentProps<typeof motion.div>)}
      />
    );
  }

  return <div className={base} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex flex-col gap-1', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-serif text-2xl leading-tight text-navy-dark', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-on-surface-variant', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-4 flex items-center gap-2', className)} {...props} />;
}
