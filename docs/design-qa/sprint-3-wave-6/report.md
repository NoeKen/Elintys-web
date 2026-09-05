# Sprint 3 / Vague 6 — QA UI/UX paiement

Date : 2026-09-04

## Périmètre réellement vérifié

- pages `/paiement/succes` et `/paiement/annule`, y compris accès direct sans commande ;
- états commande absente, traitement, erreur, reprise manuelle et état terminal via tests de composants ;
- parcours participant avec billet gratuit et tentative payante fail-closed ;
- navigation clavier, régions live, hiérarchie des titres et absence d'identifiant technique ;
- scroll document natif et absence de débordement horizontal ;
- viewports 320×720, 375×812, 390×844, 768×1024, 1024×768, 1440×900 et 1538×1100.

## Résultats

- Playwright Vague 6 : 13/13.
- E2E participant/fail-closed : 22/22.
- Axe WCAG A/AA : 0 violation critical, 0 serious.
- Overflow horizontal : ≤ 1 px sur les sept viewports.
- Cibles principales : hauteur minimale 48 px.
- Scroll : natif, aucun Lenis ni verrou global ajouté.
- Console : aucune erreur JavaScript sur les pages de retour testées.

## Revue visuelle

La page conserve la hiérarchie Elintys : surface chaude, titre éditorial, message
factuel et deux actions maximum. Une URL de succès sans commande affiche
« Commande introuvable » et ne prétend jamais qu'un paiement est réussi.

Capture : `implementations/payment-success-missing-390x844.png`.

## Limite

Le widget ou la page d'approbation PayPal Sandbox n'a pas été inspecté : aucun
identifiant Sandbox n'est disponible. L'intégration utilise une redirection et
ne charge aucun SDK PayPal dans le bundle Elintys.
