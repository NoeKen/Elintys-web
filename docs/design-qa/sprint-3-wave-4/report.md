# Sprint 3 / Vague 4 — QA participant

## Résumé

Le parcours participant sépare explicitement l'accès de l'admission. L'inscription
simple et le billet gratuit sont réels et idempotents. Le billet payant reste visible
mais désactivé dans l'UI et côté API tant que la réservation de stock avant paiement
n'est pas finalisée.

## Surfaces vérifiées

- événement à accès ouvert et inscription simple ;
- confirmation et persistance après actualisation ;
- billet gratuit et double clic ;
- billet payant sans faux checkout ;
- espace unifié « Ma participation » ;
- anciens enregistrements orphelins (`eventId: null`) sans crash ;
- états Access V2 déjà couverts : code, domaine courriel, approbation, invitation ;
- états loading, empty, error et retry.

## Responsive et scroll

Viewports : 320×720, 375×812, 390×844, 768×1024, 1024×768,
1440×900 et 1538×1100. Aucun overflow horizontal supérieur à 1 px. Le scroll
document natif reste actif sur la page publique et le dashboard conserve son scroller
interne unique.

## Accessibilité

Axe WCAG 2.1 A/AA : 0 violation `critical` ou `serious` sur l'admission desktop et
« Ma participation » mobile. Les CTA principaux mesurent au moins 44 px, les modales
ont titre/description, les erreurs sont annoncées et les focus visibles sont conservés.

Preuve structurée : `axe.json`.

## Performance locale production

Mesure Chromium sur trois contextes neufs par viewport, médiane sans throttling :

| Profil | TTFB | FCP | LCP | CLS | Transfert |
|---|---:|---:|---:|---:|---:|
| 1440×900 | 157 ms | 320 ms | 412 ms | 0,0013 | 1,33 Mo |
| 390×844 | 131 ms | 212 ms | 524 ms | 0 | 1,33 Mo |

Les deux réponses sont HTTP 200, le CTA participant est présent et l'overflow
horizontal est nul. Ces chiffres décrivent le poste local sans simulation réseau ; ils
ne sont pas présentés comme un score Lighthouse hébergé. Preuve : `performance.json`.

## Captures

- `implementations/participant-390x844.png` ;
- `implementations/participant-1440x900.png` ;
- `implementations/participant-access-mobile-390x844.png` ;
- `implementations/participant-access-desktop-1440x900.png`.

## Verdict

QA fonctionnelle et visuelle validée pour les capacités implémentées. Le paiement en
ligne demeure volontairement partiel et n'est jamais présenté comme opérationnel.
