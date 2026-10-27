# JanSahabhag 2047 — Rules & Requirements by Scope

> Developer reference for implementation priority, scope, governing rules, and source lookup.

## 0. Source precedence

Use the documents in this order when making implementation decisions:

1. **Master PRD v3.1 Lossless Archive** — governing product specification.
   - Canonical decisions at the front override conflicting historical wording.
   - Archived appendices exist for traceability; they are not parallel governing specifications.
   - The supplied archive (local source document, not published here) is named `v3.1`, while its internal version table says `v3.0 — Consolidated Master PRD`. The discrepancy is unresolved; use its opening canonical rules and retained Parts A–C, and record any version decision separately.
2. **Cleaned Developer Start-Here Note (local source document, not published here)** — implementation/scoping guidance.
   - Use it to separate demo-critical, prototype, later-phase, and unresolved/owner-decision work.
   - It does **not** replace the Master PRD.
3. **Website Content & About Us — Developer Handoff (local source document, not published here)** — public-facing identity/content supplement.
   - Use for About Us / identity copy and presentation.
   - Public facts must still pass approval/verification requirements.

The Supplementary PRD v2.0 on 33% women's reservation (local source document, not published here) is a proposed extension whose policy the owner **approved in principle on 12 October 2026**. The owner later approved `ceil(0.33 × applicable allocated places)` for each allocation, vacant reserved places by default, and fictional demo data only. On 15 October the owner included every named role and limited place in the fictional demo and allowed only an explicit simulated owner-approved, audited exception. Real-data privacy and production applicability remain open. It does not replace the Master PRD. Its scope and current app gaps are in the [reconciliation](docs/audits/MASTER_PRD_RECONCILIATION.md#supplementary-proposal-33-womens-reservation); its decisions and pre-launch legal review are in [product decisions](docs/decisions.md#supplementary-policy-approved-in-principle).

### How to use these files for implementation

1. Read the Master PRD's opening rules and relevant Part A–C section for the feature. Use this scope guide to find its priority and source location.
2. Check the reconciliation for what the current demo actually lacks. Verify the affected screen and code before changing it; the audit is a dated comparison, not proof of current live behavior.
3. Check product decisions before fixing policy-dependent behavior. For the fictional demo, calculate separately for every named role and limited place, leave unmet reserved places unfilled, and allow a departure only with simulated owner approval and an audit record. Real gender-data handling and production applicability remain open; do not infer those rules from the arithmetic.
4. Use [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) only for the historical browser-demo architecture and sequencing. The [competition demo PRD plan](docs/plans/COMPETITION_DEMO_PRD_PLAN.md) maps governing work packages and the owner's immediate labelled single-browser mode; add executable task plans only after verifying the relevant source, code and approvals.

### Conflict rule

If two documents conflict:

- follow the **canonical Master PRD** for product behavior;
- preserve the conflict in the decision log;
- request an owner decision where the Master PRD leaves the matter unresolved;
- never silently merge incompatible requirements.

The [Master PRD reconciliation](docs/audits/MASTER_PRD_RECONCILIATION.md) corrects earlier scope-audit severity claims. [Product decisions](docs/decisions.md) separates PRD answers from owner inputs.

---

# 1. Priority model

| Priority | Meaning | Developer action |
|---|---|---|
| **P0 — Gate / non-negotiable** | Must be resolved or enforced before changing/building or before release | Verify, implement, test, document |
| **P1 — Demo-critical** | Must work end-to-end in the agreed demonstration | Build the smallest complete connected flow |
| **P2 — Demo-visible prototype** | May be shown honestly without full production integration | Label clearly as prototype/demo |
| **P3 — V1 / production foundation** | Required for broader first product release but not automatically for the first demo | Architecture-ready; schedule after P1 |
| **P4 — Later phase** | Retained full-product scope | Backlog with dependencies and acceptance criteria |
| **OD — Owner decision / unresolved** | Cannot safely be inferred from sources | Do not guess; use neutral placeholder only where approved |

---

# 2. Scope A — Governance, verification, and delivery gates

## P0 — Verify before changing

**Theme:** current-site audit, evidence discipline, change control  
**Primary source:** Master PRD §2, p.3; §A2, p.13; Start-Here §§1, 5, pp.1, 3

Requirements:

- Inspect the running site and available repository before treating a missing/changed feature as fact.
- Inventory:
  - routes/screens;
  - authentication states;
  - persistence/database behavior;
  - API wiring;
  - role/permission checks;
  - responsive/mobile behavior;
  - integrations;
  - deployment process;
  - tests.
- Classify each route/feature as:
  - **Keep**
  - **Change**
  - **Build**
  - **Remove**
  - **Not Verified / Not Verifiable**
- Record exact URL/route, date, component, reproducible steps, and screenshots where permitted.
- Do not infer backend absence from a missing dashboard control.
- Do not treat a visual placeholder as functioning implementation.
- Preserve valid existing regional/language content until reviewed.
- The owner resolved the product-name/deployment-address mismatch on 21 October 2026. Use the `2047` address recorded in [product decisions](docs/decisions.md); preserve dated audit evidence of the former address.

### Acceptance

Phase 0 is complete only when there is a route-level inventory, evidence-backed gap list, and decision log.

---

# 3. Scope B — Product identity, positioning, and canonical navigation

## P0 — Canonical identity

**Theme:** naming and product positioning  
**Primary source:** Master PRD §1, pp.1–2; §A3–A4, p.14

- Product name: **JanSahabhag 2047**.
- Product loop: **LEARN → OBSERVE → DELIBERATE → PROPOSE → REFLECT**.
- The platform is not merely:
  - an LMS;
  - a social network;
  - a debate app;
  - or a video-conferencing wrapper.
- It is a civic-learning and civic-participation ecosystem.

## P0 — Canonical learner navigation

**Master PRD §1, pp.1–2; §A4, p.14**

Required learner-facing order/names:

1. Home
2. Learn
3. Activities & Assignments
4. Debate Room
5. Youth Assembly
6. Youth Parliament
7. Workspace
8. Labs & Projects
9. Community
10. Civic Passport
11. UHV / Jeevan Vidya — last in learner-facing navigation

Utilities:

- Profile
- Notifications
- Settings
- Help / Rulebooks
- Language selector

Permission-gated:

- Institution
- Moderator Console
- Platform Owner Console
- Studio
- Analytics
- Audit Logs

Internal identifiers should remain stable even if configurable UI labels change.

---

# 4. Scope C — Smallest meaningful connected demo

## P1 — Required vertical slice

**Theme:** connected end-to-end demonstration  
**Primary source:** Master PRD §2, p.3; Start-Here §§2–3, 6–7, pp.1–4

The first demo should prioritize **one real connected journey**, not many disconnected mock screens.

Minimum connected flow:

1. signed-in demo participant;
2. opens one assignment;
3. saves/submits a response;
4. sees persisted status;
5. enters one structured session;
6. creates or links an observation/proposition;
7. preserves dissent where applicable;
8. completes reflection;
9. sees reviewed contribution/evidence/status in Civic Passport.

### P1 acceptance definition for “interconnected”

- User actions create persisted state changes.
- Related records reference one another.
- Navigation preserves relevant item/session context.
- Statuses are truthful: Draft, Submitted, Under Review, Verified, Rejected, Demo-only, etc.
- Authorization is enforced server-side/API-side, not only by hiding UI.
- At least one unauthorized-access case is tested.
- Demo uses fictional, clearly labelled seed data.
- Demo can be reset and repeated.

### P2 — May be prototype for demo

Examples from Start-Here §3, pp.1–2:

- stakeholder routing;
- advanced AI assistance;
- advanced analytics;
- integrations not yet configured.

Prototype behavior must be visibly labelled and must not imply real external processing.

---

# 5. Scope D — Identity, safeguarding, roles, and permissions

## P0 — Security and authority model

**Theme:** RBAC + ABAC, least privilege, safeguarding  
**Primary source:** Master PRD §1, p.2; §A6, pp.15–16; Operational §§1–3, pp.61–62

Requirements:

- Use scoped **RBAC + ABAC**.
- Permission decisions consider:
  - resource;
  - action;
  - institution;
  - programme;
  - event;
  - room;
  - content;
  - participant category;
  - age/safeguarding state;
  - ownership;
  - visibility;
  - grant expiry;
  - grantor;
  - reason.
- Default to least privilege.
- Moderators cannot self-grant permissions.
- Moderators do not gain global access by default.
- Privileged actions must be auditable.
- Adult–minor communication must be context-bound, permission-controlled, reportable, and auditable.
- Safeguarding administrators may apply restrictions; interventions must be logged.

## P0 — Platform Owner controls

**Master PRD §A6.1, p.15**

Owner-only or owner-governed capabilities include:

- platform identity/branding;
- moderator appointment/revocation;
- permission templates;
- institutions/programme policy;
- feature flags;
- default visibility;
- AI provider/data-flow configuration;
- safeguarding/moderation policy;
- platform-wide analytics;
- retention/export configuration;
- emergency restrictions.

High-risk changes require strong authentication and audit logging.

---

# 6. Scope E — Founder / public identity

## P0 — Publication controls

**Theme:** public identity, privacy, approval  
**Primary source:** Master PRD §1, p.2; §A5, pp.14–15; §A20.1, p.27; Start-Here §3–4, p.2

- Founder/public identity is managed content, not hard-coded identity data.
- Public founder profile and private account profile are separate objects.
- Owner must be able to:
  - edit;
  - preview;
  - publish;
  - unpublish;
  - revise/revert;
  - inspect audit history.
- Never expose private authentication/account metadata.
- Public email requires explicit opt-in.
- Contact form is the safer default where direct email publication is not approved.
- Uploaded portrait/media requires file-type validation, size limits, malware scanning, safe storage, image optimization, and alt text.
- Do not publish unapproved founder fields.

### OD — founder details

The content handoff supplies founder copy and a name, but the Start-Here note still requires confirmation of which founder/owner details are approved for public display.

Developer behavior:

- support the supplied content structurally;
- keep publication controlled;
- do not treat presence in a draft handoff as automatic public approval.

---

# 7. Scope F — Learning, assignments, and UHV

## P1 — Assignment foundation

**Theme:** assignments, persistence, accessible task flow  
**Primary source:** Master PRD §A11, pp.21–22; §A20.3, pp.27–28; baseline §§11–12, pp.34–35

General civic assignments support:

- instructions;
- deadlines;
- save/resume;
- autosave;
- response capture;
- evidence upload;
- submission;
- review status;
- feedback/revision.

Assignment UI must be keyboard accessible and must not trap users in forced modals.

Submission success should produce truthful persisted state and receipt/timestamp.

## P1/P3 — UHV / Jeevan Vidya

- UHV is a **distinct learning stream**, not a generic civic assignment bucket.
- Keep UHV content, reflections, assignments, and progress separate from general civic assignments.
- Do not grade ideological agreement.
- Do not fabricate personal experience.
- Confirm content source/curriculum/licensing with owner before production publication.

---

# 8. Scope G — Shared session engine

## P1 — Common session object

**Theme:** persistent live-session context  
**Primary source:** Master PRD §A7, pp.16–17; baseline §20, pp.40–41

Use one persistent `SessionRoom` / common session object with configurable modes such as:

- Standard Meeting
- Debate Room
- Youth Assembly
- Youth Parliament
- Workshop
- Research Session
- Consultation
- Competition
- Interview / Q&A

Mode transition must preserve, where permitted:

- session ID;
- roster;
- attendance;
- roles/lenses;
- agenda;
- relevant chat;
- files/evidence;
- proposition/document state;
- captions/transcript configuration;
- moderation history.

Recompute permissions when changing mode.

## P1 — graceful degradation

- Video is not mandatory for all participation.
- Provide audio/text and low-bandwidth paths.
- On provider/media failure, preserve core participation where possible.
- Do not leak provider-specific APIs into domain logic.

---

# 9. Scope H — Debate Room

## P1/P3

**Theme:** structured motion-centered discussion  
**Primary source:** Master PRD §A8, p.17

Required concepts:

- motion/question;
- configurable format/time limits;
- roles;
- speaking order/queue;
- evidence/source panel;
- moderated chat;
- visible rulebook;
- optional polls;
- reflection.

Polls must not be represented as public consensus or policy authorization.

State model:

`DRAFT → SCHEDULED → OPEN → MOTION_CONFIRMED → OPENING_STATEMENTS → DISCUSSION → REBUTTAL_OR_QUESTIONS → CLOSING_STATEMENTS → REFLECTION → CLOSED → REPORT_PUBLISHED (if enabled)`

---

# 10. Scope I — Youth Assembly

## P1 — core deliberation

**Theme:** four-role deliberative proposition-building  
**Primary source:** Master PRD §A9, pp.18–20; baseline §18, pp.37–40

Four **non-hierarchical** roles:

- Thinker
- Enabler
- Troubleshooter
- Shaper

Rules:

- roles define responsibility, not status;
- Chair/Co-Chair authority is procedural only;
- no role receives substantive veto power;
- preserve dissent and minority insight;
- do not force consensus;
- do not use simple majority as sole proposition-quality rule.

Main stages:

`FRAME → THINK → ENABLE → TROUBLESHOOT → SHAPE → FINAL ASSEMBLY`

Structured proposition includes:

- Question
- Problem
- Insight
- Proposition
- Enablers
- Risks
- Next Step
- Unresolved Questions
- Dissent

Participant response states:

- Support
- Support with reservations
- Dissent
- Abstain / insufficient basis

Possible outcomes:

- Consensus
- Qualified Support
- Split Decision
- Insufficient Basis

## P1 — demo UI

Four role zones should have balanced visual weight. Mobile must reflow rather than shrinking an illegible desktop room.

---

# 11. Scope J — Youth Parliament

## P2/P3 unless explicitly chosen for P1

**Theme:** educational parliamentary-procedure simulation  
**Primary source:** Master PRD §A10, pp.20–21

- Must remain distinct from Youth Assembly and Debate Room.
- Must not imply official government authorization or political endorsement.
- Chamber layout and procedure are configurable.
- Parliamentary roles/tools may include Speaker/Chair, members, motions, amendments, committees, queue, voting where configured.
- Real chamber insignia/official claims must not be hard-coded.

For the competition demo, it should be either:
- a working feature, or
- a clearly labelled clickable prototype.

---

# 12. Scope K — Workspaces

## P1/P3

**Theme:** institution, cross-institution, team and topic collaboration  
**Primary source:** Master PRD §A12, pp.22–23; §A20.4, p.28

Capabilities may include:

- workspace overview/purpose;
- owner/moderators;
- membership rules;
- username invites;
- join requests;
- member directory with privacy controls;
- persistent chat/channels;
- announcements/resources;
- moderated discussions;
- optional meetings using shared session engine.

Workspace moderators remain scoped to assigned workspaces.

Membership and moderation actions must be auditable.

---

# 13. Scope L — Rulebooks and in-product guidance

## P1

**Theme:** visible procedures at point of use  
**Primary source:** Master PRD §A13, p.23; §A20.5, p.28

Versioned contextual Rulebooks are required for relevant experiences, especially:

- Youth Assembly;
- Youth Parliament;
- Debate Room;
- Assignments;
- Workspaces.

Users should see rules before first substantive action and be able to reopen them while participating.

Material procedural changes require appropriate notice/acknowledgement.

---

# 14. Scope M — Civic Passport and Civic Credits

## P1 — Passport evidence/status

**Theme:** evidence-backed participant journey  
**Primary source:** Master PRD baseline §§24–25, p.44; Start-Here §§2–3, pp.1–2

Civic Passport is an evidence-based portfolio.

For the demo:

- show contribution/evidence/status truthfully;
- link Passport evidence to source activity;
- do not imply verification that did not occur.

## P3 — Civic Credits

Credits:

- must be evidence-based;
- are not a generic civic-worth, patriotism, ideology or conformity score;
- require explicit calculation, verification, correction/appeal, and anti-gaming rules.

Do not automatically award fake/demo credits without clear DEMO labelling.

---

# 15. Scope N — Issues, Labs, projects, stakeholders, competitions

## P4 unless selected for demo

**Theme:** broader civic ecosystem  
**Primary source:** Master PRD baseline §§14–17, pp.36–37; §§21, 26, pp.41–45

Retained scope includes:

- Civic Issues Map;
- Idea Lab;
- Research Lab;
- Policy Lab;
- Events/Programmes;
- Competitions;
- Civic Projects;
- stakeholder routing and response tracking.

Architecture should not make these future capabilities unnecessarily expensive, but do not build large generic workflow infrastructure before validating the core participant experience.

---

# 16. Scope O — AI governance

## P0 — safety/governance

**Theme:** human-in-the-loop AI  
**Primary source:** Master PRD §1, pp.2–3; §A14, pp.23–24; baseline §27, pp.45–46; Operational §10, p.63

AI may assist with:

- learning;
- assignments;
- evidence organization;
- summaries;
- role preparation;
- moderation triage;
- operational insights.

AI must **not** independently make final decisions on:

- identity/institution verification;
- serious sanctions;
- consequential grading;
- credit revocation;
- safeguarding;
- final propositions.

Requirements:

- disclose AI involvement;
- maintain human review/correction;
- apply permission filtering before retrieval;
- prevent AI from accessing content the user cannot access directly;
- use data-tier controls;
- block sensitive/minor/safeguarding data from external providers by default unless explicitly authorized and disclosed;
- maintain a non-AI fallback and kill switch.

---

# 17. Scope P — Privacy, security, safeguarding, auditability

## P0

**Theme:** production safety  
**Primary source:** Master PRD §A17, p.26; baseline §§30, 37, pp.48, 53–54; Operational §§1–4, pp.61–62

Minimum controls include:

- secure sessions;
- TLS;
- encryption at rest;
- MFA for privileged accounts;
- RBAC/ABAC;
- rate limiting;
- audit logs;
- secrets management;
- input validation;
- file/malware scanning;
- dependency scanning;
- SAST/DAST;
- retention/deletion controls;
- report/block/escalation workflows;
- incident response;
- least privilege.

### Public launch gate — P0

**Master PRD §2, p.3**

No public launch until appropriate review/testing covers:

- legal/privacy;
- security;
- safeguarding;
- consent/age handling where applicable;
- retention/deletion;
- grievance/contact process;
- incident response;
- provider/data-flow review.

---

# 18. Scope Q — Multilingual, accessibility, responsive and low bandwidth

## P0/P1

**Theme:** inclusive product behavior  
**Primary source:** Master PRD §A15, p.24; baseline §31, pp.48–49

- English and Hindi are baseline UI/content languages.
- Preserve contributor original-language text.
- Translation is derivative/labelled and must not overwrite source text.
- Audit existing regional/Rajasthani content before claiming absence/support.
- Target WCAG 2.1 AA.
- Provide:
  - keyboard navigation;
  - visible focus;
  - semantic structure;
  - screen-reader support;
  - contrast;
  - captions/transcripts where applicable;
  - reduced-motion support;
  - responsive layouts.
- Core participation must not require mandatory video.
- Uploads require progress, validation, recoverability, and resumable behavior where specified.

---

# 19. Scope R — Data model, APIs, realtime events, and architecture

## P3 foundation / P1 subset for demo

**Theme:** shared records and stable domain model  
**Primary source:** Master PRD §A16, pp.25–26; baseline §§34–36, pp.50–53

Important domain families include:

- Platform identity / founder revisions;
- permission grants/templates;
- audit events;
- session rooms/transitions/rosters;
- assignments/submissions/feedback;
- workspaces/memberships/invitations;
- Youth Assembly role/stage/proposition/dissent;
- parliamentary motions/amendments/votes;
- rulebooks/acknowledgements;
- AI interactions/provider/data policies.

Recommended approach:

- web-first, mobile-first PWA;
- modular backend;
- avoid premature microservice fragmentation;
- use provider-neutral adapters;
- document/version API contracts;
- keep data access tenant- and scope-aware.

For the demo, implement only the subset needed by the connected vertical slice, but do not use a data model that blocks retained future scope.

---

# 20. Scope S — Analytics and dashboards

## P3/P4

**Theme:** participant, facilitator, institution and platform insight  
**Primary source:** Master PRD §A18, p.26; baseline §32, pp.49–50

Retained analytics scope includes:

- participant progress/activity;
- assignments;
- sessions;
- role/lens distribution;
- institution/programme metrics;
- deliberation quality;
- platform/system health;
- inclusion;
- stakeholder response;
- civic-action conversion.

Do not overstate provisional scale/KPI targets until workload assumptions and test plans are documented.

---

# 21. Scope T — Testing, acceptance and Definition of Done

## P0/P1

**Theme:** evidence that a feature actually works  
**Primary source:** Master PRD §A20, pp.27–28; baseline §§42, 45, pp.56–58; Operational §18, pp.65–66

Every major feature should cover, where applicable:

- responsive UI;
- API/persistence;
- valid state transitions;
- authorization;
- validation;
- errors/failure states;
- notifications;
- auditability.

Testing should include:

- unit;
- integration;
- API;
- permissions;
- state machine;
- critical-path E2E;
- security;
- abuse/safeguarding for high-risk flows;
- load where appropriate;
- failure/recovery.

### Demo-specific E2E

Test the complete demo story on desktop and mobile, including:

- refresh/navigation;
- persistence;
- unauthorized access;
- failed save/recovery;
- repeatability/reset.

---

# 22. Scope U — Technical NFRs and reliability

## P3 production targets; verify assumptions before committing

**Theme:** performance, scale, recovery  
**Primary source:** Master PRD Operational §16, p.65; baseline §41, pp.55–56

The PRD contains provisional targets for:

- availability;
- registered users / DAU / concurrency;
- API latency;
- realtime event latency;
- upload size;
- messaging throughput;
- RPO/RTO;
- backup/restore;
- accessibility;
- low-bandwidth operation.

Important: the front-of-document readiness findings state that scale targets remain provisional until workload assumptions, load scripts, infrastructure sizing, monitoring thresholds, and restore tests are documented.

---

# 23. Scope V — Full-system later-phase backlog

## P4

Retain, but do not automatically include in the first demo:

- expanded institutional hierarchy/federation;
- full Civic Academy/Self-Growth content;
- Issues Map;
- Idea/Research/Policy Labs;
- competition engine;
- stakeholder routing and response tracking;
- advanced analytics;
- Studio/workflow builder;
- broad external integrations;
- national-scale optimization;
- advanced multilingual tooling;
- robust offline/sync behavior.

Primary references:
- Master PRD §2, p.3;
- §A19, pp.26–27;
- baseline §44, p.56;
- Operational §17, p.65;
- Start-Here §3, pp.1–2.

---

# 24. Owner decisions that must not be guessed

## OD

**Primary source:** Master PRD §A21, p.28; Start-Here §8, p.4

Confirm before locking scope where applicable:

- exact demo date;
- exact 5-minute demo story / acceptance criteria;
- which modules are fully functional vs prototype;
- whether video is required;
- session access policies: open, request-to-join, invite-only, institution-restricted;
- founder/public identity fields approved for publication;
- final domain/branding decision;
- languages required for demo;
- existing data that must be preserved/migrated;
- configured AI provider(s);
- external integration availability;
- stakeholder workflows;
- content/curriculum/licensing;
- budget/hosting/team capacity assumptions.

The reservation supplement adds five owner choices (OD.15–OD.19) and a pre-launch legal review; see [product decisions](docs/decisions.md#supplementary-policy-approved-in-principle). OD.15 was approved in principle. OD.16 uses the approved per-allocation formula. OD.17 leaves unmet reserved places vacant unless a simulated owner explicitly approves and audits an exception. OD.19 covers every named role and limited place in the fictional demo. Real-data aspects of OD.18 and production applicability remain open. These are separate from the original 14 Master PRD questions.

---

# 25. Fast source index by theme

| Theme | Master PRD reference |
|---|---|
| Canonical precedence | §1, pp.1–3 |
| Delivery gates | §2, p.3 |
| Readiness findings | §3, pp.3–4 |
| Product positioning/navigation | §A3–A4, p.14 |
| Founder/public identity | §A5, pp.14–15 |
| Owner/moderator permissions | §A6, pp.15–16 |
| Shared sessions | §A7, pp.16–17 |
| Debate Room | §A8, p.17 |
| Youth Assembly | §A9, pp.18–20 |
| Youth Parliament | §A10, pp.20–21 |
| Assignments/UHV | §A11, pp.21–22 |
| Workspaces | §A12, pp.22–23 |
| Rulebooks | §A13, p.23 |
| AI governance | §A14, pp.23–24 |
| Accessibility/languages/low bandwidth | §A15, p.24 |
| Data model/APIs/events | §A16, pp.25–26 |
| Security/privacy | §A17, p.26 |
| Dashboards/analytics | §A18, p.26 |
| Delivery plan | §A19, pp.26–27 |
| New acceptance criteria | §A20, pp.27–28 |
| Open decisions | §A21, p.28 |
| Baseline product definition | §§1–8, pp.29–33 |
| Civic Academy / Self-Growth / UHV | §§9–12, pp.33–35 |
| Contributions / Issues / Labs | §§13–17, pp.35–37 |
| Assembly / Parliament / Sessions | §§18–20, pp.37–41 |
| Events/community/passport/credits/projects | §§21–26, pp.41–45 |
| AI / Studio / notifications | §§27–29, pp.45–47 |
| Moderation/accessibility/analytics | §§30–32, pp.48–50 |
| Roles/data/architecture/APIs | §§33–36, pp.50–53 |
| Security/reliability/open source | §§37–38, pp.53–54 |
| State machines / user journeys | §§39–40, pp.54–55 |
| NFR / QA / risks / phases | §§41–44, pp.55–57 |
| Definition of Done | §45, pp.57–58 |
| Final product instruction | §46, pp.58–59 |
| Operational identity/privacy/data | Operational §§1–4, pp.61–62 |
| Operational evidence/credits/assembly | Operational §§5–7, pp.62–63 |
| Operational stakeholder/safety/AI | Operational §§8–10, pp.63–64 |
| Research/multilingual/offline/domain/KPI | Operational §§11–15, pp.64–65 |
| Technical NFR/MVP/acceptance | Operational §§16–18, pp.65–66 |
| Global product rules/architecture | Operational §§19–20, p.66 |

---

# 26. One-line implementation rule

**Build the smallest truthful, persistent, permission-safe civic participation loop first; keep the complete system architecture compatible with the retained Master PRD without pretending later-phase features are already implemented.**
