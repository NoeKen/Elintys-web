# Sprint 2.4 — Résultats de performance

Protocole, environnement et baseline : voir
[`sprint-2-4-polish-baseline.md`](./sprint-2-4-polish-baseline.md).
Toutes les valeurs ci-dessous sont des **médianes de 3 runs à chaud**, sur un
build de production local, avec bridage **4× CPU + 4G lent**.

---

## 1. Avant / après

| Page | LCP avant | LCP après | Δ | CLS avant | CLS après | FCP avant | FCP après |
|---|---|---|---|---|---|---|---|
| `/` | 4 416 ms | **1 512 ms** | **−66 %** | 0,0068 | 0,0068 | 1 424 ms | 1 348 ms |
| `/connexion` | 3 616 ms | **1 496 ms** | **−59 %** | **0,0816** | **0** | 1 152 ms | 1 180 ms |
| `/inscription` | 4 228 ms | **1 656 ms** | **−61 %** | 0 | 0 | **3 984 ms** | **1 344 ms** |
| `/evenements` | 4 520 ms | **1 504 ms** | **−67 %** | 0,0013 | 0,0013 | 1 648 ms | 1 384 ms |
| `/prestataires` | 1 508 ms | 1 300 ms | −14 % | 0,0013 | 0,0013 | 1 508 ms | 1 300 ms |
| `/lieux` | 1 456 ms | 1 288 ms | −12 % | 0,0013 | 0,0013 | 1 456 ms | 1 288 ms |
| `/tarification` | 1 192 ms | 1 136 ms | −5 % | 0,0013 | 0,0013 | 1 192 ms | 1 136 ms |

Cibles du sprint : TTFB < 800 ms, FCP < 1 800 ms, LCP < 2 500–3 000 ms,
CLS < 0,1. **Les sept pages les respectent, sur les quatre métriques.**

TTFB après correction : de 5 ms à 175 ms selon la route — jamais un facteur.

## 2. Poids JavaScript transféré

| Page | Avant | Après | Δ |
|---|---|---|---|
| `/` | 405 Ko | 351 Ko | −54 Ko |
| `/connexion` | 457 Ko | 457 Ko | — |
| `/inscription` | 427 Ko | 416 Ko | −11 Ko |
| `/evenements` | 252 Ko | 251 Ko | — |
| `/prestataires` | 329 Ko | 308 Ko | −21 Ko |
| `/lieux` | 355 Ko | 308 Ko | −47 Ko |
| `/tarification` | 320 Ko | 237 Ko | −83 Ko |

La baisse vient du retrait de Framer Motion des quatre composants convertis :
l'animation d'entrée ne nécessitait pas de JavaScript.

---

## 3. Diagnostic et corrections

### 3.1 Contenu au-dessus de la ligne de flottaison masqué jusqu'à l'hydratation

**Constat.** Sur `/`, `/connexion`, `/inscription` et `/evenements`, l'élément
LCP est du texte déjà présent dans le HTML serveur — mais peint 3 à 4,5 s après
le premier rendu.

**Cause.** Les blocs du héros étaient animés par Framer Motion depuis
`initial={{ opacity: 0 }}`. Le HTML serveur les livrait donc **transparents** :
ils n'apparaissaient qu'une fois React hydraté. Sur un mobile milieu de gamme,
l'hydratation arrive vers 4 s — c'était exactement la valeur du LCP.

**Correction.** Une animation d'entrée équivalente, portée par CSS
(`.reveal`, `globals.css`), qui démarre à la peinture sans attendre le
JavaScript. Le fondu et le décalage vertical sont conservés à l'identique, les
délais d'échelonnement aussi. `prefers-reduced-motion: reduce` neutralise
l'animation et laisse le contenu visible.

Composants convertis : `LandingHero`, `public/HeroSection`, `AuthSplitLayout`.

### 3.2 `useSearchParams` excluant des pages entières du rendu serveur

**Constat.** `/inscription` avait un FCP de 3 984 ms — rien n'était peint
pendant 4 s. `/connexion` affichait une carte de connexion vide qui se
remplissait à l'hydratation, d'où son CLS de 0,0816.

**Cause.** Les deux pages plaçaient tout leur contenu sous une frontière
`<Suspense>` sans repli, autour d'un composant appelant `useSearchParams()`.
Ce hook exclut du rendu serveur l'intégralité du sous-arbre concerné : le
serveur envoyait le repli — c'est-à-dire **rien**.

Mesure isolant les deux effets :

| Route | FCP | Redirections | JS |
|---|---|---|---|
| `/inscription` | 3 424 ms | 1 (307, 167 ms) | 427 Ko |
| `/inscription/etape-1` | 3 284 ms | 0 | 427 Ko |
| `/connexion` | 1 152 ms | 0 | 457 Ko |

La redirection ne coûte que 167 ms : la cible elle-même était en cause.

**Correction.** Les paramètres d'URL sont désormais lus **côté serveur** et
passés en props :

- `connexion/page.tsx` devient un Server Component qui assainit `redirect` et
  le transmet à `LoginForm` — lequel n'appelle plus `useSearchParams`, dont il
  ne se servait que dans son gestionnaire de soumission.
- `inscription/etape-1/page.tsx` devient un Server Component ; la partie
  cliente est réduite à `RegisterStep1Client` (navigation et brouillon local).

Aucune frontière `Suspense` n'est plus nécessaire sur ces deux pages.

---

## 4. Contrepartie assumée

Sans bridage, le LCP de `/` passe de 896 ms à 1 768 ms : sur une machine
rapide, l'hydratation était plus rapide que l'animation CSS, qui devient alors
le facteur limitant.

C'est un arbitrage volontaire. La valeur reste très en deçà de la cible, et le
gain sur une configuration réaliste — celle des utilisateurs — est de 66 %.
Optimiser pour le poste de développement aurait été optimiser pour personne.

| Palier | `/` avant | `/` après |
|---|---|---|
| Non bridé | 896 ms | 1 768 ms |
| 4× CPU + 4G lent | 4 416 ms | **1 512 ms** |

---

## 5. Reproduire

```bash
bash scripts/start-perf-server.sh
node scripts/measure-web-vitals.mjs --runs 3 --throttle --out /tmp/mesure.json
```

Données brutes : `sprint-2-4/baseline-prod-throttled.json`,
`sprint-2-4/apres-prod-throttled.json`, `sprint-2-4/apres-prod.json`.
