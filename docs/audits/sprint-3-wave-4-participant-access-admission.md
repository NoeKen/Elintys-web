# Sprint 3 / Vague 4 — accès et admission participant

## Résumé

La Vague 4 ferme la boucle participant pour l'inscription simple et les billets
gratuits. Elle introduit une couche transverse d'opérations critiques dans le monolithe
NestJS, des contraintes MongoDB et une UX participant unifiée. La production n'a jamais
été touchée.

Verdict : **VALIDÉ pour les capacités implémentées**, avec le paiement payant classé
PARTIEL et volontairement désactivé côté participant.

## Architecture

Le socle `shared/consistency` fournit :

- `TransactionService` pour les unités atomiques MongoDB ;
- `IdempotencyService` avec fingerprint, lease et replay ;
- états `PROCESSING / SUCCEEDED / FAILED` ;
- journalisation structurée sans clé brute ni secret ;
- erreurs métier stables.

Les invariants restent possédés par leurs domaines : unicité participant/événement,
stock billet, consommation invitation et finalisation Stripe.

## Implémentation Claude

Claude Code a réalisé l'audit initial, le socle transverse, les services backend et la
première connexion Web. Son exécution a été interrompue par la mise en veille du poste ;
Codex a repris le diff local sans demander de transfert manuel.

## Review Codex et corrections

- durcissement du script de migration (`key`, capacités transactionnelles, conflits,
  documents invalides et vérification exacte des index) ;
- clés d'idempotence stables lors des doubles clics Web ;
- désactivation du paiement payant non sûr dans l'UI et côté API, sans faux checkout ;
- séparation visuelle accès/admission ;
- espace unique inscriptions/invitations/billets ;
- correction P2 d'un crash lorsque des inscriptions historiques contiennent
  `eventId: null` après suppression de l'événement ;
- déduplication défensive de la readiness du wizard ;
- mise à jour du contrat E2E Vague 2 devenu obsolète.

## Capacités

| Capacité | Statut | Preuve |
|---|---|---|
| Accès ouvert | IMPLÉMENTÉ | page publique + E2E |
| Code d'accès | IMPLÉMENTÉ | validation serveur et E2E existants |
| Domaine courriel | IMPLÉMENTÉ | identité serveur et E2E Axe |
| Approbation manuelle | IMPLÉMENTÉ | états existants réutilisés |
| Invitation sécurisée | IMPLÉMENTÉ | token hashé, acceptation atomique |
| Inscription simple | IMPLÉMENTÉ | endpoint, index unique, E2E UI |
| Billet gratuit | IMPLÉMENTÉ | transaction, stock, idempotence, E2E UI |
| Billet payant | PARTIEL | finalisation sécurisée ; UI et création de session API désactivées par défaut |
| Espace participant | IMPLÉMENTÉ | route `/tableau-de-bord/participation` |
| Scanner/payouts/remboursements complets | HORS PÉRIMÈTRE | aucune simulation |

## Backend

Endpoints principaux ajoutés/modifiés :

- `POST /event-registrations` ;
- `DELETE /event-registrations/:id` ;
- `GET /event-registrations/me` ;
- `GET /event-registrations/events/:eventId` ;
- `POST /tickets/purchase` avec `Idempotency-Key` ;
- `GET /tickets/my` ;
- finalisation Stripe et invitations renforcées.

La pagination est serveur, les ObjectId sont validés et l'identité provient de
`user.sub`. Aucun `organizerId`, email participant ou token interne n'est accepté comme
autorité client.

## Base de données dev

Sauvegarde vérifiée :
`Elintys-api/backups/critical-operations-wave4/elintys-dev-2026-08-18T11-20-41-919Z`
(16 collections, 320 documents).

Six index non destructifs ont été appliqués et revérifiés idempotents sur
`elintys-dev` : `event_reg_by_event`, `event_reg_by_participant`,
`event_reg_unique_participant`, `idempotent_ops_unique`, `idempotent_ops_ttl` et
`stripe_finalization_unique_pi`. Aucun doublon, document invalide ou conflit détecté.

## Frontend et UI/UX

La page publique explique les conditions en langage participant, puis affiche seulement
les admissions réelles. Les CTA d'authentification conservent une URL interne nettoyée.
« Ma participation » regroupe les trois domaines sans dupliquer le dashboard. Le design
réutilise les tokens, composants, typographies et surfaces Elintys.

## Sécurité

- contraintes DB et transactions contre les doubles soumissions ;
- fingerprint empêchant la réutilisation d'une clé avec un autre payload ;
- aucun `tokenHash`, `tokenPrefix`, clé Stripe ou clé d'idempotence brute exposé ;
- ownership et auth appliqués côté serveur ;
- scan sécurité du diff Web : 0 finding reportable ;
- P0 = 0, P1 = 0, P2 = 0 après correction, P3 = 0 ouvert dans le périmètre.

Limites de preuve : la vérification TAC n'était pas disponible (connecteur non connecté)
et la configuration cookie/CORS multi-sous-domaines hébergée n'a pas été rejouée dans ce
run local.

## Accessibilité, responsive et scroll

Axe critical/serious = 0 sur les états Vague 4 et Access V2 testés. Viewports : 320×720,
375×812, 390×844, 768×1024, 1024×768, 1440×900, 1538×1100. Aucun overflow horizontal
et scroll natif conservé.

## Performance

Les requêtes de l'espace participant sont parallèles via TanStack Query, sans chargement
sur la page publique. Les sous-domaines ne sont pas préchargés dans le premier rendu et
les listes restent paginées. Les métriques locales production sont consignées dans
`docs/design-qa/sprint-3-wave-4/performance.json`.

Sur le build production local, les médianes Chromium sont : desktop 1440×900 — TTFB
157 ms, FCP 320 ms, LCP 412 ms, CLS 0,0013 ; mobile 390×844 — TTFB 131 ms,
FCP 212 ms, LCP 524 ms, CLS 0. Les deux profils répondent en HTTP 200, affichent le
CTA participant et ne présentent aucun overflow horizontal. Mesure sans throttling,
donc non assimilable à un audit Lighthouse hébergé.

## Tests et gates

| Dépôt | Gate | Résultat |
|---|---|---|
| API | unitaires | 716/716 |
| API | E2E | 29/29 |
| API | couverture | lignes 74,21 %, branches 66,64 %, fonctions 67,12 % ; seuils verts |
| Web | unitaires | 233/233 |
| Web | couverture | lignes 46,00 %, branches 42,64 %, fonctions 37,50 % ; gate verte |
| Web | E2E Vague 4 | 13/13 |
| Web | E2E fonctionnels complets | 149 réussis, 2 skips visuels conditionnels, 0 échec |
| API + Web | lint / typecheck / build | verts |
| Tous | `git diff --check` | vert |

Les deux skips sont les captures visuelles optionnelles du wizard, activées uniquement
avec `WIZARD_QA_CAPTURE=1` ; aucun scénario fonctionnel n'est ignoré.

## Risques résiduels

- le checkout payant reste fermé par défaut via `PAID_CHECKOUT_ENABLED` et attend une
  réservation de stock pré-paiement/outbox complète avant toute activation ;
- l'envoi email post-paiement est best-effort ;
- les inscriptions historiques orphelines restent visibles sous un fallback honnête,
  sans crash, en attendant une politique de rétention métier.

## Commits

- API `0f5dd85` — `feat(consistency): add critical operation guarantees` ;
- API `8d32f4d` — `feat(participant): secure registration and admission` ;
- Web `b0a5613` — `feat(participant): build access and admission journey` ;
- Web `743f9b1` — `test(participant): cover access admission and responsive flows` ;
- rapport et preuves QA : commit `docs(audit): document sprint 3 wave 4` portant ce document.

Aucun force-push. Les deux branches `dev` sont poussées uniquement après le dernier
`git diff --check` et la vérification d'un worktree propre.

## Note globale

**9,2 / 10** — fondations de consistance solides, parcours gratuit complet et UX validée ;
le paiement payant reste consciemment incomplet plutôt que simulé.
