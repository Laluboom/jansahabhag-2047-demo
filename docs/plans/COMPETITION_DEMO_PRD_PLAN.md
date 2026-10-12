# Connected competition demo — PRD implementation plan

**Status:** decision-gated draft, 12 October 2026. This is the current plan for the owner's chosen **connected competition demo**. The [historical browser-demo plan](../../IMPLEMENTATION_PLAN.md) describes what was built earlier; it is not the work order for this pass. No task below is marked implemented by this plan.

## Read in this order

1. [Master PRD archive](../reference/JanSahabhag_2047_MASTER_PRD_v3.1_LOSSLESS_ARCHIVE.docx): opening §§1–3 govern, Part A and retained Parts B/C provide detail. The archive appendices are historical copies.
2. [Scope guide](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md): find source sections and delivery priority.
3. [Reconciliation](../audits/MASTER_PRD_RECONCILIATION.md): see observed gaps, then recheck affected code and deployed behavior.
4. [Product decisions](../decisions.md): distinguish settled rules from owner inputs. The [reservation supplement](../reference/JanSahabhag_2047_Supplementary_PRD_33pct_Womens_Reservation_v2.docx) has in-principle policy approval, while its operating details remain open.
5. This plan: convert each agreed slice into a standalone `.subagy/plans/NN-*.md` task with file scope, executable acceptance commands and the exact approved rules. Follow the Autobuild method at `~/Softwares/sub-agy/AUTOBUILD-PROMPT.md` where available. Do not treat an agent's self-reported tests as verification.

## Current delivery boundary

The owner chose the connected competition demo on 12 October 2026, not the first multi-user release. The Master PRD still requires a narrow, truthful assignment → observation/evidence → shared session/Youth Assembly → proposition with dissent → Workspace invitation/moderation → reflection/Passport path. Youth Parliament and external stakeholder routing may be clearly labelled prototypes. The source also requires role separation, persistence, visible rulebooks, failure handling and a denied-access test for the connected path. Whether this pass adds a small backend or remains an explicitly limited browser simulation is pending owner direction; the latter would leave the PRD's server-side permission requirement unmet.

The reservation policy is approved in principle. Do not implement a fixed calculation, exception path, individual gender data collection or activity-specific enforcement until OD.16–OD.19 are decided. Any interim explanation should say the rule is planned and unenforced. Public-launch legal/privacy and safeguarding gates remain separate from demo completion.

## Work packages

| # | Work package and source | Concrete result | Depends on | Acceptance evidence |
|---|---|---|---|---|
| 00 | Finish Phase 0 audit (Master opening §2; scope A) | Route/control matrix with Keep/Change/Build/Remove/Not Verified, desktop/mobile evidence, auth/storage/API/deployment inventory, gap links and agreed five-minute story. [Live sample](../audits/PHASE0_LIVE_EVIDENCE.md) is only a start. | Demo date/story answers for final scope freeze | Review route matrix and evidence; `npm run build`, `npm run test:run`, `npm run test:e2e` establish the present baseline. |
| 01 | Canonical identity/navigation (Master opening §1; Part A §§A3–A4, A11) | Eleven learner entries in order, utilities separated, canonical five-stage method, distinct last UHV stream with clearly approved or placeholder content. | UHV content can remain unpublished until OD.13 | Desktop/mobile route checks, keyboard navigation and source-aligned assertions; `npm run build && npm run test:run`. |
| 02 | Connected-demo authority and persistence (Master §§1–2; Part A §§A6–A7, A16–A17) | Agreed identity/session mechanism, scoped permissions and durable shared records for the core journey; audit privileged changes and deny unauthorized access. Keep fictional demo accounts separate from real enrolment. | Backend/hosting choice, OD.5, OD.9 and relevant safeguarding inputs | API and permission tests, two-user state isolation, denied-access E2E, refresh/recovery; `npm run build && npm run test:run && npm run test:e2e`. |
| 03 | Assignment/observation/evidence (Part A §§A11, A20; Part C §5) | Accessible autosave/resume, actual evidence handling or explicit demo-only metadata, receipt/timestamp, review taxonomy and linked observation. | 02 for truthful shared verification | Submission/review/retry/recovery tests and no false `Verified` state; full build/unit/E2E suite. |
| 04 | Shared session, Debate Room and rulebooks (Part A §§A7–A8, A13) | One session context and mode transition preserving roster/agenda/evidence where allowed; usable text path; Debate motion/queue/stages; versioned rules at point of use. | 02; OD.4–OD.5 for media/access defaults | Session transition, permissions and fallback tests; desktop/mobile E2E; full suite. |
| 05 | Youth Assembly (Master opening §1; Part A §A9) | Four balanced Thinker/Enabler/Troubleshooter/Shaper zones, six canonical stages, Chair procedural powers, structured proposition, four response/outcome states and retained dissent. | 04; reservation role boundary under OD.19 before allocation enforcement | Stage/state and unauthorized-stage tests; dissent survives revision; mobile chamber E2E; full suite. |
| 06 | Workspace collaboration (Part A §§A12–A13, A20) | Username invitation, scoped membership/moderation and auditable actions attached to the demo proposition; private or institution-scoped discovery by default. | 02; OD.5 | Invite accept/deny, moderator scope, audit and recovery tests; full suite. |
| 07 | Passport and Credits truthfulness (Master §3; Part C §§5–6) | Connected reflection and evidence/status references; reviewer status distinguished from demo simulation; explainable credits with correction path where exposed. | 03, 05, 06 | Cross-record E2E proves the same participant's source links, reviewer action, dissent and reflection; full suite. |
| 08 | Reservation across allocations and rulebooks (supplement §§1–10) | Shared rule applied to every **applicable implemented** allocation flow, rulebook text, organiser/moderator/owner validation, recomputation, fictional compliant/noncompliant examples, privacy-aware aggregate report and audit. Future module coverage remains tracked rather than falsely marked complete. | OD.16–OD.19, 02, relevant allocation flows | Module-by-module and rulebook-by-rulebook checklist; rejected bypass, changed totals and open-participation tests; full suite. |
| 09 | Demo acceptance and handback (Master Part A §A20; scope T) | Five-minute story on desktop and mobile, clear DEMO/prototype labels, reset/repeatability, failure/recovery, low-bandwidth text participation, accessibility review and residual gaps listed. | 00–08 as selected for the agreed date | Owner scenario sign-off plus `npm run build && npm run test:run && npm run test:e2e`; manually inspect rendered deployed build. |

## Explicitly retained beyond this demo

The full product still needs server-backed multi-user governance, complete Parliamentary procedure, broader cohorts/competition and delegation workflows, stakeholder delivery, advanced Labs/Studio/analytics, provider integrations, Hindi content review, accessibility and safeguarding hardening, capacity/restore evidence, and legal/privacy/security launch reviews. The [scope guide](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#23-scope-v--full-system-later-phase-backlog) and [reconciliation](../audits/MASTER_PRD_RECONCILIATION.md) remain the source map for these requirements. A public demo URL is not public-launch approval for real participant data.

## Owner choices that can change this plan

- **Demo:** OD.1 date; OD.2 story/sign-off; OD.3 exact working/prototype boundary; OD.4 video; OD.5 session access; OD.14 hosting/budget/team. The backend choice is needed before package 02.
- **Reservation:** OD.16 formula/denominator; OD.17 exceptions and unfilled places; OD.18 declaration/access/retention; OD.19 which allocated roles and limited events are in scope.
- **Publication and content:** OD.6 founder facts; OD.7 domain; OD.8 Hindi reviewer/scope; OD.9 data migration; OD.10 AI provider; OD.11 integrations; OD.12 recipients; OD.13 UHV rights. These can use unpublished, fictional or labelled prototype states for the demo where the Master PRD permits, but cannot be silently asserted as completed.
