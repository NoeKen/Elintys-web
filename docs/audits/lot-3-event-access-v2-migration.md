# Lot 3 — Phase B : Migration réelle Event Access V2

> Exécutée le 2026-08-02 sur **`elintys-dev`** uniquement. La base de production **`elintys`
> n'a jamais été touchée** (ni lue, ni écrite, pendant cette phase).
> **Aucune anomalie détectée — le rollback n'a pas été déclenché.**

---

## 1. Base ciblée et gardes pré-exécution

| Contrôle | Résultat |
|---|---|
| `ELINTYS_ENV` | **`dev`** ✓ |
| `NODE_ENV` | `development` ✓ |
| Base dans `MONGODB_URI` | **`elintys-dev`** ✓ |
| Ligne `MONGODB_URI` pointant vers `/elintys` | **aucune** ✓ |
| URI de production commentée résiduelle | **aucune** ✓ (supprimée en Phase A′) |
| Clé Stripe | non-`sk_live` ✓ |
| Ressource de production utilisée | **aucune** ✓ |

Gardes applicatives actives pendant l'exécution (F-029) : refus avant connexion si
environnement ≠ `dev`, URI absente/invalide/sans base, base ≠ `elintys-dev` ; puis seconde
vérification du nom réel de la base après connexion ; enfin `--confirm-access-v2` obligatoire.

## 2. Sauvegarde pré-écriture

| Élément | Valeur |
|---|---|
| Chemin | `Elintys-api/backups/elintys-dev-2026-08-02T22-05-28-527Z/` |
| Horodatage | `2026-08-02T22:05:31.998Z` |
| Contenu | **16 collections · 61 documents** (dont `events` = 12) |
| Format | dump **EJSON** (types BSON préservés : `ObjectId`, `Date`) |
| Manifeste | `manifest.json` + `manifest.sha256` |
| Index | définitions des **16 collections** sauvegardées dans le manifeste |
| **Vérification d'intégrité** | `shasum -c manifest.sha256` → **OK** ; **16/16 collections** recalculées et conformes, **0 corrompue** |

## 3. Dry-run final de confirmation

```json
{ "mode": "dry-run", "database": "elintys-dev", "total": 11,
  "mapping": { "public": 11, "private": 0, "invite_only": 0 },
  "migratable": 11, "ambiguous": 0, "ambiguousEvents": [] }
```

| Attendu | Observé |
|---|---|
| total événements : 12 | **12** ✓ |
| déjà V2 : 1 | **1** ✓ |
| legacy auto : 11 | **11** ✓ |
| ambigu : 0 | **0** ✓ |
| bloqué : 0 | **0** ✓ |
| incohérent : 0 | **0** ✓ |

## 4. Commande exécutée

```bash
npx ts-node src/scripts/migrate-event-access-v2.ts --execute --confirm-access-v2
```

**Sortie :**
```json
{ "mode": "execute", "database": "elintys-dev", "total": 11,
  "mapping": { "public": 11, "private": 0, "invite_only": 0 },
  "migratable": 11, "ambiguous": 0, "ambiguousEvents": [],
  "migrated": 11,
  "rollbackFile": "event-access-v2-rollback-2026-08-02T22-06-27-382Z.json" }
```
Code de sortie : **0**.

## 5. Documents migrés

**11 documents**, tous avec le même mapping :

| Champ | Avant | Après |
|---|---|---|
| `accessModelVersion` | *(absent)* | **2** |
| `discoverability` | *(absent)* | **`public`** |
| `accessPolicy` | *(absent)* | **`{ type: "open" }`** |
| `admissionModes` | *(absent)* | **`["registration_only"]`** |
| `visibility` | `public` | **`public`** *(conservé)* |

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

**Non touché** : `6a6e274caf71aa3057b7a1c8` — « Gala annuel Elintys » (déjà V2), exclu par la
requête `accessModelVersion: { $ne: 2 }`.

## 6. État avant / après

| Mesure | Avant | Après |
|---|---|---|
| `events` total | 12 | **12** ✓ |
| `accessModelVersion = 2` | 1 | **12** ✓ |
| Legacy restant (`≠ 2`) | 11 | **0** ✓ |
| Documents avec `visibility` | 12 | **12** ✓ *(conservé)* |
| Documents avec `accessRules` | 1 | **1** ✓ *(conservé)* |

### Contrôles d'intégrité post-migration
| Contrôle | Résultat |
|---|---|
| Aucun événement perdu | ✓ 12 → 12 |
| Aucun document dupliqué | ✓ 0 |
| Aucun document partiellement migré | ✓ 0 (aucun `accessModelVersion=2` sans les 3 champs) |
| Les 11 migrés conformes au mapping cible | ✓ **11/11** |
| Événement déjà-V2 **strictement inchangé** | ✓ identique octet à octet (comparaison EJSON au backup) |
| Aucun champ supprimé sur aucun document | ✓ 0 |
| `visibility` conservé à l'identique | ✓ 12 documents |
| `accessRules` conservé quand présent | ✓ 1 document |

> Conformément à la consigne, **aucun champ legacy n'a été supprimé** et **aucun index n'a été
> modifié ou supprimé**.

## 7. Tests de non-régression

### Backend
| Test | Résultat |
|---|---|
| Suite complète | **381 tests verts / 41 suites** (identique à l'avant-migration) |
| `nest build` | ✅ exit 0 |
| `npm run lint` | ✅ exit 0 |
| Analyse Event Access V2 | **`{ "DEJA_V2": 12 }`** — plus aucun legacy |
| Tests des policies (`event-access.policy.spec`) | ✅ inclus dans la suite |
| Tests mapping public / unlisted / private | ✅ 11 combinaisons + 11 tests d'équivalence |
| Tests invitations / codes / domaines | ✅ inclus dans la suite, aucun échec |

### Frontend
| Page | Résultat |
|---|---|
| `/` (landing) | 200 ✓ |
| `/evenements` (catalogue public) | 200 ✓ — 10 événements rendus |
| `/evenements/sommet-innovation-montreal-demo` | 200 ✓ — titre correctement rendu |
| `/prestataires` | 200 ✓ |
| `/lieux` | 200 ✓ |
| Rendu des événements migrés | **inchangé** ✓ |

## 8. Résultats API

| Endpoint | Code | Observation |
|---|---|---|
| `GET /health` | 200 | ✓ |
| `GET /events?page=1&limit=20` (listing public) | 200 | **total = 10** (les 10 publiés) |
| `GET /discovery/events` | 200 | 10 résultats |
| `GET /discovery/featured` | 200 | ✓ |
| `GET /events/slug/:slug` | 200 | `public` / `{"type":"open"}` / `["registration_only"]` / **v2** |
| `GET /events/my` (propriétaire) | 200 | ✓ |
| `POST /events` (création) | 201 | nouvel événement **nativement V2** |
| `GET /events/:id/publish-readiness` | 200 | erreurs métier correctes (`EVENT_TYPE_REQUIRED`, `START_DATE_REQUIRED`) |
| `GET /events/:id` (lecture propriétaire) | 200 | ✓ |
| `DELETE /events/:id` (nettoyage du test) | 204 | ✓ |

**Sécurité** : `codeHash` **absent** de la réponse publique ✓.

## 9. Sitemap

| Contrôle | Avant | Après |
|---|---|---|
| URLs totales | 4 (statiques) | **14** |
| URLs d'événements | **0** | **10** ✓ |
| Brouillons présents | — | **AUCUN** ✓ |
| Événements privés / non répertoriés | — | **AUCUN** ✓ (aucun n'existe en dev) |

Les 10 événements publiés apparaissent désormais. Les 2 brouillons
(`festival-rives-draft-demo`, `gala-annuel-elintys`) sont **correctement exclus** bien qu'ils
possèdent un slug. → **F-030 résolu** : ces 10 événements étaient invisibles au SEO faute de
champ `discoverability`.

## 10. Rollback natif

| Élément | Valeur |
|---|---|
| Fichier | `event-access-v2-rollback-2026-08-02T22-06-27-382Z.json` |
| Permissions | **`-rw------- (600)`** ✓ (écrit en mode `wx`, pas d'écrasement possible) |
| Documents | **11** — correspondance exacte avec les 11 `_id` migrés ✓ |
| Contenu | `_id`, `visibility` (`"public"`), `accessModelVersion` d'origine (`null`) |
| Procédure testée | **en lecture / simulation uniquement — non exécutée** ✓ |

> **Note de lecture** : le fichier ne matérialise pas les clés `accessRules` et
> `accessModelVersion` pour ces 11 documents, car elles étaient **absentes** avant migration
> (`JSON.stringify` omet les valeurs `undefined`). C'est sémantiquement correct : restaurer
> consiste à `$unset` les 4 champs V2 ajoutés, ce qui rétablit exactement l'état d'origine.

**Procédure de rollback (non appliquée)** :
```js
// $unset des 4 champs ajoutés sur les 11 _id du fichier de rollback
{ $unset: { accessModelVersion: "", discoverability: "", accessPolicy: "", admissionModes: "" } }
```
Filet de sécurité complémentaire : restauration depuis le backup §2 (checksums vérifiés).

## 11. Anomalies

**Aucune.** Les 20 contrôles des étapes 5, 6, 8, 9 et 10 sont conformes. Le rollback n'a pas
été déclenché et la restauration depuis backup n'a pas été nécessaire.

*(Deux erreurs sont survenues pendant la vérification — variables shell non exportées vers
`process.env` dans mes commandes d'inspection. Elles n'ont affecté ni les données ni la
migration : les contrôles ont été rejoués correctement et sont tous verts.)*

## 12. Findings

| Finding | Sévérité | Statut |
|---|---|---|
| **F-016** — Access V2 : 11/12 événements legacy non migrés | P2 | ✅ **Fermé** — 12/12 en V2 |
| **F-030** — événements publiés absents du sitemap | P3 | ✅ **Fermé** — 10 URLs ajoutées, 0 brouillon |
| F-027 — divergence mapping migration ⇄ runtime | P1 | ✅ Fermé (Phase A′) |
| F-029 — migration sans garde d'environnement | P2 | ✅ Fermé (Phase A′) |
| F-031 — URI production commentée dans `.env` | P2 | ✅ Fermé (Phase A′) |
| **F-028** — index `invitations.token_1` unique non-sparse | **P1** | ⏳ **Ouvert** — mini-plan en §18 du rapport de dry-run |
| F-025 — index `token` legacy | P3 | ⏳ Ouvert (absorbé par F-028) |

## 13. Risques restants

1. **F-028 (P1)** — la 2ᵉ nouvelle invitation lèvera `E11000`, masqué en
   `INVITATION_ALREADY_SENT`. **Les modes `invitation_token` / `invitation` ne peuvent pas
   être considérés comme fonctionnels** tant que ce défaut n'est pas corrigé. Non traité dans
   cette phase, conformément à la consigne.
2. **Double source de vérité** — les champs legacy `visibility` / `accessRules` subsistent
   volontairement (rollback). Leur suppression et celle de l'index
   `eventType_1_status_1_visibility_1`, désormais inutile, restent à planifier **avec
   validation explicite** (le `CLAUDE.md` API interdit toute suppression d'index sans accord).
3. **Migration prod non préparée** — la distribution legacy de la base `elintys` n'a jamais
   été inspectée. Avant toute exécution hors dev : re-inspecter, et noter que la garde
   actuelle **refuse volontairement toute base ≠ `elintys-dev`** (elle devra être étendue de
   façon explicite et contrôlée).
4. **`.env.example`** propose encore `/elintys` comme base par défaut (placeholder sans
   secret) → renvoyé au **Lot 7** (doc à mettre à jour conjointement).
5. **Effet SEO** — 10 nouvelles URLs deviennent indexables ; changement souhaité mais à
   annoncer côté produit/marketing.

## 14. Verdict Phase B

✅ **Migration réussie et validée.** 11 documents migrés, 12/12 événements en Access V2,
aucun document perdu, dupliqué ou partiellement migré, champs legacy et index intégralement
préservés, aucune régression backend (381 tests) ni frontend, endpoints et sitemap conformes,
rollback disponible et vérifié.

⏸️ **Arrêt.** Aucun autre lot commencé, F-028 non corrigé, frontend non modifié.
En attente d'approbation pour la suite.
