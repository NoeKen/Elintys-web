# Sprint 3 / Vague 5 — Paid Ticketing Core — validation finale

**Date :** 2026-08-29

**Branche :** `dev`

**Implémentation principale :** Claude Code, Opus 5

**Review indépendante, corrections et QA :** Codex
**Verdict :** **SPRINT 3 / VAGUE 5 — VALIDÉE**

> Paid Ticketing Core validé. Stripe participant reste volontairement désactivé.

## 1. État initial

Les deux dépôts étaient sur `dev`, sans divergence avec `origin/dev` :

- API : `8d32f4d9ab706c472f3c19318ad1a275a8248f43` ;
- Web : `86dbc23aca976a713593cfc6342a2e2bfcdd31fe`.

Claude n'avait ni committé ni poussé. Le Web était propre. L'API contenait le diff local de l'implémentation Vague 5. La base ciblée était exclusivement `elintys-dev`.

## 2. Résumé de l'implémentation Claude

Claude a ajouté au monolithe modulaire :

- `TicketOrder`, commande et état de paiement ;
- `TicketHold`, réservation temporaire de capacité ;
- le compteur `reserved` sur `TicketType` ;
- le lien optionnel `order` sur `TicketPurchase` ;
- une machine d'état explicite Order/Hold ;
- un service transactionnel de création, synchronisation, annulation et expiration ;
- un contrat `PaymentProvider`, un provider déterministe de test et un adaptateur Stripe isolé ;
- les DTO, contrôleurs, gardes, index et migrations additives ;
- les tests unitaires, E2E, migrations et concurrence.

Le checkout Stripe participant n'a pas été activé.

## 3. Review architecture Codex

L'architecture retenue reste un modular monolith : le domaine Ticketing possède commande, réservation, inventaire et admission ; `shared/consistency` reste une infrastructure technique inchangée ; le provider de paiement ne dépend pas du domaine et les objets Stripe ne contaminent pas les contrats métier.

`TicketOrder` et `TicketPurchase` sont correctement distincts. Le premier représente l'intention commerciale et son règlement ; le second reste l'admission émise, avec QR et statut de scan. Cette séparation permet plusieurs billets par commande et prépare une extraction future sans créer prématurément de microservices.

## 4. Findings

| ID | Sévérité | Défaut confirmé | État |
|---|---:|---|---|
| W5-CX-01 | P2 | Les anciens chemins de modification, suppression, achat gratuit et finalisation Stripe ignoraient `reserved`, permettant de contourner le nouvel invariant global de stock. | Corrigé et testé |
| W5-CX-02 | P2 | Une annulation locale déjà committée pouvait être retournée comme erreur si l'annulation externe échouait ensuite. | Corrigé et testé |
| W5-CX-03 | P2 | Les routes Web succès/annulation/checkout affichaient un paiement fictivement confirmé ou annulé alors que Stripe participant est fermé ; la référence `session_id` brute était rendue. | Corrigé et testé |
| W5-CX-04 | P2 | Le dry-run partagé construisait une clé `$group` Mongo invalide pour les index à champ pointé, par exemple `payment.reference`. | Corrigé et testé |
| W5-CX-05 | P3 | L'adaptateur Stripe journalisait le message SDK brut lors d'une expiration de session ignorée. | Corrigé et testé |

Après corrections : **P0 = 0, P1 = 0, P2 = 0, P3 = 0 ouverts**.

Le scan de sécurité du diff a couvert 38 fichiers source assimilés. Deux candidats ont été validés comme défauts d'ingénierie puis corrigés ; ils n'étaient pas exploitables dans la configuration livrée, qui reste privilégiée et désactivée. Aucun finding sécurité reportable ne reste ouvert. Le statut de l'avis TAC externe n'a pas pu être obtenu ; la review locale complète et les tests adversariaux ont donc constitué la preuve de validation.

## 5. Corrections Codex

- Tous les chemins historiques calculent désormais la capacité avec `sold + reserved`.
- La modification de quantité et la suppression d'un type utilisent un filtre conditionnel atomique.
- L'achat gratuit et le chemin Stripe historique incluent `reserved` dans leur `$expr`.
- L'échec du provider après une annulation locale est capturé et journalisé sans transformer un succès local en erreur client.
- Les logs Stripe utilisent un code stable sans message fournisseur brut.
- Le générateur de groupe de migration utilise des alias sûrs (`field0`, etc.) pour les chemins Mongo pointés.
- Les trois routes publiques de paiement fermé présentent désormais un état honnête, sans faux succès, faux débit ou référence de session.
- Des tests de non-régression API, Web et E2E ont été ajoutés.

## 6. Modèle Order

`TicketOrder` contient l'acheteur issu de `user.sub`, l'événement, les lignes avec prix serveur figé en cents, la devise, le total entier, l'état, une vue de paiement, l'expiration, les horodatages terminaux, les admissions et les marqueurs de règlement tardif. Le client ne fournit ni `buyerId`, ni prix faisant autorité, ni statut de paiement.

La référence fournisseur reste interne. La vue participant n'expose ni référence opaque, ni clé d'idempotence brute, ni secret provider.

## 7. Modèle Hold

Chaque ligne possède un `TicketHold` avec `orderId`, `eventId`, `ticketTypeId`, quantité, expiration et état. Il n'existe aucun TTL destructif : l'expiration doit restituer `reserved` dans la même transaction.

La contrainte unique commande/ligne empêche une double réservation logique.

## 8. Machine d'état

Commande :

```text
PENDING_PAYMENT -> PAID | FAILED | EXPIRED | CANCELLED
PAID | FAILED | EXPIRED | CANCELLED -> aucun état
```

Hold :

```text
ACTIVE -> CONSUMED | RELEASED | EXPIRED
CONSUMED | RELEASED | EXPIRED -> aucun état
```

Les tables d'état documentent l'intention ; les filtres conditionnels Mongo dans les transactions portent la garantie effective.

## 9. Invariants stock

Les invariants vérifiés sur tous les chemins sont :

```text
sold >= 0
reserved >= 0
sold + reserved <= quantity
```

Réservation : `sold + reserved + demande <= quantity`, puis `reserved += demande`.

Consommation : `reserved >= demande`, puis `reserved -= demande` et `sold += demande`.
Libération : `reserved >= demande`, puis `reserved -= demande`.

Les documents antérieurs restent sûrs via `$ifNull(reserved, 0)`.

## 10. Atomicité

Création de commande, réservation des lignes et création des holds partagent une session Mongo transactionnelle. Finalisation, émission des admissions et passage `reserved -> sold` partagent une autre transaction. Libération et expiration ferment d'abord conditionnellement la commande, puis ferment les holds et restaurent le stock dans la même transaction.

Les appels réseau provider restent hors transaction. Aucun verrou ou mutex mémoire ne porte un invariant.

## 11. Idempotence

Le socle Vague 4 est réutilisé : lease durable, empreinte du payload, états `PROCESSING`/`COMPLETED`/`FAILED` et replay multi-instance.

- même clé + même payload : même résultat, un effet ;
- même clé + payload différent : `409` ;
- deux clés : deux intentions indépendantes si la capacité existe ;
- callback ou synchronisation dupliqué : une finalisation ;
- reprise après redémarrage : garantie persistée en base, pas en mémoire.

La clé brute n'est ni stockée ni journalisée ; seul son hash SHA-256 peut être conservé.

## 12. Expiration

L'expiration principale est paresseuse avant une nouvelle réservation des types concernés. Un endpoint de maintenance administrateur permet un balayage borné. Chaque commande est expirée séparément avec les filtres `PENDING_PAYMENT` et `expiresAt <= now`.

Le TTL a été écarté à juste titre : il ne pourrait pas compenser `reserved`. La durée est configurée par `PAID_TICKET_HOLD_MINUTES`, bornée à 1–120 minutes, défaut 15.

## 13. Late-payment policy

Un succès fournisseur reçu après `EXPIRED`, `CANCELLED` ou `FAILED` ne ressuscite ni commande, ni stock, ni admission. La commande est marquée `requiresManualReview`, un événement `lateSettlement` idempotent est conservé et l'API répond `409`.

La décision commerciale de remboursement, réémission conditionnelle ou traitement opérateur reste à prendre avant l'ouverture Stripe. Cette absence ne bloque pas la Vague 5 car la politique technique actuelle échoue de manière sûre et Stripe reste fermé.

## 14. PaymentProvider

Le contrat est minimal : créer, obtenir le statut et annuler un paiement. Les statuts sont transport-agnostic. Le domaine ne dépend pas de types Stripe.

Le provider déterministe sert aux tests et à la validation de l'orchestration. L'adaptateur Stripe reste isolé et inactif pour le parcours participant.

## 15. Sécurité TestPaymentProvider

Le provider de test exige cumulativement un environnement non production et `TEST_PAYMENT_PROVIDER_ENABLED=true`. Le registre refuse sa sélection en production. Aucun endpoint debug, header caché, query parameter ou payload client ne permet de choisir le provider ou de marquer une commande payée.

Le serveur interroge lui-même le provider. Les tests de configuration couvrent les combinaisons interdites.

## 16. État Stripe

`PAID_CHECKOUT_ENABLED=false` reste la valeur livrée. Une requête API directe est refusée avant toute création de checkout participant. Le bouton payant reste désactivé et les anciennes routes publiques affichent « L'achat en ligne n'est pas encore ouvert ».

**Stripe réel n'a pas été testé, activé ni déclaré opérationnel.**

## 17. Migrations et indexes

La migration est additive, idempotente et limitée à `elintys-dev`. Avant application, Claude a produit un backup BSON avec checksums dans `Elintys-api/backups/paid-ticketing-wave5/elintys-dev-2026-08-29T04-05-32-052Z` : 405 documents et 19 collections.

L'application sur dev avait été explicitement autorisée dans le mandat transverse, après backup et dry-run. Aucun document ni index existant n'a été supprimé. Les nouveaux index portent l'unicité référence fournisseur, commande/ligne, les listes acheteur/événement et les recherches d'expiration.

Le dry-run final, après correction du moteur partagé, confirme : replica set et transactions disponibles, 7/7 index présents, 0 index à créer, 0 conflit, 0 doublon bloquant, 0 document invalide et 0 candidat de backfill. Aucune écriture n'a été effectuée pendant ce dernier dry-run.

## 18. Tests de concurrence

Le harness indépendant a exécuté **10/10 scénarios** contre `elintys-dev` : dernier stock concurrent, double clic même clé, même clé/payload différent, clés indépendantes, expiration contre paiement, callbacks succès dupliqués, rollback de finalisation, release répété, replay après redémarrage et simulation multi-instance.

Tous les états finaux respectent les invariants et aucun billet ou stock fantôme n'a été observé.

## 19. Security review

La review a vérifié IDOR, anonymat, ownership, ObjectId, mass assignment, identité acheteur, prix/currency serveur, event/ticket mismatch, statuts client, secrets, idempotency logging, bypass du provider de test et feature flag Stripe.

Les E2E API couvrent notamment les réponses adversariales `400/401/403/404/409`, les quantités invalides, types ou événements inexistants/incompatibles et les commandes d'un autre utilisateur. Aucun P0/P1 sécurité ne reste ouvert.

## 20. API QA

- lint : vert ;
- typecheck : vert ;
- build NestJS : vert ;
- unitaires : **879/879**, 65 suites ;
- couverture : **879/879**, 73,51 % statements, 65,75 % branches, 70,22 % functions, 74,30 % lines ;
- E2E API : **49/49**, 4 suites ;
- ciblés post-review : **103/103** ;
- concurrence réelle : **10/10** ;
- migration dry-run final : vert ;
- `git diff --check` : vert.

## 21. Web QA

Le Web n'avait pas été modifié par Claude. La review des surfaces existantes a découvert le finding W5-CX-03 et a corrigé :

- `/checkout/:eventId` ;
- `/paiement/succes` ;
- `/paiement/annule`.

Les trois surfaces sont maintenant fail-closed, cohérentes avec la modal participant, et ne rendent plus `session_id`.

- unitaires Web : **236/236**, 43 fichiers ;
- test de routes ajouté : **3/3** ;
- E2E ciblé Wave 5 : **9/9** ;
- E2E fonctionnels participant Wave 4 + Wave 5 : **21/21**, setup inclus ;
- build Next.js 16.2.12 : vert, 69 routes/pages.

## 22. UI/UX

L'état public emploie le langage participant (« L'achat en ligne n'est pas encore ouvert ») sans exposer feature flag, lease, transaction, provider ou idempotence. Un seul CTA secondaire ramène au catalogue. La hiérarchie, les tokens, la typographie et les surfaces Elintys existantes sont conservés.

Les faux messages « Paiement confirmé », « Paiement annulé », « aucun montant n'a été débité » et « réessayer » ont été supprimés tant qu'aucun checkout réel n'est disponible.

## 23. Accessibilité

Axe a audité les trois routes fermées et les surfaces participant réelles : **0 violation critical, 0 serious**. Le heading principal est unique, les liens gardent un nom accessible et les actions principales mesurent 45 px. Les tests ont aussi validé le parcours clavier existant, les dialogues participant et la restitution du focus sans nouvelle régression.

## 24. Responsive

Viewports validés : **320×720, 375×812, 390×844, 768×1024, 1024×768, 1440×900 et 1538×1100**.

Sur chaque viewport : overflow horizontal = 0, titre et action visibles, aucun texte de référence secrète, aucune commande coupée.

## 25. Scroll

Les pages publiques conservent le scroll document natif. Aucun Lenis, `wheel.preventDefault`, verrou `touchmove`, `touch-action:none` global ou `overflow-hidden` structurel n'a été ajouté. Les mesures E2E confirment l'absence d'overflow horizontal et de verrou vertical.

## 26. Performance

Mesure indicative sur build production local, Chromium non throttled, route `/paiement/succes` :

| TTFB | FCP | LCP | CLS | Ressources | Transfert | Overflow horizontal |
|---:|---:|---:|---:|---:|---:|---:|
| 7 ms | 104 ms | 104 ms | 0,002 | 66 | 569 022 octets | 0 px |

Ce relevé local n'est pas présenté comme un score Lighthouse de production. Aucun fetch participant, polling ou module de paiement n'est chargé par la surface fermée.

## 27. Résultats des gates

| Gate | API | Web |
|---|---|---|
| Lint | Vert | Vert, 0 erreur ; 9 warnings préexistants |
| Typecheck | Vert | Vert |
| Build | Vert | Vert |
| Unit | 879/879 | 236/236 |
| Coverage | Vert, seuil inchangé | Vert, seuil inchangé |
| E2E | 49/49 | 21/21 fonctionnels + 9/9 ciblés |
| Concurrence | 10/10 | N/A |
| Axe | N/A | 0 critical / 0 serious |
| Responsive | N/A | 7/7 viewports |
| Migration dry-run | Vert | N/A |
| Diff check | Vert | Vert |

Les warnings ESLint Web sont antérieurs à la Vague 5 et ne concernent aucun fichier modifié. Aucun seuil n'a été abaissé et aucun test n'a été skippé.

## 28. Synthèse P0/P1/P2/P3

| Sévérité | Trouvés | Corrigés | Ouverts |
|---|---:|---:|---:|
| P0 | 0 | 0 | 0 |
| P1 | 0 | 0 | 0 |
| P2 | 4 | 4 | 0 |
| P3 | 1 | 1 | 0 |

## 29. Risques résiduels

- La résolution commerciale d'un règlement tardif doit être décidée avant Stripe.
- L'expiration paresseuse garantit la correction lors des nouvelles réservations ; une exploitation régulière de la maintenance sera nécessaire pour rendre rapidement la capacité visible hors nouveau trafic.
- Le provider Stripe et les webhooks réels restent à valider en environnement Stripe de test avant toute activation.
- Les neuf warnings ESLint Web préexistants restent une dette technique distincte.

Aucun de ces risques ne rend le core actuel dangereux tant que Stripe participant reste fermé.

## 30. Recommandations pour la vague suivante

1. Décider et documenter la politique produit du late payment.
2. Ajouter l'orchestration durable des webhooks Stripe et leur signature, sans accepter de statut client.
3. Valider prix, taxes, remboursements et devise avec les règles commerciales finales.
4. Ajouter une supervision de la file `requiresManualReview` et des holds expirables.
5. Ouvrir le checkout Web seulement après E2E Stripe test, observabilité, runbook et kill switch validés.

## Commits

API :

- `f08ce0e` — `feat(ticketing): add paid ticket order lifecycle` ;
- `f2f28b7` — `test(ticketing): cover inventory and order concurrency` ;
- `370f8dc` — `docs(ticketing): document paid ticketing architecture`.

Web :

- `9fbeab1` — `fix(ticketing): keep paid checkout surfaces fail closed` ;
- `docs(audit): validate sprint 3 wave 5` — présent rapport.

## Verdict

**SPRINT 3 / VAGUE 5 — VALIDÉE**

Paid Ticketing Core validé. Stripe participant reste volontairement désactivé.
