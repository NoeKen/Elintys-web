# Wave C Integration Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolider les intégrations frontend et canonicaliser les routes dashboard prouvées équivalentes sans changer le comportement produit.

**Architecture:** `api` demeure le transport navigateur unique et `fetchCatalogJson` le transport SSR catalogue. Les features conservent leurs services métier, types projetés et query keys proches du domaine. Les anciennes URLs utilisent une table de redirects statiques testée.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query, TypeScript, Vitest, Playwright; NestJS/MongoDB inchangés.

**Spec:** `docs/superpowers/specs/2026-09-07-wave-c-integration-cleanup-design.md`

## Global Constraints

- Branches : `refactor/s3-wave-c-integration-architecture-cleanup`, base Wave B fusionnée.
- Aucun changement produit, API métier, paiement, production ou migration.
- Chaque suppression suit recherche consommateurs/imports/routes/tests, puis typecheck/tests/build.
- TDD : test en échec observé avant chaque modification comportementale ou de contrat.
- P0/P1/P2 C ouverts = 0 avant PR; aucun force push ni merge.

---

### Task 1: Consolidate browser HTTP clients

**Files:**
- Modify: `src/features/guests/services/guests.service.ts`
- Modify: `src/features/notifications/services/notifications.service.ts`
- Modify: `src/features/waitlist/services/waitlist.service.ts`
- Modify: consumers in dashboard pages and `NotificationBell.tsx`
- Delete: `src/shared/hooks/useAuthToken.ts`
- Test: new service tests beside each service

**Interfaces:**
- Consumes: `api.get/post/put/patch/delete`, `ApiClientError`.
- Produces: identical domain values with no token argument and uniform errors.

- [ ] Add characterization tests asserting paths, query params, bodies and 204 behavior through `api`.
- [ ] Run tests and observe failure because services still use local `fetch`.
- [ ] Migrate services and consumers, preserving query enablement from authenticated page guards.
- [ ] Prove no `authFetch` or `useAuthToken` consumer remains; delete the hook.
- [ ] Run targeted tests, typecheck and commit `refactor(web): consolidate authenticated http clients`.

### Task 2: Canonicalize touched query keys and domain types

**Files:**
- Create: `src/features/guests/query-keys.ts`
- Create: `src/features/notifications/query-keys.ts`
- Modify: Guests/Notifications consumers
- Modify: `src/features/guests/types/index.ts`
- Modify: `src/features/guests/index.ts`
- Delete: `src/features/guests/hooks/useGuests.ts`
- Test: query-key tests and affected component/service tests

**Interfaces:**
- Produces: `guestKeys` and `notificationKeys`, prefix-compatible invalidation, runtime Guest contract.

- [ ] Add tests with literal expected query keys and runtime Guest fields.
- [ ] Run RED against missing factories.
- [ ] Implement factories, migrate consumers and move Guest contracts out of the service.
- [ ] Delete the unconsumed hook after static proof.
- [ ] Run targeted tests/typecheck and commit `refactor(web): align query cache ownership`.

### Task 3: Remove proven dead hooks, services and stale contracts

**Files:**
- Delete: `src/features/discovery/` after proving no consumer
- Delete: `src/features/events/hooks/useEvents.ts`
- Delete: `src/features/vendors/hooks/useVendors.ts`
- Modify: corresponding barrels
- Modify: `src/features/vendors/services/vendors.service.ts` and vendor types
- Modify: `src/features/tickets/services/tickets.service.ts` and tests/types
- Delete: `src/components/public/TicketSelector.tsx`
- Delete: `src/shared/types/domain.types.ts` and its barrel export if all symbols are unconsumed

**Interfaces:**
- Produces: services containing only runtime endpoints and Ticket normalization retaining `isFree`, `reserved`, `currency`.

- [ ] Add a failing Ticket normalization test with literal canonical fields.
- [ ] Run RED, implement the minimal normalizer/type correction, run GREEN.
- [ ] Prove each hook, method, component and shared type has no consumer, dynamic import, route or test dependency.
- [ ] Remove dead artifacts; run typecheck, unit tests and build.
- [ ] Commit stale-service cleanup separately from dead-code deletion.

### Task 4: Canonicalize safe legacy dashboard routes

**Files:**
- Create: `src/shared/navigation/legacy-dashboard-redirects.ts`
- Modify: `next.config.ts`
- Delete: top-level route pages that have exact canonical equivalents
- Test: `src/shared/navigation/legacy-dashboard-redirects.test.ts`
- E2E: add a focused legacy redirect spec

**Interfaces:**
- Produces: immutable Next redirects `{ source, destination, permanent: true }[]` with internal literal destinations.

- [ ] Write literal route-map tests including role and non-looping internal destinations; observe RED.
- [ ] Implement the table and wire `next.config.ts`; run GREEN.
- [ ] Delete only page files represented in the table after consumer search.
- [ ] Run build and focused HTTP/Playwright redirect checks.
- [ ] Commit `refactor(web): canonicalize legacy dashboard routes`.

### Task 5: Independent review and corrections

**Files:** all branch changes.

- [ ] Inspect `git diff origin/dev...HEAD` as third-party code.
- [ ] Search indirect imports, dynamic imports, raw fetch, auth sentinels, stale endpoints and scope creep.
- [ ] Re-run auth 401/429/500/network unit regressions and security checks.
- [ ] Re-run Wave A multi-role and Wave B burger navigation; correct confirmed findings via TDD.
- [ ] Emit `IMPLEMENTATION COMPLETE — BEGIN INDEPENDENT REVIEW` at the posture switch.

### Task 6: Final gates, report and PRs

**Files:**
- Create: `docs/audits/sprint-3-wave-c-integration-architecture-cleanup-final.md`

- [ ] Run API lint/typecheck/build/unit/E2E/audit/secret scan/diff check.
- [ ] Run Web lint/typecheck/build/unit/coverage/targeted E2E/audit/secret scan/diff check.
- [ ] Record before/after metrics, findings, coverage, commits and out-of-scope register.
- [ ] Verify clean worktrees and stopped services.
- [ ] Push feature branches and open PRs to `dev` only when all gates satisfy the mandate.
