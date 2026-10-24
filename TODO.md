# Remaining work and handback

## Combined demo verification (24 Oct 2026)

- [x] Merge the four reviewed sub-agy branches for the landing page, session seating, evidence privacy, and title-first browsing into `autobuild`.
- [x] Production build and 533 unit/UI tests pass after the Debate Room popup, text-mode, role-aware AI, offline-evidence, React Router, and interface-quality merges.
- [x] Browser acceptance: all 38 checks pass on the final combined checkout, including the repaired evidence and Debate Room journeys.
- [ ] Inspect the combined build in the browser with the owner before publishing. The branch is local and ahead of `origin/autobuild`; these merges have not been pushed or deployed.

## Change Plan v2 and Review Additions

Source documents: `docs/reference/21-10-26/JanSahabhag 2047 — Change Plan v2.docx` and `JanSahabhag 2047 — Review Additions.docx`. Owner decisions in `docs/decisions.md` and `docs/plans/PENDING_OWNER_INPUTS_2026-10-21.md` override proposals in these source documents.

- [x] Landing page with civic loop, session tiles, Jaipur next event, and visible platform 33% inclusion rule.
- [x] Reusable seating modes for Debate Room, Youth Assembly and Youth Parliament, including accessible list views and privacy-safe allocation counts.
- [x] Title-first Assignments and Community browsing. (Historical 10-start, 1–2-credit model superseded on 24 October 2026 by 0 starting balance, max 5 demo Civic Credit Points linked to NEP idea).
- [x] Evidence privacy, consent and recording notices, report workflow, and guarded moderation queue for the browser demo.
- [x] Added contextual point-of-use Rules controls across Home, Learn, Assignments, Workspace, Projects, Community, Passport and UHV; preserved existing Debate, Assembly, Parliament and Event rules.
- [x] Added project team seats, milestone boards and joined-project Workspace tiles; preserved the invite-only Jaipur room and labelled single-browser simulation.
- [x] Added text mode, a low-data setting, sample turns and browser-local seat restoration scoped to each demo persona. Real multi-user reconnect continuity requires a backend.
- [x] Completed the Debate Room popup assignment journey, including atomic replacement of prior tasks and direct-route guards; reviewed the speaking/queue/vote controls against the plan.
- [x] Added browser-local IndexedDB evidence attachments for JPEG, PNG, MP3, MP4 and PDF up to 10 MB, with visible storage failures, teacher/mentor cohort uploads, review and Passport linkage. Remote sync still requires a backend.
- [x] Settle UHV/Jeevan Vidya and youth activities guidance (OD.13 / OD 24 Oct 2026): original platform wording inspired by the Vadodara Savli youth workshop presented by Nazim M. Sandh. Material by Ganesh Bagadia with credit line exactly: "Based on the Vadodara Savli youth workshop, material by Ganesh Bagadia." There is no workshop feature and no seven-day outline to wait for. Keep reflections private and credit-free (0 Civic Credit Points). Separate UHV file, images, and 1–2 workshop-owned YouTube videos/links to arrive later; current demo authorized with placeholders (no re-upload/copy). Ganesh role/org and permission unconfirmed (Nazim must ask before media/full launch).
- [x] Added deterministic role-aware AI demo suggestions with exact moderator-grant scope, fictional labels and human-decision boundaries. Founder video awaits approved media.
- [x] Built the owner-approved scoped moderator-grant simulation with audit, expiry, revoke and active-persona guards; production enforcement requires a backend.
- [x] Updated all fictional demo participant ages to 18+ and added demo sign-up age guard; kept the approved Jaipur story.
- [x] Reconciled the Master PRD route/control inventory in `docs/audits/MASTER_PRD_RECONCILIATION.md`.
- [x] Reviewed the dependency audit and upgraded React Router; shipped dependencies now report zero advisories. See `docs/audits/DEPENDENCY_REVIEW_2026-10-23.md`.
- [x] Accessibility and performance cleanup: moderator overlays gained dialog labels and keyboard focus handling; source lint has zero warnings and the main JS chunk is 449.58 kB. Repository lint still reports 23 test-file warnings (zero errors).

## After the competition demo

- [ ] Migrate Tailwind, Vite, and Vitest tooling with full regression checks; 13 development-only audit advisories remain.
- [ ] Before real participants, add authentication, server-enforced permissions, shared storage, real session continuity, media handling, moderation, analytics, privacy/safeguarding policy, and human review operations.
- [ ] Obtain bilingual review before enabling Hindi; the current working journey is English.
- [ ] Replace any media placeholders only after receiving the actual materials and permission to publish them.
