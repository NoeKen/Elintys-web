# Audit transversal des intégrations — Elintys

**Branche** : `audit/integration-contracts-system-wide` (Elintys-api + Elintys-web, depuis `origin/dev`)
**Date** : 2026-09-07
**Nature** : audit en lecture seule. Aucune correction fonctionnelle appliquée.
**Preuves** : sondes HTTP live contre l'API locale (`http://localhost:3001/api/v1`), le Web local (`http://localhost:3000`) et l'API dev déployée (`https://api.dev.elintys.com/api/v1`).

---

## 1. Executive summary

L'incident Favoris n'est pas un cas isolé : c'est **le symptôme d'un mode de défaillance récurrent** dans Elintys.

Le schéma se répète à l'identique sur plusieurs domaines :

1. une première vague d'implémentation produit un client frontend « v1 » ;
2. l'API évolue (verbe, chemin, nom de champ) ;
3. une seconde vague produit un client « v2 » correct, mais **branché seulement sur une partie des écrans** ;
4. le client « v1 » reste câblé sur les écrans restants ;
5. aucun test E2E ne traverse le parcours complet, donc rien ne casse en CI ;
6. l'UI n'a pas d'état d'erreur explicite → l'échec devient un « vide » plausible.

**Trois parcours métier entiers sont non fonctionnels de bout en bout**, indépendamment de Favoris :

- **Prestataire** — impossible de créer/éditer son profil ni de répondre à une demande.
- **Gestionnaire de lieu** — impossible de créer/éditer sa fiche ni de répondre à une réservation.
- **Scan de billets** — le scanner QR envoie un payload rejeté à 100 % par le DTO (`400`).

À cela s'ajoutent une **rupture d'accès mobile** et deux défauts d'atomicité : la navigation mobile est codée en dur, sans rôles ; sous 768 px, un prestataire ou un gestionnaire n'a **aucun chemin** vers ses propres écrans. En parallèle, deux scans simultanés peuvent admettre deux fois le même billet et deux réponses simultanées à une demande/réservation peuvent produire des décisions et notifications contradictoires.

Les vagues récentes (Wave 4 participant, Wave 5 billetterie payante, Wave 6 PayPal, Event Workspace organisateur) sont d'une qualité nettement supérieure : normalisation de payload, états d'erreur, idempotence, autorité serveur. **Le passif se concentre sur les vagues antérieures** (favoris, prestataires, lieux, notifications, invités, scan).

| | |
|---|---|
| Domaines fonctionnels audités | 23 |
| Routes API exposées | 109 |
| Sites d'appel frontend | 105 |
| Ruptures de contrat confirmées | 12 |
| Clients HTTP concurrents | 7 (1 partagé + 5 `authFetch` copiés-collés + 1 client SSR) |
| Doublons de service pour une même feature | 3 paires |
| Routes backend jamais consommées | 26 |
| Actions UI mortes / placeholders atteignables | 14 |
| Parcours sans aucun test E2E | 9 |
| P0 / P1 / P2 / P3 | 0 / 7 / 18 / 14 |

**Verdict** : aucun P0 et aucun contournement d'ownership observé. Le cœur Access V2 / commandes / PayPal reste nettement plus robuste que les modules historiques, mais le diagnostic initial « problème d'intégration uniquement » était trop optimiste : le scan et les transitions prestataire/lieu présentent aussi des races métier P1 côté serveur.

---

## 2. Scope

**Inclus** : `Elintys-api` (NestJS, préfixe global `api/v1`), `Elintys-web` (Next.js 16.2.12 App Router).
**Exclus** : `Elintys-LP` (landing page, hors périmètre produit), `elintys-video`, `iphone-flyer`, `elintys_design`.

Domaines réellement présents dans le code et audités : authentification, inscription, connexion, récupération de mot de passe, vérification email, onboarding, dashboard organisateur, mes événements, création d'événement (wizard), Event Workspace (9 onglets), détail événement public, catalogue événements/prestataires/lieux, recherche, favoris, invitations, invités (guest list), inscriptions événement, billets gratuits, billetterie payante (ticket-orders), PayPal, participation, accès événement (code / domaine email / approbation manuelle / guest list / token d'invitation), médias & Cloudinary, archive/restore, publication & readiness, profil prestataire, profil lieu, demandes prestataire, réservations lieu, notifications, avis (reviews), waitlist, navigation, scan de billets.

---

## 3. Methodology

1. **Inventaire API automatisé** — parsing AST-léger de tous les `*.controller.ts` (109 routes, avec verbe, chemin, décorateurs `@Public`/`@Roles`/`@UseGuards`).
2. **Inventaire frontend automatisé** — extraction par équilibrage de parenthèses de tous les `api.*()`, `authFetch()`, `fetch(${API_URL}…)`, `fetchCatalogJson()` (105 sites d'appel).
3. **Diff mécanique** — matching verbe + chemin paramétré ; classement `OK` / `VERB_MISMATCH` / `NO_ROUTE` ; calcul inverse des routes orphelines.
4. **Vérification live** — sondes `curl` anonymes et authentifiées (deux comptes distincts) contre l'API locale, discriminant `404` (route inexistante) vs `401/403` (route existante protégée) vs `400` (DTO rejeté) vs `500` (CastError).
5. **Lecture ciblée** — parcours complet UI → handler → hook → service → HTTP → controller → service → Mongo → réponse → cache → état UI final, pour chaque domaine porteur d'une divergence.
6. **Smoke HTTP** des routes Next.js (17 routes, toutes en 200) puis Playwright diagnostique (14 scénarios).
7. **Revue concurrence/sécurité** guidée par VibeSec : transitions atomiques, références polymorphes, validation d'ObjectId, regex publiques et cohérence des rôles.
8. **Sondes dev non destructives** : mêmes contrats rejoués contre `api.dev.elintys.com`, y compris une session QA organisateur pour le scanner.

**Limites assumées** : pas de compte QA `prestataire` ni `gestionnaire_salle` disponible → les findings correspondants sont établis par **analyse statique + résolution de route vérifiée**, pas par exécution du chemin autorisé complet. La suite Playwright générale n'a pas été exécutée en intégralité (jeu de données mouvant) ; le spec diagnostique dédié l'a été (§17). Aucun test destructif, aucune correction produit et aucune écriture métier volontaire n'ont été réalisés.

---

## 4. Feature inventory (matrice canonique)

| Feature | Frontend | API | Contract | E2E | UX truthful | Severity |
|---|---|---|---|---|---|---|
| Authentification (login/register/refresh/reset) | OK | OK | OK | Oui | Oui | — |
| Onboarding (3 rôles) | OK | OK | OK | Partiel | Oui | P2 (ne crée aucun profil métier) |
| Dashboard organisateur | OK | OK | OK | Oui | Oui | — |
| Mes événements | OK | OK | OK | Oui | Oui | — |
| Création événement (wizard) | OK | OK | OK | Oui | Oui | — |
| Event Workspace (9 onglets) | OK | OK | OK | Oui | Oui | — |
| Détail événement public | OK | OK | OK | Oui | Oui | — |
| Accès événement (code/domaine/approbation) | OK | OK | OK | Oui | Oui | — |
| Catalogue événements | OK | OK | OK | Oui | Oui | — |
| Catalogue prestataires / lieux | OK | OK | OK | Partiel | Oui | P3 (fuite `user`) |
| Recherche avancée | **Placeholder** | Implémentée | Non branché | Non | Non | P2 |
| **Favoris** | **Divergent** | OK | **Cassé** | Manquant | **Non** | **P1** |
| Invitations organisateur | OK | OK | OK | Oui | Oui | — |
| Invités / guest list | OK | OK | OK | Partiel | Oui | P3 |
| Inscriptions événement | OK | OK | OK | Oui | Oui | — |
| Billets gratuits | OK | OK | OK | Oui | Oui | — |
| Billetterie payante (ticket-orders) | OK | OK | OK | Oui | Oui | P3 (préparation live PayPal) |
| Participation / Mes billets | OK | OK | OK | Oui | Oui | — |
| **Scan de billets (QR)** | **Divergent** | **Race serveur** | **Cassé** | Manquant | **Non** | **P1** |
| **Profil prestataire** | **Divergent** | Incomplet | **Cassé** | Manquant | **Non** | **P1** |
| **Demandes prestataire (répondre)** | **Divergent** | OK | **Cassé** | Manquant | **Non** | **P1** |
| **Profil lieu (fiche)** | **Divergent** | Incomplet | **Cassé** | Manquant | **Non** | **P1** |
| **Réservations lieu (répondre)** | **Divergent** | OK | **Cassé** | Manquant | **Non** | **P1** |
| Notifications | OK | OK | Divergent (param) | Manquant | Partiel | P3 |
| Avis (reviews) | **Absent** | Implémentée | Non branché | Non | — | P3 |
| Médias / Cloudinary | OK | OK | OK | Oui | Oui | — |
| Archive / restore | OK | OK | OK | Oui | Oui | — |
| Publication / readiness | OK | OK | OK | Oui | Oui | — |
| Waitlist | OK | OK | OK | Oui | Oui | — |
| Navigation mobile | **Incomplète** | — | — | Non | **Non** | **P2** |

---

## 5. API inventory

109 routes exposées sous le préfixe global `api/v1` (défini dans `src/main.ts:74`), réparties sur **20 classes contrôleur dans 18 fichiers**.
Voir **Annexe — Endpoint map** (§27) pour le tableau complet verbe / chemin / auth / consommation.

Points structurels :

- Deux contrôleurs cohabitent dans `tickets.controller.ts` : `@Controller('ticket-types')` (l.26) et `@Controller('tickets')` (l.98). Idem dans `ticket-orders.controller.ts` : `ticket-orders` (l.43) et `ticket-orders-maintenance` (l.120). C'est un piège d'inventaire — tout outil qui ne lit que le premier `@Controller` par fichier produit une carte fausse.
- `ValidationPipe` global : `whitelist: true`, **`forbidNonWhitelisted: true`**, `transform: true` (`src/main.ts:80-84`). Toute propriété non déclarée dans un DTO produit un **400**, pas un silence. C'est une bonne décision — et c'est ce qui rend le finding F-03 déterministe.
- `AllExceptionsFilter` renvoie 500 pour toute exception non-`HttpException`. Les `CastError` Mongoose non protégés par `ParseObjectIdPipe` deviennent donc des **500**.
- `ParseObjectIdPipe` existe et est appliqué systématiquement sur `events`, `tickets`, `ticket-orders`, `event-registrations` — **et jamais** sur `vendors`, `venues`, `reviews`, `notifications`, `favorites`.

---

## 6. Frontend API inventory

105 sites d'appel, répartis sur **7 clients HTTP distincts** :

| Client | Fichier | Portée | Erreurs |
|---|---|---|---|
| `api` (partagé) | `src/shared/lib/api.ts` | 68 appels | `ApiClientError` typée + refresh 401 automatique |
| `authFetch` (copie 1) | `features/favorites/services/favorites.service.ts:12` | 3 | `new Error("HTTP 404")` — perd le statut |
| `authFetch` (copie 2) | `features/vendors/services/vendor-profile.service.ts:28` | 4 | `apiErrorFromResponse` |
| `authFetch` (copie 3) | `features/venues/services/venue-profile.service.ts:45` | 4 | `apiErrorFromResponse` |
| `authFetch` (copie 4) | `features/notifications/services/notifications.service.ts:28` | 4 | — |
| `authFetch` (copie 5) | `features/guests/services/guests.service.ts:33` | 4 | — |
| `fetchCatalogJson` | `src/server/catalog/catalog-api.ts` | 4 (SSR) | `{data:null,error:true}` explicite — correct |

Les cinq copies d'`authFetch` sont **fonctionnellement identiques** et prennent toutes un paramètre `token` qui ne sert plus à rien : `useAuthToken()` (`src/shared/hooks/useAuthToken.ts:11`) retourne la chaîne sentinelle `"cookie-session"`, et chaque copie contient `if (token && token !== "cookie-session")`. C'est du code mort transporté par cinq chemins parallèles, reliquat de la migration vers les cookies httpOnly. Aucune ne bénéficie du refresh 401 automatique du client partagé.

---

## 7. Contract mismatches

### F-01 — Favoris : trois routes frontend inexistantes (P1)

| | |
|---|---|
| **Sévérité** | P1 |
| **Feature** | Favoris |
| **Fichier frontend** | `src/features/favorites/favorites.service.ts:19-44`, `src/features/favorites/services/favorites.service.ts:40-58` |
| **Fichier backend** | `src/modules/favorites/favorites.controller.ts` |
| **Endpoint attendu (front)** | `GET /favorites/check/:id?type=`, `DELETE /favorites/:id?type=`, `GET /favorites/me?targetType=` |
| **Endpoint réel (API)** | `GET /favorites?type=`, `POST /favorites` (body), `DELETE /favorites` (body) |

**Symptôme** — Le cœur d'un événement ne reste jamais rempli ; la page « Mes favoris » affiche « Aucun favori » même quand la base en contient ; elle affiche des ObjectId bruts quand elle en affiche.

**Root cause** — Deux clients concurrents pour une même feature, tous deux désalignés sur l'API réelle :
- `favorites.service.ts` (utilisé par `useFavorite` → `FavoriteButton` → `EventCard`) invente `/favorites/check/:id` et `DELETE /favorites/:id`, qui n'existent pas ;
- `services/favorites.service.ts` (utilisé par la page `/tableau-de-bord/favoris`) invente `/favorites/me`, qui n'existe pas non plus ;
- l'API attend le `targetId`+`targetType` **dans le body** pour `DELETE`, et un query param `type` (pas `targetType`) pour le filtre de liste.

**Reproduction (vérifiée)**
```
GET    /api/v1/favorites/check/507f…?type=event   → 404
DELETE /api/v1/favorites/507f…?type=event         → 404
GET    /api/v1/favorites/me                       → 404
GET    /api/v1/favorites (authentifié)            → 200  []
```

**Impact** — La feature Favoris est intégralement non fonctionnelle côté lecture et suppression. L'ajout (`POST /favorites`) fonctionne, ce qui crée un état encore plus trompeur : la donnée est écrite mais jamais relue, donc le bouton se « dé-remplit » à chaque refetch, et un second clic renvoie `409 Déjà dans les favoris`.

**Aggravants** :
- `useFavorite.ts:17-22` — `useQuery` sans `isError` : le 404 devient `data: undefined` → `isFavorite = false`. **Faux état.**
- `useFavorite.ts:30-41` — mutation optimiste : le cœur se remplit instantanément, puis le rollback `onError` ne se déclenche pas pour `remove` (qui échoue en 404) de manière visible pour l'utilisateur : aucun toast, aucun `role="alert"`.
- `favoris/page.tsx:29-33` — `useQuery` sans `isError` : le 404 devient `favorites = []` → l'écran affiche l'état vide « Aucun favori pour le moment ». **Représentation mensongère de l'état.**
- `favoris/page.tsx:74-78` — le lien pointe vers `` `${GROUP_PATHS[type]}/${fav.targetId}` `` et le libellé affiché est `{fav.targetId}`. Or la route publique événement est `/evenements/[slug]`, pas `/evenements/[id]` : même avec des données, le lien serait mort. **Donnée technique brute affichée faute d'enrichissement** (l'API `GET /favorites` ne renvoie ni titre ni slug de la cible).

**Fix recommandé** — Supprimer `src/features/favorites/services/favorites.service.ts`. Réécrire `src/features/favorites/favorites.service.ts` sur le contrat réel (`GET /favorites?type=`, `POST /favorites`, `DELETE /favorites` avec body). Remplacer `check()` par une dérivation depuis la liste `GET /favorites` mise en cache sous une clé unique, ce qui supprime aussi le N+1 d'un `check` par carte. Enrichir `GET /favorites` côté API (titre, slug, image de la cible) pour que la page « Mes favoris » soit affichable.

**Tests à ajouter** — Unitaire service (3 verbes, forme du body) ; test de rendu de la page favoris pour `isError` ; **E2E complet** : login → catalogue → clic cœur → assertion réseau 201 → reload → cœur toujours rempli → page favoris → titre lisible → clic cœur → 204 → liste vide.

---

### F-02 — Prestataire & gestionnaire : réponse à une demande sur le mauvais verbe et le mauvais champ (P1)

| | |
|---|---|
| **Sévérité** | P1 |
| **Feature** | Demandes prestataire / Réservations lieu |
| **Fichier frontend** | `features/vendors/services/vendor-profile.service.ts:76-93`, `features/venues/services/venue-profile.service.ts:100-117` |
| **Fichier backend** | `vendors.controller.ts:63`, `venues.controller.ts:67` |
| **Endpoint attendu (front)** | `PUT /vendors/requests/:id/respond` `{status, message}` |
| **Endpoint réel (API)** | `PATCH /vendors/requests/:id/respond` `{status, responseMessage}` |

**Symptôme** — Sur `/tableau-de-bord/prestataire/demandes` et `/tableau-de-bord/gestionnaire/reservations`, le bouton « Répondre » ouvre le formulaire ; « Accepter » / « Refuser » produit systématiquement une erreur générique. Aucune demande ne peut être acceptée depuis le web.

**Root cause** — Double divergence, non détectée parce que le client correct existe ailleurs :
- verbe : `PUT` côté frontend, `PATCH` côté API → **404** (aucune route `PUT` à 3 segments) ;
- champ : `message` côté frontend, `responseMessage` dans `RespondVendorRequestDto` / `RespondVenueBookingDto` → **400** avec `forbidNonWhitelisted`, même si le verbe était corrigé.

Les clients **corrects** existent déjà — `vendor-requests.service.ts:46` et `venue-bookings.service.ts:47` utilisent `PATCH` et `responseMessage` — mais ils ne sont câblés que sur les écrans **organisateur** (`evenements/[id]/prestataires`, `evenements/[id]/lieux`). Le côté prestataire/gestionnaire est resté sur le client v1.

**Reproduction (vérifiée)**
```
PUT   /api/v1/vendors/requests/507f…/respond   → 404
PATCH /api/v1/vendors/requests/507f…/respond   → 401  (route existante, protégée)
PUT   /api/v1/venues/bookings/507f…/respond    → 404
PATCH /api/v1/venues/bookings/507f…/respond    → 401  (route existante, protégée)
```

**Impact** — La boucle métier prestataire↔organisateur et lieu↔organisateur est rompue : l'organisateur peut envoyer une demande, le destinataire ne peut jamais y répondre.

**Fix recommandé** — Supprimer `respondToRequest` / `getMyRequests` de `vendor-profile.service.ts` et `respondToBooking` / `getMyBookings` de `venue-profile.service.ts` ; brancher les pages prestataire/gestionnaire sur `vendorRequestsService.respond` et `venueBookingsService.respond`.

**Tests à ajouter** — Unitaire service (verbe + nom de champ) ; E2E deux comptes : organisateur envoie une demande → prestataire l'accepte → l'organisateur voit `accepted`.

---

### F-03 — Scanner QR : payload rejeté par le DTO (P1)

| | |
|---|---|
| **Sévérité** | P1 |
| **Feature** | Scan de billets |
| **Fichier frontend** | `src/components/tickets/QRScanner.tsx:41` |
| **Fichier backend** | `src/modules/tickets/tickets.controller.ts:128`, `dto/scan-ticket.dto.ts` |

**Symptôme** — Sur `/scan/[eventId]`, chaque scan échoue. Le billet valide est présenté comme invalide.

**Root cause** — Le frontend envoie `{ eventId, qrCode }`. `ScanTicketDto` ne déclare que `qrCode`. `forbidNonWhitelisted: true` rejette la propriété excédentaire.

**Reproduction (vérifiée, authentifiée organisateur)**
```
POST /api/v1/tickets/scan  {"eventId":"507f…","qrCode":"xxx"}
  → 400  {"message":["property eventId should not exist"]}
POST /api/v1/tickets/scan  {"qrCode":"xxx"}
  → 404  {"message":"Code QR invalide ou introuvable."}   (contrat respecté)
```

**Impact** — Le contrôle d'accès à l'entrée d'un événement est inopérant. Aucun test ne couvre ce chemin.

**Fix recommandé** — Deux options, à trancher produit : (a) retirer `eventId` du payload frontend ; (b) l'ajouter au DTO **et** l'utiliser pour vérifier que le billet appartient bien à l'événement scanné — ce que le service ne fait pas aujourd'hui (`scan(dto.qrCode, user.sub)` ignore l'événement). L'option (b) est fonctionnellement supérieure : elle empêche de valider à l'entrée de l'événement A un billet de l'événement B.

**Tests à ajouter** — Unitaire DTO ; E2E : achat billet gratuit → scan avec le vrai QR → `valid` → second scan → `already_used`.

---

### F-04 — `PUT /vendors/me` et `PUT /venues/me` résolvent vers `PUT /:id` (P1)

| | |
|---|---|
| **Sévérité** | P1 |
| **Feature** | Profil prestataire / Fiche lieu |
| **Fichier frontend** | `vendor-profile.service.ts:66`, `venue-profile.service.ts:90` |
| **Fichier backend** | `vendors.controller.ts:93`, `venues.controller.ts:98` |

**Symptôme** — « Enregistrer » sur `/tableau-de-bord/prestataire/profil` et `/tableau-de-bord/gestionnaire/fiche` échoue toujours.

**Root cause** — L'API expose `GET /vendors/me` mais **pas** `PUT /vendors/me`. Le seul `PUT` déclaré est `PUT /vendors/:id` (l.93), qui capture donc `/vendors/me` avec `id = "me"`. `vendorsService.update` fait `findById("me")` → `CastError` Mongoose → non interceptée (aucun `ParseObjectIdPipe` sur ce contrôleur) → **500**.

C'est la catégorie la plus dangereuse de l'audit : **un diff mécanique verbe+chemin classe cet appel « OK »**, puisqu'une route correspond. Seule la résolution effective révèle le défaut.

**Reproduction** — Confirmée en anonyme (`PUT /vendors/me` → `401` : la route `PUT /:id` matche bien, contrairement à `PUT /vendors/requests/…/respond` qui rend `404`). Confirmée en authentifié organisateur (`403 Rôle insuffisant` — le guard de rôle s'exécute avant le service). Le `500` par `CastError` est établi par lecture du code, pas exécuté : **aucun compte QA `prestataire`/`gestionnaire_salle` n'est disponible** dans le jeu de données local. Le comportement `CastError → 500` est lui vérifié sur les routes publiques équivalentes (voir F-11).

**Fix recommandé** — Ajouter `PUT /vendors/me` et `PUT /venues/me` (déclarés **avant** `:id`), ou faire pointer le frontend vers `PUT /vendors/:id` avec l'id du profil chargé. La première option est préférable : elle supprime la nécessité pour le client de connaître son propre id.

---

### F-05 — Aucun profil prestataire/lieu n'est jamais créé (P1)

| | |
|---|---|
| **Sévérité** | P1 |
| **Feature** | Onboarding prestataire / gestionnaire |
| **Fichier backend** | `src/modules/auth/auth.service.ts:256-296` |

**Symptôme** — Un utilisateur qui s'inscrit comme prestataire termine son onboarding, arrive sur son dashboard, et voit un formulaire de profil vide. `GET /vendors/me` renvoie `404 Profil prestataire introuvable`.

**Root cause** — `saveOnboarding` écrit exclusivement sur le document `User` (`onboardingByRole.<role>`, `onboardingData.<role>`) et **ne crée aucun document `VendorProfile` ni `VenueProfile`**. Or :
- `POST /venues` n'est **jamais appelé** par le frontend (route orpheline) ;
- `POST /vendors` n'est appelé que par `vendorsService.create`, lui-même appelé **nulle part** ;
- `PUT /vendors/me` / `PUT /venues/me` sont cassés (F-04) et seraient de toute façon des `update`, pas des `create`.

Il n'existe donc **aucun chemin dans le produit** menant à la création d'un profil prestataire ou lieu. Les profils présents en base de développement proviennent du script de seed.

**Impact** — Les rôles prestataire et gestionnaire de lieu sont inutilisables de bout en bout pour tout utilisateur réel : pas de profil → pas de présence au catalogue → aucune demande possible → dashboard vide en permanence. Combiné à F-02 et F-04, ces deux rôles n'ont **aucune fonction opérationnelle**.

**Aggravant UX** — `prestataire/profil/page.tsx:29-33` n'a pas de branche `isError`. Le `404` produit `profile: undefined`, `isLoading: false` → le formulaire vide s'affiche comme si un profil existait et était simplement vierge. **Faux état.** L'utilisateur remplit, soumet, et reçoit une erreur inexplicable.

**Fix recommandé** — Créer le `VendorProfile` / `VenueProfile` dans `saveOnboarding` à partir de `onboardingData` (les champs y sont déjà : `displayName`, `category`, `serviceArea`, `venueName`, `capacity`, `address`…), ou exposer un parcours explicite « créer ma fiche » utilisant `POST /vendors` / `POST /venues`. Dans les deux cas, la page profil doit distinguer `404` (pas de profil → mode création) de `200` (mode édition) et de l'erreur réseau.

---

### F-06 — PayPal : URL d'approbation restreinte au sandbox (P3, dette de préparation live)

| | |
|---|---|
| **Sévérité** | P3 (capacité future, non activable aujourd'hui) |
| **Feature** | Billetterie payante |
| **Fichier frontend** | `src/components/tickets/PurchaseModal.tsx:45-52` |

`isTrustedApprovalUrl` n'accepte que `sandbox.paypal.com`. Cette contrainte est cohérente avec le périmètre actuel : `resolvePayPalConfig` refuse explicitement `PAYPAL_ENV=live` dans **tous** les environnements (`src/config/paypal-environment.ts:44-50`) et le provider répète cette garde (`paypal-payment.provider.ts:52-56`). Aucun paiement réel ne peut donc atteindre aujourd'hui une URL `www.paypal.com`.

Le rapport initial surclassait ce point en P1 : ce n'est pas un défaut actif de dev/sandbox, mais une **dette obligatoire avant une future activation live**. Le jour où le backend autorisera `live`, le frontend devra évoluer dans le même changement atomique de configuration ; sinon une commande serait créée/réservée puis sa redirection refusée.

**Fix recommandé** — Dériver l'allow-list de l'environnement (`sandbox.paypal.com` en dev, `www.paypal.com` en prod), ou accepter les deux et laisser l'API être la seule autorité sur le domaine du fournisseur.

---

### F-07 — `vendorsService` : `PATCH` et `DELETE` sur des routes inexistantes (P2)

`features/vendors/services/vendors.service.ts:21` appelle `PATCH /vendors/:id` (l'API expose `PUT`) et `:26` appelle `DELETE /vendors/:id` (aucune route `DELETE`). Vérifié : les deux renvoient `404`.

Ces deux méthodes ne sont appelées par aucun écran aujourd'hui — c'est du contrat mort **prêt à casser** dès qu'un écran les branchera. `vendorsService.create` (`POST /vendors`, valide) est dans le même cas.

---

### F-08 — `ticketsService` : deux méthodes sur des routes inexistantes (P2)

`features/tickets/services/tickets.service.ts` :
- `:59` — `GET /events/:id/tickets` → **404** (l'API n'expose pas cette route ; l'équivalent est `GET /ticket-types/events/:eventId`). Consommée par `useTickets`, hook exporté mais jamais utilisé.
- `:85` — `POST /tickets/validate` → **404** (l'API expose `POST /tickets/scan`). Méthode `validate()` appelée nulle part.

Vestiges d'un contrat de billetterie antérieur. Le `QRScanner` utilise le bon chemin (`/tickets/scan`) mais le mauvais payload (F-03) : les deux générations coexistent.

---

### F-09 — `normalizeTicketType` perd `isFree` (P2)

`tickets.service.ts:5-25` — l'interface `ApiTicketType` ne déclare pas `isFree`, `reserved` ni `currency`, alors que le schéma Mongo et `PublicEventTicketType` les portent. `normalizeTicketType` produit donc un `TicketType` frontend sans `isFree`.

Conséquence : tout écran de gestion consommant `ticketsService.getTypes` ne peut pas distinguer un billet gratuit d'un billet à 0 $, ni afficher la capacité réellement disponible (`quantity - sold - reserved`). La page publique, elle, calcule correctement (`EventPageClient.tsx:296-299`) parce qu'elle passe par un autre type. **Types partiellement synchronisés.**

---

### F-10 — Notifications : filtre `unreadOnly` ignoré (P3)

`notifications.service.ts:51` envoie `?unreadOnly=true`. `notifications.controller.ts:28` lit `@Query('unread')`. Le filtre est silencieusement ignoré — la liste complète est renvoyée.

Latent aujourd'hui (`NotificationBell` appelle `list(token)` avec le défaut `false`), mais toute activation du filtre « non lues » produira une liste fausse sans aucune erreur.

---

### F-11 — ObjectId invalide → 500 sur les routes publiques (P2)

`ParseObjectIdPipe` existe (`src/shared/pipes/parse-object-id.pipe.ts`) et documente explicitement ce cas, mais son application reste inégale sur `vendors`, `venues`, `reviews`, `notifications`, `guests` et plusieurs routes événementielles historiques.

**Vérifié :**
```
GET /api/v1/events/not-an-objectid              → 400  INVALID_OBJECT_ID   (correct)
GET /api/v1/vendors/not-an-objectid             → 500  erreur interne
GET /api/v1/venues/not-an-objectid              → 500  erreur interne
GET /api/v1/reviews/event/not-an-objectid       → 500  erreur interne
GET /api/v1/events/not-an-objectid/guests       → 500  erreur interne
GET /api/v1/vendors/not-an-objectid/requests    → 500  erreur interne
GET /api/v1/venues/not-an-objectid/bookings     → 500  erreur interne
```

Les trois premières routes sont **publiques et non authentifiées** ; les trois suivantes ont été reproduites avec la session QA. À titre de contrôle, `/event-registrations/events/not-an-objectid` et `/ticket-types/events/not-an-objectid/manage` renvoient bien `400 INVALID_OBJECT_ID`. Impact : bruit d'alerting, vecteur trivial de 5xx et contrat d'erreur imprévisible selon le module.

Le même défaut existe dans les DTO polymorphes : `CreateFavoriteDto.targetId` et `CreateReviewDto.targetId` sont de simples `@IsString()`, puis passent dans `new Types.ObjectId(...)`. De plus, ni `FavoritesService` ni `ReviewsService` ne vérifie que la cible typée existe : un ObjectId bien formé mais orphelin peut être enregistré. Les index uniques empêchent le doublon, pas l'intégrité référentielle.

---

### F-12 — `category` prestataire : input libre contre enum serveur (P2)

`prestataire/profil/page.tsx:134-144` rend `category` en `<input type="text">` avec le placeholder « Ex: Photographie, DJ, Traiteur… », validé côté client par un simple `z.string().min(1)`.

`CreateVendorDto` déclare `@IsEnum(VendorCategory)`. Toute saisie libre est rejetée en `400`. Même après correction de F-04, ce formulaire resterait insoumissible. **Enum frontend périmé (ici : absent).**

---

## 8. Duplicate clients / services

| Feature | Client utilisé | Client concurrent | Même contrat ? | Risque |
|---|---|---|---|---|
| Favoris | `favorites/favorites.service.ts` (bouton) | `favorites/services/favorites.service.ts` (page) | **Non** — 3 chemins différents, tous faux | Réalisé (F-01) |
| Demandes prestataire | `vendor-profile.service.ts` (prestataire) | `vendor-requests.service.ts` (organisateur) | **Non** — `PUT`/`message` vs `PATCH`/`responseMessage` | Réalisé (F-02) |
| Réservations lieu | `venue-profile.service.ts` (gestionnaire) | `venue-bookings.service.ts` (organisateur) | **Non** — idem | Réalisé (F-02) |
| Client HTTP | `shared/lib/api.ts` | 5 copies d'`authFetch` | Partiellement — pas de refresh 401, gestion d'erreur divergente | Élevé |
| Type `TicketPurchase` | `billetterie/page.tsx:12` | `participation/page.tsx` | Déclaré deux fois | Moyen |
| Type `VendorRequest` | `vendor-profile.service.ts:18` | `vendor-requests.service.ts:3` | **Non** — `organizer` objet vs string | Moyen |
| Type `VenueBooking` | `venue-profile.service.ts:25` | `venue-bookings.service.ts:3` | **Non** — idem | Moyen |

Les trois paires de types divergent sur la forme de `organizer` et `event` : la version « profil » suppose des objets peuplés, la version « requests/bookings » accepte string ou objet. La version peuplée est fausse — voir F-13.

---

### F-13 — `organizer` jamais peuplé, et champ inexistant (P2)

`venues.service.ts:198-206` (`listMyBookings`) et `vendors.service.ts:267-276` (`listMyRequests`) ne peuplent que `event`. `organizer` reste un ObjectId.

Le frontend affiche `{booking.organizer.firstName} {booking.organizer.lastName}` (`gestionnaire/reservations/page.tsx:88`) et l'équivalent côté prestataire. Deux défauts cumulés :
1. `organizer` est une chaîne → `.firstName` est `undefined` → **nom vide affiché** ;
2. même peuplé, le schéma `User` (`user.schema.ts:18`) porte **`fullName`**, pas `firstName`/`lastName` — le champ n'existe nulle part côté serveur.

Le mapping `fullName → firstName/lastName` est fait correctement ailleurs (`auth.service.ts:31-36`), ce qui montre que la convention est connue mais pas propagée.

---

## 9. Dead UI actions

**UI affordance without functional integration :**

| Élément | Emplacement | Comportement réel |
|---|---|---|
| Cœur Favoris, utilisateur anonyme | `FavoriteButton.tsx:32-53` | `onClick` = `preventDefault()` + `stopPropagation()` **et rien d'autre**. Pas de redirection connexion, pas de tooltip visible au clavier. `getLoginPath` existe et est utilisé partout ailleurs. |
| Cœur Favoris, utilisateur connecté | `FavoriteButton.tsx:56-85` | Déclenche une requête qui échoue (F-01), état optimiste conservé jusqu'au refetch |
| Sidebar → « Prestataires » | `/tableau-de-bord/prestataires` | `<div>Prestataires</div>` |
| Sidebar → « Paramètres » | `/parametres` | `<div>Paramètres</div>` |
| Sidebar → « Messages » | `/tableau-de-bord/messages` | `PlaceholderPage` (honnête) |
| Sidebar → « Lieux » | `/tableau-de-bord/lieux` | `PlaceholderPage` |
| Sidebar → « Mes ententes » ×2 | prestataire + gestionnaire | `PlaceholderPage` |
| Sidebar → « Mes avis » | `/tableau-de-bord/prestataire/avis` | `PlaceholderPage` alors que le module `reviews` est complet côté API |
| Sidebar → « Calendrier » | `/tableau-de-bord/gestionnaire/calendrier` | `PlaceholderPage` |
| « Répondre » (demandes / réservations) | prestataire + gestionnaire | Ouvre un formulaire dont la soumission échoue toujours (F-02) |
| « Enregistrer » (profil / fiche) | prestataire + gestionnaire | Échoue toujours (F-04) |
| Scanner QR | `/scan/[eventId]` | Chaque scan échoue (F-03) |
| `/evenements/recherche` | public | `PlaceholderPage` alors que `GET /discovery/search` est implémenté et testé |
| `/stripe-connect` | public | `PlaceholderPage` — vestige Stripe |

**Faux chargement permanent** — l'arbre de routes legacy `/(dashboard)/organisateur/*`, `/(dashboard)/prestataire`, `/(dashboard)/gestionnaire/*` n'est référencé par aucune navigation, mais reste atteignable par URL. Cinq de ces pages rendent `<DashboardSkeleton />` **comme contenu de page** : un squelette de chargement qui ne se résout jamais. C'est pire qu'un placeholder — cela signale à l'utilisateur qu'une donnée arrive.

Pages concernées : `organisateur/analytiques`, `organisateur/billetterie`, `organisateur/invites`, `organisateur/prestataires`, `prestataire`, `gestionnaire`, `gestionnaire/lieux`, `gestionnaire/calendrier`. Plus `/(dashboard)/invites` → `<div>Invités</div>`.

---

## 10. Silent errors

Le codebase récent gère correctement les erreurs (`getUserFacingError`, `FormErrorAlert`, `ApiClientError` typée, `role="alert"`, boutons « Réessayer »). Aucun `catch(() => [])` ni `catch(() => null)` masquant n'a été trouvé.

Le vecteur de silence est ailleurs : **`useQuery` sans branche `isError`**, avec une valeur par défaut qui rend l'échec indiscernable du vide.

| Fichier | Query | Défaut | Représentation mensongère |
|---|---|---|---|
| `favoris/page.tsx:29` | liste favoris | `= []` | 404 → « Aucun favori pour le moment » |
| `useFavorite.ts:17` | check favori | `= false` | 404 → cœur vide |
| `prestataire/profil/page.tsx:29` | profil | `undefined` | 404 → formulaire vide comme si éditable |
| `evenements/[id]/prestataires/page.tsx:39` | demandes | — | erreur → liste vide |
| `NotificationBell.tsx:36,43` | compteur + liste | `?? 0` | erreur → badge à 0, cloche vide |
| `EventWorkspaceShell.tsx:70,71` | événement + readiness | — | erreur → shell dégradé sans explication |
| `useDiscovery`, `useVendors`, `useGuests`, `useEvents` | — | — | hooks sans état d'erreur (non consommés aujourd'hui) |

À l'inverse, les écrans exemplaires à répliquer : `billetterie/page.tsx:61-68` (isError + retry + `role="alert"`), `OrganizerDashboardExperience.tsx:53-56` (erreur + `requestId` affiché), `EventPageClient.tsx:189-194` (erreur + retry sur la demande d'accès).

---

## 11. Auth problems

**Solide** — Cookies httpOnly, refresh 401 automatique et déduplicé (`api.ts:99-111`), `ProtectedRoute` avec `returnUrl` préservé (`ProtectedRoute.tsx:14`), `sanitizeRedirectPath` correct (rejette `//`, `\`, caractères de contrôle), middleware d'origine de confiance actif sur les mutations (vérifié : `403 Origine de requête non autorisée` sans en-tête `Origin`).

**Défauts :**

- **P2 — Anonyme sur Favoris** : le seul CTA du produit qui n'emmène pas vers la connexion (§9). `getLoginPath` est disponible dans le fichier voisin.
- **P2 — Post-login uniforme** : `getPostAuthPath` (`redirects.ts:16-22`) renvoie `/tableau-de-bord` pour tous les rôles. `/tableau-de-bord` rend `OrganizerDashboardExperience`, qui appelle `GET /events/my/summary`, protégé par `@Roles(ORGANISATEUR, ADMIN)`. Un prestataire ou un gestionnaire fraîchement connecté atterrit donc sur un **écran d'erreur 403** comme premier écran produit.
- **P2 — Faux logout sur panne** : tout échec de `/auth/me` devient `null`, sans distinguer 401 d'une panne réseau/500 (F-18).
- **P3 — `ProtectedRoute` sans contrôle de rôle** : n'importe quel utilisateur authentifié peut naviguer vers n'importe quel écran de dashboard. L'API refuse correctement (403), mais l'UI n'oriente pas. Défense en profondeur correcte, ergonomie absente.
- **P3 — `useAuthToken` sentinelle** : retourne `"cookie-session"` uniquement pour servir de flag `enabled` aux `useQuery`. Cinq copies d'`authFetch` contiennent un test mort sur cette valeur.

---

## 12. Ownership / IDOR

**Vérifié en live avec deux comptes distincts** (`qa-organisateur` propriétaire, `qa-tiers` non propriétaire) :

| Sonde | Résultat | Attendu |
|---|---|---|
| A→A `GET /events/:id` | 200 | ✅ |
| B→A `GET /events/:id` | 403 `EVENT_NOT_OWNER` | ✅ |
| B→A `PATCH /events/:id` | 403 `EVENT_NOT_OWNER` | ✅ |
| B→A `DELETE /events/:id` | 403 `EVENT_NOT_OWNER` | ✅ |
| B→A `GET /events/:id/access/requests` | 403 | ✅ |
| B→A `GET /events/:id/guests` | 403 | ✅ |
| B→A `GET /events/:id/invitations` | 403 `EVENT_NOT_OWNER` | ✅ |
| B→A `GET /ticket-types/events/:id/manage` | 403 | ✅ |
| Anonyme sur route privée | 401 | ✅ |
| ObjectId invalide (events) | 400 `INVALID_OBJECT_ID` | ✅ |
| ObjectId inexistant | 404 `EVENT_NOT_FOUND` | ✅ |
| ObjectId invalide (vendors/venues/reviews) | **500** | ❌ (F-11) |

**Aucune route frontend ne transmet `organizerId`, `buyerId`, `participantId` ou `ownerId` comme autorité métier.** Toutes les identités proviennent de `@CurrentUser()`. C'est correct et cohérent sur l'ensemble des contrôleurs.

Aucun IDOR trouvé sur la matrice testée. Cette conclusion ne valide pas le comportement `ADMIN`, contractuellement incohérent entre contrôleurs et services (F-17).

---

## 13. Cache / TanStack Query

- **Clés cohérentes** — `['event', id]` partagée par les 9 onglets du workspace : une seule requête réseau, pas de N+1. `['my-tickets']` partagée entre `/billetterie` et `/participation`.
- **P3 — Clé divergente** : `EventCreationLoader.tsx:15` utilise `['event', eventId, 'creation']` pour la même ressource → refetch inutile lors du passage wizard ↔ workspace.
- **P3 — Invalidations cohérentes** partout ailleurs (`['my-events']`, `['event-publish-readiness', id]`, `['vendor-requests', id]`…).
- **P2 — Optimistic UI qui reste vraie après échec** : `useFavorite.ts:30-45`. `onMutate` bascule la valeur, `onError` restaure — mais l'erreur n'est jamais présentée à l'utilisateur, et `onSettled` invalide `['favorites']` (la liste) sans invalider `['favorite', id, type]` (l'état du bouton). L'état du cœur ne se corrige donc qu'au bout du `staleTime` de 60 s.
- **P3 — `retry` par défaut** : les 404 de F-01 sont rejoués 3 fois par TanStack Query → 4 requêtes 404 par carte affichée.

---

## 14. Polymorphic feature gaps

**Favoris** — `FavoriteTargetType = 'event' | 'vendor' | 'venue'` côté frontend et côté API (`FavoriteTargetType` dans `favorite.schema.ts`). Le composant `FavoriteButton` est générique. Mais :
- il n'est monté que dans `EventCard.tsx` — donc **uniquement sur les événements** ;
- `VendorCard.tsx:68-78` et `VenueCard.tsx:65-75` affichent chacun un cœur dont le handler ne fait que `preventDefault()` / `stopPropagation()` : l'affordance existe mais elle est **entièrement morte** ;
- `TicketSelector.tsx:208-213` affiche aussi « Sauvegarder » sans aucun handler ;
- la page « Mes favoris » groupe pourtant les trois types et construit des liens `/prestataires/:id` et `/lieux/:id`.

État réel : **event = intégré (mais cassé), vendor = affordance morte, venue = affordance morte.** La page de destination est prête pour trois types dont deux ne peuvent jamais être alimentés par l'UI.

**Avis (reviews)** — `POST /reviews`, `GET /reviews/:targetType/:targetId`, `DELETE /reviews/:id` sont implémentés, testés (`reviews.controller.spec.ts`, `reviews.service.spec.ts`) et polymorphes. **Zéro consommation frontend.** Les champs `rating` et `reviewCount` sont affichés sur les cartes prestataire/lieu, mais aucune UI ne permet de lire ou d'écrire un avis, et l'écran « Mes avis » est un placeholder.

**Ownership event** — `canManageEvent` est appliqué uniformément sur guests, invitations, access requests, ticket-types, venue bookings et vendor requests. Pas de trou de polymorphisme ici.

---

## 15. Legacy integration paths

**Classés, non supprimés.**

| Élément | Emplacement | Statut |
|---|---|---|
| `POST /payments/checkout` (Stripe) | `payments.controller.ts:27` | Orphelin — remplacé par `POST /ticket-orders` |
| `POST /payments/webhook` (Stripe) | `payments.controller.ts:44` | Orphelin côté web (appelé par Stripe si configuré) |
| `POST /payments/refund/:purchaseId` | `payments.controller.ts:66` | Orphelin |
| `stripe-payment.provider.ts` + spec | `payments/providers/` | Legacy actif dans le registry |
| `stripe-payment-finalization.schema.ts` | `payments/` | Schéma Mongo legacy |
| `/(public)/stripe-connect` | web | `PlaceholderPage` |
| `/(public)/checkout/[eventId]` | web | `PlaceholderPage` « paiement indisponible » — vestige du flux Stripe, non aligné sur `PAID_CHECKOUT_ENABLED` |
| `/(dashboard)/organisateur/*` (5 pages) | web | Arbre de routes legacy non navigable |
| `/(dashboard)/prestataire`, `/(dashboard)/gestionnaire/*` (3 pages) | web | Idem |
| `/(dashboard)/invites`, `/(dashboard)/billetterie` | web | `/billetterie` est actif ; `/invites` est un stub |
| `ticketsService.validate` / `.listByEvent` | web | Contrat de billetterie v1 |
| `favoritesAuthService` | web | Client favoris v1 |
| `vendorProfileService.getMyRequests/respondToRequest` | web | Client demandes v1 |
| `venueProfileService.getMyBookings/respondToBooking` | web | Client réservations v1 |
| `setAuthToken` / `setRefreshTokenFn` | `api.ts:26-34` | No-op de compatibilité, documentés comme temporaires |
| `useAuthToken` sentinelle + 5 tests morts | web | Reliquat de la migration cookies |
| Hooks exportés jamais consommés | `useEvents`, `useEvent`, `useTickets`, `useTicketTypes`, `useGuests`, `useDiscovery`, `useVendors` | Barrels `index.ts` |

**Incohérence de feature flag** — l'API porte `PAID_CHECKOUT_ENABLED`, `PAYPAL_PROVIDER_ENABLED`, `TEST_PAYMENT_PROVIDER_ENABLED` (`config/configuration.ts`). Le web n'a **aucun flag correspondant** : `/checkout/[eventId]` affiche « paiement indisponible » en dur quel que soit l'état serveur, tandis que `PurchaseModal` tente réellement le paiement. Deux chemins qui répondent différemment à la même question.

---

## 16. Test coverage matrix

| Feature | API unit | API E2E | Web unit | Web E2E | Full journey | Negative | Auth | Mobile |
|---|---|---|---|---|---|---|---|---|
| Auth | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Onboarding | ✅ | — | ✅ | ✅ | Partiel | ✅ | ✅ | — |
| Dashboard organisateur | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Wizard création | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Event Workspace | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Accès événement | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Événement public | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Billets gratuits | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Billetterie payante | ✅ | ✅ | ✅ | ✅ | Partiel | ✅ | ✅ | — |
| PayPal | ✅ | — | ✅ | ✅ | Non | ✅ | — | — |
| Participation | — | — | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Médias | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Invitations | ✅ | — | ✅ | — | Partiel | ✅ | ✅ | — |
| Invités / guests | ✅ | — | — | — | **Non** | — | — | — |
| **Favoris** | ✅ | — | **Aucun** | **Aucun** | **Non** | — | — | — |
| **Profil prestataire** | ✅ | — | **Aucun** | **Aucun** | **Non** | — | — | **Non** |
| **Demandes prestataire** | ✅ | — | **Aucun** | **Aucun** | **Non** | — | — | **Non** |
| **Profil lieu** | ✅ | — | **Aucun** | **Aucun** | **Non** | — | — | **Non** |
| **Réservations lieu** | ✅ | — | **Aucun** | **Aucun** | **Non** | — | — | **Non** |
| **Scan billets** | ✅ | — | **Aucun** | **Aucun** | **Non** | — | — | — |
| Notifications | ✅ | — | **Aucun** | **Aucun** | **Non** | — | — | — |
| Avis | ✅ | — | — | — | **Non** | — | — | — |
| Recherche | ✅ | — | — | — | **Non** | — | — | — |

**La corrélation est totale : les six domaines sans aucun test web sont exactement les six domaines porteurs d'un P1.** Les tests unitaires API sont verts sur toutes ces features — ils valident le contrat côté serveur, jamais la jonction.

`favorites.controller.spec.ts` et `favorites.service.spec.ts` passent en testant `POST /favorites`, `GET /favorites`, `DELETE /favorites` — c'est-à-dire précisément les routes que le frontend n'appelle pas. **Test unitaire vert malgré parcours E2E cassé**, cas d'école.

---

## 17. Playwright smoke results

Suite existante : 32 specs (`e2e/functional/`, `e2e/visual/`). Elle couvre auth, wizard, workspace, événement public, participant, paiement désactivé, a11y, scroll, sécurité.

Un spec de diagnostic dédié est présent sur la branche : `e2e/functional/system-wide-integration-audit.spec.ts` (non commité). Il encode en assertions exécutables les findings F-01, F-02, F-03, les affordances anonymes événement/prestataire/lieu, la protection de la route scanner, et un smoke réseau responsive sur 4 viewports avec capture des réponses ≥ 400.

**Ce spec est conçu pour échouer aujourd'hui** — c'est un détecteur, pas une régression. Il servira de critère d'acceptation de la vague corrective.

**Exécution finale du spec diagnostique** : 12 scénarios, **4 passés / 8 échoués**, en 23,8 s. Les huit échecs reproduisent les contrats morts attendus : deux routes Favoris, le test des deux mauvais verbes, le payload scanner authentifié rejeté en 400, trois affordances favoris anonymes muettes et l'accès anonyme au scanner. Les quatre scénarios passés couvrent 320×720, 390×844, 768×1024 et 1440×900 : aucun overflow horizontal et aucun échec API inattendu (les 401 normaux de restauration d'une session anonyme sont exclus du détecteur).

La suite générale n'a pas été exécutée en intégralité : elle dépend d'un jeu de données de développement mouvant (des billets historiques portent `event: null`). Les vérifications réseau ciblées donnent des preuves plus stables et reproductibles (§18).

---

## 18. Network failures

Sondes live contre `http://localhost:3001/api/v1`. Toutes reproduites au moment de l'audit.

**Anonyme** (discrimination 404 = route absente / 401 = route présente et protégée) :

```
GET    /favorites/check/507f…?type=event            → 404   ← F-01
DELETE /favorites/507f…?type=event                  → 404   ← F-01
GET    /favorites/me                                → 404   ← F-01
GET    /favorites                                   → 401   (route réelle)
PUT    /vendors/requests/507f…/respond              → 404   ← F-02
PATCH  /vendors/requests/507f…/respond              → 401   (route réelle)
PUT    /venues/bookings/507f…/respond               → 404   ← F-02
PATCH  /venues/bookings/507f…/respond               → 401   (route réelle)
PUT    /vendors/me                                  → 401   ← F-04 (capté par PUT /:id)
PUT    /venues/me                                   → 401   ← F-04 (capté par PUT /:id)
POST   /tickets/validate                            → 404   ← F-08
GET    /events/507f…/tickets                        → 404   ← F-08
PATCH  /vendors/507f…                               → 404   ← F-07
DELETE /vendors/507f…                               → 404   ← F-07
```

**Authentifié (organisateur)** :

```
POST /tickets/scan {"eventId":"507f…","qrCode":"xxx"}
  → 400  {"message":["property eventId should not exist"]}     ← F-03
POST /tickets/scan {"qrCode":"xxx"}
  → 404  {"message":"Code QR invalide ou introuvable."}        (contrat respecté)
GET  /favorites/check/507f…?type=event
  → 404  {"message":"Cannot GET /api/v1/favorites/check/…"}     ← F-01
GET  /favorites                        → 200  []
GET  /vendors/not-an-objectid          → 500                    ← F-11
GET  /venues/not-an-objectid           → 500                    ← F-11
GET  /reviews/event/not-an-objectid    → 500                    ← F-11
```

**Sans en-tête `Origin`**, toute mutation authentifiée renvoie `403 Origine de requête non autorisée` — le `TrustedOriginMiddleware` fonctionne comme prévu.

**Smoke HTTP Next.js** — 17 routes testées (`/`, `/evenements`, `/prestataires`, `/lieux`, `/connexion`, `/inscription/etape-1`, `/tableau-de-bord`, `/tableau-de-bord/favoris`, `/billetterie`, `/parametres`, `/tableau-de-bord/prestataires`, `/scan/:id`, `/paiement/succes`, `/checkout/:id`, `/stripe-connect`, `/evenements/recherche`, `/invitation`) : **200 sur toutes**. Aucune route cassée au niveau du rendu — les défauts sont tous en aval, dans la couche d'intégration.

**Données catalogue** — `/events`, `/vendors`, `/venues`, `/events/categories`, `/discovery/*` renvoient tous 200 avec des données non vides. Le catalogue n'est pas la source des états vides observés.

---

## 19. Dev deployment drift

**Audité le 2026-09-07**, sans mutation métier, contre `https://api.dev.elintys.com/api/v1`. Le déployé correspond aux contrats cassés du checkout :

```
GET  /health                                      → 200
GET  /events?limit=1                              → 200
GET  /favorites/check/507f…?type=event            → 404
GET  /favorites/me                                → 404 (anonyme et authentifié)
PUT  /vendors/requests/507f…/respond              → 404 ; PATCH → 401
PUT  /venues/bookings/507f…/respond               → 404 ; PATCH → 401
GET  /vendors/not-an-objectid                     → 500
GET  /venues/not-an-objectid                      → 500
GET  /reviews/event/not-an-objectid               → 500
```

Avec la session QA organisateur :

```
POST /tickets/scan {eventId, qrCode}               → 400 ["property eventId should not exist"]
POST /tickets/scan {qrCode}                        → 404 "Code QR invalide ou introuvable."
GET  /events/not-an-objectid/guests                → 500
GET  /vendors/not-an-objectid/requests             → 500
GET  /venues/not-an-objectid/bookings              → 500
GET  /event-registrations/events/not-an-objectid   → 400 INVALID_OBJECT_ID (contrôle)
GET  /ticket-types/events/not-an-objectid/manage   → 400 INVALID_OBJECT_ID (contrôle)
```

Conclusion : **aucun drift favorable ne masque les findings**. L'API dev déployée reproduit F-01/F-02/F-03/F-11. Les secrets QA et cookies n'ont été ni affichés ni enregistrés dans le rapport.

---

## 20. Mobile findings

### F-14 — La navigation mobile supprime l'accès aux fonctions de rôle (P2)

`src/shared/layout/MobileNav.tsx:17-23` définit **cinq entrées codées en dur, sans aucune lecture des rôles** :

```
/tableau-de-bord   /evenements   /tableau-de-bord/messages   /prestataires   /parametres
```

`Sidebar` est `hidden md:flex` (`layout.tsx:10`). En dessous de 768 px, la sidebar disparaît et la MobileNav est le seul moyen de navigation.

**Conséquence** — Sous 768 px :
- un **prestataire** n'a aucun chemin vers `/tableau-de-bord/prestataire/profil`, `/demandes`, `/ententes`, `/avis` ;
- un **gestionnaire de lieu** n'a aucun chemin vers `/gestionnaire/fiche`, `/reservations`, `/calendrier`, `/ententes` ;
- personne n'a de chemin vers `/tableau-de-bord/favoris`, `/tableau-de-bord/participation`, `/billetterie`, `/tableau-de-bord/invitations`, `/tableau-de-bord/evenements` ;
- 2 des 5 entrées mènent à un placeholder (`/tableau-de-bord/messages`) ou à un stub (`/parametres`).

Un utilisateur mobile atteint donc, au mieux, un écran d'accueil et le catalogue public. **Fonctionnalité desktop non disponible mobile, sans intention produit identifiable** — la logique de rôles existe (`buildNavSections`, testée dans `sidebar-nav.test.ts`), elle n'est simplement pas appelée par la MobileNav.

**Fix recommandé** — Alimenter la MobileNav depuis `buildNavSections(user.roles)`, avec un débordement « Plus » pour les sections au-delà de 4-5 entrées.

**Points positifs vérifiés** — Les pages publiques sont responsive (le spec de diagnostic assert `scrollWidth - innerWidth ≤ 1` sur 320/390/768/1440). Les cibles tactiles respectent `min-h-11` / `min-h-12` sur les CTA récents (`EventPageClient`, `PurchaseModal`, `billetterie`).

---

### F-15 — Le scan de billet n'est pas atomique (P1)

`TicketsService.scan` (`tickets.service.ts:352-381`) lit d'abord le billet par `qrCode`, vérifie que son statut est `VALID`, puis exécute séparément un `findByIdAndUpdate`. Deux scans concurrents peuvent donc lire tous les deux `VALID`, tous les deux écrire `USED` et tous les deux retourner **« Billet scanné avec succès »**. Le bouton désactivé côté UI ne protège pas deux appareils ou deux requêtes parallèles.

Le test unitaire (`tickets.service.spec.ts:451-495`) ne couvre qu'un scan séquentiel mocké et vérifie seulement qu'une mise à jour a été appelée. Il ne teste ni course, ni filtre conditionnel, ni résultat `null`. Le correctif doit consommer atomiquement avec un filtre `{ qrCode, status: VALID }`, distinguer « déjà utilisé » du code inconnu, et ajouter un test de concurrence réel. Le contexte `eventId` de l'URL scanner doit aussi être vérifié côté serveur afin qu'un organisateur possédant plusieurs événements ne valide pas un billet du mauvais événement dans le mauvais écran.

---

### F-16 — Réponses et annulations prestataire/lieu non atomiques (P1)

`respondToRequest` (`vendors.service.ts:218-264`) et `respondToBooking` (`venues.service.ts:134-177`) font tous deux : lecture `PENDING` → contrôle → `findByIdAndUpdate` sans inclure le statut attendu dans le filtre → notification/email. Deux réponses simultanées peuvent donc toutes deux réussir, la dernière écriture gagner, et deux notifications potentiellement contradictoires partir. `cancelRequest` supprime après une lecture séparée ; `cancelBooking` réécrit aussi après une lecture séparée. Une annulation peut courir contre une acceptation.

Le défaut est serveur et reste présent même après correction du verbe frontend F-02. Les transitions doivent utiliser une opération conditionnelle atomique (`findOneAndUpdate`/`findOneAndDelete` avec statut source et ownership dans le filtre), traiter `null` comme conflit de transition, et déclencher les effets secondaires uniquement pour l'opération gagnante. Les tests actuels mockent le chemin nominal mais aucun `Promise.all` concurrent.

---

### F-17 — `ADMIN` annoncé par les contrôleurs mais ignoré par plusieurs services (P2)

Plusieurs routes déclarent `@Roles(..., Role.ADMIN)` puis ne transmettent que `user.sub` à un service qui exige une égalité stricte avec l'owner : scan et gestion des types de billets (`TicketsService.assertEventOwner`), invités (`GuestsService.assertEventOwner`), plusieurs opérations Event (`findOne`, readiness, archive/restore, publish/cancel, médias), mise à jour prestataire/lieu et demandes prestataire. `canManageEvent` sait pourtant autoriser `roles.includes('admin')`, et les chemins plus récents Access V2 / certaines réservations lui passent bien `user.roles`.

Conséquence : la garde de rôle laisse entrer l'admin, puis la couche métier le refuse comme non-owner. Le contrat d'autorisation dépend du module. Aucun compte QA admin n'étant disponible, le constat est statique mais déterministe. Il faut soit retirer `ADMIN` des décorateurs lorsque l'administration globale n'est pas voulue, soit transporter un acteur `{ userId, roles }` jusqu'à une policy commune et tester admin/owner/autre utilisateur.

---

### F-18 — Une panne de `/auth/me` est convertie en déconnexion (P2)

`authService.refreshSession` (`auth.service.ts:121-127`) capture **toute** erreur — 401 attendu, mais aussi 429, 500, timeout ou panne réseau — et retourne `null`. `AuthProvider` l'interprète comme absence de session ; `ProtectedRoute` peut ensuite rediriger vers la connexion. Une indisponibilité transitoire de l'API devient donc un faux logout sans état de retry ni message utilisateur.

Le client doit distinguer l'absence d'authentification (401/403 selon contrat) d'une erreur de restauration. L'état global a besoin d'un état `error/degraded` ou d'un retry borné avant de conclure que la session est absente.

---

### F-19 — Recherche publique : regex brutes et pagination non bornée (P2)

Les cinq endpoints `discovery/*` lisent `q`, `city`, `page` et `limit` comme chaînes puis appliquent `parseInt` sans DTO, minimum ni maximum (`discovery.controller.ts:18-89`). `DiscoveryService` injecte directement les valeurs dans `$regex` (`:30-31`, `:71-75`, `:83-99`). Contrairement à la conclusion initiale du rapport, `escapeRegExp` **n'est pas appliqué à ces routes Discovery**.

Un appel public peut donc modifier la sémantique de recherche avec des métacaractères, demander une limite très élevée, un offset négatif/NaN ou une regex coûteuse. Le throttling réduit le volume d'appels, pas le coût unitaire Mongo. Utiliser des DTO transformés/bornés et une chaîne littérale échappée ; envisager ensuite un index texte/recherche dédiée plutôt que des regex non ancrées sur plusieurs collections.

---

### F-20 — Les pages détail publiques transforment toute panne API en 404 (P2)

`prestataires/[id]/page.tsx:40-43` et `lieux/[id]/page.tsx:42-45` appellent `notFound()` pour **tout** `!res.ok`. Un 401 inattendu, 429 ou 500 devient donc « introuvable », y compris lors du F-11. `generateMetadata` suit la même logique et peut produire un titre « introuvable » pendant une panne.

Les pages doivent réserver `notFound()` au 404 métier, laisser les autres statuts remonter vers `error.tsx`/une UI réessayable et utiliser un contrat d'erreur partagé.

---

### F-21 — Références Favoris/Avis non validées et races de doublon (P2)

`CreateFavoriteDto.targetId` et `CreateReviewDto.targetId` utilisent `@IsString()` au lieu de `@IsMongoId()`. Les services construisent directement `new Types.ObjectId(targetId)` et ne vérifient jamais l'existence d'une cible correspondant au `targetType`. Il est donc possible d'enregistrer une référence orpheline bien formée ; une référence mal formée déclenche un 500.

Les deux services font aussi un `findOne` avant `create`. Les index uniques empêchent heureusement deux documents, mais deux créations concurrentes peuvent franchir ensemble le pré-contrôle : l'une réussit, l'autre remonte un `E11000` générique en 500 au lieu du 409 documenté. Valider le format, résoudre la collection cible, puis mapper explicitement le duplicate key.

---

### F-22 — Client Discovery exporté mais contractuellement périmé (P3)

Le hook inutilisé `useDiscovery` envoie à `/discovery/events` des paramètres `query`, `category`, `startDate`, `endDate`, `location`, `perPage`; l'API ne lit que `q`, `city`, `page`, `limit`. Son type attend `id`, `location: string`, `coverImageUrl` et `PaginatedResponse`, tandis que l'API renvoie `_id`, un objet `location`, `coverImage` et `{ data, total }`. Il est aujourd'hui dormant ; le brancher produirait des filtres ignorés et des champs `undefined` sans erreur de compilation à la frontière HTTP.

---

## 21. Accessibility findings

**Bon niveau général.** `aria-label` sur les boutons icônes, `aria-pressed` sur le bouton favori, `role="status"` / `aria-live="polite"` sur les retours d'accès (`EventPageClient.tsx:196,243`), `role="alert"` sur les erreurs, `aria-busy` sur les squelettes, `useReducedMotion` respecté dans la MobileNav, focus rings explicites.

**Défauts :**

- **P2** — Bouton favori anonyme (`FavoriteButton.tsx:32-53`) : `title="Connectez-vous pour sauvegarder"` n'est pas exposé au lecteur d'écran comme raison d'inaction, et le bouton **n'est pas `disabled`** : il annonce `aria-label="Ajouter aux favoris — connexion requise"` puis ne fait rien au clavier comme à la souris. Action présentée comme disponible et inactive.
- **P2** — Aucune live region sur les mutations favoris : le succès comme l'échec sont muets pour un lecteur d'écran.
- **P3** — Boutons `disabled` sans explication : `EventPageClient.tsx:317` (`disabled={available === 0 || !ticketAccessAllowed}`) — le libellé change pour « Complet » quand `available === 0`, mais reste identique quand c'est la politique d'accès qui bloque. L'utilisateur ne sait pas pourquoi.
- **P3** — `prestataire/profil` et `gestionnaire/fiche` : pas de `role="status"` sur le message de succès (`isSuccess && <p>Profil mis a jour avec succes.</p>`), donc non annoncé.
- **P3** — Textes sans accents dans plusieurs écrans anciens (« Evenements », « Decouvrir », « mis a jour avec succes », « Repondre ») alors que le reste du produit est accentué. **Divergence FR/EN et FR/FR sur une même fonctionnalité** ; les écrans récents passent par des fichiers `*.copy.ts` / `messages/fr.json`, les anciens ont des chaînes en dur.

---

## 22. Security findings

**Aucun P0 et aucun IDOR confirmé. Deux P1 d'intégrité/concurrence métier sont ouverts** (F-15/F-16) :

- ownership vérifié serveur pour owner/autre utilisateur/anonyme sur les ressources sondées (§12) ;
- aucune autorité métier acceptée depuis le client ;
- `whitelist` + `forbidNonWhitelisted` empêchent le mass assignment ;
- `TrustedOriginMiddleware` actif sur les mutations ;
- cookies httpOnly, pas de token en `localStorage` ;
- `sanitizeRedirectPath` correct ;
- `isTrustedApprovalUrl` protège contre la redirection ouverte et correspond au périmètre sandbox actuel (F-06) ;
- throttling global (`ElintysThrottlerGuard`), testé en E2E ;
- webhook PayPal avec vérification de signature dédiée et schéma d'événements persisté ;
- `escapeRegExp` appliqué dans les catalogues principaux, **mais pas dans Discovery** (F-19).

**Findings :**

- **P1 (F-15/F-16)** — transitions non atomiques : admission QR potentiellement doublée et décisions prestataire/lieu concurrentes.
- **P2 (F-11/F-21)** — `CastError → 500` sur des routes publiques et privées ; références polymorphes mal formées/orphelines acceptées trop tard ou sans contrôle.
- **P2 (F-19)** — regex publiques brutes et pagination non bornée sur Discovery.
- **P3 — Exposition d'identifiants internes** : `GET /vendors` et `GET /venues` (publics) utilisent `.select('-__v')`, donc renvoient le champ `user` (ObjectId du compte propriétaire) et `isActive`. Vérifié :
  `{"_id":"6a6c53c1…","user":"6a6c53c0983ea5278d346615","businessName":"Lumière Nord",…}`
  Les équivalents `/discovery/vendors` et `/discovery/venues` appliquent une projection propre et ne fuient rien. Le frontend consomme les versions **fuyantes**.
- **P3 — Pas de contrôle de rôle côté UI** (`ProtectedRoute`) : sans impact sécurité (l'API refuse), mais l'absence de garde côté client rend les 403 indiscernables d'une panne.

---

## 23. Performance / integration findings

- **P2 — N+1 frontend sur Favoris** : `useFavorite` déclenche un `GET /favorites/check/:id` **par carte affichée**. Sur un catalogue de 20 événements : 20 requêtes, toutes en 404, chacune rejouée 3 fois par le `retry` par défaut de TanStack Query → **80 requêtes 404 par affichage de page**. Le remplacement par une lecture unique de `GET /favorites` supprime le N+1 en même temps que le bug.
- **P3 — Refetch inutile** : `['event', id, 'creation']` vs `['event', id]` (§13).
- **P3 — Polling non borné** : `NotificationBell.tsx:40` — `refetchInterval: 30_000` sans condition de visibilité de l'onglet ni arrêt sur erreur. Un utilisateur avec l'onglet ouvert 8 h génère ~960 requêtes ; si la route échoue, elle est rejouée indéfiniment.
- **P2 — Recherche publique non bornée** : une seule requête Discovery peut demander une limite arbitraire et plusieurs regex brutes ; le throttling ne borne pas son coût Mongo (F-19).
- **Bon** — Le partage de la clé `['event', id]` entre le shell du workspace et ses 9 onglets évite un N+1 significatif. `fetchCatalogJson` utilise `next.revalidate` et un timeout de 5 s.
- **Bon** — Pas de N+1 backend détecté : les listes utilisent `Promise.all([find, countDocuments])` et des `populate` ciblés.

---

## 24. Résumé P0 / P1 / P2 / P3

### P0 — 0
Aucune perte de données, exposition critique, paiement incorrect, contournement d'authentification ni corruption durable.

### P1 — 7
| ID | Finding |
|---|---|
| F-01 | Favoris : 3 routes frontend inexistantes, 2 clients concurrents, faux état vide |
| F-02 | Prestataire & gestionnaire : réponse à une demande impossible (verbe + champ) |
| F-03 | Scanner QR : payload rejeté à 100 % (`property eventId should not exist`) |
| F-04 | `PUT /vendors/me` / `PUT /venues/me` résolvent vers `PUT /:id` → 500 |
| F-05 | Aucun profil prestataire/lieu n'est jamais créé par le produit |
| F-15 | Scan QR non atomique : deux requêtes concurrentes peuvent toutes deux admettre le même billet |
| F-16 | Réponses/annulations prestataire et lieu non atomiques, effets secondaires contradictoires possibles |

F-06 n'est pas un P1 actuel : le backend refuse explicitement tout mode PayPal live. Il devient une exigence de release avant toute future activation live.

### P2 — 18
F-07 (`vendorsService` verbes), F-08 (`ticketsService` routes mortes), F-09 (`isFree` perdu), F-11 (ObjectId/CastError 500 étendu), F-12 (`category` enum), F-13 (`organizer` non peuplé + champ inexistant), F-14 (navigation mobile sans rôles), F-17 (`ADMIN` déclaré mais refusé par plusieurs services), F-18 (panne auth convertie en logout), F-19 (regex/pagination Discovery), F-20 (500 public converti en 404), F-21 (références polymorphes et races de doublon), post-login uniforme → 403 pour 2 rôles sur 3, optimistic UI favoris sans restitution d'erreur, `useQuery` sans `isError` sur 7 écrans, N+1 favoris (80 requêtes/page), recherche avancée non branchée, affordances favorites vendor/venue/événement muettes.

### P3 — 14
F-06 (préparation PayPal live), F-10 (`unreadOnly` ignoré), F-22 (client Discovery dormant et périmé), fuite `user` dans les catalogues publics, 5 copies d'`authFetch`, 3 paires de types dupliqués, 7 hooks exportés jamais consommés, 8 pages legacy dont 5 en squelette infini, `/parametres` et `/tableau-de-bord/prestataires` en stub, clé de cache `['event', id, 'creation']`, polling notifications non borné, `ProtectedRoute` sans rôle, a11y (disabled sans explication, succès non annoncé), chaînes non accentuées en dur dans les écrans anciens.

---

## 25. Recommended corrective waves

**Vague 1 — Réparer les P1 et l'atomicité** (F-01 à F-05, F-12, F-15, F-16)
Objectif : que prestataire, gestionnaire, favoris et scan fassent ce qu'ils prétendent faire, sans double effet concurrent. Corriger les contrats UI, ajouter la création de profil, aligner `category`, rendre scan/réponse/annulation conditionnels et atomiques. Critère de sortie : le spec de diagnostic passe au vert et les nouveaux tests concurrents démontrent un seul gagnant.

**Vague 2 — Unifier et borner les contrats** (F-07 à F-11, F-13, F-17 à F-22)
Supprimer les 5 copies d'`authFetch` au profit du client partagé ; supprimer les méthodes périmées ; appliquer `ParseObjectIdPipe`/DTO bornés partout ; centraliser l'acteur owner/admin ; distinguer panne auth et 401 ; échapper/borner Discovery ; valider les références polymorphes ; peupler `organizer` et projeter les catalogues publics. F-06 ne doit être traité qu'avec la future activation PayPal live.

**Vague 3 — Vérité de l'état UI**
Ajouter une branche `isError` à chacun des 7 `useQuery` identifiés ; distinguer 404 / vide / erreur ; brancher le bouton favori anonyme sur `getLoginPath` ; ajouter les live regions. Poser une règle de lint ou de revue : *aucun `useQuery` sans traitement explicite de l'erreur*.

**Vague 4 — Couverture E2E des parcours orphelins**
Un E2E complet par domaine P1 (favoris, prestataire, gestionnaire, scan), chacun traversant UI → réseau → base → UI, plus des tests API de concurrence. C'est la vague qui empêche la récidive : les sept P1 auraient été détectés par ces parcours et doubles soumissions.

**Vague 5 — Nettoyage et parité mobile**
MobileNav alimentée par les rôles ; suppression de l'arbre legacy `/(dashboard)/organisateur|prestataire|gestionnaire` ; suppression des hooks non consommés ; décision produit sur reviews et recherche avancée (brancher ou retirer les entrées de navigation) ; harmonisation des chaînes accentuées.

---

## 26. Prioritized remediation plan

| Lot | Contenu | Findings | Effort | Débloque |
|---|---|---|---|---|
| **Batch 1 — P0/P1** | Favoris rebranché ; prestataire/gestionnaire répondent ; scan QR ; `PUT /*/me` ; création de profil ; transitions scan/réponse/annulation atomiques | F-01…F-05, F-12, F-15, F-16 | Élevé | Rôles prestataire + gestionnaire, contrôle d'accès fiable, favoris |
| **Batch 2 — Contract mismatches** | `ParseObjectIdPipe`/DTO étendus ; rôle admin cohérent ; distinction 401/panne auth ; Discovery bornée ; références polymorphes validées ; `isFree`, `organizer`, projections publiques | F-09…F-11, F-13, F-17…F-22 | Moyen | Robustesse publique, vérité des erreurs et des rôles |
| **Batch 3 — Duplicate clients / stale** | 5 `authFetch` → client partagé ; suppression `favoritesAuthService`, `vendorProfileService.*Request*`, `venueProfileService.*Booking*`, `ticketsService.validate/listByEvent`, `vendorsService.update/delete` ; unification des 3 paires de types | F-07, F-08, §8 | Moyen | Empêche la récidive du schéma v1/v2 |
| **Batch 4 — Missing E2E** | 1 E2E complet par domaine P1 + spec diagnostique + tests de concurrence réels | §16, §17, F-15, F-16 | Moyen | Filet de sécurité permanent |
| **Batch 5 — UX truthfulness / polish** | `isError` sur 7 écrans ; favori anonyme → connexion ; MobileNav par rôles ; suppression du legacy ; live regions ; accents | §9, §10, §20, §21 | Moyen | Confiance utilisateur |

**Ordre imposé** : Batch 1 avant tout le reste (parcours métier bloqués). Batch 4 immédiatement après Batch 1, avant Batch 3 — supprimer du code mort sans filet E2E rejouerait exactement le scénario qui a produit cet audit.

---

## 27. Annexe — Endpoint map

Légende : `auth` = authentification requise ; `public` = `@Public()` ; suffixe de rôle = `@Roles(...)`.
« Consommé par web » = au moins un site d'appel frontend résout vers cette route.

⚠️ **Piège de lecture** — « Consommé par web : yes » signifie *une route résout*, pas *la bonne route résout*.
`PUT /vendors/:id` et `PUT /venues/:id` sont marqués « yes » **uniquement parce qu'ils captent
`PUT /vendors/me` et `PUT /venues/me`** (F-04). C'est exactement la classe de défaut qu'un diff
mécanique verbe+chemin ne peut pas voir.

| Verb | API route | Auth | Consumed by web |
|---|---|---|---|
| POST | `/auth/register` | public | yes |
| POST | `/auth/login` | public | yes |
| POST | `/auth/refresh` | public | **no** |
| GET | `/auth/me` | auth | yes |
| PATCH | `/auth/onboarding/:role` | auth | yes |
| POST | `/auth/logout` | public | yes |
| POST | `/auth/forgot-password` | public | yes |
| POST | `/auth/reset-password` | public | yes |
| POST | `/auth/verify-email` | public | yes |
| POST | `/auth/resend-verification` | public | yes |
| GET | `/discovery/search` | public | **no** |
| GET | `/discovery/featured` | public | yes |
| GET | `/discovery/events` | public | yes |
| GET | `/discovery/vendors` | public | **no** |
| GET | `/discovery/venues` | public | **no** |
| POST | `/event-registrations` | auth | yes |
| DELETE | `/event-registrations/:id` | auth | yes |
| GET | `/event-registrations/me` | auth | yes |
| GET | `/event-registrations/events/:eventId` | auth | **no** |
| POST | `/events` | auth / ORGANISATEUR, ADMIN | yes |
| GET | `/events` | public | yes |
| GET | `/events/categories` | public | yes |
| GET | `/events/my` | auth / ORGANISATEUR, ADMIN | yes |
| GET | `/events/my/summary` | auth / ORGANISATEUR, ADMIN | yes |
| PATCH | `/events/:id/archive` | auth / ORGANISATEUR, ADMIN | yes |
| PATCH | `/events/:id/restore` | auth / ORGANISATEUR, ADMIN | yes |
| GET | `/events/slug/:slug` | public | yes |
| POST | `/events/:id/access/code/verify` | public | yes |
| GET | `/events/access/:token` | public | **no** |
| POST | `/events/:id/access/domain/check` | auth | yes |
| GET | `/events/:id/access` | auth | **no** |
| POST | `/events/:id/access/request` | auth | yes |
| GET | `/events/:id/access/my-request` | auth | yes |
| GET | `/events/:id/access/requests` | auth / ORGANISATEUR, ADMIN | yes |
| PATCH | `/events/:id/access/requests/:requestId` | auth / ORGANISATEUR, ADMIN | yes |
| GET | `/events/:id/invitations` | auth / ORGANISATEUR, ADMIN | yes |
| PUT | `/events/:id/access-configuration` | auth / ORGANISATEUR, ADMIN | yes |
| GET | `/events/:id/publish-readiness` | auth / ORGANISATEUR, ADMIN | yes |
| GET | `/events/:id` | auth / ORGANISATEUR, ADMIN | yes |
| PUT | `/events/:id` | auth / ORGANISATEUR, ADMIN | **no** |
| PATCH | `/events/:id` | auth / ORGANISATEUR, ADMIN | yes |
| POST | `/events/:eventId/cover` | auth / ORGANISATEUR, ADMIN | yes |
| DELETE | `/events/:eventId/cover` | auth / ORGANISATEUR, ADMIN | yes |
| POST | `/events/:eventId/gallery` | auth / ORGANISATEUR, ADMIN | yes |
| DELETE | `/events/:eventId/gallery` | auth / ORGANISATEUR, ADMIN | yes |
| DELETE | `/events/:id` | auth / ORGANISATEUR, ADMIN | yes |
| PATCH | `/events/:id/publish` | auth / ORGANISATEUR, ADMIN | yes |
| PATCH | `/events/:id/cancel` | auth / ORGANISATEUR, ADMIN | **no** |
| POST | `/favorites` | auth | yes |
| GET | `/favorites` | auth | yes |
| DELETE | `/favorites` | auth | yes |
| POST | `/events/:eventId/guests` | auth | yes |
| POST | `/events/:eventId/guests/bulk` | auth | **no** |
| GET | `/events/:eventId/guests` | auth | yes |
| PUT | `/events/:eventId/guests/:id` | auth | yes |
| DELETE | `/events/:eventId/guests/:id` | auth | yes |
| GET | `/health` | public | **no** |
| GET | `/health/client` | public | **no** |
| POST | `/invitations` | auth | yes |
| GET | `/invitations/me` | auth | **no** |
| GET | `/invitations/received` | auth | yes |
| POST | `/invitations/accept/:token` | public | yes |
| GET | `/notifications/me/unread-count` | auth | yes |
| GET | `/notifications/me` | auth | yes |
| PATCH | `/notifications/:id/read` | auth | yes |
| PATCH | `/notifications/read-all` | auth | yes |
| POST | `/payments/checkout` | auth | **no** |
| POST | `/payments/webhook` | public | **no** |
| POST | `/payments/refund/:purchaseId` | auth / ORGANISATEUR, ADMIN | **no** |
| POST | `/payments/paypal/webhook` | public | **no** |
| POST | `/reviews` | auth | **no** |
| GET | `/reviews/:targetType/:targetId` | public | **no** |
| DELETE | `/reviews/:id` | auth | **no** |
| POST | `/ticket-orders` | auth | yes |
| GET | `/ticket-orders/me` | auth | **no** |
| GET | `/ticket-orders/:id` | auth | yes |
| POST | `/ticket-orders/:id/sync-payment` | auth | yes |
| POST | `/ticket-orders/:id/cancel` | auth | **no** |
| POST | `/ticket-orders-maintenance/expire` | auth / ADMIN | **no** |
| POST | `/ticket-types/events/:eventId` | auth / ORGANISATEUR, ADMIN | yes |
| GET | `/ticket-types/events/:eventId` | public | **no** |
| GET | `/ticket-types/events/:eventId/manage` | auth / ORGANISATEUR | yes |
| PUT | `/ticket-types/:id` | auth / ORGANISATEUR, ADMIN | yes |
| DELETE | `/ticket-types/:id` | auth / ORGANISATEUR, ADMIN | yes |
| GET | `/tickets/my` | auth | yes |
| POST | `/tickets/purchase` | auth | yes |
| POST | `/tickets/scan` | auth / ORGANISATEUR, ADMIN | yes |
| POST | `/vendors` | auth / PRESTATAIRE, ADMIN | yes |
| GET | `/vendors` | public | yes |
| GET | `/vendors/me` | auth / PRESTATAIRE | yes |
| GET | `/vendors/requests/my` | auth / PRESTATAIRE | yes |
| PATCH | `/vendors/requests/:requestId/respond` | auth / PRESTATAIRE | yes |
| DELETE | `/vendors/requests/:requestId` | auth / ORGANISATEUR, ADMIN | yes |
| GET | `/vendors/:id` | public | yes |
| PUT | `/vendors/:id` | auth / PRESTATAIRE, ADMIN | yes |
| POST | `/vendors/:eventId/requests` | auth / ORGANISATEUR, ADMIN | yes |
| GET | `/vendors/:eventId/requests` | auth / ORGANISATEUR, ADMIN | yes |
| POST | `/venues` | auth / GESTIONNAIRE_SALLE, ADMIN | **no** |
| GET | `/venues` | public | yes |
| GET | `/venues/me` | auth / GESTIONNAIRE_SALLE | yes |
| GET | `/venues/bookings/my` | auth / GESTIONNAIRE_SALLE | yes |
| PATCH | `/venues/bookings/:bookingId/respond` | auth / GESTIONNAIRE_SALLE | yes |
| PATCH | `/venues/bookings/:bookingId/cancel` | auth / ORGANISATEUR, ADMIN | **no** |
| GET | `/venues/:id` | public | yes |
| PUT | `/venues/:id` | auth / GESTIONNAIRE_SALLE, ADMIN | yes |
| POST | `/venues/:eventId/bookings` | auth / ORGANISATEUR, ADMIN | yes |
| GET | `/venues/:eventId/bookings` | auth | yes |
| POST | `/waitlist` | public | yes |
| GET | `/waitlist/count` | public | yes |

TOTAL API ROUTES: 109
TOTAL FRONTEND CALL SITES: 105
ORPHAN ROUTES: 26

---

## 28. Statut final

**SYSTEM-WIDE INTEGRATION AUDIT — COMPLETE**

L'audit est complet sur le code, les contrats et les parcours accessibles avec les comptes disponibles. Limite résiduelle explicitement documentée : absence de comptes QA `prestataire`, `gestionnaire_salle` et `admin`; leurs constats d'autorisation/route reposent donc sur le chemin statique complet et des sondes de résolution non destructives. Aucun code produit n'a été corrigé, aucun commit, push ou PR n'a été créé.
