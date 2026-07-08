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
    'rounded-[14px] p-6',
    glass
      ? 'bg-white/85 backdrop-blur-[20px]'
      : 'bg-surface-lowest',
    'shadow-[0px_4px_16px_rgba(13,30,53,0.04)]',
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
  return <h3 className={cn('text-lg font-semibold text-on-surface font-sans', className)} {...props} />;
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
