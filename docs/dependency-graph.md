# Dependency graph

```text
index.html → src/main.tsx → App → Router → AppShell → feature screens
                                               ↓
                                     shared UI components

feature screens → DemoRepository interface → LocalDemoRepository
       ↓                    ↓                        ↓
  Zustand persona       typed domain          PersistenceService
  and refresh state       contracts            ↓          ↑
                                           localStorage  migrations
                                                ↑           ↑
                                         canonical seed database

feature screens → Lucide / Tailwind / Recharts / React Hook Form + Zod
tests → repository, seed, persistence, screen components
e2e → built app via Playwright and local Vite preview server
```

`src/services/repository.ts` is the API replacement seam. `src/data/seed/` initializes and resets persistence; screens use repository methods as their live data source. `src/stores/` holds persona and presentation state, not authoritative domain records. The integrated router uses lazy imports and Playwright checks the built demo; no server is added.
