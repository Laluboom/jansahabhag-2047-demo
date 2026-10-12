# Phase 0 live evidence — 12 October 2026

**Purpose:** record directly observed deployed behavior before planning the next connected competition demo. This is a partial live inspection, not the complete Phase 0 route audit required by the Master PRD opening §2 and [scope guide](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#2-scope-a--governance-verification-and-delivery-gates).

**Deployment inspected:** `https://jansahabhag2027.vercel.app`. The browser rendered the deployed JavaScript application; observations below are from its visible accessibility tree. Source locations are from the current `autobuild` checkout. No live form was submitted and no deployed records were changed.

| Route | Live observation | Initial disposition for next demo |
|---|---|---|
| `/dashboard` | Renders as fictional participant Aarav Sharma. Primary navigation has Home, Learn, Participate, Deliberate, Act, Passport; the canonical eleven learner items are absent. The evidence-to-action strip says Learn, Field Evidence, Youth Assembly, Civic Action, Passport rather than the Master PRD's canonical five-stage method. | **Change:** align labels, route order and method; retain the useful dashboard journey. |
| `/assemblies/assembly_jaipur_pedestrian_2026/session` | Renders nine chamber stages and assigns Aarav the `Questioner` role. Peer contributions are labelled scripted. | **Change:** six canonical stages, four role zones and powers, Chair-only procedure, dissent and outcome rules. |
| `/parliament` | Renders a National Youth Parliament preview with a simulated chamber. | **Keep as labelled prototype** for the competition demo; move its learner navigation entry into canonical position. Do not describe allocation or chamber rules as enforced. |
| `/admin/dashboard` | Direct navigation while the UI still identifies Aarav as the youth participant renders State Command. Its banner says `Simulated Session Role: Platform Admin (Aarav Sharma)`. | **Change:** this is a role simulation, not an authorization boundary. The connected demo's privileged actions need the agreed permission mechanism and at least one denied-access test. |

## Code inventory and missing routes

The [router](../../src/app/router.tsx) declares 47 path patterns including `/`, `/demo-login`, and `*`. The local [route smoke test](../../e2e/smoke-routes.spec.ts) lists 44 representative seeded routes and a few missing-record cases, but that test file alone is not evidence that all live interactions work. The current router has no learner Debate Room or Workspace route. UHV / Jeevan Vidya is not a separate last learner-navigation stream. These are **Build** items in the [reconciliation](MASTER_PRD_RECONCILIATION.md).

The browser demo uses [localStorage persistence](../../src/services/persistence.ts) and [demo persona selection](../../src/stores/authStore.ts). Neither creates shared, authenticated permissions. The current `autobuild` checkout ran 89 passing Vitest tests on 12 October 2026; the deployed pages were inspected separately. The tests include an assertion that the current Assembly has nine stages, so passing tests do not establish compliance with the Master PRD's six-stage rule.

## Remaining Phase 0 evidence

- Inspect each route and its important controls at desktop and mobile sizes; classify Keep, Change, Build, Remove or Not Verified with evidence and screenshots where available.
- Test the connected journey on the deployed site, including persistence across users/devices, role boundaries, moderation, missing records and recovery. Mark browser-only simulation explicitly wherever server behavior is unavailable.
- Record current deployment configuration, integrations and data flows; then freeze the owner-approved demo date, scope and acceptance story from [product decisions](../decisions.md).
