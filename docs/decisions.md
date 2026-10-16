# Product decisions and open owner inputs

**Implementation status, 16 October 2026:** The fictional Jaipur reservation rule has been implemented and independently tested for limited events, Assembly named roles, and Debate named roles in the isolated branch chain ending at `agy/j-20261016-073737-pt3p`; see [the handoff](HANDOFF_2026-10-16.md). These changes are not merged or deployed. The statements below that say no reservation behavior is implemented describe the original 12 October baseline, not the current isolated branch. No real-data collection, server-side enforcement, or legal/public-launch approval follows from the demo work.

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
- **Competition timing (OD.1):** no fixed date or deadline has been supplied for this demo. Keep the five-minute journey as the acceptance target without claiming a dated launch commitment.
- **Demo language (OD.8):** the fully working fictional Jaipur journey is English only for this competition demo. Mark Hindi content and interface coverage as pending bilingual review; do not present an unwired selector or machine text as reviewed Hindi. The full product's bilingual requirement remains open.

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

## Still requiring an owner or qualified reviewer

The PRD supplies requirements or safe defaults for some topics, but **does not record an owner choice** for these items. The numbers follow the 14 questions in [Rules & Requirements by Scope](../README_01_RULES_REQUIREMENTS_BY_SCOPE.md), §24.

| ID | Open decision | What the PRD already settles |
|---|---|---|
| OD.1 | **No fixed competition/demo date yet, confirmed 15 October 2026.** | The five-minute demonstration remains the acceptance target; no calendar deadline is approved. |
| OD.2 | **Jaipur pedestrian-safety story selected;** final script and acceptance sign-off remain open. | The minimum connected journey is specified in the Master PRD; the chosen single-browser mode cannot prove shared participation. |
| OD.3 | Date-based functional versus prototype scope | Youth Parliament and stakeholder routing have explicit prototype allowances. Debate Room, Workspace invitation/moderation and the connected civic loop remain demo requirements. |
| OD.4 | **Text-first demo with labelled video preview approved, 15 October 2026.** | Working video is not required for the competition demo; the full product still needs the PRD media and fallback behavior. |
| OD.5 | **Fictional Jaipur Workspace is invite-only and private, 15 October 2026; other room policies remain open.** | Access must be scoped and configurable; the Workspace default remains private or institution-scoped. |
| OD.6 | Founder identity fields approved for publication | Unapproved fields remain unpublished; contact form is the safer default. |
| OD.7 | Final domain and the existing `2027` URL | Product name is `2047`; retaining, redirecting or replacing the URL is explicitly an owner choice. |
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
