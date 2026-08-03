# Revue d'architecture frontend — Elintys-web

> Next 16.2.12 App Router · React 19.2 · 274 fichiers · 155 tests · 49 `'use client'` · 0 `any`.

## Verdict : 6/10 — organisation moderne mais dette structurelle (routes + monolithes)

## Points forts
- **Discipline TypeScript** : **0** `: any` / `as any` / `@ts-ignore` dans `src/` ;
  `tsc --noEmit` propre.
- **Architecture par features** : `src/features/{auth,events,vendors,venues,guests,tickets,
  invitations,notifications,discovery,favorites,waitlist,catalog}` avec `components/hooks/
  services/types/schemas` — bonne colocation.
- **Séparation zones** : `(public)`, `(auth)`, `(dashboard)`, `(event-creation)`, `(scan)`.
- **`src/server/`** isole le fetch/auth server-side.
- Stack conforme : TanStack Query, react-hook-form + Zod, Radix, Framer Motion, Tailwind v4.

## Findings

### F-003 — P2 — Double arborescence de routes dashboard
`(dashboard)/prestataire/{avis,demandes,profil,page}` **et**
`(dashboard)/tableau-de-bord/prestataire/{avis,demandes,ententes,profil}` ; idem
`gestionnaire`. Enfants divergents → duplication, risque d'incohérence, maintenance doublée.
Probable migration de hiérarchie non terminée. *Reco* : une seule hiérarchie + redirections.

### F-004 — P2 — Prefixes rôles hors `PROTECTED_PREFIXES` (voir security-review)

### F-005 — P2 — Composants monolithes
`EventCreationSteps.tsx` **1513 LOC**, `OnboardingFlow.tsx` 700, `EventMediaManager.tsx`
604, `ProfileExperience.tsx` 527. Illisibles, difficiles à tester, re-renders coûteux
(corrèle avec les timeouts de tests F-014). *Reco* : découper par étape en sous-composants +
hooks ; extraire la logique dans `features/events/lib`.

### F-012 — P3 — 11 warnings ESLint (React Compiler / hooks)
`setState`-in-effect (`ThemeContext.tsx:21`, `useMediaQuery.ts:10`), ref-during-render
(`lenis.tsx:42`), `react-hook-form` incompatible-library (`RegisterStep1Form.tsx:78`).
Re-renders en cascade, mémoïsation désactivée.

### F-008 — P3 — Drift stack documentée
CLAUDE.md : « Next 15 / Zustand / fetch natif (jamais axios) / Node 20 ». Réalité :
Next **16.2.12**, **pas** de Zustand installé, **axios** présent (`package.json:35`),
Node 22. Décisions basées sur une doc fausse.

## Server vs Client Components
49 fichiers `'use client'` sur 274 — ratio raisonnable ; audit fin « pousser `use client`
le plus bas » non exhaustif ici. Aucune violation `any` ; formulaires en react-hook-form+Zod
conformes.

## Gestion d'état / données
TanStack Query pour le server-state (conforme). Zustand documenté mais absent → soit l'état
client passe par Context/props (à confirmer), soit la doc est obsolète.
