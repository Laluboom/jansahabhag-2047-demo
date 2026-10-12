# Product decisions and open owner inputs

**Reviewed:** 12 October 2026. **Governing source:** [Master PRD archive](reference/JanSahabhag_2047_MASTER_PRD_v3.1_LOSSLESS_ARCHIVE.docx), opening §§1–3 and Part A. The file is named `v3.1`, but its internal version table says `v3.0 — Consolidated Master PRD`; the reason is not documented. This record does not treat archived v2.1 defaults as new owner approvals.

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
| OD.1 | Exact competition/demo date | The five-minute demonstration is a target; no calendar deadline is approved. |
| OD.2 | Final demonstration story and acceptance sign-off | The minimum connected journey is specified; the owner has not approved the exact presentation script. |
| OD.3 | Date-based functional versus prototype scope | Youth Parliament and stakeholder routing have explicit prototype allowances. Debate Room, Workspace invitation/moderation and the connected civic loop remain demo requirements. |
| OD.4 | Whether live video is required in the competition demonstration | The product supports video with text/audio fallback; a demo provider and usage decision are not recorded. |
| OD.5 | Session access policy for each programme/room | Access must be scoped and configurable; the default for Workspace discoverability is private or institution-scoped. |
| OD.6 | Founder identity fields approved for publication | Unapproved fields remain unpublished; contact form is the safer default. |
| OD.7 | Final domain and the existing `2027` URL | Product name is `2047`; retaining, redirecting or replacing the URL is explicitly an owner choice. |
| OD.8 | Hindi content owner and competition-demo language scope | English and Hindi are the product baseline; Hindi needs a named bilingual reviewer. An unwired selector is not translated content. |
| OD.9 | Existing non-demo data to preserve or migrate | This repository contains fictional local seed data; outside pilot data has not been inventoried. |
| OD.10 | AI provider and approved data/cost policy | Provider abstraction, data-tier restrictions and a kill switch are required; no provider is approved. |
| OD.11 | Available external educational/municipal integrations | Provider-neutral integration design is specified; availability and permissions are unknown. |
| OD.12 | Real stakeholder recipients and routing approval | The routing lifecycle is specified; live recipients and operating ownership are not. A labelled prototype is allowed in the demo. |
| OD.13 | Curriculum, UHV source, uploader and rights | UHV is a separate stream; its source, licence and approved content manager remain unconfirmed. |
| OD.14 | Budget ceiling, hosting choice, credits and team capacity | The Master PRD explicitly leaves these unknown and requires estimates after inputs are supplied. |

Additional release inputs remain open: initial moderators and their scopes; minimum participant age, consent and safeguarding policy after qualified review; approved privacy/terms/grievance materials; and confirmation of whether the supplied archive should carry an internal `v3.1` label. These are not inferred from archived source copies.
