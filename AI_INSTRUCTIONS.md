# Repository instructions for future sessions

1. Read [docs/architecture.md](docs/architecture.md), then [docs/service-map.md](docs/service-map.md).
2. Search symbols before opening files; read the relevant route, repository action, type and test.
3. Explain reasoning before large structural changes and extend existing patterns where practical.

## Current handoff

The previous user-requested pause has ended. [paused.md](paused.md) records the completed Autobuild jobs and the verified final Task 05 branch `agy/j-20261009-154211-yd8l`. Tasks 01–04 are merged into `autobuild`; Task 05 is intentionally unmerged for the Autobuild handback. The last Gemini five-hour quota was 6.4%, so do not dispatch another sub-agy job without a fresh quota check and the requested method's 20% threshold.

## Working rules

- Treat `README.md` and `IMPLEMENTATION_PLAN.md` as product specifications. The user chose `/home/lalu/Softwares/sub-agy/AUTOBUILD-PROMPT.md` as the implementation method; its local path may not be present in future sessions, but the ignored `.subagy/plans/` and job records remain.
- Keep feature screens behind `DemoRepository` in `src/services/repository.ts`. Do not access localStorage or canonical seed arrays as live UI data.
- Preserve traceable source IDs from evidence, submissions, assemblies, propositions or projects to Passport and credit records. Derive totals from transactions and make repeatable awards idempotent.
- Use fictional data only. Persona switching, frontend role checks, verification, moderation, AI, video, external delivery and national metrics are demo or preview behavior, not production services.
- Preserve participant isolation and have teacher review update the same submission the participant sees.
- Browser storage key: `jansahbhag_demo_v1`. Update schema version and migration/reset behavior when changing persisted data shape. Reset must clone canonical seed.
- Verify with `npm run build`, `npm run test -- --run` and, on the Task 05 branch or after integration, `npm run test:e2e`. Vitest excludes `.subagy/**`.
- Build on `autobuild` or an isolated task branch, not specification-only `main`. Review a sub-agy diff and rerun acceptance independently. Preserve ignored job records until no longer needed.
