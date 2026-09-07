# Wave C Integration Cleanup Design

## Goal

Réduire les chemins d'intégration concurrents sans modifier le produit : un client navigateur authentifié, un client catalogue serveur, des services limités aux contrats consommés et des routes dashboard canoniques protégées par des redirects internes statiques.

## Boundaries

- Le client navigateur canonique reste `src/shared/lib/api.ts`; il conserve cookies httpOnly, refresh 401 mutualisé, `ApiClientError` et retry transitoire.
- `src/server/catalog/catalog-api.ts` reste distinct : ses responsabilités SSR, cache Next, timeout et observabilité ne sont pas celles du navigateur.
- Les `fetch` de pages Server Components qui distinguent 404 et erreur restent en place tant qu'un client serveur commun ne fournit pas cette sémantique.
- Aucun endpoint, schéma, index, rôle, règle métier Ticketing ou provider de paiement n'est modifié.

## Consolidation

Les services Guests, Notifications et Waitlist migrent vers `api`. Le paramètre sentinelle `cookie-session`, les deux copies `authFetch` et `useAuthToken` disparaissent. Les consommateurs conservent les mêmes query keys et états visibles. Les réponses 204 continuent de produire `undefined`; les erreurs deviennent uniformément des `ApiClientError`.

Les contrats Guests vivent dans le dossier `types` de la feature. Les anciens types Guest incompatibles sont remplacés par le contrat runtime. Les méthodes CRUD non consommées de `vendorsService`, la méthode Ticket `validate`, les hooks Events/Vendors/Guests/Discovery sans consommateurs et le composant Stripe `TicketSelector` sans import sont supprimés après recherche statique et tests.

Le normalizer Ticket reste actif et doit conserver `isFree`, `reserved` et `currency`, sans changer les règles de stock ou de prix.

## Routes

Les routes top-level ayant une destination dashboard sémantiquement identique deviennent des redirects permanents déclaratifs dans `next.config.ts`. Les destinations sont une table fermée, exclusivement interne, sans paramètre utilisateur : aucune surface d'open redirect.

Les routes sans équivalent certain (`/organisateur/analytiques`, `/organisateur/billetterie`) et les placeholders produit sont conservés et documentés. Les routes `/billetterie`, `/invites` et `/parametres` restent actives car elles ont encore des consommateurs ou une sémantique distincte.

## Query/cache

Des factories de query keys sont ajoutées uniquement pour Guests et Notifications, les domaines touchés par la migration. Les vues overview et access-summary partagent la même racine d'invalidation tout en gardant des clés de variantes distinctes. Aucun changement global TanStack Query.

## Security and verification

Les tests de caractérisation précèdent les changements : transport HTTP, payloads, 204, erreurs, query keys, normalisation Ticket et table de redirects. La revue indépendante revalide `/auth/me` 401 versus erreurs transitoires, safe redirects, navigation multi-rôles, absence de secrets et non-régression Wave A/B.

## Explicit non-goals

Pas d'UI Reviews, de recherche publique, de redesign, de correction de placeholders, de PayPal réel, de suppression Stripe backend, de nouvelle abstraction HTTP universelle ni de migration de données.
