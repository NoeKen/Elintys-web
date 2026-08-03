# F-032 — Suppression de l'index orphelin `invitedBy_1_email_1`

> Correctif autonome exécuté le 2026-08-02 sur **`elintys-dev`** uniquement.
> Base de production **`elintys` jamais touchée**. Aucune anomalie — rollback non déclenché.
> Dry-run préalable : [`f-032-invitation-index-dry-run.md`](./f-032-invitation-index-dry-run.md)

---

## 1. Cause racine

La collection `invitations` portait un index **`invitedBy_1_email_1` UNIQUE** hérité d'une
version antérieure du modèle, **jamais supprimé** lors du passage à la clé de déduplication
à quatre champs. Il était **strictement plus restrictif** que la règle métier voulue :

| Situation | Règle voulue (4 champs) | Index legacy (2 champs) |
|---|---|---|
| Même email, **événement différent** | autorisé | **BLOQUÉ** ❌ |
| Même email, **type différent** | autorisé | **BLOQUÉ** ❌ |
| Même email, même événement, même type | bloqué | bloqué ✓ |

**Impact** : un organisateur ne pouvait inviter une adresse **qu'une seule fois au total**,
tous événements et types confondus. La collision remontait en `409 INVITATION_ALREADY_SENT`
— message correct sur la forme mais **sémantiquement faux**, puisqu'aucune invitation n'avait
été envoyée *pour cet événement*.

## 2. Index avant (5)

| Nom | Clé | Contrainte | Au schéma ? |
|---|---|---|---|
| `_id_` | `{_id:1}` | — | implicite |
| **`invitedBy_1_email_1`** | `{invitedBy, email}` | **UNIQUE** | ❌ **orphelin** |
| `expiresAt_1` | `{expiresAt}` | TTL=0 | ✓ |
| `invitedBy_1_email_1_eventId_1_type_1` | 4 champs | UNIQUE | ✓ |
| `tokenHash_1` | `{tokenHash}` | UNIQUE | ✓ |

## 3. Preuve : le schéma attend l'index à quatre champs

`invitation.schema.ts:77-79` — **les trois seuls index déclarés** :
```ts
InvitationSchema.index({ invitedBy: 1, email: 1, eventId: 1, type: 1 }, { unique: true });
InvitationSchema.index({ tokenHash: 1 }, { unique: true });
InvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```
**Aucune déclaration d'index à deux champs.**

### Aucune dépendance applicative à l'unicité globale `{invitedBy, email}`
| Vérification | Résultat |
|---|---|
| Requête filtrant sur `{invitedBy, email}` | **aucune** |
| Écritures | `create()` seulement — s'appuie sur les contraintes d'index |
| Lectures | `getMyInvitations()` → `find({ invitedBy })` ; `acceptInvitation()` / `markConverted()` → par `tokenHash` |
| `translateDuplicateKeyError()` | teste `invitedBy` **et** `email` dans `keyPattern` → **couvre aussi l'index à 4 champs**, donc le mapping `INVITATION_ALREADY_SENT` reste correct |

### Aucune perte de couverture d'index
`find({ invitedBy })` reste servi par le **préfixe** de
`invitedBy_1_email_1_eventId_1_type_1` (règle du préfixe d'index composé MongoDB) →
**aucune régression de performance**.

## 4. Sauvegarde

| Élément | Valeur |
|---|---|
| Chemin | `backups/elintys-dev-2026-08-02T23-09-38-768Z/` |
| Contenu | 16 collections · 61 documents |
| Intégrité | `manifest.sha256` **OK** · **16/16** collections recalculées, 0 corrompue |
| Index sauvegardés | les **5** index d'`invitations`, dont `invitedBy_1_email_1` |

## 5. Dry-run

```json
{ "mode": "dry-run", "database": "elintys-dev",
  "legacyIndexPresent": true, "businessIndexPresent": true, "documents": 1,
  "indexesBefore": ["_id_","invitedBy_1_email_1","expiresAt_1",
                    "invitedBy_1_email_1_eventId_1_type_1","tokenHash_1"] }
```

## 6. Commande exécutée

```bash
npx ts-node src/scripts/migrate-invitation-dedup-index.ts --execute --confirm-dedup-index
```

Script `src/scripts/migrate-invitation-dedup-index.ts` (npm : `invitation-dedup:migrate`).
**Gardes implémentées** :
- environnement `dev` + base exactement `elintys-dev` (refus sinon, avant connexion) ;
- **refus si l'index métier à 4 champs est absent** (on ne retire jamais le legacy sans filet) ;
- **arrêt propre** si l'index attendu n'existe pas (`skipped: LEGACY_INDEX_ABSENT`) ;
- **échec** si un index protégé manque après l'opération ;
- **échec** si le nombre d'index retirés ≠ 1 ou si ce n'est pas celui visé ;
- fichier de rollback en `600` avant toute écriture.

**Résultat** : `droppedIndex: true`, `removedIndexes: ["invitedBy_1_email_1"]`, exit **0**.
**Aucun document modifié.**

## 7. Index après (4)

| Nom | Clé | Contrainte |
|---|---|---|
| `_id_` | `{_id:1}` | — |
| `expiresAt_1` | `{expiresAt}` | TTL |
| `invitedBy_1_email_1_eventId_1_type_1` | 4 champs | UNIQUE |
| `tokenHash_1` | `{tokenHash}` | UNIQUE |

| Contrôle | Résultat |
|---|---|
| `invitedBy_1_email_1` supprimé | **OUI** ✓ |
| Index métier à 4 champs conservé | **OUI** ✓ |
| `tokenHash_1` conservé | **OUI** ✓ |
| `expiresAt_1` (TTL) conservé | **OUI** ✓ |
| **Un seul index supprimé** | **OUI** ✓ (5 → 4) |

## 8. Tests runtime (`elintys-dev`, comptes QA, index réels)

| # | Scénario | Résultat |
|---|---|---|
| 1 | Même organisateur + même email + **événement A** | **201** ✓ |
| 2 | Même organisateur + même email + **événement B** ★ | **201** ✓ ← *bloqué avant le correctif* |
| 3 | Doublon exact (A + même type) | **409 `INVITATION_ALREADY_SENT`** ✓ |
| 4 | Même événement A, **type différent** (`vendor`) | **201** ✓ — conforme au modèle à 4 champs |
| 5 | Organisateur tiers sur l'événement d'autrui | **403 `EVENT_NOT_OWNER`** ✓ |
| 6 | Plusieurs invitations vers plusieurs emails | **201 ×3** ✓ |
| 7 | Faux `INVITATION_ALREADY_SENT` dû à l'index legacy | **aucun** ✓ |

**Données QA nettoyées** : 6 invitations + 2 événements QA supprimés (204). Aucun compte réel
utilisé — uniquement les comptes QA dev. Collection revenue à **1 document** (le legacy zombie).

## 9. Tests automatisés

`invitations.service.spec.ts` — **18 tests** (+3) :
- doublon métier sur l'index **à 4 champs** → `ConflictException` ;
- tolérance défensive à l'index legacy à 2 champs (environnements non encore migrés) ;
- **même adresse sur deux `eventId` distincts → deux créations, aucune collision** (F-032) ;
- **même adresse avec deux `type` distincts → deux créations** (F-032) ;
- mapping E11000 selon `keyPattern` (`tokenHash`, `token`, index inconnu → erreur technique) ;
- aucun secret dans les messages d'erreur ;
- erreur non-E11000 propagée telle quelle.

### Gates
| Gate | Résultat |
|---|---|
| API `lint` | ✅ exit 0 |
| API `build` | ✅ exit 0 |
| API suite complète | ✅ **392 tests / 41 suites** (avant : 389) |
| API tests Invitations | ✅ 18 tests |
| Handles ouverts | ⚠️ fuite toujours présente — **F-011 préexistant**, hors périmètre de ce lot |
| Web `typecheck` | ✅ exit 0 |
| Web suite | ✅ **164 tests / 26 fichiers** |
| Web `build` | non requis — **contrat frontend inchangé** |

## 10. Rollback

| Élément | Valeur |
|---|---|
| Fichier | `invitation-dedup-index-rollback-2026-08-02T23-11-33-158Z.json` |
| Permissions | **`-rw------- (600)`**, écrit en mode `wx` |
| Contenu | définition **exacte** de l'index supprimé + les 5 index d'origine |
| Statut | **non exécuté** — tous les contrôles verts |

Définition conservée :
```json
{ "v": 2, "key": { "invitedBy": 1, "email": 1 },
  "name": "invitedBy_1_email_1", "background": true, "unique": true }
```

**Procédure (simulée, non appliquée)** :
```js
db.invitations.createIndex({ invitedBy: 1, email: 1 }, { unique: true, background: true });
```
Filet complémentaire : restauration de la collection depuis le dump EJSON §4 (checksums
vérifiés). Note : la recréation n'aboutirait que si les données ne contiennent pas de
doublons sur ce couple — situation garantie ici (1 seul document).

## 11. Statut F-032 et critères de réussite

| Critère | Statut |
|---|---|
| Même organisateur peut inviter le même email à deux événements différents | ✅ |
| Vrai doublon métier reste bloqué | ✅ 409 |
| Seul `invitedBy_1_email_1` supprimé | ✅ |
| Index métier à 4 champs conservé | ✅ |
| Aucun autre index affecté | ✅ (5 → 4) |
| Aucun secret exposé | ✅ |
| Tests et runtime verts | ✅ 392 API + 164 web |
| **F-032 fermé** | ✅ |

## 12. Risques restants

1. **Document legacy zombie** — l'unique invitation restante n'a pas de `tokenHash` et ne peut
   donc jamais être acceptée. Son jeton brut a été retiré lors du lot F-028. Sa suppression
   n'a pas été effectuée (aucune autorisation de suppression de document).
2. **F-011 (P3)** — fuite de handles dans la suite Jest, préexistante et inchangée.
3. **Production** — la base `elintys` porte très probablement les **mêmes index orphelins**
   (`token_1` et `invitedBy_1_email_1`). **Aucune action n'y a été menée** ; les gardes des
   scripts refusent volontairement toute base ≠ `elintys-dev`. Une intervention prod devra
   être planifiée séparément, avec le même protocole (backup → dry-run → exécution → contrôles).
4. **Documents en double potentiels en production** — si la prod contient plusieurs invitations
   partageant `{invitedBy, email}` sur des événements différents, elles n'ont pas pu être
   créées tant que l'index existait ; aucun nettoyage préalable ne sera donc nécessaire, mais
   l'inventaire reste à faire avant toute opération.
