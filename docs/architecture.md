# Architecture

## Purpose and state

JanSahabhag 2047 is a browser-only demo of a connected civic journey with fictional data. Tasks 01–05 are merged into `autobuild`, including lazy route loading, missing-record behavior and browser verification. [paused.md](../paused.md) records the completed integration history.

## Layers and data flow

```text
Browser URL → React Router → AppShell → feature screen
                                      ↓ calls
                             DemoRepository contract
                                      ↓ implemented by
                            LocalDemoRepository
                                      ↓ loads/saves
                PersistenceService → migrations → localStorage
                         ↑ first load/reset
                 Canonical fictional seed database
```

`src/main.tsx` mounts `App`, which initializes the selected persona before rendering `RouterProvider`. Task 05 lazy-loads feature screens. `AppShell` supplies desktop and mobile navigation, utilities and persona controls. A screen reads typed records through the repository, invokes an action and refreshes its view. `useAppRefreshStore` is a UI invalidation signal, not the database.

The repository owns status transitions and related Activity, Notification, Civic Credit and Passport records. Lesson completion adds +5 Learning; assignment submission adds +10 Contribution; teacher verification updates that same submission, verifies attached evidence and adds +5 Observation per item. Assembly joins/contributions, proposition revisions/finalisation, and reflection create traceable records. Project milestone completion adds repeat-safe +10 Civic Action plus Activity and Passport entries. Credit totals derive from ledger transactions, not a stored score alone.

## Domain and service boundary

`src/types/domain.ts` defines stable IDs, entities and status unions. `DemoDatabase` is assembled from `src/data/seed/`. `src/services/repository.ts` is the seam for a possible future HTTP repository. Screens should not import the seed as live data or write storage. Source IDs connect evidence, submissions, assemblies, propositions, projects, credits and Passport entries. Passport entries are display references to source records.

## Personas and permissions

`/demo-login` and the utility bar switch between seeded participant, teacher, facilitator, institution, programme and platform personas. The selected `activeUserId` persists locally. There is no password, session token or identity verification. Role-aware navigation and view checks are frontend simulation, never server authorization. Participant screens filter by user ID; teacher review updates the selected shared submission. Private evidence should appear only in owner or appropriate review views.

## Persistence lifecycle

`PersistenceService` clones the seed into `jansahbhag_demo_v1` on first load and reset. Compatible schema version 1 data is loaded; corrupt or incompatible data resets through migrations. A memory fallback permits current-session use when browser storage fails but does not survive refresh. Increase `CURRENT_SCHEMA_VERSION` and review migrations when changing persisted data shape. No real participant information belongs in this demo.

## Simulated behavior and quality

Local record changes, notifications, programme/content edits, moderation transitions, derived analytics and credits work within the browser. Identity, verification authority, scripted assembly peers, video, AI, national metrics, stakeholder delivery and multilingual tooling are simulated or labelled Demo Preview. Dissent and unresolved questions stay visible in deliberation. Civic Credits describe activity, not civic worth.

The integrated branch passed a production build, 89 Vitest unit/UI tests and six Chromium Playwright tests. The browser suite covers the end-to-end Aarav journey, specific Passport/ledger links, all README routes with seeded IDs, missing records, refresh persistence, mobile assembly/admin smoke, persona/notification/reset behavior. A host and deployment credentials have not been selected. Production authentication, authorization, data services and audit controls would require a separate project.
