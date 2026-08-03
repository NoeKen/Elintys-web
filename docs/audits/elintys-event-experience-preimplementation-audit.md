# Audit pré-implémentation — Expérience événementielle Elintys

Date de vérification : 2 août 2026  
Périmètre : `Elintys-web` (`dev` à `1a9c76f`), `Elintys-api` (`dev` à `ec0ea37`), archive Stitch `stitch_elintys_cinematic_onboarding_experience-4.zip`.

## Verdict

Le modèle d’accès événementiel v2 et le wizard six étapes existent déjà, mais l’expérience organisateur n’est pas fermée de bout en bout. Le défaut principal est explicite dans le frontend : `/organisateur` et `/organisateur/evenements` rendent un `DashboardSkeleton` permanent, tandis que `/tableau-de-bord/evenements` ne contient qu’un libellé statique. L’API expose déjà `GET /events/my`, les opérations de publication, les médias Cloudinary et les demandes d’accès; les écrans organisateur ne les consomment pas encore.

La migration v2 ne doit pas être exécutée en l’état. Le dry-run réel sur la base de développement trouve 8 événements hérités : 7 migrables et 1 ambigu (`ACCESS_CODE_MISSING_RAW_VALUE`). Une décision humaine sur cet événement est requise avant toute écriture.

## Sources auditées

- Gouvernance : `Elintys-web/CLAUDE.md`, `Elintys-api/CLAUDE.md`, `docs/design-principles.md`.
- Design Stitch : les 10 `screen.png`, leurs `code.html`, et `pure_v_nementielle/DESIGN.md`.
- Frontend : routes App Router, layout dashboard, sidebar multi-rôle, services et types événements, wizard et gestion média, page publique.
- Backend : schéma/DTO/service/controller événements, politique d’accès, demandes d’accès, invités, billets, médias, script de migration et seed.
- Environnements : API dev, catalogues publics, Render, Vercel et Cloudinary consultés en lecture seule.

## Écart design — référence Stitch et implémentation

Le langage cible est « Épure Événementielle » : maîtrise, calme et précision; bleu pétrole, blanc chaud, accents terracotta/or, DM Serif Display pour la narration, interface sans surcharge et états explicites.

| Écran Stitch | État actuel | Écart à fermer |
|---|---|---|
| Tableau de bord actif | Absent | Agrégats, prochains événements, actions requises et activité récente issus de l’API. |
| Dashboard nouveau | Absent | État vide éditorial, CTA de création et guide de démarrage. |
| Mes événements — grille | Squelette permanent / page statique | Cartes réelles, statuts, progression, filtres et actions. |
| Mes événements — liste | Absent | Bascule grille/liste, table responsive et pagination. |
| Chargement | Squelette global générique | Squelette propre au catalogue organisateur, non permanent. |
| Erreur de connexion | Alerte minimale | État plein, action Réessayer, message utile et request ID lorsque disponible. |
| Détail public | Partiellement présent | Hiérarchie éditoriale, programme, galerie, organisateur, lieu, FAQ et CTA adaptés à l’accès. |
| Événement restreint | Primitives d’accès présentes | Variantes code, domaine, approbation, liste et invitation avec retours précis. |
| Gestion — vue d’ensemble | Écran très sommaire | Progression calculée, checklist, statistiques réelles et navigation de l’espace événement. |
| Accès et inscriptions | API présente, écran absent | Configuration, capacité, demandes en attente, approbation/refus et états vides. |

## Audit fonctionnel

### Wizard six étapes

Déjà disponible : sauvegarde progressive via `creationProgress`, reprise par `currentStep`, validations par étape, médias réels à l’étape 5, configuration visibilité/accès/admission, readiness de publication, erreurs utilisateur structurées et redirection finale vers l’espace de l’événement.

À consolider : libellés FR/EN réellement sélectionnés au runtime (le wizard importe actuellement les messages français), cohérence de l’étape finale avec les actions publier/prévisualiser, et tests E2E authentifiés couvrant reprise, skip, erreur réseau et upload média.

### Catalogue organisateur

- `GET /events/my` est disponible et filtrable par statut.
- `eventsService.getMyEvents()` existe.
- Aucun des deux écrans organisateur ne l’appelle.
- La route historique `/tableau-de-bord/evenements` n’est pas une liste fonctionnelle.
- La pagination backend existe mais le tri/recherche/type nécessitent un contrat enrichi ou un filtrage explicite limité au jeu chargé.

### Tableau de bord

Il n’existe pas d’endpoint d’agrégation organisateur. Les compteurs peuvent être calculés à partir des événements, demandes d’accès, invités et billets, mais un endpoint dédié évitera les requêtes en cascade et gardera MongoDB comme source de vérité.

### Espace événement

La vue actuelle charge un événement réel, mais n’offre que quatre liens. Les sous-pages Billetterie, Prestataires, Lieux et Invités existent; la navigation et la vue d’ensemble Stitch ne sont pas encore réunies dans un shell d’événement cohérent. L’écran Accès et inscriptions doit être ajouté sur les primitives déjà exposées.

### Page publique et accès restreint

La page publique charge l’événement par slug et les types de billets, et protège l’indexation des événements non listés. Les politiques v2 sont présentes côté API : ouvert, inscription, code, domaine, approbation manuelle, liste d’invités et jeton d’invitation. Le frontend doit encore présenter chaque politique comme une expérience distincte, sans révéler de donnée privée avant autorisation.

## Audit données et migration

Commande exécutée sans écriture :

```text
npm run event-access:migrate
mode=dry-run
total=8
public=6, private=1, invite_only=1
migratable=7
ambiguous=1
event=6a694bc1368aa56c58328900
reason=ACCESS_CODE_MISSING_RAW_VALUE
```

Décision : **migration requise mais bloquée avant exécution**. Le modèle tolère temporairement les données héritées grâce à `normalizeLegacyEventAccess`. La migration ne sera lancée qu’après choix explicite du nouveau code ou de la politique de remplacement pour l’événement ambigu, puis sauvegarde et validation du rapport de rollback.

## Audit sécurité

Points déjà satisfaisants : JWT global, rôles organisateur/admin sur les écritures, contrôle de propriété dans les services, code d’accès stocké sous forme de hash, réponses publiques assainies, throttling sur vérification/demandes, upload mémoire borné et validation média, séparation Cloudinary par environnement.

Points à préserver pendant l’implémentation :

- ne jamais rendre `organizer`, `codeHash`, jetons ou règles privées dans les réponses publiques;
- vérifier la propriété pour tout agrégat et toute action d’approbation;
- pagination et limites sur toutes les listes;
- aucune métrique fictive ni donnée de démonstration codée en dur dans les dashboards;
- ne pas exposer de secret dans les variables `NEXT_PUBLIC_*`;
- afficher un message précis sans divulguer les détails internes, avec `requestId` pour le support.

## Architecture d’implémentation retenue

1. Conserver `GET /events/my` comme source de la liste et enrichir ses filtres/tri de manière rétrocompatible.
2. Ajouter un agrégat organisateur borné et propriétaire pour les statistiques/actions, uniquement si les données ne peuvent pas être obtenues proprement via les endpoints existants.
3. Créer des composants métier sous `src/components/events/organizer/`, pas dans `app/`.
4. Unifier `/organisateur/evenements` et `/tableau-de-bord/evenements` par redirection ou composant partagé afin d’éliminer la divergence.
5. Introduire un shell d’espace événement partagé et une route `acces-et-inscriptions`.
6. Faire évoluer `EventPageClient` par sections composables et variantes de politique d’accès.
7. Ajouter les chaînes FR et EN en parité, les états loading/empty/error et les tests de branches.

## Critères de sortie de l’implémentation

- Aucune route organisateur ne reste un squelette permanent ou un placeholder.
- Les événements de la base dev apparaissent pour leur propriétaire après connexion.
- Les métriques et demandes correspondent aux réponses API.
- Grille/liste, recherche, filtres, pagination et reprise du wizard fonctionnent sur mobile et desktop.
- Les pages publiques ouvertes et restreintes respectent la politique d’accès.
- Lint, typecheck, tests unitaires, build, E2E ciblés, accessibilité et comparaison visuelle passent.

