# Sprint 3 — Vague corrective B : Contract & Security Hardening

**Branches** : `fix/s3-wave-b-contract-security-hardening` (API et Web)
**Base** : `origin/dev` — API `e03df89`, Web `31a97be`, **Vague A fusionnée** (PR #55 et #102, `MERGED`)
**Date** : 2026-09-07
**Périmètre** : B-01 → B-08 uniquement. Aucune Vague C, D ou E entamée.

---

## 1. Branche et base

Précondition vérifiée avant toute modification, pas supposée :

```
PR #55  (API) → MERGED, e03df896…
PR #102 (Web) → MERGED, 31a97be3…
origin/dev API → e03df89, marqueurs Wave A présents (Put('me'), PAYPAL_ENVIRONMENTS)
origin/dev Web → 31a97be, buildMobileNav et tabIndex présents
```

Les branches B partent de ce `dev`.

---

## 2. Régression burger mobile — reproduite et corrigée

**Statut : reproductible, corrigée.**

Cause : le layout du tableau de bord rendait `<Topbar />` **sans props**. Le
bouton menu appelle `onClick={onMenuClick}`, qui valait donc `undefined`. Sous
768 px la barre latérale est `hidden md:flex` : l'utilisateur cliquait sur un
menu qui ne pouvait rien ouvrir, et n'obtenait aucun retour.

Reproduction avant correction :

| Largeur | Burger visible | Clic | Dialogue ouvert |
|---|---|---|---|
| 320 px | oui | passe | **non** |
| 390 px | oui | passe | **non** |
| 768 px | non (`md:hidden`) | n/a | n/a — la barre latérale prend le relais, comportement correct |

Points vérifiés : clic/tap, clavier, focus, déclencheur, overlay, z-index,
`pointer-events`, hydratation, visibilité responsive, conflit avec la barre
inférieure. Aucun n'était en cause — seul le câblage manquait.

Correction, strictement limitée à ce défaut :
- l'état d'ouverture vit dans un fragment client dédié, pour que le layout
  reste un Server Component ;
- le tiroir est alimenté par `buildNavSections`, **la même source** que la
  barre latérale et la barre inférieure — aucune information de navigation
  redéfinie, aucun rôle retouché, aucun redesign ;
- le dialogue étant contrôlé, le bouton n'est pas un `Dialog.Trigger` et Radix
  ne pouvait pas rendre le focus à la fermeture (il retombait sur `<body>`) :
  la restitution est explicite via `onCloseAutoFocus`.

Test de régression : `e2e/functional/wave-b-mobile-menu.spec.ts` — 10 cas
(ouverture à 320/390, Escape + retour du focus, navigation clavier seule,
navigation puis fermeture, burger masqué à 1024, axe, absence de débordement).

---

## 3. Périmètre implémenté

| ID | Sujet | Statut |
|---|---|---|
| B-01 | Cohérence des autorisations ADMIN | ✅ |
| B-02 | Durcissement Discovery/Search | ✅ |
| B-03 | Références polymorphes | ✅ (avis ; favoris déjà traités en Vague A) |
| B-04 | Sémantique des erreurs HTTP | ✅ (surfaces B) |
| B-05 | Projections publiques | ✅ |
| B-06 | Validation DTO/params/query | ✅ (endpoints B) |
| B-07 | Contrats frontend ↔ API liés à B | ✅ |
| B-08 | Codes d'erreur métier stables | ✅ |

---

## 4. Matrice ADMIN (B-01)

38 routes annonçaient `@Roles(…, ADMIN)`. La plupart des services comparaient
ensuite les identifiants directement : le guard laissait passer, le service
opposait un 403. La route promettait une capacité qu'elle n'avait pas.

Chaque endpoint est tranché **explicitement**, sans introduire de moteur de
permissions.

### Issue A — ADMIN réellement autorisé

Alignés sur `canManageEvent`, la politique « propriétaire OU admin » **déjà
appliquée et livrée** sur les demandes d'accès, invitations, configuration
d'accès et scan de billets. Ce n'est donc pas une nouvelle décision produit :
c'est la politique existante, étendue aux routes qui l'ignoraient.

| Module | Méthodes alignées |
|---|---|
| events | `findOne`, `update`, `remove`, `publish`, `cancel`, `archive`, `restore`, `getPublishReadiness` |
| event-media | `uploadCover`, `deleteCover`, `uploadGallery`, `deleteGalleryImage` |
| guests | `create`, `bulkCreate`, `findAll`, `update`, `remove` |
| tickets | `createTicketType`, `findManagedTicketTypes`, `updateTicketType`, `removeTicketType` |
| vendors | `createRequest`, `listRequestsByEvent`, `cancelRequest` |
| payments | `refundTicket` |

### Issue B — ADMIN retiré

| Route | Raison |
|---|---|
| `POST /vendors`, `PUT /vendors/me` | Strictement personnelles : identité = `user.sub`. ADMIN n'apportait aucune capacité. |
| `POST /venues`, `PUT /venues/me` | Idem. |
| `PUT /vendors/:id`, `PUT /venues/:id` | Promettaient une modération de profil tiers qui n'existe nulle part dans le produit — aucun module admin, aucun rôle admin côté web — et que le service refusait de toute façon. |

### Sûreté de la manœuvre

Le paramètre `roles` est **optionnel et vaut `[]`**. Un appelant qui ne le
transmet pas obtient exactement l'ancien comportement : propriétaire strict.
Aucune route ne devient plus permissive par défaut, et un oubli de câblage
perd la capacité admin, jamais la protection. Le pattern reprend celui déjà
en place sur `venues.cancelBooking(bookingId, userId, roles = [])`.

Vérifié en live après correction : un organisateur tiers reste refusé en 403
sur `/events/:id`, `/events/:id/guests`, `/ticket-types/events/:id/manage` et
`/vendors/:id/requests` ; le propriétaire conserve son accès.

---

## 5. Discovery (B-02)

Cinq routes **publiques et anonymes** : leur coût est entièrement supporté par
le serveur. Trois défauts y étaient exploitables sans compte.

| Défaut | Avant | Après |
|---|---|---|
| Regex utilisateur non échappée (8 filtres) | `{ $regex: q }` brut | `escapeRegExp(q)` |
| Pagination non bornée | `limit=100000` → 200 ; `page=-5` → **500** | 400, plage fermée (`limit ≤ 50`, `page ≥ 1`) |
| Aucun DTO, donc aucune liste blanche | `?q[$ne]=1` atteignait le filtre Mongo | 400 `property q[$ne] should not exist` |
| Terme de recherche | `/search` sans `q` balayait tout le catalogue | 400, deux caractères minimum |
| Catégorie prestataire | reprise telle quelle | validée contre `VendorCategory` |

`escapeRegExp` existait déjà dans le dépôt et était appliqué par events,
vendors et venues — Discovery était la seule surface à ne pas l'utiliser.

Vérification live : `limit=100000` → 400, `page=-5` → 400, `q[$ne]` → 400,
`category=hacker` → 400, motif `(a+)+$` → **88 ms**.

---

## 6. Références polymorphes (B-03)

Les favoris avaient été traités en Vague A. **Les avis portaient les mêmes
défauts, intacts.**

| Défaut | Correction |
|---|---|
| `targetType` repris tel quel : `/reviews/hacker/<id>` → 200 avec liste vide | Validé contre `ReviewTargetType` → 400 |
| Cible non vérifiée : avis possible sur n'importe quel ObjectId bien formé | La cible doit exister, **dans la collection du type déclaré** — un id d'événement présenté comme `vendor` est refusé |
| Doublon détecté par lecture puis écriture | L'index unique `{author, targetType, targetId}` devient l'autorité, violation → 409 |

Autres relations polymorphes inspectées : notifications (`payload` libre, non
indexé, sans lecture par type — pas de surface), médias (rattachés à un
événement, pas polymorphes). Rien à corriger.

---

## 7. Sémantique HTTP (B-04)

| Cas | Avant | Après |
|---|---|---|
| `targetType` invalide sur avis | 200 + liste vide | 400 |
| `limit` hors plage (discovery, avis) | 200 non borné, ou 500 sur page négative | 400 |
| Suppression d'un avis tiers | 404 « introuvable **ou** accès refusé » | 404 si absent, 403 si autre auteur |
| Doublon d'avis concurrent | course, ou 500 sur index unique | 409 |
| Cible d'avis inexistante | 201, avis orphelin | 404 |

La distinction 404/403 sur les avis ne divulgue rien : ils sont publics en
lecture. Elle rend en revanche l'erreur exploitable par le client.

---

## 8. Projections publiques (B-05)

`/vendors` et `/venues` répondaient avec `select('-__v')`, c'est-à-dire le
document entier — dont **`user`, l'identifiant interne du compte
propriétaire**, sur des routes anonymes. Les endpoints équivalents
`/discovery/vendors` et `/discovery/venues` appliquaient déjà une projection
propre : la même ressource était donc exposée différemment selon la route, et
c'est la version fuyante que le web consomme.

| Surface | Champs retirés |
|---|---|
| `GET /vendors`, `GET /vendors/:id` | `user`, `createdAt`, `updatedAt` |
| `GET /venues`, `GET /venues/:id` | `user`, `createdAt`, `updatedAt` |
| `GET /reviews/:type/:id` | document brut → projection explicite ; auteur réduit à `fullName` |

`contactEmail` est conservé : c'est la raison d'être d'un annuaire de
prestataires, et la fiche publique l'affiche. Vérifié en live : plus aucune
occurrence de `user` sur liste ni sur fiche.

---

## 9. DTO / params / query (B-06)

Nouveaux DTO, limités aux endpoints du périmètre B :

- `SearchDiscoveryDto`, `FeaturedDiscoveryDto`, `QueryDiscoveryEventsDto`,
  `QueryDiscoveryVendorsDto`, `QueryDiscoveryVenuesDto` ;
- `ReviewTargetParamsDto`, `QueryReviewsDto`.

**Piège rencontré et corrigé** : avec `forbidNonWhitelisted`, un `@Param()`
lié à un DTO rejette tout paramètre de route absent de ce DTO. Valider
`targetType` seul cassait `/reviews/event/<id>` — la régression a été détectée
par sonde live avant commit, et `targetId` a été déclaré dans le même DTO.

Aucune passe cosmétique sur le reste du dépôt.

---

## 10. Contrats frontend ↔ API (B-07)

`DiscoveryFilters` envoyait `query`, `category`, `startDate`, `endDate`,
`location` et `perPage` à `GET /discovery/events`. **Aucun de ces paramètres
n'existe côté API** : ils étaient silencieusement ignorés, donnant l'illusion
d'un filtrage qui n'a jamais eu lieu. Depuis que la route valide ses entrées,
ils produiraient un 400.

Le contrat client est aligné sur ce que le serveur accepte réellement — `q`,
`city`, `page`, `limit` — plutôt que d'inventer des capacités côté API.

Les autres surfaces B n'ont aucun consommateur impacté : les projections
conservent tous les champs que le web lit, et aucun client web ne porte le
rôle admin. Le nettoyage général des services dupliqués reste hors périmètre
(Vague C).

---

## 11. Codes d'erreur métier (B-08)

Ajoutés à l'infrastructure `ErrorCodes` existante, sans créer de taxonomie
parallèle : `REVIEW_TARGET_NOT_FOUND`, `REVIEW_ALREADY_SUBMITTED`,
`REVIEW_NOT_FOUND`. Les codes existants (`EVENT_NOT_OWNER`, `ACCESS_DENIED`,
`INVALID_OBJECT_ID`, `INVALID_STATUS_TRANSITION`) sont réutilisés.

Aucune réponse n'expose de trace, de modèle Mongo, de nom de collection, de
requête ni de secret.

---

## 12. Sécurité

| Vecteur | Vérification | Résultat |
|---|---|---|
| IDOR | organisateur tiers sur 5 routes event-scoped | 403, inchangé après B-01 |
| Élargissement accidentel par B-01 | `roles` par défaut `[]` | propriétaire strict conservé |
| Contournement de rôle | prestataire sur route gestionnaire | 403 |
| Entrée malformée | ObjectId invalide sur avis, discovery | 400 |
| Abus de regex | `(a+)+$` sur route publique | 88 ms, littéral |
| Abus de pagination | `limit=100000`, `page=-5` | 400 |
| Exposition de données | `user` sur catalogues publics | supprimé |
| Usurpation polymorphe | id d'événement déclaré `vendor` | 404 |
| Mass assignment | `author` sur avis, `isActive` sur discovery | 400 |
| Sondage de ressource cachée | `targetType` inventé | 400, plus de 200 trompeur |

---

## 13. Tests

| Suite | Avant B | Après B |
|---|---|---|
| API unitaires | 1179 | **1187** |
| API E2E (Jest) | 70 | **108** |
| Web unitaires | 382 | **385** |
| E2E fonctionnels | 223 | **233** |
| Concurrence Vague A | 7/7 | **7/7** |
| Concurrence Vague 5 | 10/10 | **10/10** |

Nouveaux fichiers : `test/admin-authorization.e2e-spec.ts`,
`test/discovery-hardening.e2e-spec.ts`,
`e2e/functional/wave-b-mobile-menu.spec.ts`,
`src/features/discovery/services/discovery.service.test.ts`.

---

## 14. Performance

- Aucun N+1 introduit : la vérification d'existence des cibles d'avis est un
  `exists()` unique, sur le modèle des favoris.
- Les requêtes publiques sont désormais **bornées** — c'est un gain, pas un
  coût : `limit` était sans plafond.
- Les projections publiques réduisent la taille des réponses.
- Aucune regex utilisateur ne peut plus provoquer de retour arrière
  catastrophique.
- Aucun appel réseau ajouté côté web ; le tiroir mobile ne déclenche aucune
  requête.

---

## 15. Régressions

Aucune régression introduite. Deux défauts ont été détectés **par mes propres
sondes avant commit** et corrigés dans le même mouvement :

1. `@Param()` DTO rejetant `targetId` sur `/reviews/:targetType/:targetId` —
   corrigé en déclarant les deux paramètres dans un DTO unique.
2. Les specs de contrôleur asseyaient les signatures d'avant B-01 ; mises à
   jour pour refléter la transmission des rôles.

Vagues antérieures rejouées : paiements (Wave 5 concurrency 10/10), Wave 6
mockée, workspace, wizard, accès V2, participant, favoris.

---

## 16. OUT-OF-SCOPE FINDINGS

Constatés pendant la Vague B, **non implémentés**.

### Candidats Vague C — Integration Cleanup

| Finding | Note |
|---|---|
| `src/features/discovery/hooks/useDiscovery.ts` sans consommateur | Le service est maintenu aligné, mais le hook n'est appelé nulle part. |
| Trois copies d'`authFetch` (`notifications`, `guests`) | Aucun module B ne les utilise ; aucune nouvelle copie créée. |
| Arbre de routes legacy `/(dashboard)/organisateur\|prestataire\|gestionnaire` | Atteignable par URL, cinq pages en squelette de chargement infini. |
| `GET /reviews/*` sans aucun consommateur web | Le module est complet et désormais durci, mais aucune UI ne le lit. |
| `POST /discovery/search` implémenté, `/evenements/recherche` en placeholder | Capacité serveur non branchée. |

### Candidats Vague D — UX Truthfulness

| Finding | Note |
|---|---|
| Écrans placeholders (`messages`, `ententes`, `avis`, `calendrier`, `/parametres`, `/tableau-de-bord/prestataires`) | Marqués dans la source de navigation et écartés du mobile, mais toujours atteignables. |
| `contactEmail` exposé publiquement sur les annuaires | Cohérent avec un annuaire de prestataires, mais mérite une décision produit explicite. |

### Candidats Vague E — Release Hardening

| Finding | Note |
|---|---|
| Suite E2E ~12 min en `--workers=1` | Parallélisation limitée par `AUTH_STRICT` (5 connexions/min/IP). |
| Couverture API globale 73 % | Les modules touchés par A et B sont au-dessus. |

### Produit

| Finding | Note |
|---|---|
| Prérequis du passage PayPal Live | Politique de règlement tardif, `PAID_TICKET_HOLD_MINUTES`, remboursement au contrat `PaymentProvider`. Décisions produit, pas techniques. |
| Absence de module admin | B-01 a retiré ADMIN là où il ne servait à rien. Si une modération de profils est voulue un jour, elle devra être conçue, pas déduite d'un décorateur. |

---

## 17. Risques restants

| Risque | Sévérité | Note |
|---|---|---|
| Aucun compte ADMIN réel en base de dev | Moyen | La politique admin est vérifiée par tests unitaires sur `canManageEvent` et par les signatures ; le chemin HTTP complet avec un vrai compte admin n'a pas été exercé, faute de compte provisionné. Le sens de la garde reste sûr : `roles` par défaut `[]` ⇒ propriétaire strict. |
| `contactEmail` public | Faible | Volontaire, mais non tranché formellement. |
| `PUT /vendors/:id` et `PUT /venues/:id` | Faible | Conservés pour le propriétaire ; redondants avec `/me`. Candidat suppression Vague C. |
