# Sprint 4 / Wave G — Account Lifecycle & Settings

Date de finalisation : 2026-09-12
Branche API/Web : `feat/s4-wave-g-account-lifecycle-settings`

## 1. Executive summary

Wave G transforme la page Paramètres en surface produit réelle : profil, sécurité, préférences de courriels métier, ajout de rôles et historique d’achats. Les mutations sont rattachées au sujet JWT, limitées par DTO explicites et couvertes par des tests API, unitaires et navigateur. Aucun changement d’email, abonnement, facturation avancée ou i18n globale n’a été simulé.

Verdict technique : GREEN. P0/P1/P2 ouverts : 0.

## 2. Wave F merge evidence

- API PR #58 fusionnée vers `dev` par `9b8eb0e`; commits Wave F présents : `de1a177`, `133cb9d`, `3d06156`.
- Web PR #107 fusionnée vers `dev` par `3800860`; commits Wave F présents : `31d1231`, `62a5961`, `1e086fa`.
- Les deux branches `dev` étaient propres et alignées avec `origin/dev` avant la création de Wave G.

## 3. Post-merge smoke results

| Surface | Preuve | Résultat |
|---|---|---|
| API | lint, typecheck, build | GREEN |
| API Notifications/Emails | 2 suites, 22 tests | GREEN |
| Web | lint, typecheck, build production, 57 routes | GREEN |
| NotificationBell | 10 tests composant | GREEN |
| Login, shell, notifications | 16 exécutions Playwright, 7 viewports | GREEN |

## 4. Git baseline

| Repository | Baseline | Branche |
|---|---:|---|
| API | `9b8eb0e` | `feat/s4-wave-g-account-lifecycle-settings` |
| Web | `3800860` | `feat/s4-wave-g-account-lifecycle-settings` |

## 5. Scope

Implémenté : édition du nom, changement de mot de passe authentifié, renvoi de vérification lié au compte, préférences email métier, ajout atomique de rôles publics, mise à jour immédiate de la navigation multi-rôle et historique d’achats owner-scoped.

Non implémenté volontairement : changement d’email, suppression de rôle, abonnement, factures, i18n globale et gestion multi-device.

## 6. Pre-implementation inventory

| Feature | Backend avant G | Frontend avant G | Gap | Décision G |
|---|---|---|---|---|
| Auth/session | Complet | Complet | Régression uniquement | Préserver les trois états auth |
| Vérification email | API existante | États incomplets | Parcours non prouvé | Compléter et tester |
| Forgot/reset | API existante | Pages existantes | Nouveau login non prouvé | E2E déterministe |
| Profil | Lecture seule | Lecture seule | Aucun PATCH limité | Nom uniquement |
| Sécurité | Reset public | Absente en session | Aucun changement authentifié | Ancien mot de passe requis |
| Préférences | Absentes | Absentes | Emails Wave F non configurables | 4 clés métier explicites |
| Langue | Absente | Runtime global incomplet | Sélecteur mensonger | Différer |
| Rôles | Pas de mutation publique | CTA placeholder | Ajout sécurisé absent | Allow-list atomique |
| Achats | Orders owner-scoped | Mes billets seulement | Pas d’historique | Liste fidèle paginée |
| Abonnement | Aucun domaine | CTA trompeur | Contrat absent | Retirer/différer |

## 7. Auth lifecycle

La restauration de session conserve la distinction `authenticated`, `anonymous` et `unavailable`. Les réponses 429/5xx/réseau ne provoquent pas de faux logout. Les flows login, logout, reload et erreur dégradée restent couverts par la suite complète.

## 8. Profile management

`PATCH /auth/me/profile` accepte uniquement `firstName` et `lastName`, reconstruits dans le champ existant `fullName`. Email, rôles, vérification, statut, hash et flags internes ne sont jamais mass-assignables. Persistance après reload validée par navigateur.

## 9. Security settings

`POST /auth/me/change-password` exige le mot de passe courant, refuse le même mot de passe, applique bcrypt 12, révoque le refresh token et efface les deux cookies. L’ancien mot de passe est rejeté et le nouveau accepté en E2E.

## 10. Email verification

Le renvoi authentifié dérive l’identité du JWT. Le parcours token valide, retour explicite vers la connexion et états pending/error est testé. Les tokens QA sont déterministes à partir d’un secret d’environnement, stockés hashés et jamais journalisés.

## 11. Forgot/reset

Le message forgot reste neutre pour empêcher l’énumération. Le reset consomme un token QA réel et le test restaure ensuite le mot de passe initial. La livraison externe Resend n’est pas exécutée localement; l’architecture Wave F est réutilisée.

## 12. Notification preferences

Quatre préférences email versionnées sont persistées : nouvelle demande prestataire, réponse prestataire, nouvelle demande de lieu et réponse de lieu. Les notifications in-app et les emails de sécurité restent obligatoires. Les services Vendor/Venue consultent la préférence côté serveur.

## 13. Language preference

La nouvelle copie existe dans les catalogues FR/EN, mais aucun sélecteur n’est affiché puisque le runtime global ne peut pas encore garantir le changement de langue. Consommation globale : DEFERRED — I18N WAVE.

## 14. Role management

`POST /auth/me/roles` n’accepte que organisateur, prestataire et gestionnaire de salle. Participant et ADMIN sont refusés. `$addToSet` rend l’opération atomique et idempotente. L’ajout n’instancie ni Event, ni Venue, ni VendorService.

## 15. Multi-role UX

Un access token actualisé est émis après ajout; le refresh token existant n’est pas tourné, ce qui évite la course entre ajouts concurrents. AuthContext et navigation desktop/mobile se mettent à jour sans reconnexion, puis persistent au reload. Le lien d’onboarding correspondant est proposé si le profil métier reste à compléter.

## 16. Purchase history

`GET /ticket-orders/me` reste lié au buyer JWT. Les commandes exposent montant, devise, statut, date, lignes et un résumé Event minimal chargé en une requête batch. L’UI gère loading, empty, error/retry, pagination et événement supprimé/indisponible.

## 17. Subscription scope decision

`SUBSCRIPTION MANAGEMENT: DEFERRED — MONETIZATION WAVE.` Le CTA placeholder a été supprimé; aucune promesse commerciale n’est affichée.

## 18. Backend changes

- Contrats Auth profil, mot de passe, préférences, rôles et resend authentifié.
- Préférences explicites sur User, valeurs par défaut compatibles avec les comptes existants.
- Rejet d’ADMIN sur l’inscription publique.
- Respect des préférences email dans Vendor/Venue.
- Projection et enrichissement batch de l’historique TicketOrder.
- Provisionneur QA idempotent étendu aux comptes Wave G.

Commits : `8bd3ee8`, `bff752b`.

## 19. Frontend changes

- Surface `/parametres` réelle, accessible depuis Sidebar et MobileNav.
- Services auth/account typés et synchronisation AuthContext.
- États accessibles, feedbacks, focus après erreur et blocage des doubles soumissions.
- Vérification email et changement de mot de passe raccordés au lifecycle réel.
- Suppression des faux CTA abonnement/profil.

Commits : `ef0530e`, `8bd2efb`, `486f44f`.

## 20. Security/privacy

- Identité issue exclusivement du JWT.
- DTO allow-list et `forbidNonWhitelisted` conservé.
- Escalade ADMIN refusée à l’inscription et à l’ajout de rôle.
- Aucun token, mot de passe, email utilisateur ou secret ajouté aux logs.
- Scan de sécurité indépendant : 19 fichiers API, 7 surfaces, 0 finding reportable.
- `npm audit --omit=dev` : 0 vulnérabilité API, 0 Web.

## 21. Responsive

Validé à 320×720, 375×812, 390×844, 768×1024, 1024×768, 1440×900 et 1538×1100. Overflow horizontal critique : 0. Les CTA principaux ont une hauteur minimale de 44 px.

## 22. Accessibility

Labels, descriptions d’erreur, `aria-invalid`, feedback `role=alert/status`, focus après erreur, clavier et loading semantics vérifiés. Axe sur les 7 viewports : critical 0, serious 0.

## 23. i18n impact

Les nouvelles chaînes sont présentes avec parité structurelle dans `messages/fr.json` et `messages/en.json`. L’écran suit le runtime français existant; aucune prétention de bilinguisme global.

## 24. Design/card-border audit

Captures inspectées à 390×844 et 1440×900. Hiérarchie éditoriale, surfaces chaudes, tokens, rayons et ombres Elintys conservés. Visible decorative card borderlines : 0. Les bordures restantes sont fonctionnelles (inputs/focus).

## 25. API tests

| Gate | Résultat |
|---|---:|
| lint | GREEN |
| typecheck | GREEN |
| build | GREEN |
| unit | 78 suites, 1 233 tests passed |
| E2E | 10 suites, 135 tests passed |
| Wave 5 concurrency | 10/10 |
| Wave A concurrency | 7/7 |
| npm audit production | 0 vulnérabilité |

Un échec TicketOrder transitoire s’est produit lors du premier passage; le test a ensuite réussi isolément (20/20), puis lors de deux reruns complets (135/135). Aucune modification produit sans cause reproductible n’a été introduite.

## 26. Web tests

| Gate | Résultat |
|---|---:|
| lint | GREEN, 0 warning |
| typecheck | GREEN |
| build production Webpack | GREEN, 57 routes |
| unit | 67 fichiers, 418 tests passed |
| npm audit production | 0 vulnérabilité |

Le build Turbopack par défaut a été bloqué par le sandbox local (`binding to a port: Operation not permitted`). Le fallback officiel `next build --webpack` a compilé le même code de production avec succès.

## 27. Browser E2E

- Wave G : 13 scénarios produit + 2 setups = 15/15.
- Rerun ciblé avec régression MobileNav : 16/16.
- Suite fonctionnelle complète : 272 passed, 2 skips historiques, 0 failed, 274 exécutions, 19,4 min.
- Nouveaux skips : 0.
- Console errors inattendues Wave G : 0; page errors : 0; HTTP >=500 inattendus : 0.
- Les 401/429 volontairement injectés sont whitelistés localement, jamais globalement.

## 28. Wave F regression

Vendor request/response, Venue request/response, invitation accepted, NotificationBell, mark-one et mark-all restent verts dans les suites unitaires/API/Web complètes. Les préférences email n’affectent pas les notifications in-app.

## 29. Full regression

Events, wizard 6 étapes, Workspace, Vendor, Venue, participants, guests, invitations, favoris, ticketing, QR, admission et adapter PayPal ont été rejoués par les suites complètes. Deux skips préexistants du capture wizard restent historiques; aucun nouveau skip.

## 30. Independent review

La relecture `origin/dev...HEAD` a cherché mass assignment, IDOR, escalation, bypass de vérification, stale session, fuite d’orders, faux succès, accessibilité, responsive et scope creep. Une assertion Wave A obsolète, qui classait encore Paramètres comme placeholder, a été corrigée et couverte par le rerun complet. Aucun autre défaut bloquant confirmé.

## 31. P0/P1/P2/P3

| Niveau | Ouverts | Détail |
|---|---:|---|
| P0 | 0 | — |
| P1 | 0 | — |
| P2 | 0 | — |
| P3 | 1 | Access JWT déjà émis valable au maximum 15 min après changement de mot de passe; refresh révoqué |

## 32. Deferred items

- Changement d’email sécurisé : future Account wave.
- Préférence langue consommée globalement : future i18n wave.
- Gestion abonnement, facturation, invoice/tax : Monetization wave.
- Suppression de rôle et gestion multi-device : post-MVP.

## 33. Preserved Wave F backlog

- Rappels programmés : DEFERRED.
- Notification « ticket vendu » organisateur : DEFERRED.
- Annulations Vendor/Venue — notifications/emails : DEFERRED.
- Temps réel / push / WebSocket / SSE : DEFERRED.
- Centre de notifications complet : DEFERRED.

## 34. Remaining risks

La révocation immédiate de tous les access tokens nécessiterait une architecture de session/deny-list hors scope; la fenêtre actuelle est limitée à 15 minutes. La livraison réelle Resend dépend toujours de la configuration de l’environnement déployé. Les warnings historiques Next Image/LCP et reduced-motion observés durant la suite ne sont pas des erreurs runtime et restent hors scope G.

## 35. Release scorecard

| Domaine | Statut | Justification |
|---|---|---|
| PROFILE MANAGEMENT | GREEN | Mutation allow-list et persistance E2E |
| ACCOUNT SECURITY | GREEN | Ancien secret requis, refresh révoqué |
| EMAIL VERIFICATION | GREEN | Resend/consume/retour couverts |
| PASSWORD RECOVERY | GREEN | Forgot neutre et reset réel QA |
| NOTIFICATION PREFERENCES | GREEN | 4 clés serveur, in-app préservé |
| ROLE MANAGEMENT | GREEN | Allow-list, atomicité, ADMIN refusé |
| PURCHASE HISTORY | GREEN | Owner-scoped, paginé, projection minimale |
| RESPONSIVE/A11Y | GREEN | 7 viewports, Axe 0/0 |
| SECURITY/PRIVACY | GREEN | Scan 0 finding, audits 0 vulnérabilité |

## 36. Final verdict

Branches poussées et PR ouvertes vers `dev` :

- API : https://github.com/NoeKen/Elintys-api/pull/59
- Web : https://github.com/NoeKen/Elintys-web/pull/108

Les PR ne doivent pas être fusionnées dans le cadre de ce mandat.

SPRINT 4 / WAVE G — VALIDÉE — ACCOUNT LIFECYCLE & SETTINGS PRODUCT INTEGRATION COMPLETE — PR OUVERTE VERS DEV
