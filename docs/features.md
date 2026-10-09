# Feature index and verified status

Tasks 01–04 are merged in `autobuild`. Task 05 is complete and independently verified on unmerged branch `agy/j-20261009-154211-yd8l`. The descriptions below include that final branch; merge commands are in [paused.md](../paused.md). Every route listed in `README.md` has a router entry and passed the Task 05 browser route smoke test.

| Area | Routes | Behavior |
| --- | --- | --- |
| Shell, personas, profile | `/`, `/welcome`, `/demo-login`, `/onboarding`, `/dashboard`, `/profile` | Responsive navigation, seeded persona switch, reset, participant next step and progress. |
| Notifications | `/notifications` | Persona-scoped local notifications, mark read and route links. |
| Learning | `/learn`, `/learn/:courseId`, `/learn/:courseId/lesson/:lessonId` | Enrolment, lesson completion, repeat-safe Learning credit and Passport activity. |
| Assignments and review | `/assignments`, `/assignments/:id`, `/assignments/:id/submit` | Draft, mock evidence, submit, teacher queue, exact submission review/revision/verification and linked credits. |
| Youth Assembly | `/assemblies`, `/assemblies/:id`, `/assemblies/:id/session` | Join, assigned role, nine stages, contributions and evidence-linked deliberation. |
| Propositions | `/propositions/:id`, `/propositions/:id/revisions` | Structured editing, revisions, support/dissent and finalisation. |
| Civic Passport | `/passport`, `/passport/credits`, `/passport/evidence`, `/passport/achievements` | Connected history, evidence, achievements and transaction ledger. |
| Civic action | `/participate`, `/activities`, `/projects`, `/projects/:id` | Activity feed, project notes/evidence and repeat-safe milestone credit/Passport linkage. |
| Events and community | `/events`, `/events/:id`, `/community`, `/community/groups/:id` | Local RSVP/attendance, simulated agendas/resources, group membership, posts and comments. |
| Civic Issues | `/issues`, `/issues/:id` | Labelled Demo Preview with fictional danger spots and local interactions. |
| Institution and admin | `/institution/*`, `/admin/*`, `/analytics` | Shared-data metrics, participant/programme/content changes, moderation lifecycle and labelled seeded national metrics. |
| Future modules | `/parliament`, `/labs/ideas`, `/labs/research`, `/labs/policy`, `/stakeholders`, `/studio` | Designed Demo Preview pages with fictional samples; simulated AI and external actions are disclosed. |

## Verification

`npm run build`, `npm run test -- --run` (89 tests) and `npm run test:e2e` (six Chromium tests) passed independently on Task 05's branch. Playwright includes the complete Aarav-to-Passport journey, all README routes, invalid-record fallbacks, refresh persistence, mobile assembly/admin smoke, persona/notification/reset checks. Lazy route loading keeps the final production chunks below the earlier 500 kB warning threshold. The interface remains a browser demo; production services and deployment are outside this implementation.
