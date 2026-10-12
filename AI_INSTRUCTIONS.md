# Repository instructions for future sessions

1. Read [docs/architecture.md](docs/architecture.md), then [docs/service-map.md](docs/service-map.md).
2. Search symbols before opening files; read the relevant route, repository action, type and test.
3. Explain reasoning before large structural changes and extend existing patterns where practical.

## Current handoff

The previous user-requested pause has ended. [paused.md](paused.md) records Autobuild Tasks 01–05, merged into `autobuild`. The demo is published to GitHub and Vercel. The supplied [Master PRD archive](docs/reference/JanSahabhag_2047_MASTER_PRD_v3.1_LOSSLESS_ARCHIVE.docx) was checked against the app in [the reconciliation](docs/audits/MASTER_PRD_RECONCILIATION.md); [product decisions](docs/decisions.md) identifies owner inputs. Check current sub-agy quota before any new dispatch and follow the requested method's 20% Gemini five-hour threshold.

## Working rules

- Use the Master PRD opening canonical rules, Part A and retained Parts B/C as product authority. Its archived appendices are traceability copies. The archive filename says `v3.1` but its internal table says `v3.0`; do not guess why. `README.md` and `IMPLEMENTATION_PLAN.md` describe the earlier browser-demo scope and can differ from the Master PRD. The user chose `/home/lalu/Softwares/sub-agy/AUTOBUILD-PROMPT.md` as the implementation method; ignored `.subagy/plans/` and job records remain.
- Keep feature screens behind `DemoRepository` in `src/services/repository.ts`. Do not access localStorage or canonical seed arrays as live UI data.
- Preserve traceable source IDs from evidence, submissions, assemblies, propositions or projects to Passport and credit records. Derive totals from transactions and make repeatable awards idempotent.
- Use fictional data only. Persona switching, frontend role checks, verification, moderation, AI, video, external delivery and national metrics are demo or preview behavior, not production services.
- Preserve participant isolation and have teacher review update the same submission the participant sees.
- Browser storage key: `jansahbhag_demo_v1`. Update schema version and migration/reset behavior when changing persisted data shape. Reset must clone canonical seed.
- Verify with `npm run build`, `npm run test -- --run` and `npm run test:e2e`. Vitest excludes `.subagy/**`.
- Build on `autobuild` or an isolated task branch, not specification-only `main`. Review a sub-agy diff and rerun acceptance independently. Preserve ignored job records until no longer needed.
