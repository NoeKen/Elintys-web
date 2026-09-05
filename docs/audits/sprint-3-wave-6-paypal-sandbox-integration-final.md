# Sprint 3 / Vague 6 — revue indépendante PayPal Sandbox

Date : 2026-09-04  
Reviewer : Codex  
Verdict : **PARTIELLE — intégration locale validée, Sandbox externe non exécuté**

## 1. Branche

Les deux dépôts sont sur `feat/s3-wave6-paypal-sandbox-integration`, dérivée de
`origin/dev`. Aucun commit ni push direct vers `dev`, aucun merge et aucun
force-push.

## 2. Résumé Claude

Claude a livré un adaptateur PayPal Orders v2, OAuth en mémoire, création et
capture serveur, vérification officielle des webhooks, déduplication persistée,
index de règlement, pages de retour et documentation. Son rapport annonçait
honnêtement que le Sandbox externe n'avait pas été exécuté faute d'identifiants.

## 3. Revue architecture Codex

| Question | Réponse |
|---|---|
| PayPal reste-t-il un adapter ? | Oui, isolé dans `PaymentProvidersModule`. |
| Le domaine dépend-il de types PayPal ? | Non ; il reçoit des handles de paiement génériques. |
| TicketOrder précède-t-il le paiement ? | Oui, commande/hold/stock sont persistés avant l'appel Orders v2. |
| Les appels PayPal sont-ils hors transaction Mongo ? | Oui. |
| Le contrat reste-t-il extensible ? | Oui, confirmation en deux temps optionnelle et générique. |
| `shared/consistency` reste-t-il générique ? | Oui. |
| Abstraction prématurée ? | Aucune confirmée. |
| Ancien chemin contournant Hold/reserved ? | Aucun trouvé ; la projection publique a été corrigée pour exposer `reserved`. |

## 4. Findings

| Sévérité | Trouvé | Ouvert | Résumé |
|---|---:|---:|---|
| P0 | 0 | 0 | — |
| P1 | 5 | 0 | garde live incomplète, règlement insuffisamment attesté, course expiration/capture, bail webhook stale, bootstrap Nest cassé |
| P2 | 3 | 0 | stock public sans `reserved`, retry polling inopérant, URL d'approbation trop permissive |
| P3 | 2 | 0 | diagnostic du script de concurrence, commentaire `.env.example` obsolète |

Le scan de sécurité immuable a retenu un finding Low/P3 sur la course
d'expiration. Il est corrigé dans le working tree et couvert par un test à
horloge contrôlée.

## 5. Corrections Codex

- `PAYPAL_ENV=live` est désormais refusé dans tous les environnements.
- Toute finalisation PayPal exige référence de capture, montant exact et devise exacte.
- L'expiration est revérifiée après l'appel réseau et avant la transaction de finalisation.
- Chaque acquisition de bail webhook reçoit un `processingToken`; un worker stale ne peut plus clore le travail d'un successeur.
- `PayPalHttpClient` est exporté par le module provider : le bootstrap Nest complet fonctionne.
- La disponibilité publique est `quantity - sold - reserved` sur API et Web.
- La reprise utilisateur redémarre un nouveau cycle de polling borné.
- Les redirections n'acceptent que `https://*.sandbox.paypal.com`.
- Les E2E Vagues 4/5 ont été alignés sur le nouveau comportement fail-closed.

## 6. PayPal provider

PayPal est sélectionné par registre fermé et double interrupteur. Le provider
simulé reste limité au développement. Aucune injection de provider par le
client n'est possible.

## 7. OAuth

Client ID et secret restent côté serveur. Le jeton est conservé en mémoire avec
marge d'expiration, promesse partagée, timeout de 10 s et trois reprises
maximum. Jeton, secret et Authorization ne sont ni loggés ni persistés.

## 8. PayPal Order

Le prix, la devise, l'acheteur, la quantité, l'événement et le billet viennent
du serveur. La référence PayPal est corrélée à un TicketOrder Elintys déjà
persisté. `PayPal-Request-Id` et `invoice_id` rendent la création récupérable et
idempotente.

## 9. Capture

Le frontend ne marque jamais une commande payée. Le serveur capture ou relit
l'état PayPal, puis vérifie capture ID, montant et devise. Les statuts denied,
timeout, retry et duplicate sont couverts.

## 10. Vérification webhook

L'endpoint public exige les en-têtes PayPal, un corps brut, un certificat
PayPal admissible et la réponse `SUCCESS` de
`/v1/notifications/verify-webhook-signature` avec le webhook ID serveur. Un
JSON forgé ou altéré n'entraîne aucun effet métier.

## 11. Idempotence

Quatre niveaux sont conservés : clé Elintys, `PayPal-Request-Id`, événement
webhook unique et capture unique en base. Le token de bail empêche un ancien
worker de remplacer le résultat d'un nouveau worker.

## 12. Concurrence

Le script MongoDB réel passe 10/10 : stock restant 1, même clé séquentielle et
concurrente, clés distinctes, expiration concurrente, callbacks répétés et
concurrents, échec, rollback et deux instances applicatives.

## 13. Règlement tardif

Un hold expiré pendant un appel réseau ne peut plus être finalisé. La commande
est expirée puis bascule en revue manuelle si PayPal atteste néanmoins un
règlement ; aucun billet, aucun sold et aucune consommation de hold.

## 14. Frontend

Le CTA payant ouvre une modal Elintys, crée une commande serveur puis suit
uniquement une URL Sandbox de confiance. Les pages succès/annulation affichent
la vérité du TicketOrder. Sans order ID valide : « Commande introuvable »,
jamais un faux succès.

## 15. Sécurité

Les tests couvrent webhook forgé, rejeu, capture dupliquée, montant/devise
discordants, IDOR, kill switch, redirection ouverte, confusion live/Sandbox et
règlement tardif. La recherche locale n'a trouvé aucun secret PayPal committé.

Rapport du scan :
`/private/var/folders/hs/9kmczy7971dbsdpd26r35dqw0000gn/T/codex-security-scans-jf61HP/Elintys-api/c5fa30f519ca46f05b8e034bdb1edba0adaff113_20260904T204528Z_dcwx0qed/report.md`.

## 16. Preuve Sandbox

| Niveau de preuve | Résultat |
|---|---|
| TestPaymentProvider | Validé, dont 10 scénarios MongoDB réels. |
| Contrats API PayPal mockés | Validés. |
| Vérification webhook mockée | Validée. |
| Vraie API PayPal Sandbox | **NON EXÉCUTÉE : credentials absentes.** |
| Approbation acheteur + webhook externe | **NON EXÉCUTÉS.** |

En conséquence, ce rapport ne déclare pas « PayPal Sandbox validated ».

## 17. Accessibilité

Axe WCAG A/AA : 0 critical, 0 serious sur les pages retour et le parcours
participant fail-closed. Région live, titre H1 unique, navigation clavier,
focus visible et cibles principales ≥ 44 px sont vérifiés.

## 18. Responsive

Viewports : 320×720, 375×812, 390×844, 768×1024, 1024×768, 1440×900,
1538×1100. Overflow horizontal ≤ 1 px.

## 19. Scroll

Scroll document natif. Aucun Lenis, `preventDefault` global, body lock permanent
ou nouveau scroll trap.

## 20. Performance

Build production Next réussi. Aucun SDK PayPal n'est chargé : la redirection
évite tout script tiers global. Le polling est borné à 6 tentatives espacées de
2,5 s puis s'arrête; la reprise manuelle relance un cycle borné. Les Web Vitals
chiffrés n'ont pas été exposés par le navigateur intégré et ne sont pas inventés.

## 21. Migration

Dry-run sur `elintys-dev` uniquement : replica set et transactions disponibles,
4/4 index déjà présents, 0 conflit, 0 doublon bloquant, 0 document invalide,
0 écriture. L'application et le rollback sont documentés; aucune production.

## 22. Tests

- API unitaires : 75 suites, 1 092/1 092.
- API E2E : 4 suites, 49/49.
- API concurrence réelle : 10/10.
- Web unitaires : 44 fichiers, 257/257.
- Web E2E Vague 6 : 13/13.
- Web E2E participant/fail-closed : 22/22.
- Total exécuté et vert : 1 443 assertions/scénarios comptabilisés.

## 23. Gates

| Gate | API | Web |
|---|---|---|
| lint | Vert, 0 warning | Vert, 0 erreur, 9 warnings préexistants |
| typecheck | Vert | Vert |
| build | Vert | Vert, production |
| unit | 1 092/1 092 | 257/257 |
| coverage | 74,71 % stmts / 68,19 % branches | 45,71 % stmts / 43,39 % branches |
| E2E | 49/49 | 35/35 ciblés |
| concurrency | 10/10 | n/a |
| migration dry-run | Vert | n/a |
| Axe | n/a | 0 critical / 0 serious |
| diff check / secrets | Vert | Vert |

## 24. Severity counts

P0 ouverts : 0. P1 ouverts : 0. P2 ouverts : 0. P3 ouverts : 0.

## 25. Risques résiduels

- absence de preuve contre les contrats et délais du vrai PayPal Sandbox ;
- aucune preuve de livraison d'un webhook signé externe ;
- décision produit et console opérateur pour la revue manuelle encore hors périmètre ;
- politique Refund non implémentée.

## 26. Live readiness

**Non prêt et explicitement interdit.** Le code refuse `PAYPAL_ENV=live`.
Les credentials live, paiements réels, production, migration production et
déploiement production n'ont pas été touchés.

## 27. Commits

Commits Codex sur les feature branches :

- API `7a5543b` — `fix(payments): harden PayPal settlement orchestration` ;
- API `2fdcf7b` — `fix(ticketing): expose reserved public inventory` ;
- Web `5c29f8c` — `fix(web): harden PayPal return and inventory UX` ;
- Web — le présent rapport et les preuves QA sont livrés dans le commit docs final.

Aucun commit ne cible `dev`.

## 28. PR

PR vers `dev` : **non ouverte**. Le gate explicite exige que tout soit vert et
interdit de déclarer le Sandbox validé sans un vrai flow externe. La PR pourra
être ouverte après exécution documentée : création Order Sandbox, approbation
acheteur, capture, webhook signé, état PAID, TicketPurchase et participation.

## Verdict

**SPRINT 3 / VAGUE 6 — PARTIELLE — gates locaux verts, PayPal Sandbox externe non exécuté faute de credentials**
