# Package 07 isolated Passport and Credits acceptance — 15 October 2026

The accepted isolated branch is `agy/j-20261015-101359-krqe` at `5d9501c`, based on accepted Workspace branch `96dd713`. It includes the earlier navigation, UHV, Debate Room, assignment, Assembly and Workspace chain. The owner controls merging; the root code and deployed build have not changed.

The first two sub-agy rounds timed out without valid contracts. Independent review found compilation and test failures in round one, then a cross-persona Passport data leak and appeal target gaps after round two. The final round committed the repairs. Its job state is `error`, but `contract_ok` and its structured contract are true, the branch is clean, and the independent checks below passed. The terminal-state mismatch remains a sub-agy reporting issue, not proof of a product failure.

- `git status --short`: clean branch at `5d9501c`; `git diff --check` passed.
- `npm run build`: passed. The main bundle still triggers Vite's 500 kB warning.
- `npm run test:run`: 19 files, 204 tests passed. The package tests cover pending versus reviewed status, authorized correction and credit reversal, source links, UHV and private Debate journal exclusion, cross-persona denial, and missing/foreign appeal target denial.
- `npm run test:e2e`: 21/21 Chromium tests passed, including desktop and mobile source-link navigation and the assignment → Passport → Credits path.

The data is fictional and stored in one browser. A simulated reviewer action and audit trail are not independent verification or real staff authority. English is the working demo language; Hindi awaits bilingual review. The combined and deployed experience remains unverified. Continue with reservation coverage (08) and the full Jaipur story (09).
