# Remaining work and handback

## Final integration

- [x] Merge and verify Tasks 01–04 in `autobuild`.
- [x] Build and independently verify Task 05 on `agy/j-20261009-154211-yd8l`: 89 unit/UI tests, six Chromium Playwright tests, and production build.
- [ ] Merge the verified Task 05 branch into `autobuild` if adopting the final result. Use the commands in [paused.md](paused.md), then rerun all three checks on the integration branch.

## Demo acceptance covered

- [x] Aarav learning, draft, mock evidence, exact teacher review, assembly contribution, proposition revision/finalisation, reflection, Passport history and ledger transactions.
- [x] README route smoke, seeded dynamic IDs, missing-record states, refresh persistence, persona switch, notification navigation, reset and mobile assembly/admin smoke.
- [x] Project milestone repeat-safe credit and Passport linkage; local programme/content/moderation transitions; clearly labelled previews.
- [x] Route code splitting reduced production chunks below Vite's 500 kB warning threshold.

## Future choices

- [ ] Choose a host, project and credentials if deployment is wanted. No deployment target is configured.
- [ ] Review dependency audit findings and choose supported updates deliberately; no force upgrade was applied.
- [ ] Clean the 219 ESLint warnings reported on the verified Task 05 branch; `npm run lint` exits successfully with no errors.
- [ ] Before use with real participants, replace demo persona switching with real authentication and server-enforced authorization, and replace local persistence and simulated verification, messaging, AI, sessions, moderation and analytics with backed services.
