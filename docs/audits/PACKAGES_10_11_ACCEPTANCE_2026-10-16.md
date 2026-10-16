# Packages 10–11 acceptance: Phase 0 and reservation coverage

Date: 16 October 2026

## Source and delivery boundary

The Master PRD archive is governing. The women's reservation supplement extends it with an in-principle owner decision and the recorded fictional-demo operating rules in `docs/decisions.md`. This acceptance concerns the labelled, single-browser, fictional Jaipur competition demo. It does not certify a multi-user service, real identity data, legal compliance, or the older public deployment.

## Accepted isolated sequence

| Package | Branch | Saved result | Independent evidence |
| --- | --- | --- | --- |
| 10A: route/control matrix | `agy/j-20261016-144649-wf8g` (`60be0d8`) | All 60 router path declarations classified; source, local and deployed evidence separated | 60 path declarations matched 60 matrix rows; clean diff check |
| 10B: local browser audit | `agy/j-20261016-151430-7j62` (`dbda23e`) | Desktop/mobile visits to 60 representative route URLs; 20 screenshots; representative control and persona tests | Independent build and full 33-case browser suite passed; audit wording corrected to distinguish route checks from sampled controls |
| 11: reservation checklist and Parliament preview | `agy/j-20261016-163611-vwcz` (`f28f779`) | Module/rulebook checklist; fictional three-place Jaipur delegation illustration using the shared validator; anonymous public seat cards | Independent build, 321 unit tests in 25 files, all 35 browser tests, and clean diff check |

The final Package 11 branch contains the earlier accepted app work. No ancestor branch needs a separate merge. Audit documents and 20 representative screenshots are copied into root `docs/audits/` for review; app changes remain on the isolated branch.

## What the evidence establishes

- `PHASE0_ROUTE_CONTROL_MATRIX_2026-10-16.md` matches every declared router pattern. It records Keep, Change, Build, Remove or Not Verified decisions and separates source inspection from browser and historical deployed observations.
- `PHASE0_BROWSER_ROUTE_EVIDENCE_2026-10-16.md` verifies render/redirect, persistent loading spinner absence and horizontal overflow for the 60 representative URLs at 1280×800 and 375×667. The test requires at least 55 visible control text targets per viewport but does not save the exact missing-target list; seven representative interaction flows are checked separately. This is not complete control certification.
- `RESERVATION_MODULE_RULEBOOK_COVERAGE_2026-10-16.md` maps current allocation surfaces and retained future selection surfaces to the rulebooks, shared validator, exceptions, privacy display and tests. The Parliament UI shows compliant, reserved-vacancy and blocked-overbooking examples for three fictional places under `ceil(0.33 × planned places)`. It labels the 540-member chamber metrics illustrative and does not appoint members.
- The public Parliament example uses anonymous seat cards. The validator uses explicit fictional declarations in the seed data, not names or portraits. Real small-cohort publication rules still need policy and implementation review before real data.

## Independent commands on the final isolated branch

```bash
npm run build
npm run test:run
npm run test:e2e
git diff HEAD~2..HEAD --check
```

All commands passed on 16 October 2026. The build retained a bundle-size advisory for the entry and analytics chunks; it did not fail. The root `autobuild` checkout remained clean during the sub-agy jobs.

## Remaining boundary

The public Vercel deployment and root app still represent the older frontend demo. The final branch has not been merged, pushed or deployed. After an owner-controlled merge, the complete suite must be rerun on the integrated checkout, followed by deployed-route inspection if published. Multi-user persistence, server authorization, real selection workflows, Hindi review, real-data privacy/safeguarding, and public-launch reviews remain outside this competition-demo acceptance.
