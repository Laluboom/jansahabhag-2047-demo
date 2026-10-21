# Project map

JanSahabhag 2047 is a frontend-only civic participation demo with fictional personas and local records. Tasks 01–05 are integrated on `autobuild`. See [paused.md](../paused.md) for the completed Autobuild history.

```text
jansahabhag_2047/
├── README.md                 Product scope and manual acceptance
├── IMPLEMENTATION_PLAN.md    Domain flows and delivery sequence
├── paused.md                 Current Autobuild handback and job history
├── REPO_CONTEXT.md           AI session orientation
├── AI_INSTRUCTIONS.md        Repository working rules
├── TODO.md                   Final merge and future choices
├── docs/                     Architecture, service, dependency and feature maps
├── src/
│   ├── app/                  App boot and lazy route map
│   ├── components/           Shared shell and UI controls
│   ├── data/seed/            Canonical fictional database
│   ├── features/             Route screens by product area
│   ├── services/             Repository, persistence and migrations
│   ├── stores/               Persona and UI refresh state
│   ├── styles/               Tailwind entry and global styles
│   ├── types/                Domain and screen contracts
│   └── utils/                Formatting, class and ID helpers
├── tests/                    Vitest and Testing Library tests
├── e2e/                      Playwright browser tests
├── playwright.config.ts      Browser test setup
└── .subagy/                  Ignored plans, job logs and archived worktrees
```

The checkout folder, public GitHub repository and Vercel project now use `2047`. A compatibility link at the former folder path keeps this Codex project entry working until its saved path is updated; see [product decisions](decisions.md#owner-decisions-and-remaining-reviewer-inputs), OD.7.

## Entry points and commands

One Vite/React/TypeScript package. `index.html` loads `src/main.tsx`, which renders `src/app/App.tsx`. `src/app/router.tsx` maps every README path. There is no API server, Docker entrypoint or monorepo package. `npm run dev` serves local development; `npm run build` type-checks and writes `dist/`; `npm run preview` serves it; `npm run test -- --run` runs unit/UI checks; `npm run test:e2e` runs Chromium browser checks on Task 05.

## Dependencies and integration boundary

React Router handles navigation; Zustand holds persona and UI state; React Hook Form and Zod validate assignment forms; Tailwind and Lucide provide the visual system; Recharts supports analytics. Vitest, Testing Library and Playwright verify behavior. There is no live auth provider, API, AI service, database, video, messaging system or stakeholder delivery. Analytics combines derived local values with labelled seeded national previews.

`src/services/repository.ts` defines the asynchronous domain boundary; `src/services/demoRepository.ts` implements it against `src/services/persistence.ts` and `localStorage` key `jansahbhag_demo_v1`. `src/data/seed/index.ts` assembles fictional records. Reset clones the seed; incompatible data passes through migrations. UI screens should call repository methods rather than read storage or seed arrays.

## Build and deployment

Task 05's independent production build passed. Lazy route loading reduced the largest chunks to about 428 kB and 405 kB. The public repository is [Laluboom/jansahabhag-2047-demo](https://github.com/Laluboom/jansahabhag-2047-demo). Vercel project `lalubooms-projects/jansahabhag2047` serves the [public demo](https://jansahabhag2047.vercel.app). The former site address permanently redirects to it.
