# Sprint 4 / Wave G — Design QA

## Surfaces inspectées

- Paramètres compte à 390×844 et 1440×900.
- Profil, sécurité, notifications email, rôles et historique d’achats.
- États loading, empty, success, error 429, validation et mutations pending.

## Résultats

- Hiérarchie visuelle cohérente avec Elintys : titres éditoriaux, surfaces chaudes, teal, grands rayons et ombres diffuses.
- Navigation de sections scrollable sur mobile et navigation globale intacte.
- Aucun overflow horizontal aux 7 viewports obligatoires.
- Cibles principales d’au moins 44 px.
- Zéro bordure décorative visible sur les cards; bordures conservées sur inputs et focus.
- Scroll natif et scroller dashboard existant inchangés.
- Axe : 0 violation critical, 0 serious sur les 7 viewports.
- Runtime Wave G : 0 console.error inattendu, 0 pageerror, 0 réponse HTTP >=500 inattendue.

## Artefacts

- `implementations/settings-390x844.png`
- `implementations/settings-1440x900.png`
- `axe.json`

## Verdict

GREEN — aucune régression UI/UX, responsive ou accessibilité bloquante.
