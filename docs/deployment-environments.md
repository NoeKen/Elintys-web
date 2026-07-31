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
| Développement distant | `https://app.dev.elintys.app` | `https://api.dev.elintys.app/api/v1` |
| Production | `https://app.elintys.com` | `https://api.elintys.com/api/v1` |

Le frontend appelle directement l'API : aucun proxy/BFF n'est introduit. Le
backend doit limiter CORS à l'origine frontend exacte et configurer ses cookies
HTTP-only avec le domaine approprié à l'environnement.

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
