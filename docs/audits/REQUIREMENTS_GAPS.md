# JanSahabhag 2047 — Requirements Missing from the Demo

- **Audit date:** 12 October 2026
- **Comparison source:** [Rules & Requirements by Scope](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md)
- **App baseline:** `autobuild` commit `41a7b89` and the live [Vercel demo](https://jansahabhag2027.vercel.app)
- **Method:** Three independent sub-agy agents used the three configured accounts to review separate scopes. Their reports were checked against source, tests, and the live dashboard, then corrected before consolidation.

This document lists requirements in the supplied scope file that are **missing, partial, simulated, contradicted, or not verified** in the current app. It includes P0/P1 demo and release gates, P2 previews, P3 production foundations, P4 later-phase scope, and owner decisions. A P3 or P4 item is a retained gap, not automatically a defect in the agreed browser-only demo. The Master PRD and other referenced source documents were not separately provided for this audit; source precedence is reported as stated in the supplied file.

The deployed app is a client-rendered React/Vite demo with local browser persistence. Its public URL is reachable, but this audit does not certify the public-launch reviews named in Scope P. The live dashboard and navigation were inspected; the detailed findings rely mainly on code and test evidence, and untested live behavior is labelled as such.

## Highest-priority differences

- The required learner navigation and five-stage product loop differ from the six-area demo navigation; Debate Room, Workspace, and a distinct UHV entry are absent.
- The connected journey stores data locally, but its permission model is a persona switcher and UI checks; the server/API authorization required by the scope file is absent.
- Youth Assembly uses different roles and stages from the canonical four-role, six-stage model; a shared session engine and versioned rulebooks are absent.
- Civic Passport and Credits can mark client actions as verified without an independent review step or prominent demo-credit labelling.
- The public-launch review areas, safeguarding controls, bilingual content, and accessibility evidence remain unresolved or unverified.

---
## Summary of README Conflicts and Owner Decisions (OD)

| ID | Subject | Priority | Canonical Source Requirement | Existing README / Code State | Conflict / Decision Rationale |
|---|---|---|---|---|---|
| **OD-01** | Product Branding vs. Deployment URL | **OD** | Master PRD §1; Scope A ([L73](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L73)): Platform name is **JanSahabhag 2047**. Name discrepancy must be an explicit Owner Decision; do not silently rename. | [README.md](../../README.md#L1) headers claim `JanSahabhag 2047`, but live URL is `https://jansahabhag2027.vercel.app`, repo root is `jansahabhag_2027`, and [package.json](../../package.json#L2) uses `jansahabhag-2047-demo`. | **Unresolved Owner Decision.** No decision log records whether `2027` is a temporary deployment URL or if a `2047` domain will replace it. |
| **OD-02** | Founder Details Public Approval | **OD** | Master PRD §A5; Scope E ([L257](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L257)): Founder public profile requires formal confirmation of which details are approved for publication. | [src/features/welcome/WelcomePage.tsx](../../src/features/welcome/WelcomePage.tsx) contains no founder section. Zero founder entities exist in [src/types/domain.ts](../../src/types/domain.ts). | **Decision Needed.** Draft handoff copy cannot be published until the platform owner confirms approved biographical facts and contact methods. |
| **OD-03** | UHV Curriculum Source & Licensing | **OD** | Master PRD §A11; Scope F ([L298](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L298)): Confirm content source, curriculum, and licensing with owner before production publication. | [src/data/seed/courses.ts](../../src/data/seed/courses.ts#L133) hardcodes Jeevan Vidya concepts into `course_uhv_leadership_05` without attribution or licensing metadata. | **Decision Needed.** Owner confirmation is required before treating curriculum content as approved for production. |
| **CF-01** | Canonical Learner Navigation Structure | **P0** | Master PRD §1; Scope B ([L101](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L101)): Strict 11-item ordered learner navigation: Home, Learn, Activities & Assignments, Debate Room, Youth Assembly, Youth Parliament, Workspace, Labs & Projects, Community, Civic Passport, UHV / Jeevan Vidya. | [README.md](../../README.md#L110) and [src/components/layout/DesktopSidebar.tsx](../../src/components/layout/DesktopSidebar.tsx#L29) collapse learner nav into 6 items (`Home, Learn, Participate, Deliberate, Act, Passport`), demoting Assignments, Community, and Labs to auxiliary lists. | **Direct Contradiction.** README changed the canonical navigation structure defined by the Master PRD. |
| **CF-02** | Complete Omission of Debate Room | **P0 / P1** | Master PRD §A4, §A8; Scope B ([L106](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L106)), Scope H ([L348](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L348)): Debate Room is learner navigation item 4 and a core P1/P3 structured motion feature. | [README.md](../../README.md) omits Debate Room entirely from scope, routes, and vision modules. Code contains zero debate routes or engines. | **Direct Contradiction.** README completely dropped a core deliberative format mandated by the Master PRD. |
| **CF-03** | Product Methodology & Product Loop | **P0** | Master PRD §1; Scope B ([L89](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L89)): Product loop is strictly `LEARN → OBSERVE → DELIBERATE → PROPOSE → REFLECT`. | [README.md](../../README.md#L19) defines a 9-step sequence. [src/components/layout/ThreadMotif.tsx](../../src/components/layout/ThreadMotif.tsx#L12) defines stages as `Learn -> Field Evidence -> Youth Assembly -> Civic Action -> Passport`. | **Direct Contradiction.** Replaces the formal `OBSERVE` and `PROPOSE` steps with "Field Evidence" and "Civic Action". |
| **CF-04** | Studio Permission Gating | **P0** | Master PRD §A4; Scope B ([L128](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L128)): Studio must be permission-gated (accessible only to authorized roles). | [README.md](../../README.md#L78) lists Studio as a generic preview module; [src/components/layout/DesktopSidebar.tsx](../../src/components/layout/DesktopSidebar.tsx#L70) exposes `/studio` to unauthenticated/participant personas. | **Direct Contradiction.** Exposes an administrative creator surface to general participants without role checks. |

---

## Scope A — Governance, Verification, and Delivery Gates

### Finding A.1: Incomplete Phase 0 Route Inventory and Decision Log
- **Requirement:** Phase 0 delivery gate requires an explicit route-level inventory (classifying every route as Keep, Change, Build, Remove, Not Verified), an evidence-backed gap list, and a formal decision log before building or releasing ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L52](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L52)).
- **Priority:** P0
- **Status:** Partial — this document supplies the gap list; a complete route inventory and decision log remain missing.
- **Evidence:**
  - [docs/](../../docs/) contains architecture and feature summaries ([features.md](../features.md), [architecture.md](../architecture.md)), but lacks a route-level inventory tracking component mappings and Keep/Change/Build classifications.
  - Searching the repo for a decision log (`rg -i "decision log" .`) returns only requirement declarations in [README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L24](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L24). No decision log file exists.
- **Why it matters (Demo vs. Production):**
  - *Demo:* Evaluators still lack a route-by-route record of which screens are functional, simulated, or unverified.
  - *Production:* Delivery gates prevent unreviewed UI placeholders from being promoted to release.
- **Next Action:** Create `docs/audits/route-inventory.md` and establish `docs/decisions.md` to track owner decisions.

### Finding A.2: Product Name "2047" vs Deployed URL / Repository Directory "2027" Discrepancy
- **Requirement:** Resolve the `2047` product name vs `2027` deployment URL as an owner decision; do not silently rename it ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L73](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L73)).
- **Priority:** OD
- **Status:** Decision Needed
- **Evidence:**
  - UI header ([src/components/layout/DesktopSidebar.tsx#L83](../../src/components/layout/DesktopSidebar.tsx#L83)) and [package.json#L2](../../package.json#L2) declare "JanSahabhag 2047".
  - Repository directory name is `jansahabhag_2027`, and the live deployment URL in [README.md#L5](../../README.md#L5) is `https://jansahabhag2027.vercel.app`.
  - No decision log entry explains or resolves this difference.
- **Why it matters (Demo vs. Production):**
  - *Demo:* Causes branding confusion during reviews.
  - *Production:* Domain branding, TLS certificates, and DNS records must match official product names.
- **Next Action:** Submit an Owner Decision request to record whether `2027` is retained as an interim staging URL or replaced with `2047`.

### Finding A.3: Live Deployed Behavior at https://jansahabhag2027.vercel.app is Unverified
- **Requirement:** Inspect the running site and available repository before treating a missing/changed feature as fact; label untested live behavior as not verified ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L52](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L52)).
- **Priority:** P0
- **Status:** Not Verified
- **Evidence:**
  - An HTTP HEAD check confirmed `https://jansahabhag2027.vercel.app` returns `HTTP/2 200` with Vercel edge headers.
  - However, automated test suites in [tests/](../../tests/) and Playwright specs in [e2e/smoke-routes.spec.ts](../../e2e/smoke-routes.spec.ts) target local Vite instances (`http://localhost:5173` per [playwright.config.ts#L15](../../playwright.config.ts#L15)).
  - Live client bundle routing, deep-link handling via [vercel.json](../../vercel.json), and CDN asset freshness have not been tested on the live domain.
- **Why it matters (Demo vs. Production):**
  - *Demo:* External stakeholders accessing the live Vercel link may encounter edge caching issues or 404 routing errors on direct URL entry.
  - *Production:* Verification on live environments is required before clearing release gates.
- **Next Action:** Document the live site status as "Verified via HTTP HEAD; interactive user flows unverified on live domain".

### Finding A.4: Regional Language Content Audit Absent and Selector Unwired
- **Requirement:** Preserve valid existing regional/language content until reviewed; do not treat visual placeholders as functioning implementations ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L71](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L71)).
- **Priority:** P0
- **Status:** Simulated
- **Evidence:**
  - [src/components/layout/TopUtilityBar.tsx#L136](../../src/components/layout/TopUtilityBar.tsx#L136) allows users to select English, Hindi (Demo), or Rajasthani (Demo).
  - Selecting a language calls `setLanguage(lang)` in [src/stores/authStore.ts#L51](../../src/stores/authStore.ts#L51), which updates `activeLanguage`.
  - An audit of the codebase (`rg "activeLanguage" src/`) shows `activeLanguage` is referenced only inside `TopUtilityBar.tsx` (lines 121, 145) to update the dropdown trigger label.
  - No localized strings or regional translation tables exist in the app; selecting Hindi or Rajasthani leaves all page text in English.
- **Why it matters (Demo vs. Production):**
  - *Demo:* Suggests multilingual capability while remaining entirely English.
  - *Production:* Regional content must be preserved and rendered through functional localization.
- **Next Action:** Add a clear indicator that language switching is not yet wired, or connect the dropdown to regional content strings.

---

## Scope B — Product Identity, Positioning, and Canonical Navigation

### Finding B.1: Divergence from Canonical 5-Stage Product Loop
- **Requirement:** Canonical product loop is strictly `LEARN → OBSERVE → DELIBERATE → PROPOSE → REFLECT` ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L89](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L89)).
- **Priority:** P0
- **Status:** Contradicted / Partial
- **Evidence:**
  - [src/components/layout/ThreadMotif.tsx#L12](../../src/components/layout/ThreadMotif.tsx#L12) encodes the journey as: `1. Learn -> 2. Field Evidence -> 3. Youth Assembly -> 4. Civic Action -> 5. Passport`.
  - [src/components/layout/DesktopSidebar.tsx#L29](../../src/components/layout/DesktopSidebar.tsx#L29) defines participant nav as: `Home -> Learn -> Participate -> Deliberate -> Act -> Passport`.
  - [README.md#L19](../../README.md#L19) states a 9-step variant.
  - The formal `OBSERVE` and `PROPOSE` methodology milestones are replaced with "Field Evidence" and "Act".
- **Why it matters (Demo vs. Production):**
  - *Demo:* Misrepresents the core democratic methodology that distinguishes JanSahabhag from a general volunteer task tracker.
  - *Production:* Platform data models and telemetry depend on alignment with the 5 loop states.
- **Next Action:** Update `ThreadMotif.tsx`, sidebar labels, and onboarding copy to reflect `LEARN → OBSERVE → DELIBERATE → PROPOSE → REFLECT`.

### Finding B.2: Complete Absence of Canonical Learner Navigation Item 4: Debate Room
- **Requirement:** Canonical learner navigation item 4 must be Debate Room ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L106](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L106)).
- **Priority:** P0
- **Status:** Missing
- **Evidence:**
  - [src/app/router.tsx#L73](../../src/app/router.tsx#L73) contains zero routes matching `/debate` or `/debates`.
  - [src/components/layout/DesktopSidebar.tsx#L29](../../src/components/layout/DesktopSidebar.tsx#L29) and [MobileBottomNav.tsx](../../src/components/layout/MobileBottomNav.tsx) omit Debate Room entirely.
  - The word "debate" appears in the codebase only as text contrasting debate with deliberation ([src/data/seed/courses.ts#L370](../../src/data/seed/courses.ts#L370), [src/features/assemblies/AssemblySessionPage.tsx#L547](../../src/features/assemblies/AssemblySessionPage.tsx#L547)).
- **Why it matters (Demo vs. Production):**
  - *Demo:* A major deliberative format mandated in PRD Scope B and Scope H is entirely inaccessible.
  - *Production:* Omits a core architectural pillar of the civic dialogue ecosystem.
- **Next Action:** Add `/debates` to `router.tsx` and place Debate Room in slot 4 of learner navigation.

### Finding B.3: Missing Canonical Learner Navigation Item 7: Workspace
- **Requirement:** Canonical learner navigation item 7 must be Workspace ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L109](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L109)).
- **Priority:** P0
- **Status:** Missing
- **Evidence:**
  - [src/app/router.tsx](../../src/app/router.tsx) contains no learner `/workspace` route.
  - [src/components/layout/DesktopSidebar.tsx](../../src/components/layout/DesktopSidebar.tsx) has only an administrative section labeled "Admin Workspace" ([L154](../../src/components/layout/DesktopSidebar.tsx#L154)); there is no workspace for student participants.
- **Why it matters (Demo vs. Production):**
  - *Demo:* Students have no unified staging area to view their drafts, active briefs, and team workspaces.
  - *Production:* Core collaborative authoring requirement is missing.
- **Next Action:** Add a dedicated `/workspace` route and place it at index 7 in the learner sidebar navigation.

### Finding B.4: Misplaced & Split Navigation: Activities & Assignments vs. Participate
- **Requirement:** Canonical navigation item 3 must be "Activities & Assignments"; item 8 must be "Labs & Projects" ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L105](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L105), [L110](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L110)).
- **Priority:** P0
- **Status:** Contradicted
- **Evidence:**
  - In [src/components/layout/DesktopSidebar.tsx#L32](../../src/components/layout/DesktopSidebar.tsx#L32), navigation item 3 is called "Participate" (`/participate` pointing to `ActivitiesPage.tsx`), Assignments is split into an auxiliary "Engagement & Tools" section (`/assignments` at line 39), and Projects is isolated as "Act" (`/projects` at line 34), while Labs are pushed to an unnumbered "Previews & Labs" grid.
- **Why it matters (Demo vs. Production):**
  - *Demo:* Disorients users by decoupling curriculum activities from required assignment submissions.
  - *Production:* Violates PRD information architecture standards.
- **Next Action:** Consolidate navigation so that item 3 links to Activities & Assignments and item 8 groups Labs & Projects.

### Finding B.5: Demotion of Youth Parliament from Canonical Item 6 to Unnumbered Preview Link
- **Requirement:** Canonical learner navigation item 6 is Youth Parliament ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L108](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L108)).
- **Priority:** P0
- **Status:** Contradicted / Partial
- **Evidence:**
  - [src/components/layout/DesktopSidebar.tsx#L64](../../src/components/layout/DesktopSidebar.tsx#L64) relegates Youth Parliament (`/parliament`) to an auxiliary 2-column preview grid marked with a generic "Demo Preview" badge, rather than placing it in the primary learner navigation list.
- **Why it matters (Demo vs. Production):**
  - *Demo:* Treats parliamentary simulation as an optional side project rather than a primary civic simulation pillar.
  - *Production:* Disrupts learner progression through municipal, assembly, and parliamentary chambers.
- **Next Action:** Move Youth Parliament into position 6 of the primary learner navigation menu.

### Finding B.6: Omission of UHV / Jeevan Vidya as Canonical Learner Navigation Item 11
- **Requirement:** Item 11 in learner navigation must be UHV / Jeevan Vidya as the final learner-facing entry ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L113](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L113)).
- **Priority:** P0
- **Status:** Missing
- **Evidence:**
  - [src/components/layout/DesktopSidebar.tsx](../../src/components/layout/DesktopSidebar.tsx), [MobileBottomNav.tsx](../../src/components/layout/MobileBottomNav.tsx), and [router.tsx](../../src/app/router.tsx) have no top-level navigation entry for UHV.
  - UHV is placed as a course filter tab (`track === 'uhv'`) inside [src/features/learning/CoursesPage.tsx#L44](../../src/features/learning/CoursesPage.tsx#L44).
- **Why it matters (Demo vs. Production):**
  - *Demo:* Fails to showcase the human values foundation that underpins the curriculum.
  - *Production:* Directly violates Master PRD §1 specifications for learner navigation.
- **Next Action:** Add a top-level `/uhv` route and position UHV / Jeevan Vidya as item 11 in learner navigation.

### Finding B.7: Missing Utilities: Help / Rulebooks and Standalone Settings
- **Requirement:** Platform utilities must provide Profile, Notifications, Settings, Help / Rulebooks, and Language selector ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L117](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L117)).
- **Priority:** P0
- **Status:** Missing / Partial
- **Evidence:**
  - No Help / Rulebooks route or modal exists in [src/app/router.tsx](../../src/app/router.tsx) or [src/components/layout/TopUtilityBar.tsx](../../src/components/layout/TopUtilityBar.tsx).
  - Settings does not exist as an independent utility; it is grouped into [src/features/profile/ProfilePage.tsx](../../src/features/profile/ProfilePage.tsx) (`DesktopSidebar.tsx#L43: 'Profile & Settings'`).
- **Why it matters (Demo vs. Production):**
  - *Demo:* Assembly participants cannot consult chamber rules or speaking time limits during deliberation.
  - *Production:* Usability and procedural fairness require accessible rulebooks and dedicated user settings.
- **Next Action:** Create a dedicated `/rulebooks` utility page and separate user preferences into a standalone Settings route.

### Finding B.8: Permission Consoles Ungated: Studio and Admin Routes Exposed
- **Requirement:** Permission-gated consoles: Institution, Moderator Console, Platform Owner Console, Studio, Analytics, Audit Logs ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L123](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L123)).
- **Priority:** P0
- **Status:** Contradicted / Simulated
- **Evidence:**
  - In [src/app/router.tsx#L398](../../src/app/router.tsx#L398), `/studio`, `/analytics`, `/admin/*`, and `/institution/*` are configured without authentication guards or role-checking wrappers.
  - In [src/components/layout/DesktopSidebar.tsx#L70](../../src/components/layout/DesktopSidebar.tsx#L70), `Studio` is linked in the public "Previews & Labs" grid accessible to participant personas.
  - `Platform Owner Console` and `Audit Logs` do not exist as distinct routes in `router.tsx`.
- **Why it matters (Demo vs. Production):**
  - *Demo:* Relying solely on sidebar link visibility gives a false impression of security; direct URL entry bypasses all role restrictions.
  - *Production:* Unprotected administrative surfaces allow unauthorized data changes.
- **Next Action:** Implement a `ProtectedRoute` wrapper in `router.tsx` checking `currentUser.role` before rendering admin/institution routes, remove `/studio` from participant views, and scaffold the Audit Logs console.

---

## Scope C — Smallest Meaningful Connected Demo

### Finding C.1: Authorization is Purely Simulated and Enforced Only by Hiding UI
- **Requirement:** Authorization must be enforced server-side / API-side, not only by hiding UI ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L163](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L163)).
- **Priority:** P1
- **Status:** Simulated
- **Evidence:**
  - All routes in [src/app/router.tsx](../../src/app/router.tsx) load unconditionally.
  - Methods in [src/services/demoRepository.ts](../../src/services/demoRepository.ts) (such as `reviewSubmission` at line 709, `finaliseProposition` at line 1193, `updateModerationCase` at line 2013) do not perform any user role or permission checks before modifying `localStorage`.
  - [src/components/layout/DesktopSidebar.tsx#L47](../../src/components/layout/DesktopSidebar.tsx#L47) restricts admin access solely by omitting links from the navigation list.
- **Why it matters (Demo vs. Production):**
  - *Demo:* Works for scripted walkthroughs, but fails the PRD P1 acceptance definition for "interconnected".
  - *Production:* Production backends must reject unauthenticated or unauthorized requests with 401/403 status codes.
- **Next Action:** Add role-based access validation inside `demoRepository.ts` methods that reject unauthorized actions with clear errors, and protect routes via React Router navigation guards.

### Finding C.2: Zero Unauthorized-Access Test Cases in Test Suite
- **Requirement:** At least one unauthorized-access case must be tested ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L164](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L164)).
- **Priority:** P1
- **Status:** Missing
- **Evidence:**
  - All 89 Vitest tests across 11 test files pass.
  - Searching for unauthorized access tests (`rg -i "unauthorized|forbidden|access denied|403" tests/`) yields zero results.
  - No test suite attempts to execute an admin action (e.g. verifying an assignment, changing a moderation status) as a participant persona to verify rejection.
- **Why it matters (Demo vs. Production):**
  - *Demo:* Direct violation of the P1 acceptance criteria defined in Scope C.
  - *Production:* Security regressions cannot be caught without automated negative test cases.
- **Next Action:** Add a test suite in `tests/supporting-modules-admin.test.tsx` verifying that participant personas are blocked from executing teacher/admin repository operations.

### Finding C.3: Disclosed vs. Undisclosed Prototype Boundaries in Vision Previews
- **Requirement:** Prototype behavior must be visibly labeled as prototype/demo and must not imply real external processing ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L177](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L177)).
- **Priority:** P2
- **Status:** Partial
- **Evidence:**
  - While [src/components/ui/DemoPreviewBadge.tsx](../../src/components/ui/DemoPreviewBadge.tsx) is rendered on several preview headers (e.g. [src/features/previews/ParliamentPage.tsx#L81](../../src/features/previews/ParliamentPage.tsx#L81)), other features simulate external operations without disclosure.
  - [src/features/previews/IdeaLabPage.tsx](../../src/features/previews/IdeaLabPage.tsx) simulates AI idea clustering and policy synthesis without explicit notices that no LLM inference is executing.
  - [src/features/issues/CivicIssuesPage.tsx#L116](../../src/features/issues/CivicIssuesPage.tsx#L116) displays mock municipal dispatch queues that appear functional.
- **Why it matters (Demo vs. Production):**
  - *Demo:* Stakeholders may mistakenly believe AI or municipal integrations are already active.
  - *Production:* Clarifies integration seams for future engineering phases.
- **Next Action:** Standardize all preview pages with an unambiguous banner: "Simulated Demo Preview: No external API or AI service is connected."

---

## Scope D — Identity, Safeguarding, Roles, and Permissions

### Finding D.1: Missing Scoped RBAC + ABAC Security and Authority Model
- **Requirement:** Scoped RBAC + ABAC considering 14 dimensions: resource, action, institution, programme, event, room, content, participant category, age/safeguarding state, ownership, visibility, grant expiry, grantor, reason. Default to least privilege ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L190](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L190)).
- **Priority:** P0
- **Status:** Missing
- **Evidence:**
  - [src/types/domain.ts#L1](../../src/types/domain.ts#L1) defines only a flat role union: `UserRole = 'participant' | 'teacher' | 'facilitator' | 'institution_admin' | 'programme_manager' | 'platform_admin'`.
  - No attribute-based context interface (`AbacContext`), grant expiration, grantor tracking, or dynamic permission evaluator exists in the codebase.
- **Why it matters (Demo vs. Production):**
  - *Demo:* Cannot model scoped permissions (e.g. an institution admin restricted to Navchetna Public School).
  - *Production:* Flat roles result in data leakage between independent schools and programmes.
- **Next Action:** Define an `AbacContext` interface in `src/types/domain.ts` and build an evaluation service checking role, institution scope, and resource ownership.

### Finding D.2: Moderators Lack Scoped Boundaries and Can Access Global Records
- **Requirement:** Moderators cannot self-grant permissions and do not gain global access by default ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L207](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L207)).
- **Priority:** P0
- **Status:** Contradicted / Simulated
- **Evidence:**
  - In [src/features/moderation/AdminModerationPage.tsx#L32](../../src/features/moderation/AdminModerationPage.tsx#L32), `demoRepository.getModerationCases()` returns every moderation case in the system.
  - There is no filtering by assigned programme, region, or institution; any moderator has global view and dismissal permissions across all schools.
- **Why it matters (Demo vs. Production):**
  - *Demo:* Fails to reflect realistic decentralized moderation workflows.
  - *Production:* Violates jurisdictional boundaries and exposes student reports to unauthorized personnel.
- **Next Action:** Scope moderation queues by `institutionId` and `programmeId` in `demoRepository.ts`.

### Finding D.3: Lack of Security Audit Logging for Privileged Actions
- **Requirement:** Privileged actions must be auditable ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L209](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L209)).
- **Priority:** P0
- **Status:** Missing
- **Evidence:**
  - When reviewing submissions ([src/services/demoRepository.ts#L709](../../src/services/demoRepository.ts#L709)), dismissing moderation cases ([L2013](../../src/services/demoRepository.ts#L2013)), or updating programme data ([L279](../../src/services/demoRepository.ts#L279)), no audit log record is created.
  - The domain database snapshot in [src/types/domain.ts#L622](../../src/types/domain.ts#L622) has no `auditLogs` table.
- **Why it matters (Demo vs. Production):**
  - *Demo:* Reviewers cannot verify how or by whom administrative decisions were made.
  - *Production:* Unaudited administrative actions prevent tracing unauthorized modifications.
- **Next Action:** Add an `AuditLogEntry` entity to `src/types/domain.ts` and write audit records on all administrative state mutations.

### Finding D.4: Absence of Safeguarding Rules for Adult–Minor Communication
- **Requirement:** Adult–minor communication must be context-bound, permission-controlled, reportable, and auditable. Safeguarding administrators may apply restrictions; interventions must be logged ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L210](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L210)).
- **Priority:** P0
- **Status:** Missing
- **Evidence:**
  - In [src/features/community/CommunityGroupDetailPage.tsx#L162](../../src/features/community/CommunityGroupDetailPage.tsx#L162), comments and posts between adult personas (`teacher`, `programme_manager`) and minor students (Aarav, age 17 per [src/data/seed/users.ts#L23](../../src/data/seed/users.ts#L23)) are open, unmoderated text streams.
  - No adult-minor communication flags, mandatory institution CCs, or safeguarding intervention tools exist in the codebase.
- **Why it matters (Demo vs. Production):**
  - *Demo:* Omits key civic safeguarding protections required for youth participants.
  - *Production:* Direct, unmonitored communication between adults and minors poses safeguarding risks on youth platforms.
- **Next Action:** Implement a safeguarding filter and context-bound messaging policy that restricts adult-student interactions to supervised classroom channels.

### Finding D.5: Complete Absence of Platform Owner Governance Controls
- **Requirement:** Owner-governed controls for platform branding, moderator appointments, permission templates, institution/programme policies, feature flags, AI provider config, safeguarding policies, retention, and emergency restrictions ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L217](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L217)).
- **Priority:** P0
- **Status:** Missing
- **Evidence:**
  - None of these 11 owner controls exist in [src/features/administration/](../../src/features/administration/) or [src/app/router.tsx](../../src/app/router.tsx).
  - Emergency restrictions, feature flags, and retention rules have zero representation in code, schema, or UI.
- **Why it matters (Demo vs. Production):**
  - *Demo:* Platform owner governance is invisible during administrative walkthroughs.
  - *Production:* The platform owner has no administrative mechanism to halt operations or enforce platform policies without deploying code.
- **Next Action:** Create an `OwnerConsolePage` component with configuration interfaces for feature flags, emergency restrictions, and moderator appointments.

---

## Scope E — Founder / Public Identity

### Finding E.1: Founder Public Identity Profile and Content Management Object are Completely Missing
- **Requirement:** Founder/public identity is managed content (separate from private account profile) with owner controls to edit, preview, publish, unpublish, revise/revert, and inspect audit history ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L242](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L242)).
- **Priority:** P0
- **Status:** Missing
- **Evidence:**
  - A search for `founder` across the codebase (`rg -i "founder" src/`) returns zero matches.
  - [src/types/domain.ts](../../src/types/domain.ts) contains no `FounderProfile` schema.
  - [src/app/router.tsx](../../src/app/router.tsx) contains no public `/about` or `/founder` route.
- **Why it matters (Demo vs. Production):**
  - *Demo:* The platform's origin story, mission, and founder identity cannot be reviewed.
  - *Production:* Public identity management must be governed to prevent unauthorized biographical claims.
- **Next Action:** Scaffold a `FounderProfile` data model and an administrative publication lifecycle screen with edit/preview/publish controls.

### Finding E.2: Private Metadata Protection and Contact Form Default Unimplemented
- **Requirement:** Never expose private authentication/account metadata; public email requires explicit opt-in; contact form is safer default ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L251](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L251)).
- **Priority:** P0
- **Status:** Missing
- **Evidence:**
  - No public contact form exists in [src/features/welcome/WelcomePage.tsx](../../src/features/welcome/WelcomePage.tsx) or any public view.
  - No schema field exists to model email publication opt-in.
- **Why it matters (Demo vs. Production):**
  - *Demo:* Leaves public communication channels unrepresented.
  - *Production:* Direct publication of private emails leads to spam harvesting and privacy exposure.
- **Next Action:** Implement a secure public inquiry contact form as the default communication channel on public pages.

### Finding E.3: Safe Portrait / Media Upload Pipeline Missing
- **Requirement:** Uploaded portrait/media requires file-type validation, size limits, malware scanning, safe storage, image optimization, and alt text ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L254](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L254)).
- **Priority:** P0
- **Status:** Missing
- **Evidence:**
  - No media upload pipeline exists in the repository. All avatars and banners in seed data are external static Unsplash URLs ([src/data/seed/users.ts#L8](../../src/data/seed/users.ts#L8)).
  - [src/features/profile/ProfilePage.tsx](../../src/features/profile/ProfilePage.tsx) has no media upload control.
- **Why it matters (Demo vs. Production):**
  - *Demo:* Uses external CDN images, avoiding upload complexity.
  - *Production:* Unvalidated user file uploads represent a severe vulnerability.
- **Next Action:** Define an upload contract with MIME type and file-size validation interfaces.

### Finding E.4: Unapproved Founder Details Left as Unresolved Owner Decision (OD)
- **Requirement:** Do not publish unapproved founder fields; keep publication controlled; do not treat presence in draft handoff as automatic public approval ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L257](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L257)).
- **Priority:** OD
- **Status:** Decision Needed
- **Evidence:**
  - The repository contains no record of approved founder biographical text or credentials.
  - No founder copy has been vetted or checked in under `docs/decisions.md`.
- **Why it matters (Demo vs. Production):**
  - *Demo:* Prevents premature publication of unconfirmed personal information.
  - *Production:* Guarantees that public institutional claims have formal owner authorization.
- **Next Action:** Obtain formal sign-off from the platform owner on public founder text before implementing the `/about` view.

---

## Scope F — Learning, Assignments, and UHV

### Finding F.1: Assignment Form Autosave is Absent
- **Requirement:** General civic assignments must support autosave alongside manual save/resume ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L281](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L281)).
- **Priority:** P1
- **Status:** Missing
- **Evidence:**
  - In [src/features/assignments/SubmitAssignmentPage.tsx#L126](../../src/features/assignments/SubmitAssignmentPage.tsx#L126), saving a draft occurs only when the participant clicks the "Save Draft" button (`handleSaveDraft`).
  - There is no background timer, `useEffect` interval, or debounced form watcher saving to `demoRepository`.
  - An exhaustive search for `autosave` across `src/` (`rg -i "autosave" src/`) returns zero matches.
- **Why it matters (Demo vs. Production):**
  - *Demo:* If a user accidentally refreshes while writing observations, all uncommitted draft text is lost.
  - *Production:* Field researchers operating in poor connectivity environments risk substantial data loss without automatic draft saving.
- **Next Action:** Implement a debounced `useAutosave` hook in `SubmitAssignmentPage.tsx` saving draft content to `localStorage` periodically.

### Finding F.2: Evidence Upload is Simulated via Text Metadata Rather Than File Ingestion
- **Requirement:** Assignments must support genuine evidence upload with validation ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L283](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L283)).
- **Priority:** P1
- **Status:** Simulated
- **Evidence:**
  - In [src/features/assignments/SubmitAssignmentPage.tsx#L165](../../src/features/assignments/SubmitAssignmentPage.tsx#L165), clicking "Add Mock Evidence Record" opens a modal where the user fills in text fields (title, description, source).
  - No `<input type="file">` element exists; no image or document file bytes are captured or stored.
- **Why it matters (Demo vs. Production):**
  - *Demo:* Functional for demonstrating metadata linkage, but must be explicitly documented as mock text data.
  - *Production:* Civic evidence requires verified photographic, sensor, or audio evidence with GPS metadata.
- **Next Action:** Add a file input supporting camera attachments in the UI, storing local preview URLs for the demo and providing a production storage adapter.

### Finding F.3: Absence of User-Facing Submission Receipt and Timestamp Display
- **Requirement:** Submission success should produce truthful persisted state and receipt / timestamp ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L290](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L290)).
- **Priority:** P1
- **Status:** Partial
- **Evidence:**
  - While `submittedAt` is persisted in the record ([src/services/demoRepository.ts#L600](../../src/services/demoRepository.ts#L600)), submitting immediately navigates back to the assignment detail view ([src/features/assignments/SubmitAssignmentPage.tsx#L157](../../src/features/assignments/SubmitAssignmentPage.tsx#L157)).
  - No submission receipt card, confirmation modal, or receipt timestamp is displayed to the learner.
- **Why it matters (Demo vs. Production):**
  - *Demo:* Weakens the sense of academic and civic accountability.
  - *Production:* Required for record-keeping when students submit time-sensitive coursework or contest verification deadlines.
- **Next Action:** Display a dedicated post-submission confirmation card with a verifiable receipt ID, submission timestamp, and attached evidence summary.

### Finding F.4: UHV / Jeevan Vidya is Not Isolated as a Distinct Learning Stream
- **Requirement:** UHV is a distinct learning stream, not a generic civic assignment bucket; keep UHV content, reflections, assignments, and progress separate ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L294](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L294)).
- **Priority:** P1 / P3
- **Status:** Contradicted / Partial
- **Evidence:**
  - In [src/features/learning/CoursesPage.tsx#L44](../../src/features/learning/CoursesPage.tsx#L44), UHV is merely one tab filter in the generic course catalog.
  - In [src/features/assignments/AssignmentsPage.tsx#L248](../../src/features/assignments/AssignmentsPage.tsx#L248), assignment `asg_uhv_08` ("Civic Ethics & Community Harmony Reflection") appears in the generic assignment list alongside traffic audits (`asg_obs_01`).
- **Why it matters (Demo vs. Production):**
  - *Demo:* Conflates introspective ethical self-exploration with municipal road audits.
  - *Production:* Dilutes the distinct pedagogical framework of Jeevan Vidya.
- **Next Action:** Create an independent `/uhv` learning hub with a dedicated reflection log separate from the municipal assignments queue.

### Finding F.5: UHV Curriculum Source and Licensing Unverified (OD)
- **Requirement:** Confirm content source / curriculum / licensing with owner before production publication ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L298](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L298)).
- **Priority:** OD
- **Status:** Decision Needed
- **Evidence:**
  - `course_uhv_leadership_05` in [src/data/seed/courses.ts#L133](../../src/data/seed/courses.ts#L133) hardcodes concepts from Jeevan Vidya without license notices or curriculum accreditation records.
- **Why it matters (Demo vs. Production):**
  - *Demo:* Adequate for internal simulation.
  - *Production:* Educational content requires clear attribution and curriculum licensing before public release.
- **Next Action:** Submit an Owner Decision request to confirm licensed curriculum partners for Jeevan Vidya content.

---

## Scope G — Shared Session Engine

### Finding G.1: Complete Absence of Unified `SessionRoom` Common Session Object
- **Requirement:** Use one persistent `SessionRoom` / common session object with configurable modes (Standard Meeting, Debate Room, Youth Assembly, Youth Parliament, Workshop, Research Session, Consultation, Competition, Interview / Q&A) ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L308](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L308)).
- **Priority:** P1
- **Status:** Missing
- **Evidence:**
  - The repository defines an `Assembly` model ([src/types/domain.ts#L294](../../src/types/domain.ts#L294)) rendered by a dedicated 9-stage assembly flow ([src/features/assemblies/AssemblySessionPage.tsx](../../src/features/assemblies/AssemblySessionPage.tsx)), and a lightweight calendar `Session` model ([src/types/domain.ts#L268](../../src/types/domain.ts#L268): `id, eventId, assemblyId, title, agenda, resources`).
  - However, the codebase contains zero implementations of a unified, configurable `SessionRoom` common session object capable of switching between chamber modes (Meeting, Debate, Assembly, Parliament, Workshop, etc.).
- **Why it matters (Demo vs. Production):**
  - *Demo:* Prevents demonstrating cross-chamber transitions (e.g. from an assembly to a working committee).
  - *Production:* Forces fragmented development of redundant live-room engines for debate, parliament, and meetings.
- **Next Action:** Create a unified `SessionRoom` interface in `src/types/domain.ts` supporting configurable chamber modes.

### Finding G.2: Mode Transition Context Preservation and Permission Recomputation Missing
- **Requirement:** Mode transition must preserve session ID, roster, attendance, roles/lenses, agenda, chat, evidence, proposition state, captions/transcript, and moderation history, and recompute permissions ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L321](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L321)).
- **Priority:** P1
- **Status:** Missing
- **Evidence:**
  - Zero code exists for mode transitions. Navigating between chambers requires visiting completely disjoint route hierarchies (`/assemblies/:id/session` vs `/parliament`).
  - [src/services/demoRepository.ts](../../src/services/demoRepository.ts) has no methods for transitioning session modes or recalculating participant permissions.
- **Why it matters (Demo vs. Production):**
  - *Demo:* Users cannot transition from a plenary assembly into a debate or committee room.
  - *Production:* Live civic assemblies that need to split into focused debate sessions lose all attendee and evidence context.
- **Next Action:** Implement a `transitionSessionMode` method in `demoRepository.ts` that preserves roster and evidence state across chamber types.

### Finding G.3: Graceful Degradation and Real-Time Media Fallback Architecture Missing
- **Requirement:** Video is not mandatory; provide audio/text and low-bandwidth paths; preserve core participation on provider/media failure; do not leak provider APIs into domain logic ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L336](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L336)).
- **Priority:** P1
- **Status:** Missing / Simulated
- **Evidence:**
  - The repository contains no real-time media engine (no WebRTC, LiveKit, or audio streaming).
  - While the demo UI is text-based, there is no abstraction layer (`MediaEngineAdapter`) or network quality detection mechanism designed for production graceful degradation.
- **Why it matters (Demo vs. Production):**
  - *Demo:* The text-only UI operates well on low bandwidth, but lacks intentional media degradation controls.
  - *Production:* When video services fail or bandwidth drops, participants will be disconnected unless an audio/text fallback is built into the architecture.
- **Next Action:** Define a vendor-neutral `MediaSessionProvider` interface with explicit bandwidth state fallback hooks (`video -> audio-only -> text-only`).

---

## Scope H — Debate Room

### Finding H.1: Complete Omission of Debate Room Feature, Routes, and Types
- **Requirement:** Debate Room must provide structured motion-centered discussion with configurable format/time limits, roles, speaking order/queue, evidence panel, moderated chat, visible rulebook, optional polls, reflection ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L348](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L348)).
- **Priority:** P1 / P3
- **Status:** Missing
- **Evidence:**
  - [src/app/router.tsx](../../src/app/router.tsx) contains no debate routes.
  - [src/types/domain.ts](../../src/types/domain.ts) has no `Debate`, `DebateMotion`, or `SpeakingQueue` types.
  - Zero debate components exist in [src/features/](../../src/features/).
- **Why it matters (Demo vs. Production):**
  - *Demo:* An entire core product capability mandated by PRD Scope H is absent from the user interface.
  - *Production:* Eliminates the formal motion-centered debate format from the platform's democratic toolset.
- **Next Action:** Build `src/features/debate/DebateRoomPage.tsx`, declare debate models in `src/types/domain.ts`, and register `/debates/:id` in `router.tsx`.

### Finding H.2: Absence of Debate State Model
- **Requirement:** Implement debate state model: `DRAFT → SCHEDULED → OPEN → MOTION_CONFIRMED → OPENING_STATEMENTS → DISCUSSION → REBUTTAL_OR_QUESTIONS → CLOSING_STATEMENTS → REFLECTION → CLOSED → REPORT_PUBLISHED` ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L366](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L366)).
- **Priority:** P1 / P3
- **Status:** Missing
- **Evidence:**
  - No state machine or lifecycle union exists for debate stages in [src/types/domain.ts](../../src/types/domain.ts).
- **Why it matters (Demo vs. Production):**
  - *Demo:* Cannot demonstrate timed debate speaking turns or motion voting.
  - *Production:* Parliamentary and competitive debate formats cannot enforce procedural rules without a formal state machine.
- **Next Action:** Define `DebateStage` enum in `src/types/domain.ts` and add stage advancement handlers to `demoRepository.ts`.

### Finding H.3: Absence of Rulebook and Safeguards Against Poll Misrepresentation
- **Requirement:** Visible rulebook; polls must not be represented as public consensus or policy authorization ([README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L360](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L360), [L364](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#L364)).
- **Priority:** P1 / P3
- **Status:** Missing
- **Evidence:**
  - Because Debate Room is absent, no debate rulebook is rendered and no poll disclaimers are present.
- **Why it matters (Demo vs. Production):**
  - *Demo:* Fails to educate participants on debate etiquette and procedural rules.
  - *Production:* Informal debate sentiment polls risk being misinterpreted as binding public referenda.
- **Next Action:** Build a persistent debate rulebook modal and attach a disclaimer to all debate poll widgets: "Debate polls reflect participant chamber sentiment only and do not constitute civic consensus or policy authorization."

---

## Scope I — Youth Assembly (Section 10)

### Finding I-1: Canonical Four-Role Model Replaced by Six Custom Roles
- **Requirement:** Core deliberation requires four non-hierarchical roles defining responsibility without status: **Thinker**, **Enabler**, **Troubleshooter**, and **Shaper**.
- **Priority:** P1
- **Status:** Contradicted
- **Evidence:**
  - `src/types/domain.ts:314-320`: `AssemblyRoleType` is defined as `'Questioner' | 'Evidence Analyst' | 'Civic Advocate' | 'Synthesiser' | 'Community Voice' | 'Rapporteur'`.
  - `src/services/demoRepository.ts:910-915`: Allocates default roles cycling through the 6 non-canonical types upon joining.
  - `src/data/seed/assemblies.ts:81-125`: All seed roles are configured with `Questioner`, `Evidence Analyst`, etc.
  - `tests/assembly-deliberation.test.ts:26`: Tests assert `result.role.roleName === 'Questioner'`.
- **Demo vs Production Impact:** For the demo, Aarav's user journey presents a functional role flow, but it teaches an ad-hoc taxonomy rather than the canonical UHV-aligned 4-role framework (Thinker, Enabler, Troubleshooter, Shaper) specified in Master PRD §A9. In production, this alters the deliberative balance and breaks cross-institution interoperability.
- **Next Action:** Refactor `AssemblyRoleType` in `src/types/domain.ts`, update `seedAssemblyRoles` in `src/data/seed/assemblies.ts`, and adapt test assertions in `tests/assembly-deliberation.test.ts` to use Thinker, Enabler, Troubleshooter, and Shaper.

### Finding I-2: Canonical Six-Stage Deliberative Sequence Replaced by Nine Ad-Hoc Stages
- **Requirement:** Deliberation must progress through the canonical stages: `FRAME → THINK → ENABLE → TROUBLESHOOT → SHAPE → FINAL ASSEMBLY`.
- **Priority:** P1
- **Status:** Contradicted
- **Evidence:**
  - `src/types/domain.ts:285-290`: `AssemblyStage` is typed as `'deliberation' | 'proposition_draft' | 'revision' | 'support_dissent' | 'outcome' | 'reflection'`.
  - `src/features/assemblies/AssemblySessionPage.tsx:50-60`: `STAGES` defines 9 stages: `orientation`, `question`, `evidence_review`, `deliberation`, `proposition_draft`, `revision`, `support_dissent`, `outcome`, `reflection`.
- **Demo vs Production Impact:** The 9-stage stepper works smoothly in a linear demo, but it decouples the chamber progression from the four role perspectives (`THINK`, `ENABLE`, `TROUBLESHOOT`, `SHAPE`), turning deliberative co-creation into generic form filling.
- **Next Action:** Align `AssemblyStage` domain types and `STAGES` constant with the canonical six-stage progression (`FRAME`, `THINK`, `ENABLE`, `TROUBLESHOOT`, `SHAPE`, `FINAL_ASSEMBLY`), integrating orientation and evidence review into `FRAME` and reflection into `FINAL_ASSEMBLY`.

### Finding I-3: Procedural Chair/Co-Chair Authority Missing and Unauthenticated Stage Progression
- **Requirement:** Chair/Co-Chair authority is procedural only; no role receives substantive veto power.
- **Priority:** P1
- **Status:** Missing
- **Evidence:**
  - `src/features/assemblies/AssemblySessionPage.tsx:186-200`: `goToNextStage()` calls `handleSetStage(next)` for any user in the browser. Persisting the stage to repository is guarded by `currentUser?.role === 'facilitator'` (lines 190-192), but there is no session-level Chair or Co-Chair role modeled or authorized.
  - `src/types/domain.ts:294-312`: `Assembly` has `facilitatorId: string`, but no `chairId` or `coChairId`.
- **Demo vs Production Impact:** In a client-only demo, the participant can freely click through all 9 stages in their local view without procedural facilitation. In production, this allows individual participants to desynchronize their state from the assembly chamber without procedural order.
- **Next Action:** Add `chairUserId` and `coChairUserId` to `Assembly`, implement procedural controls allowing only appointed session chairs/facilitators to advance chamber stages, and enforce non-veto constraints in proposition finalization.

### Finding I-4: Missing "Abstain / Insufficient Basis" Participant Response State
- **Requirement:** Participant response states must include: Support, Support with reservations, Dissent, and **Abstain / insufficient basis**. Simple majority must not be used as the sole proposition-quality rule.
- **Priority:** P1
- **Status:** Partial
- **Evidence:**
  - `src/types/domain.ts:373-378`: `SupportProfile` models `{ stronglySupport: number; supportWithModifications: number; neutral: number; concerns: number; }`. Dissent is captured in `dissent: DissentRecord[]` (line 398).
  - `src/features/assemblies/AssemblySessionPage.tsx:853-866`: Renders Strongly Support, With Amendments, and Preserved Dissent. There is no voting option or counter for "Abstain / insufficient basis".
  - Outcome determination in `AssemblySessionPage.tsx:920-975` is a manual button click rather than an automated evaluation enforcing non-simple-majority consensus thresholds.
- **Demo vs Production Impact:** Demonstrates consensus mapping visually, but omits the critical epistemic stance where participants indicate they lack adequate evidence to take a position.
- **Next Action:** Update `SupportProfile` in `src/types/domain.ts` to include `abstainInsufficientBasis: number`, add the response button in `AssemblySessionPage.tsx`, and record user response state explicitly.

### Finding I-5: Four Balanced Role Zones UI Layout Missing
- **Requirement:** Four role zones should have balanced visual weight in the chamber UI. Mobile must reflow rather than shrinking an illegible desktop room.
- **Priority:** P1
- **Status:** Missing
- **Evidence:**
  - `src/features/assemblies/AssemblySessionPage.tsx:438-450`: UI is constructed as a standard 3-column desktop layout (`grid-cols-1 lg:grid-cols-12`: Left 3 cols stages list, Center 6 cols stage forms, Right 3 cols participant/evidence feed). There are no four dedicated visual role zones (Thinker, Enabler, Troubleshooter, Shaper).
- **Demo vs Production Impact:** The UI is clean on desktop and responsive on mobile via standard vertical column stacking, but it completely lacks the visual spatial framing of four co-equal deliberative perspectives.
- **Next Action:** Redesign the deliberation stage in `AssemblySessionPage.tsx` to provide four quadrant/balanced panels representing Thinker, Enabler, Troubleshooter, and Shaper inputs, reflowing sequentially on mobile screens.

---

## Scope J — Youth Parliament (Section 11)

### Finding J-1: Possible Official-Affiliation Ambiguity and Unstated Non-Endorsement
- **Requirement:** Must not imply official government authorization or political endorsement. Real chamber insignia/official claims must not be hard-coded.
- **Priority:** P2
- **Status:** Partial
- **Evidence:**
  - `src/features/previews/ParliamentPage.tsx:45-49, 80, 195-197`: The page prominently displays `DemoPreviewBadge` components ("National Youth Parliament Preview", "Simulated Apex Chamber", "Simulated Preview Context").
  - However, the copy includes specific references such as "540 Youth Parliamentarians representing all States & UTs" (line 88), "Target Ministry: MoHUA & MoRTH" (line 107), and transmission to the "parliamentary e-Gazette and municipal standing committee portal" (line 196).
  - The view lacks an explicit clarifying disclaimer stating that the educational exercise is non-governmental and carries no statutory authority or political endorsement.
- **Demo vs Production Impact:** While the preview badges clearly indicate a prototype to reviewers, the specific wording creates possible ambiguity regarding official government ties or statutory transmission.
- **Next Action:** Add an explicit disclaimer to `ParliamentPage.tsx` clarifying that JanSahabhag Youth Parliament is an independent educational simulation with no official government authorization, statutory standing, or political endorsement.

### Finding J-2: Configurable Chamber Layout and Procedure Unimplemented
- **Requirement:** Chamber layout and procedure must be configurable.
- **Priority:** P2
- **Status:** Missing
- **Evidence:**
  - `src/features/previews/ParliamentPage.tsx:20-110`: Layout, Order of Business, and motion texts are hardcoded static JSX arrays. No configuration interface, props, or database records exist in `src/types/domain.ts` or `src/services/demoRepository.ts`.
- **Demo vs Production Impact:** Acceptable for a static competition preview badge, but cannot support different parliamentary traditions (e.g., Westminster vs Committee style, state vs national assemblies).
- **Next Action:** Define a `ParliamentChamberConfig` schema supporting configurable rules, standing orders, and seating topologies.

### Finding J-3: Interactive Parliamentary Roles, Tools, and Workflows Missing
- **Requirement:** Roles and tools may include Speaker/Chair, members, motions, amendments, committees, queue, voting where configured. Working feature or clearly labelled clickable prototype.
- **Priority:** P2
- **Status:** Simulated
- **Evidence:**
  - `src/features/previews/ParliamentPage.tsx:17-214`: Implements a `DemoPreviewBadge` ("National Youth Parliament Preview"), but the interactive capability is limited to a single modal opening (`setSelectedMotionModal(true)` at line 65) inspecting a static motion. There is no speaker recognition queue, member roll call, motion tabling form, amendment submission, committee routing, or division voting.
- **Demo vs Production Impact:** The screen fulfills the "clearly labelled clickable prototype" minimum for visual inspection, but provides zero depth beyond reading static mock text.
- **Next Action:** Deepen the clickable prototype to allow users to table a simulated amendment, enter a speaker request queue, and cast a vote on the Order Paper.

---

## Scope K — Workspaces (Section 12)

### Finding K-1: Dedicated Workspaces Module and Data Model Missing
- **Requirement:** Workspaces for institution, cross-institution, team, and topic collaboration, with overview/purpose, owner/moderators, membership rules, username invites, join requests, member directory with privacy controls, persistent chat/channels, announcements/resources, and moderated discussions.
- **Priority:** P1 / P3
- **Status:** Missing
- **Evidence:**
  - `src/types/domain.ts:1-644`: No `Workspace` interface or entity exists.
  - `src/app/router.tsx:1-486`: No `/workspaces` routes exist.
  - The closest partial entity is `CommunityGroup` at `/community` (`src/features/community/CommunityPage.tsx:50-62` and `CommunityGroupDetailPage.tsx:27-120`). However, `CommunityGroup` is a flat topic circle, lacking institutional tenancy, team isolation, membership rules, invite tokens, join requests, announcements, resources, or channel structures.
- **Demo vs Production Impact:** The demo provides peer discussions via `/community`, but cannot support institutional governance, faculty-student team workspaces, or inter-school collaborative task forces.
- **Next Action:** Define `Workspace` domain entities with explicit scoping (`institution`, `cross_institution`, `topic`, `project`), and establish corresponding routes and repository services.

### Finding K-2: Workspace-Scoped Moderator Authority and Auditability Missing
- **Requirement:** Workspace moderators must remain scoped to assigned workspaces. Membership and moderation actions must be auditable.
- **Priority:** P1 / P3
- **Status:** Missing
- **Evidence:**
  - `src/types/domain.ts:535-547`: `CommunityGroup` has no `ownerUserId` or `moderatorUserIds` fields.
  - `src/features/community/CommunityGroupDetailPage.tsx:64-79`: Joining or leaving is an instant unauthenticated client toggle (`handleToggleMembership`).
  - `src/services/demoRepository.ts:1920-1980`: Direct array mutation on `memberUserIds` without permission checks or audit log persistence.
- **Demo vs Production Impact:** In the demo, anyone can join or leave any group. In production, this causes total loss of tenant boundary control and violates institutional data sovereignty.
- **Next Action:** Introduce workspace-scoped RBAC (`owner`, `moderator`, `member`, `guest`) and record all join/leave/remove/mute actions to an auditable log table.

### Finding K-3: Integration with Shared Session Engine Missing
- **Requirement:** Workspaces should support optional meetings using the shared session engine.
- **Priority:** P3
- **Status:** Missing
- **Evidence:**
  - `src/features/community/CommunityGroupDetailPage.tsx`: Contains zero meeting triggers, calendar links, or connections to `AssemblySessionPage` or event session objects.
- **Demo vs Production Impact:** Limits collaboration to asynchronous text posts; cannot launch live deliberative breakout sessions.
- **Next Action:** Connect workspace threads with the common session engine to allow launching ad-hoc deliberative meetings.

---

## Scope L — Rulebooks and In-Product Guidance (Section 13)

### Finding L-1: Versioned Contextual Rulebooks Entity Entirely Absent
- **Requirement:** Versioned contextual Rulebooks are required for relevant experiences, especially Youth Assembly, Youth Parliament, Debate Room, Assignments, and Workspaces.
- **Priority:** P1
- **Status:** Missing
- **Evidence:**
  - `src/types/domain.ts:1-644`: Zero references to `Rulebook` or `GuidanceSchema`.
  - `src/services/demoRepository.ts:1-2034`: No repository methods for loading, tracking, or acknowledging rulebooks.
  - `git grep -i "rulebook" src/` returns 0 results across the entire codebase.
- **Demo vs Production Impact:** The demo relies on hardcoded stage copy (e.g. Stage 1 in `AssemblySessionPage.tsx:540-569`), but cannot version, audit, or standardize procedural rules across chambers or academic assignments.
- **Next Action:** Define a `Rulebook` domain interface (`id`, `scope`, `version`, `title`, `clauses`, `acknowledgementRequired`) and seed rulebooks for assemblies, assignments, and forums.

### Finding L-2: Point-of-Use Rules Gate and Reopenable Guidance Missing
- **Requirement:** Users should see rules before their first substantive action and be able to reopen them while participating. Material procedural changes require appropriate notice/acknowledgement.
- **Priority:** P1
- **Status:** Missing
- **Evidence:**
  - `src/features/assemblies/AssemblyDetailPage.tsx:140-160`: The "Join Assembly" action executes immediately upon button click without presenting chamber rules or requiring consent.
  - `src/features/assemblies/AssemblySessionPage.tsx:628-738`: While deliberating in Stage 4, there is no floating button, drawer, or modal to inspect or verify procedural rules.
  - `src/features/assignments/SubmitAssignmentPage.tsx:1-120`: No academic integrity rules or rubrics are displayed or acknowledged prior to submission.
- **Demo vs Production Impact:** In an academic competition demo, judges expect visible procedural pedagogy. Without point-of-use guidance, participants act without informed consent.
- **Next Action:** Create a reusable `<RulebookModal />` component triggered before joining assemblies or submitting assignments, accessible via a persistent icon button in active session headers.

---

## Scope M — Civic Passport and Civic Credits (Section 14)

### Finding M-1: Premature "Verified" Status Stamped on Automated Client Actions
- **Requirement:** Civic Passport must show contribution/evidence/status truthfully, link evidence to source activity, and **do not imply verification that did not occur**.
- **Priority:** P1
- **Status:** Contradicted / Simulated
- **Evidence:**
  - `src/services/demoRepository.ts:964, 1013`: Calling `joinAssembly()` creates a `CreditTransaction` with `status: 'Verified'` and a `PassportEntry` with `isVerified: true`.
  - `src/services/demoRepository.ts:1062`: Submitting an assembly contribution immediately awards verified credits.
  - `src/features/passport/PassportPage.tsx:71-73, 86-91`: Displays "Verified Civic Passport" and "Total Verified Credits: {passport.totalCredits}".
  - `tests/assembly-deliberation.test.ts:50`: Test asserts `expect(passportEntry?.isVerified).toBe(true)`.
- **Demo vs Production Impact:** Directly contradicts "do not imply verification that did not occur." Client actions are recorded as verified credentials without prior peer, educator, or institutional verification.
- **Next Action:** Distinguish between `Logged` / `SelfReported` status and `Verified` status. Client participation should award credits in `PendingVerification` or `ParticipationConfirmed` state, reserving `Verified` for verified assessments or formal sign-offs.

### Finding M-2: Missing "DEMO" Labeling on Automatically Awarded Credits
- **Requirement:** Do not automatically award fake/demo credits without clear DEMO labelling.
- **Priority:** P3
- **Status:** Contradicted
- **Evidence:**
  - `src/features/passport/CreditsPage.tsx:80-140` and `PassportPage.tsx:64-94`: Renders credit badges with emerald/saffron styling without any badge indicating "DEMO CREDIT" or "SYNTHETIC SIMULATION".
- **Demo vs Production Impact:** Users and reviewers may mistake client-side demo increments for accredited academic credits.
- **Next Action:** Add a persistent `DemoPreviewBadge` or `(Demo)` label adjacent to credit awards generated by client-side simulators.

### Finding M-3: Transparent Rules Present, but Appeals and Anti-Gaming Workflows Missing
- **Requirement:** Credits require explicit calculation, verification, correction/appeal, and anti-gaming rules. Credits must not be a generic civic-worth, patriotism, ideology, or conformity score.
- **Priority:** P3
- **Status:** Partial
- **Evidence:**
  - `src/features/passport/CreditsPage.tsx:81-89`: Contains a transparent rules callout ("Transparent Activity Award Rules") detailing credit amounts across dimensions (+5 Learning, +10 Contribution, +5 Observation, etc.).
  - However, no appeal or correction endpoints exist for disputed or miscalculated credits in `src/features/passport/` or `src/services/demoRepository.ts`.
  - Anti-gaming rules remain missing (no rate limits, velocity checks, or duplicate content detection beyond a 5-character length check in `demoRepository.ts:1040`).
- **Demo vs Production Impact:** Award rules are transparent in the demo UI, but the absence of correction and anti-gaming safeguards leaves production credit ledgers without appeal recourse or sybil/gaming protections.
- **Next Action:** Implement a credit appeal/correction modal for contested transactions and introduce velocity and anti-gaming checks in the credit issuance service.

---

## Scope N — Issues, Labs, Projects, Stakeholders, Competitions (Section 15)

### Finding N-1: Competitions Module Entirely Missing
- **Requirement:** Retained scope includes Competitions as part of the broader civic ecosystem.
- **Priority:** P4
- **Status:** Missing
- **Evidence:**
  - `git grep -i "competition" src/` returns 0 results. No competition data types, routes, or UI exist.
- **Demo vs Production Impact:** Competitions are classified as P4 (deferred unless selected for demo). Omitting it is acceptable for the core vertical slice, but represents an unfilled retained scope item.
- **Next Action:** Record competition management in later-phase backlog, ensuring data schemas allow linking project submissions to future challenge prompts.

### Finding N-2: Stakeholder Routing and Response Tracking Workflow Is Static Mock Only
- **Requirement:** Stakeholder routing and response tracking for municipal deputations.
- **Priority:** P4
- **Status:** Simulated
- **Evidence:**
  - `src/features/previews/StakeholdersPage.tsx:31-76`: Read-only static array of 4 municipal entities with hardcoded receipt codes (e.g., `JMC-CIV-2026-8821`).
  - No dynamic routing mechanism, submission ingestion, response timeline updates, or municipal official sign-off flow exist in `src/services/demoRepository.ts`.
- **Demo vs Production Impact:** Serves as a visually compelling demo preview of post-assembly municipal impact, but cannot track actual resolution delivery or receipt confirmations.
- **Next Action:** Back the stakeholder interface with a persistent repository entity (`StakeholderDeputation`) tracking state changes: `Drafted → Tabled → Acknowledged → UnderReview → Implemented`.

### Finding N-3: Idea Lab State Reset on Reload and Labs Lack Persistence
- **Requirement:** Idea Lab, Research Lab, and Policy Lab capabilities.
- **Priority:** P4
- **Status:** Simulated
- **Evidence:**
  - `src/features/previews/IdeaLabPage.tsx:29-70`: Uses local React `useState` for submitted ideas and upvotes; all changes are lost on page refresh.
  - `src/features/previews/ResearchLabPage.tsx:1-150` and `PolicyLabPage.tsx:1-150`: Static mock document readers with fake download buttons.
- **Demo vs Production Impact:** Sufficient to illustrate the vision during a guided walkthrough, but fails basic persistence expectations if a judge submits an idea and refreshes.
- **Next Action:** Migrate `IdeaLabPage` state to `PersistenceService` so idea submissions and votes survive browser reloads.

### Finding N-4: Civic Issues Map Lacks GIS Map Rendering
- **Requirement:** Civic Issues Map for spatial hazard logging.
- **Priority:** P4
- **Status:** Simulated / Partial
- **Evidence:**
  - `src/features/issues/CivicIssuesPage.tsx:115-180`: Implements hazard reporting and card listing, but the "Map View" is a stylized CSS card/grid with mock latitude/longitude coordinates; no geospatial map engine (Leaflet, MapLibre, Mapbox) is loaded.
- **Demo vs Production Impact:** The card list and reporting form work well in localStorage, but spatial cluster analysis cannot be demonstrated visually.
- **Next Action:** Integrate an open-source mapping component (e.g. `react-leaflet` with OpenStreetMap tiles) for visual geographic hazard pin mapping.

---

## Scope O — AI Governance (Section 16)

### Finding O-1: Retrieval Permission Filtering and Access Boundary Unimplemented
- **Requirement:** AI must apply permission filtering before retrieval; prevent AI from accessing content the user cannot access directly.
- **Priority:** P0
- **Status:** Missing
- **Evidence:**
  - `src/features/analytics/AnalyticsPage.tsx:128-135`: Displays a "Simulated AI Civic Intelligence Synthesis" card, but no live AI engine or retrieval pipeline exists in the codebase.
  - No authorization-aware vector retriever, document filter, or pre-retrieval ACL boundary exists in `src/services/`.
- **Demo vs Production Impact:** The current demo is purely illustrative with static cards. However, the architectural requirement to enforce pre-retrieval permission filters is completely absent from existing service designs.
- **Next Action:** Document and design an authorization-aware retriever interface ensuring that any future retrieval pipeline verifies user read access prior to vector search.

### Finding O-2: Data-Tier Controls and Safeguarding Data Egress Filters Unimplemented
- **Requirement:** Use data-tier controls; block sensitive/minor/safeguarding data from external providers by default unless explicitly authorized and disclosed.
- **Priority:** P0
- **Status:** Missing
- **Evidence:**
  - `src/services/demoRepository.ts:1-2034`: No data classification metadata (e.g. `PII`, `Minor`, `Safeguarding`, `Public`).
  - No egress filtering or sanitization layer exists to inspect or redact outbound data.
- **Demo vs Production Impact:** No external AI provider is currently invoked by the client. However, production readiness requires data classification schemas and outbound filters before any real AI endpoint is connected.
- **Next Action:** Define data-tier annotations on core domain entities and design an egress filter to block sensitive participant information from external provider payloads.

### Finding O-3: Runtime AI Kill Switch and Correction Workflows Unimplemented
- **Requirement:** Maintain a non-AI fallback and kill switch. Disclose AI involvement; maintain human review/correction.
- **Priority:** P0
- **Status:** Missing
- **Evidence:**
  - Static disclosures exist in `AnalyticsPage.tsx:128` and `StudioPage.tsx:90`, but there is no runtime toggle or kill switch (environment flag, configuration setting) to disable AI-assisted components or fall back to non-AI behavior.
  - No user-facing review or correction mechanism exists for AI-synthesized outputs.
- **Demo vs Production Impact:** Informational disclosures are visible in the demo UI, but administrators lack a kill switch to disable automated features if needed.
- **Next Action:** Add an administrative toggle in the platform settings to disable AI-assisted features platform-wide.

### Finding O-4: Architectural Decision Gates Against Autonomous Decisions Missing
- **Requirement:** AI must **not** independently make final decisions on identity/institution verification, serious sanctions, consequential grading, credit revocation, safeguarding, or final propositions.
- **Priority:** P0
- **Status:** Missing Policy Enforcement
- **Evidence:**
  - `src/features/moderation/AdminModerationPage.tsx:53-97`: Moderation actions are driven by manual clicks from admin personas. However, there are no programmatic policy gates or invariant checks preventing automated background routines from mutating verification or sanction fields directly.
- **Demo vs Production Impact:** Human review is visually demonstrated in the moderation UI, but service-layer guards enforcing human-only authorization on consequential actions remain unbuilt.
- **Next Action:** Add service-layer invariant assertions verifying that decisions on verification, sanctions, and proposition finalization require explicit human actor signatures.

---

## Scope P — Privacy, Security, Safeguarding, Auditability (Section 17)

### Finding P-1: Public Launch Gate Unmet Across Eight Required Review Areas
- **Requirement:** **Public launch gate — P0 (Master PRD §2, p.3)**: No public launch until appropriate review/testing covers:
  1. Legal/privacy
  2. Security
  3. Safeguarding
  4. Consent/age handling where applicable
  5. Retention/deletion
  6. Grievance/contact process
  7. Incident response
  8. Provider/data-flow review.
- **Priority:** P0 (Public Launch Blocker)
- **Status:** Missing / Public Launch Gate
- **Evidence:**
  - **Legal/privacy:** No Privacy Policy, Terms of Service, or formal legal notices are published or routed in `src/app/router.tsx:1-486`.
  - **Security:** No security audit reports, penetration test evidence, or automated vulnerability scanning workflows exist in the repository.
  - **Safeguarding:** No dedicated safeguarding operational workflow or child protection contact path exists in user-facing flows.
  - **Consent/age handling where applicable:** No parental/guardian consent collection or age verification checks exist in `src/features/onboarding/OnboardingPage.tsx:1-120`.
  - **Retention/deletion:** No user data retention policies or account/data deletion mechanisms exist in `src/features/profile/ProfilePage.tsx:1-174`.
  - **Grievance/contact process:** No user grievance intake, contact form, or formal escalation route is defined.
  - **Incident response:** No documented security or safeguarding incident response runbooks exist.
  - **Provider/data-flow review:** No formal review of third-party assets or hosting providers (Vercel CDN, Google Fonts CDN at `index.html:10-14`) is documented.
- **Demo vs Production Impact:** The repository represents a competition and evaluation prototype. It must not be opened for public access or live participant enrollment until all eight review areas are formally completed.
- **Next Action:** Establish a formal Launch Gate Review checklist addressing each of the eight areas prior to public deployment.

### Finding P-2: Unauthenticated Sessions and Plaintext LocalStorage Persistence
- **Requirement:** Secure sessions, TLS, encryption at rest, secrets management.
- **Priority:** P0
- **Status:** Contradicted / Client-Only Demo
- **Evidence:**
  - `src/stores/authStore.ts:39-48`: Persona switching is an unauthenticated client call (`switchPersona(userId)`).
  - `src/services/persistence.ts:5, 20-60`: `STORAGE_KEY` is `'jansahbhag_demo_v1'`, storing the entire simulated database (users, emails, locations, moderation cases) as plaintext JSON in browser localStorage.
  - No server sessions, HTTP-only authentication cookies, or database encryption at rest exist.
- **Demo vs Production Impact:** Enables zero-friction evaluator walkthroughs and offline persistence, but provides zero session security or at-rest encryption in a production environment.
- **Next Action:** Implement a secure session management layer with HTTP-only cookies and encrypted database storage for production deployments.

### Finding P-3: Absence of Multi-Factor Authentication (MFA) for Privileged Accounts
- **Requirement:** Multi-Factor Authentication (MFA) for privileged accounts (Platform Owner, System Admin, Institutional Lead).
- **Priority:** P0
- **Status:** Missing
- **Evidence:**
  - `src/features/auth-demo/DemoLoginPage.tsx:1-120`: Administrative personas (`user_vikram`, Platform Admin) and institutional personas (`user_kavita`) are selectable with a single click without password or second-factor challenge.
- **Demo vs Production Impact:** Streamlines competition inspection, but leaves privileged routes completely unprotected by MFA.
- **Next Action:** Implement MFA verification challenges for privileged user roles before allowing access to administrative dashboards.

### Finding P-4: Role-Based Access Control (RBAC) Enforced Only in Cosmetic UI
- **Requirement:** Robust RBAC/ABAC enforcement and least privilege.
- **Priority:** P0
- **Status:** Simulated
- **Evidence:**
  - `src/services/demoRepository.ts:1-2034`: Repository methods (`updateModerationCase`, `createProgramme`, `finaliseProposition`) execute without asserting caller authorization.
  - Route navigation and sidebar visibility (`src/components/layout/DesktopSidebar.tsx:40-90`) filter links cosmetically, but any user can directly navigate to `/admin/dashboard` or execute administrative methods.
- **Demo vs Production Impact:** Acceptable for a single-browser client demo, but lacks server-enforced role authorization for production multi-user operation.
- **Next Action:** Implement service-layer permission validation on all state-mutating repository operations.

### Finding P-5: Participant Abuse Reporting and User Blocking Tools Missing
- **Requirement:** Report/block/escalation workflows and least privilege safeguarding.
- **Priority:** P0
- **Status:** Missing
- **Evidence:**
  - `src/features/assemblies/AssemblySessionPage.tsx:1-1204`: No report, flag, or block actions on assembly contributions.
  - `src/features/community/CommunityGroupDetailPage.tsx:1-421`: No report, flag, or block actions on community posts or replies.
  - While `/admin/moderation` (`src/features/moderation/AdminModerationPage.tsx`) displays pre-seeded moderation cases, participants themselves have no interface to submit reports or block other users.
- **Demo vs Production Impact:** Demonstrates administrative moderation review, but omits essential participant self-protection tools.
- **Next Action:** Add a report/flag modal to user contributions and community posts to allow participants to report inappropriate behavior.

### Finding P-6: File Upload and Malware Scanning Capabilities Absent
- **Requirement:** File/malware scanning, input validation, and least privilege.
- **Priority:** P0
- **Status:** Missing
- **Evidence:**
  - Real file upload and malware scanning are entirely absent.
  - In `src/features/assignments/SubmitAssignmentPage.tsx:165-185`, the submission workflow creates mock evidence metadata using text inputs (`title`, `description`, `source`, `location`) and pre-seeded IDs; there is no file input element (`<input type="file">`), no file storage backend, and no virus/malware scanning pipeline.
- **Demo vs Production Impact:** Using mock text metadata avoids binary file dependencies in a client demo, but production assignment submissions requiring real document/photo attachments need file upload handling and malware scanning.
- **Next Action:** Build a file upload service with MIME-type validation, size limits, and virus scanning prior to accepting real student attachments.

### Finding P-7: Persistent Audit Trails and Rate Limiting Unimplemented
- **Requirement:** Audit logs, rate limiting, and dependency scanning.
- **Priority:** P0
- **Status:** Missing
- **Evidence:**
  - No audit log data structures exist in `src/types/domain.ts` or `src/services/demoRepository.ts`. Administrative mutations (moderation case resolution, proposition finalization) do not record immutable audit trail entries.
  - No rate limiting is applied to form submissions or authentication actions.
- **Demo vs Production Impact:** Audit trails and rate limits are not needed for a localized client demo, but are essential in production for operational accountability and abuse prevention.
- **Next Action:** Create an append-only audit log schema and record all administrative and moderation state changes.

---

---

## Scope Q — Multilingual, accessibility, responsive and low bandwidth

**Theme:** Inclusive product behavior
**Primary Source:** Master PRD §A15, p.24; baseline §31, pp.48–49

### Finding Q.1: Baseline English and Hindi UI and Content
- **Paraphrase**: English and Hindi are baseline UI and content languages.
- **Priority**: P0 / P1
- **Status**: Partial / Simulated
- **Concrete Code & Test Evidence**:
  - `src/stores/authStore.ts:5, 21-25`: `DemoLanguage` defines `'en' | 'hi' | 'raj'`, with `'hi'` labelled `'हिन्दी (Hindi - Demo)'`.
  - `src/components/layout/TopUtilityBar.tsx:31, 110-146`: A language selector dropdown allows toggling between English, Hindi, and Rajasthani.
  - `src/stores/authStore.ts:50-52`: `setLanguage` updates `activeLanguage` in the Zustand store, but `activeLanguage` is consumed nowhere else in the codebase except to display the active label in `TopUtilityBar.tsx:121, 145`.
  - All UI strings, route components (`src/features/*`), and seed data (`src/data/seed/courses.ts`, `assemblies.ts`, `propositions.ts`) are hardcoded in English.
- **Demo vs. Production Impact**: For the demo, selecting Hindi changes the dropdown pill but leaves all screen text in English. In production, baseline bilingual operation in English and Hindi is required for inclusive learner engagement across regional cohorts.
- **Next Action**: Introduce a translation dictionary or standard i18n framework and provide Hindi string bundles for common navigation, button labels, and the core Aarav golden-path screens.

### Finding Q.2: Language Provenance and Derivative Translation Model
- **Paraphrase**: Preserve contributor original-language text; translation is derivative, labelled, and must not overwrite source text.
- **Priority**: P0 / P1
- **Status**: Missing
- **Concrete Code & Test Evidence**:
  - `src/types/domain.ts:169-184` (`Submission`), `src/types/domain.ts:342-357` (`Contribution`), `src/types/domain.ts:447-459` (`Reflection`): All entities store user input as raw untyped strings (`content: string`) without language provenance (no `languageCode` or locale metadata).
  - User text entered in the demo is stored directly as raw strings in `localStorage`. While existing strings are not deleted or overwritten today, the schema lacks language tagging and has no model for derivative translations (`translations?: Array<{ language: string; text: string; isDerivative: boolean }>`).
  - No translation service, adapter, or UI derivative badge exists in `src/services/` or `src/components/ui/`.
- **Demo vs. Production Impact**: The current demo operates exclusively with English text inputs. In production, if multilingual inputs or translation features are enabled, lacking language provenance and derivative translation models makes it impossible to distinguish authentic author text from derivative translations.
- **Next Action**: Add `languageCode?: string` to contribution/submission entities in `src/types/domain.ts` and model derivative translations with explicit source references and UI badges.

### Finding Q.3: Audit of Existing Regional and Rajasthani Content
- **Paraphrase**: Audit existing regional and Rajasthani content before claiming absence or support.
- **Priority**: P1
- **Status**: Simulated / Not Verified
- **Concrete Code & Test Evidence**:
  - `src/stores/authStore.ts:25`: Declares `{ code: 'raj', label: 'राजस्थानी (Rajasthani - Demo)', isDemo: true }`.
  - `src/features/previews/StudioPage.tsx:68`: Mentions localized pamphlets in Rajasthani.
  - The repository contains no regional linguistic audit report, glossary, or dialect content in `docs/` or `src/data/seed/`.
- **Demo vs. Production Impact**: Offering a Rajasthani option in the demo dropdown suggests localized dialect support that does not exist in code or data. Advanced regional multilingual tooling is a P4 backlog item, but claiming it without an audit contradicts Scope Q guidance.
- **Next Action**: Audit existing regional curriculum and community materials before claiming Rajasthani support, or remove the `'raj'` option from the demo language selector until audited content is available.

### Finding Q.4: WCAG 2.1 AA Compliance and Automated Accessibility Verification
- **Paraphrase**: Target WCAG 2.1 AA, including keyboard navigation, visible focus, semantic structure, screen-reader support, contrast, and captions/transcripts where applicable.
- **Priority**: P0 / P1
- **Status**: Partial / Not Verified
- **Concrete Code & Test Evidence**:
  - `src/styles/index.css:19-21`: Includes `:focus-visible` styling (`outline-none ring-2 ring-civic-indigo-500`).
  - `src/styles/index.css:25-34`: Includes `prefers-reduced-motion` handling (compliant).
  - `src/components/ui/Modal.tsx:24-38, 51-87`: Modal implements `role="dialog"`, `aria-modal="true"`, and `Escape` key listeners, but lacks a focus trap (pressing Tab cycles keyboard focus outside the modal into background DOM elements, violating WCAG 2.1 AA 2.4.3 Focus Order).
  - `src/features/assemblies/AssemblySessionPage.tsx:400-550`: Dynamic stage transitions and peer contribution feeds update without `aria-live="polite"` regions.
  - `package.json:20-47`: Contains no automated accessibility audit tooling (such as `@axe-core/playwright` or `vitest-axe`).
  - Neither `tests/` nor `e2e/` include automated accessibility tests. Color contrast ratios across custom palette combinations (e.g. saffron and teal badges on light backgrounds) have not been formally verified.
- **Demo vs. Production Impact**: In visual manual demo presentations, keyboard tab cycling and screen-reader gaps are easy to overlook. In production, WCAG 2.1 AA accessibility is a foundational platform requirement.
- **Next Action**: Add automated accessibility checks to test runs, implement focus trapping in `Modal.tsx`, add `aria-live` regions for live deliberation state changes, and verify palette contrast ratios against WCAG 2.1 AA thresholds.

### Finding Q.5: Upload Progress, Validation, Recoverability, and Resumability
- **Paraphrase**: Uploads require progress indicators, validation, recoverability, and resumable behavior where specified.
- **Priority**: P1
- **Status**: Simulated / Missing for Binary Files
- **Concrete Code & Test Evidence**:
  - `src/features/assignments/SubmitAssignmentPage.tsx:54-62, 118-135`: Evidence creation uses a text modal (`isAddEvidenceModalOpen`) that accepts string metadata (Title, Description, Location, Source). There is no binary file input (`<input type="file">`).
  - `src/services/demoRepository.ts:310-335`: `createEvidence` writes mock text records directly to `localStorage`.
  - The repository contains no binary file upload controls, no upload progress indicators, no file-type/size validation, and no resumable chunked upload protocol.
- **Demo vs. Production Impact**: Because no binary file input exists today, there is no unsafe file upload vulnerability in the current demo. However, when binary uploads (photos, audio notes, field logs) are introduced in production, resumable and validated upload handling will be required for low-bandwidth environments.
- **Next Action**: Define an abstraction for binary uploads (`StorageService`) with progress callbacks, client-side validation (MIME, max size), and resumable chunking when binary file inputs are implemented.

---

## Scope R — Data model, APIs, realtime events, and architecture

**Theme:** Shared records and stable domain model
**Primary Source:** Master PRD §A16, pp.25–26; baseline §§34–36, pp.50–53

### Finding R.1: Missing Retained Domain Model Families
- **Paraphrase**: The data model must encompass foundational domain families without blocking retained future scope.
- **Priority**: P1 / P3 Foundation
- **Status**: Partial / Missing
- **Concrete Code & Test Evidence**:
  - Review of `src/types/domain.ts:1-620` shows that while learning, assignments, assemblies, propositions, credits, and passport entries are typed, several domain families required for full-system compatibility are absent:
    1. *Platform Identity & Founder Revisions*: Missing. No entity models platform identity versions, publication controls, or founder editorial revisions.
    2. *Permission Grants & Templates*: Missing. Only a flat role union (`UserRole`, lines 1–8) exists. No granular permission grants, policy documents, or capability mapping schemas exist.
    3. *Audit Events*: Missing. `src/types/domain.ts` includes `CreditTransaction.status: 'Audited'`, but has no `AuditEvent` schema recording actor, action, target entity, timestamp, and state delta.
    4. *Workspaces, Memberships & Invitations*: Missing. No `Workspace`, `WorkspaceMember`, or `WorkspaceInvitation` entities exist.
    5. *Parliamentary Motions, Amendments & Votes*: Missing. Youth Parliament (`/parliament`) uses a static preview; domain entities for formal parliamentary motions, amendments, and division votes are absent.
    6. *Rulebooks & Acknowledgements*: Missing. No `Rulebook` or `RulebookAcknowledgement` entities exist.
    7. *AI Interactions & Policies*: Missing. No entities exist to record AI prompt/response telemetry, provider configuration, or data safety policies.
- **Demo vs. Production Impact**: For the demo vertical slice, omitting these types does not block Aarav's linear path. For production, subsequent features will require schema migrations if these domain relationships are not modeled cleanly.
- **Next Action**: Extend `src/types/domain.ts` with foundational interface definitions for `AuditEvent`, `PermissionGrant`, `Workspace`, `Rulebook`, and `AiPolicyRecord`.

### Finding R.2: Versioned API Contracts and Modular Backend
- **Paraphrase**: Use a modular backend with documented and versioned API contracts, avoiding premature microservice fragmentation.
- **Priority**: P1 / P3
- **Status**: Simulated / Missing
- **Concrete Code & Test Evidence**:
  - `src/services/demoRepository.ts:1-1200`: All operations execute directly in the browser via `LocalDemoRepository` and `localStorage` (`jansahbhag_demo_v1`).
  - No server-side HTTP endpoints, backend service, or serverless functions exist in the repository.
  - No versioned API contracts, endpoint documentation, or schema specifications exist in the codebase.
- **Demo vs. Production Impact**: An in-browser repository satisfies the standalone demo requirement. However, multi-user coordination, authentic data persistence, and external integration require a real modular backend with documented versioned contracts.
- **Next Action**: Document versioned API contracts for core resources (assemblies, propositions, passport) and implement a modular backend adhering to the `DemoRepository` interface defined in `src/services/repository.ts`.

### Finding R.3: Realtime Events and Room State Synchronization
- **Paraphrase**: Deliberation rooms require real-time event distribution and synchronized state transitions.
- **Priority**: P1 / P3
- **Status**: Simulated / Missing
- **Concrete Code & Test Evidence**:
  - `src/features/assemblies/AssemblySessionPage.tsx:75-120, 480-530`: Deliberation stage transitions and peer contributions are driven entirely by synchronous local state and deterministic seed arrays.
  - `src/types/domain.ts:268-280`: `Session` is a static calendar record (`startTime`, `endTime`, `meetingLink`) without active rosters, live participant tracking, or socket connections.
  - No WebSocket, Server-Sent Events (SSE), WebRTC, or pub/sub message brokers exist in the codebase.
- **Demo vs. Production Impact**: For a single presenter, simulated local transitions provide a predictable demonstration. In a live multi-user assembly, participants cannot deliberate or vote synchronously without an event-driven realtime architecture.
- **Next Action**: Define event message schemas for assembly stage transitions, incoming contributions, and live votes, with an adapter interface in `src/services/`.

### Finding R.4: Multi-Tenant and Scope-Aware Access Enforcement
- **Paraphrase**: Keep data access tenant-aware and scope-aware across institutions and administrative tiers.
- **Priority**: P0 / P1
- **Status**: Simulated / Missing Enforcement
- **Concrete Code & Test Evidence**:
  - `src/services/demoRepository.ts:25-35, 240-270`: The entire dataset is loaded as a single in-memory object (`DemoDatabase`) from one browser key.
  - Institutional filtering (e.g. `getParticipantsByInstitution`) is performed purely via client-side JavaScript array filters (`db.users.filter(u => u.institutionId === institutionId)`).
  - Any client can read the entire `localStorage` payload or navigate directly to `/institution/dashboard` or `/admin/dashboard` without tenant checks.
- **Demo vs. Production Impact**: Client filtering is acceptable for inspecting seeded personas. In production, lack of server-enforced tenant scoping and database-level isolation would allow cross-tenant data leaks.
- **Next Action**: Implement scoping validation at the repository abstraction boundary and design tenant partitioning (e.g. institution foreign keys and database row-level security) for the production data layer.

### Finding R.5: Progressive Web App (PWA) Capabilities
- **Paraphrase**: Recommended approach is a web-first, mobile-first PWA.
- **Priority**: P1
- **Status**: Partial / Missing PWA Features
- **Concrete Code & Test Evidence**:
  - `index.html:1-19`: Contains no `<link rel="manifest">` and no Service Worker registration.
  - The repository has no Web App Manifest (`manifest.webmanifest`), no service worker script, and no offline asset caching strategy.
  - `MobileBottomNav.tsx` and responsive CSS provide mobile viewport styling, but app installation and offline launch are not supported.
- **Demo vs. Production Impact**: Runs normally in desktop and mobile browsers during a demo. In production, users in areas with intermittent connectivity cannot install the application or boot it without an initial network fetch.
- **Next Action**: Add a Web App Manifest and configure service worker caching for the application shell.

---

## Scope S — Analytics and dashboards

**Theme:** Participant, facilitator, institution, and platform insight
**Primary Source:** Master PRD §A18, p.26; baseline §32, pp.49–50

### Finding S.1: Retained Analytical Dimensions
- **Paraphrase**: Retained analytics scope includes participant progress, assignments, sessions, role/lens distribution, deliberation quality, platform health, inclusion, stakeholder response, and civic-action conversion.
- **Priority**: P3 / P4
- **Status**: Partial / Missing
- **Concrete Code & Test Evidence**:
  - `src/features/analytics/AnalyticsPage.tsx:60-89, 149-184`: Computes basic totals from local seed data: credits by dimension, enrolment status breakdown, total participants, evidence records, and propositions count.
  - The following retained analytical dimensions are absent from `AnalyticsPage.tsx` and `AdminDashboardPage.tsx`:
    1. *Assignment Analytics*: No submission completion curves, review turnaround latency, or rubric performance distributions.
    2. *Session Telemetry*: No session attendance, drop-out timing, or stage dwell time tracking.
    3. *Role and Lens Distribution*: No breakdown of deliberative roles (Questioners, Proponents, Skeptics, Synthesizers) or stakeholder lenses represented in debates.
    4. *Deliberation Quality*: No evidence citation index, substantive contribution depth metrics, or consensus divergence calculation.
    5. *Platform & System Health*: No latency graphs, client error rates, or storage health indicators.
    6. *Inclusion Metrics*: No demographic, geographic, or linguistic representation tracking.
    7. *Stakeholder Response Metrics*: No tracking of municipal acknowledgement rates or resolution response latency.
    8. *Civic-Action Conversion*: No funnel analytics tracking the progression from Learning -> Deliberation -> Proposition -> Field Action -> Civic Impact.
- **Demo vs. Production Impact**: For the demo, high-level bar and pie charts illustrate basic activity. In production, institutional partners and facilitators require deeper pedagogical and deliberative insight dashboards.
- **Next Action**: Expand the local tab in `AnalyticsPage.tsx` to compute role distribution and an evidence-citation ratio from the existing seed data.

### Finding S.2: Provisional National Scale Targets and Synthetic Previews
- **Paraphrase**: Do not overstate provisional scale or KPI targets until workload assumptions and test plans are documented.
- **Priority**: P3 / P4
- **Status**: Simulated / Not Verified
- **Concrete Code & Test Evidence**:
  - `src/features/analytics/AnalyticsPage.tsx:90-105, 237-317`: The "National 2047 Preview" tab displays hardcoded illustrative figures:
    - `"28 + 8 UTs"` Pan-India Deployment (`line 248`)
    - `"1,248,500"` National Youth Deliberators (`line 254`)
    - `"14,820"` Municipal Propositions (`line 260`)
    - `"842"` Enacted Safety Bylaws (`line 266`)
    - Regional Council rankings (Northern Hub: 382,000, Western Hub: 294,000) (`lines 91-97`)
  - Although tagged with `DemoPreviewBadge` (`line 238-242`), these provisional scale targets are not accompanied by documented workload assumptions or test plans.
- **Demo vs. Production Impact**: Displaying large user figures without clarifying that they are illustrative vision targets risks misrepresenting current system scale.
- **Next Action**: Ensure the preview banner explicitly notes that national figures represent provisional targets subject to workload modeling and infrastructure validation.

---

## Scope T — Testing, acceptance and Definition of Done

**Theme:** Evidence that a feature actually works
**Primary Source:** Master PRD §A20, pp.27–28; baseline §§42, 45, pp.56–58; Operational §18, pp.65–66

### Finding T.1: Network API, Security, and Permission Testing
- **Paraphrase**: Testing must include API, permissions, security, and abuse/safeguarding tests for high-risk flows.
- **Priority**: P0 / P1
- **Status**: Missing
- **Concrete Code & Test Evidence**:
  - `tests/` contains 11 test files (89 unit/UI tests), and `e2e/` contains 2 Playwright specs (6 tests).
  - *API Tests*: 0 tests. No backend server exists, so network API tests and payload contracts are untested.
  - *Permission & Route Guard Tests*: 0 tests. There are no tests asserting that unauthorized users are rejected from accessing `/admin/*` or `/institution/*`.
  - *Security Tests*: 0 tests. No automated checks for Cross-Site Scripting (XSS) in contribution text, no CSRF tests, and no session security tests.
  - *Abuse and Safeguarding Tests*: 0 tests. No automated tests for profanity filtering, child safeguarding flags, or input rate-limiting in deliberation inputs.
- **Demo vs. Production Impact**: In a controlled demo environment with seeded personas, these gaps do not manifest. In production, a youth deliberation platform requires automated security, permission, and safeguarding test gates.
- **Next Action**: Write security test cases in `tests/` verifying XSS sanitization in input fields and create mock role-guard test suites verifying that unauthorized access is blocked.

### Finding T.2: Unauthorized Access and Failed Save Verification in E2E
- **Paraphrase**: Demo-specific E2E must test refresh/navigation, persistence, unauthorized access, failed save/recovery, and repeatability/reset.
- **Priority**: P0 / P1
- **Status**: Partial / Missing
- **Concrete Code & Test Evidence**:
  - `e2e/smoke-routes.spec.ts` and `e2e/golden-path.spec.ts`:
    - `refresh/navigation`: Verified (`smoke-routes.spec.ts:75-88`).
    - `persistence`: Verified (`smoke-routes.spec.ts:75-88`).
    - `repeatability/reset`: Verified (`smoke-routes.spec.ts:130-141`).
    - `unauthorized access`: **MISSING**. No E2E test attempts to access `/admin/dashboard` as Aarav or an unauthenticated visitor to confirm rejection or redirection.
    - `failed save/recovery`: **MISSING IN E2E**. While `tests/persistence.test.ts:40-60` unit-tests memory fallback when `localStorage` throws, no E2E test exercises browser storage quota exhaustion or failed save error recovery UI in the live browser.
- **Demo vs. Production Impact**: If a presenter navigates to an admin route while demonstrating Aarav, the interface allows it without restriction. In production, lack of authorization verification is a critical delivery blocker.
- **Next Action**: Add a Playwright test to `e2e/smoke-routes.spec.ts` asserting that unauthorized navigation triggers an access-denied screen or login redirect.

### Finding T.3: Full Golden-Path Story Unverified on Mobile Viewport
- **Paraphrase**: Test the complete demo story on desktop and mobile.
- **Priority**: P1
- **Status**: Partial
- **Concrete Code & Test Evidence**:
  - `e2e/golden-path.spec.ts:1-125`: The entire Aarav golden-path loop (enrolment -> assignment submission -> mentor verification -> assembly join -> contribution -> amendment -> finalisation -> reflection -> passport -> credit ledger) is tested exclusively on desktop viewport (1280x720).
  - `e2e/smoke-routes.spec.ts:89-105`: Mobile testing (`viewport: { width: 375, height: 667 }`) verifies only that 3 screens render headings (`AssemblySessionPage`, `AdminDashboardPage`, `AdminProgrammesPage`). It does not execute the interactive submission, review, contribution, or reflection flows on mobile.
  - `playwright.config.ts:30-40`: Configures only a single `chromium` desktop project; no mobile device profiles are defined in the projects array.
- **Demo vs. Production Impact**: Interactive components (such as the 9-stage assembly stepper, contribution submission form, and evidence attachments) could encounter layout or touch interaction issues on mobile devices that are not caught by the current test suite.
- **Next Action**: Add a mobile test project to `playwright.config.ts` and execute `golden-path.spec.ts` under mobile viewport emulation.

### Finding T.4: Load and Recovery Testing Under Concurrency
- **Paraphrase**: Testing must include load where appropriate, and failure/recovery.
- **Priority**: P1
- **Status**: Missing
- **Concrete Code & Test Evidence**:
  - The repository contains no load testing tooling or scripts.
  - No automated tests verify database recovery, schema migration during concurrent writes, or network recovery during active sessions.
- **Demo vs. Production Impact**: The demo executes sequentially in a single tab. Production systems cannot commit to reliability targets without documented load scripts and recovery tests.
- **Next Action**: Author a load testing script modeling concurrent assembly contribution submissions against target API endpoints.

---

## Scope U — Technical NFRs and reliability

**Theme:** Performance, scale, recovery
**Primary Source:** Master PRD Operational §16, p.65; baseline §41, pp.55–56

### Finding U.1: Provisional Scale Targets and Infrastructure Sizing
- **Paraphrase**: Scale targets remain provisional until workload assumptions, load scripts, infrastructure sizing, monitoring thresholds, and restore tests are documented.
- **Priority**: P3 Production Target
- **Status**: Missing / Unverified
- **Concrete Code & Test Evidence**:
  - `README_01_RULES_REQUIREMENTS_BY_SCOPE.md:754-770`: States that targets for availability, DAU, concurrency, API latency, realtime latency, upload size, throughput, RPO/RTO, backup/restore, accessibility, and low bandwidth remain provisional.
  - The repository contains no documented workload assumptions, server capacity models, database sizing, or compute cluster specifications in `docs/` or configuration files.
  - Only `vercel.json` exists, which configures single-page client rewrites.
- **Demo vs. Production Impact**: Infrastructure sizing is not required for a static client demo. In production, deploying without documented workload assumptions prevents accurate capacity planning.
- **Next Action**: Author `docs/nfr-workload-model.md` specifying provisional peak concurrent deliberators per assembly, requests-per-second estimates, and baseline server compute requirements.

### Finding U.2: Monitoring Thresholds and Observability
- **Paraphrase**: Operational reliability requires documented monitoring thresholds and observability.
- **Priority**: P3
- **Status**: Missing
- **Concrete Code & Test Evidence**:
  - No error reporting service, OpenTelemetry instrumentation, or server monitoring metrics are configured in `package.json`, `src/main.tsx`, or `src/services/`.
  - Application errors are only logged to the browser console via `console.error`.
- **Demo vs. Production Impact**: In production, unhandled runtime errors or failing background saves will be untracked, degrading user experience without administrative notification.
- **Next Action**: Add client-side error telemetry and document monitoring thresholds for backend services once provisioned.

### Finding U.3: Backup, Disaster Recovery, and Provisional RPO/RTO Targets
- **Paraphrase**: Establish and test backup/restore mechanisms, verifying provisional Recovery Point Objective (RPO) and Recovery Time Objective (RTO) targets.
- **Priority**: P3
- **Status**: Simulated / Missing
- **Concrete Code & Test Evidence**:
  - `src/services/demoRepository.ts:80-95`: "Restore" is implemented as `resetDemo()`, which clears `localStorage` and re-clones static seed data.
  - There is no automated database backup, no Point-in-Time Recovery mechanism, and no disaster recovery runbook.
  - RPO and RTO remain provisional targets that have not been tested or verified through restore drills.
- **Demo vs. Production Impact**: Demo reset provides repeatability for presentations. In production, hardware failure or data corruption would result in data loss without verified backup and restore procedures.
- **Next Action**: Document backup procedures and define tested RPO and RTO procedures in a disaster recovery runbook.

---

## Scope V — Full-system later-phase backlog

**Theme:** Retained later-phase scope not required in initial demo
**Primary Source:** Master PRD §2, p.3; §A19, pp.26–27; baseline §44, p.56; Operational §17, p.65; Start-Here §3, pp.1–2

| Backlog Item | Priority | Existing Repository Status | Concrete Evidence (Path & Lines) | Current Demo vs. Production Rationale | Next Action |
|---|---|---|---|---|---|
| **Expanded institutional hierarchy / federation** | P4 | Partial (Flat Seeds) | `src/data/seed/institutions.ts:1-64`<br>`src/types/domain.ts:32-48` | `seedInstitutions` defines 4 distinct institutions (Navchetna Public School, Vidyashree Sr Sec School, RTU Kota, Marwar Youth Civic Forum across school, university, and youth_club types). However, they are flat peer records without parent-child nesting or multi-tier administrative federation (State -> District -> Block -> Cluster -> School). | Retain in backlog; design hierarchical federation schema with administrative tiers in future phase. |
| **Full Civic Academy / Self-Growth content** | P4 | Partial (8-Course Sample) | `src/data/seed/courses.ts:1-756` | `seedCourses` contains 8 courses and 20 lessons illustrating curriculum structure across `civic_academy`, `self_growth`, `uhv`, and `action_skills` tracks. However, comprehensive multi-year statewide curriculum content across all semesters/grades is retained for later phases. | Retain in backlog; partner with educational specialists to author complete multi-year curriculum. |
| **Issues Map (Interactive GIS)** | P4 | Simulated | `src/features/issues/CivicIssuesPage.tsx:140-168`<br>`src/features/issues/IssueDetailPage.tsx:1-260` | Explicitly labelled "Interactive GIS Cluster Layer (Simulated)". Uses cards and a CSS animated radar circle; no interactive map engine (Leaflet/Mapbox) or geospatial coordinate rendering exists. | Retain in backlog; integrate Leaflet or Mapbox GL with real GeoJSON coordinates in future phase. |
| **Idea / Research / Policy Labs** | P4 | Simulated (Previews) | `src/features/previews/IdeaLabPage.tsx:1-120`<br>`src/features/previews/ResearchLabPage.tsx:1-120`<br>`src/features/previews/PolicyLabPage.tsx:1-120` | Pages display static preview cards with `DemoPreviewBadge`. No interactive lab sandbox, model drafting tooling, or empirical dataset analytics exist. | Retain in backlog; preserve as honest non-interactive Demo Previews until later phases. |
| **Competition engine** | P4 | Missing | Entire codebase (`src/`, `tests/`) | Zero domain types, seed records, routes, or UI components for competitions, hackathons, or civic tournaments exist. | Retain in backlog; specify competition rules and scoring engine in later phase. |
| **Stakeholder routing and response tracking** | P4 | Simulated | `src/features/previews/StakeholdersPage.tsx:28-65, 120-180` | Displays 4 static stakeholder cards and a mock modal that logs simulated local state. No dispatch to municipal ticketing systems or SLA monitoring exists. | Retain in backlog; design webhook dispatcher for urban local body integration. |
| **Advanced analytics** | P4 | Simulated | `src/features/analytics/AnalyticsPage.tsx:90-105, 320-350` | National aggregation charts and AI civic intelligence cards are synthetic mock displays. No real analytical aggregation pipeline exists. | Retain in backlog; build event stream analytics pipeline in later phase. |
| **Studio / workflow builder** | P4 | Simulated | `src/features/previews/StudioPage.tsx:30-80, 140-185` | Displays mock studio tool cards; clicking download triggers a browser `alert('Simulated studio artifact downloaded...')`. No multimedia synthesis, audio clipping, or infographic layout engine exists. | Retain in backlog; preserve as vision preview. |
| **Broad external integrations** | P4 | Missing | Entire codebase | Zero integrations with WhatsApp, SMS gateways, DigiLocker, Aadhaar identity, or school ERP/LMS platforms. | Retain in backlog; define integration gateway architecture. |
| **National-scale optimization** | P4 | Missing | `vercel.json:1-10`<br>`package.json:1-55` | Deployed as a single static SPA without multi-region deployment, database sharding, edge caching, or read replica distribution. | Retain in backlog for national deployment phase. |
| **Advanced multilingual tooling** | P4 | Missing | `src/stores/authStore.ts:5-26` | No automated translation memory, crowdsourced terminology management, or speech-to-text transcription engine exists. | Retain in backlog; integrate speech/translation API adapters when funding permits. |
| **Robust offline / sync behavior** | P4 | Missing | `src/services/demoRepository.ts:1-1200` | No background synchronization, Conflict-Free Replicated Data Types (CRDTs), or offline mutation queue exists. Storage failure falls back to memory and is lost on reload. | Retain in backlog; design IndexedDB offline queue with server sync reconciliation. |

---

## Owner Decisions That Must Not Be Guessed (§24)

**Priority:** OD (Owner Decision)
**Primary Source:** Master PRD §A21, p.28; Start-Here §8, p.4
*Note: In accordance with governing rules, the following 14 decisions must not be guessed by engineering and require explicit platform owner confirmation:*

| Decision Item | Priority | Current Implementation Status | Code / Configuration Reality | Why Decision Is Needed Before Production Lock |
|---|---|---|---|---|
| **OD.1: Exact demo date** | OD | Decision Needed | Not referenced in codebase. | Determines the engineering cutoff for addressing open gaps vs. freezing presentation scope. |
| **OD.2: Exact 5-minute demo story & acceptance criteria** | OD | Decision Needed | Implemented informally as Aarav's golden path (`e2e/golden-path.spec.ts:1-125`). | Owner must confirm whether the current 12-step script (enrolment to passport) represents the agreed executive demo story. |
| **OD.3: Which modules are fully functional vs prototype** | OD | Decision Needed | Current boundary: Learning, Assignments, Assembly, Passport are interactive in-browser; Labs, Parliament, Stakeholders, Studio, Issues are Demo Previews. | Owner must officially ratify this boundary so team does not expend effort deepening prototype modules ahead of demo. |
| **OD.4: Whether video is required** | OD | Decision Needed | Video is currently simulated/absent across all deliberation views (`src/features/assemblies/AssemblySessionPage.tsx`). | If live or recorded video streaming is required for the demo, streaming infrastructure must be provisioned. |
| **OD.5: Session access policies** | OD | Decision Needed | Any seeded user can immediately click "Join" on any assembly (`src/features/assemblies/AssembliesPage.tsx:150-180`). | Owner must confirm access policy rules: open, request-to-join, invite-only, or institution-restricted. |
| **OD.6: Founder / public identity fields approved for publication** | OD | Decision Needed | Platform identity content is currently placeholder text (`src/features/welcome/WelcomePage.tsx:1-150`). | Approvals are required before publishing authentic founder profiles or institutional acknowledgements. |
| **OD.7: Final domain and branding decision** | OD | Decision Needed | Deployed to ephemeral URL `https://jansahabhag2027.vercel.app`. | Official domain name and branding assets must be confirmed. |
| **OD.8: Languages required for demo** | OD | Decision Needed | Dropdown offers English, Hindi, and Rajasthani, but screens are English-only (`src/stores/authStore.ts:21-25`). | Owner must decide whether Hindi translation is strictly required for the demo audience, or if English-only presentation is acceptable. |
| **OD.9: Existing data that must be preserved or migrated** | OD | Decision Needed | Repository uses ephemeral fictional seed data (`src/data/seed/*`) that is overwritten on reset. | Owner must clarify whether pilot student records, survey responses, or assembly minutes exist that must be preserved. |
| **OD.10: Configured AI provider(s)** | OD | Decision Needed | AI synthesis is hardcoded mock text with disclaimer (`src/features/analytics/AnalyticsPage.tsx:320-359`). | Owner must select approved provider and approve API cost/safety policies. |
| **OD.11: External integration availability** | OD | Decision Needed | Zero external integrations exist in code. | Owner must specify whether any external educational or municipal systems are accessible for integration testing. |
| **OD.12: Stakeholder workflows** | OD | Decision Needed | Stakeholder interactions are simulated cards (`src/features/previews/StakeholdersPage.tsx:28-65`). | Owner must define the actual workflow for routing student propositions to local government bodies. |
| **OD.13: Content, curriculum, and licensing** | OD | Decision Needed | Seeded courses are draft sample records (`src/data/seed/courses.ts`). | Owner must confirm approved curriculum materials, UHV syllabus source texts, and copyright licensing. |
| **OD.14: Budget, hosting, and team capacity assumptions** | OD | Decision Needed | Deployed on static hosting; no backend infrastructure provisioned. | Production hosting budget, operational headcount, and maintenance capacity must be authorized. |

---

## Fast Source Index (§25) and One-Line Implementation Rule (§26) Analysis

### Fast Source Index (§25)
- **Clarification**: Section 25 of `README_01_RULES_REQUIREMENTS_BY_SCOPE.md` comprises a 40-row thematic index referencing pages in the Master PRD. It serves as a navigational lookup directory across 46 baseline sections and 20 operational sections.
- **Architectural Finding**: The Fast Source Index **does not itself imply or mandate additional functional features**. Its presence in the requirements document does not constitute a gap in the codebase, but rather confirms that every implemented module remains traceable to its governing PRD chapter.

### One-Line Implementation Rule (§26)
- **Governing Rule**: *"Build the smallest truthful, persistent, permission-safe civic participation loop first; keep the complete system architecture compatible with the retained Master PRD without pretending later-phase features are already implemented."*
- **Audit Assessment of Existing Repository**:
  1. *Smallest Connected Loop*: **Fully Met for Demo**. The golden path connects Aarav's learning, field assignment, teacher verification, assembly deliberation, amendment, resolution, reflection, and Civic Passport ledger in a single coherent flow.
  2. *Truthfulness & Transparency*: **Largely Met**. Later-phase modules (`/parliament`, `/labs/*`, `/stakeholders`, `/studio`, `/issues`) are explicitly labelled with visible `DemoPreviewBadge` components ("Demo Preview", "Simulated GIS Cluster Layer", "Simulated AI Engine"), avoiding deceptive claims of complete implementation.
  3. *Persistence*: **Met for Demo, Unmet for Production**. `localStorage` persistence reliably survives browser refresh and reloads, but provides zero multi-user durability, server backup, or cross-device portability.
  4. *Permission Safety*: **Unmet / Simulated**. The current system relies on a frontend persona switcher without real authentication, cryptographic identity, or backend route protection. Navigating directly to admin and institutional routes is completely unblocked.
  5. *Architectural Compatibility*: **Met**. The modular repository contract (`DemoRepository` in `src/services/repository.ts`) and typed domain definitions (`src/types/domain.ts`) provide clean abstraction seams for dropping in an HTTP backend and database without requiring a frontend rewrite.

---
