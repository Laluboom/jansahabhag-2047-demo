# Dependency review — 23 October 2026

The competition demo is a client-rendered React/Vite app. The dependency lockfile was checked with `npm audit --json` and `npm audit --omit=dev --json` after a fresh `npm ci`.

| Scope | Before | After React Router upgrade | Decision |
| --- | ---: | ---: | --- |
| Shipped dependencies | 2 moderate | 0 | Upgraded `react-router-dom` and its `react-router` dependency from 6.30.6 to 7.18.4. |
| Full tree, including build and test tools | 15 advisories | 13 advisories: 5 moderate, 6 high, 2 critical | Remaining advisories are in development tooling; keep the tooling local and do a separate tested major-version migration. |

The React Router change passed 532 unit/UI tests, a production build, and all 38 browser checks in its isolated worktree. The final combined checkout, including the interface quality branch, passed 533 unit/UI tests, a production build, and all 38 browser checks on 24 October 2026. The two original advisories concerned an open redirect and server-rendering hydration; the second feature is not used by this client-rendered demo. The version upgrade removes both from the shipped dependency audit.

Remaining advisories trace to Tailwind CSS 3, Vite 5, Vitest 2, and their transitive packages (`braces`, `chokidar`, `micromatch`, `postcss-selector-parser`, `esbuild`, `tinypool`, and related tools). The audit suggests major upgrades for the parent packages. Those migrations can change styling, build output, and test behavior, so they were not forced into the competition demo pass. Do not expose the development or Vitest UI servers to untrusted networks. Reassess the toolchain before production engineering or shared development hosting.

This review does not establish server security: the demo still has no backend, server-side permission enforcement, or shared participant data.
