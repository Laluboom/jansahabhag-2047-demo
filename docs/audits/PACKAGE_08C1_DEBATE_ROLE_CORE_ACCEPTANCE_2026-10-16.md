# Package 08C1: Debate Room named-role core acceptance

Date: 2026-10-16

The isolated branch `agy/j-20261016-062408-1n1j` at commit `486e886` adds repository and domain support for separate formal Debate Room role allocations. The seven seeded named roles include the Facilitator; each one-place role requires one reserved place under `ceil(0.33 × places)`. Existing seeded appointments are marked for review rather than presented as compliant. The open speaking queue remains open participation. The branch adds role plan, assignment, withdrawal, replacement, finalization, capacity and simulated owner exception APIs, with privacy projections and migration coverage.

The first sub-agy round saved code but returned an invalid contract. Its authorized automatic feedback round completed and committed the branch. Independent acceptance after that repair: production build passed; all 304 unit tests passed across 23 files, including 26 new Debate reservation tests; `git diff HEAD^..HEAD --check` passed; worktree was clean. The package deliberately does not yet add the Debate Room point-of-use UI or browser journey.

This is a fictional, labelled single-browser competition simulation. The branch has not been merged into root `autobuild`, pushed, or deployed.
