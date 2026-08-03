# Readiness des environnements déployés — Expérience événementielle

Vérification : 2 août 2026. Toutes les opérations de cette phase ont été faites en lecture seule.

## Synthèse

| Couche | État | Preuve |
|---|---|---|
| API dev | Prête | `https://api.dev.elintys.com/api/v1/health` répond 200 avec `status=ok`. |
| Données publiques dev | Prêtes | Événements, prestataires et lieux répondent 200 avec 10 enregistrements chacun. |
| Render dev | Prêt | Service `elintys-api-dev`, branche `dev`, auto-deploy sur commit, dernier déploiement `ec0ea37` live. |
| Vercel dev | Prêt mais UI incomplète | Dernier preview de `dev` à `1a9c76f`, état `READY`; `dev.elintys.com` répond 200. |
| Cloudinary | Structure prête, bibliothèque dev vide | Dossiers `elintys/dev/events` et `elintys/prod/events` présents; aucun asset trouvé sous `elintys/*` pendant l’audit. |
| MongoDB dev | Seed prêt, migration v2 incomplète | Catalogues réels alimentés; dry-run : 8 hérités, 7 migrables, 1 ambigu. |

## Render

- Service : `srv-d9mqjn142hec73ea5660` (`elintys-api-dev`).
- Dépôt : `NoeKen/Elintys-api`.
- Branche : `dev`.
- Déclenchement : automatique sur commit.
- Région : Ohio; runtime Node; une instance.
- Révision live : `ec0ea3735a1a8ce3415c1675a189af7a67b18092`.
- URL Render : `https://elintys-api-dev-1pdh.onrender.com`.
- Domaine applicatif vérifié : `https://api.dev.elintys.com`.

## Vercel

- Projet : `prj_zPSCYU2iWuCfKi6cHAc24HDDEmLF` (`elintys-web`).
- Framework détecté : Next.js.
- Dernier déploiement de branche `dev` : `dpl_ABg58S1R3b8f4dpmVqcDbmAn7vAd`.
- Révision : `1a9c76f33fc6590a8bd338764d2b104444e5d712`.
- État : `READY`.
- `https://dev.elintys.com/organisateur`, `/organisateur/evenements` et `/evenements` répondent 200.

Un HTTP 200 ne vaut pas validation fonctionnelle : les deux routes organisateur renvoient actuellement un squelette permanent par conception du code déployé.

## API et données

Contrôles directs :

| Endpoint | HTTP | Total |
|---|---:|---:|
| `/api/v1/events?page=1&limit=1` | 200 | 10 |
| `/api/v1/vendors?page=1&limit=1` | 200 | 10 |
| `/api/v1/venues?page=1&limit=1` | 200 | 10 |

Les réponses contiennent des documents MongoDB cohérents (statuts, dates, lieux, politique d’accès) et non des mocks frontend. L’affichage vide de la zone organisateur n’est donc pas causé par une API publique indisponible.

## Cloudinary

Arborescence observée :

```text
elintys/dev/events
elintys/prod/events
elintys/events            # historique
elintys/diagnostics       # historique/diagnostic
```

La séparation cible dev/prod est en place. La recherche d’assets dans `elintys/*` retourne zéro ressource; la QA upload devra donc créer une image de test dans `elintys/dev/events` uniquement, vérifier sa référence MongoDB, puis la supprimer par le flux applicatif si le scénario exige un nettoyage.

## Décision de readiness

L’infrastructure dev est suffisante pour implémenter et tester l’expérience. Les blocages sont applicatifs : écrans non raccordés, agrégats organisateur absents et migration héritée ambiguë. La production n’est pas dans le périmètre et ne doit recevoir ni seed, ni migration, ni asset de QA.

