'use client';

import { useId, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { floatingLabelTransition, floatingLabelUp, floatingLabelDown, inputErrorReveal } from '@/lib/animations';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  floatingLabel?: boolean;
}

export function Input({
  className,
  label,
  error,
  floatingLabel = false,
  id: externalId,
  value,
  defaultValue,
  onFocus,
  onBlur,
  onChange,
  ...props
}: InputProps) {
  const autoId = useId();
  const id = externalId ?? autoId;
  const [focused, setFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const controlled = value !== undefined;
  const currentValue = controlled ? value : internalValue;
  const hasValue = Boolean(currentValue) && String(currentValue).length > 0;
  const isFloated = focused || hasValue;
  const shouldReduceMotion = useReducedMotion();

  if (!floatingLabel) {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-on-surface">
            {label}
          </label>
        )}
        <input
          id={id}
          value={value}
          defaultValue={defaultValue}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={onChange}
          className={cn(
            'h-10 w-full rounded-[8px] border border-outline-variant bg-surface-lowest px-3 py-2 text-sm',
            'text-on-surface placeholder:text-on-surface-variant',
            'transition-all duration-200 ease-out',
            'focus:outline-2 focus:outline-accent focus:outline-offset-0 focus:border-accent/40 focus:bg-surface-lowest',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus:outline-destructive',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col">
      <div className={cn(
        'relative border-b-2 transition-all duration-200',
        focused ? 'border-accent/60' : 'border-outline-variant/30',
        error && 'border-destructive'
      )}>
        {label && (
          <motion.label
            htmlFor={id}
            className="absolute left-0 origin-left pointer-events-none font-medium text-on-surface-variant"
            animate={
              shouldReduceMotion
                ? {}
                : isFloated
                  ? { ...floatingLabelUp, color: error ? '#DC2626' : focused ? '#4A8E9E' : '#4F5F79' }
                  : { ...floatingLabelDown, color: '#4F5F79' }
            }
            transition={shouldReduceMotion ? { duration: 0 } : floatingLabelTransition}
            style={{ fontSize: 14, top: 10 }}
          >
            {label}
          </motion.label>
        )}
        <input
          id={id}
          value={value}
          defaultValue={defaultValue}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          onChange={(e) => {
            if (!controlled) setInternalValue(e.target.value);
            onChange?.(e);
          }}
          className={cn(
            'w-full bg-transparent pt-6 pb-2 text-sm text-on-surface',
            'focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            label ? 'placeholder:opacity-0 focus:placeholder:opacity-50' : '',
            className
          )}
          placeholder={label ? ' ' : props.placeholder}
          {...props}
        />
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={shouldReduceMotion ? {} : inputErrorReveal.initial}
            animate={inputErrorReveal.animate}
            exit={shouldReduceMotion ? {} : inputErrorReveal.exit}
            className="mt-1 text-xs text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
