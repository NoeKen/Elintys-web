# ELINTYS — Sprint 3 / Vague corrective D

## UX Truthfulness & Product Consistency — rapport final

- Date de validation locale : 8 septembre 2026
- Repository modifié : `Elintys-web`
- Branche : `feat/s3-wave-d-ux-product-consistency`
- Repository API : inchangé

## 1. Git baseline

- PR Wave C Web `#104` fusionnée le 8 septembre 2026.
- Base Web auditée : `origin/dev` à `72253f1192bbcaa579c713fd52a27ce626523bff`.
- La branche Wave D a été créée directement depuis cette base.
- API : HEAD et `origin/dev` identiques à `453bd1f1433abc7fde833c2fe8bdc9e33709eb10`, sans diff local.
- Aucun reset destructif, aucune migration, aucun changement de données, aucun secret et aucun déploiement production.

## 2. Scope

La vague couvre D-01 à D-13 : vérité des états, loading/empty/error/retry, états d’accès, feedback de mutation, placeholders, CTA, terminologie, responsive, accessibilité, cohérence visuelle, warnings React/ESLint et seconde review indépendante. Aucune fonctionnalité Search, Reviews ou Payment Readiness n’a été construite.

## 3. UX inventory

| Surface | Problème observé | Sévérité | Correction | Preuve |
|---|---|---:|---|---|
| Notifications | erreur assimilable à une liste vide, aucun retry | P2 | loading, empty, error, retry et mutation pending/error distincts | unit + E2E |
| Wizard prestataires | erreur catalogue assimilée à zéro résultat | P2 | loading/error/retry séparés du vrai empty | unit + wizard E2E |
| Workspace événement | 403/404/erreur générique peu différenciés ; contenu encore visible sous erreur | P2 | état loading exclusif, 403, 404, erreur récupérable et retry exclusifs | unit + workspace E2E |
| Recherche publique | placeholder donnant une impression de recherche active | P2 | page explicitement indisponible, retour vers catalogue réel | Wave D E2E |
| Analytiques organisateur | skeleton permanent | P2 | état « Fonctionnalité à venir » explicite | Wave D E2E |
| Billetterie organisateur consolidée | skeleton permanent | P2 | limite produit explicite et lien vers les workspaces réels | Wave D E2E |
| Footer public | newsletter et réseaux génériques non branchés | P2 | contrôles retirés, absence de collecte annoncée | Wave D E2E |
| Auth | liens `href="#"` et support inexistant | P2 | liens réels ou conseil honnête | recherche statique |
| Cards | bordures décoratives généralisées | P2 | surfaces, espacement et ombres diffuses | CSS + E2E calculé |
| Hooks/Auth | 9 warnings effects/watch historiques | P3 | primitives React/RHF appropriées | lint + unit |

## 4. Design-system audit

Les primitives `Card`, `EventCard`, `OrganizerEventCard`, `VendorCard`, `VenueCard`, ainsi que les familles CSS `premium-card`, `glass-card`, `ticket-card` et les cards Event publiques ont été inspectées. Aucun composant parallèle n’a été créé. Les tokens pétrole, teal, terracotta, or, sauge, surfaces chaudes, DM Serif Display et Inter restent la source visuelle.

## 5. Card border audit

- 9 familles/primitives canoniques auditées.
- 48 fichiers consommateurs corrigés.
- 154 occurrences de classes/propriétés de bordure décorative supprimées dans le diff TSX/CSS.
- Bordures visibles après correction : 0 sur les sélecteurs canoniques couverts par les E2E publics et dashboard.
- Exceptions conservées : champs, textarea, select, radios/checkboxes, focus visible, séparateurs de shell/navigation, badges, menus contextuels, zones drag-and-drop et affordances de validation.

La suppression des contours a été compensée par les surfaces existantes, le rayon, l’espacement et des ombres diffuses déjà présentes dans le design system.

## 6. Loading

Le workspace possède désormais un état de chargement exclusif et annoncé. Les notifications distinguent chargement initial et rechargement. Le catalogue prestataire du wizard n’affiche plus un faux zéro résultat pendant la requête. Les deux anciens skeletons permanents ont été remplacés par des états indisponibles honnêtes.

## 7. Empty

Deux faux empty states ont été supprimés : notifications et catalogue prestataire. Les vrais empty states existants (billets, invitations, favoris, demandes, réservations, profils et catalogues) ont été conservés, avec leurs actions uniquement lorsqu’elles correspondent à une route ou mutation réelle.

## 8. Errors

Les erreurs structurelles touchées sont affichées inline, avec `role="alert"` et sans faux succès. Le workspace ne rend plus ses modules lorsque son contexte Event n’a pas pu être chargé. Les erreurs de publication et de marquage des notifications restent visibles.

## 9. Retry/degraded

Trois surfaces sans retry adéquat avant la vague disposent maintenant d’un réessai réel : notifications, catalogue prestataire et workspace Event. Le comportement Wave A de `/auth/me` reste intact : 401 signifie anonyme ; 429/5xx/réseau restent dégradés et réessayables sans boucle automatique.

## 10. Forbidden/not-found

Le workspace traduit explicitement un `403` en refus d’accès et un `404` en événement introuvable. Les ressources publiques volontairement non exposables conservent le contrat serveur 404 anti-divulgation. Les tests complets ownership/IDOR sont verts.

## 11. Unavailable/placeholders

Trois surfaces accessibles ont été rendues honnêtes : recherche avancée, analytiques organisateur et billetterie organisateur consolidée. La primitive `PlaceholderPage` annonce désormais par défaut « Fonctionnalité à venir » au lieu de laisser croire à une fonctionnalité prête.

## 12. Mutations

La mutation « tout marquer lu » bloque la double soumission, affiche son pending et son erreur. La publication du workspace garde l’autorité readiness serveur, affiche pending/error et explique l’indisponibilité de readiness. Les mutations existantes favoris, médias, invitations, ticketing, demandes, réservations et wizard ont été rejouées dans la suite E2E complète.

## 13. CTA audit

17 affordances trompeuses ont été corrigées : neuf ancres auth sans destination, trois champs Search non branchés, un CTA de hero redirigé vers le catalogue réel, trois liens sociaux génériques et un flux newsletter sans backend. Après correction : zéro `href="#"` dans `src`, aucune zone Search factice dans les trois catalogues et aucune adresse newsletter collectée.

## 14. Terminology/i18n

Les concepts Event Access V2 restent séparés : découvrabilité, politique d’accès et admission. Les nouveaux libellés du wizard et du workspace sont présents en FR/EN dans leurs mécanismes i18n existants. Les pages publiques françaises déjà statiques n’ont pas été transformées en architecture i18n parallèle.

## 15. Responsive

Viewports validés : 320×720, 375×812, 390×844, 768×1024, 1024×768, 1440×900 et 1538×1100. Aucun overflow horizontal bloquant. Le panneau notifications est maintenant borné à la largeur disponible. Les CTA critiques restent à 44 px minimum.

## 16. Accessibility

- Axe critical : 0.
- Axe serious : 0.
- `aria-expanded` et `aria-controls` ajoutés au bouton notifications.
- feedback de liste via `aria-live` et `aria-busy`.
- erreurs structurelles annoncées avec `role="alert"`.
- focus rings fonctionnels conservés malgré la suppression des bordures décoratives.
- navigation clavier, Escape, restauration du focus, zoom et cibles tactiles couverts par les régressions historiques.

## 17. Native scroll

Le scroll document natif public/auth et le scroller dashboard intentionnel restent inchangés. Les tests wheel/clavier/touch/body-lock sont verts. Aucun Lenis, `preventDefault` global, `touch-action:none` global ou masquage global de scrollbar n’a été introduit.

## 18. Mobile navigation

Les parcours organizer, vendor, venue manager et multi-role restent accessibles. La barre mobile, le panneau « Plus », le burger, Escape et la restitution du focus passent la suite Wave A/B. Aucun redesign structurel n’a été introduit.

## 19. Historical warnings

Warnings ESLint reproduits avant correction : 9. Warnings après correction : 0.

Corrections : `useWatch` pour React Hook Form, initialisation paresseuse vérifiée du thème, `useSyncExternalStore` pour media queries, suppression d’effets de rattrapage non nécessaires dans l’auth, la navbar et la vérification courriel. Aucun nouvel `eslint-disable`.

## 20. Security non-regression

L’API n’a pas été modifiée. Guards, ownership, rôles, projections publiques, Access V2, validation et rate limiting n’ont pas été contournés. La suite complète confirme IDOR, accès anonyme, ObjectId invalide, invitations, médias, scan concurrent, réservations et demandes cross-user. Aucun secret détecté dans le diff.

## 21. Tests

| Gate | Résultat |
|---|---|
| Web lint | 0 erreur, 0 warning |
| Web typecheck | vert |
| Web production build | vert, 57 pages générées/analysées |
| Web unit + coverage | 65 fichiers, 396 tests passés |
| Web couverture | statements 53.07 %, branches 47.74 %, functions 47.24 %, lines 54.57 % |
| E2E fonctionnel complet | 244 passés, 2 skips historiques, 0 échec |
| E2E final Wave D + workspace | 17/17 passés |
| E2E final Wave D avec console/réseau | 10/10 passés |
| Axe | 0 critical, 0 serious |
| Console inattendue | 0 |
| Réponse réseau inattendue >=500 | 0 |
| Web npm audit | 0 vulnérabilité |
| API lint/typecheck/build | verts, API inchangée |
| API npm audit | 0 vulnérabilité |
| git diff --check | vert |

Les deux skips appartiennent à la suite de capture historique et ne sont ni nouveaux ni utilisés pour contourner une assertion Wave D. Aucun `test.only` ou `describe.only` n’a été ajouté.

## 22. Visual QA

Les captures minimales sont conservées dans `docs/design-qa/sprint-3-wave-d/implementations/`. Les rendus desktop/mobile de la recherche honnête, du catalogue Event et du catalogue prestataire ont été inspectés après génération. Les anciennes captures générées automatiquement par les régressions ont été restaurées pour éviter un diff documentaire massif.

## 23. Before/after metrics

| Mesure | Avant | Après |
|---|---:|---:|
| Références de bordure décorative supprimées | 154 | 0 dans les cards canoniques E2E |
| Fichiers consommateurs de cards corrigés | 48 | 48 |
| Affordances trompeuses | 17 | 0 sur le périmètre touché |
| Faux empty states | 2 | 0 |
| Surfaces sans retry touchées | 3 | 0 |
| Placeholders trompeurs | 3 | 0 |
| Défauts responsive corrigés | 1 | 0 restant |
| Défauts a11y locaux corrigés | 4 groupes | 0 bloquant restant |
| Warnings ESLint | 9 | 0 |

## 24. Codex independent findings

Après l’implémentation, la seconde lecture du diff a identifié un P2 : l’alerte d’échec du workspace était ajoutée au shell sans empêcher le rendu des enfants. Cela pouvait présenter simultanément une erreur de contexte et des modules partiels. Aucun P0/P1 n’a été trouvé.

## 25. Corrections after review

Le chargement et l’erreur du workspace sont désormais des branches de rendu exclusives. L’erreur conserve un retry réel et ne laisse plus apparaître navigation, CTA de publication ou données enfants ambiguës. Les tests ciblés, workspace et Wave D ont été rejoués après cette correction.

## 26. P0/P1/P2/P3

| Niveau | Ouverts D | Corrigés D |
|---|---:|---:|
| P0 | 0 | 0 |
| P1 | 0 | 0 |
| P2 | 0 | 10 |
| P3 | 0 | 9 warnings regroupés |

P0 = 0, P1 = 0, P2 D bloquant = 0.

## 27. Out-of-scope register

| Finding | Severity | Location | Candidate wave | Reason deferred |
|---|---:|---|---|---|
| Moteur de recherche avancée absent | P3 | `/evenements/recherche` | Future Product — Search | D rend l’absence honnête, sans construire Search |
| UI Reviews complète absente | P3 | surfaces prestataire | Future Product — Reviews | backend existant mais parcours produit non défini |
| Canonicalisation analytiques/billetterie organisateur | P3 | `/organisateur/*` | Dedicated Architecture | destination canonique encore ambiguë |
| Readiness et transactions PayPal réelles | P2 hors D | checkout/payments | Payment Readiness | explicitement exclu de D |
| Contenu juridique final | P2 hors D | conditions/confidentialité | Post-MVP / Legal | nécessite validation juridique ; placeholders restent annoncés honnêtement |

## 28. Remaining risks

Les pages juridiques et plusieurs futures surfaces produit restent volontairement limitées. Le contrôle « zéro bordure » est prouvé sur les familles canoniques et les écrans représentatifs, pas par une interdiction globale des propriétés CSS : les exceptions fonctionnelles restent nécessaires. Les changements d’état réseau rares doivent continuer à être surveillés en preview/dev.

## 29. Commits

- `a900d36` — `refactor(ui): remove decorative card borderlines`
- `8127ade` — `fix(ux): distinguish states and remove misleading actions`
- `61d9152` — `chore(ui): resolve scoped React warnings`
- `09c6e54` — `test(ux): cover Wave D truthfulness and responsive states`
- documentation : commit `docs(audit): document Sprint 3 Wave D` portant le présent rapport et les preuves visuelles.

Aucun commit API et aucune PR API vide.

## 30. PR readiness

Tous les gates de la Wave D sont satisfaits localement : P0/P1/P2 D à zéro, cards canoniques sans contour visible, Axe bloquant à zéro, builds/tests/audits verts, responsive et scroll validés, console/réseau sans erreur inattendue, aucun scope creep Search/Reviews/Payment. La branche Web est prête pour une PR vers `dev`, sans merge automatique.

Verdict : **VALIDÉE — prête pour PR vers `dev`.**
