# Product decisions and open owner inputs

**Implementation status, 17 October 2026:** The fictional Jaipur demo work, including the reservation rule for limited events, Assembly named roles and Debate named roles, is published from `autobuild`; see [the handoff](HANDOFF_2026-10-16.md). GitHub reported a successful Vercel production deployment, and the live About page was checked. Older statements below that say no reservation behavior is implemented describe the original 12 October baseline, not the current checkout. No real-data collection, server-side enforcement, or legal/public-launch approval follows from the demo work.

**Reviewed:** 12 October 2026. **Governing source:** [Master PRD archive](reference/JanSahabhag_2047_MASTER_PRD_v3.1_LOSSLESS_ARCHIVE.docx), opening §§1–3 and Part A. The file is named `v3.1`, but its internal version table says `v3.0 — Consolidated Master PRD`; the reason is not documented. This record does not treat archived v2.1 defaults as new owner approvals.

## Owner direction recorded 12 October 2026

- **Delivery target:** the next implementation pass is the connected competition demo, not the first multi-user release. This settles the immediate target but not the date, presentation script, or exact functional-versus-prototype boundary in OD.1–OD.3. The Master PRD's minimum connected journey still applies.
- **Reservation policy:** the owner approved the supplement's minimum 33% women's reservation **in principle** for applicable allocated places and formal positions (OD.15). The source file still bears its original "Proposed product requirement — owner approval required" label. The per-allocation formula and unfilled reserved-place rule were subsequently approved; demo exceptions and activity scope were decided on 15 October; real-data privacy and production boundaries remain open. No reservation behavior is implemented or claimed compliant.

## Further owner direction recorded 12 October 2026

- **Demo data and story:** use fictional demo data and the Jaipur pedestrian-safety story. This settles the example story in OD.2 but not the demo date or final acceptance sign-off.
- **Demo implementation mode:** keep a clearly labelled single-browser simulation. This settles the immediate backend choice for the demo; it does **not** satisfy the Master PRD's connected multi-user journey, durable shared data, or server-side authorization requirements. Preserve those as explicit gaps and do not describe this mode as a compliant connected demo or production release. Full-system backend architecture and budget under OD.14 remain open.
- **Reservation arithmetic:** use `ceil(0.33 × applicable allocated places)` for each applicable allocation, as proposed in Supplement §6. Do not pool places across activities. A later 15 October decision specifies the fictional demo scope and owner-approved exception path.
- **Gender data for this demo:** use fictional demo data only. No real participant gender collection or retention is approved; OD.18 remains open for a real release.

## Further owner direction recorded 13 October 2026

- **Unfilled reserved places:** when no eligible woman is available for a reserved place, leave that place unfilled. Do not silently transfer it to another category or pool it with a different activity. A later 15 October decision allows a documented departure only with explicit owner approval and an audit record.

## Further owner direction recorded 15 October 2026

- **Demo reservation scope (OD.19):** apply the 33% minimum separately to every named role and limited place in the fictional Jaipur demo. Open participation without allocated roles or places remains outside this allocation rule. Use `ceil(0.33 × allocated places)` for each applicable allocation; do not pool allocations.
- **Documented exceptions (OD.17):** the normal rule remains that an unmet reserved place stays vacant. A departure may be demonstrated only with explicit owner approval and an audit record containing reason, approver, time, policy version and outcome. The browser-only demo can simulate this approval but cannot provide server-enforced authority or a real-world policy approval.
- **Demo media (OD.4):** Debate Room and Youth Assembly are text-first; video may appear as a clearly labelled preview. No working video provider is required for the competition demo.
- **Jaipur Workspace access (OD.5):** the fictional demo room is invite-only and private. The invited user must confirm the destination and accept before joining. This decides the Jaipur room, not every future programme or room.
- **Competition timing (OD.1, historical note from 15 October):** prior to competition details confirmation, no fixed date or deadline had been supplied for this demo, keeping the five-minute journey as the acceptance target. (Reconciled 21 October 2026: official HSC initial portal submission deadline was 15 October 2026 and entry is already submitted).
- **Demo language (OD.8):** the fully working fictional Jaipur journey is English only for this competition demo. Mark Hindi content and interface coverage as pending bilingual review; do not present an unwired selector or machine text as reviewed Hindi. The full product's bilingual requirement remains open.

## Further owner direction recorded 21 October 2026

- **Participant persona age:** fictional Aarav Sharma updated to 18, still in Jaipur. Fictional seed records, Welcome page text, and tests are updated accordingly. Team eligibility under official Hack for Social Cause (HSC) rules (18–29 years, per https://mybharat.gov.in/pages/hack-for-social-cause) is distinguished from fictional persona character age; HSC age eligibility governs submitting team members, not fictional demo characters.
- **Civic Passport model:** 10 starting credits, 1–2 credits earned per task. This model is approved in principle by the owner, with full implementation recorded below on 22 October 2026.
- **Project license:** Apache 2.0 license approved for project distribution and code licensing.
- **Media assets policy:** no new UHV or real-person media for now; maintain existing placeholders and confirmed portraits only to protect privacy.
- **Founder contact method:** project-only contact email approved (no personal phone or email exposure); exact address string remains pending creation/confirmation.
- **Competition submission status (HSC):** entry has already been submitted to the Hack for Social Cause portal and the team is preparing for the next stage. The official initial portal submission deadline was 15 October 2026 (source: https://mybharat.gov.in/pages/hack-for-social-cause).

## Further owner direction recorded 22 October 2026

- **Founder contact email:** owner supplied the exact project contact email `nazimsandhbehappy@gmail.com`. Added as a clear, accessible, mobile-responsive contact link on Nazim M. Sandh's founder card on `/about` (per previous decision opting for a publicly displayed project contact once supplied, without adding contact links to Visesh's card or altering ideation/developer credits).
- **Civic Passport demo credit model implementation:** fully implemented the approved model. Every newly created participant starts with 10 credits via a single, verified, visible, idempotent `Starting balance: 10` transaction under the `Contribution` dimension. Subsequent activities award 1 or 2 credits (+1 Learning for completed lesson, +2 Contribution [held in Pending status until facilitator review] for assignment submission, +1 Observation for verified field evidence, +2 Deliberation for assembly admission/joining, +1 Deliberation for substantive contributions, +1 Collaboration for workspace actions, +2 Civic Action for completed project milestones, +1 Reflection for civic reflection). No-credit activities (private UHV reflections, retained dissent, and private Debate room journals) are strictly preserved at 0 credits. Seeded personas display 10 plus earned activity credits rather than forcing everyone to 10. Existing browser databases migrate safely and idempotently without duplicate initial balances or erasing earned/reversed/audited history.
- **Superseded branch:** this implementation supersedes unmerged branch `agy/j-20261021-195758-ohzp` (which updated Aarav Sharma's fictional age to 18 across seed users, Welcome page, and tests). All reviewed changes from that branch are incorporated without modification, preserving Aarav's fictional age at 18.

## Answered by the governing Master PRD

| Question | Answer | Source |
|---|---|---|
| Product identity and method | The product name is **JanSahabhag 2047**. The method is **Learn → Observe → Deliberate → Propose → Reflect**. | Opening §1; Part A §A3 |
| Learner navigation | Eleven entries, in order: Home, Learn, Activities & Assignments, Debate Room, Youth Assembly, Youth Parliament, Workspace, Labs & Projects, Community, Civic Passport, UHV / Jeevan Vidya. Profile, Notifications, Settings, Help/Rulebooks and language are utilities. | Opening §1, canonical-navigation row |
| Youth Assembly rules | Four non-hierarchical roles: Thinker, Enabler, Troubleshooter, Shaper. Six deliberation stages: Frame, Think, Enable, Troubleshoot, Shape, Final Assembly. Dissent is retained; consensus is not forced. | Opening §1; Part A §A9 |
| Competition demo boundary | A connected assignment → observation/evidence → session/Assembly → proposition with dissent → Workspace invitation/moderation → Passport journey is required. Youth Parliament may be a clearly labelled clickable prototype; stakeholder routing may be a clearly labelled prototype. Other simulation must be labelled. | Opening §§1–3 |
| Founder content before approval | Do not invent or publish identity fields. Keep the public profile unpublished or clearly marked as a placeholder until approved. A protected contact form is the default; a direct public email requires opt-in. | Opening §1; Part A §§A5, A21 |
| Privacy defaults | Workspace discovery is private or institution-scoped by default. Recording is off by default. AI and video providers remain behind replaceable interfaces pending selection. | Part A §A21, default-recommendations table |
| Full-system architecture | The current React/Vite app is a single browser-rendered demo using local browser storage. Real multi-user sessions, authenticated permissions, moderation, verification and shared persistence require server-side services for the Master PRD product. | Opening §2; Part A §§A6–A7, A16–A17; [repository architecture](architecture.md) |

## Owner decisions and remaining reviewer inputs

The PRD supplies requirements or safe defaults for some topics. The table tracks later owner decisions and the inputs still open. The numbers follow the 14 questions in [Rules & Requirements by Scope](../README_01_RULES_REQUIREMENTS_BY_SCOPE.md), §24.

| ID | Open decision | What the PRD already settles |
|---|---|---|
| OD.1 | **Resolved 21 October 2026:** Hack for Social Cause (HSC) initial portal submission is completed (deadline was 15 October 2026 per https://mybharat.gov.in/pages/hack-for-social-cause); team is preparing for next stage. | The five-minute demonstration was the initial acceptance target; initial portal entry is submitted and next stage preparation is active. |
| OD.2 | **Jaipur pedestrian-safety story selected;** final script and acceptance sign-off remain open. | The minimum connected journey is specified in the Master PRD; the chosen single-browser mode cannot prove shared participation. |
| OD.3 | Date-based functional versus prototype scope | Youth Parliament and stakeholder routing have explicit prototype allowances. Debate Room, Workspace invitation/moderation and the connected civic loop remain demo requirements. |
| OD.4 | **Text-first demo with labelled video preview approved, 15 October 2026.** | Working video is not required for the competition demo; the full product still needs the PRD media and fallback behavior. |
| OD.5 | **Fictional Jaipur Workspace is invite-only and private, 15 October 2026; other room policies remain open.** | Access must be scoped and configurable; the Workspace default remains private or institution-scoped. |
| OD.6 | **Resolved 22 October 2026:** Owner confirmed Nazim M. Sandh as founder and Visesh Akbari as the sole builder of the current demo's website and technical system, and supplied both portraits and links for About Us. Owner supplied the exact contact email `nazimsandhbehappy@gmail.com`, added to Nazim's card on `/about`. Visesh's public title is “Developer”; his contribution receives no idea/concept credit. | Longer biography and achievements remain unpublished until confirmed. Owner supplied GitHub and LinkedIn links for Visesh. |
| OD.7 | **Resolved 21 October 2026:** Product name and deployment address use `2047`. Vercel project `jansahabhag2047` serves `https://jansahabhag2047.vercel.app`; the former address permanently redirects to it. The GitHub repository was already named `jansahabhag-2047-demo`. | The local checkout moved to `jansahabhag_2047` after all 54 completed sub-agy worktree checkouts were removed; their branches and archived job files were preserved. A compatibility link keeps the Codex saved project path working until that entry is updated. Dated audit URLs remain historical evidence. |
| OD.8 | **Working Jaipur competition demo in English; Hindi pending bilingual review, confirmed 15 October 2026.** | English and Hindi remain the full-product baseline; Hindi needs a named bilingual reviewer before claiming complete coverage. An unwired selector is not translated content. |
| OD.9 | Existing non-demo data to preserve or migrate | This repository contains fictional local seed data; outside pilot data has not been inventoried. |
| OD.10 | AI provider and approved data/cost policy | Provider abstraction, data-tier restrictions and a kill switch are required; no provider is approved. |
| OD.11 | Available external educational/municipal integrations | Provider-neutral integration design is specified; availability and permissions are unknown. |
| OD.12 | Real stakeholder recipients and routing approval | The routing lifecycle is specified; live recipients and operating ownership are not. A labelled prototype is allowed in the demo. |
| OD.13 | Curriculum, UHV source, uploader and rights | UHV is a separate stream; its source, licence and approved content manager remain unconfirmed. |
| OD.14 | **Single-browser simulation chosen for the immediate demo;** full-system backend, budget, hosting and team capacity remain open. | The Master PRD requires server-side authorization and shared persistence for the connected product. |

Additional release inputs remain open: initial moderators and their scopes; minimum participant age, consent and safeguarding policy after qualified review; approved privacy/terms/grievance materials; and confirmation of whether the supplied archive should carry an internal `v3.1` label. These are not inferred from archived source copies.

## Supplementary policy approved in principle

The [Supplementary PRD v2.0 on 33% women's reservation](reference/JanSahabhag_2047_Supplementary_PRD_33pct_Womens_Reservation_v2.docx) explicitly says **“Proposed product requirement — owner approval required”** and extends, rather than replaces, the Master PRD. The owner approved the policy in principle on 12 October 2026. The remaining inputs from §9 require separate answers before the corresponding behavior can be fixed.

| ID | Open decision | What the supplement proposes or bounds |
|---|---|---|
| OD.15 | **Approved in principle, 12 October 2026:** adopt the minimum 33% rule across applicable allocated places and formal positions. | §§1–2 cover Parliament, Assembly, Debate Room, limited activities and delegations. Open participation without allocated places or roles is excluded. Fictional demo applicability was decided on 15 October; production applicability remains open. |
| OD.16 | **Rounding formula and unit approved:** `ceil(0.33 × applicable allocated places)` for each applicable allocation, including 1–3 places. No pooling across activities. | §6 proposes this formula per applicable allocation. Totals and selections would need revalidation when they change. No enforcement is implemented. |
| OD.17 | **Unfilled reserved places stay vacant by default; documented departure may be simulated only with explicit owner approval and an audit record.** | §§5–6 disallow silent bypasses. Each exception needs reason, approver, time, policy version and outcome, and must be labelled as an exception. The browser demo cannot prove real owner authority. |
| OD.18 | **Fictional data only for this demo.** Real declaration, access controls and retention remain open. | §7 prohibits inference from names, photographs, voices or proxies; aggregate compliance must not disclose individual gender information. |
| OD.19 | **For the fictional demo, cover every named role and limited place, including Assembly functional roles and capacity-limited events/programmes.** | §2 distinguishes open participation from limited selections and allocated roles. Any later production boundary still needs a separate policy review. |

**Pre-launch review:** §9 also calls for qualified legal review before public launch and does not claim that the same legal requirement applies universally. The Master PRD's legal and privacy launch gates remain open. No legal conclusion or owner approval is recorded here.

## Further owner direction recorded 22 October 2026

- **Demo participant ages:** every fictional demo participant must be at least 18. This extends the earlier Aarav-only age correction and applies to seed personas and visible demo signup copy. It does not set the real-participant age, consent or safeguarding policy for a future release.
- **UHV seven-day practice:** wait for the Vadodara–Savli workshop source and confirmed attribution before building workshop-based activities. No new media is approved; retain placeholders.
- **Scoped moderator grants:** include a clearly labelled browser simulation of founder-controlled, scope-limited, expiring and auditable moderator grants in the competition demo. Real authority enforcement remains a server-side task.
- **Publication:** after remaining owner-dependent items and the combined demo review are complete, the owner has approved pushing and deploying the accepted build. Do not publish intermediate unreviewed branches.
