# F-028 — Dry-run : index legacy `token_1` des invitations

> **Aucune écriture effectuée.** Audit strictement en lecture sur **`elintys-dev`**.
> Base de production `elintys` : **jamais touchée**.
> Date : 2026-08-02.

---

## 1. Gardes d'environnement

| Contrôle | Résultat |
|---|---|
| `ELINTYS_ENV` | **`dev`** ✓ |
| Base connectée | **`elintys-dev`** ✓ |
| Variable pointant vers `elintys` | **aucune** ✓ |
| URI de production commentée | **aucune** ✓ |
| Ressource de production | **aucune** ✓ |

## 2. Schéma Invitation (`invitation.schema.ts`)

Champs liés au token :
```ts
/** Champ legacy, lecture seulement pendant la migration. */
@Prop({ type: String, select: false })  token?: string;        // ← legacy
@Prop({ type: String, required: true, select: false })  tokenHash!: string;
@Prop({ type: String, required: true, maxlength: 16 })  tokenPrefix!: string;
```

**Index déclarés dans le schéma — 3 seulement** :
| Index | Contrainte |
|---|---|
| `{ invitedBy, email, eventId, type }` | UNIQUE — déduplication métier |
| `{ tokenHash }` | UNIQUE |
| `{ expiresAt }` | TTL (`expireAfterSeconds: 0`) |

> **Le schéma ne déclare aucun index sur `token`.**

## 3. Index réels en base (AVANT) — 6 index

| Nom | Clé | Contrainte | Déclaré au schéma ? |
|---|---|---|---|
| `_id_` | `{_id:1}` | — | implicite |
| `invitedBy_1_email_1` | `{invitedBy:1, email:1}` | **UNIQUE** | ❌ **ORPHELIN** |
| `token_1` | `{token:1}` | **UNIQUE**, *non-sparse* | ❌ **ORPHELIN** |
| `expiresAt_1` | `{expiresAt:1}` | TTL=0 | ✓ |
| `invitedBy_1_email_1_eventId_1_type_1` | 4 champs | UNIQUE | ✓ |
| `tokenHash_1` | `{tokenHash:1}` | UNIQUE | ✓ |

### 🔴 Deux index orphelins, deux défauts distincts

**(a) `token_1` — cause racine de F-028**
`unique: true`, **`sparse: false`**, sur un champ `token` optionnel que
`invitations.service.ts:52-61` **ne renseigne jamais** (il pose `tokenHash` + `tokenPrefix`).
Chaque nouvelle invitation indexe donc `token: null`. La **2ᵉ** provoque un `E11000`.

**(b) `invitedBy_1_email_1` — défaut supplémentaire découvert (nouveau finding F-032)**
Cet index UNIQUE à 2 champs est **plus strict** que l'index métier à 4 champs du schéma :
il interdit au même inviteur d'inviter **la même adresse pour deux événements différents**
(ou deux types différents), alors que le schéma l'autorise explicitement.
→ **Non couvert par l'autorisation de suppression de ce lot** (qui vise `token_1`).
Signalé pour décision séparée.

## 4. Documents existants

| Mesure | Valeur |
|---|---|
| Total invitations | **1** |
| Avec champ `token` (legacy) | **1** |
| Avec `tokenHash` | **0** |
| Avec `tokenPrefix` | **0** |

### Le document unique est entièrement legacy — et zombie
| Attribut | Valeur |
|---|---|
| `_id` | `6a6e28f4af71aa3057b7a1e4` |
| `status` | `pending` · `type` : `vendor` · `eventId` : `6a6e274caf71aa3057b7a1c8` |
| `expiresAt` | 2026-08-31 — **non expiré** |
| `token` | **présent, 36 caractères — SECRET EN CLAIR EN BASE** ⚠ |
| `tokenHash` | **absent** |
| `tokenPrefix` | **absent** |
| Champs absents | `maxUses`, `useCount` |

**Conséquence** : `acceptInvitation()` recherche par `tokenHash` ; ce document **ne peut
donc jamais être accepté** par le code actuel. Il est déjà non fonctionnel *avant* toute
modification. Supprimer son champ `token` **retire un secret en clair** sans changer aucun
comportement.

> Ce document occupe par ailleurs le « créneau `null` » de `tokenHash_1` (unique non-sparse).
> Sans impact pratique : le schéma rend `tokenHash` obligatoire, donc l'application ne peut
> pas créer un second document sans `tokenHash`.

## 5. Preuve : aucun code actif ne lit `invitation.token`

| Vérification | Résultat |
|---|---|
| Requêtes Mongo filtrant sur `token` | **aucune** (`findOne({token`, `updateOne({token` → 0 résultat) |
| `acceptInvitation()` | recherche par **`tokenHash`** (`invitations.service.ts:105`) |
| `markConverted()` | recherche par **`tokenHash`** (l. 127) |
| `getMyInvitations()` | `.select('-token -tokenHash')` — **exclusion** (l. 97) |
| `toSafeInvitation()` | retire `token` et `tokenHash` de la réponse (l. 138) |
| Frontend | envoie le **token brut dans l'URL** (`/invitations/accept/:token`) ; ne lit aucun champ `token` en base → **contrat inchangé** |

L'authentification des invitations repose donc **uniquement** sur `tokenHash` (SHA-256 de
`randomBytes(32)`) et `tokenPrefix` (affichage).

## 6. Gestion actuelle des erreurs E11000 — défectueuse

```ts
} catch (error: unknown) {
  const mongoError = error as { code?: number };
  if (mongoError?.code === 11000) {
    throw new ConflictException(ErrorCodes.INVITATION_ALREADY_SENT);  // ← aveugle
  }
  throw error;
}
```
**Toute** collision d'unicité — y compris sur `token_1` ou `tokenHash_1` — est traduite en
`INVITATION_ALREADY_SENT`. Message **trompeur** qui masque la cause réelle et rend le défaut
F-028 invisible en exploitation.

## 7. Plan de migration proposé (Phase B — non exécuté)

| # | Action | Justification |
|---|---|---|
| 1 | Sauvegarde EJSON complète + checksums | Filet de sécurité |
| 2 | `$unset` du champ `token` sur le document legacy | Retire un secret en clair ; aucun code ne le lit |
| 3 | **`dropIndex('token_1')`** | Cause racine de F-028 — **autorisé explicitement pour `elintys-dev`** |
| 4 | Retirer `token` du schéma Mongoose | Supprime le code mort |
| 5 | Conserver `tokenHash_1` UNIQUE | Contrainte d'unicité réelle |
| 6 | Conserver `invitedBy_1_email_1_eventId_1_type_1` | Déduplication métier voulue |
| 7 | Différencier les E11000 par `keyPattern` | Fin du message trompeur |
| 8 | **NE PAS toucher** `invitedBy_1_email_1` | Hors autorisation — finding F-032 à décider |

### Index attendus APRÈS
`_id_` · `invitedBy_1_email_1` *(orphelin conservé)* · `expiresAt_1` (TTL) ·
`invitedBy_1_email_1_eventId_1_type_1` (UNIQUE) · `tokenHash_1` (UNIQUE)
→ **5 index** (un de moins : `token_1` supprimé).

## 8. Risques et rollback

| Risque | Niveau | Mitigation |
|---|---|---|
| Perte de données | 🟢 très faible | 1 seul document ; backup + checksums ; `$unset` d'un champ inutilisé |
| Régression fonctionnelle | 🟢 nulle | aucun code ne lit `token` (preuve §5) |
| Suppression d'index erronée | 🟡 | suppression ciblée d'un seul index, comparaison avant/après |
| F-032 (`invitedBy_1_email_1`) | 🟡 P2 | **non touché**, signalé pour décision |

**Rollback** : recréer `token_1` depuis `manifest.json` (les définitions d'index y sont
sauvegardées), restaurer la collection `invitations` depuis le dump EJSON, restaurer le
champ `token` si nécessaire.

## 9. Verdict du dry-run

✅ **Migration sûre et recommandée** : 1 document, aucun code lecteur du champ `token`,
document déjà non fonctionnel, suppression d'un secret en clair à la clé, un seul index
retiré (explicitement autorisé), rollback disponible.

⚠️ **Nouveau finding F-032 (P2)** — index orphelin `invitedBy_1_email_1` UNIQUE, plus strict
que l'index métier du schéma : empêche d'inviter la même adresse pour deux événements
différents. **Non corrigé dans ce lot** (hors autorisation), à décider séparément.
