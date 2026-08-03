# Revue design UI / UX — Elintys

> 14 captures dans `docs/design-qa/ecosystem/` (7 pages publiques × mobile 375 + desktop
> 1440). Référence de gouvernance : `docs/design-principles.md` (autorité — cf. mémoire
> projet). Écrans authentifiés non audités (compte QA inutilisable, F-015).

## Verdict : 6/10 (provisoire — public seulement)

## Méthode
La skill `/design-review` gstack **corrige** les problèmes qu'elle trouve — incompatible
avec la contrainte « aucune correction » de cette phase. J'ai donc réalisé une revue
**lecture seule équivalente** : captures multi-viewports + scan de contraste axe + lecture
des tokens du design system. La `/design-review` avec application de correctifs sera lancée
au Lot 5, après validation.

## Notes par page (pages publiques — /10)

| Page | Design | UX | Responsive | A11y | Cohérence Elintys |
|---|---|---|---|---|---|
| landing `/` | 7 | 7 | 7 | 5 (F-022) | 7 |
| connexion | 7 | 7 | 7 | 8 | 7 |
| inscription | 7 | 6 | 7 | 8 | 7 |
| evenements | 6 | 6 | 7 | 5 (F-023) | 6 |
| prestataires | 7 | 6 | 7 | 8 | 7 |
| lieux | 7 | 6 | 7 | 8 | 7 |
| tarification | 7 | 7 | 7 | 8 | 7 |

*(Notes indicatives basées sur les captures + contraste ; à confirmer par revue design
humaine.)*

## Observations
- **Cohérence de marque** : palette V2 (navy/teal/terracotta/gold/sage) et typographie
  (DM Serif Display + Plus Jakarta Sans) appliquées ; pas d'écran « template SaaS générique »
  flagrant sur le public.
- **Contraste** : le token texte secondaire échoue AA sur `/evenements` (F-023) — impact
  transversal probable sur toutes les listes/méta.
- **CLS < 0.01** partout → pas de sauts de mise en page (bonne stabilité perçue).

## Bloqué (F-015) — à auditer après compte QA
Dashboard, wizard de création 6 étapes (états loading/empty/error), espace organisateur,
page événement à accès restreint, accès & inscriptions, galerie/médias, distinction page
publique ⇄ gestion organisateur. Comparaison fidélité vs maquettes Stitch/DESIGN-2 :
à faire sur ces écrans.
