# Service and subsystem map

| Subsystem | Key files | Responsibility and consumers |
| --- | --- | --- |
| App boot and routing | `src/main.tsx`, `src/app/App.tsx`, `src/app/router.tsx`, `src/features/errors/` | Initialize persona, lazy-load routes, render fallback errors. Used by every route. |
| Responsive shell | `src/components/layout/`, `src/components/ui/`, `src/styles/index.css` | Desktop/sidebar and mobile navigation, persona control, notifications and reset. Used by app routes. |
| Persona and UI state | `src/stores/authStore.ts`, `src/stores/useAppRefreshStore.ts` | Selected fictional user, language presentation and view invalidation. Domain records remain in the repository. |
| Domain contracts | `src/types/domain.ts`, `src/types/index.ts`, `src/services/repository.ts` | Stable entities, status unions, action inputs and async repository seam. |
| Local repository | `src/services/demoRepository.ts` | Shared record transitions, progress, ledger totals, Activity/Notification/Passport links. Used by participant, teacher, admin and analytics screens. |
| Persistence and migrations | `src/services/persistence.ts`, `src/services/migrations.ts` | Seed/load/save/reset versioned database at `jansahbhag_demo_v1`; memory fallback. |
| Canonical seed | `src/data/seed/index.ts` and sibling domain files | Deterministic fictional scenario for first load/reset and tests. |
| Learning and teacher review | `src/features/dashboard/`, `learning/`, `assignments/`, `notifications/` | Course progress, field assignments, mock evidence, teacher review and notifications. |
| Deliberation and Passport | `src/features/assemblies/`, `propositions/`, `passport/` | Assembly roles/stages, contributions, proposition support/dissent/finalisation, reflection, credit and history views. |
| Civic action and community | `src/features/activities/`, `projects/`, `events/`, `community/`, `issues/` | Milestones, RSVP, local posts/comments and labelled issues preview. |
| Institution, administration and analytics | `src/features/institutions/`, `administration/`, `moderation/`, `analytics/` | Shared-data programme/content changes, moderation and local/seeded metrics. |
| Vision previews | `src/features/previews/` | Parliament, labs, stakeholders and Studio Demo Preview surfaces with disclosed simulation. |
| Verification | `tests/`, `e2e/`, `vite.config.ts`, `playwright.config.ts` | Vitest/Testing Library and six Chromium browser checks; nested `.subagy/**` excluded from Vitest. |

The repository interface is the API replacement seam. Features depend on that contract and typed entities; seed data initializes persistence and does not serve as live screen state. See [docs/architecture.md](architecture.md) for data flow and simulation boundaries.
