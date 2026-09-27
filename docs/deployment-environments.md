# Environnements frontend

> Documentation plateforme (API + web : matrice complète des environnements,
> déploiement, CI/CD, migrations, recette) : dépôt `NoeKen/Elintys-api`,
> dossier `docs/` — notamment `docs/operations/environments.md`,
> `docs/operations/deployment.md`, `docs/operations/ci-cd.md` et
> `docs/uat/README.md`. Ce fichier ne couvre que le frontend.

`NEXT_PUBLIC_API_URL` est l'unique source de vérité pour joindre l'API. La
résolution est centralisée dans `src/shared/config/api-url.ts`.

| Exécution | Source attendue |
| --- | --- |
| `next dev` local | `.env.local`, sinon `http://localhost:3001/api/v1` |
| CI GitHub Actions | valeurs non secrètes posées par `.github/workflows/ci.yml` |
| Vercel Preview de `dev` | Variables Vercel Preview limitées à la branche `dev` |
| Vercel Preview de `uat` | Variables Vercel Preview limitées à la branche `uat` |
| Vercel Production (`main`) | Variables Vercel Production |

Matrice des variables publiques (aucune n'est secrète) :

| Variable | local | ci | dev | uat | prod |
| --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_ELINTYS_ENV` | `local` (défaut) | `ci` | `dev` | `uat` | `prod` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api/v1` | factice (`https://api.ci.invalid/api/v1` pour le build, API stub locale pour le smoke) | `https://elintys-api-dev-1pdh.onrender.com/api/v1` | `https://api.uat.elintys.com/api/v1` (domaine Render `api.uat` à rattacher) | `https://api.elintys.com/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | — | `https://dev.elintys.com` | `https://uat.elintys.com` | `https://app.elintys.com` |
| `NEXT_PUBLIC_PAYPAL_ENV` | `sandbox` | `sandbox` | `sandbox` | `sandbox` | `live` (quand l'API l'est) |
| `NEXT_PUBLIC_DISABLE_DEVTOOLS` | `false` | `true` | `true` | `true` | `true` |

`NEXT_PUBLIC_APP_URL` n'est lu que par l'outillage de test (Playwright
`baseURL`, CI) ; il n'est pas requis sur Vercel.

Actions manuelles Vercel pour la recette (projet `elintys-web`) : rattacher
le domaine `uat.elintys.com` à la branche `uat`, puis créer les cinq
variables ci-dessus avec la valeur de la colonne `uat`, restreintes à la
branche `uat`. Un nouveau déploiement de la branche est nécessaire après
chaque modification (valeurs figées au build).

Domaines :

| Environnement | Branche | Frontend (Vercel) | API (Render) |
| --- | --- | --- | --- |
| Développement distant | `dev` | `https://dev.elintys.com` | `https://elintys-api-dev-1pdh.onrender.com/api/v1` |
| Recette (UAT) | `uat` | `https://uat.elintys.com` | `https://api.uat.elintys.com/api/v1` |
| Production | `main` | `https://app.elintys.com` | `https://api.elintys.com/api/v1` |

Effets de `NEXT_PUBLIC_ELINTYS_ENV` (`src/shared/config/environment.ts`) :

- Vercel Analytics n'est chargé qu'en `prod`.
- `dev` et `uat` renvoient `X-Robots-Tag: noindex, nofollow` sur toutes les
  réponses (`next.config.ts`) et `robots: noindex` dans les métadonnées.
- `uat` affiche un badge « UAT » permanent (bas gauche, non interactif).
- `dev`, `uat` et `prod` exigent une `NEXT_PUBLIC_API_URL` HTTPS publique :
  le build échoue sur `http://` ou `localhost`.
- Une valeur inconnue fait échouer le build. Sans variable, un build Vercel
  de production (`VERCEL_ENV=production`) est traité comme `prod`.

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

⚠ Les cookies de l'API sont `SameSite=Lax`. Ils ne sont joints aux appels
`fetch` que si le frontend et l'API partagent le même site (ex.
`app.elintys.com` ↔ `api.elintys.com`). Une API `*.onrender.com` appelée
depuis `dev.elintys.com` ou `uat.elintys.com` est *cross-site* : la session ne
tient pas. Tant qu'un domaine `api.<env>.elintys.com` n'est pas rattaché aux
services Render dev/uat, les valeurs `onrender.com` de la matrice ci-dessus
sont provisoires (voir `docs/operations/environments.md`, section *Anomalies
connues*, dans `Elintys-api`).

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
