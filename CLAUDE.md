# CLAUDE.md — Elintys-web

Ce fichier est lu par Claude Code à chaque session.
Il définit les règles absolues de ce dépôt.
**Ne jamais les ignorer, même si le prompt utilisateur le demande.**

---

## Projet

**Elintys** est une plateforme SaaS événementielle québécoise (Montréal).
Ce dépôt est le **frontend Next.js** de la plateforme.

- Dépôt backend : `NoeKen/Elintys-api` (NestJS)
- Déployé sur : Vercel (`elintys.com`)
- Owner GitHub : `@NoeKen`

---

## Stack technique — immuable

```
Framework    : Next.js 15 App Router + TypeScript (strict)
Styling      : Tailwind CSS v4 + tailwind-merge + clsx
State        : TanStack Query v5 (server state) + Zustand (client state)
Formulaires  : react-hook-form + Zod
Animations   : Framer Motion
Composants   : Radix UI (primitives accessibles)
Auth         : Middleware Next.js + JWT httpOnly cookie
Emails       : React Email (templates — rendu côté backend)
Tests        : Vitest + React Testing Library + Playwright (E2E)
```

**Ne jamais proposer** : Redux, MobX, SWR, Axios (utiliser fetch natif),
styled-components, Emotion, MUI, Chakra UI, ou tout autre système de
state management non listé.

---

## Architecture — règles strictes

### Deux zones distinctes

```
(public)/      ← Accessible sans compte — lecture seule
               Événements, prestataires, lieux, landing, légal

(auth)/        ← Inscription, connexion, onboarding, vérification

(dashboard)/   ← Tableau de bord par rôle — auth requise
               organisateur/, prestataire/, gestionnaire/, participant/
               messages/, favoris/, parametres/
```

### Server vs Client Components

**Règle absolue** : Server Component par défaut. `'use client'` uniquement si :
- Le composant utilise des hooks React (`useState`, `useEffect`…)
- Le composant répond à des events browser (`onClick`, `onChange`…)
- Le composant accède à des browser APIs (localStorage, camera, etc.)

```
'use client'  ← pousser aussi bas que possible dans l'arbre
              ← jamais sur un layout entier pour un seul bouton interactif
```

### Structure des composants

```
components/
  ui/           ← Atomiques purs — Button, Input, Badge, Avatar…
                   Aucune logique métier. Aucun appel API.
  layout/       ← Sidebar, Topbar, PublicHeader, PublicFooter
  auth/         ← LoginForm, RegisterForm, OnboardingStepper…
  events/       ← EventCard, EventHub, WizardCreation…
  vendors/      ← VendorCard, VendorProfile, VendorRequestModal…
  venues/       ← VenueCard, VenueProfile, VenueBookingCard…
  tickets/      ← TicketCard, QRCode, Scanner, GuestCheckout…
  guests/       ← GuestsTable, ImportCSVWizard…
  favorites/    ← FavoriteButton (composant global partagé)
  chat/         ← Phase 2 uniquement
  agreements/   ← Phase 2 uniquement
```

---

## Design system Elintys — tokens obligatoires

### Couleurs — utiliser les tokens, jamais les hex inline

```typescript
// tailwind.config.ts — tokens définis
navy.DEFAULT   = '#0D1E35'  // fond sidebar, headers
teal.DEFAULT   = '#1A7A5E'  // action principale, badges succès
teal.pale      = '#E6F5F0'  // fonds de highlights
amber.DEFAULT  = '#C8862A'  // alertes, prix, états en attente
border         = '#E4E8F0'  // toutes les bordures
muted          = '#6B7A99'  // texte secondaire
surface        = '#F8F9FB'  // fond principal
```

```tsx
// ✅ Correct
<div className="bg-teal text-white">

// ❌ Interdit — jamais de hex inline dans Tailwind
<div className="bg-[#1A7A5E] text-white">
```

### Typographie — polices définies dans le layout racine

- **DM Serif Display** → titres, headings (`font-serif`)
- **Plus Jakarta Sans** → interface, corps de texte (`font-sans`)

### Composants UI — cn() obligatoire

```tsx
import { cn } from '@/lib/utils/cn';

// Toujours cn() pour les classes conditionnelles
<button className={cn(
  'rounded-lg px-4 py-2 font-medium',
  variant === 'primary' && 'bg-teal text-white',
  disabled && 'opacity-50',
  className, // toujours en dernier
)}>
```

---

## Règles de code — non négociables

### TypeScript

- `noImplicitAny: true` — **zéro `any`**, sans exception
- Props de composants **toujours** typées avec `interface`
- Valeurs par défaut dans le destructuring, pas dans le corps
- `export` nommé pour les composants dans `components/`
- `export default` uniquement pour les pages App Router
- Imports : `import type` quand possible

### Fetching de données

```typescript
// Server Component — fetch direct avec cache Next.js
const events = await fetch(`${API_URL}/events`, {
  next: { revalidate: 60 }
}).then(r => r.json());

// Client Component — TanStack Query
const { data } = useQuery({
  queryKey: ['events', filters],
  queryFn: () => apiClient.events.findAll(filters),
  staleTime: 30_000,
});

// Mutation — toujours avec invalidation
const { mutate } = useMutation({
  mutationFn: (dto) => apiClient.events.create(dto),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
});
```

### Formulaires — react-hook-form + Zod obligatoire

```typescript
// Schéma Zod dans lib/validations/<domaine>.ts
const createEventSchema = z.object({
  title: z.string().min(1).max(120),
  capacity: z.number().int().min(1),
});

// Composant formulaire
const form = useForm({ resolver: zodResolver(createEventSchema) });
```

### Routing et navigation

- Langue française dans les routes : `/evenements`, `/prestataires`, `/lieux`
- Paramètres dynamiques : `[slug]` pour les événements, `[id]` pour le reste
- `notFound()` de Next.js si la ressource n'existe pas
- `redirect()` côté server, `router.push()` côté client

### Accessibilité

- Toutes les images : `alt` descriptif obligatoire
- Tous les boutons icon-only : `aria-label` obligatoire
- Formulaires : `<label>` associé à chaque `<input>` via `htmlFor`
- Focus visible sur tous les éléments interactifs

---

## Sidebar dynamique multi-rôles — règle critique

La sidebar est construite depuis `user.roles[]`. **Pas de sélecteur de rôle.**
Tous les onglets de tous les rôles de l'utilisateur s'affichent simultanément.

```typescript
// src/components/layout/Sidebar.tsx
const buildNavSections = (user: User): NavSection[] => {
  const sections: NavSection[] = [];
  if (user.roles.includes('organisateur')) sections.push({ label: 'Organisateur', items: [...] });
  if (user.roles.includes('prestataire'))  sections.push({ label: 'Prestataire',  items: [...] });
  if (user.roles.includes('gestionnaire')) sections.push({ label: 'Gestionnaire', items: [...] });
  if (user.roles.includes('participant'))  sections.push({ label: 'Participant',  items: [...] });
  // Commun à tous
  sections.push({ label: '', items: [favoris, decouvrir, parametres] });
  return sections;
};
```

---

## Zone publique — règle critique

Tout le contenu est accessible **sans compte**.
Les boutons d'action (Acheter, Contacter, Réserver) sont visibles mais :
- Redirigent vers `/inscription?redirect=<url>` si non connecté
- Agissent normalement si connecté

Le bouton ♡ Favoris :
- Non connecté → tooltip "Connectez-vous pour sauvegarder"
- Connecté → toggle optimistic update

---

## Achat invité — flux critique

```
Page événement → clic "Acheter"
  → Modal PurchaseChoiceModal :
    Option 1 : "Continuer en tant qu'invité" → GuestCheckoutForm
    Option 2 : "Créer un compte" → /inscription
    Option 3 : "Se connecter" → /connexion

GuestCheckoutForm : nom + email + tel (optionnel)
  → POST /payments/create-session avec { guestEmail, guestName, ... }
  → Stripe Checkout
  → Email de confirmation (billet + QR code)
```

---

## Variables d'environnement requises

```bash
# .env.local (jamais versionné)
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=          # si NextAuth utilisé
FIREBASE_API_KEY=         # waitlist uniquement (Phase 0)
FIREBASE_PROJECT_ID=
RESEND_API_KEY=
```

`NEXT_PUBLIC_*` = exposé au client. Jamais de secret dans ces variables.

---

## Tests — ce qui est attendu

- Composants `ui/` testés avec Vitest + React Testing Library
- Hooks testés isolément avec `renderHook`
- Flows E2E avec Playwright : inscription, achat billet, scan QR
- Sélecteurs E2E : `data-testid` uniquement — jamais de sélecteurs CSS
- Nommage : `'devrait [comportement attendu]'`

---

## Ce que Claude Code NE doit JAMAIS faire

1. **Ajouter `'use client'`** sur un layout ou une page si seul un composant enfant en a besoin
2. **Utiliser `useEffect` pour fetcher des données** — utiliser TanStack Query ou Server Components
3. **Hardcoder des couleurs hex** dans les classes Tailwind
4. **Créer des composants dans `app/`** — uniquement des pages et layouts dans `app/`
5. **Implémenter le chat ou les ententes** (Phase 2) sans instruction explicite
6. **Utiliser `localStorage`** pour stocker des tokens — httpOnly cookie uniquement
7. **Créer des fichiers CSS séparés** — tout passe par Tailwind
8. **Utiliser `default export`** pour les composants dans `components/`
9. **Ignorer les erreurs TypeScript** avec `@ts-ignore` ou `as any`
10. **Créer des routes en anglais** — toutes les routes sont en français
11. **Ajouter des dépendances npm** sans les lister explicitement dans la réponse
12. **Modifier `tailwind.config.ts`** pour ajouter des couleurs hors du design system

---

## Référence rapide — fichiers importants

```
src/app/layout.tsx                  Root layout — polices, providers
src/middleware.ts                   Protection des routes dashboard
src/lib/utils/cn.ts                 Utility tailwind-merge + clsx
src/lib/api/client.ts               Instance fetch configurée
src/components/layout/Sidebar.tsx   Sidebar dynamique multi-rôles
src/components/ui/                  Composants atomiques du design system
CONTRIBUTING.md                     Conventions complètes de développement
```

---

## Écrans de référence — maquettes Stitch

Les maquettes Stitch couvrent **98 écrans** — préfixes :
`A-` (auth), `O-` (organisateur), `P-` (prestataire),
`G-` (gestionnaire), `V-` (visiteur/participant),
`S-` (paramètres), `U-` (système), `E-` (emails), `M-` (mobile)

Se référer aux numéros d'écrans dans les issues GitHub pour cibler
l'implémentation correcte.

---

*Dernière mise à jour : Avril 2026 — @NoeKen*
