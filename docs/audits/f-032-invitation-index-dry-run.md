# F-032 — Dry-run : index orphelin `invitedBy_1_email_1`

> **Aucune écriture effectuée.** Audit en lecture seule sur **`elintys-dev`**.
> Base de production `elintys` : **jamais touchée**. Date : 2026-08-02.

---

## 1. Gardes d'environnement

| Contrôle | Résultat |
|---|---|
| `ELINTYS_ENV` | **`dev`** ✓ |
| Base connectée | **`elintys-dev`** ✓ |
| Ligne pointant vers `/elintys` | **aucune** ✓ |

## 2. Index réels (AVANT) — 5

| Nom | Clé | Contrainte | Déclaré au schéma ? |
|---|---|---|---|
| `_id_` | `{_id:1}` | — | implicite |
| **`invitedBy_1_email_1`** | `{invitedBy, email}` | **UNIQUE** | ❌ **ORPHELIN — à supprimer** |
| `expiresAt_1` | `{expiresAt}` | TTL=0 | ✓ |
| `invitedBy_1_email_1_eventId_1_type_1` | 4 champs | UNIQUE | ✓ |
| `tokenHash_1` | `{tokenHash}` | UNIQUE | ✓ |

Documents dans la collection : **1** (le document legacy zombie, sans `tokenHash`).

## 3. Preuve : le schéma attend l'index à 4 champs

`invitation.schema.ts:77-79` — **les 3 seuls index déclarés** :
```ts
InvitationSchema.index({ invitedBy: 1, email: 1, eventId: 1, type: 1 }, { unique: true });
InvitationSchema.index({ tokenHash: 1 }, { unique: true });
InvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```
**Aucune déclaration d'index à 2 champs.** L'index `invitedBy_1_email_1` est donc un résidu
historique jamais nettoyé lors du passage à la clé de déduplication à 4 champs.

## 4. Cause racine et impact

L'index à 2 champs est **strictement plus restrictif** que la règle métier voulue :

| Situation | Index 4 champs (voulu) | Index 2 champs (réel) |
|---|---|---|
| Même email, **événement différent** | autorisé | **BLOQUÉ** ❌ |
| Même email, **type différent** | autorisé | **BLOQUÉ** ❌ |
| Même email, même événement, même type | bloqué | bloqué ✓ |

Conséquence : un organisateur ne peut inviter une adresse **qu'une seule fois au total**,
tous événements et types confondus. La collision remonte en `409 INVITATION_ALREADY_SENT`
— message correct sur la forme, mais **sémantiquement faux** (l'invitation n'a pas été
envoyée pour *cet* événement).

## 5. Aucun code ne dépend de l'unicité globale `{invitedBy, email}`

| Vérification | Résultat |
|---|---|
| Requête filtrant sur `{invitedBy, email}` | **aucune** |
| Écriture | `create()` uniquement (l. 61) — s'appuie sur les contraintes d'index |
| Lecture | `getMyInvitations()` → `find({ invitedBy })` (non unique) ; `acceptInvitation()` / `markConverted()` → par `tokenHash` |
| `translateDuplicateKeyError()` | teste `keys.includes('invitedBy') && keys.includes('email')` → **couvre aussi l'index à 4 champs** (qui contient ces deux champs) : le mapping `INVITATION_ALREADY_SENT` reste correct après suppression ✓ |

## 6. Aucune régression de performance attendue

`getMyInvitations()` exécute `find({ invitedBy })`. Après suppression de
`invitedBy_1_email_1`, cette requête reste couverte par le **préfixe** de
`invitedBy_1_email_1_eventId_1_type_1` (règle du préfixe d'index composé MongoDB).

## 7. Plan (Phase B — non exécuté)

| # | Action |
|---|---|
| 1 | Sauvegarde EJSON complète + checksums + définitions d'index |
| 2 | `dropIndex('invitedBy_1_email_1')` — **seul index visé** |
| 3 | Conserver `_id_`, `expiresAt_1`, `tokenHash_1`, `invitedBy_1_email_1_eventId_1_type_1` |
| 4 | **Aucun document modifié** |
| 5 | Garde anti-anomalie : échec si l'index attendu est absent, ou si un index protégé disparaît |
| 6 | Fichier de rollback en `600` avec la définition exacte de l'index supprimé |

### Index attendus APRÈS — 4
`_id_` · `expiresAt_1` · `invitedBy_1_email_1_eventId_1_type_1` · `tokenHash_1`

## 8. Risques et rollback

| Risque | Niveau | Mitigation |
|---|---|---|
| Perte de données | 🟢 nul | aucun document modifié |
| Régression fonctionnelle | 🟢 nulle | aucun code ne dépend de cette unicité (§5) |
| Régression de performance | 🟢 nulle | requête couverte par le préfixe (§6) |
| Suppression d'index erronée | 🟡 | un seul `dropIndex` ciblé + garde anti-anomalie + comparaison avant/après |
| Doublons métier non détectés | 🟢 nul | l'index à 4 champs conserve la contrainte réelle |

**Rollback** : `db.invitations.createIndex({ invitedBy: 1, email: 1 }, { unique: true })` —
définition exacte conservée dans le fichier de rollback et dans `manifest.json` du backup.

## 9. Verdict

✅ **Suppression sûre et recommandée** : index orphelin absent du schéma, aucune dépendance
applicative, aucun document touché, aucune perte de couverture d'index, rollback trivial.
