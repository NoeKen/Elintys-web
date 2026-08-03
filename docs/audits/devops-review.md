# Revue DevOps / Observabilité / Résilience — Elintys

> Sources : `render.yaml`, `.vercel/`, `next.config.ts`, `main.ts`, logs de boot, `.env(.example)`.

## Verdict : 6/10 — socle correct, mais plan free + pas de CI visible + Swagger public

## Déploiement
- **API → Render** (`render.yaml`) : service `elintys-api-dev`, branche `dev`, region ohio,
  **plan `free`**, `healthCheckPath: /api/v1/health`, `autoDeployTrigger: commit`,
  build `npm ci --include=dev && npm run build && npm prune --omit=dev`.
  - Secrets en `sync:false` (MongoDB/JWT/Stripe/Cloudinary/Resend) → **bien** (non versionnés).
  - `FRONTEND_URL=https://dev.elintys.com`, `NODE_ENV=production`, `ELINTYS_ENV=dev`.
- **Web → Vercel** (`.vercel/` présent, `elintys.com`). `next.config.ts` : `remotePatterns`
  limités à `images.unsplash.com` et `res.cloudinary.com/**/image/upload/**` → **bien**.

## Findings
- **F-010 (P3)** — `ENABLE_SWAGGER=true` + `NODE_ENV=production` → `/api/docs` public sur le
  déploiement dev. À cloisonner avant prod publique.
- **Plan Render `free` (P3/obs)** — cold starts, pas d'autoscaling, coupures d'inactivité →
  les outliers de latence (F-021) seront aggravés ; inadapté à une prod publique.
- **Aucun fichier CI détecté** (`.github/workflows`, etc. absents des repos) — les gates
  (lint/typecheck/test/coverage/build) ne sont pas prouvés en CI. Or la commande de
  couverture **échoue** (F-013/F-014) : une CI correctement configurée serait rouge.
- **Séparation dev/prod DB à confirmer** — la base Mongo se nomme `elintys` (non suffixée par
  environnement) ; vérifier que dev et prod n'utilisent pas la même base/cluster.

## Observabilité (positif partiel)
- **Logs structurés JSON** avec `requestId`, `method`, `route`, `status`, `durationMs`
  (`request-observability.middleware`), header `x-request-id` exposé.
- Health check `@nestjs/terminus` (`/api/v1/health` → `{"status":"ok"}`).
- **Manques** : pas d'error-tracking (Sentry) ni d'alerting détecté ; pas de dashboards
  métriques ; pas d'audit-log applicatif.

## Résilience (non éprouvée — à tester)
États dégradés non simulés : API down, Mongo down, Cloudinary down, réseau lent, 401/403/
404/429/500. Le comportement front (error/loading boundaries `(dashboard)/error.tsx`,
`loading.tsx`) existe mais n'a pas été éprouvé sous panne réelle. Le pattern F-017 montre que
certaines entrées produisent des 500 non maîtrisés — la gestion d'erreur serveur mérite un
durcissement.
