# Revue de performance — Elintys

> Backend : k6 (charge réduite, documentée). Frontend : Core Web Vitals via Playwright/
> chromium **en mode dev** (indicatif). Aucune mesure Render/prod (à compléter).

## Verdict : 6/10 (provisoire — mesures prod requises)

## Backend — load test k6 (10 VUs max, 25 s, endpoints publics read-only)
| Métrique | Valeur |
|---|---|
| Débit | 524 req/s agrégé (4 endpoints) |
| p50 (réponses 200) | ~102 ms |
| p95 (réponses 200) | ~235 ms |
| max | **1.03 s** (outliers → round-trips Atlas / requêtes froides) |
| CLS mesuré | n/a (backend) |

- **F-019 (P2)** — Après ~100 requêtes, **96,94 %** de réponses = **429** : le throttle
  global 100/60 s sature la zone publique. Une simple montée en charge (ou un crawler) rend
  le catalogue public inaccessible. → tiers de throttling à séparer.
- **F-021 (P3)** — Outliers ~1 s en local vers Atlas. Sur **Render free** (cold start,
  region ohio) la latence réelle sera nettement pire. Vérifier les `explain()` sur les
  requêtes catalog (filtres + tri + pagination) — les index existent (voir DB) mais l'usage
  réel reste à confirmer.

## Frontend — Core Web Vitals (⚠️ mode `next dev`, non représentatif — F-024)
| Page | LCP | FCP | CLS | TTFB | load |
|---|---|---|---|---|---|
| landing `/` | 3.68 s | 1.23 s | 0.007 | 0.70 s | 1.82 s |
| connexion | 1.96 s | 0.63 s | 0.000 | 0.22 s | 1.04 s |
| inscription | 8.16 s | 6.77 s | 0.000 | 6.33 s | 7.18 s |
| evenements | 4.40 s | 2.16 s | 0.001 | 1.67 s | 2.98 s |
| prestataires | 2.88 s | 2.87 s | 0.001 | 2.38 s | 3.22 s |
| lieux | 3.08 s | 2.67 s | 0.001 | 2.33 s | 3.15 s |
| tarification | 2.38 s | 2.38 s | 0.001 | 1.95 s | 2.72 s |

- **CLS excellent partout (<0.01)** — bon.
- Les LCP/TTFB élevés (surtout `inscription` 8 s) sont des **artefacts de compilation à la
  demande de `next dev`**, pas des mesures prod. **Action obligatoire avant verdict** :
  remesurer via `next start` (build prod déjà validé) + Lighthouse sur previews Vercel.

## Non fait
- Lighthouse (binaire absent ; à lancer via `npx lighthouse` ou CI Vercel).
- Analyse du poids JS / chunks / hydration par page.
- Perf des pages authentifiées (dashboard, wizard, galerie) — bloquée par F-015.
