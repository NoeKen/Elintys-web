# Design QA — création d’événement ELINTYS

## Cibles et preuves

- Source visuelle principale : `/Users/admin/Downloads/stitch_elintys_cinematic_onboarding_experience-3.zip`
  - `elintys_cr_er_informations/screen.png`
  - `elintys_cr_er_date_et_lieu/screen.png`
  - `elintys_cr_er_mon_lieu/screen.png`
  - `elintys_cr_er_recherche_lieu/screen.png`
  - `elintys_cr_er_prestataires/screen.png`
  - `elintys_cr_er_identit_et_acc_s/screen.png`
  - `elintys_cr_er_r_capitulatif/screen.png`
  - `elintys_dashboard_brouillons/screen.png`
- Système visuel : `/Users/admin/Downloads/DESIGN-2.md`, `/Users/admin/Desktop/Projects/Elintys/docs/design-principles.md` et les plans design de `Elintys-web/docs`.
- Capture source normalisée : `docs/design-qa/reference-information.png`.
- Capture d’implémentation principale : `docs/design-qa/implementation-information-pass2.png`.
- Comparaison plein écran dans une même image : `docs/design-qa/comparison-information-pass2.png`.
- Comparaison ciblée typographie/formulaire : `docs/design-qa/comparison-information-focus.png`.
- États supplémentaires vérifiés :
  - `docs/design-qa/implementation-schedule-later.png`
  - `docs/design-qa/implementation-identity-upload.png`
  - `docs/design-qa/implementation-review.png`
  - `docs/design-qa/implementation-dashboard.png`
  - `docs/design-qa/implementation-mobile-identity.png`

## Normalisation

- État principal : étape 1 vide, authentifiée, thème clair.
- Viewport desktop : `1538 × 1100` CSS px, `deviceScaleFactor: 1`.
- Source : `1538 × 1600` px. Implémentation : `1538 × 1186` px.
- La comparaison plein écran utilise les `1186` premiers pixels de la source et de l’implémentation, puis réduit chaque côté à `769 × 593` px sans changer le ratio.
- La comparaison ciblée utilise des régions source et implémentation de `954 × 760` px.
- Viewport mobile : `390 × 844` CSS px, capture full-page `390 × 2468` px. Aucun débordement horizontal (`scrollWidth = 390`).
- Les références récapitulatif et dashboard ont été fournies dans des largeurs d’export différentes (`1131` et `1234` px). Elles ont servi de cible de composition et de langage visuel ; la comparaison pixel à pixel principale reste l’écran Informations normalisé.

## Comparaison visuelle

### Plein écran

- La structure est fidèle : en-tête persistant, progression centrale, grand panneau blanc éditorial, colonne de conseils et aperçu, navigation basse.
- Les proportions du panneau principal, la séparation de l’aside, les surfaces translucides et les ombres diffuses suivent la référence.
- L’implémentation affiche davantage de contenu au-dessus de la ligne de flottaison. Cette densité est attendue : le cahier des charges impose 10 types d’événements, alors que la capture Stitch en montre 6.
- Le dashboard conserve volontairement l’architecture authentifiée existante avec sidebar. Le contenu brouillon reprend la progression, la dernière sauvegarde, la prochaine étape et l’action de reprise de Stitch.

### Région ciblée

- Typographie : DM Serif Display est utilisée pour les titres et Inter pour l’interface. Le titre principal suit le token `48/56`, plus affirmé que l’ancien export Stitch mais conforme à DESIGN-2.
- Espacement : grille, marges, rayons `24px`, inputs et boutons `16px`, rythmes verticaux et zones tactiles sont cohérents.
- Couleurs : les tokens `#F9F9F6`, `#002E38`, `#1A4550`, `#2F7A7E`, `#E8965A`, `#C99A3E` et `#7C8F6E` sont appliqués. Le contraste calculé du teal sur le fond principal est de `4.73:1`.
- Images : les quatre images prestataires proviennent des assets source Stitch et sont rendues via `next/image`. Aucun faux visuel, emoji ou SVG artisanal n’a été ajouté.
- Copie : le texte métier français demandé est centralisé dans `messages/fr.json`; `messages/en.json` conserve la parité structurelle.

## Vérification fonctionnelle navigateur

- Page d’accueil et route de création chargées sans overlay d’erreur.
- Validation du titre vide vérifiée.
- Création réelle du draft via `POST /events`, puis navigation vers l’URL de configuration avec le même `eventId`.
- Branche « Je choisirai plus tard » vérifiée, sans formulaire de lieu vide.
- Sélection d’un besoin prestataire, affichage des trois modes et skip persistant vérifiés.
- Visibilité privée et règles conditionnelles (lien, code, domaine, validation) vérifiées.
- Upload JPG vérifié avec aperçu `blob:` immédiat, états de transfert, retry et synchronisation du média persisté.
- Récapitulatif, retour par « Modifier », « Enregistrer et quitter », dashboard et reprise à l’étape persistée vérifiés.
- État backend vérifié : `venueMode=later`, visibilité privée, règles d’accès, besoin prestataire et progression `completed/skipped/lastSavedAt` persistés.
- Console : aucune erreur d’exécution.
- Accessibilité axe WCAG A/AA après corrections : `0 violation`; le contraste sur les fonds translucides reste marqué « incomplete » par axe car le fond est un gradient, mais les ratios des tokens de texte ont été contrôlés.

## Historique des itérations P0/P1/P2

### Passage 1

- [P1][Accessibilité] La barre de progression avait `role="progressbar"` tout en contenant des boutons, créant des contrôles interactifs imbriqués.
  - Correction : remplacement par une navigation nommée avec boutons d’étapes et `aria-current`.
- [P2][Couleur] Trois chips du récapitulatif utilisaient le teal sur un fond teal translucide avec un ratio mesuré par axe de `4.0:1`.
  - Correction : texte passé au pétrole sur le même fond translucide.
- [P1][Accessibilité mobile] Le bouton retour n’avait plus de nom accessible lorsque son texte était masqué sur mobile.
  - Correction : ajout de `aria-label`.
- [P2][Navigation] Une étape prestataire sautée n’était pas ré-ouvrable depuis la progression.
  - Correction : union des étapes complétées et sautées pour les étapes visitables.

### Passage 2

- Preuve post-correction : `docs/design-qa/implementation-information-pass2.png`, navigation accessible observée dans le snapshot et audit axe final à `0 violation`.
- Aucune différence P0/P1/P2 visuelle ou fonctionnelle encore actionnable.

## Écarts acceptés

- Les 10 types d’événements imposés produisent une grille plus dense que la capture Stitch à 6 choix.
- Le dashboard réutilise la sidebar et le shell authentifié ELINTYS existants, conformément à la consigne de ne pas reconstruire le projet.
- Les pastilles flottantes visibles aux coins de certaines captures sont les outils de développement Next/TanStack du serveur local ; elles ne sont pas incluses dans le build de production.

## Suivi P3

- [Terminé] La couverture et la galerie utilisent les endpoints multipart Event, l’abstraction Cloudinary backend et le format `MediaImage`.
- [Terminé] Le message de gap a été retiré. L’étape 5 est désormais structurée comme identité publique : couverture, galerie, description, accès.
- Une future passe peut harmoniser les libellés historiques du dashboard hors wizard avec le même runtime i18n.

final result: passed
