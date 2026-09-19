# Sprint 4 / Wave I — Event Operations Completion

Date de validation : 19 septembre 2026  
Repositories : `Elintys-api`, `Elintys-web`  
Branche : `feat/s4-wave-i-event-operations-completion`

## 1. Executive summary

Wave I ferme le cycle de vie opérationnel Event sans reconstruire le wizard, le workspace, Access V2, la billetterie ou Search. Le domaine supporte désormais explicitement `draft → published → ongoing → completed` et `published|ongoing → cancelled`, avec transitions terminales, timestamps, synchronisation automatique UTC, suppression limitée aux brouillons et annulation financière fail-closed.

La review indépendante a découvert et corrigé avant livraison des courses sur les médias et Access V2, une configuration de billet payant résiduelle, une injection de contrôles dans les sujets d'e-mail et, surtout, un scan QR encore possible après annulation. Les preuves finales couvrent le backend, le frontend, les sept viewports et les parcours réels participant/organisateur.

## 2. Wave H merge evidence

- API `origin/dev` : `d1070c2`, merge PR #60, contenant `b7e43f2` et `9915fcd`.
- Web `origin/dev` : `b4284bf`, merge PR #109, contenant `358b701`, `63ef5a5` et `66054c1`.
- Les deux branches Wave I ont été créées depuis ces commits, sans développement direct sur `dev`.

## 3. Post-merge smoke

- API : lint, typecheck, build, 79 tests Events/Discovery ciblés verts.
- Web : lint, typecheck, build webpack et smoke Search/Public Event/Organizer list/Workspace, 66 exécutions navigateur vertes.
- Aucune régression Wave H absorbée silencieusement dans Wave I.

## 4. Git baseline

| Repo | Baseline `dev` | Branche Wave I |
|---|---|---|
| API | `d1070c2` | `feat/s4-wave-i-event-operations-completion` |
| Web | `b4284bf` | `feat/s4-wave-i-event-operations-completion` |

## 5. Pre-implementation Event inventory

| Capability | Backend | Frontend | Integrated | E2E avant I | Status initial | Gap | Décision I |
|---|---|---|---|---|---|---|---|
| Créer draft | Oui | Wizard | Oui | Oui | COMPLETE | — | Préserver |
| Modifier Event | Oui | Wizard/workspace | Oui | Oui | COMPLETE | États terminaux modifiables | Guard terminal |
| Sauvegarde progressive | Oui | 6 étapes | Oui | Oui | COMPLETE | — | Préserver |
| Supprimer draft | DELETE générique | CTA générique | Partiel | Partiel | PARTIAL | Event publié supprimable | Draft-only atomique |
| Publier/readiness | Oui | Oui | Oui | Oui | COMPLETE | Transition non atomique | Durcir |
| Statuts complets | Sans `ongoing` automatique | Partiel | Non | Non | PARTIAL | Cycle incomplet | State machine |
| Annuler Event simple | PATCH indirect | Incomplet | Partiel | Non | PARTIAL | Paiement/UX/notifications | Compléter fail-closed |
| Ongoing automatique | Non | Labels partiels | Non | Non | ABSENT | Scheduler | Implémenter |
| Completed automatique | Non | Labels existants | Non | Non | ABSENT | Scheduler | Implémenter |
| Archive/restauration | Oui | Oui | Oui | Oui | COMPLETE | — | Préserver, axe indépendant |
| Slug | Unique/stable | Routes `[slug]` | Oui | Oui | COMPLETE | — | Audit seulement |
| Discoverability | Access V2 | Oui | Oui | Oui | COMPLETE | Propagation `ongoing` | Étendre actif |
| Page publique | Published | Oui | Oui | Oui | COMPLETE | `ongoing` absent | Accepter actif |
| Workspace | Oui | Oui | Oui | Oui | COMPLETE | Terminal non verrouillé | Consultation seule |
| Organizer list | Oui | Oui | Oui | Oui | PARTIAL | `ongoing` absent | Filtres/actions |
| Participants/Guests/Invitations | Oui | Oui | Oui | Oui | COMPLETE | Mutations terminales | Guard terminal |
| Vendor/Venue | Oui | Oui | Oui | Oui | COMPLETE | Mutations terminales | Guard terminal |
| Ticketing/QR | Oui | Oui | Oui | Oui | PARTIAL | Admission terminale | Guard terminal + test |
| Email annulation | Non | N/A | Non | Non | ABSENT | Information opérationnelle | Ajouter best effort |
| Scheduler | Non | N/A | Non | Non | ABSENT | Automatisation | `@nestjs/schedule` |
| Duplication Event | Non | Non | Non | Non | OUT_OF_SCOPE | Capacité absente | Ne pas inventer |

## 6. v5.1 reconciliation

Création, modification, sauvegarde, slug, confidentialité, page publique, rattachements Vendor/Venue, readiness et hub organisateur restent fondés sur les contrats existants. Wave I complète suppression brouillon, statuts, clôture automatique, annulation simple et information des parties concernées.

L'annulation avec remboursement reste volontairement non implémentée : elle nécessite le workflow financier Wave K.

## 7. Superseded v5.1 items

Le libellé historique « formulaire création 5 étapes » est supplanté. Le wizard canonique conserve six étapes : Informations, Date/contexte, Lieu, Prestataires, Identité/médias/Access V2/admission, Récapitulatif/readiness/publication.

## 8. Event state machine

Transitions autorisées :

- `draft → published` ;
- `published → ongoing|completed|cancelled` ;
- `ongoing → completed|cancelled` ;
- `completed` et `cancelled` sont terminaux.

`discoverability`, `accessPolicy`, `admissionModes` et `status` restent quatre axes indépendants.

## 9. Edit rules

Les événements draft/published/ongoing restent modifiables selon les contrats existants. Les écritures Event, Access V2, médias, invités, billets, demandes prestataire et réservations de lieu refusent les états terminaux. Les mises à jour Event, médias et Access V2 répètent le statut dans le filtre Mongo pour fermer les courses annulation/écriture.

## 10. Draft deletion

La suppression physique est réservée à `draft`, vérifiée avant puis dans un `findOneAndDelete` atomique. Published/ongoing/completed/cancelled renvoient 409. Le nettoyage média s'exécute seulement après suppression gagnante. L'UI impose une confirmation explicite.

## 11. Publication/readiness

Le serveur reste l'autorité de readiness. Publication uniquement depuis `draft`, non archivé, et via filtre atomique. `publishedAt` est écrit avec la transition. Aucun second calcul frontend n'a été introduit.

## 12. Automatic lifecycle

Le scheduler exécute chaque minute :

1. published/ongoing avec `endDate <= now` → completed ;
2. published avec `startDate <= now` et fin future/absente → ongoing.

Terminer avant de démarrer récupère correctement une fenêtre manquée.

## 13. Scheduler/idempotence

Le scheduler est en UTC, utilise des filtres sur le statut source et `waitForCompletion`. Deux passages produisent le même état sans notification ou effet secondaire dupliqué. Les tests couvrent juste avant start, start exact, pendant, end exact, juste après end et le saut DST Toronto converti à l'instant UTC.

## 14. Event cancellation

Seul le propriétaire ou la politique admin existante peut annuler un Event published/ongoing. La transition atomique écrit `cancelledAt`. L'historique inscriptions, invitations et billets est conservé. Public Event, Search, nouvelle inscription, achat et scan QR deviennent indisponibles.

## 15. Paid cancellation safety gate

L'annulation est bloquée si :

- `paid_ticket` reste configuré ;
- un TicketType payant résiduel existe ;
- une TicketOrder est `PAID` ou `PENDING_PAYMENT` ;
- un achat legacy payant est `VALID` ou `USED`.

Aucun statut financier, stock payé ou remboursement n'est simulé. La résolution financière appartient à Wave K.

## 16. Notification/email behavior

Après la transition gagnante, les utilisateurs inscrits, détenteurs de billet et invités convertis reçoivent `EVENT_CANCELLED`. Les adresses réelles issues des utilisateurs, billets guest, invitations et guests actifs reçoivent un e-mail transactionnel best effort, dédupliqué. Les échecs sont comptés sans PII. Les contenus HTML sont échappés et les contrôles des sujets neutralisés centralement.

## 17. Public Event behavior

Published et ongoing sont actifs. Draft/private selon politique/archived/completed/cancelled ne sont pas exposés comme actifs. L'accès direct à un cancelled conserve le comportement canonique historique 404, sans fuite de contexte ni CTA d'admission.

## 18. Workspace behavior

Le shell partage toujours le contexte Event. Completed/cancelled affichent une bannière « Consultation uniquement » et rendent les formulaires opérationnels inertes. Overview et paramètres restent consultables. Aucun spinner permanent ou page blanche n'a été introduit.

## 19. Organizer Event list

Les statuts ongoing/completed/cancelled ont libellés, filtres et actions honnêtes. La suppression reste visible uniquement sur draft. Les cartes ne fabriquent aucun KPI.

## 20. Search regression

Search/Discovery inclut published et ongoing, exclut cancelled/completed de la découverte active, conserve les filtres et projections Wave H. Le test annulation vérifie l'absence du résultat par son identifiant.

## 21. Security/ownership

- Organizer A peut gérer A ; Organizer B reçoit 403.
- Les identités viennent de la session, jamais d'un `organizerId` client.
- États terminaux protégés contre résurrection, médias tardifs et Access V2 tardif.
- Scan QR interdit sur draft/completed/cancelled avant toute lecture du billet.
- Aucun token, hash, secret ou PII ajouté aux payloads/logs.

## 22. Timezone/date handling

Les comparaisons Mongo utilisent des `Date` UTC. Les textes frontend restent localisés FR-CA. Le passage DST n'altère pas l'instant de transition. Les bornes utilisent `$lte` au début/à la fin et `$gt` pour rester ongoing avant la fin.

## 23. Responsive

Viewports validés : 320×720, 375×812, 390×844, 768×1024, 1024×768, 1440×900, 1538×1100. Dialogs, actions destructives, listes et workspace : aucun overflow horizontal critique, cibles principales ≥44 px.

## 24. Accessibility

Sur Wave I : Axe critical 0, serious 0 à 390 et 1440 ; clavier, focus initial, Escape, restauration du focus, labels et alertes testés. Les boutons destructifs utilisent un contraste AA renforcé.

## 25. i18n impact

Les textes Wave I sont intégrés aux ressources/copies françaises existantes. Aucune promesse de plateforme globalement bilingue et aucune refonte i18n hors scope.

## 26. Design/card-border audit

Les surfaces paramètres utilisent contraste de surface, rayon, espace et ombre diffuse. Contours décoratifs visibles sur les cards représentatives : **0**. Les contours fonctionnels (inputs/focus/validation) sont préservés.

## 27. API tests

- Lint : 0 erreur, 0 warning.
- Typecheck : vert.
- Build NestJS : vert.
- Unitaires : **1 306/1 306**, 80 suites.
- E2E API : **153/153**, 10 suites.
- Concurrence : **10/10** Ticketing + **7/7** QR/Vendor/Venue/Favorites.
- Couverture mesurée : 74,28 % statements, 68,66 % branches, 70,31 % functions, 75,09 % lines avant l'ajout des neuf assertions terminales finales ; aucune suppression de test.

## 28. Web tests

- Lint : 0 erreur.
- Typecheck : vert.
- Build production Next.js webpack : vert, 57 pages générées.
- Unitaires : **445/445**, 72 fichiers.
- Couverture : 57,35 % statements, 51,64 % branches, 51,44 % functions, 58,85 % lines.
- Wave I ciblée : **16/16 exécutions** après ajout du verrou QR.

## 29. E2E lifecycle

Couverture réelle : suppression draft UI, annulation UI, exclusion public/Search, IDOR, absence de résurrection, inscription puis notification, fermeture admission, free ticket puis scan refusé, sept viewports, Axe, focus/Escape et invariant card-border.

## 30. Concurrency/race results

- Ticket stock/hold/settlement : 10/10.
- QR/Vendor/Venue/Favorites : 7/7.
- Annulation vs PATCH Event : filtre terminal atomique.
- Annulation vs média/Access V2 : filtre terminal atomique et rollback média.
- Les ressources cross-collection Guests/TicketTypes conservent une vérification serveur terminale ; une transaction distribuée dédiée n'a pas été ajoutée au MVP.

## 31. F/G/H regression

Notifications, settings/account, Search/Discovery, favoris, multi-rôle, Vendor, Venue, wizard six étapes, workspace, ticketing et PayPal adapter sont inclus dans la batterie fonctionnelle complète. Aucun flux PayPal externe réel n'est exécuté en Wave I.

## 32. Full regression

Résultat navigateur final : **300 passed, 2 skips historiques, 0 failed**, soit 302 exécutions en 21,7 minutes. Aucun nouveau skip. Erreurs console inattendues : 0 ; page errors inattendues : 0 ; HTTP >=500 inattendus : 0. Les réponses négatives injectées (dont le 503 Ticketing fail-closed) sont locales et explicitement assertées.

## 33. Independent review findings

IMPLEMENTATION COMPLETE — BEGIN INDEPENDENT REVIEW

La seconde lecture a produit les corrections suivantes :

- écriture Event terminale rendue atomique ;
- course annulation/média avec rollback Cloudinary ;
- course annulation/Access V2 ;
- blocage d'un TicketType payant résiduel ;
- guests e-mail inclus et destinataires dédupliqués ;
- échecs best effort observables sans PII ;
- injection de contrôles dans les sujets d'e-mail neutralisée ;
- scan QR d'un Event annulé/terminé/brouillon interdit côté serveur ;
- CTA d'aperçu workspace masqué lorsque la projection publique est impossible (privé, brouillon ou terminal) ;
- fixture QR alignée sur le contrat actif : Event publié avant admission ;
- isolation du bucket Search dans les E2E, sans affaiblir le throttling ;
- routes publiques/auth de l'audit scroll exécutées dans un vrai contexte anonyme, sans redirection parasite vers le dashboard.

## 34. P0/P1/P2/P3

| Sévérité | Trouvés | Ouverts | Résolution |
|---|---:|---:|---|
| P0 | 0 | 0 | — |
| P1 | 1 | 0 | admission QR après annulation bloquée serveur + E2E |
| P2 | 6 | 0 | races Event/média/Access V2, paid type résiduel, sujet e-mail, CTA aperçu privé |
| P3 | 4 | 0 | isolation rate-limit, observabilité best effort, fixtures QR et scroll durcies |

## 35. Deferred items

- remboursement/void financier et communication de remboursement ;
- annulation partielle ou report/reprogrammation ;
- moteur d'audit générique ;
- duplication Event ;
- notifications temps réel ;
- orchestration durable/retry des e-mails au-delà du best effort actuel.

## 36. Preserved backlog F/G/H

- F : rappels programmés, « ticket vendu », annulations Vendor/Venue, WebSocket/SSE/push, centre complet.
- G : changement d'e-mail sécurisé, langue globale, abonnement/facturation/invoices/tax, suppression rôle, multi-device.
- H : Reviews, recherche sémantique/IA, ranking cross-entity avancé et moteur spécialisé post-volume MVP.

## 37. Wave K dependency list

Wave K devra définir : refund/void PayPal réel, statuts et idempotence financière, réconciliation webhook, stock après remboursement, remboursements partiels, communications, audit trail et traitement des échecs. Tant que ce gate n'existe pas, Wave I bloque toute annulation présentant un risque payant.

## 38. Remaining risks

- Les notifications/e-mails d'annulation sont best effort : une panne fournisseur est journalisée, mais aucun outbox/retry durable n'est ajouté dans cette Wave.
- Le scheduler est sûr par filtres Mongo multi-instance, mais il n'expose pas encore de métrique/alerte opérationnelle dédiée.
- Les guards cross-collection ferment le chemin normal ; une course sub-milliseconde entre vérification Event et mutation d'une collection distincte demanderait une transaction Mongo élargie, disproportionnée pour ce périmètre et sans corruption financière grâce aux gates Ticketing.

## 39. Release scorecard

| Domaine | Statut | Justification |
|---|---|---|
| EVENT STATE MACHINE | GREEN | Transitions explicites et terminaux |
| DRAFT EDIT/DELETE | GREEN | Hard delete draft-only atomique |
| PUBLICATION/READINESS | GREEN | Readiness serveur et transition atomique |
| AUTOMATIC ONGOING | GREEN | Scheduler UTC idempotent |
| AUTOMATIC COMPLETION | GREEN | Borne de fin inclusive |
| EVENT CANCELLATION | GREEN | Parcours UI/API/public intégré |
| PAID CANCELLATION SAFETY | GREEN | Fail-closed, aucun faux refund |
| PARTICIPANT IMPACT | GREEN | Notification, admission et QR fermés |
| WORKSPACE | GREEN | Consultation terminale explicite |
| SEARCH/PUBLIC | GREEN | États actifs cohérents |
| SECURITY/OWNERSHIP | GREEN | IDOR et résurrection refusés |
| RESPONSIVE/A11Y | GREEN | 7 viewports, Axe 0/0 |
| EXTERNAL REFUND READINESS | N/A | Dépendance Wave K |

## 40. Final verdict

Tous les gates locaux sont verts : API 1 306 unitaires, 153 E2E et 17 concurrences ; Web 445 unitaires et 300 E2E réussis avec 2 skips historiques ; builds, lint, typecheck, audits npm, scan secrets ciblé et `git diff --check` verts. P0/P1/P2 ouverts : 0. Les PR Wave I sont ouvertes vers `dev` et ne sont pas fusionnées dans cette mission.

**SPRINT 4 / WAVE I — VALIDÉE — EVENT OPERATIONS PRODUCT LIFECYCLE COMPLETE — PR OUVERTE VERS DEV**
