```text
jansahabhag_2027/
├── README.md                 Product demo specification
├── IMPLEMENTATION_PLAN.md    Intended architecture and delivery sequence
├── paused.md                 Current Autobuild checkpoint and resume steps
├── REPO_CONTEXT.md           AI session orientation
├── AI_INSTRUCTIONS.md        Repository working rules
├── TODO.md                   Remaining implementation work
├── docs/                     Architecture, service, dependency and feature maps
├── src/
│   ├── app/                  App boot and route map
│   ├── components/           Shared shell and UI controls
│   ├── data/seed/            Canonical fictional database
│   ├── features/             Route screens by product area
│   ├── services/             Repository, persistence and migration boundary
│   ├── stores/               Persona and UI refresh state
│   ├── styles/               Tailwind entry and global styles
│   ├── types/                Typed domain and screen contracts
│   └── utils/                Formatting, class and ID helpers
├── tests/                   Vitest and React Testing Library tests
└── .subagy/                 Ignored plans, job logs and isolated worktrees
```

# Project map

JanSahabhag 2047 is a frontend-first civic participation demo. It lets a fictional participant learn, submit evidence, receive teacher review, join deliberation, create a proposition and accumulate a Civic Passport. Admin and future-module surfaces expose the wider product vision. The actual root checkout is paused after the foundation and learning/review tasks; a verified unmerged branch adds the complete assembly/Passport journey. See [paused.md](../paused.md) before making changes.

## Packages and entry points

This is one Vite/React/TypeScript package. `index.html` loads `src/main.tsx`, which renders `src/app/App.tsx`; `src/app/router.tsx` maps URL paths to feature screens. There is no API server, Docker entrypoint or monorepo package. `package.json` defines `npm run dev`, `npm run build`, `npm run preview`, `npm run test -- --run`, `npm run test:e2e`, and `npm run lint`. The E2E script is reserved for Task 05 and has no golden-path test yet.

## Dependencies and integrations

React Router handles navigation; Zustand holds current persona and UI state; React Hook Form and Zod validate assignment forms; Tailwind and Lucide provide the visual system; Recharts supports analytics; Vitest and React Testing Library cover local behavior. Playwright is listed as a dev dependency. No live authentication provider, API, AI service, database, video, messaging system or external stakeholder delivery exists. Analytics combines local record calculations with seeded demo metrics.

## Data and persistence

`src/data/seed/index.ts` composes fictional typed records. `src/services/repository.ts` defines the async domain boundary, implemented by `src/services/demoRepository.ts`. `src/services/persistence.ts` reads and writes versioned browser `localStorage` key `jansahbhag_demo_v1`; `src/services/migrations.ts` resets incompatible data to a fresh seed. A memory fallback is used when browser storage is unavailable. The UI should call repository methods rather than use `localStorage` or seed arrays directly. Reset Demo Data clones the canonical seed.

## Build and deployment

Run `npm ci`, then `npm run dev` for local development. `npm run build` type-checks and writes `dist/`. `npm run preview` serves that output. The Vite build currently emits a bundle-size warning. No production host, deployment config or credentials have been selected. `README.md` suggests Vercel or Netlify, but neither is connected.
