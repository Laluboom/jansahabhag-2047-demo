# Remaining work and handback

## Combined demo verification (22 Oct 2026)

- [x] Merge the four reviewed sub-agy branches for the landing page, session seating, evidence privacy, and title-first browsing into `autobuild`.
- [x] Production build and 400 unit/UI tests pass on the combined checkout.
- [x] Browser acceptance: 37 of 38 tests passed first run. The sole failure was an ambiguous assembly test selector introduced by the new seat buttons; the selector was repaired and both assembly browser tests passed on rerun.
- [ ] Inspect the combined build in the browser with the owner before publishing. The branch is local and ahead of `origin/autobuild`; these merges have not been pushed or deployed.

## Change Plan v2 and Review Additions

Source documents: `docs/reference/21-10-26/JanSahabhag 2047 — Change Plan v2.docx` and `JanSahabhag 2047 — Review Additions.docx`. Owner decisions in `docs/decisions.md` and `docs/plans/PENDING_OWNER_INPUTS_2026-10-21.md` override proposals in these source documents.

- [x] Landing page with civic loop, session tiles, Jaipur next event, and visible platform 33% inclusion rule.
- [x] Reusable seating modes for Debate Room, Youth Assembly and Youth Parliament, including accessible list views and privacy-safe allocation counts.
- [x] Title-first Assignments and Community browsing. The 10-start, 1–2-credit Passport model was completed earlier.
- [x] Evidence privacy, consent and recording notices, report workflow, and guarded moderation queue for the browser demo.
- [ ] Finish a page-by-page point-of-use rules inventory; add missing contextual Rules controls to Home, Learn, Assignments, Workspace, Projects, Community, Passport and UHV where needed. Preserve existing Debate, Assembly, Parliament and Event rules.
- [ ] Add seating/team boards to Labs & Projects and Workspace. Keep the approved invite-only Jaipur room and labelled single-browser simulation.
- [ ] Add sample text mode, low-data setting and short text turns in session pages. Real reconnect continuity requires a multi-user backend.
- [ ] Complete the Debate Room popup assignment journey and check remaining speaker/queue/vote controls against the plan.
- [ ] Design offline evidence storage beyond the current small local browser attachments: MP3/MP4, stated size limits, teacher/mentor uploads, review and Passport linkage. IndexedDB and real sync require separate implementation.
- [ ] Prepare the seven-day UHV practice only after its source, attribution, spelling and rights are confirmed, or use explicitly provisional original content if the owner chooses that approach. Keep reflections private and credit-free.
- [ ] Add a role-aware AI mock within the approved human-decision boundaries, if needed for the demo. Founder video awaits approved media.
- [ ] Decide whether a scoped moderator-grant simulation belongs in this competition demo; production enforcement requires a backend.
- [ ] Verify all fictional persona ages if the owner adopts an 18+ demo policy; Aarav is already 18. Keep the approved Jaipur story.
- [ ] Reconcile the Master PRD route/control inventory and review the dependency audit deliberately.
- [ ] Accessibility and performance cleanup: 320 lint warnings in the main checkout (0 errors; full `eslint .` also scans sub-agy worktrees), and a 652.5 kB main JS chunk still triggers Vite's warning.

## After the competition demo

- [ ] Before real participants, add authentication, server-enforced permissions, shared storage, real session continuity, media handling, moderation, analytics, privacy/safeguarding policy, and human review operations.
- [ ] Obtain bilingual review before enabling Hindi; the current working journey is English.
- [ ] Replace any media placeholders only after receiving the actual materials and permission to publish them.
