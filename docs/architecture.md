# Architecture

## Purpose and current state

The application is a browser-only demo of JanSahabhag 2047. It represents a connected participant journey with fictional data and local persistence. `autobuild` currently contains the foundation and learning/teacher review flow. Verified branch `agy/j-20261009-105912-x1o2` adds the complete Youth Assembly, proposition, reflection and Passport flow but is unmerged at the pause. [paused.md](../paused.md) is the authoritative checkpoint for status and resume commands.

## Layers and data flow

```text
Browser route and React feature screen
        ↓ calls
DemoRepository interface / domain actions
        ↓ implemented by
LocalDemoRepository
        ↓ loads/saves
PersistenceService → migrations → localStorage (or memory fallback)
        ↑ initial/reset data
Canonical fictional seed database
```

`src/main.tsx` mounts `App`, which initializes the active persona through `useAuthStore` before rendering `RouterProvider`. `AppShell` supplies the sidebar, utility bar, role-aware links and mobile navigation. The router loads a feature screen. A screen fetches typed domain records through `demoRepository`, invokes an action, then refreshes its view. The repository owns status transitions and creates related activities, notifications, Civic Credit transactions and Passport references. `useAppRefreshStore` is a lightweight UI invalidation signal; it is not the database.

For example, completing a lesson updates the user's enrolment progress, writes a +5 Learning credit transaction, and creates an activity/Passport record. Assignment submission stores the participant's draft or submitted record and a +10 Contribution transaction. Teacher review changes that same submission; verification marks attached evidence verified, adds Observation transactions and creates a traceable Passport entry. The Task 03 branch extends this pattern to assembly joins, contributions, proposition revisions/finalisation and reflection.

## Domain and service boundary

`src/types/domain.ts` defines stable string IDs, typed status unions and shared entities. The main data container is `DemoDatabase`, composed in `src/data/seed/index.ts`. `src/services/repository.ts` is the intended swap point for a future HTTP repository. Screens must not directly import seed data or read/write storage. The single local repository currently spans domain areas; future production services could split it without changing feature screens if the interface remains stable.

Evidence IDs connect assignments, Assemblies, propositions and Passport entries. Civic Credits are a transaction ledger; totals derive from transactions. Passport entries are display references to source records, not a substitute for them. Private evidence should be shown only within the appropriate owner or authorized local view. This is demo behavior, not a server-enforced privacy boundary.

## Personas and permissions

`/demo-login` and the utility bar switch among seeded participant, teacher, facilitator, institution admin, programme manager and platform admin personas. Switching persists `activeUserId` in the local database. The app has no password, session token or identity verification. Role-aware navigation and screen checks are frontend simulation and must never be described as production authorization. Teacher and participant views read the same submission records, so a teacher's decision appears when the participant persona returns.

## Persistence lifecycle

On first load, `PersistenceService` clones the seed into key `jansahbhag_demo_v1`. A compatible stored schema is loaded; incompatible or damaged data is reset through the migration layer. `Reset Demo Data` writes a fresh clone. Browser actions persist across refresh when localStorage works; memory fallback does not survive refresh. No real participant data belongs in this database. Increment `CURRENT_SCHEMA_VERSION` and add an explicit migration/reset policy when the shape changes.

## Simulated versus real behavior

Real within the browser: typed record updates, draft/submission/review state, course progress, local community posts, notifications, derived analytics, credit transactions and reset. Simulated: identity and permissions, verification authority, AI suggestions, real-time Assembly participants, video sessions, external stakeholder delivery, national-scale metrics and multilingual tooling. Future-module screens carry Demo Preview labels. No live external service receives user content.

## Quality and limitations

The integrated branch has 35 passing unit/UI tests and a successful production build. Task 03's worktree has 55 passing tests and a successful build; its browser check confirmed join and contribution, not the full golden path. Task 04 must deepen projects/admin and Task 05 must add Playwright E2E, responsive/accessibility validation and route checks. Current builds warn about a large JavaScript chunk. No deployment target is configured.
