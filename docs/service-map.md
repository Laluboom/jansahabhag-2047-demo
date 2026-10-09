# Service and subsystem map

**Service: App boot and routing**
Purpose: Initialize active persona, mount React, resolve routes and fallback errors.
Key Files: `src/main.tsx`, `src/app/App.tsx`, `src/app/router.tsx`, `src/features/errors/`.
Dependencies: Zustand auth store, React Router, feature screens.
Used By: Every browser route.

**Service: Responsive app shell**
Purpose: Desktop/sidebar and mobile navigation, persona indicator, utilities, demo reset and shared UI vocabulary.
Key Files: `src/components/layout/`, `src/components/ui/`, `src/styles/index.css`, `tailwind.config.js`.
Dependencies: Auth store, repository for persona/notification/reset data, React Router.
Used By: All routes under `AppShell`.

**Service: Persona and UI state**
Purpose: Keep current fictional user, loading status, demo language selection and a view-refresh signal.
Key Files: `src/stores/authStore.ts`, `src/stores/useAppRefreshStore.ts`.
Dependencies: Demo repository, Zustand.
Used By: App boot, navigation and feature screens. This is not the authoritative domain database.

**Service: Domain contracts**
Purpose: Stable typed entities, state unions, input types and Passport/Dashboard view contracts.
Key Files: `src/types/domain.ts`, `src/types/index.ts`, `src/services/repository.ts`.
Dependencies: None within the app.
Used By: Repository, seed, stores and screens. The repository interface is the future HTTP API seam.

**Service: Local demo repository**
Purpose: Load shared records, apply domain transitions, derive progress/credits, create linked activities, notifications and Passport metadata.
Key Files: `src/services/demoRepository.ts`.
Dependencies: Repository/types, persistence adapter, seed-backed database.
Used By: Learning, assignments, teacher review, assembly, Passport, projects, events, community, admin and analytics screens. Task 03's branch extends its assembly/proposition/reflection actions.

**Service: Persistence and migrations**
Purpose: Seed, load, save, reset and version the local database.
Key Files: `src/services/persistence.ts`, `src/services/migrations.ts`.
Dependencies: Typed `DemoDatabase`, canonical seed.
Used By: Local demo repository. Browser key: `jansahbhag_demo_v1`; memory fallback when storage fails.

**Service: Canonical seed**
Purpose: Deterministic fictional scenario and varied entity states for all personas.
Key Files: `src/data/seed/index.ts` and its domain-specific sibling files.
Dependencies: Domain types.
Used By: Persistence first load/reset, test fixtures through reset. Main story: Aarav at Navchetna Public School, Jaipur, working on pedestrian safety.

**Service: Participant learning and assignment journey**
Purpose: Dashboard next step, course/lesson progress, field assignment draft/submission, teacher review and notification links.
Key Files: `src/features/dashboard/`, `src/features/learning/`, `src/features/assignments/`, `src/features/notifications/`.
Dependencies: Repository, auth store, shared UI; assignment form uses React Hook Form and Zod.
Used By: Aarav and Meera participant personas; Kavita teacher persona.

**Service: Deliberation and Passport**
Purpose: Assembly roles/stages, evidence-backed contributions, structured propositions, reflections, credit ledger and civic history.
Key Files: `src/features/assemblies/`, `src/features/propositions/`, `src/features/passport/`, `src/services/demoRepository.ts`.
Dependencies: Repository, auth store, evidence/credit/passport entities.
Used By: Participant and facilitator personas. The complete join/editor/reflection implementation is verified only on unmerged `agy/j-20261009-105912-x1o2`.

**Service: Supporting civic action and local community**
Purpose: Show activities, projects, events/RSVP, community groups/posts and issues preview.
Key Files: `src/features/activities/`, `events/`, `projects/`, `community/`, `issues/`.
Dependencies: Repository, auth store, shared UI.
Used By: Participant and programme views. Task 04 must finish milestone idempotence, Passport linkage and breadth of interactions.

**Service: Institution, administration and analytics**
Purpose: Shared-data oversight, programmes/content views, moderation state, institution participants and derived/seeded metrics.
Key Files: `src/features/institutions/`, `administration/`, `moderation/`, `analytics/`.
Dependencies: Repository, persona state, Recharts where charts are used.
Used By: Ananya, Dev and Demo Administrator. Task 04 must add local admin state changes rather than static views alone.

**Service: Product vision previews**
Purpose: Explain future parliament, idea/research/policy labs, stakeholder and Studio surfaces without suggesting live integrations.
Key Files: `src/features/previews/`, `src/features/issues/`.
Dependencies: Shared UI and seeded content.
Used By: All personas; labelled Demo Preview. Task 04 deepens design and control behavior.

**Service: Verification**
Purpose: Protect core local contracts and screen rendering.
Key Files: `tests/`, `vite.config.ts`, `package.json`; future `e2e/` and `playwright.config.*`.
Dependencies: Vitest, Testing Library, Playwright dependency.
Used By: Autobuild acceptance. Current Vitest config excludes `.subagy/**` so nested worktrees are not tested twice.
