# Pending Owner Inputs and Decisions Tracker (2026-10-21)

**Document Date:** 2026-10-21
**Scope:** Tracker distinguishing settled owner decisions from genuinely pending inputs, placeholders, and verification gates for JanSahabhag 2047.
**Operational Guidance:** No pending item in this document should block already authorized quick work or implementation passes for the competition demo.

---

## 1. Recently Confirmed Owner Decisions (Decided / Not Pending)

The following items are confirmed as decided and settled by owner direction. They must not be treated as pending inputs or reopened:

| # | Topic | Decision & Governing Source | Status / Date | Notes & Scope Boundary |
|---|---|---|---|---|
| 1 | **Demo Story & Location** | **Jaipur pedestrian-safety story** is approved for the connected demonstration. (Old Rajkot proposal was superseded and is not pending). | Decided (12 Oct 2026; confirmed 15 Oct 2026) | Supersedes earlier exploratory ideas or proposals. |
| 2 | **Demo Media Mode** | **Text-first with clearly labelled video preview** for Debate Room and Youth Assembly. | Decided (15 Oct 2026, OD.4) | No working video streaming provider required for competition demo. Full product media pipeline remains deferred. |
| 3 | **Demo Execution Mode** | **Labelled single-browser simulation** with fictional data for immediate demo pass. | Decided (12 Oct 2026, OD.14) | Settles immediate demo architecture; full multi-user server backend deferred. |
| 4 | **33% Women's Reservation Scope** | Applied across **every named role and limited place** in the fictional demo (Youth Assembly functional roles, Debate roles, limited events/programmes). Open participation excluded. | Decided (15 Oct 2026, OD.19) | Formula: `ceil(0.33 × places)` per applicable allocation; no pooling across activities. |
| 5 | **Unfilled Reserved Places Rule** | Unmet reserved places **remain unfilled by default**. Departures allowed only with **owner-approved audited exception** (recording reason, approver, time, policy version, outcome). | Decided (13 Oct 2026; refined 15 Oct 2026, OD.17) | Browser demo simulates this audit trail; server enforcement remains future work. |
| 6 | **Workspace Room Access** | Fictional Jaipur Workspace is **private and invite-only**. Invited user must confirm and accept before joining. | Decided (15 Oct 2026, OD.5) | Specific to Jaipur demo room; general room policy framework remains configurable. |
| 7 | **Language Scope for Demo** | **English-only fully working journey** for the competition demo. Hindi is marked as pending bilingual review (no machine translation or unwired selectors presented as reviewed). | Decided (15 Oct 2026, OD.8) | Full bilingual baseline deferred until qualified review. |
| 8 | **Technical Credit & Role** | **Visesh Akbari** is confirmed as **sole technical developer** of the website and technical system for the current demo. Public title: “Developer”. No ideation/concept credit. | Decided (16 Oct 2026, OD.6 / ABOUT_US_REVIEW_DRAFT) | Founder/initiator is Nazim M. Sandh. |
| 9 | **Civic Passport Credits** | **10 starting Passport credits**, earning **1–2 credits per task**. | Decided (21 Oct 2026) | Establishes deterministic initial and task credit values for Passport mechanics. Implementation is a separate task. |
| 10 | **Project License** | **Apache 2.0 license**. | Decided (21 Oct 2026) | Governs project distribution and code licensing. |
| 11 | **Media Assets Policy** | **No new UHV or real-person media for now**; keep existing placeholders and approved portraits only. | Decided (21 Oct 2026) | Protects privacy; prevents premature asset publication. |
| 12 | **Founder Contact Method & Email** | **Project contact email confirmed as `nazimsandhbehappy@gmail.com`** and added to Nazim M. Sandh's founder card on `/about` with `mailto:` link. (Previous decision approved project-only contact email; exact address supplied by owner on 22 Oct 2026). | Decided / Resolved (21 Oct 2026; address supplied 22 Oct 2026) | Public contact link displayed on founder card; no contact link or ideation credit added to developer card. |
| 13 | **Participant Persona Age** | **Fictional Aarav Sharma is 18, still Jaipur**. Fictional demo seed data, WelcomePage public copy, and welcome test updated to 18. Official Hack for Social Cause (HSC) source (https://mybharat.gov.in/pages/hack-for-social-cause) specifies team member eligibility age as 18–29. Submitting team eligibility is distinguished from fictional character age; HSC age eligibility governs submitting team members, not fictional demo characters. | Decided (21 Oct 2026) | Applies to fictional Aarav Sharma only; other fictional persona records remain unchanged. |
| 14 | **HSC Initial-Submission Status** | **Entry has already been submitted and the team is preparing for the next stage**. Per official HSC portal rules (https://mybharat.gov.in/pages/hack-for-social-cause), the initial portal submission deadline was 15 October 2026. Initial portal submission is settled; preparation for next stage is active. | Decided / Confirmed (21 Oct 2026) | Initial competition portal submission requirement is met and closed. Subsequent stage requirements will be tracked when announced. |

---

## 2. Genuinely Pending Owner Inputs & Placeholders

The following items are genuinely unresolved and require owner input, verification, or replacement:

| Item / Placeholder | Current State & Placeholder Used | What Will Replace It | Source / Governing Dependency | Priority / Impact on Quick Work |
|---|---|---|---|---|
| **Confirmed Spelling & Details: Debharish Magariya** | Name / contributor spelling unconfirmed in repo documentation. | Confirmed authoritative spelling and role/descriptor for Debharish Magariya. | Owner input pipeline | Low — Keep omitted or placeholder until confirmed. |
| **Vadodara–Savli Workshop Link** | No link or placeholder link in docs/UI. | Verified official link / documentation for the Vadodara–Savli workshop. | Project background / records | Low — Informational; does not block core demo. |
| **Consent & Licence for Future Real-Person Media** | No real-person media used beyond confirmed portraits; generic placeholders for UHV and other roles. | Documented written consent, image releases, and clear licensing terms before incorporating any real-person photos, audio, or video. | OD.13, OD.18, Supplementary PRD §7 | Medium — Blocks adding new real media; placeholders remain active. |
| **Bilingual Reviewer for Hindi** | Hindi language selector/content marked as pending bilingual review; demo operates in English. | Named qualified bilingual reviewer to validate UI translations, terminology, and content before activating Hindi. | OD.8, Master PRD Part A §A8 | Medium — Does not block English demo execution. |
| **Founder Biography & Presentation Claims Verification** | Omitted from `/about`; page shows only confirmed name, portrait, and role. | Verified factual wording for VBYLD 2026 rank, Prime Minister presentation incorporation, academic completion, and MY Bharat designations. | Website Handoff §6, `ABOUT_US_REVIEW_DRAFT.md` | Low — Keep biographical blurbs omitted until confirmed. |
| **Master PRD Version Label Reconciliation** | Archive file is named `v3.1_LOSSLESS_ARCHIVE.docx` but internally labeled `v3.0 — Consolidated Master PRD`. | Owner clarification on official version numbering (`v3.0` vs `v3.1`). | `docs/decisions.md` (Reviewed 12 Oct 2026) | Low — Editorial/documentation only. |
| **Production Backend Architecture & Budget (Post-Demo)** | Labelled single-browser simulation in local storage. | Selected cloud backend, hosting provider, shared persistent database, and operating budget for multi-user release. | OD.14, Master PRD §§1–2 | Post-demo roadmap; does not block competition demo. |
| **Real Participant Data & Gender Safeguarding Policy** | Fictional demo data only. | Formal privacy policy, participant age threshold, safeguarding rules, and non-inferred gender collection mechanisms. | OD.18, Supplementary PRD §7, §9 | Post-demo / Pre-launch requirement; strictly out of scope for demo. |
| **UHV Curriculum Source & Content Rights** | Distinct navigation stream; placeholder/unpublished content. | Confirmed curriculum source, licensing rights, and approved content manager for Jeevan Vidya / UHV modules. | OD.13, Master PRD Part A §A11 | Low for core civic loop; isolate stream until resolved. |
