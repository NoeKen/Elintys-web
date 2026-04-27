# Elintys-web — Workflows Claude Code

Ces workflows définissent l'ordre exact des opérations à suivre.
Chaque étape marquée `[Skill]` requiert d'invoquer le skill via l'outil `Skill`.

---

## Workflow : Nouveau composant UI (design system)

> Exemple : Separator, Skeleton, Modal, Switch, Toast

1. Lire `CLAUDE.md` racine — vérifier les règles tokens + cn() + export nommé
2. `[Skill: frontend-design:frontend-design]` — consulter pour l'esthétique
   ⚠️ Les tokens Elintys (navy/teal/amber) priment sur toute suggestion du skill
3. Créer dans `src/shared/ui/` avec interface `Props` typée
4. Utiliser `cn()` pour toutes les classes conditionnelles
5. Ajouter `data-testid` sur les éléments interactifs
6. Exporter en **named export** (`export function Button`)
7. Ajouter dans `src/shared/ui/index.ts`
8. `[Skill: code-review:code-review]` — vérifier tokens, cn(), export, aria

---

## Workflow : Nouvelle page dashboard

> Exemple : hub événement, scanner QR, billetterie

1. Lire `CLAUDE.md` racine
2. `[Skill: superpowers:writing-plans]` — plan composants + hooks + types avant code
3. Créer les types dans `src/features/<domaine>/types/`
4. Créer le service API dans `src/features/<domaine>/services/`
5. Créer le hook TanStack Query dans `src/features/<domaine>/hooks/`
6. Implémenter la page (`app/(dashboard)/...`) en Server Component par défaut
7. Pousser `'use client'` aussi bas que possible dans l'arbre
8. Ajouter `Skeleton` pour l'état de chargement
9. Ajouter `EmptyState` pour l'état vide
10. `[Skill: superpowers:verification-before-completion]` — tester visuellement (golden path + edge cases)
11. `[Skill: code-review:code-review]` — vérifier règles CLAUDE.md

---

## Workflow : Flow d'authentification

> Register, Login, Forgot password, Reset, Email verification

1. `[Skill: vibesec:vibesec]` — **en premier**
2. Vérifier que `authService` appelle les bons endpoints NestJS (`/auth/login`, etc.)
3. Vérifier que `AuthContext` ne stocke **aucun** token dans `localStorage`
4. Vérifier que `withCredentials: true` est sur le client Axios
5. Vérifier que `middleware.ts` protège les routes concernées
6. Tester le cycle complet : login → refresh → logout → cookie absent
7. `[Skill: code-review:code-review]` — review obligatoire

---

## Workflow : Page publique (zone sans compte)

> Événements, prestataires, lieux, landing

1. Vérifier que la page est dans `app/(public)/` — **pas** dans `app/(dashboard)/`
2. Implémenter en Server Component avec `fetch()` natif + `next: { revalidate: 60 }`
3. Boutons d'action (Acheter, Contacter) : rediriger vers `/inscription?redirect=<url>` si non connecté
4. `FavoriteButton` : tooltip "Connectez-vous pour sauvegarder" si non connecté, toggle optimistic update si connecté
5. `[Skill: frontend-design:frontend-design]` — design de qualité production
6. `[Skill: vibesec:vibesec]` — vérifier qu'aucun token ou donnée sensible n'est exposée
7. `[Skill: superpowers:verification-before-completion]` — tester sans compte + avec compte

---

## Workflow : Débogage frontend

1. `[Skill: superpowers:systematic-debugging]` — avant toute hypothèse
2. Vérifier : `AuthContext.isLoading`, `withCredentials`, réponse réseau (DevTools)
3. Pour 401 silencieux : vérifier que le cookie `refresh_token` est présent dans les requêtes
4. Pour token manquant : vérifier `setAuthToken()` appelé après login/refresh
5. Pour routes mal protégées : vérifier `middleware.ts` et les `PROTECTED_PREFIXES`

---

## Workflow : Livraison de sprint (Elintys-web)

1. `[Skill: code-review:code-review]` — review de tous les fichiers modifiés
2. `[Skill: vibesec:vibesec]` — scan sécurité (focus : AuthContext, formulaires, API client)
3. `npm run lint && npx tsc --noEmit`
4. Tester visuellement tous les flows impactés dans le navigateur
5. Mettre à jour `CLAUDE.md` si nouveau pattern établi
6. Commit avec Conventional Commits

---

## Checklist qualité Elintys-web

- [ ] Zéro `any` TypeScript
- [ ] `'use client'` uniquement si hooks React ou events browser
- [ ] Tokens Elintys dans Tailwind (pas de hex inline)
- [ ] `cn()` pour toutes les classes conditionnelles
- [ ] `export` nommé pour les composants dans `components/`
- [ ] `export default` uniquement pour les pages App Router
- [ ] `import type` quand possible
- [ ] Aucun `localStorage` pour les tokens JWT
- [ ] `data-testid` sur les éléments E2E
- [ ] Routes en français (`/evenements`, `/prestataires`)
