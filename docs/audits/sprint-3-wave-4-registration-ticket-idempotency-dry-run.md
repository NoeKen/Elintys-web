# Sprint 3 / Vague 4 — dry-run inscription et idempotence billetterie

> **Aucune écriture en base effectuée.** Audit en lecture seule sur `elintys-dev`
> le 18 août 2026. La production n'a pas été consultée ni modifiée.
> Ce document conserve l'état du dry-run initial. La migration non destructive a
> ensuite été autorisée par la mission Critical Operations, sauvegardée, exécutée
> et vérifiée sur `elintys-dev` uniquement ; voir le rapport final Vague 4.

## Résumé

La boucle participant ne peut pas être déclarée sûre avec le modèle courant :

- aucune collection ni aucun schéma `EventRegistration` ne représente l'inscription simple ;
- deux requêtes concurrentes de billet gratuit peuvent dépasser le stock ;
- une double soumission peut créer plusieurs admissions pour le même participant ;
- le contrôle applicatif des webhooks Stripe n'est pas protégé par un index unique sur
  `stripePaymentIntentId`.

Le bouton désactivé côté navigateur ne peut pas garantir ces invariants. Une contrainte
serveur et des réservations atomiques sont nécessaires avant de livrer la Vague 4.

## État réel de `elintys-dev`

| Contrôle en lecture seule | Résultat |
|---|---:|
| Base connectée | `elintys-dev` |
| Collection `eventregistrations` | absente |
| `tickettypes` | 28 documents |
| `ticketpurchases` | 0 document |
| Groupes dupliqués buyer/event/type observés | 0 |
| Groupes dupliqués `stripePaymentIntentId` observés | 0 |

Index présents sur `ticketpurchases` :

- `_id_` ;
- `qrCode_1` unique sparse ;
- `event_1` ;
- `buyerId_1` ;
- `guestEmail_1`.

Il n'existe donc aucune contrainte d'idempotence par demande ni par paiement. L'absence de
doublon observé n'est pas une preuve de sûreté : la collection est actuellement vide.

## Cause racine

`TicketsService.purchase()` lit `quantity` et `sold`, crée ensuite les billets, puis
incrémente `sold`. Deux appels peuvent lire le même stock avant l'une ou l'autre
incrémentation. `createPurchasesFromCheckout()` suit la même séquence et la recherche
préalable du Payment Intent dans `PaymentsService` reste sujette à une course sans index
unique.

Pour `registration_only`, aucun modèle, endpoint ou index participant/événement n'existe.
Le CTA actuel mène à la création de compte ; il ne crée pas une inscription à l'événement.

## Migration proposée — non exécutée

### 1. Inscription simple

Créer une collection `eventregistrations` avec au minimum :

- `eventId` ObjectId requis ;
- `participantId` ObjectId requis ;
- `status` enum documenté ;
- timestamps.

Créer un index unique nommé explicitement sur `{ eventId: 1, participantId: 1 }` afin que
deux POST concurrents convergent vers une seule inscription. Le service doit traduire
l'erreur duplicate-key en réponse idempotente ou conflit métier stable.

### 2. Billets gratuits

- exiger une clé d'idempotence opaque par tentative d'achat ;
- la persister dans une unité de commande/admission ;
- créer un index unique par acheteur et clé d'idempotence ;
- réserver le stock avec un `findOneAndUpdate` conditionnel atomique avant la création des
  billets ;
- utiliser une transaction Mongo lorsqu'elle est disponible, ou implémenter un rollback
  compensatoire borné si la création échoue après la réservation.

Le produit doit décider si plusieurs billets par participant sont autorisés. Cette règle
ne doit pas être encodée implicitement dans l'index d'idempotence.

### 3. Paiements Stripe

Ajouter un index unique sparse sur `ticketpurchases.stripePaymentIntentId`, ou de préférence
une collection de commande unique par Payment Intent, afin que deux webhooks concurrents ne
créent jamais deux groupes de billets.

## Plan d'exécution proposé

1. Créer un backup EJSON complet avec `npm run backup:dev` et vérifier les checksums.
2. Exécuter un script dry-run gardé qui refuse toute base différente de `elintys-dev`.
3. Rechercher les doublons et valeurs invalides avant chaque création d'index.
4. Créer les nouveaux index par noms explicites.
5. Vérifier les index live et exécuter les tests de concurrence (deux requêtes simultanées).
6. Activer les nouveaux services seulement après succès des contraintes.

## Impact et risques

| Risque | Niveau | Mitigation |
|---|---|---|
| Échec de création d'index en présence de doublons | moyen | agrégations dry-run bloquantes |
| Réservation de stock sans création de billet | élevé | transaction ou compensation testée |
| Déduplication trop restrictive | moyen | décision métier explicite sur la quantité autorisée |
| Régression paiement | élevé | index Payment Intent et tests de webhooks concurrents |
| Perte de données | faible en dev | backup EJSON et aucune suppression de document |

## Rollback proposé

1. Désactiver/revenir au code consommant les nouvelles contraintes.
2. Restaurer les définitions d'index capturées dans le manifeste du backup.
3. Supprimer uniquement les nouveaux index nommés, après vérification de leurs clés exactes.
4. Ne supprimer aucun document automatiquement ; conserver les inscriptions créées pour
   analyse ou restauration ciblée.

## Verdict

**STOP avant migration.** Le dry-run confirme un manque structurel, pas une anomalie de
données existante. L'inscription réelle et l'idempotence exigées par la Vague 4 nécessitent
une migration non destructive, une règle métier sur les quantités et une autorisation
explicite avant écriture.
