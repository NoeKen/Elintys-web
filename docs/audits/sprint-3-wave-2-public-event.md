# Sprint 3 — Vague 2 — Page publique détaillée d'un événement

Date de clôture : 17 août 2026  
Périmètre : `Elintys-api` et `Elintys-web`, branches `dev` uniquement.

## Verdict exécutif

La page `/evenements/[slug]` est devenue la destination participant attendue. Le backend fournit une
projection explicitement allowlistée; le frontend rend le hero dans le HTML initial, distingue
découvrabilité, accès et admission, n'affiche que les relations réellement confirmées et applique
les règles SEO public/unlisted/private. La Phase 24B restaure le scroll natif sans hack global.

**Note : 9,3/10 — VAGUE 2 VALIDÉE.**

## 1. État Git initial

Après fetch, les deux arbres étaient propres et synchronisés :

| Dépôt | Branche | HEAD initial | `origin/dev` initial |
|---|---|---|---|
| API | `dev` | `ccee08504080906d15d63613da973ace0ea96f06` | identique |
| Web | `dev` | `d32da39fa2ac7d8bef658ae3839d6c38910d23fa` | identique |

Aucun commit n'a été créé sur `main`/`master`, aucune migration, suppression d'index ou opération
irréversible n'a été nécessaire.

## 2. Audit

Le préaudit est consigné dans `sprint-3-wave-2-public-event-preaudit.md`. L'ancienne page utilisait
un contrat Event générique, concentrait le rendu dans un client component, mélangeait partiellement
accès et admission et ne pouvait pas afficher proprement lieu, organisateur, prestataires confirmés,
billets ou événements similaires. Metadata, sitemap, états de route et galerie étaient incomplets.

Les sections programme, conférenciers et FAQ ne sont pas supportées par le modèle actuel et n'ont
pas été inventées. Le wizard six étapes, Event Access V2, F-047 et la billetterie transactionnelle
restent hors périmètre.

## 3. Architecture

- `GET /events/slug/:slug` reste la source de vérité et retourne `PublicEventDetail`.
- La projection est construite par allowlist, puis les relations bornées sont résolues en parallèle.
- Le Server Component récupère, normalise, produit metadata/JSON-LD et rend toute l'expérience.
- Les seuls îlots clients sont les actions d'accès, la galerie et la réservation existante.
- Le normaliseur frontend tolère brièvement un cache ISR de l'ancien contrat sans inventer de champ.

## 4. Projection publique

| Variante | Détail direct | Catalogue | Sitemap | Robots | Similaires |
|---|---|---|---|---|---|
| public, published, actif | oui | oui | oui | index/follow | oui |
| unlisted, published, actif | oui | non | non | noindex/nofollow | non |
| private | 404 uniforme | non | non | noindex | non |
| draft, archivé ou annulé | 404 uniforme | non | non | noindex | non |

Le lieu actif utilise une projection d'adresse publique; l'organisateur n'expose que `name`; les
prestataires viennent uniquement des `VendorRequest` acceptées et de profils actifs; les billets ne
sont inclus que pour `free_ticket`/`paid_ticket`; les similaires sont limités à quatre, futurs,
publics, actifs et excluent l'événement courant.

## 5. Hero

Le hero affiche couverture optimisée ou fallback de marque, type, titre, description courte, date,
lieu et résumé d'accès. Son texte est rendu côté serveur et apparaît dans le HTML initial. L'image
utilise `next/image`; aucun chargement client n'est requis pour comprendre l'événement.

## 6. Sections

Les sections sont conditionnelles et n'apparaissent qu'en présence de données réelles : à propos,
informations essentielles, galerie, lieu, organisateur, prestataires confirmés, billets disponibles
et événements similaires. Aucun placeholder métier ni prix fictif n'est présenté.

## 7. Access V2

Les sept politiques restent distinctes : `open`, `registration_required`, `access_code`,
`email_domain`, `manual_approval`, `guest_list`, `invitation_token`. Les codes sont vérifiés par
l'API; une réponse invalide est annoncée sans exposer le secret. L'API rejette désormais aussi tout
accès par code, grant, domaine, demande ou billet lorsque l'événement est archivé.

## 8. Admission

Les modes `free`, `registration_only`, `free_ticket`, `paid_ticket` et `invitation` sont rendus sans
être confondus avec la politique d'accès. La carte billet ne s'affiche que si le stock réel existe;
la vague n'ajoute ni paiement, ni QR, ni check-in.

## 9. CTA

Le CTA principal dépend du contrat réel : inscription/connexion, saisie de code, vérification de
domaine, demande d'approbation, parcours invitation ou sélection d'un billet. Chaque erreur est
visible et annoncée; aucune action générique ne prétend donner un accès non confirmé.

## 10. SEO

Les pages publiques produisent title, description, canonical, Open Graph, Twitter et JSON-LD
`Event`. Le structured data inclut uniquement lieu, organisateur, image et offres réellement
disponibles. Les pages unlisted sont noindex. Une panne API renvoie désormais une metadata de repli
avec titre non vide et `noindex,nofollow` avant d'afficher la frontière d'erreur.

Avec le streaming de `loading.tsx`, Next peut envoyer le shell avant un `notFound()` et produire un
soft 404 HTTP 200. La frontière API reste un vrai 404, l'UI est neutre et les robots reçoivent
noindex; aucune donnée privée n'est rendue.

## 11. Sitemap

Le sitemap refiltre explicitement `status=published`, `discoverability=public` et l'absence de
`archivedAt`. L'inclusion est couverte unitairement. Le test live tient compte du cache ISR d'une
heure et vérifie surtout qu'aucune fixture unlisted/private/archivée/annulée n'y perce. Les anciennes
URL QA observées dans un sitemap en cache renvoyaient déjà 404 côté API et ne correspondaient plus à
des documents en base.

## 12. Sécurité

- DTO de sortie en allowlist, sans spread d'un document MongoDB ;
- absence testée de `codeHash`, `tokenHash`, progression, email/téléphone et secrets auth ;
- 404 uniforme pour les états non publics, sans fuite de titre ;
- requêtes relationnelles groupées et limites strictes, sans N+1 par carte ;
- JSON-LD sérialisé avec échappement de `<` ;
- protections NestJS et ownership existants conservés ;
- aucune modification de F-047 ou de l'architecture de session API-owned.

## 13. Responsive

Les sept viewports requis passent : `320×720`, `375×812`, `390×844`, `768×1024`, `1024×768`,
`1440×900`, `1538×1100`. Le contrôle exige un overflow horizontal inférieur ou égal à 1 px. Hero,
CTA, galerie, cartes et sections se réorganisent sans texte tronqué ni sidebar desktop imposée.

## 14. Accessibilité

Le rapport Axe final couvre 11 surfaces : public desktop/mobile, sans couverture, code, domaine,
approbation, invitation, ticketing, private/not-found, galerie et erreur réelle. Résultat :
**0 critical, 0 serious, 0 moderate, 0 minor**.

La galerie utilise un Dialog accessible, navigation aux flèches et `Escape`; les messages d'accès
sont annoncés; les cibles de fermeture et quantité font au moins 44 px. Les progressbars dashboard
ont désormais un nom accessible et les titres du footer ne sautent plus de niveaux.

## 15. Performance

Mesures en build production local, médiane de trois contextes froids :

| Cas | TTFB | FCP | LCP | CLS | JS | Images | Payload API |
|---|---:|---:|---:|---:|---:|---:|---:|
| sans cover | 26 ms | 228 ms | 392 ms | 0,0013 | 438,4 Ko | 0 Ko | 1 583 o |
| cover | 23 ms | 144 ms | 384 ms | 0,0013 | 438,4 Ko | 80,9 Ko | 3 996 o |
| galerie | 22 ms | 148 ms | 360 ms | 0,0013 | 438,4 Ko | 80,9 Ko | 3 996 o |

Objectifs LCP/CLS largement atteints, zéro requête de ressource dupliquée et hero dans le HTML
initial. Les deux appels API navigateur sont les sondes auth globales existantes `/auth/me` et
`/auth/refresh`, pas un refetch événement.

## 16. Tests

| Gate | Résultat |
|---|---|
| API lint / typecheck / build | exit 0 / exit 0 / exit 0 |
| API Jest | 47 suites, **550/550** |
| API coverage | 550/550; 72,00 % statements, 63,81 % branches, 66,17 % functions, 72,90 % lines |
| API E2E | 3 suites, **29/29** |
| Web lint | exit 0; 0 erreur, 10 avertissements non bloquants préexistants/hors vague |
| Web typecheck / build | exit 0 / exit 0 |
| Web Vitest + coverage | 33 fichiers, **199/199**; 44,40 % statements, 41,86 % branches, 36,67 % functions, 45,42 % lines |

La couverture globale web reste influencée par de nombreux écrans historiques non testés. Les
nouveaux chemins sont ciblés : normaliseur et rendu serveur à 100 % des lignes, client d'accès à
94,59 % des statements, sitemap à 100 % des lignes.

## 17. E2E

- suite fonctionnelle historique complète : **129 réussis, 2 ignorés intentionnellement, 0 échec
  sur 131**, 9,2 min ;
- suite Vague 2 finale enrichie : **29/29**, incluant setup, 21 règles métier regroupées, sept
  viewports, onze surfaces Axe/captures et galerie ;
- Phase 24B dédiée : **9/9** ;
- fixtures créées par API puis nettoyées en `afterAll` ; aucune donnée QA active résiduelle trouvée.

Le retry de la frontière d'erreur est couvert unitairement; l'erreur serveur réelle a été produite
sur un build isolé pointant vers une API indisponible, puis inspectée et capturée. Le build temporaire
a été déplacé dans la Corbeille après validation.

## 18. QA visuelle

Le rapport détaillé, la référence, la comparaison et toutes les captures sont dans
`docs/design-qa/sprint-3-wave-2/`. Les maquettes non supportées par le modèle sont documentées comme
telles au lieu d'être reproduites avec des données fictives. Score UX : **9,3/10**.

## 19. Commits

### API

- `a99caf4` — `feat(api): expose safe public event details`
- `c25810e` — `fix(api): reject archived participant access`
- `3554916` — `test(api): cover public event projections`

### Web

- `4da761d` — `feat(web): implement immersive public event detail`
- `be458da` — `fix(web): restore native scroll and accessible overlays`
- `cb2f2cd` — `test(web): cover public event participant flows`
- `docs(web): record sprint 3 wave 2 QA` — documentation et preuves finales.

## 20. Push

La cible exclusive est `dev` sur les deux dépôts, sans force push. À la clôture, chaque HEAD est
vérifié identique à `origin/dev` et les arbres de travail sont propres. Aucun workflow GitHub Actions
n'est configuré dans ces dépôts; les gates reproductibles locales ci-dessus constituent la CI de
validation de la vague. Le déclenchement éventuel des plateformes d'hébergement reste géré par leurs
intégrations Git respectives.

## 21. Risques résiduels

| Niveau | Sujet | Décision |
|---|---|---|
| P3 | soft 404 possible avec le streaming Next | API 404, UI neutre et noindex validés |
| P3 | sitemap ISR frais au plus toutes les heures | aucune variante sensible ne traverse le filtre |
| P3 | deux sondes auth globales sur page publique | existant, sans waterfall événement; optimisation future |
| P3 | couverture web globale 44,40 % | nouveaux chemins fortement couverts; dette historique séparée |

Le comportement inertiel exact d'un trackpad physique reste dépendant de l'OS, mais le chemin est
redevenu intégralement natif et les entrées wheel, clavier et touch sont automatisées.

## 22. Verdict

- P0 : **0**
- P1 : **0**
- P2 : **0**
- P3 résiduels documentés : **4**
- tests verts comptabilisés sans double compter les relances ciblées : **907**
  (`550 API unit + 29 API E2E + 199 web unit + 129 web E2E`)
- score UX : **9,3/10**
- accessibilité : **11/11 surfaces Axe, zéro violation**
- performance : **LCP max 392 ms, CLS max 0,0013**
- scroll : **9/9 scénarios dédiés, document natif restauré**

# VAGUE 2 VALIDÉE
