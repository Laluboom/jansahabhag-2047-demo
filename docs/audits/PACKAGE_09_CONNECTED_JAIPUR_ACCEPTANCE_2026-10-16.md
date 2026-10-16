# Package 09: connected Jaipur demo acceptance

Date: 2026-10-16

The final isolated branch is `agy/j-20261016-073737-pt3p`, with focused code at commit `b33515d`, based on accepted Debate UI commit `9fa20d6`. Package 09 adds a connected fictional Jaipur browser journey and focused fixes for a missing Debate session route, missing-session fallback, Hindi pending-review notice, and video preview labels. The journey exercises learning and assignment evidence, fictional mentor review, invite-only Workspace denial, limited-place reservation, text-first Debate, persona-scoped owner controls, Youth Assembly, and Passport.

The sub-agy job ended twice without a valid completion contract. Its saved work was reviewed, independently tested, and committed directly on the isolated branch: production build passed; all 311 unit tests passed across 24 files; all 29 Playwright browser tests passed, including the new connected journey; `git diff HEAD^..HEAD --check` passed. The branch was clean after the code commit. No deployed verification has been performed on these isolated changes.

The app remains a fictional, labelled single-browser competition demo. Persona switching and local audit records do not provide real authentication, shared multi-user participation, server enforcement, or public-launch clearance. Hindi is pending review and video is a labelled preview.
