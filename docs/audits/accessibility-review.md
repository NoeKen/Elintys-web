# Revue d'accessibilité — Elintys-web

> axe-core (WCAG 2.0/2.1 A & AA) via Playwright/chromium sur les pages **publiques**.
> Rappel : axe ne détecte que ~30-40 % des problèmes ; la revue clavier/lecteur d'écran
> manuelle et les écrans authentifiés restent à compléter (bloqués par F-015).

## Verdict : 6/10 (pages publiques majoritairement propres, 2 défauts réels)

| Page | Violations axe | Détail |
|---|---|---|
| landing `/` | **1 critical** | `button-name` ×1 — bouton sans texte discernable (F-022) |
| connexion | 0 | ✅ |
| inscription | 0 | ✅ |
| evenements | **1 serious** | `color-contrast` ×8 — contraste < AA (F-023) |
| prestataires | 0 | ✅ |
| lieux | 0 | ✅ |
| tarification | 0 | ✅ |

## Findings

### F-022 — P2 — `button-name` (critical) sur la landing
Un bouton icon-only sans `aria-label` / texte accessible → WCAG **4.1.2** échoué. Viole
la règle interne CLAUDE.md (« tous les boutons icon-only : `aria-label` obligatoire »).
*Reco* : ajouter `aria-label`. *Effort* : S.

### F-023 — P2 — `color-contrast` ×8 (serious) sur `/evenements`
8 éléments sous le ratio 4.5:1 → WCAG **1.4.3** échoué. Corrèle avec les tokens de texte
secondaire du design system (`muted #6B7A99` sur `surface #F8F9FB`). *Reco* : recalibrer les
tokens texte secondaire pour AA. *Effort* : M (impact design system global).

## À compléter (non fait)
- **Navigation clavier manuelle** (ordre de tabulation, focus visible, pièges de focus sur
  modales/menus/accordéons) — non exécutée automatiquement.
- **Sémantique lecteur d'écran** (aria-live sur erreurs de formulaire, alt d'images
  dynamiques, fieldsets/radios du wizard).
- **Zoom 200 %, reduced-motion, taille tactile**.
- **Écrans authentifiés** (dashboard, wizard 6 étapes, uploader, galerie) — bloqués par
  F-015 (compte QA).
