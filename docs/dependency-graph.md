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
```

`src/services/repository.ts` is the API replacement seam. `src/data/seed/` is a data source for persistence initialization and reset, not a screen dependency. `src/stores/` holds application/session presentation state, not authoritative domain records. Task 03's unmerged branch extends repository actions and feature screens without adding a server.
