# Remaining work

The active Autobuild goal is paused by the user. [paused.md](paused.md) contains the exact checkpoint and resume commands. Do not start these items until the user resumes.

## Integration

- [ ] On resume, check clean `autobuild` status and sub-agy quota. Merge verified Task 03 branch `agy/j-20261009-105912-x1o2` only when needed as Task 04's dependency; rerun build and unit suite.
- [ ] Dispatch, verify and integrate `.subagy/plans/04-support-admin-previews.md` after Task 03 is integrated.
- [ ] Dispatch and verify `.subagy/plans/05-polish-golden-path.md` after Task 04. Review its branch and full test results before final handback.

## Task 04: supporting and administration

- [ ] Make project milestones repeat-safe and create traceable Civic Action/Passport updates.
- [ ] Finish event/calendar/attendance, project note/evidence and local community interactions.
- [ ] Make institution, programme, content and moderation actions update the shared local database; ensure derived analytics reflect those changes.
- [ ] Deepen preview pages and label every simulated or disabled action.

## Task 05: final acceptance

- [ ] Add and run Playwright golden path from Aarav learning through teacher verification, assembly, proposition, reflection and Passport.
- [ ] Check all specified routes, refresh persistence, persona isolation, reset, notifications and repeat-safe credit transactions.
- [ ] Review mobile/tablet assembly and admin layouts, keyboard/focus, labels, contrast, reduced motion, loading/empty/error states.
- [ ] Assess the Vite large-chunk warning and split routes if warranted.
- [ ] Review `npm ci` audit findings and choose supported dependency updates deliberately.

## Production-readiness

- [ ] Select a deployment destination and credentials if deployment is requested. No hosting target is configured now.
- [ ] Replace demo persona switching with real authentication and server-enforced authorization only in a future production phase.
- [ ] Replace local persistence, simulated verification, messaging, AI, sessions, moderation and analytics with backed services before using real participant information.

## Documentation

- [ ] After Tasks 03–05 are integrated, refresh `REPO_CONTEXT.md`, `docs/features.md`, `docs/service-map.md` and `paused.md` status statements; remove the pause banner only after the goal is actually resumed/completed.
- [ ] Add deployment runbook and E2E run instructions when a host and Playwright test are available.
