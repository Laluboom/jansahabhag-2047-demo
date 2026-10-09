# JanSahabhag 2047 repository context

## Product and status

This repository is a frontend-first interactive demo of a fictional civic learning and participation platform. `README.md` defines product scope and manual acceptance; `IMPLEMENTATION_PLAN.md` defines domain flows and delivery order. The user requested the sub-agy Autobuild method. The earlier quota pause is resolved; [paused.md](paused.md) is the current handoff.

`autobuild` contains Tasks 01–05: foundation, learning/assignment and teacher review, Youth Assembly/proposition/reflection/Passport, supporting participant/admin/preview modules, and the final audit and Playwright suite. Task 05 was merged as `ca9a188` and all checks passed again on the integrated branch. `main` remains a specification-only base. See [docs/features.md](docs/features.md) for route status.

The central story is Aarav Sharma, a 17-year-old at Navchetna Public School in Jaipur, working through “My Community, My Future” on safer pedestrian crossings near schools. His path connects learning, a field assignment, teacher verification, evidence-backed assembly deliberation, proposition, reflection and Civic Passport. Seeded personas expose participant, teacher, facilitator, institution, programme and platform perspectives. All data is fictional.

## Boot, files and routing

This is one React 18, TypeScript and Vite package. `index.html` loads `src/main.tsx`, which renders `src/app/App.tsx`. The app initializes `useAuthStore` and renders the router in `src/app/router.tsx`. Most routes share `AppShell` with desktop navigation, utility bar, persona control and mobile bottom navigation. Task 05 lazy-loads route screens. `src/components/ui/`, `src/styles/index.css` and Tailwind define shared controls and styles. Unknown routes use a not-found screen.

`src/features/` groups screens by product area: auth-demo, dashboard, learning, assignments, assemblies, propositions, passport, activities, projects, events, community, institutions, administration, moderation, analytics, issues and previews. `src/types/domain.ts` defines stable-ID records and statuses. `src/data/seed/index.ts` assembles canonical fictional seed records and `getFreshSeedDatabase()` clones them for first load and reset.

## Data flow and ownership

Screens call the asynchronous `DemoRepository` contract in `src/services/repository.ts`. `LocalDemoRepository` in `src/services/demoRepository.ts` loads `DemoDatabase` through `PersistenceService`, applies domain actions, saves, and returns typed records or view models. Screens should not read/write localStorage or use seed arrays as live state. `useAppRefreshStore` signals screen reloads; it is not the database. `useAuthStore` holds the selected demo persona and presentation preferences.

Persistence uses browser key `jansahbhag_demo_v1`. First load and reset clone the seed. `runMigrations` keeps compatible schema version 1 data or resets incompatible/corrupt data. If browser storage is unavailable, an in-memory fallback keeps the current session usable without refresh durability. Schema changes need `CURRENT_SCHEMA_VERSION` and migration/reset review.

Repository actions create linked Activity, Notification, Civic Credit and Passport records. Lesson completion writes +5 Learning credit; assignment submission writes +10 Contribution; teacher verification updates that same submission, marks evidence verified and writes +5 Observation per verified item. Assembly joins, substantive contributions, proposition revision/finalisation and reflection add traceable records. Project milestones write repeat-safe +10 Civic Action credit plus Activity and Passport entries. Ledger totals derive from transactions. Source IDs connect evidence, submissions, deliberation and Passport history. Finalised propositions and verified submissions reject invalid repeat edits.

## Personas and simulation boundary

`/demo-login` and the utility bar switch among seeded identities. This is not authentication. Role-aware navigation and frontend checks are demo behavior, not secure authorization. Participant screens filter by active user; teacher review reads eligible submissions and updates the selected record. Private evidence should stay in owner or appropriate review views. No real participant data belongs here.

Community posts, RSVP, notifications, moderation transitions, programme/content edits and analytics use local shared records. Assembly peers and stages are scripted/local. AI text, national metrics, stakeholder delivery, video and multilingual capability are labelled simulated or Demo Preview. Civic Credits describe activity records, not a person's civic worth. Dissent and unresolved questions remain visible in proposition views.

## Run and verify

`npm ci` installs dependencies; `npm run dev` starts local development. `npm run build` type-checks and builds `dist/`; `npm run test -- --run` runs Vitest once. `npm run test:e2e` starts the preview server and runs six Chromium Playwright tests. It needs a local browser binary and permission to start a local server. The integrated `autobuild` branch passed build, 89 unit/UI tests and six browser tests. `vite.config.ts` excludes `.subagy/**` so nested worktrees are not tested twice.

Sub-agy plans, logs and worktrees live in ignored `.subagy/`. Independently rerun acceptance and inspect a job's diff before integration. All five tasks are now integrated; [paused.md](paused.md) records the job and merge history. No production deployment is configured. The README mentions possible hosts, but no destination or credentials were supplied.
