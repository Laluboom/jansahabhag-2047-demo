# Connected demo — sub-agy review, 12 October 2026

**Baseline:** `autobuild` at `411588b`. **Merge state:** none of the branches below has been merged into `autobuild`, pushed, or deployed. The owner controls merges under `AGENTS.md` and the Autobuild prompt.

## Reviewed isolated branches

| Work | Account / job | Branch head | Independent acceptance | Boundary |
|---|---|---|---|---|
| Phase 0 route and control inventory | `agy-rainy-2` / `j-20261012-130900-zy09` | `agy/j-20261012-130900-zy09` at `ba61280` | Plan checks passed; 47 baseline router path patterns matched 47 inventory rows; links and `git diff --check` passed. | A source-evidenced working inventory, not completed live Phase 0 certification. It is pinned to `411588b`. |
| Canonical five-stage method | `agy` / `j-20261012-153339-0zfe` | `agy/j-20261012-153339-0zfe` at `51dab67` | Fresh `npm run build` and `npm run test:run` passed (92 tests); `git diff --check` passed. | Updates the method strip and call sites only. |
| Canonical learner navigation and UHV stream | `agy-rainy` / `j-20261012-153847-t0do` | `agy/j-20261012-153847-t0do` at `bd88e23` | Fresh `npm run build`, `npm run test:run` (98 tests), and `npm run test:e2e` (11 browser tests) passed; `git diff --check` passed. Browser tests needed local server access outside the restricted sandbox. | Debate Room and Workspace remain labelled nonfunctional previews. UHV curriculum rights and shared sessions remain open. |

The navigation branch adds eight path patterns (`debate-room`, `debates`, `workspace`, `workspaces`, `uhv`, `uhv/learn`, `help`, `settings`), bringing its isolated router to 55 patterns. The Phase 0 inventory describes the 47-pattern baseline, so update or supplement it after merging the navigation branch. The three branches have not been tested together.

## Parked browser evidence branch

The `agy-rainy-2` browser-audit job `j-20261012-162134-6xv8` is parked at `agy/j-20261012-162134-6xv8` (`8752faa`) after its second and final repair round. Its result has `contract_ok: false`, and an independent link check found eight screenshot links in `docs/audits/PHASE0_BROWSER_EVIDENCE.md` that point to hyphenated names while the files use underscores. Do not merge or cite this report as accepted Phase 0 evidence. Its provisional measurements identify phone horizontal overflow on the Jaipur Assembly session (+113px) and Passport evidence (+77px), plus direct loading of admin screens under the simulated persona. Reproduce those findings before treating them as verified defects. The branch contains a reusable 47-route browser audit script, JSON and 16 screenshots, but the result contract and report links must be repaired in a new task; the Autobuild prompt caps repair at two rounds.

## Remaining material gaps

- The [connected demo plan](../plans/COMPETITION_DEMO_PRD_PLAN.md) packages 02–09 remain unbuilt. The existing browser-only persona switch and local storage cannot support shared sessions, server-enforced roles, or multi-user persistence.
- The owner selected fictional Jaipur data, a labelled single-browser demo, and `ceil(0.33 × applicable places)` arithmetic. The remaining decisions are the demo date and final acceptance, the exact working/prototype boundary, full-system backend/hosting, the meaning of “unified allocation,” unfilled places or exceptions, real-data privacy, and activity applicability. See [product decisions](../decisions.md). The 33% policy has only in-principle approval; no enforcement is implemented. The chosen demo mode cannot prove the Master PRD's shared-session or server-authorization requirements.
- Accepted Phase 0 live evidence covers only four deployed routes. The parked browser audit cannot close the remaining desktop and phone route checks. Data recovery, negative permission behavior, and accepted all-route screenshots remain unverified. The deployed site still serves the older build.
- The existing fictional UHV seed contains assignment `asg_uhv_08` with a ten-point `Depth of Self-Exploration` rubric and a seeded personal submission/reflection. The Master PRD opening §1 and Part A §A11 prohibit grading ideological agreement or treating personal reflection as objectively measurable. The navigation branch separates the stream but does not resolve this content and grading review; OD.13 source and rights also remain open.

## Owner merge and acceptance

The branches share baseline `411588b` and have disjoint intended scopes. Suggested merge order:

```bash
git merge --no-ff agy/j-20261012-130900-zy09
git merge --no-ff agy/j-20261012-153339-0zfe
git merge --no-ff agy/j-20261012-153847-t0do
npm run build
npm run test:run
npm run test:e2e
```

Run the suite in the combined checkout and inspect the mobile drawer and method strip together before pushing or deploying. The individual branch test results do not prove that combined state.
