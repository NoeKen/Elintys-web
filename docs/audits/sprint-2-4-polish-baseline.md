# Sprint 2.4 — Baseline reproductible

Date : 4 août 2026. Établi **avant toute modification**, sur les commits
`652b1e0` (web) et `fcd9e4b` (api), working tree propre sur `dev`.

---

## 1. Protocole de mesure

| Paramètre | Valeur |
|---|---|
| Machine | macOS 26.5.2, Intel Core i9-9980HK @ 2,40 GHz |
| Navigateur | Chromium via Playwright 1.61.1 |
| Mode serveur | **build de production local** (`next build` + `next start`), port 3200 |
| API | pile locale `http://localhost:3001/api/v1` |
| Viewport | 1440 × 900 (desktop), 390 × 844 (mobile, axe) |
| Runs | 1 run à froid + 3 runs à chaud par route |
| Valeur retenue | **médiane des runs à chaud** ; le run à froid est reporté à part |
| Cache | contexte navigateur neuf à chaque run — cache disque toujours vide |
| Bridage | deux paliers : aucun, puis **4× CPU + 4G lent** (1,6 Mbps, 150 ms) |

Commandes :

```bash
bash scripts/start-perf-server.sh
node scripts/measure-web-vitals.mjs --runs 3 --throttle --out docs/audits/sprint-2-4/baseline-prod-throttled.json
```

### Isolation du build

`next dev` occupe `.next` en permanence ; y lancer un `next build` corrompt le
cache et renvoie des 404 sur toutes les routes — incident déjà rencontré lors
d'un sprint précédent. Le build de mesure vise donc `.next-perf`, via
`distDir: process.env.NEXT_DIST_DIR` dans `next.config.ts`. Le serveur de
développement n'est jamais interrompu.

---

## 2. Constat majeur : les mesures de référence n'étaient pas représentatives

Les valeurs qui ouvraient ce sprint provenaient de `performance-review.md`,
mesurées **en `next dev`**. Ce rapport le signalait déjà (F-024) : en mode
développement, chaque route est compilée à la demande au premier accès.

| Page | `next dev` (référence sprint) | Build de production, non bridé | Écart |
|---|---|---|---|
| `/` | LCP 3 684 ms | LCP **896 ms** | −76 % |
| `/connexion` | LCP 1 964 ms | LCP **608 ms** | −69 % |
| `/inscription` | LCP 8 160 ms · TTFB 6 334 ms | LCP **604 ms** · TTFB **9 ms** | −93 % |
| `/evenements` | LCP 4 400 ms | LCP **1 220 ms** | −72 % |
| `/prestataires` | LCP 2 880 ms | LCP **248 ms** | −91 % |
| `/lieux` | LCP 3 084 ms | LCP **248 ms** | −92 % |
| `/tarification` | LCP 2 384 ms | LCP **132 ms** | −94 % |

**L'« anomalie » de `/inscription` était un artefact de compilation.** Le TTFB
de 6,3 s correspondait à la compilation de deux routes successives — la page
redirige vers `/inscription/etape-1`.

Mesurer sur `localhost` sans bridage n'est cependant pas plus honnête : cela
mesure surtout la machine de développement. Le baseline exploitable est donc le
palier bridé.

---

## 3. Baseline retenu — build de production, 4× CPU + 4G lent

| Page | TTFB | FCP | LCP | CLS | JS transféré | Requêtes |
|---|---|---|---|---|---|---|
| `/` | 5 ms | 1 424 ms | **4 416 ms** | 0,0068 | 405 Ko | 44 |
| `/connexion` | 5 ms | 1 152 ms | **3 616 ms** | **0,0816** | 457 Ko | 41 |
| `/inscription` | 165 ms | **3 984 ms** | **4 228 ms** | 0 | 427 Ko | 46 |
| `/evenements` | 157 ms | 1 648 ms | **4 520 ms** | 0,0013 | 252 Ko | 44 |
| `/prestataires` | 112 ms | 1 508 ms | 1 508 ms | 0,0013 | 329 Ko | 54 |
| `/lieux` | 178 ms | 1 456 ms | 1 456 ms | 0,0013 | 355 Ko | 56 |
| `/tarification` | 6 ms | 1 192 ms | 1 192 ms | 0,0013 | 320 Ko | 63 |

Données brutes : `sprint-2-4/baseline-prod.json` et
`sprint-2-4/baseline-prod-throttled.json` (runs individuels inclus).

Quatre pages dépassent la cible de 2,5–3,0 s : `/`, `/connexion`,
`/inscription`, `/evenements`. `/connexion` porte en outre un CLS 60 fois
supérieur aux autres pages, reproductible sur les trois runs.

**Aucun TTFB serveur n'est en cause** : le plus élevé est de 178 ms. Le retard
est entièrement côté rendu client.

### Élément LCP par page

| Page | Élément | Nature |
|---|---|---|
| `/` | `<p>` d'accroche du héros | texte |
| `/connexion` | `<h2>` « L'événement parfait commence ici. » | texte |
| `/inscription` | citation du panneau éditorial | texte |
| `/evenements` | `<h1 class="hero-title">` | texte |

Aucune image n'est l'élément LCP : le levier n'est donc ni le poids ni le
format des médias.

---

## 4. Accessibilité — baseline

axe-core, WCAG 2.0/2.1 niveaux A et AA, desktop 1440 × 900 et mobile 390 × 844.

| Page | Violations | Détail |
|---|---|---|
| `/` | **1 critical** | `button-name` ×1 |
| `/evenements` | **1 serious** | `color-contrast` ×15 |
| `/connexion`, `/inscription`, `/prestataires`, `/lieux`, `/tarification` | 0 | — |

Le décompte de `color-contrast` est passé de 8 (audit initial) à 15 : le
nombre d'éléments concernés suit le nombre d'événements publiés dans le
catalogue de développement. Le défaut est unique, sa multiplicité est un
artefact de jeu de données.

---

## 5. Console et réseau

Sur les sept pages, trois entrées reviennent :

| Entrée | Nature |
|---|---|
| `POST /auth/refresh` bloqué par CORS | **artefact de mesure** — l'allowlist du backend (`FRONTEND_URL` + `CORS_ORIGINS`, `main.ts:34`) autorise le front local sur le port 3000 ; le serveur de mesure tourne sur 3200. Le contrôle de sécurité fonctionne comme prévu. |
| `GET /_vercel/insights/script.js` → 404 | **artefact local** — le script d'analytique n'est servi que par la plateforme Vercel. |
| `Failed to load resource` | conséquence des deux précédents. |

Aucune erreur applicative, aucune erreur d'hydratation, aucune image cassée.

---

## 6. Ce que le baseline établit

1. Les objectifs de performance du sprint portent sur **quatre** pages, pas
   trois, et la cinquième anomalie annoncée (`/inscription`, TTFB) n'existe
   pas sous cette forme.
2. Le retard est de nature **client**, sur des éléments LCP textuels.
3. Les deux défauts d'accessibilité sont réels et reproductibles.
