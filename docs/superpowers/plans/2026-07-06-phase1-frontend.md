# Phase 1 Frontend — Elintys-web Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Phase 1 frontend foundation for Elintys-web — animation library, motion-enhanced UI components, collapsible sidebar, Topbar, MobileNav, Lenis smooth scroll, icon registry, and a cinematic animated landing page.

**Architecture:** Layers on the existing Next.js 15 App Router + Tailwind v4 + Framer Motion stack without structural changes. New shared libraries go under `src/lib/`, enhanced components replace or augment existing ones in `src/shared/ui/` and `src/shared/layout/`. The landing page replaces the current login redirect.

**Tech Stack:** Next.js 15, React 19, TypeScript (strict), Tailwind CSS v4, Framer Motion 12, Lenis (new), Radix UI primitives, class-variance-authority, TanStack Query v5.

## Global Constraints

- Tailwind CSS v4: tokens live in `globals.css` `@theme inline {}` — **no tailwind.config.ts**
- All tokens referenced via Tailwind utility classes (e.g. `bg-accent`, `text-on-surface`) — never hex inline
- Framer Motion only on `'use client'` components — Server Components stay animation-free
- `'use client'` pushed as low as possible — never on a layout for a single interactive child
- `export` named for all components in `components/` and `shared/` — `export default` only for App Router pages
- Strict TypeScript: zero `any`, `interface` for all props, `import type` where possible
- No `console.log` in committed code
- No `border: 1px solid` for section separation — use `gap` and `padding` only (No-Line Rule)
- All interactive elements: `focus-visible:outline-2 focus-visible:outline-accent` with `outline-offset-2`
- `@media (prefers-reduced-motion: reduce)` must disable all animations
- Font: DM Serif Display (`font-serif`) for headings, Plus Jakarta Sans (`font-sans`) for UI

---

## File Map

**New files to create:**
- `src/lib/animations.ts` — Centralized Framer Motion variants + `useReducedMotionVariants` hook
- `src/lib/lenis.tsx` — LenisProvider React component + `useLenis()` hook
- `src/lib/icons.ts` — Semantic icon re-exports from lucide-react
- `src/shared/ui/Modal.tsx` — Radix Dialog with glassmorphism + scaleIn animation
- `src/shared/ui/Sheet.tsx` — Radix Dialog (drawer) with slideInRight animation
- `src/shared/ui/Skeleton.tsx` — Pulse skeleton with named variants + domain composites
- `src/shared/ui/Toast.tsx` — Radix Toast with slide animation, 4 semantic variants
- `src/shared/ui/Select.tsx` — Radix Select with ghost border styling
- `src/shared/ui/Tooltip.tsx` — Radix Tooltip, navy bg, 300ms delay
- `src/shared/ui/ScrollArea.tsx` — Radix ScrollArea with 4px custom scrollbar
- `src/shared/layout/Topbar.tsx` — Sticky blur topbar, 56px height
- `src/shared/layout/MobileNav.tsx` — Bottom navigation for mobile (<768px)

**Files to modify:**
- `src/shared/lib/utils.ts` — Add `slugify`, `truncate`, `getInitials`, `formatCurrency`, extended `formatDate`
- `src/shared/ui/Button.tsx` — Add Framer Motion `whileHover`/`whileTap`, `loading` prop, `icon` prop
- `src/shared/ui/Card.tsx` — Add `interactive` + `glass` variants with spring hover lift
- `src/shared/ui/Badge.tsx` — Add `chipBounce` entrance animation
- `src/shared/ui/Avatar.tsx` — Add gradient fallback, ensure teal initials bg
- `src/shared/ui/Input.tsx` — Add floating label animation, ghost-border-bottom rest style
- `src/shared/layout/Sidebar.tsx` — Add stagger entrance, collapse (240px↔64px spring), layoutId active pill, no border-right
- `src/app/(dashboard)/layout.tsx` — Add Topbar, MobileNav
- `src/app/globals.css` — Add reduced-motion block, focus-visible utility, `.btn-primary` + `.card-elintys` + `.chip` utility classes
- `src/app/page.tsx` — Replace login redirect with animated landing page hero
- `src/shared/guards/Providers.tsx` — Wrap with LenisProvider
- `src/shared/ui/index.ts` — Export all new components

**New page placeholders to create:**
- `src/app/(dashboard)/organisateur/page.tsx`
- `src/app/(dashboard)/organisateur/evenements/page.tsx`
- `src/app/(dashboard)/organisateur/prestataires/page.tsx`
- `src/app/(dashboard)/organisateur/billetterie/page.tsx`
- `src/app/(dashboard)/organisateur/invites/page.tsx`
- `src/app/(dashboard)/organisateur/analytiques/page.tsx`
- `src/app/(dashboard)/prestataire/page.tsx`
- `src/app/(dashboard)/prestataire/demandes/page.tsx`
- `src/app/(dashboard)/prestataire/profil/page.tsx`
- `src/app/(dashboard)/prestataire/avis/page.tsx`
- `src/app/(dashboard)/gestionnaire/page.tsx`
- `src/app/(dashboard)/gestionnaire/reservations/page.tsx`
- `src/app/(dashboard)/gestionnaire/calendrier/page.tsx`
- `src/app/(dashboard)/gestionnaire/lieux/page.tsx`
- `src/app/(public)/onboarding/organisateur/page.tsx`
- `src/app/(public)/onboarding/prestataire/page.tsx`
- `src/app/(public)/onboarding/gestionnaire/page.tsx`
- `messages/fr.json`
- `messages/en.json`

---

## Task 1: Install Lenis + Create Animation Library

**Files:**
- Create: `src/lib/animations.ts`
- Modify: `package.json` (via npm install)

**Interfaces:**
- Produces:
  - `fadeSlideUp`, `fadeSlideDown`, `staggerContainer`, `staggerItem`, `scaleIn`, `slideInRight`, `slideInLeft`, `modalOverlay`, `cardHover`, `buttonPress`, `chipBounce` — all typed as `Variants` from framer-motion
  - `useReducedMotionVariants<T>(full: T, reduced: T): T` — returns reduced if prefers-reduced-motion

- [ ] **Step 1: Install lenis**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web
npm install lenis
```

Expected: lenis added to dependencies in package.json

- [ ] **Step 2: Create `src/lib/animations.ts`**

```typescript
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
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web && npx tsc --noEmit 2>&1 | head -30
```

Expected: Zero errors for the new file.

- [ ] **Step 4: Commit**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web
git add src/lib/animations.ts package.json package-lock.json
git commit -m "feat(motion): add Framer Motion variants library + install lenis"
```

---

## Task 2: Lenis Smooth Scroll Provider

**Files:**
- Create: `src/lib/lenis.tsx`
- Modify: `src/shared/guards/Providers.tsx`

**Interfaces:**
- Produces: `<LenisProvider>` (wraps children, sets up smooth scroll RAF), `useLenis()` → `Lenis | null`
- Consumes: `lenis` npm package

- [ ] **Step 1: Create `src/lib/lenis.tsx`**

```typescript
'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { useMotionValue, useReducedMotion } from 'framer-motion';

const LenisContext = createContext<Lenis | null>(null);

export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const prefersReduced = useReducedMotion();
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReduced) return;

    const lenis = new Lenis({
      lerp: 0.1,
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    }
    rafRef.current = requestAnimationFrame(raf);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [prefersReduced]);

  return (
    <LenisContext.Provider value={lenisRef.current}>
      {children}
    </LenisContext.Provider>
  );
}
```

- [ ] **Step 2: Add LenisProvider to Providers.tsx**

In `src/shared/guards/Providers.tsx`, import and wrap children with `<LenisProvider>`:

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { LenisProvider } from '@/lib/lenis';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <LenisProvider>{children}</LenisProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web && npx tsc --noEmit 2>&1 | head -30
```

Expected: Zero errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web
git add src/lib/lenis.tsx src/shared/guards/Providers.tsx
git commit -m "feat(motion): add Lenis smooth scroll provider synced with Framer Motion RAF"
```

---

## Task 3: Icon Registry + Utils Enhancement

**Files:**
- Create: `src/lib/icons.ts`
- Modify: `src/shared/lib/utils.ts`

**Interfaces:**
- Produces: Named icon exports (`IconDashboard`, `IconCalendar`, etc.) all typed as `LucideIcon`
- Produces: `slugify(text: string): string`, `truncate(text: string, length: number): string`, `getInitials(name: string): string`, `formatCurrency(amount: number, currency?: string): string`, extended `formatDate(date, format: 'short' | 'long' | 'relative'): string`

- [ ] **Step 1: Create `src/lib/icons.ts`**

```typescript
export {
  LayoutDashboard as IconDashboard,
  Calendar as IconCalendar,
  Ticket as IconTicket,
  Users as IconGuests,
  BarChart3 as IconAnalytics,
  Inbox as IconRequests,
  User as IconProfile,
  Star as IconReviews,
  MapPin as IconVenue,
  Plus as IconAdd,
  Edit3 as IconEdit,
  Trash2 as IconDelete,
  Upload as IconUpload,
  Download as IconDownload,
  Send as IconSend,
  Copy as IconCopy,
  ExternalLink as IconExternal,
  Check as IconCheck,
  X as IconClose,
  AlertTriangle as IconWarning,
  Info as IconInfo,
  QrCode as IconQR,
  Scan as IconScan,
  Globe as IconPublic,
  Lock as IconPrivate,
  Eye as IconView,
  EyeOff as IconHide,
  ChevronDown as IconChevronDown,
  ChevronRight as IconChevronRight,
  ChevronLeft as IconChevronLeft,
  Menu as IconMenu,
  Search as IconSearch,
  Bell as IconNotification,
  Settings as IconSettings,
  LogOut as IconLogout,
  Loader2 as IconLoader,
  RefreshCw as IconRefresh,
  Filter as IconFilter,
  SortAsc as IconSort,
  PanelLeftClose as IconSidebarCollapse,
  PanelLeftOpen as IconSidebarExpand,
} from 'lucide-react';
```

- [ ] **Step 2: Enhance `src/shared/lib/utils.ts`**

Replace full file content:

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  date: Date | string,
  format: 'short' | 'long' | 'relative' = 'long'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (format === 'relative') {
    const diff = Date.now() - d.getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `Il y a ${days} j`;
  }

  const options: Intl.DateTimeFormatOptions =
    format === 'short'
      ? { day: 'numeric', month: 'short', year: 'numeric' }
      : { day: 'numeric', month: 'long', year: 'numeric' };

  return new Intl.DateTimeFormat('fr-CA', options).format(d);
}

export function formatPrice(amount: number, currency = 'CAD'): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrency(amount: number, currency = 'CAD'): string {
  return formatPrice(amount, currency);
}

export function formatRole(role: string): string {
  const roles: Record<string, string> = {
    admin: 'Administrateur',
    organizer: 'Organisateur',
    vendor: 'Prestataire',
    guest: 'Invité',
  };
  return roles[role.toLowerCase()] ?? role;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, length: number): string {
  return text.length <= length ? text : `${text.slice(0, length)}…`;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '';
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web && npx tsc --noEmit 2>&1 | head -30
```

Expected: Zero errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web
git add src/lib/icons.ts src/shared/lib/utils.ts
git commit -m "feat(lib): add icon registry + extend utils with slugify, getInitials, formatCurrency"
```

---

## Task 4: Enhanced Button, Card, Badge with Motion

**Files:**
- Modify: `src/shared/ui/Button.tsx`
- Modify: `src/shared/ui/Card.tsx`
- Modify: `src/shared/ui/Badge.tsx`

**Interfaces:**
- `Button` gains: `loading?: boolean`, `icon?: React.ReactNode`, `iconPosition?: 'left' | 'right'`
- `Card` gains: `interactive?: boolean`, `glass?: boolean`
- `Badge` gains: `animate?: boolean` (triggers chipBounce)

- [ ] **Step 1: Rewrite `src/shared/ui/Button.tsx`**

```typescript
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
        primary: 'bg-accent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] hover:bg-accent/90',
        secondary: 'border border-accent text-accent bg-transparent hover:bg-accent hover:text-white',
        tertiary: 'text-accent hover:underline underline-offset-4 bg-transparent',
        ghost: 'text-on-surface hover:bg-surface-low',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-5',
        lg: 'h-12 px-7 text-base',
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
```

- [ ] **Step 2: Rewrite `src/shared/ui/Card.tsx`**

```typescript
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { cardHover } from '@/lib/animations';

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
        variants={cardHover}
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
```

- [ ] **Step 3: Rewrite `src/shared/ui/Badge.tsx`**

```typescript
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';
import { chipBounce } from '@/lib/animations';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        teal: 'bg-accent-light text-accent',
        amber: 'bg-amber/10 text-amber',
        error: 'bg-destructive/10 text-destructive',
        neutral: 'border border-outline-variant text-on-surface-variant',
        default: 'bg-primary/10 text-primary',
        success: 'bg-success/10 text-success',
      },
    },
    defaultVariants: { variant: 'teal' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  animate?: boolean;
}

export function Badge({ className, variant, animate = false, ...props }: BadgeProps) {
  const el = (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );

  if (!animate) return el;

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
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web && npx tsc --noEmit 2>&1 | head -30
```

Expected: Zero errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web
git add src/shared/ui/Button.tsx src/shared/ui/Card.tsx src/shared/ui/Badge.tsx
git commit -m "feat(ui): enhance Button/Card/Badge with Framer Motion hover+press+bounce animations"
```

---

## Task 5: New UI Primitives — Input (floating label) + Modal + Sheet

**Files:**
- Modify: `src/shared/ui/Input.tsx`
- Create: `src/shared/ui/Modal.tsx`
- Create: `src/shared/ui/Sheet.tsx`

**Interfaces:**
- `Input` gains floating label behaviour (animates up when focused/filled)
- `Modal`: props `open`, `onOpenChange`, `title?`, `description?`, `children`
- `Sheet`: props `open`, `onOpenChange`, `side?: 'left' | 'right'`, `title?`, `children`

- [ ] **Step 1: Rewrite `src/shared/ui/Input.tsx`**

```typescript
'use client';

import { useId, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

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
            animate={isFloated
              ? { y: -20, scale: 0.8, color: error ? '#DC2626' : focused ? '#1A7A5E' : '#4F5F79' }
              : { y: 0, scale: 1, color: '#4F5F79' }
            }
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
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
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-1 text-xs text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/shared/ui/Modal.tsx`**

```typescript
'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
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
                  'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
                  'w-full max-w-lg rounded-[14px] p-6',
                  'bg-white/85 backdrop-blur-[20px]',
                  'shadow-[0px_12px_32px_rgba(13,30,53,0.12)]',
                  'focus:outline-none',
                  className
                )}
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                exit="exit"
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
```

- [ ] **Step 3: Create `src/shared/ui/Sheet.tsx`**

```typescript
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
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web && npx tsc --noEmit 2>&1 | head -30
```

Expected: Zero errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web
git add src/shared/ui/Input.tsx src/shared/ui/Modal.tsx src/shared/ui/Sheet.tsx
git commit -m "feat(ui): add Modal+Sheet with glassmorphism, enhance Input with floating label"
```

---

## Task 6: Skeleton, Toast, Select, Tooltip, ScrollArea

**Files:**
- Create: `src/shared/ui/Skeleton.tsx`
- Create: `src/shared/ui/Toast.tsx`
- Create: `src/shared/ui/Select.tsx`
- Create: `src/shared/ui/Tooltip.tsx`
- Create: `src/shared/ui/ScrollArea.tsx`
- Modify: `src/shared/ui/index.ts`

**Interfaces:**
- `Skeleton`: props `variant: 'line' | 'circle' | 'card' | 'avatar'`, `className?`
- `useToast()`: returns `{ toast }` where `toast(opts: ToastOptions): void`
- `Select`: wraps Radix Select, props `placeholder`, `options: { value, label }[]`, `value`, `onValueChange`
- `Tooltip`: wraps Radix Tooltip, props `content`, `children`
- `ScrollArea`: wraps Radix ScrollArea

- [ ] **Step 1: Create `src/shared/ui/Skeleton.tsx`**

```typescript
import { cn } from '@/shared/lib/utils';

interface SkeletonProps {
  variant?: 'line' | 'circle' | 'card' | 'avatar';
  className?: string;
}

export function Skeleton({ variant = 'line', className }: SkeletonProps) {
  const base = 'animate-pulse bg-surface-low';

  if (variant === 'circle') return <div className={cn(base, 'rounded-full w-10 h-10', className)} />;
  if (variant === 'avatar') return <div className={cn(base, 'rounded-full w-8 h-8', className)} />;
  if (variant === 'card') return (
    <div className={cn(base, 'rounded-[14px] h-48 w-full', className)} />
  );
  return <div className={cn(base, 'rounded-md h-4 w-full', className)} />;
}

export function EventCardSkeleton() {
  return (
    <div className="rounded-[14px] bg-surface-lowest p-4 flex flex-col gap-3">
      <Skeleton variant="card" className="h-40" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
    </div>
  );
}

export function VendorCardSkeleton() {
  return (
    <div className="rounded-[14px] bg-surface-lowest p-4 flex flex-col gap-3">
      <Skeleton variant="card" className="h-32" />
      <div className="flex items-center gap-2">
        <Skeleton variant="avatar" />
        <div className="flex-1 flex flex-col gap-1.5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[14px] bg-surface-lowest p-4 flex flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-1/3" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <EventCardSkeleton />
        <EventCardSkeleton />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/shared/ui/Toast.tsx`**

Note: The project already has `ToastContext.tsx`. This creates a standalone Radix Toast component to use alongside it.

```typescript
'use client';

import * as RadixToast from '@radix-ui/react-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { IconClose, IconCheck, IconWarning, IconInfo } from '@/lib/icons';
import { cn } from '@/shared/lib/utils';

interface ToastProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
}

const VARIANT_STYLES = {
  success: 'border-l-4 border-l-accent bg-accent-light text-accent',
  error: 'border-l-4 border-l-destructive bg-destructive/5 text-destructive',
  warning: 'border-l-4 border-l-amber bg-amber/5 text-amber',
  info: 'border-l-4 border-l-primary bg-primary/5 text-primary',
};

const VARIANT_ICONS = {
  success: IconCheck,
  error: IconWarning,
  warning: IconWarning,
  info: IconInfo,
};

export function Toast({ open, onOpenChange, title, description, variant = 'info' }: ToastProps) {
  const Icon = VARIANT_ICONS[variant];

  return (
    <RadixToast.Provider swipeDirection="right">
      <AnimatePresence>
        {open && (
          <RadixToast.Root asChild open={open} onOpenChange={onOpenChange} forceMount>
            <motion.div
              className={cn(
                'flex items-start gap-3 rounded-[8px] p-4 shadow-[0px_4px_16px_rgba(13,30,53,0.10)]',
                'bg-surface-lowest',
                VARIANT_STYLES[variant]
              )}
              initial={{ opacity: 0, x: 48, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } }}
              exit={{ opacity: 0, x: 32, transition: { duration: 0.18 } }}
            >
              <Icon size={18} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <RadixToast.Title className="text-sm font-semibold">{title}</RadixToast.Title>
                {description && (
                  <RadixToast.Description className="mt-0.5 text-xs opacity-80">
                    {description}
                  </RadixToast.Description>
                )}
              </div>
              <RadixToast.Close aria-label="Fermer" className="ml-2">
                <IconClose size={14} className="opacity-50 hover:opacity-100" />
              </RadixToast.Close>
            </motion.div>
          </RadixToast.Root>
        )}
      </AnimatePresence>
      <RadixToast.Viewport className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80" />
    </RadixToast.Provider>
  );
}
```

- [ ] **Step 3: Create `src/shared/ui/Select.tsx`**

```typescript
'use client';

import * as RadixSelect from '@radix-ui/react-select';
import { motion, AnimatePresence } from 'framer-motion';
import { IconChevronDown, IconCheck } from '@/lib/icons';
import { cn } from '@/shared/lib/utils';
import { fadeSlideDown } from '@/lib/animations';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({ options, value, onValueChange, placeholder = 'Sélectionner…', disabled, className }: SelectProps) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RadixSelect.Trigger
        className={cn(
          'flex w-full items-center justify-between',
          'border-b-2 border-outline-variant/30 bg-transparent py-2 text-sm text-on-surface',
          'focus:outline-none focus:border-accent/60',
          'data-[placeholder]:text-on-surface-variant',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors duration-200',
          className
        )}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <IconChevronDown size={16} className="text-on-surface-variant" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          className={cn(
            'z-50 min-w-[180px] rounded-[8px] bg-surface-lowest',
            'shadow-[0px_4px_16px_rgba(13,30,53,0.10)]',
            'overflow-hidden'
          )}
          position="popper"
          sideOffset={4}
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((opt) => (
              <RadixSelect.Item
                key={opt.value}
                value={opt.value}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-[6px] px-3 py-2 text-sm text-on-surface',
                  'hover:bg-surface-low focus:bg-surface-low focus:outline-none',
                  'data-[highlighted]:bg-surface-low',
                  'select-none'
                )}
              >
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="ml-auto">
                  <IconCheck size={14} className="text-accent" />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
```

- [ ] **Step 4: Create `src/shared/ui/Tooltip.tsx`**

```typescript
'use client';

import * as RadixTooltip from '@radix-ui/react-tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={300}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content side={side} sideOffset={6} asChild>
            <motion.div
              className={cn(
                'rounded-[6px] bg-primary px-2.5 py-1.5 text-xs font-medium text-white',
                'shadow-[0px_4px_16px_rgba(13,30,53,0.10)]',
                'max-w-[200px] text-center',
                className
              )}
              initial={{ opacity: 0, scale: 0.92, y: side === 'top' ? 4 : -4 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.15 } }}
              exit={{ opacity: 0, scale: 0.92 }}
            >
              {content}
              <RadixTooltip.Arrow className="fill-primary" />
            </motion.div>
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
```

- [ ] **Step 5: Create `src/shared/ui/ScrollArea.tsx`**

```typescript
'use client';

import * as RadixScroll from '@radix-ui/react-scroll-area';
import { cn } from '@/shared/lib/utils';

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  viewportClassName?: string;
}

export function ScrollArea({ children, className, viewportClassName }: ScrollAreaProps) {
  return (
    <RadixScroll.Root className={cn('overflow-hidden', className)}>
      <RadixScroll.Viewport className={cn('h-full w-full', viewportClassName)}>
        {children}
      </RadixScroll.Viewport>
      <RadixScroll.Scrollbar
        className="flex touch-none select-none transition-colors duration-150 ease-out data-[orientation=vertical]:w-1 data-[orientation=horizontal]:h-1 data-[orientation=vertical]:flex-col"
        orientation="vertical"
      >
        <RadixScroll.Thumb className="relative flex-1 rounded-full bg-outline-variant hover:bg-on-surface-variant/30" />
      </RadixScroll.Scrollbar>
      <RadixScroll.Corner />
    </RadixScroll.Root>
  );
}
```

- [ ] **Step 6: Install missing Radix primitives**

Check and install any Radix primitives not yet in package.json:

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web
# Check which are missing
node -e "const p = require('./package.json'); console.log(Object.keys(p.dependencies).filter(k => k.startsWith('@radix-ui')))"
# Install missing ones
npm install @radix-ui/react-scroll-area @radix-ui/react-tooltip @radix-ui/react-switch
```

- [ ] **Step 7: Update `src/shared/ui/index.ts`**

```typescript
export * from './Avatar';
export * from './Badge';
export * from './Button';
export * from './Card';
export * from './Input';
export * from './Modal';
export * from './PasswordInput';
export * from './PasswordStrengthBar';
export * from './ScrollArea';
export * from './Select';
export * from './Sheet';
export * from './Skeleton';
export * from './Toast';
export * from './Tooltip';
```

- [ ] **Step 8: Verify TypeScript compiles**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web && npx tsc --noEmit 2>&1 | head -40
```

Expected: Zero errors.

- [ ] **Step 9: Commit**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web
git add src/shared/ui/Skeleton.tsx src/shared/ui/Toast.tsx src/shared/ui/Select.tsx src/shared/ui/Tooltip.tsx src/shared/ui/ScrollArea.tsx src/shared/ui/index.ts package.json package-lock.json
git commit -m "feat(ui): add Skeleton, Toast, Select, Tooltip, ScrollArea primitives"
```

---

## Task 7: globals.css — Reduced Motion + Focus + Utility Classes

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Adds: `@media (prefers-reduced-motion: reduce)` block disabling transitions/animations
- Adds: `.btn-primary`, `.card-elintys`, `.chip` utility classes in `@layer components`
- Adds: global `focus-visible` ring token

- [ ] **Step 1: Append to `src/app/globals.css`** (add after the last `}` of the `@layer components` block)

Find the closing `}` of the existing `@layer components` block and add before it:

```css
  /* ─── Motion utilities ────────────────────────────────────── */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 20px;
    background: var(--color-teal);
    color: white;
    border-radius: 8px;
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 600;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.10);
    transition: background 200ms, transform 150ms;
    cursor: pointer;
    border: none;
    text-decoration: none;
    white-space: nowrap;
  }
  .btn-primary:hover { background: #155F4A; }
  .btn-primary:active { transform: scale(0.97); }

  .card-elintys {
    background: white;
    border-radius: 14px;
    padding: 24px;
    box-shadow: var(--shadow-ambient);
  }

  .chip {
    display: inline-flex;
    align-items: center;
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
    font-family: var(--font-sans);
    background: var(--color-teal-pale);
    color: var(--color-teal);
  }
```

Then append **after** the entire `@layer components { }` block:

```css
/* ─── Focus visible — global ────────────────────────────────── */
:focus-visible {
  outline: 2px solid var(--color-teal);
  outline-offset: 2px;
}

/* ─── Reduced motion ────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web && npm run build 2>&1 | tail -20
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web
git add src/app/globals.css
git commit -m "feat(design-system): add btn-primary, card-elintys, chip utilities + focus-visible + reduced-motion"
```

---

## Task 8: Enhanced Sidebar with Collapse + Stagger Animations

**Files:**
- Modify: `src/shared/layout/Sidebar.tsx`

**Interfaces:**
- Adds: collapse toggle (240px expanded ↔ 64px collapsed, spring animation)
- Adds: `layoutId="nav-active-indicator"` moving active pill
- Adds: stagger entrance for nav items on mount
- Adds: icon-only mode when collapsed (tooltips on hover)
- Consumes: `staggerContainer`, `staggerItem` from `@/lib/animations`, `IconSidebarCollapse`, `IconSidebarExpand` from `@/lib/icons`

- [ ] **Step 1: Rewrite `src/shared/layout/Sidebar.tsx`**

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Calendar, CalendarCheck, CalendarDays, Handshake,
  Heart, Inbox, LayoutGrid, MapPin, MessageSquare, Search,
  Settings, Star, Ticket, Users,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '@/shared/lib/utils';
import { Avatar } from '@/shared/ui/Avatar';
import { Tooltip } from '@/shared/ui/Tooltip';
import { useAuth } from '@/shared/hooks/useAuth';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { IconSidebarCollapse, IconSidebarExpand } from '@/lib/icons';
import { buildNavSections, type SidebarIconName } from '@/shared/layout/sidebar-nav';
import { staggerContainer, staggerItem } from '@/lib/animations';

const ICON_MAP: Record<SidebarIconName, ComponentType<{ className?: string; size?: number }>> = {
  grid: LayoutGrid, calendar: Calendar, users: Users, building: Building2,
  'message-square': MessageSquare, star: Star, inbox: Inbox, handshake: Handshake,
  'map-pin': MapPin, 'calendar-check': CalendarCheck, 'calendar-days': CalendarDays,
  ticket: Ticket, heart: Heart, search: Search, settings: Settings, 'star-half': Star,
};

function SidebarIcon({ name, className }: { name: SidebarIconName; className?: string }) {
  const Icon = ICON_MAP[name];
  return <Icon className={className} size={18} />;
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const sections = buildNavSections(user.roles ?? []);

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative flex h-full flex-shrink-0 flex-col bg-surface-low py-6 overflow-hidden"
    >
      {/* Logo */}
      <div className="px-4 mb-8 flex items-center justify-between overflow-hidden">
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="font-serif text-2xl font-normal text-primary whitespace-nowrap"
            >
              Elintys
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Étendre la barre latérale' : 'Réduire la barre latérale'}
          className="ml-auto flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface transition-colors"
        >
          {collapsed ? <IconSidebarExpand size={16} /> : <IconSidebarCollapse size={16} />}
        </button>
      </div>

      {/* Nav */}
      <motion.nav
        className="flex flex-1 flex-col gap-1 px-2 overflow-y-auto overflow-x-hidden"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {sections.map((section, sectionIndex) => (
          <motion.div key={`${section.label}-${sectionIndex}`} className="mb-2" variants={staggerItem}>
            {section.label && !collapsed && (
              <p className={cn(
                'px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant',
                sectionIndex > 0 && 'mt-4 pt-4'
              )}>
                {section.label}
              </p>
            )}

            {section.items.map((item) => {
              const active = item.href === '/tableau-de-bord'
                ? pathname === item.href
                : pathname.startsWith(item.href);

              const linkContent = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm font-medium transition-colors',
                    collapsed ? 'justify-center' : '',
                    active
                      ? 'text-accent'
                      : 'text-on-surface-variant hover:bg-surface hover:text-on-surface'
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-active-indicator"
                      className="absolute inset-0 rounded-[8px] bg-accent-light"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex-shrink-0">
                    <SidebarIcon name={item.icon} className="h-[18px] w-[18px]" />
                  </span>

                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="relative z-10 flex-1 truncate overflow-hidden whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {!collapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className={cn(
                      'relative z-10 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                      active ? 'bg-accent text-white' : 'bg-accent-light text-accent'
                    )}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              );

              return collapsed ? (
                <Tooltip key={item.href} content={item.label} side="right">
                  {linkContent}
                </Tooltip>
              ) : linkContent;
            })}
          </motion.div>
        ))}
      </motion.nav>

      {/* User footer */}
      <div className="px-2 pt-4">
        {!collapsed && (
          <div className="flex items-center justify-end px-3 py-1">
            <NotificationBell />
          </div>
        )}
        <div className={cn('flex items-center gap-3 px-3 py-2', collapsed && 'justify-center')}>
          <Avatar
            src={user.avatarUrl}
            fallback={`${user.firstName[0]}${user.lastName[0]}`}
            alt={`${user.firstName} ${user.lastName}`}
            size="sm"
          />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="min-w-0 overflow-hidden"
              >
                <p className="truncate text-sm font-medium text-on-surface whitespace-nowrap">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-xs text-on-surface-variant whitespace-nowrap">{user.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
```

- [ ] **Step 2: Update dashboard layout to remove `session` prop**

In `src/app/(dashboard)/layout.tsx`:

```typescript
import { requireAuth } from '@/server/auth/guards';
import { Sidebar } from '@/shared/layout/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web && npx tsc --noEmit 2>&1 | head -30
```

Expected: Zero errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web
git add src/shared/layout/Sidebar.tsx src/app/(dashboard)/layout.tsx
git commit -m "feat(layout): add collapsible Sidebar with spring animation, stagger entrance, layoutId active pill"
```

---

## Task 9: Topbar + MobileNav + Dashboard Layout Update

**Files:**
- Create: `src/shared/layout/Topbar.tsx`
- Create: `src/shared/layout/MobileNav.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`
- Modify: `src/shared/layout/index.ts`

**Interfaces:**
- `Topbar`: shows breadcrumb from pathname, notification bell, avatar dropdown
- `MobileNav`: bottom bar visible only on < md, shows max 5 items from sidebar nav
- Dashboard layout: becomes `flex flex-col` on mobile (MobileNav), `flex flex-row` on desktop (Sidebar+Topbar)

- [ ] **Step 1: Create `src/shared/layout/Topbar.tsx`**

```typescript
'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/shared/hooks/useAuth';
import { Avatar } from '@/shared/ui/Avatar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { IconMenu } from '@/lib/icons';
import { cn } from '@/shared/lib/utils';

const BREADCRUMBS: Record<string, string> = {
  '/tableau-de-bord': 'Tableau de bord',
  '/invites': 'Invités',
  '/billetterie': 'Billetterie',
  '/parametres': 'Paramètres',
  '/messages': 'Messages',
  '/favoris': 'Favoris',
};

function getBreadcrumb(pathname: string): string {
  const match = Object.keys(BREADCRUMBS)
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname.startsWith(key));
  return match ? BREADCRUMBS[match] : '';
}

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const breadcrumb = getBreadcrumb(pathname);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-14 items-center gap-4 px-4',
        'bg-surface-lowest/80 backdrop-blur-sm',
        'shadow-[0_1px_0_rgba(13,30,53,0.06)]'
      )}
    >
      <button
        onClick={onMenuClick}
        aria-label="Ouvrir le menu"
        className="flex h-8 w-8 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-low md:hidden"
      >
        <IconMenu size={18} />
      </button>

      <div className="flex-1">
        {breadcrumb && (
          <motion.p
            key={breadcrumb}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-semibold text-on-surface"
          >
            {breadcrumb}
          </motion.p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        {user && (
          <Avatar
            src={user.avatarUrl}
            fallback={`${user.firstName[0]}${user.lastName[0]}`}
            alt={`${user.firstName} ${user.lastName}`}
            size="sm"
          />
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create `src/shared/layout/MobileNav.tsx`**

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutGrid, Calendar, Inbox, Settings, Search,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const MOBILE_ITEMS = [
  { href: '/tableau-de-bord', label: 'Accueil', Icon: LayoutGrid },
  { href: '/evenements', label: 'Événements', Icon: Calendar },
  { href: '/messages', label: 'Boîte de réception', Icon: Inbox },
  { href: '/prestataires', label: 'Explorer', Icon: Search },
  { href: '/parametres', label: 'Paramètres', Icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 border-t border-outline-variant/20 bg-surface-lowest/90 backdrop-blur-sm md:hidden">
      {MOBILE_ITEMS.map(({ href, label, Icon }) => {
        const active = href === '/tableau-de-bord'
          ? pathname === href
          : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-1 text-on-surface-variant"
          >
            <motion.div
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className={cn(
                'flex flex-col items-center gap-0.5',
                active && 'text-accent'
              )}
            >
              <div className="relative">
                <Icon size={20} />
                {active && (
                  <motion.div
                    layoutId="mobile-nav-dot"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-accent"
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  />
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3: Update `src/app/(dashboard)/layout.tsx`**

```typescript
import { requireAuth } from '@/server/auth/guards';
import { Sidebar } from '@/shared/layout/Sidebar';
import { Topbar } from '@/shared/layout/Topbar';
import { MobileNav } from '@/shared/layout/MobileNav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update `src/shared/layout/index.ts`**

```typescript
export * from './MobileNav';
export * from './Navbar';
export * from './PageHeader';
export * from './Sidebar';
export * from './Topbar';
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web && npx tsc --noEmit 2>&1 | head -30
```

Expected: Zero errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web
git add src/shared/layout/Topbar.tsx src/shared/layout/MobileNav.tsx src/app/(dashboard)/layout.tsx src/shared/layout/index.ts
git commit -m "feat(layout): add Topbar with sticky blur + MobileNav bottom bar, update DashboardLayout"
```

---

## Task 10: Animated Landing Page Hero

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/shared/constants/routes.ts` (verify PUBLIC home route exists)

**Goal:** Replace the current `redirect('/connexion')` with a full cinematic hero landing page featuring stagger entrance, animated journey pills, and scroll-reveal stats.

**Interfaces:**
- Consumes: `fadeSlideUp`, `staggerContainer`, `staggerItem`, `chipBounce` from `@/lib/animations`
- Must be a `'use client'` component (uses Framer Motion's `useInView`, `useAnimate`)
- Must NOT fetch any data — static content only
- Must respect `prefers-reduced-motion` via `useReducedMotionVariants`

- [ ] **Step 1: Rewrite `src/app/page.tsx`**

```typescript
'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import {
  fadeSlideUp,
  staggerContainer,
  staggerItem,
  chipBounce,
  useReducedMotionVariants,
} from '@/lib/animations';

const JOURNEY_STEPS = [
  { label: 'Créer', desc: 'Configurez votre événement' },
  { label: 'Équiper', desc: 'Trouvez vos prestataires' },
  { label: 'Vendre', desc: 'Gérez la billetterie' },
  { label: 'Gérer', desc: 'Suivez les invités' },
  { label: 'Diffuser', desc: 'Promouvez votre événement' },
  { label: 'Valider', desc: 'Accueillez vos invités' },
];

const STATS = [
  { value: '1', label: 'Plateforme unique' },
  { value: '6', label: 'Étapes intégrées' },
  { value: '0', label: 'Fragmentation' },
];

function StatCard({ value, label, delay }: { value: string; label: string; delay: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      variants={fadeSlideUp}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      custom={delay}
      className="flex flex-col items-center gap-2"
    >
      <span className="font-serif text-6xl text-white leading-none">{value}</span>
      <span className="text-sm font-medium text-white/60 text-center">{label}</span>
    </motion.div>
  );
}

export default function LandingPage() {
  const full = { container: staggerContainer, item: staggerItem };
  const reduced = { container: {}, item: {} };
  const { container, item } = useReducedMotionVariants(full, reduced);

  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true });

  const journeyRef = useRef(null);
  const journeyInView = useInView(journeyRef, { once: true, margin: '-60px' });

  return (
    <div className="min-h-screen bg-primary overflow-x-hidden">
      {/* ── Header ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 md:px-12">
        <span className="font-serif text-2xl text-accent-light">Elintys</span>
        <div className="flex items-center gap-4">
          <Link
            href="/connexion"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            Se connecter
          </Link>
          <Link
            href="/inscription"
            className="btn-primary text-sm"
          >
            Commencer
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 md:py-40 max-w-4xl mx-auto">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center gap-6"
        >
          <motion.div variants={item}>
            <span className="chip border border-accent/30 bg-accent/10 text-accent-light">
              Plateforme événementielle québécoise
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="font-serif text-4xl md:text-6xl lg:text-7xl text-white leading-[1.05]"
          >
            L&apos;événementiel québécois,{' '}
            <span className="text-accent-light">réinventé.</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="text-base md:text-lg text-white/60 max-w-lg leading-relaxed"
          >
            Créez, équipez, vendez, gérez et accueillez votre événement.
            Tout en un seul endroit.
          </motion.p>

          <motion.div variants={item} className="flex flex-col sm:flex-row items-center gap-3">
            <Link href="/inscription" className="btn-primary px-8 py-3 text-base">
              Commencer gratuitement
            </Link>
            <Link
              href="/evenements"
              className="text-sm font-semibold text-white/70 hover:text-white transition-colors flex items-center gap-1"
            >
              Voir les événements →
            </Link>
          </motion.div>

          {/* Journey Pills */}
          <motion.div
            variants={item}
            className="flex flex-wrap justify-center gap-2 mt-4"
          >
            {JOURNEY_STEPS.map((step, i) => (
              <motion.span
                key={step.label}
                variants={chipBounce}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.6 + i * 0.1 }}
                className="chip border border-white/10 bg-white/5 text-white/70"
                title={step.desc}
              >
                {i > 0 && <span className="mr-2 text-white/30">→</span>}
                {step.label}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <section
        ref={statsRef}
        className="py-20 border-t border-white/5"
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={statsInView ? 'visible' : 'hidden'}
          className="flex flex-col md:flex-row items-center justify-center gap-16 max-w-2xl mx-auto px-6"
        >
          {STATS.map((stat, i) => (
            <StatCard key={stat.label} value={stat.value} label={stat.label} delay={i * 0.1} />
          ))}
        </motion.div>
      </section>

      {/* ── Journey Cards ── */}
      <section ref={journeyRef} className="py-24 px-6 max-w-6xl mx-auto">
        <motion.h2
          variants={fadeSlideUp}
          initial="hidden"
          animate={journeyInView ? 'visible' : 'hidden'}
          className="font-serif text-3xl md:text-4xl text-white text-center mb-16"
        >
          Un parcours pensé de bout en bout
        </motion.h2>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={journeyInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {JOURNEY_STEPS.map((step, i) => (
            <motion.div
              key={step.label}
              variants={staggerItem}
              className="rounded-[14px] bg-white/5 border border-white/8 p-6 hover:bg-white/8 transition-colors"
            >
              <span className="text-3xl font-serif text-accent-light opacity-40">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 font-serif text-xl text-white">{step.label}</h3>
              <p className="mt-1 text-sm text-white/50">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-24 px-6 text-center">
        <motion.div
          variants={fadeSlideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-xl mx-auto flex flex-col items-center gap-6"
        >
          <h2 className="font-serif text-3xl md:text-4xl text-white">
            Prêt à transformer votre prochain événement ?
          </h2>
          <p className="text-white/60">
            Rejoignez les organisateurs qui font confiance à Elintys.
          </p>
          <Link href="/inscription" className="btn-primary px-10 py-4 text-base">
            Créer mon compte gratuitement
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-6 text-center">
        <p className="text-xs text-white/30">
          © 2026 Elintys · Montréal, Québec ·{' '}
          <Link href="/confidentialite" className="hover:text-white/60 transition-colors">
            Confidentialité
          </Link>
          {' · '}
          <Link href="/conditions" className="hover:text-white/60 transition-colors">
            Conditions
          </Link>
        </p>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Update middleware to allow root page**

In `src/middleware.ts`, the current `PROTECTED_PREFIXES` does not include `/`, so the root page is already public. Verify this is correct — no changes needed unless `/` was in AUTH_ONLY_PREFIXES.

```bash
grep -n '"/"' /Users/admin/Desktop/Projects/Elintys/Elintys-web/middleware.ts
```

Expected: No match (root is public by default).

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web && npx tsc --noEmit 2>&1 | head -30
```

Expected: Zero errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web
git add src/app/page.tsx
git commit -m "feat(landing): add animated hero with stagger entrance, journey pills, scroll-reveal stats"
```

---

## Task 11: Role-Based Dashboard Routes + Static Messages

**Files:**
- Create: all role-specific placeholder pages under `src/app/(dashboard)/`
- Create: `messages/fr.json`, `messages/en.json`

**Goal:** Scaffold role-specific dashboard pages as working placeholders (DashboardSkeleton). Create static translation files for future i18n implementation.

- [ ] **Step 1: Create role-specific dashboard pages** (one command, all files)

Each file exports a default server component that renders the `DashboardSkeleton`.

Create `src/app/(dashboard)/organisateur/page.tsx`:
```typescript
import { DashboardSkeleton } from '@/shared/ui/Skeleton';

export default function OrganisateurHubPage() {
  return <DashboardSkeleton />;
}
```

Create `src/app/(dashboard)/organisateur/evenements/page.tsx`:
```typescript
import { DashboardSkeleton } from '@/shared/ui/Skeleton';
export default function OrganisateurEvenementsPage() { return <DashboardSkeleton />; }
```

Create `src/app/(dashboard)/organisateur/prestataires/page.tsx`:
```typescript
import { DashboardSkeleton } from '@/shared/ui/Skeleton';
export default function OrganisateurPrestatairesPage() { return <DashboardSkeleton />; }
```

Create `src/app/(dashboard)/organisateur/billetterie/page.tsx`:
```typescript
import { DashboardSkeleton } from '@/shared/ui/Skeleton';
export default function OrganisateurBilletteriePage() { return <DashboardSkeleton />; }
```

Create `src/app/(dashboard)/organisateur/invites/page.tsx`:
```typescript
import { DashboardSkeleton } from '@/shared/ui/Skeleton';
export default function OrganisateurInvitesPage() { return <DashboardSkeleton />; }
```

Create `src/app/(dashboard)/organisateur/analytiques/page.tsx`:
```typescript
import { DashboardSkeleton } from '@/shared/ui/Skeleton';
export default function OrganisateurAnalytiquesPage() { return <DashboardSkeleton />; }
```

Create `src/app/(dashboard)/prestataire/page.tsx`:
```typescript
import { DashboardSkeleton } from '@/shared/ui/Skeleton';
export default function PrestataireDashboardPage() { return <DashboardSkeleton />; }
```

Create `src/app/(dashboard)/prestataire/demandes/page.tsx`:
```typescript
import { DashboardSkeleton } from '@/shared/ui/Skeleton';
export default function PrestataireDemandesPage() { return <DashboardSkeleton />; }
```

Create `src/app/(dashboard)/prestataire/profil/page.tsx`:
```typescript
import { DashboardSkeleton } from '@/shared/ui/Skeleton';
export default function PrestataireProfilPage() { return <DashboardSkeleton />; }
```

Create `src/app/(dashboard)/prestataire/avis/page.tsx`:
```typescript
import { DashboardSkeleton } from '@/shared/ui/Skeleton';
export default function PrestataireAvisPage() { return <DashboardSkeleton />; }
```

Create `src/app/(dashboard)/gestionnaire/page.tsx`:
```typescript
import { DashboardSkeleton } from '@/shared/ui/Skeleton';
export default function GestionnaireDashboardPage() { return <DashboardSkeleton />; }
```

Create `src/app/(dashboard)/gestionnaire/reservations/page.tsx`:
```typescript
import { DashboardSkeleton } from '@/shared/ui/Skeleton';
export default function GestionnaireReservationsPage() { return <DashboardSkeleton />; }
```

Create `src/app/(dashboard)/gestionnaire/calendrier/page.tsx`:
```typescript
import { DashboardSkeleton } from '@/shared/ui/Skeleton';
export default function GestionnaireCalendrierPage() { return <DashboardSkeleton />; }
```

Create `src/app/(dashboard)/gestionnaire/lieux/page.tsx`:
```typescript
import { DashboardSkeleton } from '@/shared/ui/Skeleton';
export default function GestionnaireLieuxPage() { return <DashboardSkeleton />; }
```

- [ ] **Step 2: Create `messages/fr.json`**

```json
{
  "meta": {
    "title": "Elintys — L'événementiel québécois réinventé",
    "description": "Créez, équipez, vendez, gérez et accueillez votre événement. Tout en un seul endroit."
  },
  "nav": {
    "evenements": "Événements",
    "prestataires": "Prestataires",
    "lieux": "Lieux",
    "connexion": "Se connecter",
    "commencer": "Commencer"
  },
  "hero": {
    "badge": "Plateforme événementielle québécoise",
    "headline": "L'événementiel québécois, réinventé.",
    "subtitle": "Créez, équipez, vendez, gérez et accueillez votre événement. Tout en un seul endroit.",
    "cta_primary": "Commencer gratuitement",
    "cta_secondary": "Voir les événements"
  },
  "parcours": {
    "creer": "Créer",
    "equiper": "Équiper",
    "vendre": "Vendre",
    "gerer": "Gérer",
    "diffuser": "Diffuser",
    "valider": "Valider"
  },
  "dashboard": {
    "organisateur": {
      "titre": "Hub événementiel",
      "subtitle": "Gérez tous vos événements depuis un seul endroit"
    },
    "prestataire": {
      "titre": "Tableau de bord",
      "subtitle": "Suivez vos demandes et votre profil"
    },
    "gestionnaire": {
      "titre": "Tableau de bord",
      "subtitle": "Gérez vos espaces et réservations"
    }
  },
  "actions": {
    "sauvegarder": "Sauvegarder",
    "annuler": "Annuler",
    "supprimer": "Supprimer",
    "modifier": "Modifier",
    "publier": "Publier",
    "brouillon": "Enregistrer le brouillon",
    "creer": "Créer",
    "rechercher": "Rechercher",
    "filtrer": "Filtrer",
    "exporter": "Exporter"
  },
  "statuts": {
    "brouillon": "Brouillon",
    "publie": "Publié",
    "annule": "Annulé",
    "termine": "Terminé",
    "en_attente": "En attente"
  },
  "erreurs": {
    "champ_requis": "Ce champ est obligatoire",
    "email_invalide": "Adresse courriel invalide",
    "mot_de_passe_min": "8 caractères minimum",
    "serveur": "Une erreur est survenue. Veuillez réessayer.",
    "non_autorise": "Vous n'êtes pas autorisé à effectuer cette action."
  }
}
```

- [ ] **Step 3: Create `messages/en.json`**

```json
{
  "meta": {
    "title": "Elintys — Quebec Event Management Reinvented",
    "description": "Create, equip, sell, manage and welcome your event. All in one place."
  },
  "nav": {
    "evenements": "Events",
    "prestataires": "Vendors",
    "lieux": "Venues",
    "connexion": "Sign in",
    "commencer": "Get started"
  },
  "hero": {
    "badge": "Quebec event platform",
    "headline": "Quebec events, reinvented.",
    "subtitle": "Create, equip, sell, manage and welcome your event. All in one place.",
    "cta_primary": "Get started for free",
    "cta_secondary": "Browse events"
  },
  "parcours": {
    "creer": "Create",
    "equiper": "Equip",
    "vendre": "Sell",
    "gerer": "Manage",
    "diffuser": "Promote",
    "valider": "Validate"
  },
  "dashboard": {
    "organisateur": {
      "titre": "Event Hub",
      "subtitle": "Manage all your events from one place"
    },
    "prestataire": {
      "titre": "Dashboard",
      "subtitle": "Track your requests and profile"
    },
    "gestionnaire": {
      "titre": "Dashboard",
      "subtitle": "Manage your spaces and bookings"
    }
  },
  "actions": {
    "sauvegarder": "Save",
    "annuler": "Cancel",
    "supprimer": "Delete",
    "modifier": "Edit",
    "publier": "Publish",
    "brouillon": "Save as draft",
    "creer": "Create",
    "rechercher": "Search",
    "filtrer": "Filter",
    "exporter": "Export"
  },
  "statuts": {
    "brouillon": "Draft",
    "publie": "Published",
    "annule": "Cancelled",
    "termine": "Completed",
    "en_attente": "Pending"
  },
  "erreurs": {
    "champ_requis": "This field is required",
    "email_invalide": "Invalid email address",
    "mot_de_passe_min": "Minimum 8 characters",
    "serveur": "Something went wrong. Please try again.",
    "non_autorise": "You are not authorized to perform this action."
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web && npx tsc --noEmit 2>&1 | head -30
```

Expected: Zero errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web
git add src/app/(dashboard)/organisateur/ src/app/(dashboard)/prestataire/ src/app/(dashboard)/gestionnaire/ messages/
git commit -m "feat(dashboard): add role-specific route placeholders; add fr.json + en.json message files"
```

---

## Self-Review Checklist

### Spec Coverage
- [x] tailwind.config / CSS tokens → Tailwind v4 tokens already in globals.css; Task 7 adds utility classes
- [x] `lib/animations.ts` with all named variants → Task 1
- [x] Lenis smooth scroll → Task 2
- [x] Icon registry → Task 3
- [x] Utils: slugify, truncate, getInitials, formatCurrency, formatDate → Task 3
- [x] Button (3 variants + loading + icon) → Task 4
- [x] Card (interactive + glass) → Task 4
- [x] Badge/Chip (4 variants + animate) → Task 4
- [x] Input (floating label) → Task 5
- [x] Modal (glassmorphism + scaleIn) → Task 5
- [x] Sheet (slideInRight) → Task 5
- [x] Skeleton + domain composites → Task 6
- [x] Toast (4 variants) → Task 6
- [x] Select (ghost border) → Task 6
- [x] Tooltip (navy bg, 300ms delay) → Task 6
- [x] ScrollArea (4px scrollbar) → Task 6
- [x] globals.css: reduced-motion + focus-visible → Task 7
- [x] Sidebar (collapse + stagger + layoutId) → Task 8
- [x] Topbar (sticky blur, 56px) → Task 9
- [x] MobileNav (bottom nav, tap spring) → Task 9
- [x] Dashboard layout updated → Tasks 8 & 9
- [x] Landing page hero (stagger + pills + scroll reveals) → Task 10
- [x] Role-based dashboard routes → Task 11
- [x] messages/fr.json + messages/en.json → Task 11

### Skipped intentionally (CLAUDE.md constraints)
- next-intl + [locale] routing → Not in the immutable stack defined in CLAUDE.md
- tailwind.config.ts → Project uses Tailwind v4 CSS-based config
- Zustand installation → Mentioned in CLAUDE.md stack but not blocking Phase 1

### Type consistency
- `buttonPress.tap` used in Button, `cardHover` used in Card ✓
- `staggerContainer`/`staggerItem` used in Sidebar, landing page ✓
- `chipBounce` used in Badge, landing page ✓
- `scaleIn`/`modalOverlay` used in Modal ✓
- `slideInRight`/`modalOverlay` used in Sheet ✓
- `fadeSlideUp` used in Topbar breadcrumb, StatCard, landing CTA ✓
- `useReducedMotionVariants<T>` typed generically, used in landing page ✓
- `LenisProvider`/`useLenis()` exported from `@/lib/lenis` ✓
- All icon exports named `Icon*` from `@/lib/icons` ✓
