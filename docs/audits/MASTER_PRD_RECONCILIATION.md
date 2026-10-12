# Master PRD reconciliation with the current demo

**Reviewed:** 12 October 2026. **Source:** [supplied Master PRD archive](../reference/JanSahabhag_2047_MASTER_PRD_v3.1_LOSSLESS_ARCHIVE.docx), SHA-256 `e970f6c2a8495c9b1a70d81d363650e02e016c8511c750d4106fe28c1df8a4e6`. **Baseline:** `autobuild` at `c4e0861`, the earlier [scope-based gap audit](REQUIREMENTS_GAPS.md), and the current code. Three sub-agy accounts reviewed separate sections in isolated worktrees; their claims were checked against the DOCX and repository before inclusion here.

The Master PRD opening is the governing source. Part A updates it; retained Parts B/C supply detailed requirements. Appendices C–H preserve older documents for traceability and do not override the opening rules. The archive filename says `v3.1`, while its internal version table says `v3.0`; no supplied text explains the mismatch. [Product decisions](../decisions.md) records the unresolved version label and owner inputs.

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

## Scope and verification boundary

The repository is a single React/Vite browser-rendered demo. It has no production backend or server-rendered frontend. Its local records survive refresh in one browser, but do not provide authenticated, shared, durable participation across people or devices. Production scope requires server-side identity, scoped permissions, storage, session coordination, moderation, verification and audit services under Part A §§A6–A7 and A16–A17. The current deployment and test suite do not establish public-launch readiness.

This reconciliation is a document and code comparison. HTTP HEAD checks on 12 October 2026 returned 200 for the Vercel demo and GitHub repository, but did not test an interactive route. It did not complete the Master PRD Phase 0 live route/control inspection or a legal, security, accessibility or safeguarding review. Claims about live behavior beyond the inspected code remain unverified.
