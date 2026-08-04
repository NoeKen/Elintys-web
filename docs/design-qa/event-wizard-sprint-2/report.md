# QA visuelle — Wizard de création d'événement (Sprint 2.3)

Date : 4 août 2026 · Périmètre : les six étapes du wizard, desktop 1538×1100 et
mobile 390×844.

---

## 1. Méthode

Les implémentations sont capturées par la traversée réelle de l'interface — pas
par des URLs forgées : le wizard est guidé, ses pastilles de progression restent
`disabled` tant qu'une étape n'a pas été atteinte, et aucun paramètre d'URL ne
court-circuite la validation.

```bash
WIZARD_QA_CAPTURE=1 npx playwright test --config=playwright.functional.config.ts wizard-capture
```

Le parcours est celui de `e2e/functional/wizard-journey.ts` ; la capture ajoute
deux garde-fous à chaque étape : `documentElement.scrollWidth ≤ innerWidth + 1`
et absence d'image cassée. Les douze captures sont dans `implementations/`.

> Le harnais `playwright.visual.config.ts` n'a **pas** été utilisé : il
> s'authentifie contre l'API dev déployée (`api.dev.elintys.com`), dont le
> cookie de session ne s'installe pas sur `localhost:3100`. Ses parcours
> authentifiés échouent donc en amont de toute capture. Constat documenté,
> correction hors périmètre de ce sprint.

---

## 2. Constat bloquant : les maquettes de référence sont obsolètes

Les cinq maquettes Stitch de `references/` ne décrivent pas le produit livré.
Elles décrivent un concept antérieur, et l'écart est structurel — pas
cosmétique.

| Dimension | Maquettes Stitch | Implémentation livrée |
|---|---|---|
| Nombre d'étapes | **5** | **6** |
| Découpage | Informations · Configuration · Billetterie · Design · Publication | L'essentiel · Date et lieu · Lieu · Prestataires · Identité et accès · Récapitulatif |
| Cadre | Sidebar de tableau de bord + topbar persistantes | Plein écran « mode focus », sans sidebar |
| Accent | Vert (~#0E7A55) | Pétrole `--event-petrol` #002E38 + or `--event-gold` #C99A3E |
| Assistant | Bloc « Assistant IA » / « Rédaction intelligente » | Aucun — remplacé par « Conseils d'expert » (texte statique) |
| Étape lieu | Carte interactive, tarifs (`8 500 $`, frais techniques, total estimé) | Trois branches : lieu existant · recherche catalogue · plus tard |
| Modèle d'accès | « Public / Privé / Communauté » | Access V2 : visibilité × règle d'accès × modes d'admission |
| Billetterie | Étape dédiée | Hors périmètre MVP |

Conséquences :

1. **Aucun score de conformité Stitch n'est publié.** Comparer un wizard à 6
   étapes sans sidebar à une maquette à 5 étapes avec sidebar produirait un
   chiffre bas et sans valeur décisionnelle. Ce serait une mesure de l'écart de
   spécification, pas de la qualité d'exécution.
2. Les maquettes précèdent la palette V2 (juillet 2026) et le modèle Access V2
   (Lot 3). Les suivre littéralement **régresserait** le produit.
3. L'étape « Billetterie » et la tarification de lieu qu'elles montrent sont
   explicitement hors périmètre MVP.

La conformité est donc évaluée contre la référence qui fait autorité :
`docs/design-principles.md` et le design system.

Les rapprochements côte à côte restent consultables : `comparisons/index.html`.

---

## 3. Évaluation contre le design system

Barème : storytelling et intention (30) · hiérarchie et lisibilité (25) ·
cohérence des tokens (25) · responsive et états (20).

| Étape | Écran | Score | Points forts | Réserves |
|---|---|---|---|---|
| 1 | L'essentiel | **88**/100 | Titre narratif (« Donnons vie à votre événement »), typologie en 10 cartes iconographiées, aperçu latéral qui se remplit en direct | La capacité en grande capsule pétrole capte plus l'attention que le nom de l'événement, qui est pourtant le champ requis |
| 2 | Date et lieu | **85**/100 | Question de lieu posée en langage humain, trois cartes de même poids, fuseau explicité | Les `input[type=date]` restent des contrôles natifs bruts, en rupture avec le reste des champs |
| 3 | Lieu (branche « plus tard ») | **90**/100 | L'écran rassure au lieu de bloquer (« Aucun problème. Votre événement peut continuer sans lieu. ») ; le bouton devient « Continuer sans lieu » | — |
| 4 | Prestataires | **82**/100 | Étape franchement optionnelle, sortie explicite « Passer cette étape » | « Passer cette étape » est masqué sous le point de rupture `sm` : en mobile, la sortie n'est plus nommée (voir § 4) |
| 5 | Identité et accès | **86**/100 | Séparation nette visibilité / règle d'accès / admission ; champs conditionnels révélés uniquement au besoin ; carte de visibilité sélectionnée inversée en pétrole | Écran long (3 052 px en desktop) — aucun repère de progression interne |
| 6 | Récapitulatif | **91**/100 | Checklist de publication avec le blocage réel affiché, huit cartes « Modifier » vers l'étape concernée, distinction claire configurer ≠ publier | — |

**Moyenne : 87/100.**

Réponses aux quatre questions de gouvernance (`design-principles.md`) :

1. *Émotion visée* — la montée en confiance : chaque étape confirme
   l'enregistrement, aucune ne punit l'abandon.
2. *Histoire racontée* — celle d'un événement qui prend forme, matérialisée par
   l'aperçu latéral qui se remplit étape après étape.
3. *Différence avec le reste d'Elintys* — le mode plein écran sans sidebar, une
   rupture assumée avec le tableau de bord.
4. *Confusion possible avec un template SaaS générique* — **non** : titres en
   serif, palette pétrole/or, questions formulées en langage naturel plutôt
   qu'en libellés de formulaire.

---

## 4. Anomalies relevées

| Réf. | Sévérité | Constat | Preuve |
|---|---|---|---|
| F-038 | P2 — **corrigé** | L'erreur de validation de `accessPolicyType` n'était jamais rendue : la combinaison « privé + accès ouvert » bloquait le passage à l'étape 6 en silence, le focus étant renvoyé sur un `input` `sr-only` donc invisible | `IdentityAccessStep.tsx` — seul champ du wizard sans `FieldError` ; test `devrait refuser un événement privé laissé en accès ouvert` |
| F-039 | P3 — ouvert | « Passer cette étape » est `hidden … sm:inline-flex` : sous 640 px, l'étape 4 n'offre plus de sortie nommée. Le bouton principal la franchit quand même, mais l'utilisateur mobile ignore qu'elle est optionnelle | `EventCreationChrome.tsx` — classe du bouton `onSkip` |
| F-040 | P3 — ouvert | Le wizard définit une sous-palette `--event-*` (pétrole #002E38, or #C99A3E, fond #F9F9F6) distincte de la palette V2 documentée (navy #1E3D4F, or #C4A558, surface #F8F9FB). Tokenisée et cohérente, mais non déclarée dans le design system | `globals.css:112-122` vs `CLAUDE.md` § design system |
| — | Observation | La reprise d'un brouillon utilise `getNextStep()`, qui honore bien `creationProgress.currentStep` — le doute soulevé au Sprint 2.2 est levé | `event-creation.ts:480-491` |

F-039 et F-040 relèvent d'un arbitrage produit/design, pas d'un défaut
d'exécution : ils sont documentés, non corrigés unilatéralement.

---

## 5. Verdict

L'exécution visuelle du wizard est conforme au design system et à la
philosophie de design, à 87/100, sans défaut bloquant.

Le seul point dur n'est pas le produit : **les maquettes Stitch de référence
sont périmées**. Elles doivent être régénérées sur le périmètre réel (6 étapes,
palette V2, Access V2, sans billetterie) avant de pouvoir servir de nouveau de
référentiel de recette visuelle.
