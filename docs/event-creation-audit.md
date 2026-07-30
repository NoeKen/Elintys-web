# Audit préalable — création d’événement high-fidelity

Date : 2026-07-28

## Périmètre inspecté

- Références visuelles : les huit `screen.png` et `code.html` de l’archive Stitch.
- Design : `DESIGN-2.md`, `../docs/design-principles.md`,
  `../docs/superpowers/specs/2026-06-07-elintys-vision-enrichie-design.md`,
  `CLAUDE.md` et les plans design/frontend de `Elintys-web`.
- Frontend : routes App Router, dashboard, primitives UI, formulaires,
  TanStack Query, API client, authentification, messages FR/EN et tests.
- Backend : schéma/DTO/controller/service Event, Venues, Vendors et Invitations.

## État initial

- Next.js 15.5 App Router, React 19, TypeScript strict, Tailwind CSS v4.
- React Hook Form + Zod, TanStack Query, Radix UI, Framer Motion et toast
  existent déjà et doivent être réutilisés.
- Les routes sont en français et sans préfixe locale. `messages/fr.json` et
  `messages/en.json` existent, mais aucun runtime i18n (`next-intl`) n’est
  actuellement branché.
- L’authentification utilise des JWT en cookies httpOnly. Le layout dashboard
  appelle `requireAuth()`.
- Le flow actuel est `src/components/events/EventWizard.tsx` sur
  `/evenements/creer` : trois étapes, état local uniquement, création au dernier
  écran, aucune reprise.
- Le dashboard réel est `/tableau-de-bord`; ses cartes événements peuvent être
  adaptées pour exposer la progression et la reprise des brouillons.
- Aucun composant date/heure avancé n’existe. Les inputs HTML natifs restent la
  primitive la plus légère et accessible.
- Aucun endpoint ou fournisseur d’upload d’images n’existe dans le backend.

## Contrats API disponibles

- `POST /events`
- `GET /events/my`
- `GET /events/:id`
- `PUT /events/:id`
- `DELETE /events/:id`
- `PATCH /events/:id/publish`
- `GET /venues`, `POST /venues/:eventId/bookings`
- `GET /vendors`, `POST /vendors/:eventId/requests`
- `POST /invitations`

Les services frontend Events, Venues, Vendors et Invitations sont partiellement
présents. `eventsService.update()` appelle déjà `PATCH /events/:id`, alors que
le backend n’expose initialement que `PUT /events/:id`.

## Gaps backend bloquants

1. `POST /events` exige `startDate`, alors que le brouillon doit être créé après
   l’étape Informations.
2. Le schéma Event ne stocke ni type d’événement, ni mode de lieu, ni fuseau,
   ni besoins prestataires, ni règles d’accès privé, ni progression.
3. `GET /events/:id` est public et ne vérifie pas l’ownership, ce qui expose un
   risque IDOR pour les brouillons.
4. Aucun upload sécurisé n’est disponible. Le frontend peut fournir validation,
   drag-and-drop et aperçu local, mais la persistance de la couverture reste
   impossible sans stockage média backend.

## Stratégie retenue

- Étendre de manière additive le contrat Event pour accepter un brouillon
  partiel, persister `creationProgress` et les champs du wizard.
- Ajouter `PATCH /events/:id` en conservant `PUT` pour compatibilité.
- Protéger la lecture par ID et vérifier l’organisateur; conserver la lecture
  publique par slug pour les pages publiques.
- Créer le draft à la validation de l’étape 1; chaque transition suivante
  attend le PATCH réussi avant de changer d’étape.
- Utiliser l’URL `?etape=` comme reflet navigable de l’étape, et le backend
  comme source de vérité. Aucun localStorage pour les données du draft.
- Réutiliser `GET /venues`, les demandes Venues/Vendors et Invitations sans
  inventer de résultats de catalogue.
- Isoler l’upload derrière une interface claire et documenter le gap média; ne
  jamais persister un object URL ou un data URL comme couverture.
- Ajouter toutes les chaînes au couple FR/EN existant et consommer le
  dictionnaire FR typé, en attendant le branchement global de `next-intl`.

## Composants à réutiliser

- API client cookie-aware et services de domaine.
- TanStack Query pour chargement/invalidation.
- React Hook Form + Zod.
- Toast provider, animations et tokens Tailwind v4.
- `DashboardEventCard`, `Sidebar`, `Topbar`, `MobileNav`.
- Catalogues Venues/Vendors existants.

## Composants à créer

- Shell, header/progression, statut d’enregistrement et navigation du wizard.
- Six étapes métier et branche dynamique de lieu.
- Sélecteurs accessibles (type, format, lieu, prestataires, visibilité).
- Recherche/liaison de lieu, ajout manuel et état différé.
- Ajout manuel prestataire et état facultatif.
- Upload UI avec validation/aperçu local.
- Récapitulatif et checklist.

## Risques de régression

- Collision entre routes publiques `/evenements` et route dashboard
  `/evenements/creer`.
- Compatibilité des anciens événements dont `startDate` est toujours présent
  mais dont les nouveaux champs sont absents.
- Changements d’autorisation sur `GET /events/:id`.
- Divergence des anciens services frontend Venue/Vendor avec les verbes HTTP du
  backend.
- Layout dashboard contraint par `h-screen` et barres mobiles/sticky.
- Fichiers déjà modifiés par l’utilisateur (`package-lock.json` et
  `src/components/public/PublicNavbar.tsx`) à préserver sans modification.
