# Feature index and implementation status

Status terms here refer to the `autobuild` checkout at the pause. **Verified pending** means present on unmerged Task 03 branch `agy/j-20261009-105912-x1o2`; **planned** means Task 04 or 05 remains undispatched. See [paused.md](../paused.md) before resuming.

## App shell and personas

Files: `src/app/`, `src/components/layout/`, `src/features/auth-demo/`, `src/features/profile/`, `src/stores/authStore.ts`.
Entry point: `/`, `/demo-login`, `/profile`, `/welcome`, `/onboarding`.
Notes: Integrated. Responsive sidebar and mobile navigation; persona switching and reset are demo-only. English is active; Hindi/Rajasthani controls are labelled demo.

## Participant dashboard

Files: `src/features/dashboard/ParticipantDashboardPage.tsx`, `src/services/demoRepository.ts`.
Entry point: `/dashboard`.
Notes: Integrated. Shows next step, programme, course progress, credits, assembly and recent activity from local records.

## Civic Academy, Self-Growth and UHV learning

Files: `src/features/learning/`, `src/data/seed/courses.ts`.
Entry point: `/learn`, `/learn/:courseId`, `/learn/:courseId/lesson/:lessonId`.
Notes: Integrated. Enrolment and lesson completion persist; +5 Learning credit and Passport activity are repeat-safe.

## Assignments, evidence and teacher review

Files: `src/features/assignments/`, `src/services/demoRepository.ts`, `src/data/seed/assignments.ts`.
Entry point: `/assignments`, `/assignments/:id`, `/assignments/:id/submit`.
Notes: Integrated. Draft/edit/submit, mock evidence, teacher queue and revision/verification use one shared submission. +10 Contribution on submission and +5 Observation per verified evidence are ledger transactions. Repository rejects edits to verified/under-review submissions.

## Notifications

Files: `src/features/notifications/`, `src/components/layout/TopUtilityBar.tsx`.
Entry point: `/notifications`.
Notes: Integrated. Persona-scoped local notifications, mark read and target routes.

## Youth Assemblies and roles

Files: `src/features/assemblies/`, `src/data/seed/assemblies.ts`.
Entry point: `/assemblies`, `/assemblies/:id`, `/assemblies/:id/session`.
Notes: Initial screen is integrated; fresh join, nine-stage session, assigned role, scripted/local contributions and traceable evidence are **verified pending**. Browser check confirmed fresh join and contribution on Task 03 branch.

## Structured propositions, support and dissent

Files: `src/features/propositions/`, `src/features/assemblies/AssemblySessionPage.tsx`.
Entry point: `/propositions/:id`, `/propositions/:id/revisions`.
Notes: Initial display is integrated; editor, revisions, support/dissent and finalisation are **verified pending**. Full golden-path browser test remains planned.

## Reflections, Civic Passport and Credits

Files: `src/features/passport/`, `src/services/demoRepository.ts`.
Entry point: `/passport`, `/passport/credits`, `/passport/evidence`, `/passport/achievements`.
Notes: Initial seeded/learning/assignment views are integrated. Assembly/reflection actions, revised ledger views and Passport updates are **verified pending**. Credits represent activity records rather than civic worth.

## Projects and civic activities

Files: `src/features/projects/`, `src/features/activities/`.
Entry point: `/projects`, `/projects/:id`, `/participate`, `/activities`.
Notes: Initial screens integrated; Task 04 is planned for idempotent milestone credit, Passport linkage, notes and mock evidence completion.

## Events and simulated sessions

Files: `src/features/events/`, `src/data/seed/events.ts`.
Entry point: `/events`, `/events/:id`.
Notes: Initial list/detail/RSVP integrated. Calendar, attendance and richer simulated session behavior require Task 04 review; there is no live video.

## Local community

Files: `src/features/community/`, `src/data/seed/community.ts`.
Entry point: `/community`, `/community/groups/:id`.
Notes: Seeded groups plus local posts/replies integrated; Task 04 checks permissions and complete interaction design. Nothing is sent outside the browser.

## Institution and administration

Files: `src/features/institutions/`, `src/features/administration/`, `src/features/moderation/`, `src/features/analytics/`.
Entry point: `/institution/*`, `/admin/*`, `/analytics`.
Notes: Initial dashboards/lists and basic moderation action integrated. Task 04 must add local admin CRUD/state changes and ensure metrics/screens share repository records. Seeded national metrics are illustrative.

## Future-module previews

Files: `src/features/previews/`, `src/features/issues/`.
Entry point: `/issues`, `/issues/:id`, `/parliament`, `/labs/ideas`, `/labs/research`, `/labs/policy`, `/stakeholders`, `/studio`.
Notes: Initial labelled Demo Preview screens integrated; Task 04 must deepen them and remove dead active controls. AI, advanced multilingual, stakeholder delivery and national analytics are simulated.

## Testing, accessibility and responsive polish

Files: `tests/`, `vite.config.ts`, future `e2e/`, `playwright.config.*`.
Entry point: `npm run build`, `npm run test -- --run`, future `npm run test:e2e`.
Notes: 35 tests pass on `autobuild`; 55 pass on Task 03 branch. Task 05 is planned for full Playwright golden path, mobile/accessibility and route acceptance.
