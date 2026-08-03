# Lot 3 — Phase A : Dry-run migration Event Access V2

> **Aucune écriture en base n'a été effectuée.** Toutes les opérations de cette phase sont
> en lecture seule (dry-run officiel + analyse dérivée + comparaisons en mémoire).
> **Arrêt en fin de rapport — approbation explicite requise avant la Phase B.**
>
> Date : 2026-08-02 · Base ciblée : **`elintys-dev`** · Base `elintys` (production) : **jamais touchée**.

---

## 1. Gardes d'environnement (vérifiées avant toute opération)

| Contrôle | Résultat |
|---|---|
| `ELINTYS_ENV` | **`dev`** ✓ |
| `NODE_ENV` | `development` ✓ |
| Base dans `MONGODB_URI` | **`elintys-dev`** (exactement) ✓ |
| Base connectée au runtime | `elintys-dev` (double garde dans les scripts) ✓ |
| Variable pointant vers `/elintys` | **1 ligne, commentée** (`.env:7`) — inactive ⚠️ |
| Clé Stripe | non-`sk_live` ✓ |
| Service de production utilisé | aucun ✓ |

> ⚠️ **Footgun signalé** : `.env:7` contient l'URI **production commentée**
> (`…/elintys`). Un simple décommentage ferait pointer tous les scripts sur la prod.
> Recommandation : supprimer cette ligne ou la déplacer hors du `.env`.

---

## 2. Sauvegarde (créée avant toute analyse)

`mongodump` étant absent de la machine, la sauvegarde utilise un dump **EJSON** via le
driver Node (types BSON préservés : `ObjectId`, `Date`).

| Élément | Valeur |
|---|---|
| Script | `src/scripts/backup-dev-database.ts` (`npm run backup:dev`) |
| Chemin | `Elintys-api/backups/elintys-dev-2026-08-02T21-29-07-147Z/` |
| Contenu | 16 collections · **61 documents** · 1 fichier JSON/collection |
| Intégrité | **SHA-256 par collection** + `manifest.json` + `manifest.sha256` |
| Index | sauvegardés dans `manifest.json` |
| Garde | refuse toute base ≠ `elintys-dev` |
| Git | `backups/` ajouté au `.gitignore` |

Volumétrie clé : `events` **12**, `users` 26, `vendorprofiles` 10, `venueprofiles` 10,
`invitations` 1, `vendorrequests` 2 — le reste à 0.

### Procédure de restauration
```bash
# 1. Vérifier l'intégrité du dump
cd Elintys-api/backups/elintys-dev-<timestamp>
shasum -a 256 -c manifest.sha256          # manifest intact
# comparer chaque collection au sha256 listé dans manifest.json

# 2. Restaurer une collection (EJSON → Mongo), base elintys-dev uniquement
#    (à exécuter avec un script de restore dédié, EJSON.parse + insertMany,
#     après drop explicite de la collection cible)
```
> Un script `restore:dev` **n'a pas été créé** : il impliquerait du code d'écriture,
> hors périmètre de la Phase A. Il sera fourni en Phase B si la migration est approuvée.
> Le rollback natif de la migration (§8) suffit pour ce lot.

---

## 3. Inventaire des données (`elintys-dev`, collection `events`)

| Mesure | Valeur |
|---|---|
| Total événements | **12** |
| `accessModelVersion` = 2 | **1** |
| `accessModelVersion` absent (legacy) | **11** |
| `accessModelVersion` présent mais ≠ 2 | **0** ✓ (aucun document orphelin) |
| `visibility` présent | 12 (100 %) |
| `accessRules` présent | 1 (valeur `null`) |
| `accessPolicy` présent (V2) | 1 |
| `visibility = private` | **0** |
| `visibility = invite_only` | **0** |
| `accessRules.accessCode` = true | **0** |
| `accessRules.allowedEmailDomain` renseigné | **0** |
| `accessRules.manualApproval` = true | **0** |

Statuts : 10 `published`, 2 `draft`.

---

## 4. Résultats du dry-run

### 4.1 Dry-run officiel (`npm run event-access:migrate`)
```json
{ "mode": "dry-run", "total": 11, "mapping": { "public": 11, "private": 0, "invite_only": 0 },
  "migratable": 11, "ambiguous": 0, "ambiguousEvents": [] }
```

### 4.2 Classement détaillé (analyse dérivée, réutilise `planEventAccessMigration`)

| Classification | Nombre |
|---|---|
| Déjà V2 | **1** |
| Legacy migrable automatiquement | **11** |
| Migrable avec adaptation | 0 |
| Ambigu / intervention humaine | **0** |
| Bloqué | **0** |
| Incohérent | **0** |

### 4.3 Détail par document (11 documents concernés)

Les 11 documents partagent **exactement le même mapping** :

| Champ | Avant | Après (proposé) |
|---|---|---|
| `visibility` | `public` | *(inchangé, conservé)* |
| `accessRules` | absent | *(inchangé)* |
| `accessModelVersion` | absent | **2** |
| `discoverability` | absent | **`public`** |
| `accessPolicy` | absent | **`{ type: "open" }`** |
| `admissionModes` | absent | **`["registration_only"]`** |

**Raison du mapping** : `visibility="public"` → branche directe du script. **Risque : faible.**

| # | eventId | Titre | Statut |
|---|---|---|---|
| 1 | `6a6c53c2983ea5278d346626` | Sommet Innovation Montréal | published |
| 2 | `6a6c53c2983ea5278d346627` | Gala Horizon | published |
| 3 | `6a6c53c2983ea5278d346628` | Atelier Marques Vivantes | published |
| 4 | `6a6c53c2983ea5278d346629` | Nuits du Canal | published |
| 5 | `6a6c53c2983ea5278d34662a` | Réseautage sur les toits | published |
| 6 | `6a6c53c2983ea5278d34662b` | Festival des Rives — brouillon | draft |
| 7 | `6a6d31b4983ea5278d347897` | Mariage au Jardin | published |
| 8 | `6a6d31b4983ea5278d347898` | Festival Créatif Québec | published |
| 9 | `6a6d31b4983ea5278d347899` | Forum Leadership Responsable | published |
| 10 | `6a6d31b4983ea5278d34789a` | Anniversaire Studio 360 | published |
| 11 | `6a6d31b5983ea5278d34789b` | Expo Nouvelles Voix | published |

**Déjà V2 (non touché)** : `6a6e274caf71aa3057b7a1c8` — « Gala annuel Elintys » (draft,
`accessModelVersion: 2`). La requête de migration (`accessModelVersion: { $ne: 2 }`)
l'exclut, et l'opération est **idempotente**.

---

## 5. Documents ambigus / bloqués

**Aucun en `elintys-dev`.** Les deux causes d'ambiguïté prévues par le script ne sont
déclenchées par aucune donnée locale :
- `ACCESS_CODE_MISSING_RAW_VALUE` — événement legacy avec `accessCode: true` : le code brut
  n'existe plus (seul un hash pourrait être produit) → non migrable automatiquement.
- `PRIVATE_INTENT_UNDETERMINED` — `visibility: private` sans aucune règle d'accès.

> Ces deux cas **existeront potentiellement en production** (7 événements legacy y ont été
> observés lors de l'audit initial). **La distribution prod n'a pas été ré-inspectée**
> (base intouchable) : elle devra l'être avant toute exécution hors dev.

---

## 6. Vérifications transverses demandées

### 6.1 Champs legacy `visibility` / `accessRules`
La migration **ne supprime pas** les champs legacy : `visibility` reste présent sur les
12 documents. C'est **volontaire et favorable au rollback**, mais crée une double source de
vérité à nettoyer dans un lot ultérieur.

### 6.2 Compatibilité routes public / unlisted / private — **✅ aucune régression**
Les lectures utilisent un `$or` rétro-compatible à deux branches
(`events.service.ts:91-92,118-119,132-133,239-240`, `discovery.service.ts:17-18`) :
```js
{ discoverability: 'public' }                                   // ← V2
{ accessModelVersion: { $exists: false }, visibility: 'public' } // ← legacy
```
Chaque document bascule **atomiquement** de la branche legacy vers la branche V2 →
**aucune fenêtre d'invisibilité** pendant la migration. De plus, aucun document n'a
`accessModelVersion` ≠ 2 (§3), donc **aucun risque d'orphelin** ne correspondant à aucune
branche.

### 6.3 Cohérence sitemap / catalogue / discovery / SEO — **⚠️ amélioration attendue**
`Elintys-web/src/app/sitemap.ts:18` filtre `event.discoverability === 'public'`.
Les 11 événements legacy **n'ayant pas ce champ sont aujourd'hui absents du sitemap**, bien
que publiés et servis par l'API. **La migration les réintègre au sitemap** (11 URL
supplémentaires indexables). Effet **positif**, mais c'est un **changement SEO à annoncer**
(nouvelle indexation). → nouveau finding **F-030**.

### 6.4 Index liés aux tokens — **⚠️ anomalie confirmée (F-025 aggravé → F-028)**
`invitations.token_1` est **`unique: true`, `sparse: false`**, alors que le champ `token`
est optionnel et que `invitations.service.ts:52-61` crée les invitations avec `tokenHash` +
`tokenPrefix` **sans jamais poser `token`**.
- Conséquence : chaque nouvelle invitation indexe `token: null` ; la **2ᵉ** provoquera un
  **E11000**.
- Aggravant : le `catch` (ligne 62-67) traduit tout code 11000 en
  **`INVITATION_ALREADY_SENT`** → **message trompeur** masquant le vrai défaut.
- État actuel : 1 invitation en base, **qui possède** un `token` → collision **pas encore**
  matérialisée.
- Lien avec ce lot : la migration mappe `invite_only` → `INVITATION_TOKEN` + admission
  `INVITATION`. Les événements ainsi migrés dépendraient d'une fonctionnalité défaillante.
- **Reproduction empirique non effectuée** (elle exigerait une écriture — interdite en
  Phase A). Preuve statique : index live + code source.

### 6.5 Projections publiques / secrets en clair — **✅ conforme**
- Le code d'accès est stocké **hashé** (`accessPolicy.codeHash`, bcrypt rounds 12 —
  `event-access.service.ts:85`) ; **aucun secret en clair**.
- `codeHash` est en `select: false` : lecture explicite requise
  (`+accessPolicy.codeHash`), et la liste publique l'exclut (`-__v -accessPolicy.codeHash`,
  `events.service.ts:244`).
- `codeHash` **n'est jamais référencé côté frontend**.
- Les tokens d'invitation restent `sha256(randomBytes(32))`, jamais stockés en clair.

### 6.6 Régression invitations / codes / domaines
- **Codes** : aucun événement dev n'utilise `accessCode` → aucun impact.
- **Domaines** : aucun `allowedEmailDomain` en dev → aucun impact. La normalisation
  (`normalizeDomain`) est identique entre migration et runtime ✓.
- **Invitations** : aucune régression *causée par la migration*, mais le défaut **F-028**
  préexistant doit être corrigé avant de s'appuyer sur les modes invitation.

---

## 7. Combinaisons métier testées (en mémoire, sans DB)

### 7.1 Validation des cibles V2 — **8/8 valides** ✓
| Combinaison | Résultat |
|---|---|
| public + open | ✅ valide |
| public + registration_required | ✅ valide |
| public + email_domain | ✅ valide |
| public + paid_ticket + invitation | ✅ valide |
| unlisted + access_code | ✅ valide |
| unlisted + invitation_token | ✅ valide |
| private + manual_approval | ✅ valide |
| private + guest_list | ✅ valide |
| *(contrôle négatif)* access_code sans `codeHash` | ⛔ rejeté `ACCESS_CODE_REQUIRED` ✓ |
| *(contrôle négatif)* private + open | ⛔ rejeté `PRIVATE_EVENT_REQUIRES_RESTRICTION` ✓ |

### 7.2 🔴 Migration vs normalisation runtime — **4 divergences / 9 cas**

| Cas legacy | Migration (persisté) | Runtime (`normalizeLegacyEventAccess`) | Verdict |
|---|---|---|---|
| `public` / absent | public / open / registration_only | idem | ✅ |
| `invite_only` | unlisted / invitation_token / invitation | idem | ✅ |
| `private` + manualApproval | private / manual_approval | idem | ✅ |
| `private` + allowedEmailDomain | unlisted / email_domain | idem | ✅ |
| `private` + accessCode | **AMBIGU** (non migré) | private / registration_required | ⚠️ bénin |
| `private` seul | **AMBIGU** (non migré) | private / registration_required | ⚠️ bénin |
| `private` + accessCode + manualApproval | **AMBIGU** (non migré) | private / manual_approval | ⚠️ bénin |
| **`private` + manualApproval + allowedEmailDomain** | **`unlisted` / email_domain** | **`private` / manual_approval** | 🔴 **RÉGRESSION** |

**🔴 Divergence critique** : lorsqu'un événement legacy cumule `manualApproval` **et**
`allowedEmailDomain`, l'ordre de priorité diffère (migration teste le domaine avant
l'approbation — `migrate-event-access-v2.ts:67` vs `event-access.policy.ts:72`).
Migrer un tel document **dégrade `private` → `unlisted`** et **supprime l'exigence
d'approbation manuelle** : l'événement devient atteignable par lien direct.
→ nouveau finding **F-027 (P1 en production)**.

**Exposition en `elintys-dev` : 0 document** (0 `private`, 0 `manualApproval`,
0 `allowedEmailDomain`). **La migration dev est donc sûre.** Le risque concerne
exclusivement une exécution future sur des données réelles.

---

## 8. Changements proposés, index, risques

### Changements proposés (Phase B, dev uniquement)
`$set` sur **11 documents** : `accessModelVersion: 2`, `discoverability: "public"`,
`accessPolicy: { type: "open" }`, `admissionModes: ["registration_only"]`.
Aucune suppression de champ, aucun autre document touché.

### Index — **aucune modification requise pour ce lot**
Les deux index composés coexistent :
`eventType_1_status_1_visibility_1` (legacy) et `eventType_1_status_1_discoverability_1` (V2).
Après migration, le premier devient progressivement inutile mais reste **inoffensif**.
> Conformément au `CLAUDE.md` API (« ne jamais supprimer d'index MongoDB existants »),
> **aucune suppression n'est proposée ici**. À traiter séparément, avec validation.
> L'index `invitations.token_1` (F-028) relève d'un correctif distinct, **hors Lot 3**.

### Risques
| Risque | Niveau | Mitigation |
|---|---|---|
| Divergence mapping (F-027) | 🔴 P1 **en prod** · 🟢 nul en dev | 0 document exposé en dev ; corriger l'ordre avant tout usage prod |
| Écrasement de champs V2 partiels | 🟢 nul | 0 document incohérent détecté |
| Fenêtre d'invisibilité catalogue | 🟢 nul | `$or` rétro-compatible, bascule atomique |
| Perte de données | 🟢 faible | backup + rollback natif ; champs legacy conservés |
| Changement SEO (F-030) | 🟡 P3 | 11 URL ajoutées au sitemap — effet voulu, à annoncer |
| Script sans garde d'env (F-029) | 🟡 P2 | exécuter uniquement avec `.env` vérifié (§1) |

---

## 9. Plan de rollback

1. **Rollback natif** — la migration écrit, *avant* toute écriture, un fichier
   `event-access-v2-rollback-<timestamp>.json` (mode `wx`, `0600`) contenant pour chaque
   document : `_id`, `visibility`, `accessRules`, `accessModelVersion` d'origine.
2. **Réversibilité simple** — les 11 documents étant tous identiques et sans champs V2
   préalables, le rollback consiste à `$unset` les 4 champs ajoutés :
   ```
   $unset: { accessModelVersion: "", discoverability: "", accessPolicy: "", admissionModes: "" }
   ```
   Les champs legacy (`visibility`) n'ayant jamais été modifiés, l'état d'origine est
   intégralement restauré et le `$or` rétro-compatible reprend la branche legacy.
3. **Filet de sécurité** — restauration depuis le backup §2 (checksums vérifiables).

---

## 10. Commandes exactes (Phase B — **à n'exécuter qu'après approbation**)

```bash
cd Elintys-api

# 0. Re-vérifier les gardes (doit afficher elintys-dev)
node -e "const u=require('fs').readFileSync('.env','utf8').match(/^MONGODB_URI=(.*)$/m)[1];console.log(new URL(u.trim()).pathname)"

# 1. Nouvelle sauvegarde juste avant écriture
npm run backup:dev

# 2. Dry-run de confirmation (doit afficher migratable=11, ambiguous=0)
npm run event-access:migrate

# 3. MIGRATION RÉELLE (double confirmation exigée par le script)
npx ts-node src/scripts/migrate-event-access-v2.ts --execute --confirm-access-v2

# 4. Contrôle post-migration
npx ts-node src/scripts/analyze-event-access-v2.ts   # attendu : DEJA_V2 = 12
```

---

## 11. Tests à exécuter après migration

**Base**
- `accessModelVersion: { $ne: 2 }` → **0 document**.
- Les 11 `eventId` listés en §4.3 portent bien les 4 champs V2.
- Aucun document perdu : `events` = **12**.

**Backend**
- `npm test` (attendu : 348 tests verts, aucune régression).
- `GET /api/v1/events?page=1&limit=12` → les 10 publiés toujours listés.
- `GET /api/v1/discovery/events` et `/discovery/featured` → inchangés.
- `GET /api/v1/events/slug/:slug` → 200 sur un événement migré.
- `GET /api/v1/events/:id` (anonyme) → comportement identique avant/après.

**Frontend**
- `/evenements` (catalogue public) → même nombre de cartes.
- Page événement publique → rendu identique.
- **Sitemap** : `/sitemap.xml` doit désormais contenir **11 URL d'événements
  supplémentaires** (F-030) — vérifier qu'aucun `draft` n'y figure.

**Non-régression accès**
- Aucun événement `private`/`unlisted` en dev : rien à vérifier côté restriction.
- Rejouer les 8 combinaisons V2 (§7.1) après migration.

---

## 12. Nouveaux findings issus de cette phase

| ID | Sévérité | Titre |
|---|---|---|
| **F-027** | **P1** (prod) / P3 (dev) | Divergence mapping migration ⇄ runtime : `private+manualApproval+allowedEmailDomain` dégradé en `unlisted`, approbation manuelle perdue |
| **F-028** | **P1** | `invitations.token_1` UNIQUE non-sparse + `create()` ne pose pas `token` → E11000 à la 2ᵉ invitation, masqué en `INVITATION_ALREADY_SENT` (aggrave F-025) |
| **F-029** | P2 | `migrate-event-access-v2.ts` n'a **aucune garde d'environnement** — exécutable sur n'importe quelle base, y compris la production |
| **F-030** | P3 | 11 événements publiés absents du sitemap (filtre `discoverability === 'public'` sur données legacy) — corrigé par la migration |
| **F-031** | P2 | URI **production commentée** dans `.env:7` — décommentage accidentel = accès prod |

---

## 13. Verdict Phase A

**La migration de `elintys-dev` est SÛRE et recommandée** : 11 documents, mapping unique et
déterministe (`public → open`), **identique à la normalisation runtime**, 0 ambigu,
0 bloqué, 0 incohérent, rétro-compatibilité des lectures démontrée, rollback natif +
sauvegarde vérifiée.

**Deux réserves à traiter avant toute exécution en production** (sans objet pour dev) :
- **F-027** — corriger l'ordre de priorité du mapping.
- **F-029** — ajouter une garde d'environnement au script de migration.

⏸️ **ARRÊT — approbation explicite requise avant la Phase B (migration réelle).**

---
---

# Phase A′ — Correctifs F-027 / F-029 / F-031 et nouveau dry-run

> Validé le 2026-08-02. **Toujours aucune écriture en base** : seuls du code, des tests et
> une nouvelle sauvegarde ont été produits. Base inchangée (vérifiée en fin de section).

## 14. Correctif F-027 — mapper unique partagé

### Principe retenu
La logique legacy → V2 était **dupliquée** (script de migration + normalisation runtime),
avec un ordre de priorité divergent. Elle est désormais **centralisée dans une fonction pure
unique**, `mapLegacyEventAccessToV2`, définie dans `src/modules/events/event-access.policy.ts`
et **consommée par les trois usages** :

| Consommateur | Utilisation |
|---|---|
| Runtime | `normalizeLegacyEventAccess` → `resolveLegacyAccessShape` → `mapLegacyEventAccessToV2` |
| Migration | `planEventAccessMigration` délègue **entièrement** au mapper |
| Tests | `migrate-event-access-v2.spec.ts` compare les deux sorties |

**Il ne reste aucune seconde implémentation de la logique legacy.** Le script de migration
ne contient plus aucune branche de mapping (son `normalizedDomain` local, devenu mort, a été
supprimé).

### Contrat de sortie
Le mapper retourne un résultat discriminé, ce qui permet de distinguer *décider* et *persister* :
- `{ status: 'mapped', value }` → intention déterminée, **persistable**.
- `{ status: 'ambiguous', reason, fallback }` → intention indéterminable : la migration
  **ne persiste pas**, et `fallback` décrit le comportement runtime appliqué en attendant.

> Conséquence : le **résultat d'accès effectif est identique dans 100 % des cas** entre
> migration et runtime. La seule différence est la *décision d'écrire*, jamais la sémantique
> — c'est précisément ce qui empêche une divergence future.

### Priorité corrigée (restriction la plus forte d'abord)
1. `visibility` absent / `public` → `public` + `open`
2. `invite_only` → `unlisted` + `invitation_token`
3. sinon (`private`) :
   - `accessCode` → **ambigu** (`ACCESS_CODE_MISSING_RAW_VALUE`) — le code brut est
     irrécupérable, on refuse de perdre silencieusement l'exigence
   - **`manualApproval` → `private` + `manual_approval`** ← *prioritaire (correctif)*
   - `allowedEmailDomain` → `unlisted` + `email_domain`
   - sinon → **ambigu** (`PRIVATE_INTENT_UNDETERMINED`)

### Régression F-027 fermée — preuve
| Cas | Avant (buggé) | Après |
|---|---|---|
| `private + manualApproval + allowedEmailDomain` | `unlisted` / `email_domain` ❌ | **`private` / `manual_approval`** ✅ |

Test dédié : *« devrait conserver private + manual_approval quand manualApproval ET
allowedEmailDomain coexistent »*, avec assertions négatives explicites
(`not.toBe(UNLISTED)`, `not.toBe(EMAIL_DOMAIN)`).

### Tests ajoutés (`src/scripts/migrate-event-access-v2.spec.ts`)
- **11 combinaisons legacy** couvertes : `public`, `visibility` absente, `invite_only`,
  `private` seul, `private+accessCode`, `private+allowedEmailDomain`,
  `private+manualApproval`, `private+accessCode+manualApproval`,
  `private+allowedEmailDomain+manualApproval`, `private+accessCode+allowedEmailDomain`,
  `private+accessRules` vide.
- **11 tests d'équivalence** : pour *chaque* combinaison, la forme effective côté migration
  est comparée champ par champ (`discoverability`, `accessPolicy`, `admissionModes`) à
  `normalizeLegacyEventAccess`. → **preuve mécanique d'équivalence à 100 %**.
- Normalisation du domaine identique des deux côtés (`'  @Elintys.CA '` → `elintys.ca`).
- Un événement déjà V2 n'est pas retouché.

## 15. Correctif F-029 — garde d'environnement

Ajout de `assertEventAccessMigrationAllowed()` (fonction pure exportée, donc testable) et
d'`extractDatabaseName()`, appelées **avant toute connexion**, plus une **seconde garde après
connexion** sur `database.databaseName`.

Refus explicites : environnement ≠ `dev`, URI absente, URI invalide, URI **sans nom de base**,
base `elintys` (production), toute base inconnue. `--execute` exige désormais **trois**
conditions : flag `--confirm-access-v2` **+** environnement valide **+** nom réel de la base
validé après connexion.

### Preuve runtime (refus levés *avant* toute connexion)
| Scénario | Résultat observé |
|---|---|
| `ELINTYS_ENV=prod` | `MIGRATION_REFUSED: ELINTYS_ENV must be exactly "dev".` |
| URI vers `/elintys` | `MIGRATION_REFUSED: database must be exactly "elintys-dev" (received "elintys").` |
| URI sans nom de base | `MIGRATION_REFUSED: MONGODB_URI must name an explicit database.` |
| `--execute` sans confirmation | `MIGRATION_REFUSED: add --confirm-access-v2 …` |
| Config dev normale | `"mode": "dry-run"` ✅ |

### Tests ajoutés — 8 cas
dev+elintys-dev autorisé · prod+elintys-dev refusé · dev+elintys refusé · URI absente refusée ·
URI sans base refusée · URI invalide refusée · base inconnue refusée · extraction du nom de base.

## 16. Correctif F-031 — footgun URI production

- La ligne **commentée** contenant l'URI de production a été **supprimée** de
  `Elintys-api/.env`. Il ne reste qu'une seule ligne `MONGODB_URI`, pointant sur `elintys-dev`.
- **Aucun secret déplacé dans un fichier versionné.**
- Balayage effectué sur `.env`, `.env.local`, `.env.example`, `src/`, `test/`, `docs/`,
  `render.yaml`, fixtures et backups : **aucune URI de production réelle**. Les occurrences
  restantes sont des fixtures de test sur `example.mongodb.net` (hôte fictif, sans
  identifiants) dans `seed-development.spec.ts`, qui servent justement à tester le refus.
- Le `manifest.json` des sauvegardes ne stocke que l'**hôte** du cluster, jamais les
  identifiants.

> **Réserve résiduelle (non corrigée ici)** : `Elintys-api/.env.example` propose encore
> `…/elintys` comme nom de base par défaut. Aucun secret n'y figure (placeholders
> `<user>:<password>`), mais ce défaut oriente vers la production. Modifier ce fichier impose,
> selon le `CLAUDE.md` de l'API, de mettre à jour la documentation en même temps → **renvoyé
> au Lot 7**.

## 17. Nouveau dry-run — comparaison avant/après

### Gates de vérification
| Gate | Résultat |
|---|---|
| Tests ciblés (migration + policy) | **36 tests verts** |
| Suite complète API | **381 tests verts / 41 suites** (avant correctifs : 348) — **+33** |
| `nest build` | ✅ exit 0 |
| `npm run lint` | ✅ exit 0, 0 erreur / 0 avertissement |
| Nouvelle sauvegarde | `backups/elintys-dev-2026-08-02T21-55-17-525Z/` — 61 documents / 16 collections |

### Comparaison des dry-runs
| Mesure | Avant correctifs | Après correctifs | Écart |
|---|---|---|---|
| Total événements | 12 | **12** | — |
| Concernés (`accessModelVersion ≠ 2`) | 11 | **11** | — |
| Déjà V2 | 1 | **1** | — |
| Legacy migrables auto | 11 | **11** | — |
| Migrables avec adaptation | 0 | **0** | — |
| Ambigus | 0 | **0** | — |
| Bloqués | 0 | **0** | — |
| Incohérents | 0 | **0** | — |
| `discoverability` cible | `public` | **`public`** | — |
| `accessPolicy` cible | `{ type: "open" }` | **`{ type: "open" }`** | — |
| `admissionModes` cible | `["registration_only"]` | **`["registration_only"]`** | — |
| `accessModelVersion` cible | 2 | **2** | — |

✅ **Résultat strictement identique sur `elintys-dev`**, conforme à l'attendu. Les 11 documents
partagent toujours une combinaison unique (vérifié : une seule valeur distincte par champ).
Seul ajout au rapport natif : le champ `database` (`elintys-dev`), pour tracer la cible.

### État de la base après cette phase — **inchangé**
```
total events : 12   |   accessModelVersion=2 : 1   |   legacy (≠2) : 11
```
**Aucun document modifié, aucun index touché.**

## 18. F-028 — mini-plan de correction (à traiter séparément)

> **Non corrigé dans cette sous-phase** (élargirait le périmètre). F-028 doit être corrigé
> **avant** de considérer les modes `invitation_token` / `invitation` comme fonctionnels
> pour le MVP.

**Défaut** : `invitations.token_1` est `unique: true, sparse: false` alors que
`invitations.service.ts:52-61` crée les documents sans champ `token`. La 2ᵉ nouvelle
invitation indexe un second `null` → **E11000**, que le `catch` (l. 62-67) traduit en
`INVITATION_ALREADY_SENT` — message trompeur masquant la cause réelle.

**Migration d'index nécessaire**
1. Vérifier qu'aucun document utile ne dépend du champ legacy `token` (dev : 1 document le
   possède ; le code ne le lit plus, il utilise `tokenHash`).
2. `$unset` du champ `token` legacy sur les documents concernés (avec sauvegarde préalable).
3. Supprimer l'index `token_1` **et** le champ `token` du schéma, `tokenHash_1` (déjà unique)
   restant la seule contrainte d'unicité.
   *Alternative moins invasive si la suppression est refusée : recréer `token_1` en `sparse`.*
   > La suppression d'index est interdite par le `CLAUDE.md` API sans consultation :
   > **validation explicite requise**.

**Comportement attendu après correction**
- Créer *n* invitations vers des destinataires différents réussit, sans collision.
- Une vraie tentative de doublon (même `invitedBy` + `email` [+ `eventId` + `type`]) renvoie
  toujours `INVITATION_ALREADY_SENT` via les index métier dédiés.

**Correction du message trompeur** : ne plus mapper `11000` en aveugle. Inspecter
`error.keyPattern` / `error.message` et ne renvoyer `INVITATION_ALREADY_SENT` que pour les
index métier (`invitedBy_1_email_1`, `invitedBy_1_email_1_eventId_1_type_1`) ; toute autre
collision doit remonter une erreur distincte et être journalisée.

**Tests à ajouter**
- **Créer au moins deux invitations** vers deux adresses différentes → les deux réussissent
  (test de non-régression direct du défaut).
- Doublon réel → `INVITATION_ALREADY_SENT`.
- Collision sur un index non métier → **pas** de `INVITATION_ALREADY_SENT`.
- Test d'intégration avec `mongodb-memory-server` reproduisant les index réels.

**Rollback** : sauvegarde préalable de `invitations` (script `backup:dev` existant) ;
en cas de problème, recréer l'index `token_1` depuis `manifest.json` (les définitions
d'index y sont sauvegardées) et restaurer la collection.

## 19. Statut des findings après cette sous-phase

| Finding | Sévérité | Statut |
|---|---|---|
| **F-027** | P1 | ✅ **Corrigé** — mapper unique partagé + 11 tests d'équivalence |
| **F-029** | P2 | ✅ **Corrigé** — garde double + 8 tests + preuve runtime |
| **F-031** | P2 | ✅ **Corrigé** — URI prod commentée supprimée, balayage complet |
| **F-028** | P1 | ⏳ **Ouvert** — mini-plan §18, à traiter avant les modes invitation |
| F-030 | P3 | ⏳ Ouvert — sera résolu par la migration (effet SEO positif) |
| `.env.example` → `/elintys` | P3 | ⏳ Renvoyé au Lot 7 (doc à mettre à jour conjointement) |

## 20. Verdict Phase A′

Les trois correctifs demandés sont livrés, testés et prouvés au runtime. Le nouveau dry-run
sur `elintys-dev` est **strictement identique** à l'attendu : **12 événements, 1 déjà V2,
11 legacy auto, 0 ambigu, 0 bloqué, 0 incohérent**, mapping inchangé. La base n'a subi
**aucune modification**.

⏸️ **ARRÊT — migration réelle non lancée. Approbation explicite requise pour la Phase B.**
