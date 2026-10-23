# Master PRD reconciliation with the current demo

**17 October publication update:** The table below describes the 12 October baseline and remains a historical comparison. The later [Jaipur handoff](../HANDOFF_2026-10-16.md), [Package 09 acceptance record](PACKAGE_09_CONNECTED_JAIPUR_ACCEPTANCE_2026-10-16.md), and [Packages 10–11 acceptance](PACKAGES_10_11_ACCEPTANCE_2026-10-16.md) document the fictional single-browser implementation. The [Phase 0 route matrix](PHASE0_ROUTE_CONTROL_MATRIX_2026-10-16.md), [local browser evidence](PHASE0_BROWSER_ROUTE_EVIDENCE_2026-10-16.md), and [reservation module/rulebook checklist](RESERVATION_MODULE_RULEBOOK_COVERAGE_2026-10-16.md) address the demo audit gaps. The later integrated demo passed build, 321 unit tests and 38 browser tests, then was pushed to GitHub at `f88bf7d`. GitHub reported a successful Vercel production deployment, and the live About page was checked. Server authority, real-data policy, Hindi review and public-launch reviews remain unresolved.

**Reviewed:** 12 October 2026. **Source:** [supplied Master PRD archive](../reference/JanSahabhag_2047_MASTER_PRD_v3.1_LOSSLESS_ARCHIVE.docx), SHA-256 `e970f6c2a8495c9b1a70d81d363650e02e016c8511c750d4106fe28c1df8a4e6`. **Baseline:** `autobuild` at `c4e0861`, the earlier [scope-based gap audit](REQUIREMENTS_GAPS.md), and the current code. Three sub-agy accounts reviewed separate sections in isolated worktrees; their claims were checked against the DOCX and repository before inclusion here.

The Master PRD opening is the governing source. Part A updates it; retained Parts B/C supply detailed requirements. Appendices C–H preserve older documents for traceability and do not override the opening rules. The archive filename says `v3.1`, while its internal version table says `v3.0`; no supplied text explains the mismatch. [Product decisions](../decisions.md) records the unresolved version label and owner inputs.

**Additional source reviewed:** [Supplementary PRD v2.0: 33% women's reservation](../reference/JanSahabhag_2047_Supplementary_PRD_33pct_Womens_Reservation_v2.docx), SHA-256 `c3e1e1e438275cc3aed1abe62244f2a6d672f18cc1433f3b4ff49018c7efd2ac`. Its own status is **“Proposed product requirement — owner approval required”** (§intro). The owner approved the policy in principle on 12 October 2026, then approved `ceil(0.33 × applicable allocated places)` per applicable allocation and leaving unmet reserved places unfilled. Fictional demo scope and simulated owner-approved exceptions were decided on 15 October 2026; real-data privacy and production boundaries remain open. It extends the Master PRD without replacing it or claiming live implementation. The proposal was absent from the Master PRD and the earlier gap audit; the findings below record its implementation gap.

## Corrections to the earlier gap audit

| Earlier finding | Source-checked reading | Remaining app gap |
|---|---|---|
| B.1 / CF-03: nine-step README journey versus five-stage loop | The nine-step demo journey can be an implementation of the five-stage method; the PRD itself gives a longer user journey in Part A §A3. | [ThreadMotif](../../src/components/layout/ThreadMotif.tsx) uses a different five-step story, and the app does not present the canonical method consistently. |
| B.5: Youth Parliament preview | Opening §1 explicitly allows a **clearly labelled clickable prototype** in the competition demo. | The `/parliament` preview is permitted at this depth, but [DesktopSidebar](../../src/components/layout/DesktopSidebar.tsx) does not place it at canonical learner item 6. Full chamber procedure remains later work. |
| N.2: stakeholder routing | Opening §3 allows a clearly labelled prototype when external routing is not ready. | No real recipient or response workflow is connected; do not describe the preview as delivered civic impact. |
| N.4: GIS map | Part B §14 specifies issue/location and location privacy; it does not make a full GIS renderer a minimum demo gate. | Issue observation, privacy levels and verification still need implementation. |
| P.1: public-launch gate | Opening §2 lists legal/privacy, security, safeguarding, consent/age, deletion, grievance, incident and provider-flow reviews before public launch. | These reviews are not evidenced. The Vercel demo is publicly reachable, so access and data claims need particular care; no real participant enrolment should be inferred from a demo URL. |
| S.2 / U.1: national scale | Opening §3 makes scale targets provisional until workloads, tests, sizing, monitoring and restore evidence exist. | The analytics preview is labelled illustrative. The targets are not verified capacity or current users. |

## Material Master PRD requirements absent or incomplete in the app

These are product requirements, not a claim that every item belongs in the same delivery phase. The [scope-based audit](REQUIREMENTS_GAPS.md) gives the longer feature-by-feature inventory.

| Area | Governing source | Current evidence and remaining work |
|---|---|---|
| Phase 0 evidence | Opening §2; Part A §A2 | The audit has a gap list but no complete route/control inventory with Keep/Change/Build/Remove/Not Verified decisions and desktop/mobile evidence. A [decision record](../decisions.md) now exists; owner answers are still open. |
| Demo path and permission boundaries | Opening §1 competition-demo row and §2; Part A §§A6–A7 | [Router](../../src/app/router.tsx) exposes admin and Studio routes without authentication or route guards. Persona selection and `localStorage` cannot enforce multi-user permissions or shared moderation. A backend is needed for the full product. |
| Canonical navigation and modules | Opening §1; Part A §§A4, A8, A12 | [Sidebar](../../src/components/layout/DesktopSidebar.tsx) has six primary items. Debate Room and learner Workspace have no route or data model. UHV is a course category, not a separate last navigation stream. |
| Youth Assembly procedure | Opening §1; Part A §A9 | [Domain types](../../src/types/domain.ts) contain six different roles; [session UI](../../src/features/assemblies/AssemblySessionPage.tsx) has nine different stages. Four role zones, role powers, Chair-only stage control, three-person mini-deliberation, four response states and four outcome states need work. Dissent must survive proposition revisions. |
| Shared sessions and contextual rules | Part A §§A7, A13, A20 | The Assembly page is local and standalone. Debate/Assembly/Parliament mode changes cannot preserve one session context. Versioned, point-of-use rulebooks are missing. |
| Assignment and evidence workflow | Part A §§A11, A20; Part C §5 | Draft save is manual; binary evidence upload, recoverable upload, receipt/timestamp and the required verification taxonomy are absent. Text metadata demonstrates relationships but is not file ingestion or independent verification. |
| Passport and Credits | Opening §3; Part C §§5–6 | Client actions can receive `Verified` status without an independent reviewer. The PRD distinguishes six verification types and five levels; credits need explainable factors, corrections and appeals. No civic-worth or ideological score is permitted. |
| Governance and safety | Opening §2; Part A §§A14–A17; Part C §§9–11 | Owner/delegate scopes, audit events, safeguarding case flow, age-aware contact controls, research-ethics review, AI data tiers and provider policies are absent. Mock AI is not a live provider, but future integration must follow the data restrictions. |
| Other retained systems | Parts B/C | Location privacy has six levels; offline activity has a capture→review→verification path; stakeholder routing has states and approval controls; low-bandwidth text/audio access and recovery tests are required. These details are not separate completed workflows in the app. |

## Supplementary proposal: 33% women's reservation

The supplement proposes a minimum reservation wherever the platform allocates a defined number of participant places, representative seats, cohort places or formal positions. It names Youth Parliament, Youth Assembly, Debate Room, limited events and programmes, competitions, workshops, panels, committees and delegations at every level (§§1–2). Open participation without allocated places or formal roles is outside the proposed allocation rule; selection of a limited group or assignment of formal roles within an open activity would bring those allocations into scope (§2). The owner approved the policy in principle and decided the fictional demo would cover every named role and limited place.

| Area | Supplementary PRD source | Current app and documentation gap |
|---|---|---|
| Allocation surfaces | §§1–2, 8 | [Parliament](../../src/features/previews/ParliamentPage.tsx) is a labelled preview; Debate Room, competitions and delegation selection are absent. [Assembly joining](../../src/services/demoRepository.ts) is open, but assigns roles in rotation without a reservation check. The owner decided on 15 October 2026 that every named role in the fictional demo is covered; the isolated Assembly branch does not yet enforce this rule. [Events](../../src/types/domain.ts) record capacity, while [RSVP](../../src/services/demoRepository.ts) adds attendees without selection or reservation validation; capacity-limited demo places are covered by the 15 October decision. Programme records do not select cohorts. The earlier [scope audit](REQUIREMENTS_GAPS.md) did not assess this shared rule. |
| Rulebooks and validation | §§3, 5, 8 | No applicable reservation clauses or point-of-use rulebooks exist. No allocation validator or backend enforces the rule across organisers, moderators, administrators and owners. The browser-only demo cannot provide the proposed server-side control. Rulebook text alone would not establish enforcement. |
| Calculation and changes | §§6, 8–9 | The owner approved `ceil(0.33 × applicable allocated places)` separately for each applicable allocation, with no cross-activity pooling. The app does not identify totals, calculate a reserved minimum, check finalisation or revalidate after changes, withdrawals or replacements. It cannot report an allocation as compliant before those controls are implemented and independently tested. |
| Exceptions and audit | §§5–6, 8–9 | The owner directed that unmet reserved places remain unfilled. For the fictional demo, the owner allowed only an explicit simulated owner-approved exception with reason, approver, time, policy version and outcome. No exception workflow, authority check or audit exists in the root app. An exception must be shown as such, not as ordinary compliance. |
| Privacy and reporting | §§7–9 | The owner chose fictional demo data only. [User data](../../src/types/domain.ts) has no approved real gender declaration or reservation fields. Real-data declaration, access and retention await owner approval. The proposal forbids inferring gender from names, photographs, voices or proxies and calls for aggregate reporting without publicly exposing an individual's gender. No such restricted reporting exists. |
| Fictional demo and acceptance | §§4, 8, 10 | There are no labelled `DEMO` allocations showing calculated minimums, accepted and rejected selections, or change and exception outcomes in Parliament, Assembly and an event, programme or competition. No reservation acceptance tests exist. A clickable preview must not be described as working enforcement. |

[Product decisions](../decisions.md) records the in-principle approval, remaining owner choices and separate pre-launch legal review in the supplement's §9. The source does not claim that one legal requirement applies everywhere.

## Scope and verification boundary

The repository is a single React/Vite browser-rendered demo. The owner chose to keep a clearly labelled single-browser simulation with fictional Jaipur data for the immediate pass. It has no production backend or server-rendered frontend. Its local records survive refresh in one browser, but do not provide authenticated, shared, durable participation across people or devices. Production scope requires server-side identity, scoped permissions, storage, session coordination, moderation, verification and audit services under Part A §§A6–A7 and A16–A17. The current deployment and test suite do not establish connected-demo compliance or public-launch readiness.

This reconciliation is a document and code comparison. HTTP HEAD checks on 12 October 2026 returned 200 for the Vercel demo and GitHub repository, but did not test an interactive route. It did not complete the Master PRD Phase 0 live route/control inspection or a legal, security, accessibility or safeguarding review. The reservation policy has in-principle approval and demo-specific operating decisions, but no implemented or tested allocation behavior. Claims about live behavior beyond the inspected code remain unverified.

**14 October isolated implementation note:** [The sub-agy review](DEMO_SUBAGY_REVIEW_2026-10-12.md) identifies a final unmerged branch for canonical navigation, private non-scored UHV, labelled local Debate Room/session, and Jaipur assignment/evidence/receipt simulation. Its independent build, 162 unit tests and 15 browser tests passed. The private Debate journal is excluded from civic credentials; newly submitted assignment credits remain pending until fictional mentor review. The table above remains a comparison against the root checkout and deployed build until the owner merges and reruns combined acceptance. Shared live participation, server permissions, real file service/recovery, full rulebook governance and UHV source/rights (OD.13) remain open.

**15 October isolated Assembly note:** [Package 05 acceptance](PACKAGE_05_ASSEMBLY_ACCEPTANCE_2026-10-15.md) records branch `agy/j-20261014-175950-wk2n` with four roles, six stages and dissent preservation; its independent build, 173 unit tests and 17 browser tests passed. The root/deployed comparison above has not changed. Reservation enforcement and combined/deployed acceptance remain open.

**15 October isolated Workspace and Passport note:** [Package 06 acceptance](PACKAGE_06_WORKSPACE_ACCEPTANCE_2026-10-15.md) and [Package 07 acceptance](PACKAGE_07_PASSPORT_ACCEPTANCE_2026-10-15.md) record the unmerged feature chain through `agy/j-20261015-101359-krqe`. The latest isolated branch passed independent build, 204 unit tests and 21 browser tests. It adds private fictional Workspace access and traceable Passport/Credits, but does not change the root or deployed comparison above. Reservation enforcement, combined acceptance and deployed verification remain open.

**15 October isolated Workspace note:** [Package 06 acceptance](PACKAGE_06_WORKSPACE_ACCEPTANCE_2026-10-15.md) records branch `agy/j-20261015-085907-5uxl` with an invite-only private Jaipur room, username invitation, rule acknowledgement and scoped moderation; its independent build, 197 unit tests and 19 browser tests passed. The root/deployed comparison above has not changed. Server-enforced access and combined/deployed acceptance remain open.

---

## 23 October 2026 audit appendix: Master PRD v3.1 route, control, and demo-boundary reconciliation

### 1. Audit Context and Governing Authority

- **Audit Date:** 23 October 2026
- **Governing Baseline:** [Master PRD Archive v3.1](../reference/JanSahabhag_2047_MASTER_PRD_v3.1_LOSSLESS_ARCHIVE.docx), opening §§1–3, Part A §§A1–A21, Part B §§1–15, Part C §§1–15; [Supplementary PRD v2.0 on 33% Women's Reservation](../reference/JanSahabhag_2047_Supplementary_PRD_33pct_Womens_Reservation_v2.docx).
- **Repository Checkout:** Audit branch `agy/j-20261022-232747-tao3` was merged into `autobuild`. The combined checkout builds and passes 532 unit/UI tests across 39 suites (`npm run test:run`). The complete 38-check browser suite was run on 23 October: 35 passed first run, and the three checks with stale labels or an unsupported CSV fixture passed after test-only repairs. Repeat the full suite after final quality integration.
- **Owner Overrides Recorded from [Product Decisions](../decisions.md):**
  1. *Delivery & Competition Target (OD.1, OD.3):* The target is the connected single-browser competition demo for Hack for Social Cause (HSC portal submission completed; team preparing for next stage). Youth Parliament and Stakeholder Routing are explicitly approved as labelled clickable prototypes.
  2. *Story & Data (OD.2, OD.9):* Fictional Jaipur pedestrian-safety story (Aarav Sharma, Navchetna Public School); fictional seed data only. Real participant or pilot data collection is not approved.
  3. *Architecture & Persistence (OD.14):* Single-browser client simulation using `localStorage` and `IndexedDB`. Zero server backend, zero multi-user real-time sync, and no server-side route guards.
  4. *Media & Bandwidth (OD.4):* Text-first deliberative chamber with labelled video preview. Live WebRTC/video providers are deferred to future production.
  5. *Workspace Scope (OD.5):* Fictional Jaipur Workspace is invite-only and private. Other workspace access policies remain open.
  6. *Founder & Developer Identity (OD.6, 22 Oct 2026):* Confirmed Nazim M. Sandh as Founder and Visesh Akbari as Developer (technical system builder only, no idea credit). Contact email `nazimsandhbehappy@gmail.com` added to `/about`. The owner explicitly removed extended founder biographies from scope; an extended bio is not pending.
  7. *Language (OD.8):* Working Jaipur demo is English only. Hindi and Rajasthani selectors remain disclaimed and pending qualified bilingual review; no unwired strings are claimed as translated.
  8. *AI Governance (OD.10):* Local deterministic AI mock with illustrative disclaimer and grantee matching; no live third-party LLM API or live provider key is integrated.
  9. *33% Women's Reservation Policy (OD.15–OD.19):* Applied to every named role and limited place in the fictional demo (Assembly roles, Debate roles, capacity-limited events) using `ceil(0.33 × allocated places)` per activity without pooling. Unmet places remain vacant; departures allowed only through simulated owner-approved exceptions with full audit records. Real-world gender collection or inference is forbidden.
  10. *Participant Age Policy (21 & 22 Oct 2026):* All fictional seed personas set to age ≥ 18 (Aarav Sharma updated to 18). Real-world minor safeguarding, age-aware contact controls, and parental consent workflows remain production requirements.
  11. *Civic Passport Credit Model (21 & 22 Oct 2026):* 10 starting balance, 1–2 credits earned per verified activity (+1 Learning, +2 Contribution [pending mentor review], +1 Observation, +2 Assembly joining, +1 Assembly contribution, +1 Collaboration, +2 Civic Action, +1 Reflection). Strictly 0 credits for private UHV reflections, retained dissent, and private debate journals.
  12. *Scoped Moderator Grants (22 Oct 2026):* Clearly labelled browser simulation of founder-controlled, scope-limited, expiring, and auditable moderator grants on `/admin/moderator-grants`.
  13. *Curriculum & Workshop Pause (OD.13, 22 Oct 2026):* Wait for Vadodara–Savli workshop source and confirmed attribution before building workshop activities; no new media.

---

### 2. Concrete Route Inventory (`src/app/router.tsx`)

A line-by-line syntax inventory of [src/app/router.tsx](../../src/app/router.tsx) accounts for exactly **63 declared route entries** (1 standalone, 1 root layout, 1 index child, 38 static child routes, 16 dynamic parameterized child routes, 5 alias redirects, and 1 catch-all fallback):

| # | Declared Path | Rendered Component | Master PRD Mapping & Status | Route Status & Guard Notes |
|---|---|---|---|---|
| 1 | `/demo-login` | `DemoLoginPage` | Part A §A6: Persona simulation | **Keep (Simulation):** Top-level persona switcher; client-side only. |
| 2 | `/` | `AppShell` | Opening §1: Platform shell | **Keep (Layout):** Top bar, sidebar, and breadcrumbs wrapper. |
| 3 | `(index) /` | `WelcomePage` | Opening §1, Part A §A3 | **Keep (Static):** Landing page with 5-stage method. |
| 4 | `welcome` | `WelcomePage` | Opening §1, Part A §A3 | **Keep (Static):** Canonical welcome and method route. |
| 5 | `about` | `AboutPage` | Part A §A5 (Founder Profile, OD.6) | **Keep (Static):** Founder & Developer cards; project email present; long biography removed by owner. |
| 6 | `onboarding` | `OnboardingPage` | Part A §A3, Part C §1 | **Keep (Static):** Role & interest onboarding flow. |
| 7 | `dashboard` | `ParticipantDashboardPage` | Canonical Learner Item 1 (Opening §1, §A4) | **Keep (Static):** Learner dashboard, task cards, rulebook trigger. |
| 8 | `profile` | `ProfilePage` | Canonical Learner Item 9 (Opening §1, §A4) | **Keep (Static):** Profile details, 18+ age flag, preferences. |
| 9 | `notifications` | `NotificationsPage` | Opening §1 (Utility) | **Keep (Static):** Notification list and activity alerts. |
| 10 | `learn` | `CoursesPage` | Canonical Learner Item 2 (Opening §1, §A4) | **Keep (Static):** Course catalog, category filter, rulebook trigger. |
| 11 | `learn/:courseId` | `CourseDetailPage` | Part B §9 (Civic Academy) | **Keep (Dynamic):** Course syllabus and module list. |
| 12 | `learn/:courseId/lesson/:lessonId` | `LessonPage` | Part B §9 (Civic Academy) | **Keep (Dynamic):** Lesson content, reflection, +1 credit claim. |
| 13 | `assignments` | `AssignmentsPage` | Canonical Learner Item 3 (Opening §1, §A4) | **Keep (Static):** General civic assignments list, rulebook trigger. |
| 14 | `assignments/:id` | `AssignmentDetailPage` | Part A §A11, Part B §12 | **Keep (Dynamic):** Assignment task brief and rubric. |
| 15 | `assignments/:id/submit` | `SubmitAssignmentPage` | Part A §A11, Part C §5 | **Keep (Dynamic):** Form, IndexedDB binary attachment up to 10 MB (legacy inline DataURL capped at 250 KB) via `evidenceAttachmentStore.ts`. |
| 16 | `participate` | `ActivitiesPage` | Opening §1, Part B §8 | **Keep (Static):** Legacy participation hub rendering ActivitiesPage. |
| 17 | `activities` | `ActivitiesPage` | Opening §1, Part B §8 | **Keep (Static):** Civic activities list. |
| 18 | `events` | `EventsPage` | Opening §1, Part B §8 | **Keep (Static):** Community events list with 33% reservation badge. |
| 19 | `events/:id` | `EventDetailPage` | Opening §1, Part B §8 | **Keep (Dynamic):** Event detail and RSVP with quota check. |
| 20 | `community` | `CommunityPage` | Canonical Learner Item 9 (Opening §1, §A4) | **Keep (Static):** Civic groups and Wall of Democracy feed. |
| 21 | `community/groups/:id` | `CommunityGroupDetailPage` | Part B §5, Part C §9 | **Keep (Dynamic):** Discussion group topics and thread viewer. |
| 22 | `assemblies` | `AssembliesPage` | Canonical Learner Item 5 (Opening §1, §A4) | **Keep (Static):** Youth Assembly list with 33% reservation check. |
| 23 | `assemblies/:id` | `AssemblyDetailPage` | Part A §A9 (Youth Assembly) | **Keep (Dynamic):** Assembly roadmap and 4-role allocation briefing. |
| 24 | `assemblies/:id/session` | `AssemblySessionPage` | Part A §A9 (Deliberative Chamber) | **Keep (Dynamic):** 6 stages, 4 role zones, dissent retention, rulebook. |
| 25 | `propositions/:id` | `PropositionDetailPage` | Part A §A9.6 (Propositions) | **Keep (Dynamic):** Proposition clauses, dissent record, final status. |
| 26 | `propositions/:id/revisions` | `PropositionRevisionsPage` | Part A §A9.6 (Revisions) | **Keep (Dynamic):** Amendment audit trail and dissent logs. |
| 27 | `projects` | `ProjectsPage` | Canonical Learner Item 8 (Opening §1, §A4) | **Keep (Static):** Civic projects list, rulebook trigger. |
| 28 | `projects/:id` | `ProjectDetailPage` | Part B §7.4 (Civic Innovation) | **Keep (Dynamic):** Project milestones, roster, and evidence feed. |
| 29 | `issues` | `CivicIssuesPage` | Part B §14 (Civic Issues Map) | **Keep (Static):** Issue observation cards and coordinates list. |
| 30 | `issues/:id` | `IssueDetailPage` | Part B §14 (Issue Detail) | **Keep (Dynamic):** Observation details and evidence submission. |
| 31 | `passport` | `PassportPage` | Canonical Learner Item 10 (Opening §1, §A4) | **Keep (Static):** 6-dimension credit radar, verified ledger, export. |
| 32 | `passport/credits` | `CreditsPage` | Opening §3, Part C §6 | **Keep (Static):** Dimension transaction ledger; 0-credit explanations. |
| 33 | `credits` | `Navigate to /passport/credits` | Alias route | **Keep (Alias):** Enforces canonical naming. |
| 34 | `passport/evidence` | `EvidencePage` | Part A §A11, Part C §5 | **Keep (Static):** Evidence vault, IndexedDB attachments, privacy levels. |
| 35 | `passport/achievements` | `AchievementsPage` | Part B §7.6 (Identity) | **Keep (Static):** Civic milestones and badge unlocks. |
| 36 | `labs/ideas` | `IdeaLabPage` | Part B §15 (Idea Lab) | **Keep (Preview):** Collaborative idea formulation preview. |
| 37 | `labs/research` | `ResearchLabPage` | Part B §7.4 (Research Lab) | **Keep (Preview):** Evidence synthesis preview. |
| 38 | `labs/policy` | `PolicyLabPage` | Part B §7.4 (Policy Lab) | **Keep (Preview):** Policy brief formulation preview. |
| 39 | `parliament` | `ParliamentPage` | Canonical Learner Item 6 (Opening §1, §A10) | **Keep (Prototype):** Labelled educational simulation per Opening §1. |
| 40 | `stakeholders` | `StakeholdersPage` | Opening §3, Part C §8 (OD.12) | **Keep (Prototype):** Labelled municipal routing preview. |
| 41 | `studio` | `StudioPage` | Part A §A4, Part B §8 | **Keep (Preview):** Content creator preview (Unguarded at router). |
| 42 | `debate-room` | `DebateRoomPreviewPage` | Canonical Learner Item 4 (Opening §1, §A8) | **Keep (Static):** Motion chamber, 33% quota tags, text mode toggle. |
| 43 | `debate-room/:id` | `DebateRoomPreviewPage` | Part A §A8 (Debate Room) | **Keep (Dynamic):** Contextual debate session room. |
| 44 | `events/:id/debate-room` | `DebateRoomPreviewPage` | Part A §A8 (Event Debate) | **Keep (Dynamic):** Event-linked debate room. |
| 45 | `debates` | `Navigate to /debate-room` | Alias route | **Keep (Alias):** Enforces canonical naming. |
| 46 | `workspace` | `WorkspacePage` | Canonical Learner Item 7 (Opening §1, §A12) | **Keep (Static):** Supervised room, discussions, task board, rules. |
| 47 | `workspace/:id` | `WorkspacePage` | Part A §A12 (Workspace Room) | **Keep (Dynamic):** Contextual workspace instance. |
| 48 | `workspaces` | `Navigate to /workspace` | Alias route | **Keep (Alias):** Enforces canonical naming. |
| 49 | `workspaces/:id` | `WorkspacePage` | Alias route | **Keep (Dynamic Alias):** Contextual workspace plural alias. |
| 50 | `uhv` | `CoursesPage` | Canonical Learner Item 11 (Opening §1, §A11) | **Keep (Static):** Dedicated UHV stream; non-scored 0-credit baseline. |
| 51 | `uhv/learn` | `Navigate to /uhv` | Alias route | **Keep (Alias):** Enforces canonical naming. |
| 52 | `help` | `HelpRulebooksPage` | Opening §1, Part A §A13 | **Keep (Static):** Comprehensive contextual rulebooks repository. |
| 53 | `settings` | `Navigate to /profile` | Alias route | **Keep (Alias):** Redirects to unified profile and preferences. |
| 54 | `institution/dashboard` | `InstitutionDashboardPage` | Opening §1, Part B §8 | **Keep (Static):** Cohort metrics (Unguarded at router). |
| 55 | `institution/participants` | `ParticipantsPage` | Part B §5 (Institution Roster) | **Keep (Static):** Student cohort management (Unguarded at router). |
| 56 | `institution/programmes` | `InstitutionProgrammesPage` | Part B §5 (Programmes) | **Keep (Static):** Institution-level programmes (Unguarded at router). |
| 57 | `admin/dashboard` | `AdminDashboardPage` | Opening §1, Part A §A6 (Owner Console) | **Keep (Static):** Command console, safety alerts (Unguarded at router). |
| 58 | `admin/programmes` | `AdminProgrammesPage` | Part A §A6, Part B §8 | **Keep (Static):** State mission programmes (Unguarded at router). |
| 59 | `admin/content` | `AdminContentPage` | Part A §A6, Part B §9 | **Keep (Static):** Course & task authoring (Unguarded at router). |
| 60 | `admin/moderation` | `AdminModerationPage` | Part A §A6, Part C §9 | **Keep (Static):** Moderation queue & escalations (Unguarded at router). |
| 61 | `admin/moderator-grants` | `AdminModeratorGrantsPage` | Part A §A6.3 (OD 22 Oct 2026) | **Keep (Static):** Scoped moderator grant simulation; creates `assignments`, `memberships`, or `named_session` scopes; revocation requires mandatory reason; client-stored audit log. |
| 62 | `analytics` | `AnalyticsPage` | Opening §3, Part A §A18 | **Keep (Preview):** Illustrative civic intelligence metrics. |
| 63 | `*` | `NotFoundPage` | System Error / Recovery | **Keep (Catch-all):** 404 error page with navigation recovery. |

---

### 3. Visible Point-of-Use Controls Inventory

The codebase implements explicit, point-of-use interactive controls across all primary user surfaces:

1. **Contextual Point-of-Use Rulebooks (`PointOfUseRulesButton.tsx`):**
   - *Placement:* Rendered on 12 module surfaces: Dashboard (`/dashboard`), Learn (`/learn`), Assignments (`/assignments`), Submit Assignment (`/assignments/:id/submit`), Assemblies (`/assemblies`), Assembly Session (`/assemblies/:id/session`), Debate Room (`/debate-room`), Parliament (`/parliament`), Projects (`/projects`), Community (`/community`), Passport (`/passport`), and Rulebooks (`/help`).
   - *Behavior:* Accessible modal dialog (`aria-haspopup="dialog"`, `aria-expanded`, Escape key close) displaying contextual procedure rules, conduct expectations, 33% seat quota notices (when applicable), and a deep link to `/help`.
2. **Youth Assembly Deliberative Chamber Controls (`AssemblySessionPage.tsx`):**
   - *Stage Progression:* 6 sequential stage navigation buttons (Frame, Think, Enable, Troubleshoot, Shape, Final Assembly). Stage advancement and closing are gated to the Chair/Facilitator persona (`user_rohan`).
   - *Role Zones & Prompts:* 4 non-hierarchical role zone triggers: Thinker (Framing Question / Root Cause), Enabler (Feasibility / Resource Factor), Troubleshooter (Failure Risk / Red-Flag Action), and Shaper (Policy Clause / Proposition Text).
   - *Dissent Retention:* Dedicated dissent input and preservation toggle. Preserved dissent records persist across proposition amendments and are exported into the final proposition object.
   - *Chamber Mechanics:* Clarification request queue, turn countdown timer, seating roster with active role indicators, and mock AI copilot suggestions.
3. **Debate Room Controls (`DebateRoomPreviewPage.tsx`):**
   - *Motion & Turn Controls:* Motion banner with current stage label, speaker spotlight, and countdown turn timer.
   - *Seating & Quota Display:* 5-category seating chart (Moderator, For, Against, Questioner, Audience) displaying participant initials, mic status, and explicit 33% reservation tags.
   - *Speaking Queue:* Ordered queue with join/leave queue action buttons.
   - *Bandwidth & Evidence Controls:* Text-First Active badge/toggle (OD.4) and tabbed evidence/sources drawer. Low-data mode preferences are managed in `SettingsModal` triggered from `SessionSeating.tsx`.
   - *Zero-Credit Journal:* Private reflection journal explicitly tagged with 0 civic credits.
4. **Assignment Submission & Evidence Controls (`SubmitAssignmentPage.tsx`, `EvidencePage.tsx`):**
   - *Attachment Controls:* Multi-format file attachment button backed by browser IndexedDB via `evidenceAttachmentStore.ts` with strict transaction completion, 10 MB binary attachment limit (legacy inline DataURL capped at 250 KB), and allowed format filtering (`.pdf`, `.jpg`, `.png`, `.mp4`, `.mp3`).
   - *Safeguarding Warnings:* Prominent face consent warning checkbox and session recording prohibition disclosure.
   - *Save & Submit:* Save Draft button (local persistence) and Submit Assignment button (+2 credits held in Pending status until mentor review).
5. **Supervised Workspace Controls (`WorkspacePage.tsx`):**
   - *Access & Policy:* Invite-only room banner with room rules acknowledgement modal.
   - *Collaboration Controls:* Persistent discussion thread message composer, Kanban task board status toggles, shared files attachment list, and member directory with 33% reservation status tags.
   - *Moderation Trigger:* In-room Report Issue / Moderation Escalation button.
6. **Youth Parliament Simulation Controls (`ParliamentPage.tsx`):**
   - *Chamber Controls:* Division / voting preview button, Order Paper panel toggle, Speaker spotlight, and Treasury/Opposition benches layout with 33% quota tags.
7. **Founder Scoped Moderator Grants Controls (`AdminModeratorGrantsPage.tsx`):**
   - *Grant Creator:* Modal form allowing the Platform Owner (`user_admin`) to select a grantee persona, choose a scoped role template, bind one of three supported scopes (`assignments`, `memberships`, or `named_session`), specify an expiry date, and provide a mandatory grant reason.
   - *Active Grants Ledger:* Interactive table displaying active grants with a Revoke action that requires a mandatory revocation reason.
   - *Audit Log:* Browser-local audit ledger stored in client `localStorage` (not an immutable or server-enforced log) tracking creation, revocation, and grant use events.
8. **Top Utility Bar Controls (`TopUtilityBar.tsx`):**
   - *Persona Switcher:* Modal dropdown selecting between 7 primary simulated personas.
   - *Data Reset:* Reset demo state trigger restoring initial database seed with reload confirmation.
   - *Notifications & Alerts:* Unread notification counter linking directly to `/notifications`.
   - *Language Selector:* Dropdown with English, Hindi (Demo), and Rajasthani (Demo); labelled illustrative pending bilingual review per OD.8.

---

### 4. Genuinely Missing Master PRD Items (Source Heading vs App File/Route)

The following 12 items represent material requirements from Master PRD v3.1 that are absent, simulated, or deferred in the current single-browser demonstration:

| ID | Requirement Area | Master PRD v3.1 Heading / Section | Current App File / Route Reference | Implementation Gap & Handover Status |
|---|---|---|---|---|
| **M.1** | Shared Live Session Engine & Real-Time Sync | Part A §A7 ("Shared Live Session Engine and Transitions"); §A20.2 | `src/app/router.tsx`; `src/services/demoRepository.ts`; `src/features/assemblies/AssemblySessionPage.tsx`; `src/components/layout/DebateRoomPreviewPage.tsx` | PRD specifies a single persistent Session Room object allowing authorized in-room mode switching ("Switch to Debate Room", "Switch to Youth Assembly") without dropping roster, chat, or files across connected participants. While `demoRepository.switchSessionMode` provides a local in-memory simulation that mutates a single session's mode between `debate_room`, `youth_assembly`, and `standard_meeting`, there is no real-time shared engine, WebSocket synchronization, or multi-user state coordination across clients. Furthermore, the UI routes (`/debate-room`, `/assemblies/:id/session`) operate as separate static pages. |
| **M.2** | Pop-Up Task Cards / Launch Panels on Dashboard and Lessons | Part A §A11 ("Assignments: Pop-Up Task Cards and Two Separate Types", §A11.1) | `src/features/dashboard/ParticipantDashboardPage.tsx`; `src/features/assignments/AssignmentsPage.tsx`; `src/features/learning/LessonPage.tsx` | PRD Part A §A11 requires accessible assignment pop-up/task-card launch panels directly from the learner dashboard, task lists, and lessons without navigating away. While popup task cards exist within specific deliberative chamber contexts (such as Debate Room), the general learner dashboard and lesson pages lack non-blocking launch panels and navigate away to full-page routes (`/assignments/:id`, `/assignments/:id/submit`). |
| **M.3** | Live External AI Providers & Governance Pipeline | Part A §A14 ("Role-Aware AI Assistant and AI Governance", §A14.1); Part C §10 | `src/services/roleAwareAiService.ts`; `src/features/administration/AdminDashboardPage.tsx` | PRD specifies replaceable external LLM provider interfaces (OpenAI, Gemini, Anthropic), automated data-tier redaction, and token cost tracking. App uses a local deterministic mock with illustrative disclaimer (OD.10); live provider integration is deferred. |
| **M.4** | Interactive GIS / Spatial Map Renderer | Part B §14 ("Civic Issues Map", §14.1–14.3) | `src/features/issues/CivicIssuesPage.tsx`; `src/types/domain.ts` | PRD specifies a geospatial issues map with 6 location privacy levels and spatial clustering. App stores lat/long metadata in seed data and renders a card list; no interactive map engine (Leaflet/Mapbox) or GIS query layer is integrated. |
| **M.5** | Cloud Resumable Binary Storage & Upload Protocol | Part A §A11, §A15; Part C §5 ("Evidence & Verification") | `src/features/assignments/SubmitAssignmentPage.tsx`; `src/services/evidenceAttachmentStore.ts` | PRD requires cloud object storage, chunked resumable upload (Tus/S3), virus scan, and storage access controls. App stores binary attachments locally in browser IndexedDB via `evidenceAttachmentStore.ts` (capped at 10 MB, with legacy inline DataURL limited to 250 KB); no cloud storage or resumable network upload exists. |
| **M.6** | Router-Level RBAC Guards & Server Authorization | Opening §1; Part A §A4; Part A §A6 ("Owner Console and Moderator Delegation") | `src/app/router.tsx` | PRD mandates hiding/blocking operational consoles without authorized scopes. App router exposes `/admin/*` and `/institution/*` statically without route guards or redirects; access control relies solely on UI sidebar filtering and persona disclaimer banners (OD.14). |
| **M.7** | Bilingual Hindi Content Localization | Opening §3; Part A §A15 ("Multilingual UX, Accessibility and Low Bandwidth"); OD.8 | `src/components/layout/TopUtilityBar.tsx`; `src/stores/authStore.ts` | PRD requires full English and Hindi coverage. Language dropdown sets `activeLanguage` in memory but is not connected to a translation dictionary; all UI copy remains English pending bilingual review per OD.8. |
| **M.8** | Real Participant Safeguarding & Minor Consent | Opening §2 ("Public launch gate"); Part C §1 ("Identity & Safeguarding") | `src/features/auth-demo/DemoLoginPage.tsx`; `src/types/domain.ts` | PRD Opening §2 and Part C §1 specify pre-launch legal review, age-tiered safeguarding, parental/guardian consent verification, and deletion/grievance workflows before public release. Fictional personas are constrained to age ≥ 18 for demo purposes; real-world participant safeguarding and minor consent remain future production work. |
| **M.9** | Live Municipal Stakeholder Dispatch Pipeline | Part A §A4; Part C §8 ("Stakeholder Engagement"); OD.3, OD.12 | `src/features/previews/StakeholdersPage.tsx` | PRD specifies automated routing to municipal departments with status updates. App implements a labelled clickable preview of department cards without external grievance API integration (OD.3, OD.12). |
| **M.10** | UHV Workshop-Based Content Expansion | Part A §A11.2; Part B §11; OD.13, OD 22 Oct 2026 | `src/features/learning/CoursesPage.tsx`; `src/data/seed/courses.ts` | PRD specifies a 7-day practice workshop curriculum for UHV. App provides a standalone UHV stream with placeholder seed courses; content expansion is paused per OD 22 Oct 2026 pending Vadodara–Savli workshop source and attribution. |
| **M.11** | Self-Service Platform Identity Management in Owner Console | Part A §A5 ("Founder Profile and Platform Identity"); OD.6, OD 22 Oct 2026 | `src/features/about/AboutPage.tsx`; `src/features/administration/AdminDashboardPage.tsx` | PRD Part A §A5 specifies managing platform identity, branding, and founder details via Owner Console > Platform Identity. App renders hardcoded confirmed details on `/about` with project contact email (OD.6), while an administrative self-service identity editor is absent. Long founder biographies were explicitly removed from scope by the owner. |
| **M.12** | Independent Production Verification of Civic Credits | Opening §3; Part C §§5–6 ("Civic Credits"); OD 21/22 Oct 2026 | `src/features/passport/PassportPage.tsx`; `src/services/demoRepository.ts` | PRD specifies 6 verification types, 5 verification levels, cryptographic signing, and an appeals workflow. App implements the approved credit arithmetic (10 start, 1–2 per task, pending facilitator review, 0 for UHV/dissent/debate), but verification is simulated locally without external cryptographic or institutional attestation. |

---

### 5. Placeholders for Materials Not Supplied

The following placeholders are deliberately maintained in accordance with owner instructions:
1. **Founder Profile (`/about`):** Confirmed cards on `/about` display portrait, name (Nazim M. Sandh), title ("Founder & Platform Owner"), and project contact email (`nazimsandhbehappy@gmail.com`). Extended founder biographies were explicitly removed from scope by the owner.
2. **UHV Workshop Source & Media Assets (`/uhv`):** Seed courses preserve textual placeholders. No workshop-specific exercises, audio, or video files are integrated pending the Vadodara–Savli workshop source and confirmed attribution (OD.13, 22 Oct 2026).
3. **Municipal Stakeholder Recipients (`/stakeholders`):** Department preview cards preserve illustrative contact routing without live municipal ticket dispatch (OD.12).
4. **Third-Party AI Inference Keys (`roleAwareAiService.ts`):** Deterministic mock responses operate without live API keys, displaying prominent illustrative notices (OD.10).

---

### 6. Competition-Demo Handoff Summary and Remaining Uncertainties

- **Competition-Demo Scope Completeness:** The connected single-browser demonstration path for the Jaipur pedestrian-safety story (Aarav Sharma: Learn → Observe Field Evidence → Deliberate in Youth Assembly with Dissent → Join Supervised Workspace → Civic Passport & Ledger) is fully implemented, internally consistent, and backed by 532 passing unit/UI tests across 39 suites. The 38 browser checks have been exercised on the combined checkout; three stale browser checks were repaired and passed individually, and the full suite will be repeated after final quality integration.
- **Demo vs. Production Boundary:** The codebase is strictly a client-rendered React/Vite demonstration using browser `localStorage` and `IndexedDB`. It does not possess server authority, multi-user concurrency, real-time synchronization, or external API connectivity.
- **Remaining Gaps and Uncertainties:**
  1. *Presentation Flow & Script:* The live five-minute judging demo script and stage navigation timing for HSC evaluation remain open.
  2. *Public Launch Roadmap:* Dates, hosting budget, backend stack selection (OD.14), legal/safeguarding audits, and bilingual reviewer appointment for production release remain undecided.
