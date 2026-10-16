# Phase 0 Complete Browser Route Evidence — Final Fictional Jaipur Demo Branch

**Date:** 16 October 2026
**Governing Authority:** [Master PRD Archive v3.1](../../docs/reference/JanSahabhag_2047_MASTER_PRD_v3.1_LOSSLESS_ARCHIVE.docx), opening §§1–3 and Part A §A2
**Executable Test Suite:** [e2e/phase0-browser-route-evidence.spec.ts](../../e2e/phase0-browser-route-evidence.spec.ts) (Automated Playwright Suite)
**Related Audit Records:** [PHASE0_ROUTE_CONTROL_MATRIX_2026-10-16.md](PHASE0_ROUTE_CONTROL_MATRIX_2026-10-16.md), [PHASE0_LIVE_EVIDENCE.md](PHASE0_LIVE_EVIDENCE.md)
**Execution Context:** Package 10B browser verification in isolated worktree (`j-20261016-151430-7j62`)

---

## 1. Executive Summary & Verification Boundary

This document records the **Phase 0 browser route verification and representative control checks** for JanSahabhag 2047 on the final fictional Jaipur demonstration branch.

### 1.1 Scope & Verification Boundary
All **60 declared router path patterns** in [src/app/router.tsx](../../src/app/router.tsx) were visited in an automated Playwright Chromium browser session across both **desktop (1280x800)** and **mobile (375x667)** viewports.

Every pattern was evaluated for the first three runtime checks below; the fourth is a sampled control check:
1. **Render or Redirect:** Route renders the expected component without crash or error boundary fallback, or cleanly executes declarative redirects.
2. **Absence of Infinite Spinners:** No persistent full-page loading fallback spinner (`.animate-spin.rounded-full.h-8.w-8`) remains after asynchronous mock data resolution.
3. **No Horizontal Layout Overflow:** Page content respects the viewport boundary (`scrollWidth <= innerWidth + 2px`), preventing horizontal drift on mobile and desktop.
4. **Visible Control Sample:** A named text target was looked for on each route. The test requires at least 55 of 60 targets per viewport; it does not prove every listed action works. Seven representative interactive flows are tested separately.

### 1.2 Boundary Disclaimer: Simulation Invariants vs Production Authority
> [!IMPORTANT]
> **Local Branch Verification Disclaimer:**
> All browser tests recorded herein were executed locally in headless Chromium against the interactive single-browser React/Vite demonstration using client `localStorage`.
>
> 1. **No Production Backend:** There are zero HTTP REST, GraphQL, or WebSocket servers. Data mutations and mock delays are client-side simulations.
> 2. **Client-Side Simulation Only:** Route access, persona switching, and role perspectives are simulated in browser memory; no cryptographic tokens or server RBAC guards are enforced.
> 3. **No Claim Regarding Older Deployed Site:** This local browser run verifies branch `agy/j-20261016-151430-7j62` and does **not** certify or reflect the older deployed Vercel site (`c4e0861` observed 12 October 2026). Public deployment remains subject to separate user-controlled publication.

---

## 2. Test Execution Summary

| Metric | Result | Status |
|---|---|---|
| **Router Path Patterns Visited** | **60 of 60** | **Render, spinner, and overflow checks complete** |
| **Visible Control Targets** | **At least 55 of 60 per viewport required by test** | **Exact observed count and absent targets were not recorded; remaining controls are Not Verified** |
| **Desktop Viewport Run (1280x800)** | 60 Passed / 0 Failed | **Pass** (Clean render, 0 spinners, 0 overflow) |
| **Mobile Viewport Run (375x667)** | 60 Passed / 0 Failed | **Pass** (Clean render, 0 spinners, 0 overflow) |
| **Privileged & Persona-Scoped Flow** | 4 Checks Passed / 0 Failed | **Pass** (Admin banner, Workspace denial, 33% quota denial, Chair advance) |
| **Interactive Controls & Lifecycle Flow** | 7 Checks Passed / 0 Failed | **Pass** (Lang switch, Mobile drawer trap, Autosave submit, Debate turn reload, Parliament modal, Admin filter, 404 return) |
| **Representative Screenshots Saved** | **20 PNG captures** | **Verified in `docs/audits/phase0-screenshots/`** |
| **Independent Playwright Rerun** | **4 cases passed (40.8s)** | **Local branch, 16 October 2026** |

---

## 3. Comprehensive 60-Route Browser Evidence Table

Every path pattern from `src/app/router.tsx` was verified in Chromium at seeded representative URLs:

| # | Path Pattern | Tested URL | Persona & Viewport | Render / Redirect | Infinite Spinner | Layout Overflow | Primary Control Target & State (behavior only where separately tested) | Test Suite Link | Screenshot Link | Disposition |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `/demo-login` | `/demo-login` | Public (1280x800, 375x667) | Rendered | None | Pass (0px) | 7 Persona selection cards, `Enter JanSahabhag` CTA | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L17) | [01-desktop-demo-login.png](phase0-screenshots/01-desktop-demo-login.png) | **Change** (Demo OIDC mock) |
| 2 | `/` | `/` | Aarav Sharma (1280x800, 375x667) | Redirects to `/dashboard` | None | Pass (0px) | Declarative index redirect | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L18) | — | **Keep** |
| 3 | `/welcome` | `/welcome` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | `Begin Aarav's Journey`, `Explore All Personas` | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L19) | — | **Change** (Founder card Build) |
| 4 | `/onboarding` | `/onboarding` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Civic track radios, `Complete Onboarding` | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L20) | — | **Change** (Consent workflow) |
| 5 | `/dashboard` | `/dashboard` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | `Continue Learning`, `Civic Passport`, 5-stage loop | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L21) | [02-desktop-dashboard.png](phase0-screenshots/02-desktop-dashboard.png)<br>[02-mobile-dashboard.png](phase0-screenshots/02-mobile-dashboard.png) | **Keep** |
| 6 | `/profile` | `/profile` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Profile card, `Reset Demo Data` (Save Profile absent) | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L22) | — | **Change** (Durable data export) |
| 7 | `/notifications` | `/notifications` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Notification stream, `Mark all as read` | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L23) | — | **Change** (WebSocket SSE push) |
| 8 | `/learn` | `/learn` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Track tabs (`Civic Academy`, `Self-Growth`), Course cards | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L24) | — | **Keep** |
| 9 | `/learn/:courseId` | `/learn/course_civic_obs_01` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Course syllabus, `Enrol in Course` / `Completed` badge | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L25) | [03-desktop-learning-course.png](phase0-screenshots/03-desktop-learning-course.png) | **Keep** |
| 10 | `/learn/:courseId/lesson/:lessonId` | `/learn/course_civic_obs_01/lesson/les_obs_101` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Lesson body, `Lesson Completed (+5 Credits)` | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L26) | [04-mobile-learning-lesson.png](phase0-screenshots/04-mobile-learning-lesson.png) | **Keep** |
| 11 | `/assignments` | `/assignments` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Filter tabs (`Pending`, `Reviewed`), Assignment list | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L27) | — | **Keep** |
| 12 | `/assignments/:id` | `/assignments/asg_obs_01` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Brief, Rubric, `Submission Receipt & Provenance Record` | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L28) | [05-desktop-assignment-detail.png](phase0-screenshots/05-desktop-assignment-detail.png) | **Keep** |
| 13 | `/assignments/:id/submit` | `/assignments/asg_obs_03/submit` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Notes textarea, Autosave badge, `Submit for Verification` | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L29) | — | **Keep** |
| 14 | `/participate` | `/participate` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Dual activity feed, quick links | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L30) | — | **Remove** (Legacy duplicate of `/activities`) |
| 15 | `/activities` | `/activities` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Stream cards, action category pills | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L31) | — | **Change** (Consolidate navigation) |
| 16 | `/events` | `/events` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Event cards, Filter tabs (`Upcoming`, `Past`) | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L32) | — | **Keep** |
| 17 | `/events/:id` | `/events/evt_jaipur_assembly_01` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | RSVP buttons (`Attending`), 33% Allocation card | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L33) | — | **Change** (Server allocation authority) |
| 18 | `/community` | `/community` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Community Circle cards, `Open Forum` button | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L34) | — | **Keep** |
| 19 | `/community/groups/:id` | `/community/groups/grp_jaipur_safe_streets` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Discussion feed, `Share update / Post message` input | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L35) | — | **Change** (Content moderation API) |
| 20 | `/assemblies` | `/assemblies` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Youth Assembly cards, status filter tabs | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L36) | — | **Keep** |
| 21 | `/assemblies/:id` | `/assemblies/assembly_jaipur_pedestrian_2026` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | 6-Stage roadmap, `Enter Live Deliberation Workspace` | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L37) | — | **Keep** |
| 22 | `/assemblies/:id/session` | `/assemblies/assembly_jaipur_pedestrian_2026/session` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Canonical 6-stage bar, 4 role zones, Dissent input | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L38) | [06-desktop-assembly-session.png](phase0-screenshots/06-desktop-assembly-session.png)<br>[07-mobile-assembly-session.png](phase0-screenshots/07-mobile-assembly-session.png) | **Change** (Live WebSocket sync) |
| 23 | `/propositions/:id` | `/propositions/prop_jaipur_pedestrian_01` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Proposition brief, Dissent records, `View Revision History` | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L39) | — | **Keep** |
| 24 | `/propositions/:id/revisions` | `/propositions/prop_jaipur_pedestrian_01/revisions` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Revision timeline, Version badges, `Back to Proposition` | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L40) | — | **Keep** |
| 25 | `/projects` | `/projects` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Action project cards, milestone bars | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L41) | — | **Keep** |
| 26 | `/projects/:id` | `/projects/proj_navchetna_crosswalk_01` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Milestone checklist, `Post Progress Update` | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L42) | — | **Change** (Municipal milestone verification) |
| 27 | `/issues` | `/issues` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Hazard map banner, `Report Danger Spot` CTA | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L43) | — | **Change** (GIS integration Build) |
| 28 | `/issues/:id` | `/issues/iss_01` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Danger spot details, Privacy badge, `Upvote Issue` | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L44) | — | **Change** (Municipal ticketing routing) |
| 29 | `/passport` | `/passport` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | 7-Dimension radar chart, `Export Passport` | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L45) | [08-desktop-passport-radar.png](phase0-screenshots/08-desktop-passport-radar.png) | **Keep** |
| 30 | `/passport/credits` | `/passport/credits` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Credit ledger, transparent formula, dimension breakdown | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L46) | [09-desktop-passport-credits.png](phase0-screenshots/09-desktop-passport-credits.png) | **Keep** |
| 31 | `/credits` | `/credits` | Aarav Sharma (1280x800, 375x667) | Redirects to `/passport/credits` | None | Pass (0px) | Declarative alias redirect | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L47) | — | **Keep** |
| 32 | `/passport/evidence` | `/passport/evidence` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Verifiable evidence cards, `Verified` chips | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L48) | — | **Keep** |
| 33 | `/passport/achievements` | `/passport/achievements` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Civic badge grid, `Unlocked` / `In Progress` status | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L49) | — | **Keep** |
| 34 | `/labs/ideas` | `/labs/ideas` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Prototype cards, `Submit Concept` mock button | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L50) | — | **Keep as Prototype** |
| 35 | `/labs/research` | `/labs/research` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Dataset cards, `Download Schema` mock button | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L51) | — | **Keep as Prototype** |
| 36 | `/labs/policy` | `/labs/policy` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Model bylaws preview, `Policy Draft` mock button | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L52) | — | **Keep as Prototype** |
| 37 | `/parliament` | `/parliament` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Chamber layout, `Inspect Rajasthan Motion #07` | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L53) | [10-desktop-parliament.png](phase0-screenshots/10-desktop-parliament.png) | **Keep as Prototype** |
| 38 | `/stakeholders` | `/stakeholders` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Municipal directory, Prototype disclaimer | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L54) | — | **Keep as Prototype** |
| 39 | `/studio` | `/studio` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Campaign creator, Authoring studio banner | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L55) | — | **Keep as Prototype** |
| 40 | `/debate-room` | `/debate-room` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Debate chambers list, 33% reservation banner | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L56) | — | **Keep** |
| 41 | `/debate-room/:id` | `/debate-room/sess_jaipur_01` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | `Text-First Active (OD.4)` badge, `Request Speaking Turn` | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L57) | [11-desktop-debate-room.png](phase0-screenshots/11-desktop-debate-room.png)<br>[12-mobile-debate-room.png](phase0-screenshots/12-mobile-debate-room.png) | **Change** (WebRTC / Live sync) |
| 42 | `/events/:id/debate-room` | `/events/sess_jaipur_01/debate-room` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Contextual debate chamber, `Text-First Active` tag | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L58) | — | **Change** (Event session backend) |
| 43 | `/debates` | `/debates` | Aarav Sharma (1280x800, 375x667) | Redirects to `/debate-room` | None | Pass (0px) | Declarative alias redirect | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L59) | — | **Keep** |
| 44 | `/workspace` | `/workspace` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Scoped room, `Team Notes & Actions`, `Members & Invites` | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L60) | — | **Keep** |
| 45 | `/workspace/:id` | `/workspace/ws_jaipur_school_safety` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Active room header, `Create Team Action / Note` | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L61) | [13-desktop-workspace-invited.png](phase0-screenshots/13-desktop-workspace-invited.png) | **Change** (Cryptographic invite authority) |
| 46 | `/workspaces` | `/workspaces` | Aarav Sharma (1280x800, 375x667) | Redirects to `/workspace` | None | Pass (0px) | Declarative alias redirect | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L62) | — | **Keep** |
| 47 | `/workspaces/:id` | `/workspaces/ws_jaipur_school_safety` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Workspace alias, `Team Notes & Actions` | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L63) | — | **Keep** |
| 48 | `/uhv` | `/uhv` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Dedicated UHV header, `Canonical Position 11` tag | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L64) | [14-desktop-uhv-isolation.png](phase0-screenshots/14-desktop-uhv-isolation.png) | **Keep** |
| 49 | `/uhv/learn` | `/uhv/learn` | Aarav Sharma (1280x800, 375x667) | Redirects to `/uhv` | None | Pass (0px) | Declarative alias redirect | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L65) | — | **Keep** |
| 50 | `/help` | `/help` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Procedural rulebook tabs (`Youth Assembly`, `Workspaces`) | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L66) | — | **Keep** |
| 51 | `/settings` | `/settings` | Aarav Sharma (1280x800, 375x667) | Redirects to `/profile` | None | Pass (0px) | Declarative alias redirect | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L67) | — | **Keep** |
| 52 | `/institution/dashboard` | `/institution/dashboard` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Navchetna Public School summary, `Cohort Roster` | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L68) | — | **Change** (Multi-tenant school RBAC) |
| 53 | `/institution/participants` | `/institution/participants` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Cohort student directory, `Export Roster` button | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L69) | — | **Change** (Child safeguarding redactions) |
| 54 | `/institution/programmes` | `/institution/programmes` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Institutional programmes, syllabus schedule | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L70) | — | **Change** (Server curriculum scheduling) |
| 55 | `/admin/dashboard` | `/admin/dashboard` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | `Simulated Session Role: Platform Admin (Aarav Sharma)` | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L71) | [15-desktop-admin-dashboard.png](phase0-screenshots/15-desktop-admin-dashboard.png) | **Change** (Server RBAC boundary) |
| 56 | `/admin/programmes` | `/admin/programmes` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Programmes table, status filters (`Active`, `Draft`) | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L72) | — | **Change** (Server publishing authority) |
| 57 | `/admin/content` | `/admin/content` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Curriculum modules list, lesson editor trigger | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L73) | — | **Change** (Content CMS editorial flow) |
| 58 | `/admin/moderation` | `/admin/moderation` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | Moderation case queue, `Open Cases` filter | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L74) | — | **Change** (Immutable audit ledger) |
| 59 | `/analytics` | `/analytics` | Aarav Sharma (1280x800, 375x667) | Rendered | None | Pass (0px) | `Local Institution Real-Time` / `National 2047 Preview` | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L75) | — | **Keep** (Labelled illustrative prototype) |
| 60 | `/*` | `/non-existent-route-slug-404` | Any user (1280x800, 375x667) | Rendered | None | Pass (0px) | `Path Not Found (404)`, `Return to Dashboard` | [Test](../../e2e/phase0-browser-route-evidence.spec.ts#L76) | [16-desktop-catchall-404.png](phase0-screenshots/16-desktop-catchall-404.png) | **Keep** |

---

## 4. Privileged & Persona-Scoped Route Analysis

Executable Playwright evidence in [e2e/phase0-browser-route-evidence.spec.ts](../../e2e/phase0-browser-route-evidence.spec.ts#L170-L233) evaluates allowed and denied behaviors:

### 4.1 UI Simulation vs Server Authorization (`/admin/dashboard`)
- **Direct Navigation as Youth Participant (Aarav Sharma):** Direct URL visit renders `State Command` with prominent amber simulation banner:
  `Simulated Session Role: Platform Admin (Aarav Sharma) — Role Switching Active`
- **Switch to Programme Manager (Dev Patel):** Banner and header reflect Dev Patel's perspective without page crash.
- **Finding:** Access control is cosmetic and informational only. The client application contains **no router guards or HTTP session validation**. A production launch requires server-side cryptographic JWT / session authentication.

### 4.2 Private Workspace Access Denial (`/workspace/ws_jaipur_school_safety`)
- **Denied Persona (Dev Patel):** Dev Patel is not an invited member. The view renders an explicit denial card:
  `Access Denied / Repository Error — This collaboration workspace is invite-only private and cannot be accessed without an invitation from room owners.`
  All substantive action buttons (`Create Team Action / Note`, member invite inputs) are suppressed.
  *Screenshot captured:* [17-desktop-workspace-denied-dev.png](phase0-screenshots/17-desktop-workspace-denied-dev.png)
- **Allowed Persona (Aarav Sharma):** Aarav is an active seeded member. Heading `Jaipur Ward 24 School-Zone Safety Workspace` and `Team Notes & Actions` tab render cleanly.
- **Finding:** Client-side invite check operates correctly for single-browser simulation. Production requires server-signed invitation tokens and encrypted room channels.

### 4.3 33% Mandatory Reservation Quota Denial (`/events/evt_jaipur_limited_05`)
- **Participant Persona (Aarav Sharma, male):** Small 3-seat demo event with 1 seat reserved for women and 2 ordinary seats already occupied. Clicking `Attending` triggers an immediate neutral restriction alert:
  `RSVP / Allocation Restriction — This RSVP cannot be accepted under current allocation rules. Ordinary places are fully allocated, and remaining capacity is reserved under statutory 33% minimum allocation policy.`
- **Privacy Preservation:** The restriction alert conveys denial neutrally without exposing attendee gender or demographic records. Clicking the dismissal button (`×`) closes the alert cleanly.
  *Screenshot captured:* [18-desktop-event-reservation-denied.png](phase0-screenshots/18-desktop-event-reservation-denied.png)
- **Finding:** The client simulation denies this RSVP without displaying attendee demographics. This browser check does not establish legal or production compliance; server-side allocation locking and privacy review remain necessary for a multi-user release.

### 4.4 Youth Assembly Stage Progression Control (`/assemblies/.../session`)
- **Participant Persona (Aarav Sharma, Thinker):** `Advance Stage` button is hidden from DOM. Participant can submit stage contributions and dissent.
- **Facilitator Persona (Rohan Mehta, Chair):** `Advance Stage` button renders, allowing procedural progression through the 6 canonical deliberation stages.

---

## 5. Representative Interactive Controls & State Lifecycle Evidence

Automated assertions in [e2e/phase0-browser-route-evidence.spec.ts](../../e2e/phase0-browser-route-evidence.spec.ts#L235-L312) exercised key lifecycle behaviors:

1. **TopUtilityBar Language Switching:**
   - Click `data-testid="language-selector-btn"`, select Hindi (`data-testid="lang-option-hi"`).
   - `हिन्दी (Pending Review)` badge renders in top navbar.
   - Switch back to English (`data-testid="lang-option-en"`); badge cleanly unmounts.
2. **Mobile Sidebar Drawer & Focus Trap:**
   - At 375x667 viewport, clicking `data-testid="mobile-menu-toggle"` opens `[role="dialog"][aria-label="Navigation drawer"]`.
   - Pressing `Escape` key closes the drawer and restores page focus.
   *Screenshot captured:* [19-mobile-navigation-drawer.png](phase0-screenshots/19-mobile-navigation-drawer.png)
3. **Field Observation Draft Autosave & Submission:**
   - Navigating to `/assignments/asg_obs_03/submit`, typing field notes triggers local debounce autosave notice: `Draft autosaved locally`.
   - Selecting evidence checkbox and clicking `Submit for Verification` navigates to `/assignments/asg_obs_03` with submitted status.
4. **Debate Room Speaking Queue Turn & Reload Persistence:**
   - On `/events/sess_jaipur_01/debate-room`, clicking `Request Speaking Turn` enqueues participant.
   - Full browser reload preserves queue state and chamber position from `localStorage`.
5. **Parliament Clickable Prototype Motion Modal:**
   - On `/parliament`, clicking `Inspect Rajasthan Motion #07` opens modal displaying key legislative clauses.
   - Clicking `Close Motion Brief` closes modal cleanly without URL changes.
6. **Admin Programmes Tab Filtering:**
   - On `/admin/programmes`, clicking `Active` filters table to active state programmes (`My Community, My Future`).
7. **Catch-All 404 Error Recovery:**
   - Navigating to `/non-existent-route-slug-404` renders `Path Not Found (404)`.
   - Clicking `Return to Dashboard` restores browser location to `/dashboard`.

---

## 6. Representative Screenshot Catalog

All 20 screenshots are stored in `docs/audits/phase0-screenshots/`:

| File Name | Route Pattern | Viewport | Descriptive Purpose |
|---|---|---|---|
| [01-desktop-demo-login.png](phase0-screenshots/01-desktop-demo-login.png) | `/demo-login` | Desktop (1280x800) | Standalone demo authentication & 7 persona switcher cards |
| [02-desktop-dashboard.png](phase0-screenshots/02-desktop-dashboard.png) | `/dashboard` | Desktop (1280x800) | Canonical 11-item sidebar, participant dashboard & civic loop |
| [02-mobile-dashboard.png](phase0-screenshots/02-mobile-dashboard.png) | `/dashboard` | Mobile (375x667) | Mobile viewport layout, bottom navigation bar, card stacking |
| [03-desktop-learning-course.png](phase0-screenshots/03-desktop-learning-course.png) | `/learn/:courseId` | Desktop (1280x800) | Course syllabus, lesson progression, enrollment status |
| [04-mobile-learning-lesson.png](phase0-screenshots/04-mobile-learning-lesson.png) | `/learn/:courseId/lesson/:lessonId` | Mobile (375x667) | Mobile lesson viewer, completion pill, credit reward |
| [05-desktop-assignment-detail.png](phase0-screenshots/05-desktop-assignment-detail.png) | `/assignments/:id` | Desktop (1280x800) | Submitted assignment brief, rubric & local receipt record |
| [06-desktop-assembly-session.png](phase0-screenshots/06-desktop-assembly-session.png) | `/assemblies/:id/session` | Desktop (1280x800) | Canonical 6-stage bar, 4 role zones, dissent capture |
| [07-mobile-assembly-session.png](phase0-screenshots/07-mobile-assembly-session.png) | `/assemblies/:id/session` | Mobile (375x667) | Responsive assembly deliberation chamber on 375px screen |
| [08-desktop-passport-radar.png](phase0-screenshots/08-desktop-passport-radar.png) | `/passport` | Desktop (1280x800) | 7-Dimension radar chart, verified civic timeline |
| [09-desktop-passport-credits.png](phase0-screenshots/09-desktop-passport-credits.png) | `/passport/credits` | Desktop (1280x800) | Explainable credit formula breakdown & transparent ledger |
| [10-desktop-parliament.png](phase0-screenshots/10-desktop-parliament.png) | `/parliament` | Desktop (1280x800) | National Youth Parliament prototype layout & tabled motions |
| [11-desktop-debate-room.png](phase0-screenshots/11-desktop-debate-room.png) | `/debate-room/:id` | Desktop (1280x800) | Text-First active chamber, speaking queue, role cards |
| [12-mobile-debate-room.png](phase0-screenshots/12-mobile-debate-room.png) | `/debate-room/:id` | Mobile (375x667) | Mobile debate chamber layout with zero horizontal overflow |
| [13-desktop-workspace-invited.png](phase0-screenshots/13-desktop-workspace-invited.png) | `/workspace/:id` | Desktop (1280x800) | Private invite-only workspace for active member Aarav Sharma |
| [14-desktop-uhv-isolation.png](phase0-screenshots/14-desktop-uhv-isolation.png) | `/uhv` | Desktop (1280x800) | Isolated UHV / Jeevan Vidya stream (Position 11 in navigation) |
| [15-desktop-admin-dashboard.png](phase0-screenshots/15-desktop-admin-dashboard.png) | `/admin/dashboard` | Desktop (1280x800) | State Command overview with simulation role banner |
| [16-desktop-catchall-404.png](phase0-screenshots/16-desktop-catchall-404.png) | `/*` | Desktop (1280x800) | Graceful 404 page not found with Return to Dashboard CTA |
| [17-desktop-workspace-denied-dev.png](phase0-screenshots/17-desktop-workspace-denied-dev.png) | `/workspace/:id` | Desktop (1280x800) | Private workspace access denied view for uninvited Dev Patel |
| [18-desktop-event-reservation-denied.png](phase0-screenshots/18-desktop-event-reservation-denied.png) | `/events/:id` | Desktop (1280x800) | 33% reservation quota restriction alert on full event |
| [19-mobile-navigation-drawer.png](phase0-screenshots/19-mobile-navigation-drawer.png) | `/dashboard` | Mobile (375x667) | Open mobile navigation drawer dialog with focus trap |

---

## 7. Audit Dispositions & Production Requirements Summary

Across the 60 audited route entries:
- **Keep (38 routes, 63.3%):** Retained in codebase. All 38 routes conform to canonical Master PRD §1 and §A4 navigation, 6-stage Assembly deliberation, explainable 7-dimension passport, point-of-use procedural rulebooks, or approved competition demo prototype allowances (`/parliament`, `/labs/*`, `/stakeholders`, `/studio`, `/analytics`).
- **Change (21 routes, 35.0%):** Validated in local single-browser execution, but require backend architecture before production release (replacing client persona simulation with real OIDC/SMS OTP, server-enforced RBAC, WebSocket synchronization for Assembly and Debate Room, server-authoritative reservation allocations, GIS server integration, and statutory child safeguarding workflows).
- **Remove (1 route, 1.7%):** `/participate` is a redundant legacy duplicate of `/activities` and should be deprecated or permanently redirected.
- **Build (Underlying Missing Capabilities):**
  1. *Production Backend API & Database:* Multi-device persistence, real RBAC session tokens, statutory data encryption at rest.
  2. *Live Video / Audio Infrastructure:* Connecting WebRTC / LiveKit / Agora behind the current text-first Debate Room.
  3. *Municipal Routing & Ticketing:* Formal API connector for municipal defect escalation.
  4. *Legal Age Verification & Guardian Consent:* Statutorily required verification workflows for participants aged 15–17.
