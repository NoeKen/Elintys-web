# Sprint 3 — Vague 2 — Préaudit page publique détaillée

Date de vérification : 9 août 2026  
Périmètre : `Elintys-web` et `Elintys-api`, branches `dev`.  
Mission : page participant `/evenements/[slug]` et audit transversal du scroll natif.

## Verdict de préaudit

Le socle public existe, mais il n'est pas encore une projection participant complète. La route
Next.js rend le titre et la date côté serveur, puis transmet un objet Event générique à un unique
composant client. Elle lance aussi une seconde requête billetterie, affiche une section billets même
quand aucun mode ticket n'est activé et ne possède ni lieu enrichi, ni prestataire confirmé, ni
organisateur sûr, ni événements similaires. L'API protège déjà correctement le cycle de vie et la
découvrabilité au niveau du slug, mais son contrat reste implicite et trop proche du document Event.

La Vague 2 doit donc renforcer et enrichir le contrat existant, pas réécrire Access V2. Le wizard six
étapes, `creationProgress`, l'authentification, Cloudinary et F-047 restent gelés.

## État Git initial

Après `git fetch origin dev` :

| Dépôt | Branche | HEAD | `origin/dev` | État suivi |
|---|---|---|---|---|
| `Elintys-web` | `dev` | `d32da39fa2ac7d8bef658ae3839d6c38910d23fa` | identique | propre |
| `Elintys-api` | `dev` | `ccee08504080906d15d63613da973ace0ea96f06` | identique | propre |

## Références vérifiées

- les deux briefs Sprint 3 Vague 2 et Phase 24B ;
- `docs/design-principles.md`, les audits Sprint 1 à 3 et Event Access V2 ;
- la référence Stitch `reference-event-public-desktop.png` et l'implémentation QA actuelle ;
- les routes, layouts, styles globaux, modales, navigation mobile et suites Playwright ;
- les schémas Event, User, Venue, Vendor, Ticket et les services de demandes existants.

Les données persistées et les contrats Access V2 priment sur les maquettes anciennes. Programme,
intervenants et FAQ resteront absents tant que le modèle ne porte pas ces données.

## Frontend actuel

### Route et rendu

- `/evenements/[slug]` est un Server Component et utilise déjà `generateMetadata` ;
- le même fetch est actuellement exprimé deux fois et dépend de la déduplication implicite de Next ;
- le hero est présent dans le HTML initial, mais presque toute la page est incluse dans un composant
  client à cause des trois actions d'accès et de la modale billet ;
- `next/image` et les transformations média existent ; la galerie est plafonnée visuellement à six
  images ;
- les métadonnées n'ont pas de canonical ni Open Graph complet ; le JSON-LD est incomplet ;
- le sitemap consomme le catalogue public et refiltre `discoverability === public`.

### Gaps fonctionnels

1. CTA d'accès et admission insuffisamment séparés.
2. Section billetterie affichée sans mode ticket et sans contrat consolidé.
3. Absence de sections lieu, organisateur public, prestataires confirmés et événements similaires.
4. Pas d'état d'erreur dédié avec retry ; le not-found est seulement global.
5. Pas de lightbox accessible pour la galerie.
6. Copie publique partiellement codée en dur dans le composant.
7. Tests unitaires limités à quatre branches Access V2.

## Backend actuel

### Garanties déjà présentes

- le slug n'expose que `published`, non archivé, `public` ou `unlisted` ;
- le privé, le brouillon, l'archivé, l'annulé et le terminé sont exclus du détail direct ;
- `toPublicEvent` retire organisateur, vendors, progression, règles legacy, visibilité et `codeHash` ;
- le catalogue n'inclut que les événements publics publiés et non archivés ;
- les recherches MongoDB échappent déjà les expressions utilisateur.

### Gaps du contrat public

1. Aucun type de réponse `PublicEventDetail` explicite.
2. L'objet public reste construit par suppression de champs au lieu d'une allowlist.
3. Le lieu sélectionné n'est pas projeté avec une allowlist.
4. Les prestataires acceptés ne sont pas résolus depuis `VendorRequest.status=accepted`.
5. Le nom public de l'organisateur n'est pas exposé de façon minimale.
6. Les billets et événements similaires nécessitent des appels séparés ou n'existent pas.
7. Aucun test n'asserte actuellement l'absence exhaustive des champs internes dans le détail slug.

## Audit du scroll natif

### Modèle attendu

- pages publiques et authentification : scroll du document ;
- dashboard : scroll interne explicite du `<main>` sous la topbar, sans double scroll ;
- Sheet/dialog/lightbox : scroll interne seulement si le contenu dépasse, body verrouillé pendant
  l'ouverture puis restauré ;
- carrousels et tabs : scroll horizontal local sans détourner le geste vertical.

### Cause confirmée

`AuthSplitLayout` combine `min-h-screen` et `overflow-hidden` sur son `<main>`. Sur les petits écrans
ou au zoom, le contenu peut dépasser sans que le document puisse atteindre la suite. La correction
minimale est de supprimer ce verrouillage, en conservant les orbes décoratives absolues.

Le dashboard utilise `h-screen overflow-hidden` au niveau du shell avec `main.overflow-y-auto` : il
s'agit d'un scroll container intentionnel, nécessaire à la topbar/sidebar fixes, à tester comme tel.
Le profil crée un second modèle de scroll interne compatible avec ce shell mais devra être inclus
dans les tests de non-régression. Aucun gestionnaire global `preventDefault`, `touch-action:none` ou
masquage global de scrollbar n'a été trouvé.

## Architecture retenue

1. Ajouter un contrat allowlisté `PublicEventDetail`, retourné par `GET /events/slug/:slug`.
2. Résoudre en parallèle et par requêtes bornées : lieu actif, organisateur (`fullName` seulement),
   demandes prestataires acceptées + profils actifs, types de billets si l'admission l'exige et
   maximum quatre événements similaires publics.
3. Ne jamais renvoyer emails, téléphones, prix internes de lieu/prestataire, user IDs, hashes,
   `creationProgress`, notes de demandes ou champs d'authentification.
4. Conserver le 404 uniforme pour les slugs privés/inactifs et les entrées malformées.
5. Mutualiser le fetch serveur avec `cache()`, construire metadata/canonical/OG/robots et JSON-LD à
   partir du même contrat, puis rendre les sections statiques en Server Component.
6. Isoler uniquement les contrôles interactifs d'accès, la galerie et l'éventuelle réservation dans
   de petits Client Components.
7. Afficher les billets uniquement pour `free_ticket`/`paid_ticket`, et ne jamais simuler de prix ou
   de checkout pour les autres admissions.
8. Corriger `AuthSplitLayout`, sécuriser le cycle de scroll-lock des overlays concernés et ajouter un
   helper Playwright commun vérifiant wheel, clavier, scrollbar, overlay et restauration.

## Risques et parades

| Risque | Parade |
|---|---|
| fuite PII via relations | projections MongoDB et DTO de sortie en allowlist |
| N+1 sur relations | `Promise.all`, IDs groupés et limites strictes |
| événement privé énumérable | même 404 sans metadata sensible |
| billetterie fantôme | section conditionnée aux modes et données réels |
| confusion accès/admission | composants, titres et CTA distincts |
| régression ISR/SEO | fetch serveur mutualisé, tests metadata/sitemap |
| body lock résiduel | restauration en cleanup et tests avant/pendant/après |
| faux alignement Stitch | documenter les sections non modélisées plutôt que les inventer |

## Décision de départ

Le périmètre est implémentable sans migration, suppression de données, index nouveau ou changement
de production. Aucun P0/P1 n'a été découvert. Les écarts actuels sont des P2 de projection/UX et la
cause de scroll auth est un P2 d'utilisabilité/accessibilité ; ils sont traitables dans cette vague.
