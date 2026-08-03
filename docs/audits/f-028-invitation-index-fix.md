# F-028 — Correction de l'index legacy `token_1` des invitations

> Lot correctif prioritaire exécuté le 2026-08-02 sur **`elintys-dev`** uniquement.
> Base de production **`elintys` jamais touchée**. Aucune anomalie — rollback non déclenché.
> Dry-run préalable : [`f-028-invitation-index-dry-run.md`](./f-028-invitation-index-dry-run.md)

---

## 1. Cause racine

Trois défauts se combinaient :

1. **Index orphelin `token_1`** — `unique: true`, **`sparse: false`**, présent en base mais
   **absent du schéma Mongoose**.
2. **Le service ne renseigne jamais `token`** — `invitations.service.ts` crée les documents
   avec `tokenHash` + `tokenPrefix` seulement. Chaque nouvelle invitation indexait donc
   `token: null` ; la **2ᵉ** déclenchait un `E11000`.
3. **Traduction aveugle des E11000** — tout code 11000 devenait
   `INVITATION_ALREADY_SENT`, masquant le défaut technique derrière un message métier
   trompeur (« invitation déjà envoyée » pour une adresse jamais invitée).

**Impact** : la fonctionnalité d'invitation était cassée dès la 2ᵉ création, avec un
diagnostic erroné — bloquant de fait les modes d'accès `invitation_token` / `invitation`
du modèle Access V2.

## 2. Données avant

| Mesure | Valeur |
|---|---|
| Invitations totales | **1** |
| Avec champ `token` (jeton **brut** en base) | **1** ⚠ |
| Avec `tokenHash` | **0** |
| Avec `tokenPrefix` | **0** |

Le document unique (`6a6e28f4af71aa3057b7a1e4`) était **entièrement legacy et
non fonctionnel** : `acceptInvitation()` recherche par `tokenHash`, absent de ce document.
Il ne pouvait donc **jamais** être accepté, avant comme après la correction. Il stockait en
revanche un **jeton brut de 36 caractères en clair**.

## 3. Index avant (6)

| Nom | Clé | Contrainte | Au schéma ? |
|---|---|---|---|
| `_id_` | `{_id:1}` | — | implicite |
| `invitedBy_1_email_1` | `{invitedBy,email}` | UNIQUE | ❌ **orphelin** |
| **`token_1`** | `{token:1}` | **UNIQUE non-sparse** | ❌ **orphelin — cause racine** |
| `expiresAt_1` | `{expiresAt}` | TTL=0 | ✓ |
| `invitedBy_1_email_1_eventId_1_type_1` | 4 champs | UNIQUE | ✓ |
| `tokenHash_1` | `{tokenHash}` | UNIQUE | ✓ |

## 4. Preuve : aucun code actif ne lit `invitation.token`

| Vérification | Résultat |
|---|---|
| Requêtes Mongo filtrant sur `token` | **aucune** |
| `acceptInvitation()` / `markConverted()` | recherche par **`tokenHash`** (l. 110, 132) |
| `getMyInvitations()` | `.select('-token -tokenHash')` — exclusion |
| `toSafeInvitation()` | retire `token` et `tokenHash` |
| Frontend | envoie le token **brut dans l'URL** ; ne lit aucun champ `token` → **contrat inchangé** |

## 5. Sauvegarde

| Élément | Valeur |
|---|---|
| Chemin | `backups/elintys-dev-2026-08-02T22-33-49-819Z/` |
| Contenu | 16 collections · 61 documents (`invitations` = 1) |
| Intégrité | `manifest.sha256` **OK** · **16/16** collections recalculées, 0 corrompue |
| Index sauvegardés | les **6** index d'`invitations`, dont `token_1` (rollback) |

## 6. Migration exécutée

```bash
npx ts-node src/scripts/migrate-invitation-token-index.ts --execute --confirm-token-index
```

Script `src/scripts/migrate-invitation-token-index.ts` (npm : `invitation-index:migrate`) —
réutilise la garde d'environnement d'Access V2 (`ELINTYS_ENV=dev` + base exactement
`elintys-dev`), dry-run par défaut, double confirmation, fichier de rollback, et **garde
anti-anomalie** qui échoue si un index protégé disparaît.

**Résultat :**
```json
{ "mode": "execute", "database": "elintys-dev",
  "documentsWithLegacyToken": 1, "legacyIndexPresent": true,
  "tokensUnset": 1, "droppedIndex": true,
  "removedIndexes": ["token_1"],
  "rollbackFile": "invitation-token-rollback-2026-08-02T22-39-33-258Z.json" }
```
Code de sortie : **0**. **Un seul index retiré**, conformément à l'autorisation.

## 7. Schéma modifié

`invitation.schema.ts` — champ legacy `token` **supprimé** ; aucune déclaration d'index
associée n'existait. Conservés : `tokenHash` (requis, `select: false`), `tokenPrefix`,
`expiresAt`, `maxUses`/`useCount` (consommation), et les contraintes métier.

> Les exclusions défensives `.select('-token -tokenHash')` et le retrait dans
> `toSafeInvitation()` sont **volontairement conservés** : les lectures `.lean()` renvoient
> les documents bruts, donc un éventuel document legacy résiduel (autre environnement)
> ne pourrait pas fuiter son jeton.

## 8. Logique E11000 différenciée

`translateDuplicateKeyError()` inspecte `keyPattern` :

| Collision | Réponse |
|---|---|
| Index métier (`invitedBy` + `email`, 2 ou 4 champs) | **`409 INVITATION_ALREADY_SENT`** |
| `tokenHash` | **500 générique** + journalisation `INVITATION_PERSISTENCE_CONFLICT [index]` |
| Tout autre index | **500 générique**, jamais `INVITATION_ALREADY_SENT` |
| Erreur non-E11000 | propagée telle quelle |

Aucun jeton brut, `tokenHash`, `keyValue` ni message Mongo n'est exposé — **seuls les noms
de champs de l'index** sont journalisés.

## 9. Tests

### Unitaires — `invitations.service.spec.ts` (15 tests, +8)
- doublon métier (4 champs et 2 champs) → `ConflictException` ;
- collision `tokenHash` → `InternalServerErrorException`, **pas** de faux `INVITATION_ALREADY_SENT` ;
- collision `token` legacy → erreur technique ;
- index inconnu → erreur de persistance ;
- **aucun secret dans le message** (assertion `not.stringContaining`) ;
- erreur non-E11000 propagée ;
- jeton brut jamais persisté (`token` absent du payload, `tokenPrefix` de 8 caractères) ;
- `tokenHash`/`token` absents de la réponse.

> **Limite assumée** : `mongodb-memory-server` **n'est pas installé** dans le projet (bien
> que le `CLAUDE.md` le mentionne). Plutôt que d'ajouter une dépendance lourde, la couverture
> « index réels » est assurée par la validation runtime §10 sur `elintys-dev`, qui s'exécute
> contre les véritables index MongoDB.

## 10. Validation runtime (`elintys-dev`, index réels)

| # | Scénario | Résultat |
|---|---|---|
| 1 | Première invitation | **201** ✓ |
| 2 | Deuxième invitation, autre adresse | **201** ✓ ← *échouait avant (E11000)* |
| 3 | 3ᵉ et 4ᵉ invitations distinctes | **201 / 201** ✓ |
| 4 | Vrai doublon métier | **409 `INVITATION_ALREADY_SENT`** ✓ |
| 5 | Collision `tokenHash` | couvert en unitaire — pas de faux doublon ✓ |
| 6 | Jeton brut en base | **0 document** ✓ |
| 7 | `tokenHash`/`token` dans les réponses | **absents** ✓ (seul `tokenPrefix` exposé) |
| 8 | Replay d'un jeton consommé | **404 `INVITATION_NOT_FOUND`** ✓ |
| 9 | Jeton expiré | **404** ✓ |
| 10 | Tiers invitant sur l'événement d'autrui | **403 `EVENT_NOT_OWNER`** ✓ |
| 11 | Événement sans mode `invitation` | **409 `INVITATION_ADMISSION_DISABLED`** ✓ |
| 12 | Parcours `invitation_token` / `invitation` complet | **201** ✓ |

**Nettoyage** : 6 invitations QA et 2 événements QA supprimés (204). Aucun compte réel
utilisé — uniquement les comptes QA dev. Base revenue à **1 document** (le legacy zombie,
désormais sans jeton brut).

## 11. Index après (5)

| Nom | Contrainte | Statut |
|---|---|---|
| `_id_` | — | conservé |
| `invitedBy_1_email_1` | UNIQUE | conservé *(orphelin — voir F-032)* |
| `expiresAt_1` | TTL | conservé ✓ |
| `invitedBy_1_email_1_eventId_1_type_1` | UNIQUE | conservé ✓ |
| `tokenHash_1` | UNIQUE | conservé ✓ |

| Contrôle | Résultat |
|---|---|
| `token_1` supprimé | **OUI** ✓ |
| `tokenHash_1` conservé | **OUI** ✓ |
| Déduplication métier (4 champs) conservée | **OUI** ✓ |
| TTL `expiresAt` conservé | **OUI** ✓ |
| Aucun index inattendu supprimé | **OUI** ✓ (6 → 5, `removedIndexes: ["token_1"]`) |

## 12. Gates

| Gate | Résultat |
|---|---|
| API `lint` | ✅ exit 0 |
| API `build` | ✅ exit 0 |
| API suite complète | ✅ **389 tests / 41 suites** (avant : 381) |
| API tests invitations | ✅ 15 tests |
| Analyse des handles ouverts | ⚠️ fuite **toujours présente** — **F-011 préexistant**, non causé par ce lot |
| Web `typecheck` | ✅ exit 0 |
| Web suite | ✅ **164 tests / 26 fichiers** |
| Web `build` | non requis — **contrat frontend inchangé** (le token transite par l'URL) |

## 13. Rollback

| Élément | Valeur |
|---|---|
| Fichier | `invitation-token-rollback-2026-08-02T22-39-33-258Z.json` |
| Permissions | **`-rw------- (600)`**, écrit en mode `wx` |
| Contenu | définitions des **6 index d'origine** + le document affecté avec son `token` |
| Statut | **non exécuté** — tous les contrôles verts |

**Procédure (non appliquée)** :
1. Recréer l'index : `db.invitations.createIndex({ token: 1 }, { unique: true })` — définition
   exacte disponible dans `indexesBefore` du fichier de rollback et dans `manifest.json`.
2. Restaurer le champ : `$set: { token: <valeur du fichier de rollback> }` sur le `_id` listé.
3. Filet complet : restauration de la collection `invitations` depuis le dump EJSON §5
   (checksums vérifiés).
4. Restaurer la déclaration `token` dans `invitation.schema.ts` (git).

## 14. Statut F-028 et critères de réussite

| Critère | Statut |
|---|---|
| Plusieurs invitations distinctes créables | ✅ 4 créées d'affilée |
| Aucun conflit sur `token: null` | ✅ |
| `token_1` supprimé **uniquement** sur `elintys-dev` | ✅ |
| `tokenHash_1` conservé | ✅ |
| Doublons métier correctement détectés | ✅ 409 |
| Collisions techniques distinguées | ✅ 500 + journal |
| Aucun secret exposé | ✅ (réponses, messages, journaux) |
| Replay bloqué | ✅ 404 |
| Tests verts | ✅ 389 API + 164 web |
| **F-028 fermé** | ✅ |

**F-025** (index `token` legacy) est également **fermé** — absorbé par cette correction.

## 15. Risques restants

1. **🆕 F-032 (P2)** — l'index orphelin **`invitedBy_1_email_1` UNIQUE** subsiste. Il est
   **plus strict que l'index métier du schéma** : il interdit au même inviteur d'inviter la
   même adresse pour **deux événements différents** (ou deux types différents), alors que
   l'index à 4 champs l'autorise. **Non corrigé** : l'autorisation de ce lot ne couvrait que
   `token_1`. → décision séparée requise (le supprimer rétablirait la sémantique du schéma).
2. **Document legacy zombie** — l'unique invitation restante n'a pas de `tokenHash` et ne peut
   donc jamais être acceptée. Son jeton brut a été retiré (gain de sécurité). Sa suppression
   n'a pas été effectuée (aucune autorisation de suppression de document).
3. **F-011 (P3)** — fuite de handles dans la suite Jest, préexistante et inchangée.
4. **Production** — la base `elintys` possède très probablement les mêmes index orphelins et
   d'éventuels jetons bruts. **Aucune action n'y a été menée** ; la garde des scripts refuse
   volontairement toute base ≠ `elintys-dev`. Une intervention prod devra être planifiée
   séparément.
