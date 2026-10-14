# Connected demo — sub-agy review, updated 14 October 2026

**Baseline:** `autobuild` at `411588b`. **Merge state:** none of the branches below has been merged into `autobuild`, pushed, or deployed. The owner controls merges under `AGENTS.md` and the Autobuild prompt.

## Reviewed isolated branches

| Work | Account / job | Branch head | Independent acceptance | Boundary |
|---|---|---|---|---|
| Phase 0 route and control inventory | `agy-rainy-2` / `j-20261012-130900-zy09` | `agy/j-20261012-130900-zy09` at `ba61280` | Plan checks passed; 47 baseline router path patterns matched 47 inventory rows; links and `git diff --check` passed. | A source-evidenced working inventory, not completed live Phase 0 certification. It is pinned to `411588b`. |
| Phase 0 browser rendering evidence | `agy-rainy-2` / `j-20261012-213548-ijnr` | `agy/j-20261012-213548-ijnr` at `e43ff02` | Result contract passed; report/JSON nonempty, all relative report links resolved, `git diff --check` passed. An independent fresh build and local Playwright rerun rendered 94/94 baseline route/viewport checks, reproducing two phone overflows. | Four deployed routes at two widths were checked by the agent, separate from local results; the orchestrator independently reran local checks only. This is visual route evidence, not completed interactive, recovery, or permission certification. The branch includes the earlier audit commits and is pinned to the 47-route baseline. |
| Canonical five-stage method | `agy` / `j-20261012-153339-0zfe` | `agy/j-20261012-153339-0zfe` at `51dab67` | Fresh `npm run build` and `npm run test:run` passed (92 tests); `git diff --check` passed. | Updates the method strip and call sites only. |
| Canonical learner navigation and UHV stream | `agy-rainy` / `j-20261012-153847-t0do` | `agy/j-20261012-153847-t0do` at `bd88e23` | Fresh `npm run build`, `npm run test:run` (98 tests), and `npm run test:e2e` (11 browser tests) passed; `git diff --check` passed. Browser tests needed local server access outside the restricted sandbox. | Debate Room and Workspace remain labelled nonfunctional previews. UHV curriculum rights and shared sessions remain open. |
| UHV reflection, credits and civic view boundary | `agy-rainy-2` / `j-20261013-234641-ynug`, then `j-20261014-100424-4y4v` | **Merge only** `agy/j-20261014-100424-4y4v` at `6fad8ab`; it contains the navigation branch and both UHV jobs. | Independent fresh `npm run build`, `npm run test:run` (116 tests), `npm run test:e2e` (11 browser tests), `git diff 04f92f7..HEAD --check`, and root escape check passed. | Private UHV reflection is separated from civic scoring, credits, Passport and civic views in the labelled single-browser simulation. This does not provide server privacy or approved UHV curriculum; OD.13 remains open. The first UHV job needed two repair rounds, including a direct-method guard; its final `04f92f7` is an ancestor of this branch. |
| Phone overflow repair | `agy-rainy` / `j-20261012-215520-ssz8` | `agy/j-20261012-215520-ssz8` at `41ea8f4` | Round two result contract passed. Independent fresh `npm run build`, `npm run test:run` (89 tests), `npm run test:e2e` (7 browser tests), `git diff --check` and interface detector passed. The browser regression checks both affected routes at 375px and 320px and clicks their stage/filter controls. | Fixes the two overflows measured by the baseline audit in isolated code only; the deployed build is unchanged. The first round ended without a valid result or commit, then was repaired. |

The final UHV branch contains the navigation branch's eight added path patterns (`debate-room`, `debates`, `workspace`, `workspaces`, `uhv`, `uhv/learn`, `help`, `settings`), bringing its isolated router to 55 patterns. The Phase 0 inventory and browser audit describe the 47-pattern baseline, so update or supplement both after merging the final UHV branch. That branch and the phone branch both edit `e2e/smoke-routes.spec.ts`; combined acceptance and possible conflict resolution remain the owner's merge work. These branches have not been tested together.

On 13 October, an untracked `docs-rescued/` folder in the real checkout triggered the Autobuild escape check. After the owner authorised inspection and resolution, its byte-identical copies of the Master PRD and reservation supplement were identified, its two unique JanSahabhag handoff DOCX files were added to [source references](../reference/README.md), and all six original files were preserved under local ignored `.subagy/quarantine/docs-rescued-2026-10-13/`. The two Markdown files in that folder belonged to an unrelated job-matching product and were not adopted as JanSahabhag instructions. The root checkout is clean again after local documentation commit `e805306`.

## Parked browser evidence branch

The original `agy-rainy-2` browser-audit job `j-20261012-162134-6xv8` is parked at `agy/j-20261012-162134-6xv8` (`8752faa`) after its second and final repair round. Its result had `contract_ok: false` and eight broken screenshot links. The new repair job above branched from it, repaired those links, passed its result contract, and reproduced the local phone overflow measurements independently. Merge only the final repair branch if accepting this evidence; it contains the original audit commits.

## Remaining material gaps

- The [connected demo plan](../plans/COMPETITION_DEMO_PRD_PLAN.md) packages 02–09 remain unbuilt. The existing browser-only persona switch and local storage cannot support shared sessions, server-enforced roles, or multi-user persistence.
- The owner selected fictional Jaipur data, a labelled single-browser demo, `ceil(0.33 × applicable allocated places)` per allocation, and leaving unmet reserved places unfilled. The remaining decisions are the demo date and final acceptance, the exact working/prototype boundary, full-system backend/hosting, whether documented exceptions are allowed, real-data privacy, and activity applicability. See [product decisions](../decisions.md). The 33% policy has only in-principle approval; no enforcement is implemented. The chosen demo mode cannot prove the Master PRD's shared-session or server-authorization requirements.
- The repaired browser audit covers 47 local baseline routes at two widths and four representative deployed routes at two widths. It documents visual rendering and two phone overflows in the earlier build. A separate unmerged branch fixes those local phone layouts; the deployed site still serves the older build. The audit does not verify interactions, data recovery, negative permission behavior, or the eight routes in the unmerged navigation branch.
- The root checkout and deployed site still contain the old scored UHV seed. The isolated final UHV branch removes that scoring and civic reward path, keeps owner-only reflections out of civic Passport and Assembly views, and repairs older browser data without clearing unrelated civic records. The branch is unmerged; OD.13 source, uploader and rights still need an owner decision.

## Owner merge and acceptance

The branches descend from the 47-route baseline; the repaired audit and phone branches include intermediate documentation ancestors. Suggested merge order:

```bash
git merge --no-ff agy/j-20261012-130900-zy09
git merge --no-ff agy/j-20261012-213548-ijnr
git merge --no-ff agy/j-20261012-153339-0zfe
git merge --no-ff agy/j-20261014-100424-4y4v
git merge --no-ff agy/j-20261012-215520-ssz8
npm run build
npm run test:run
npm run test:e2e
```

Run the suite in the combined checkout and inspect the mobile drawer and method strip together before pushing or deploying. The individual branch test results do not prove that combined state.
