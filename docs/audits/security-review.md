# Revue de sécurité — Elintys

> Lecture seule + tests HTTP actifs (charge réduite) contre l'API locale (:3001) branchée
> sur le cluster dev. Aucun compte créé, aucune donnée écrite. IDs de findings → `findings.csv`.

## Verdict : 5.5/10 — base serveur saine, mais défauts exploitables côté périmètre

## Positifs vérifiés (F-018, F-026)
- **Guards** : 9/9 endpoints protégés testés → **401** sans cookie (`/auth/me`, `/events/my`,
  `/favorites`, `/tickets/my`, `/vendors/me`, `/venues/me`, `/invitations/me`,
  `/notifications/me`, `POST /events`).
- **Helmet complet** (headers observés sur `/discovery/featured`) : CSP `default-src 'self'`,
  `Strict-Transport-Security`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options:
  nosniff`, `Referrer-Policy: no-referrer`, COOP/CORP `same-origin`.
- **Pas d'énumération d'utilisateur** : mauvais identifiants → `401 INVALID_CREDENTIALS`
  identique que l'email existe ou non.
- **Cookies** : `httpOnly:true, sameSite:'lax', secure:config` (`auth.controller.ts:38-40`).
- **CORS** : origines explicites + `credentials:true`, refus par défaut ; local autorisé
  hors prod uniquement (`main.ts:45-64`).
- **Tokens d'invitation** : `sha256(randomBytes(32))`, jamais stockés en clair, `select('-token -tokenHash')`.

## Findings

### F-001 — P1 — Middleware de protection des routes **inerte** (confirmé runtime)
`proxy.ts` (nommé ainsi au lieu de `middleware.ts`) n'est **pas** enregistré par Next 16 :
`middleware-manifest.json` vide après build propre, et **runtime** : `GET /tableau-de-bord`,
`/organisateur`, `/prestataire`, `/gestionnaire`, `/parametres`, `/billetterie` non
authentifiés → **HTTP 200 sans redirection** (attendu 307 → `/connexion`).
*Impact* : gate d'auth UI mort. **Pas de fuite de données** (l'API applique les guards ; le
shell anonyme ne contient ni user ni token — vérifié). *Reco* : renommer en
`src/middleware.ts` + test E2E de redirection. *Effort* : S.

### F-017 — P2 — 500 non gérés sur tout champ `@Transform(trim)` recevant un objet
`login.dto.ts:7` : `@Transform(({value}) => value?.trim().toLowerCase())` s'exécute **avant**
la validation ; sur `email={"$ne":"x"}`, `value.trim` est `undefined` → TypeError → **500**.
Systémique : `POST /auth/login`, `/auth/forgot-password`, `/waitlist`, `/auth/register`
testés → tous **500** ; ~58 usages `.trim()` dans les DTO. *Impact* : DoS applicatif léger
non authentifié + pollution logs. **Pas d'injection NoSQL** (l'objet n'atteint pas Mongoose).
*Reco* : `typeof value==='string' ? value.trim().toLowerCase() : value`. *Effort* : S.

### F-002 — P2 — Pas de rate-limit dédié sur l'auth
Seul `ThrottlerGuard` global 100 req/60 s ; `grep '@Throttle' src/modules/auth` = 0.
~100 essais de mot de passe/min/IP. *Reco* : `@Throttle` strict (5/min) sur `login` +
`forgot-password`. *Effort* : S.

### F-019 — P2 — Throttle unique mal calibré (zone publique 429)
k6 10 VUs read-only → après ~100 req, 96,94 % de **429**. La navigation publique partage la
limite des mutations. *Reco* : tiers séparés (généreux public / strict auth+mutations).

### F-010 — P3 — Swagger exposé en dev-prod
`render.yaml` : `NODE_ENV=production` **et** `ENABLE_SWAGGER=true` → `/api/docs` public.
Acceptable en dev, à cloisonner avant prod publique.

### F-004 — P2 (à vérifier) — Rôles top-level hors `PROTECTED_PREFIXES`
`/organisateur`, `/prestataire`, `/gestionnaire` absents de la liste `proxy.ts:7` (aggrave
F-001).

## Non couvert (bloqué) / à compléter
- **IDOR / ownership / cross-user / cross-role** : nécessite ≥2 comptes authentifiés →
  **bloqué par F-015** (compte QA inexistant). L'ownership est déclaré « côté service »
  (CLAUDE.md) et 335 tests unitaires passent, mais la vérification runtime cross-user reste
  à faire.
- Upload malveillant / MIME spoofing (module media), webhook Stripe HMAC, codes d'accès
  brute-force : à tester avec compte + fixtures (partiellement bloqué par throttle+creds).
