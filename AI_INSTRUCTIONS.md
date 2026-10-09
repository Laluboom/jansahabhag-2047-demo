When working in this repository:

1. Read /docs/architecture.md first.
2. Read /docs/service-map.md second.
3. Search symbols / grep before opening files.
4. Read only directly relevant files.
5. Avoid opening unrelated directories.
6. Explain reasoning before making large structural changes.
7. Prefer extending existing patterns over introducing new ones.
8. Do not introduce new frameworks or libraries without justification.

## Current handoff

Read `/paused.md` before implementation. The user explicitly paused the active Autobuild goal. **Do not resume dispatch, merge the pending Task 03 branch, or mark the goal complete without a later user request to resume.** `autobuild` has Tasks 01–02; verified Task 03 is on unmerged `agy/j-20261009-105912-x1o2`; Tasks 04–05 have only plans in `.subagy/plans/`.

## Repository rules

- Treat `README.md` and `IMPLEMENTATION_PLAN.md` as product/architecture specifications. `/home/lalu/Softwares/sub-agy/AUTOBUILD-PROMPT.md` describes the requested orchestration method; it is not tracked in this repository. The user's current instruction to pause controls the next action.
- Keep feature screens behind `DemoRepository` (`src/services/repository.ts`); do not access `localStorage` or import canonical seed data in UI code. Extend `LocalDemoRepository` and typed domain contracts when a new action is required.
- Preserve a traceable source ID from evidence, submission, assembly, proposition or project to Passport/credit records. Derive credit totals from transactions, and make repeatable actions idempotent.
- Use fictional demo data only. This is not production authentication, verification, moderation, AI or real-time collaboration. Mark simulated and preview capabilities clearly.
- Preserve persona isolation in participant views and use the same underlying submission for teacher review. Frontend role checks do not constitute production security.
- The browser storage key is `jansahbhag_demo_v1`; update `CURRENT_SCHEMA_VERSION` and migration/reset behavior when the data shape changes. `Reset Demo Data` must restore a fresh canonical clone.
- Use `npm ci`, `npm run build`, and `npm run test -- --run` for baseline verification. Vitest excludes `.subagy/**` to avoid duplicate worktree tests. `npm run test:e2e` is planned but has no golden-path test yet.
- Build in `autobuild` or sub-agy worktrees, never `main`. Review job diff and independently rerun acceptance in its worktree. Check root `git status --porcelain` before integrating. `.subagy/` is ignored; preserve it as the job record.
- `npm run build` currently emits a bundle-size warning; Task 05 should assess code splitting. Avoid treating a job's self-reported tests or “no warnings” claim as independent evidence.
