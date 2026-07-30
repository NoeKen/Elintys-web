# Environnements frontend

`NEXT_PUBLIC_API_URL` est l'unique source de vérité pour joindre l'API. La
résolution est centralisée dans `src/shared/config/api-url.ts`.

| Exécution | Source attendue |
| --- | --- |
| `next dev` local | `.env.local`, sinon `http://localhost:3001/api/v1` |
| Vercel Preview de `dev` | Variable Vercel Preview limitée à la branche `dev` |
| Vercel Production | Variable Vercel Production |

Un build Preview ou Production échoue volontairement si la variable n'est pas
définie. Cette règle évite qu'un déploiement distant appelle silencieusement
`localhost`.

La variable est publique par conception : elle contient uniquement l'URL de
l'API. Aucun secret ne doit utiliser le préfixe `NEXT_PUBLIC_`.
