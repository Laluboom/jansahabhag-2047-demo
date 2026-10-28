# Remaining work and handback

## Combined demo verification (24 Oct 2026)

- [x] Merge the four reviewed sub-agy branches for the landing page, session seating, evidence privacy, and title-first browsing into `autobuild`.
- [x] Production build and 533 unit/UI tests pass after the Debate Room popup, text-mode, role-aware AI, offline-evidence, React Router, and interface-quality merges.
- [x] Browser acceptance: all 38 checks pass on the final combined checkout, including the repaired evidence and Debate Room journeys.
- [x] The owner reviewed the About page and approved the Rajkot merge. The Rajkot demo was merged, pushed, and deployed on 26 October 2026. The live alias serves the merged production bundle.

## Change Plan v2 and Review Additions

Source documents: `docs/reference/21-10-26/JanSahabhag 2047 — Change Plan v2.docx`, `JanSahabhag 2047 — Review Additions.docx`, and `docs/reference/24-10-2026/` (`JanSahabhag 2047 — Demo Personas.docx`, `JanSahabhag 2047 — Gratitude and Credits.docx`). Owner decisions in `docs/decisions.md` and `docs/plans/PENDING_OWNER_INPUTS_2026-10-21.md` override proposals in these source documents.

- [x] Landing page with civic loop, Rajkot session tiles, and visible platform 33% inclusion rule.
- [x] Reusable seating modes for Debate Room, Youth Assembly and Youth Parliament, including accessible list views and privacy-safe allocation counts.
- [x] Title-first Assignments and Community browsing. (Historical 10-start, 1–2-credit model superseded on 24 October 2026 by 0 starting balance, max 5 demo Civic Credit Points linked to NEP idea).
- [x] External About page updates (24 Oct 2026): added Yashvi Dalsaniya as Managing Partner with supplied portrait and description; added "With gratitude" section honoring 9 individuals led by late guide Shri Dadubhai Sandhar, closing lines, and Nazim's gratitude message; confirmed Visesh Akbari spelling.
- [x] Target demo transition recorded (24 Oct 2026): Rajkot college demo (Shri Manibhai Virani and Smt. Navalben Virani Science College (Autonomous), Rajkot) with Ankita Kapri as main student supersedes Jaipur as target demo (22 named demo people, 15 students aged 18+ with exactly 5 named women meeting 33% rule, 2 teachers, 1 principal, 1 special guest, 1 founder, 2 scoped moderators). The implementation was merged and deployed on 26 October 2026.
- [x] Evidence privacy, consent and recording notices, report workflow, and guarded moderation queue for the browser demo.
- [x] Added contextual point-of-use Rules controls across Home, Learn, Assignments, Workspace, Projects, Community, Passport and UHV; preserved existing Debate, Assembly, Parliament and Event rules.
- [x] Added project team seats, milestone boards and joined-project Workspace tiles; preserved the invite-only Rajkot room and labelled single-browser simulation.
- [x] Added text mode, a low-data setting, sample turns and browser-local seat restoration scoped to each demo persona. Real multi-user reconnect continuity requires a backend.
- [x] Completed the Debate Room popup assignment journey, including atomic replacement of prior tasks and direct-route guards; reviewed the speaking/queue/vote controls against the plan.
- [x] Added browser-local IndexedDB evidence attachments for JPEG, PNG, MP3, MP4 and PDF up to 10 MB, with visible storage failures, teacher/mentor cohort uploads, review and Passport linkage. Remote sync still requires a backend.
- [x] Settle UHV/Jeevan Vidya and youth activities guidance (OD.13 / OD 24 Oct 2026): original platform wording inspired by the Vadodara Savli youth workshop presented by Nazim M. Sandh. Material by Ganesh Bagadia with credit line exactly: "Based on the Vadodara Savli youth workshop, material by Ganesh Bagadia." There is no workshop feature and no seven-day outline to wait for. Keep reflections private and credit-free (0 Civic Credit Points). Separate UHV file, images, and 1–2 workshop-owned YouTube videos/links to arrive later; current demo authorized with placeholders (no re-upload/copy). Ganesh role/org and permission unconfirmed (Nazim must ask before media/full launch).
- [x] Added deterministic role-aware AI demo suggestions with exact moderator-grant scope, fictional labels and human-decision boundaries. Founder video awaits approved media.
- [x] Built the owner-approved scoped moderator-grant simulation with audit, expiry, revoke and active-persona guards; production enforcement requires a backend.
- [x] Updated all fictional demo participant ages to 18+ and added demo sign-up age guard; Rajkot now replaces Jaipur as the live story.
- [x] Reconciled the Master PRD route/control inventory in `docs/audits/MASTER_PRD_RECONCILIATION.md`.
- [x] Reviewed the dependency audit and upgraded React Router; shipped dependencies now report zero advisories. See `docs/audits/DEPENDENCY_REVIEW_2026-10-23.md`.
- [x] Community post reporting and its moderation queue path (27 Oct 2026): every post card on Community and on a group thread offers a Report action, reports become `community_post` moderation cases, and resolving a case as actioned withholds the post. Withholding is recomputed from every report on a post, so dismissing one report cannot republish a post another report removed, and withheld text is blanked in the repository read so no surface can leak it. Reporting is blocked for a post's own author and for the view-only special guest.
- [x] Accessible pop-up task card for general civic assignments (27 Oct 2026): opens on demand from the dashboard and from a lesson, showing objective, estimated time, due date with its timezone, rubric, accepted formats, evidence expectations and submission status, with a deep link to the full assignment page. The shared modal gained a focus trap, initial focus, guarded focus restoration and unique `aria` ids. UHV / Jeevan Vidya reflections are labelled, marked private and show no credit chip.
- [x] Accessibility and performance cleanup: moderator overlays gained dialog labels and keyboard focus handling; source lint has zero warnings and the main JS chunk is 449.58 kB. Repository lint still reports 23 test-file warnings (zero errors).

- [x] Gratitude list published at eleven names (27 Oct 2026): added Dilip Sandhar and Mungarbhai H. Sandh, keeping Shri Dadubhai Sandhar first and the owner-confirmed `Visesh Akbari` spelling. One open spelling question sits with the owner, recorded in `docs/decisions.md`.
- [x] Brand mark implemented (27 Oct 2026): Chaupal Ring plus the Shirorekha wordmark idea in `src/components/brand/`, with an `on-dark` variant for the sidebar and a five-dot favicon simplification. Trade mark review and the native-speaker spelling/script decision are still open before any brand file is final.
- [x] LOK MANCH-2047 published as its own page at `/lok-manch` (27 Oct 2026), linked once from About, with the owner's wording verbatim and the concept-under-development notice kept.
- [x] Reference source documents made local only (27 Oct 2026): untracked and ignored apart from `docs/reference/README.md`, with repository links repointed. No history rewrite, so earlier commits still contain them, and this only reaches the public repository on push.
- [x] Browser suite repaired (27 Oct 2026): four Playwright specs still asserted interface jargon that the 27 October copy repair had removed. The approved copy stands; the assertions were corrected. `docs/plans/QUICK_CHANGE_REGRESSION_CHECKLIST.md` now records the stale-preview-server, screenshot-overwrite and copy-drift traps.

## After the competition demo

- [ ] Migrate Tailwind, Vite, and Vitest tooling with full regression checks; 13 development-only audit advisories remain.
- [ ] Before real participants, add authentication, server-enforced permissions, shared storage, real session continuity, media handling, moderation, analytics, privacy/safeguarding policy, and human review operations.
- [ ] Obtain bilingual review before enabling Hindi; the current working journey is English.
- [ ] Replace any media placeholders only after receiving the actual materials and permission to publish them.
- [ ] Settle the next-stage deck: the owner's AI-assistance figure (about 60%, code only) is recorded, but the deck format and whether presentation materials are disclosed separately or folded into a revised figure are still with the owner.
- [x] Resolved 27 Oct 2026: scoped moderator `JS-M-002` and the person thanked in the gratitude list are the same person, and the correct spelling is **Dilip Sandhar**. The moderator roster, seed data, welcome copy, decisions record and README were corrected from `Sanghar`.
