# Audit préalable — modèle d’accès aux événements

Date : 2026-08-01
Périmètre : `Elintys-api` et `Elintys-web`, avant modification du modèle.

## Cartographie actuelle

- `Event.visibility` mélange trois notions (`public`, `private`, `invite_only`).
- `Event.accessRules` est un groupe de booléens non exclusifs (`privateLink`, `accessCode`, `allowedEmailDomain`, `manualApproval`). Il ne décrit ni l’admission, ni un véritable mécanisme d’autorisation.
- Le wizard envoie ces deux champs à l’étape 5 et affiche un récapitulatif unique « accès ».
- Le catalogue filtre les événements `published + public`, mais la route publique par slug filtre seulement `published`.
- La publication bascule le statut sans vérifier les champs nécessaires, les billets ou la cohérence des règles.
- Les achats gratuits et Stripe vérifient le stock, mais aucune policy d’accès à l’événement.
- Les invités (`Guest`) et invitations existent, mais ne sont pas reliés à une policy d’admission unifiée.

## Risques confirmés

| Sévérité | Constat | Effet |
| --- | --- | --- |
| P0 | `findBySlug` ignore la visibilité | Un événement publié privé ou sur invitation est exposé publiquement. |
| P0 | Réservation de lieu sans contrôle de propriété | Un organisateur peut réserver/lister pour l’événement d’un tiers. |
| P1 | Invitation liée à un événement sans contrôle de propriété | Un utilisateur peut créer une invitation pour l’événement d’un tiers. |
| P1 | Jeton d’invitation stocké en clair | Une fuite de base rend les liens immédiatement utilisables. |
| P1 | Publication sans readiness | Des événements incomplets ou incohérents peuvent être publiés. |
| P1 | Code d’accès non implémenté | L’UI laisse entendre une protection qui n’existe pas. |
| P1 | Domaine courriel non appliqué | La restriction affichée n’est pas imposée aux actions participant. |
| P2 | Slug humain utilisé comme lien privé | Un slug n’est pas un secret et ne constitue jamais une autorisation. |
| P2 | Aucune séparation lecture / inscription / achat / admission | Une condition unique ne peut pas protéger correctement tous les parcours. |

## Décisions d’architecture

1. La source de vérité v2 devient `discoverability + accessPolicy + admissionModes` avec `accessModelVersion: 2`.
2. `accessPolicy` est une union discriminée. Les secrets entrants (`code`, jeton brut) ne sont jamais sérialisés dans les réponses.
3. Une policy pure et centralisée décide séparément de la lecture, de l’inscription, de l’achat, de l’invitation et du check-in.
4. `private` répond 404 sur la route publique afin de limiter l’énumération. `unlisted` reste accessible par lien mais absent du catalogue et marqué `noindex`.
5. Les codes et jetons sont hashés. Les vérifications sensibles sont limitées en débit et émettent uniquement des codes de décision sans secret.
6. `canManageEvent(actor, event)` centralise la propriété aujourd’hui et constitue le point d’extension pour un futur workspace.
7. La publication et l’endpoint de readiness réutilisent la même validation.
8. La compatibilité legacy est temporaire et explicite. Le script de migration fonctionne par défaut en dry-run et signale les `private` ambigus sans les convertir silencieusement.

## Mapping legacy retenu

| Legacy | Mapping automatique | Ambiguïté |
| --- | --- | --- |
| `public` | `public + open + registration_only` | Le mode d’admission historique est inconnu ; une revue peut choisir `free` ou un mode billet. |
| `invite_only` | `unlisted + invitation_token + invitation` | Mapping déterministe par la sémantique du libellé. |
| `private` + domaine | `unlisted + email_domain + registration_only` | Faible si le domaine est valide. |
| `private` + approbation | `private + manual_approval + registration_only` | Faible. |
| `private` + code | `unlisted + access_code + registration_only` | Le code brut n’existe pas : migration bloquée jusqu’à définition d’un nouveau code. |
| autre `private` | aucun changement automatique | `unlisted` et `private` ne peuvent pas être déduits sans intention produit. |

## Points d’intégration à modifier

- API : schéma/DTO/projection Event, policies, endpoints access/readiness, requêtes catalogue/slug, achats, invitations, réservations, demandes d’accès et migration.
- Web : types et normalisation legacy, étape 5 en trois sections, récapitulatif, page publique/CTA/SEO, traductions FR/EN.
- Tests : matrices A–H, adversarial slug, domaine/code/token, publication, ownership et non-divulgation des secrets.

Ce document fige l’état observé avant toute évolution du modèle.
