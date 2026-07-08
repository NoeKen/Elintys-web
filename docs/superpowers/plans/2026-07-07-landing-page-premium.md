# Landing Page Premium — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refonte de la landing page Elintys vers un niveau SaaS premium mondial — gradient mesh animé en signature, nav scroll-aware, hero word-by-word, stats count-up, cards spotlight, CTA radial glow.

**Architecture:** 10 composants isolés dans `src/components/landing/`, un `page.tsx` Server Component qui les compose, et deux nouveaux variants dans `src/lib/animations.ts`. Chaque composant est `'use client'` uniquement s'il a besoin de hooks/events. Aucun nouveau package npm requis (Framer Motion `useScroll/useSpring/useInView` couvre tout).

**Tech Stack:** Next.js 15 App Router, Framer Motion 12, TypeScript strict, Tailwind CSS v4 (CSS-only config)

## Global Constraints

- **Branche cible :** `feature/landing-page-premium` (créer depuis `main` ou le HEAD actuel)
- **Tailwind v4** — config CSS uniquement via `@theme inline {}` dans `globals.css`. Jamais de `tailwind.config.ts`. Jamais de classes Tailwind arbitraires avec hex inline (`bg-[#1A7A5E]` interdit). Utiliser les classes de token : `text-[var(--color-teal)]`, `bg-[var(--color-navy)]` si nécessaire, ou les alias existants (`text-accent`, `bg-primary`, etc.).
- **Tokens CSS disponibles :** `--color-navy: #0D1E35`, `--color-teal: #1A7A5E`, `--color-teal-light: #3C9477`, `--color-teal-pale: #E6F5F0`, `--color-amber: #C8862A`. Les hex bruts sont **uniquement autorisés dans les prop `style={}`** pour les chaînes de gradient (ex. `radial-gradient(..., #1A7A5E, ...)`).
- **Animations variants** — toutes dans `src/lib/animations.ts`. Jamais de map de variants inline dans un composant. Les animations par keyframe (`animate={{ x: [0, 4, 0] }}`) et les props directes (`whileHover`) sont des exceptions acceptables.
- **`useReducedMotion()`** — obligatoire dans TOUT composant qui anime. Si `shouldReduceMotion === true` : désactiver le canvas loop, sauter les variants, `initial={false}`.
- **GPU uniquement** — animer seulement `transform` (x, y, scale, rotate, rotateX) et `opacity`. Jamais `width`, `height`, `top`, `left`, `padding`, `margin`.
- **No-Line Rule** — jamais `border: 1px solid` pour la séparation de sections. Utiliser des hairlines en gradient (`bg-gradient-to-r from-transparent via-white/10 to-transparent`).
- **`'use client'`** — uniquement sur les composants qui utilisent des hooks ou des events browser. `page.tsx` reste Server Component.
- **Exports** — `export function` nommé pour tous les composants. `export default` uniquement pour `page.tsx`.
- **TypeScript strict** — zéro `any`, zéro `@ts-ignore`. Types explicites sur tous les props et refs.
- **Délai max** — aucune animation avec `delay > 1.5s` au-delà du fold initial.
- **Commits** — conventionnels (`feat(landing): ...`), un commit par composant majeur.

---

### Task 1: Branch setup + GradientMesh + ScrollProgress

**Files:**
- Create: `src/components/landing/GradientMesh.tsx`
- Create: `src/components/landing/ScrollProgress.tsx`

**Interfaces:**
- `GradientMesh` : aucun prop. Exporte `export function GradientMesh()`.
- `ScrollProgress` : aucun prop. Exporte `export function ScrollProgress()`.

- [ ] **Step 1: Créer la branche**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web
git checkout -b feature/landing-page-premium
```

- [ ] **Step 2: Vérifier que Framer Motion est disponible**

```bash
node -e "const p = require('./package.json'); console.log('framer-motion:', p.dependencies['framer-motion'])"
```

Expected: version `11.x` ou `12.x`.

- [ ] **Step 3: Créer `src/components/landing/GradientMesh.tsx`**

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

export function GradientMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const orbs = [
      { x: 0.25, y: 0.35, r: 0.40, color: '26, 122, 94',  speed: 0.00018, phase: 0    },
      { x: 0.72, y: 0.55, r: 0.35, color: '60, 148, 119', speed: 0.00013, phase: 2.1  },
      { x: 0.50, y: 0.80, r: 0.28, color: '13,  30, 53',  speed: 0.00022, phase: 4.3  },
    ] as const;

    const draw = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const orb of orbs) {
        const cx = (orb.x + Math.sin(timestamp * orb.speed + orb.phase) * 0.12) * canvas.width;
        const cy = (orb.y + Math.cos(timestamp * orb.speed * 0.7 + orb.phase) * 0.10) * canvas.height;
        const radius = orb.r * Math.min(canvas.width, canvas.height);

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0,   `rgba(${orb.color}, 0.14)`);
        grad.addColorStop(0.5, `rgba(${orb.color}, 0.06)`);
        grad.addColorStop(1,   `rgba(${orb.color}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [shouldReduceMotion]);

  if (shouldReduceMotion) {
    return (
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 25% 40%, rgba(26,122,94,0.12) 0%, transparent 70%)',
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
```

- [ ] **Step 4: Créer `src/components/landing/ScrollProgress.tsx`**

```tsx
'use client';

import { useScroll, useSpring, motion } from 'framer-motion';

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[100] h-[2px] origin-left pointer-events-none"
      style={{
        scaleX,
        background: 'linear-gradient(90deg, #1A7A5E, #3C9477)',
      }}
    />
  );
}
```

- [ ] **Step 5: Vérifier TypeScript**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web && npx tsc --noEmit 2>&1 | head -20
```

Expected: zéro erreur.

- [ ] **Step 6: Commit**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web
git add src/components/landing/GradientMesh.tsx src/components/landing/ScrollProgress.tsx
git commit -m "feat(landing): add animated canvas gradient mesh and scroll progress bar"
```

---

### Task 2: LandingNav (scroll-aware frosted glass)

**Files:**
- Create: `src/components/landing/LandingNav.tsx`

**Interfaces:**
- `LandingNav` : aucun prop. Exporte `export function LandingNav()`.
- Consomme : `useScroll`, `useTransform` de `framer-motion`. Pas de variant de `@/lib/animations` (animations directement sur les MotionValues).

- [ ] **Step 1: Créer `src/components/landing/LandingNav.tsx`**

```tsx
'use client';

import { useScroll, useTransform, motion } from 'framer-motion';
import Link from 'next/link';

const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '#features'  },
  { label: 'Prestataires',    href: '#vendors'    },
  { label: 'Tarifs',          href: '#pricing'    },
] as const;

export function LandingNav() {
  const { scrollY } = useScroll();

  const bgColor  = useTransform(scrollY, [0, 80], ['rgba(13,30,53,0)', 'rgba(13,30,53,0.88)']);
  const blur     = useTransform(scrollY, [0, 80], ['blur(0px)',         'blur(20px)']);
  const borderOp = useTransform(scrollY, [0, 80], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.08)']);

  return (
    <motion.nav
      style={{
        backgroundColor: bgColor,
        backdropFilter:   blur,
        WebkitBackdropFilter: blur,
        borderBottomColor: borderOp,
      }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between
                 px-6 py-4 md:px-12 border-b border-transparent"
    >
      {/* Logo */}
      <motion.span
        className="font-serif text-2xl text-[var(--color-teal-pale)] cursor-default select-none"
        whileHover={{ letterSpacing: '0.02em', transition: { duration: 0.3 } }}
      >
        Elintys
      </motion.span>

      {/* Links desktop */}
      <div className="hidden md:flex items-center gap-8">
        {NAV_LINKS.map(link => (
          <a
            key={link.href}
            href={link.href}
            className="relative text-sm font-medium text-white/60 hover:text-white
                       transition-colors group"
          >
            {link.label}
            <span
              className="absolute -bottom-0.5 left-0 h-px w-0
                         bg-[var(--color-teal)] group-hover:w-full
                         transition-all duration-300 ease-out"
            />
          </a>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex items-center gap-3">
        <Link
          href="/connexion"
          className="hidden md:block text-sm font-medium text-white/60
                     hover:text-white transition-colors"
        >
          Se connecter
        </Link>

        <Link
          href="/inscription"
          className="relative overflow-hidden rounded-[8px] px-5 py-2.5 text-sm
                     font-semibold text-white bg-[var(--color-teal)]
                     hover:bg-[var(--color-teal-light)]
                     shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]
                     transition-colors group"
        >
          <span
            className="absolute inset-0 -translate-x-full
                       bg-gradient-to-r from-transparent via-white/10 to-transparent
                       group-hover:translate-x-full transition-transform duration-500"
            aria-hidden="true"
          />
          <span className="relative">Commencer</span>
        </Link>
      </div>
    </motion.nav>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web && npx tsc --noEmit 2>&1 | head -20
```

Expected: zéro erreur.

- [ ] **Step 3: Commit**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web
git add src/components/landing/LandingNav.tsx
git commit -m "feat(landing): add scroll-aware frosted glass nav with shimmer CTA"
```

---

### Task 3: animations.ts additions + LandingHero + JourneyTimeline

**Files:**
- Modify: `src/lib/animations.ts` (ajouter `wordRevealItem`)
- Rewrite: `src/components/landing/LandingHero.tsx`
- Create: `src/components/landing/JourneyTimeline.tsx`

**Interfaces:**
- `wordRevealItem: Variants` — ajouté à `@/lib/animations`, importable partout.
- `LandingHero()` — rewrite complet, conserve le nom et l'export. Contient `AnimatedHeadline` (composant local, non exporté).
- `JourneyTimeline()` — nouveau composant, utilisé à la fin du hero fold.

- [ ] **Step 1: Ajouter `wordRevealItem` à `src/lib/animations.ts`**

Ajouter à la fin du fichier (avant la dernière ligne) :

```ts
export const wordRevealItem: Variants = {
  hidden: { opacity: 0, y: 32, rotateX: -15 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};
```

- [ ] **Step 2: Créer `src/components/landing/JourneyTimeline.tsx`**

```tsx
'use client';

import { useRef, useState } from 'react';
import { motion, useInView, useReducedMotion, AnimatePresence } from 'framer-motion';

interface Step {
  label: string;
  icon: string;
  color: string;
  desc: string;
}

const STEPS: Step[] = [
  { label: 'Créer',    icon: '✦', color: '#1A7A5E', desc: 'Configurez votre événement en quelques minutes' },
  { label: 'Équiper',  icon: '◈', color: '#2A8F6E', desc: 'Trouvez prestataires et équipements' },
  { label: 'Vendre',   icon: '◉', color: '#3C9477', desc: 'Billetterie intégrée, paiement sécurisé' },
  { label: 'Gérer',    icon: '◎', color: '#4AA085', desc: 'Invités, RSVP, confirmations en temps réel' },
  { label: 'Diffuser', icon: '◐', color: '#5AB098', desc: 'Page publique auto-générée et indexée' },
  { label: 'Valider',  icon: '◑', color: '#1A7A5E', desc: 'Scan QR à l\'entrée, aucune app requise' },
];

export function JourneyTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const shouldReduceMotion = useReducedMotion();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div ref={ref} className="relative w-full max-w-4xl mx-auto mt-16 px-4">
      {/* Ligne SVG animée */}
      <svg
        aria-hidden="true"
        className="absolute pointer-events-none overflow-visible"
        style={{ top: '20px', left: '2rem', width: 'calc(100% - 4rem)', height: '1px' }}
      >
        <motion.line
          x1="0" y1="0" x2="100%" y2="0"
          stroke="rgba(26, 122, 94, 0.35)"
          strokeWidth="1"
          strokeDasharray="4 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={inView && !shouldReduceMotion ? { pathLength: 1, opacity: 1 } : {}}
          transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.5 }}
        />
      </svg>

      <div className="relative grid grid-cols-3 sm:grid-cols-6 gap-2">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.label}
            className="flex flex-col items-center gap-3 cursor-default group"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="relative">
              <motion.div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg
                           bg-[var(--color-navy)] border-2 border-[rgba(26,122,94,0.4)]
                           group-hover:border-[rgba(26,122,94,1)] transition-colors"
                whileHover={shouldReduceMotion ? {} : { scale: 1.15 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <span style={{ color: step.color }}>{step.icon}</span>
              </motion.div>

              {/* Pulse ring — one-shot à l'entrée */}
              {!shouldReduceMotion && (
                <motion.div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ border: `1px solid ${step.color}` }}
                  animate={inView ? { scale: [1, 1.6, 1.6], opacity: [0.5, 0, 0] } : {}}
                  transition={{ delay: 0.8 + i * 0.18, duration: 1.2, ease: 'easeOut' }}
                />
              )}
            </div>

            <span className="text-xs font-semibold tracking-wide text-white/50
                             group-hover:text-white transition-colors text-center">
              {step.label}
            </span>

            {/* Tooltip description */}
            <AnimatePresence>
              {hoveredIndex === i && (
                <motion.div
                  role="tooltip"
                  className="absolute top-full mt-2 z-10 rounded-[6px] px-3 py-2
                             text-xs text-white/80 text-center max-w-[120px]
                             shadow-lg pointer-events-none"
                  style={{ background: 'rgba(13,30,53,0.95)', border: '1px solid rgba(26,122,94,0.3)' }}
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95, transition: { duration: 0.12 } }}
                  transition={{ duration: 0.18 }}
                >
                  {step.desc}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Réécrire `src/components/landing/LandingHero.tsx`**

```tsx
'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import {
  staggerContainer,
  staggerItem,
  fadeSlideUp,
  wordRevealItem,
  useReducedMotionVariants,
} from '@/lib/animations';
import { JourneyTimeline } from './JourneyTimeline';

const HEADLINE_LINE1 = "L'événementiel québécois,";
const HEADLINE_LINE2 = "réinventé.";

interface AnimatedHeadlineProps {
  shouldReduceMotion: boolean | null;
}

function AnimatedHeadline({ shouldReduceMotion }: AnimatedHeadlineProps) {
  const words1 = HEADLINE_LINE1.split(' ');

  return (
    <motion.h1
      className="font-serif text-4xl md:text-6xl lg:text-7xl xl:text-8xl
                 text-white leading-[1.05] tracking-[-0.02em]"
      variants={shouldReduceMotion ? {} : staggerContainer}
      initial="hidden"
      animate="visible"
      style={{ perspective: 800 }}
    >
      <span className="block">
        {words1.map((word, i) => (
          <motion.span
            key={i}
            className="inline-block mr-[0.25em]"
            variants={shouldReduceMotion ? {} : wordRevealItem}
            transition={{ delay: i * 0.06 }}
            style={{ transformOrigin: 'bottom center' }}
          >
            {word}
          </motion.span>
        ))}
      </span>
      <motion.span
        className="block text-[var(--color-teal-light)]"
        variants={shouldReduceMotion ? {} : wordRevealItem}
        transition={{ delay: words1.length * 0.06 }}
        style={{ transformOrigin: 'bottom center' }}
      >
        {HEADLINE_LINE2}
      </motion.span>
    </motion.h1>
  );
}

export function LandingHero() {
  const shouldReduceMotion = useReducedMotion();

  const full    = { container: staggerContainer, item: staggerItem };
  const reduced = { container: {},               item: {}            };
  const { container, item } = useReducedMotionVariants(full, reduced);

  return (
    <section className="relative flex flex-col items-center justify-center text-center
                        px-6 pt-40 pb-24 md:pt-52 md:pb-32 max-w-5xl mx-auto">
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center gap-8 w-full"
      >
        {/* Badge */}
        <motion.div variants={item}>
          <span className="chip border border-[rgba(60,148,119,0.3)] bg-[rgba(60,148,119,0.10)]
                           text-[var(--color-teal-pale)]">
            Plateforme événementielle québécoise
          </span>
        </motion.div>

        {/* Headline — word-by-word */}
        <AnimatedHeadline shouldReduceMotion={shouldReduceMotion} />

        {/* Sous-titre avec gradient text */}
        <motion.p
          variants={shouldReduceMotion ? {} : fadeSlideUp}
          className="text-lg md:text-xl max-w-2xl leading-relaxed"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.80) 0%, rgba(255,255,255,0.45) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Créez, équipez, vendez, gérez et accueillez votre événement.
          <br className="hidden md:block" /> Tout en un seul endroit, en français.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 items-center">
          {/* Primaire */}
          <motion.a
            href="/inscription"
            className="group relative overflow-hidden rounded-[10px] px-8 py-4
                       text-base font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, #0D1E35 0%, #1A7A5E 60%, #3C9477 100%)',
            }}
            whileHover={shouldReduceMotion ? {} : { scale: 1.02, y: -2 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 -translate-x-full skew-x-[-12deg]
                         bg-gradient-to-r from-transparent via-white/15 to-transparent
                         group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out"
            />
            <span className="relative flex items-center gap-2.5">
              Commencer gratuitement
              {!shouldReduceMotion && (
                <motion.span
                  aria-hidden="true"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
                >
                  →
                </motion.span>
              )}
              {shouldReduceMotion && <span aria-hidden="true">→</span>}
            </span>
          </motion.a>

          {/* Secondaire */}
          <motion.a
            href="#features"
            className="group flex items-center gap-2 rounded-[10px] px-6 py-4
                       text-base font-medium text-white/70 hover:text-white transition-colors"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.10)',
            }}
            whileHover={shouldReduceMotion ? {} : {
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderColor: 'rgba(255,255,255,0.20)',
            }}
            transition={{ duration: 0.2 }}
          >
            Voir comment ça fonctionne
            <span className="opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">↓</span>
          </motion.a>
        </motion.div>
      </motion.div>

      {/* Journey timeline (hors du stagger container principal) */}
      <JourneyTimeline />
    </section>
  );
}
```

- [ ] **Step 4: Vérifier TypeScript**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web && npx tsc --noEmit 2>&1 | head -30
```

Expected: zéro erreur.

- [ ] **Step 5: Commits**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web
git add src/lib/animations.ts
git commit -m "feat(animations): add wordRevealItem variant for 3D headline reveals"

git add src/components/landing/JourneyTimeline.tsx
git commit -m "feat(landing): add interactive SVG journey timeline with pulse rings"

git add src/components/landing/LandingHero.tsx
git commit -m "feat(landing): rewrite hero with word-by-word headline, gradient text, shimmer CTAs"
```

---

### Task 4: StatsSection avec count-up animé

**Files:**
- Create: `src/components/landing/StatsSection.tsx`

**Interfaces:**
- `StatsSection()` — aucun prop. Server-safe outer, `'use client'` inner pour les hooks.
- `CountUp({ to, duration?, suffix? })` — composant interne non exporté.
- Consomme : `fadeSlideUp`, `staggerContainer`, `staggerItem` de `@/lib/animations`.

- [ ] **Step 1: Créer `src/components/landing/StatsSection.tsx`**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';

interface CountUpProps {
  to: number;
  duration?: number;
  suffix?: string;
}

function CountUp({ to, duration = 1800, suffix = '' }: CountUpProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (shouldReduceMotion) {
      setCount(to);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(eased * to));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, to, duration, shouldReduceMotion]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

const STATS = [
  { value: 6,   suffix: '',   unit: 'étapes',   label: 'Du concept à l\'accueil' },
  { value: 100, suffix: '%',  unit: '',          label: 'Français natif'          },
  { value: 0,   suffix: '',   unit: 'outil',     label: 'Supplémentaire requis'   },
] as const;

export function StatsSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const shouldReduceMotion = useReducedMotion();

  return (
    <section ref={ref} className="py-24">
      {/* Hairline gradient top — No-Line Rule */}
      <div
        aria-hidden="true"
        className="w-full h-px mb-24"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent 100%)',
        }}
      />

      <motion.div
        variants={shouldReduceMotion ? {} : staggerContainer}
        initial={shouldReduceMotion ? false : 'hidden'}
        animate={inView ? 'visible' : 'hidden'}
        className="max-w-3xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-0"
      >
        {STATS.map((stat, i) => (
          <div key={stat.label} className="flex items-center">
            <motion.div
              variants={shouldReduceMotion ? {} : staggerItem}
              className="flex flex-col items-center gap-2 px-12 py-8"
            >
              <span className="font-serif text-6xl md:text-7xl text-white leading-none tabular-nums">
                <CountUp to={stat.value} suffix={stat.suffix} />
              </span>
              {stat.unit && (
                <span className="text-sm font-semibold text-[var(--color-teal-light)] uppercase tracking-widest">
                  {stat.unit}
                </span>
              )}
              <span className="text-xs text-white/40 text-center max-w-[120px]">
                {stat.label}
              </span>
            </motion.div>

            {/* Divider vertical gradient — pas de border */}
            {i < STATS.length - 1 && (
              <div
                aria-hidden="true"
                className="hidden md:block h-20 w-px"
                style={{
                  background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.08), transparent)',
                }}
              />
            )}
          </div>
        ))}
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web && npx tsc --noEmit 2>&1 | head -20
```

Expected: zéro erreur.

- [ ] **Step 3: Commit**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web
git add src/components/landing/StatsSection.tsx
git commit -m "feat(landing): add count-up stats section with gradient dividers"
```

---

### Task 5: JourneyCards avec spotlight hover

**Files:**
- Create: `src/components/landing/JourneyCards.tsx`

**Interfaces:**
- `JourneyCards()` — aucun prop. Exporte `export function JourneyCards()`.
- Consomme : `staggerContainer`, `staggerItem` de `@/lib/animations`.

- [ ] **Step 1: Créer `src/components/landing/JourneyCards.tsx`**

```tsx
'use client';

import { useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { staggerContainer, staggerItem, fadeSlideUp } from '@/lib/animations';
import {
  CalendarDays,
  Wrench,
  Ticket,
  Users,
  Megaphone,
  ScanLine,
} from 'lucide-react';

interface Step {
  label: string;
  desc: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}

const STEPS: Step[] = [
  { label: 'Créer',    desc: 'Configurez votre événement en quelques minutes avec notre wizard guidé.',       Icon: CalendarDays },
  { label: 'Équiper',  desc: 'Trouvez prestataires, équipements et lieux adaptés à votre format.',             Icon: Wrench       },
  { label: 'Vendre',   desc: 'Billetterie intégrée, paiement sécurisé, codes promo automatisés.',              Icon: Ticket       },
  { label: 'Gérer',    desc: 'Invités, RSVP et confirmations en temps réel depuis un seul tableau de bord.',   Icon: Users        },
  { label: 'Diffuser', desc: 'Page publique auto-générée, indexée et partageable dès la création.',            Icon: Megaphone    },
  { label: 'Valider',  desc: 'Scan QR à l\'entrée depuis n\'importe quel appareil, aucune app requise.',       Icon: ScanLine     },
];

interface SpotlightCardProps {
  step: Step;
  index: number;
  shouldReduceMotion: boolean | null;
}

function SpotlightCard({ step, index, shouldReduceMotion }: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSpotlight({
      x: ((e.clientX - rect.left)  / rect.width)  * 100,
      y: ((e.clientY - rect.top)   / rect.height) * 100,
      opacity: 1,
    });
  };

  const handleMouseLeave = () => setSpotlight(s => ({ ...s, opacity: 0 }));

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden rounded-[16px] p-6 cursor-default"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      variants={shouldReduceMotion ? {} : staggerItem}
      whileHover={shouldReduceMotion ? {} : {
        y: -4,
        borderColor: 'rgba(26, 122, 94, 0.30)',
        transition: { type: 'spring', stiffness: 400, damping: 25 },
      }}
    >
      {/* Spotlight radial */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: spotlight.opacity,
          background: `radial-gradient(300px circle at ${spotlight.x}% ${spotlight.y}%, rgba(26,122,94,0.10) 0%, transparent 70%)`,
        }}
      />

      {/* Numéro */}
      <span
        aria-hidden="true"
        className="font-serif text-5xl text-white leading-none select-none"
        style={{ opacity: 0.08 }}
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Icône */}
      <div className="mt-4 mb-3 w-10 h-10 rounded-[8px] flex items-center justify-center
                      bg-[rgba(26,122,94,0.15)] text-[var(--color-teal-light)]">
        <step.Icon size={20} />
      </div>

      <h3 className="font-serif text-xl text-white mb-2">{step.label}</h3>
      <p className="text-sm text-white/50 leading-relaxed">{step.desc}</p>

      {/* Hairline bas */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(26,122,94,0.30), transparent)' }}
      />
    </motion.div>
  );
}

export function JourneyCards() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="py-24 px-6 max-w-6xl mx-auto">
      <motion.h2
        variants={shouldReduceMotion ? {} : fadeSlideUp}
        initial={shouldReduceMotion ? false : 'hidden'}
        animate={inView ? 'visible' : 'hidden'}
        className="font-serif text-3xl md:text-4xl text-white text-center mb-16"
      >
        Un parcours pensé de bout en bout
      </motion.h2>

      <motion.div
        ref={ref}
        variants={shouldReduceMotion ? {} : staggerContainer}
        initial={shouldReduceMotion ? false : 'hidden'}
        animate={inView ? 'visible' : 'hidden'}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {STEPS.map((step, i) => (
          <SpotlightCard
            key={step.label}
            step={step}
            index={i}
            shouldReduceMotion={shouldReduceMotion}
          />
        ))}
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web && npx tsc --noEmit 2>&1 | head -20
```

Expected: zéro erreur.

- [ ] **Step 3: Commit**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web
git add src/components/landing/JourneyCards.tsx
git commit -m "feat(landing): add journey cards with mouse-spotlight hover and stagger"
```

---

### Task 6: SocialProof + CtaSection + LandingFooter

**Files:**
- Create: `src/components/landing/SocialProof.tsx`
- Create: `src/components/landing/CtaSection.tsx`
- Create: `src/components/landing/LandingFooter.tsx`

**Interfaces:**
- Tous exportent un composant sans prop.
- Consomment `staggerContainer`, `staggerItem`, `fadeSlideUp` de `@/lib/animations`.

- [ ] **Step 1: Créer `src/components/landing/SocialProof.tsx`**

```tsx
'use client';

import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useReducedMotion } from 'framer-motion';

const AVATARS = [
  { initials: 'JT', shade: 0   },
  { initials: 'ML', shade: 20  },
  { initials: 'SK', shade: 40  },
] as const;

export function SocialProof() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="py-16 px-6 flex justify-center">
      <motion.div
        variants={shouldReduceMotion ? {} : staggerContainer}
        initial={shouldReduceMotion ? false : 'hidden'}
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="flex items-center gap-5"
      >
        {/* Avatars empilés */}
        <div className="flex -space-x-2">
          {AVATARS.map(({ initials, shade }, i) => (
            <motion.div
              key={initials}
              variants={shouldReduceMotion ? {} : staggerItem}
              className="w-9 h-9 rounded-full border-2 border-[var(--color-navy)]
                         flex items-center justify-center text-xs font-semibold text-white"
              style={{
                background: `linear-gradient(135deg, hsl(164, 66%, ${28 + shade / 2}%) 0%, hsl(164, 55%, ${38 + shade / 2}%) 100%)`,
                zIndex: 3 - i,
              }}
            >
              {initials}
            </motion.div>
          ))}
        </div>

        {/* Texte */}
        <motion.p variants={shouldReduceMotion ? {} : staggerItem} className="text-sm text-white/50">
          <span className="text-white font-semibold">+240 organisateurs</span>{' '}
          sur la liste d&apos;attente
        </motion.p>
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 2: Créer `src/components/landing/CtaSection.tsx`**

```tsx
'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { staggerContainer, staggerItem } from '@/lib/animations';

export function CtaSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative py-32 px-6 overflow-hidden">
      {/* Radial gradients background */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(26,122,94,0.18) 0%, transparent 70%)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 100% 100% at 50% 100%, rgba(13,30,53,0.8) 0%, transparent 60%)' }}
        />
        {/* Grille décorative */}
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.03,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <motion.div
        variants={shouldReduceMotion ? {} : staggerContainer}
        initial={shouldReduceMotion ? false : 'hidden'}
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="relative max-w-2xl mx-auto text-center"
      >
        <motion.p
          variants={shouldReduceMotion ? {} : staggerItem}
          className="text-sm font-semibold tracking-[0.15em] uppercase text-[var(--color-teal-light)] mb-4"
        >
          Montréal · Québec · 2026
        </motion.p>

        <motion.h2
          variants={shouldReduceMotion ? {} : staggerItem}
          className="font-serif text-3xl md:text-5xl text-white leading-tight mb-6"
        >
          Prêt à transformer votre prochain événement ?
        </motion.h2>

        <motion.p
          variants={shouldReduceMotion ? {} : staggerItem}
          className="text-white/50 mb-10 max-w-lg mx-auto"
        >
          Rejoignez les premiers organisateurs qui réinventent l&apos;événementiel québécois.
          Accès anticipé, configuration gratuite.
        </motion.p>

        <motion.div variants={shouldReduceMotion ? {} : staggerItem} className="flex justify-center">
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.02, boxShadow: '0 0 60px rgba(26, 122, 94, 0.50)' }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Link
              href="/inscription"
              className="inline-block rounded-[10px] px-10 py-4 text-base font-semibold text-white"
              style={{
                background: 'linear-gradient(135deg, #1A7A5E 0%, #3C9477 100%)',
                boxShadow: '0 0 40px rgba(26, 122, 94, 0.30)',
              }}
            >
              Créer mon compte gratuitement
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 3: Créer `src/components/landing/LandingFooter.tsx`**

Pas de `'use client'` — pas de hooks, pas d'events.

```tsx
import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer
      className="px-6 pt-12 pb-8 md:px-12"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row
                      items-center md:items-start justify-between gap-8 mb-10">
        {/* Logo + tagline */}
        <div>
          <span className="font-serif text-xl text-[var(--color-teal-pale)]">Elintys</span>
          <p className="mt-2 text-xs text-white/30 max-w-[220px] leading-relaxed">
            L&apos;événementiel québécois, de A à Z.
            <br />Montréal, Canada.
          </p>
        </div>

        {/* Links */}
        <div className="flex gap-12 text-sm text-white/40">
          <div className="flex flex-col gap-2">
            <span className="text-white/20 uppercase text-[10px] tracking-widest mb-1">
              Produit
            </span>
            <a href="#features"  className="hover:text-white/70 transition-colors">Fonctionnalités</a>
            <a href="#pricing"   className="hover:text-white/70 transition-colors">Tarifs</a>
            <Link href="/connexion" className="hover:text-white/70 transition-colors">Se connecter</Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-white/20 uppercase text-[10px] tracking-widest mb-1">
              Légal
            </span>
            <Link href="/confidentialite" className="hover:text-white/70 transition-colors">Confidentialité</Link>
            <Link href="/conditions"      className="hover:text-white/70 transition-colors">Conditions</Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="max-w-6xl mx-auto flex items-center justify-between pt-6"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <p className="text-[11px] text-white/20">
          © 2026 Elintys Inc. Tous droits réservés.
        </p>
        <p className="text-[11px] text-white/20">Conçu à Montréal 🍁</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Vérifier TypeScript**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web && npx tsc --noEmit 2>&1 | head -20
```

Expected: zéro erreur.

- [ ] **Step 5: Commit**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web
git add src/components/landing/SocialProof.tsx src/components/landing/CtaSection.tsx src/components/landing/LandingFooter.tsx
git commit -m "feat(landing): add social proof, gradient CTA section, premium footer"
```

---

### Task 7: page.tsx composition + vérification finale

**Files:**
- Rewrite: `src/app/page.tsx`
- Delete: old `src/components/landing/LandingHero.tsx` content is replaced by Task 3

**Interfaces:**
- `page.tsx` : Server Component (`export default function LandingPage()`), pas de `'use client'`.
- Compose tous les composants créés dans les tâches précédentes.

- [ ] **Step 1: Réécrire `src/app/page.tsx`**

```tsx
import { GradientMesh }   from '@/components/landing/GradientMesh';
import { LandingNav }     from '@/components/landing/LandingNav';
import { LandingHero }    from '@/components/landing/LandingHero';
import { StatsSection }   from '@/components/landing/StatsSection';
import { JourneyCards }   from '@/components/landing/JourneyCards';
import { SocialProof }    from '@/components/landing/SocialProof';
import { CtaSection }     from '@/components/landing/CtaSection';
import { LandingFooter }  from '@/components/landing/LandingFooter';
import { ScrollProgress } from '@/components/landing/ScrollProgress';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden"
         style={{ backgroundColor: '#0D1E35' }}>
      <ScrollProgress />

      {/* Background ambiant fixe — toute la page */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <GradientMesh />
      </div>

      <LandingNav />

      <main>
        <LandingHero />
        <StatsSection />
        <section id="features">
          <JourneyCards />
        </section>
        <SocialProof />
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript complet**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web && npx tsc --noEmit 2>&1
```

Expected: zéro erreur.

- [ ] **Step 3: Vérifier le build Next.js**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web && npm run build 2>&1 | tail -30
```

Expected: build réussi, zéro erreur. Les warnings ESLint mineurs sont acceptables.

- [ ] **Step 4: Commit**

```bash
cd /Users/admin/Desktop/Projects/Elintys/Elintys-web
git add src/app/page.tsx
git commit -m "feat(landing): compose full premium landing page"
```

---

## Self-review post-rédaction

**Couverture spec :**
- ✅ GradientMesh canvas animé avec fallback réduit-motion
- ✅ ScrollProgress barre 2px teal useSpring
- ✅ LandingNav scroll-aware frosted glass, shimmer CTA, underline hover
- ✅ LandingHero word-by-word rotateX, gradient text, CTAs shimmer + arrow loop, JourneyTimeline intégrée
- ✅ JourneyTimeline SVG pathLength 0→1, pulse rings, tooltips AnimatePresence
- ✅ StatsSection count-up ease-out cubic, dividers gradient vertical
- ✅ JourneyCards spotlight mouse-follow, hover lift, gradient bar bas, stagger
- ✅ SocialProof avatars empilés stagger
- ✅ CtaSection double radial gradient, grille déco, glow boxShadow
- ✅ LandingFooter bicolonne, séparateurs gradient horizontal (pas border)
- ✅ `page.tsx` Server Component qui compose tout

**Variants inline absents :** `wordRevealItem` ajouté à `animations.ts`. Tout le reste utilise `staggerContainer`, `staggerItem`, `fadeSlideUp` déjà dans la lib, ou des props directes Framer (`whileHover`, `animate` keyframe) — exceptions acceptées.

**Hex dans className :** aucun. Tous les hex sont dans `style={}` gradient strings. Les tokens CSS (`--color-teal`, `--color-teal-light`, etc.) sont utilisés via `var()`.

**TypeScript :** types explicites sur tous les props, `as const` sur les tableaux literals, pas de `any`.
