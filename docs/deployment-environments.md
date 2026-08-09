# Environnements frontend

`NEXT_PUBLIC_API_URL` est l'unique source de vérité pour joindre l'API. La
résolution est centralisée dans `src/shared/config/api-url.ts`.

| Exécution | Source attendue |
| --- | --- |
| `next dev` local | `.env.local`, sinon `http://localhost:3001/api/v1` |
| Vercel Preview de `dev` | Variable Vercel Preview limitée à la branche `dev` |
| Vercel Production | Variable Vercel Production |

Domaines apparentés attendus :

| Environnement | Frontend | API |
| --- | --- | --- |
| Développement distant | `https://dev.elintys.com` | `https://api.dev.elintys.com/api/v1` |
| Production | `https://app.elintys.com` | `https://api.elintys.com/api/v1` |

Le frontend appelle directement l'API : aucun proxy/BFF n'est introduit. Le
backend limite CORS à l'origine frontend exacte et conserve ses cookies
HTTP-only en mode host-only sur son propre domaine.

L'API est l'unique frontière de confiance pour la session et l'autorisation.
Ses cookies restent host-only sur le domaine API; Next.js ne tente donc jamais
de les lire dans un `proxy.ts`, un middleware ou un Server Component. Les zones
privées utilisent une garde de navigation cliente qui restaure la session via
`GET /auth/me`, tandis que chaque endpoint métier demeure protégé côté NestJS.
Cette séparation évite de partager les cookies entre sous-domaines sans ajouter
de BFF.

Un build Preview ou Production échoue volontairement si la variable n'est pas
définie. Cette règle évite qu'un déploiement distant appelle silencieusement
`localhost`.

La variable est publique par conception : elle contient uniquement l'URL de
l'API. Aucun secret ne doit utiliser le préfixe `NEXT_PUBLIC_`.

## Traçage des catalogues publics

Les appels serveur des catalogues ajoutent un `x-request-id` aléatoire. L'API
renvoie et journalise le même identifiant afin de corréler les logs Vercel et
Render. Le frontend écrit des logs JSON limités à la route normalisée, au
statut et à la durée. Les paramètres de recherche, cookies, jetons et données
personnelles ne sont jamais journalisés.
