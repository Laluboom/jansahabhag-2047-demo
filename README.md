# JanSahabhag 2047 — Frontend Demo

A browser-based interactive demo of **JanSahabhag 2047** with a linked single-browser participant journey, fictional sample data, local persistence, and selected administrative views. It covers part of the full product specification. The owner selected the Jaipur pedestrian-safety story for the immediate demo.

**Live demo:** [jansahabhag2047.vercel.app](https://jansahabhag2047.vercel.app)

**Source:** [Laluboom/jansahabhag-2047-demo](https://github.com/Laluboom/jansahabhag-2047-demo)

This is **not** a production implementation. It intentionally simulates backend, authentication, AI, verification, moderation, and real-time behaviour so the product can be reviewed, demonstrated, and manually tested before production infrastructure is built.

**Product authority:** the [supplied Master PRD archive](docs/reference/JanSahabhag_2047_MASTER_PRD_v3.1_LOSSLESS_ARCHIVE.docx) governs product requirements. The [33% women's reservation supplement](docs/reference/JanSahabhag_2047_Supplementary_PRD_33pct_Womens_Reservation_v2.docx) was approved in principle by the owner. This fictional single-browser demo applies `ceil(0.33 × planned places)` separately to every named role and limited place, leaves unmet reserved places vacant by default, and demonstrates owner-approved exceptions with a local audit record. This does not provide real owner authority or server-side enforcement. The [scope guide](README_01_RULES_REQUIREMENTS_BY_SCOPE.md) explains how to read the sources; the [reconciliation](docs/audits/MASTER_PRD_RECONCILIATION.md) records historical differences; [product decisions](docs/decisions.md) and the [current handoff](docs/HANDOFF_2026-10-16.md) record the accepted demo boundary and remaining decisions.

**Published demo, 17 October 2026:** the connected fictional Jaipur demo and [About page](src/features/about/AboutPage.tsx) are on GitHub and Vercel. The live About page was checked after deployment: it shows Nazim M. Sandh as founder and Visesh Akbari as developer, with their supplied portraits and no biographical paragraphs. Sections headed “Suggested” retain some original planning language and should be read as proposals rather than live feature claims.

---

## 1. Demo goals

The demo should make the JanSahabhag 2047 product understandable through direct interaction.

The primary experience is the **participant journey**:

**Register / Enter Demo → Learn → Complete Assignment → Contribute → Join Youth Assembly → Deliberate → Produce Proposition → Reflect → Build Civic Passport**

The wider platform should also be visible through supporting experiences for:

- Participant
- Teacher / Mentor
- Facilitator
- Institution Admin
- Programme Manager
- Moderator
- Platform Admin

The demo shows selected product areas at different depths:

- **Core participant modules:** interactive
- **Supporting admin modules:** partially interactive
- **Future / advanced modules:** polished preview screens

---

## 2. Scope

### Interactive core

- Demo login / persona switcher
- Participant onboarding
- Participant dashboard
- Civic Academy
- Self-Growth Academy
- UHV learning content
- Courses and lessons
- Assignments and submissions
- Teacher review
- Civic activities
- Youth Assembly
- Assembly roles
- Evidence
- Contributions
- Propositions
- Reflections
- Civic Passport
- Civic Credits
- Projects
- Events
- Community / group discussion
- Notifications
- Institution dashboard
- Programme administration
- Basic moderation
- Basic analytics

### Preview modules

- Youth Parliament
- Idea Lab
- Research Lab
- Policy Lab
- Civic Issues Map
- Stakeholder engagement
- Advanced Studio
- Advanced AI orchestration
- Advanced multilingual tooling
- National-scale analytics

Preview modules should look like real product surfaces, but should be clearly labelled as **Demo Preview** where functionality is simulated or incomplete.

---

## 3. Recommended stack

| Area | Choice |
|---|---|
| Frontend | React |
| Language | TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| State management | Zustand |
| Persistence | Browser `localStorage` |
| Charts | Recharts |
| Icons | Lucide React |
| Forms | React Hook Form |
| Validation | Zod |
| Testing | Vitest + React Testing Library |
| E2E | Playwright |
| Hosting | Vercel or Netlify |

A component library may be added if useful, but the application should retain a distinct JanSahabhag visual identity rather than looking like an unchanged template.

---

## 4. Product navigation

The learner sidebar follows the Master PRD's eleven-item order: **Home, Learn, Activities & Assignments, Debate Room, Youth Assembly, Youth Parliament, Workspace, Labs & Projects, Community, Civic Passport, UHV / Jeevan Vidya**. Profile, Notifications, Settings, Help/Rulebooks and About Us are utilities. Administration links appear separately by demo persona. Youth Parliament remains a labelled clickable preview; Debate Room and the invite-only Jaipur Workspace are labelled local simulations, with no server-enforced access.

---

## 5. Suggested routes

```text
/
├── /welcome
├── /demo-login
├── /onboarding
├── /dashboard
├── /profile
├── /notifications
│
├── /learn
├── /learn/:courseId
├── /learn/:courseId/lesson/:lessonId
│
├── /assignments
├── /assignments/:id
├── /assignments/:id/submit
│
├── /participate
├── /activities
├── /events
├── /events/:id
│
├── /community
├── /community/groups/:id
│
├── /assemblies
├── /assemblies/:id
├── /assemblies/:id/session
│
├── /propositions/:id
├── /propositions/:id/revisions
│
├── /projects
├── /projects/:id
│
├── /issues
├── /issues/:id
│
├── /passport
├── /passport/credits
├── /passport/evidence
├── /passport/achievements
│
├── /labs/ideas
├── /labs/research
├── /labs/policy
├── /parliament
├── /stakeholders
│
├── /institution/dashboard
├── /institution/participants
├── /institution/programmes
│
├── /admin/dashboard
├── /admin/programmes
├── /admin/content
├── /admin/moderation
├── /analytics
└── /studio
```

---

## 6. Primary demo scenario

Use one coherent story across the platform instead of disconnected placeholder records.

### Main participant

**Aarav Sharma**  
Age: 17  
Institution: **Navchetna Public School, Jaipur**  
Programme: **My Community, My Future**

Aarav and all demo records are fictional. This browser demo does not provide the age, consent or safeguarding controls needed to enrol real minors.

### Civic theme

**Improving pedestrian safety near schools**

### Primary journey

1. Aarav opens the participant dashboard.
2. He continues a Civic Academy lesson on observation and evidence.
3. He completes an assignment about a dangerous pedestrian crossing.
4. A teacher reviews and verifies the contribution.
5. Aarav joins a Youth Assembly.
6. He receives a predefined Assembly role.
7. He reviews evidence and contributes to deliberation.
8. The group creates a proposition.
9. The proposition records support, risks, dissent, and unresolved questions.
10. Aarav writes a reflection.
11. His Passport updates with:
   - learning activity
   - assignment
   - verified contribution
   - Assembly participation
   - reflection
   - evidence
   - Civic Credits

The user should be able to complete this journey entirely in the browser.

---

## 7. Demo personas

Seed the app with the following accounts:

| Persona | Demo user | Purpose |
|---|---|---|
| Participant | Aarav Sharma | Primary journey |
| Participant | Meera Singh | Completed-state / rich Passport example |
| Teacher | Kavita Rao | Assignment review |
| Mentor / Facilitator | Rohan Mehta | Assembly facilitation |
| Institution Admin | Ananya Verma | Institution management |
| Programme Manager | Dev Patel | Programme overview |
| Platform Admin | Demo Administrator | Platform and moderation overview |

The demo login screen should allow instant switching between personas.

Always show a persistent indicator such as:

> Viewing as: Participant — Aarav Sharma

---

## 8. Project structure

```text
src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   └── providers/
│
├── components/
│   ├── layout/
│   ├── navigation/
│   ├── cards/
│   ├── forms/
│   ├── tables/
│   ├── charts/
│   ├── feedback/
│   └── status/
│
├── features/
│   ├── auth-demo/
│   ├── dashboard/
│   ├── learning/
│   ├── assignments/
│   ├── activities/
│   ├── events/
│   ├── assemblies/
│   ├── propositions/
│   ├── projects/
│   ├── passport/
│   ├── credits/
│   ├── community/
│   ├── institutions/
│   ├── administration/
│   ├── moderation/
│   ├── analytics/
│   └── previews/
│
├── data/
│   ├── seed/
│   ├── fixtures/
│   └── scenarios/
│
├── services/
│   ├── repository.ts
│   ├── demoRepository.ts
│   ├── persistence.ts
│   └── migrations.ts
│
├── stores/
├── hooks/
├── types/
├── utils/
└── styles/
```

---

## 9. Data architecture

The UI must not read and write `localStorage` directly.

Use this flow:

```text
React Screen
    ↓
Feature Action / Store
    ↓
Repository Interface
    ↓
Demo Repository
    ↓
Persistence Adapter
    ↓
localStorage
```

This lets the demo later replace local persistence with a real API without rewriting the screen layer.

Example repository interface:

```ts
export interface DemoRepository {
  getCurrentUser(): Promise<User>;
  getDashboard(userId: string): Promise<DashboardData>;

  getCourses(userId: string): Promise<Course[]>;
  getCourse(courseId: string): Promise<Course | null>;
  completeLesson(userId: string, lessonId: string): Promise<void>;

  getAssignments(userId: string): Promise<Assignment[]>;
  submitAssignment(input: AssignmentSubmissionInput): Promise<Submission>;
  reviewSubmission(input: SubmissionReviewInput): Promise<Submission>;

  getAssemblies(userId: string): Promise<Assembly[]>;
  addAssemblyContribution(input: AssemblyContributionInput): Promise<Contribution>;
  finaliseProposition(input: PropositionFinalisationInput): Promise<Proposition>;

  getPassport(userId: string): Promise<PassportView>;
  getCredits(userId: string): Promise<CreditTransaction[]>;

  getNotifications(userId: string): Promise<Notification[]>;
  markNotificationRead(notificationId: string): Promise<void>;

  resetDemo(): Promise<void>;
}
```

---

## 10. Core data entities

The demo should use typed domain entities with stable string IDs.

Core entities:

- `User`
- `Institution`
- `Programme`
- `Course`
- `Lesson`
- `Enrolment`
- `Assignment`
- `Submission`
- `Evidence`
- `Activity`
- `Event`
- `Session`
- `Assembly`
- `AssemblyRole`
- `Contribution`
- `Proposition`
- `Project`
- `Reflection`
- `CreditTransaction`
- `PassportEntry`
- `Notification`
- `CommunityGroup`
- `CommunityPost`
- `ModerationCase`
- `DemoScenario`

Recommended conventions:

```ts
id: "user_001"
createdAt: "2026-10-08T10:00:00Z"
updatedAt: "2026-10-08T10:00:00Z"
```

Use string unions or enums for state values rather than arbitrary text.

---

## 11. Local persistence

Use a versioned localStorage key:

```text
jansahbhag_demo_v1
```

Recommended structure:

```ts
interface DemoDatabase {
  schemaVersion: number;
  activeUserId: string;

  users: User[];
  institutions: Institution[];
  programmes: Programme[];
  courses: Course[];
  lessons: Lesson[];
  enrolments: Enrolment[];
  assignments: Assignment[];
  submissions: Submission[];
  evidence: Evidence[];
  activities: Activity[];
  events: Event[];
  assemblies: Assembly[];
  assemblyRoles: AssemblyRole[];
  contributions: Contribution[];
  propositions: Proposition[];
  projects: Project[];
  reflections: Reflection[];
  credits: CreditTransaction[];
  passportEntries: PassportEntry[];
  notifications: Notification[];
  communityGroups: CommunityGroup[];
  communityPosts: CommunityPost[];
  moderationCases: ModerationCase[];
}
```

### Required persistence behaviour

- Seed automatically on first launch.
- Persist user actions across refresh.
- Never store real personal data.
- Provide **Reset Demo Data**.
- Provide schema versioning.
- Reset or migrate incompatible data when the schema changes.

---

## 12. Mock data

Seed at least:

- 3 institutions
- 4 programmes
- 8–12 courses
- 20–30 fictional participants
- 3 Youth Assemblies
- 5 projects
- 8–12 assignments
- 15+ evidence records
- 20+ notifications
- 20+ credit transactions
- 20+ Passport entries
- 4–6 moderation examples
- 3–5 community groups

Each major feature should include examples of:

- empty / not started
- draft / in progress
- submitted
- under review
- completed
- verified
- revision requested
- archived where relevant

---

## 13. Interaction rules

### Learning

- Enrol in course
- Start lesson
- Mark lesson complete
- Update progress
- Unlock next step
- Create Passport / activity record when relevant

### Assignments

- Create draft
- Edit draft
- Add mock evidence
- Submit
- Review as Teacher
- Request revision
- Verify

### Youth Assembly

- Join Assembly
- Show assigned role
- Step through stages
- Review evidence
- Add participant contribution
- Record support / dissent
- Add proposition revision
- Finalise outcome
- Create activity / Passport records

### Civic Credits

Use simple transparent demo rules.

Example:

```text
Complete lesson              +5 Learning
Submit assignment            +10 Contribution
Verified evidence            +5 Observation
Join Assembly                +10 Deliberation
Add substantive contribution +5 Deliberation
Complete reflection          +5 Reflection
Complete project milestone   +10 Civic Action
```

The demo must show a transaction history instead of only a single total.

### Passport

Passport screens should aggregate:

- completed learning
- assignments
- verified evidence
- Assemblies
- propositions
- reflections
- projects
- achievements
- Credits

---

## 14. Simulated functionality

The following should be represented without production infrastructure:

| Capability | Demo implementation |
|---|---|
| Authentication | Persona selector |
| Permissions | Frontend role checks |
| Verification | Manual seeded state changes |
| AI | Prewritten or deterministic outputs |
| Chat | Local-only messages |
| Notifications | Local generated records |
| Realtime Assembly | Scripted / staged experience |
| Video | Static session interface |
| Stakeholder delivery | Seeded timeline |
| Moderation | Local queue and state changes |
| Analytics | Derived from local data + seeded metrics |

Simulated features should not pretend to be live external services.

---

## 15. Design direction

The UI should feel:

- modern
- youthful
- credible
- civic
- optimistic
- structured
- accessible
- distinctly Indian without looking like a conventional government portal

### Layout

Desktop:

- left navigation
- top utility bar
- main content canvas
- optional contextual right panel

Mobile:

- compact header
- bottom navigation for primary participant sections
- drawers for secondary navigation

### Reusable components

Build a consistent system for:

- buttons
- cards
- status chips
- progress indicators
- tabs
- drawers
- dialogs
- forms
- tables
- filters
- timelines
- evidence cards
- user avatars
- empty states
- loading states
- notifications
- charts
- role badges
- verification indicators

---

## 16. Accessibility

Even as a demo, the core experience should support:

- keyboard navigation
- visible focus states
- semantic HTML
- labels for forms
- accessible colour contrast
- responsive layouts
- screen-reader-friendly structure
- captions / transcripts where simulated media is shown

---

## 17. Development sequence

### Phase 1 — Foundation

- Vite + React + TypeScript
- Tailwind
- Router
- App shell
- Demo data types
- Seed database
- localStorage adapter
- repository layer
- persona switcher
- reset demo

### Phase 2 — Participant core

- Dashboard
- Learning
- Course detail
- Lesson view
- Assignment list
- Assignment submission
- Notifications
- Profile

### Phase 3 — Deliberation

- Assembly list
- Assembly overview
- Assembly session
- roles
- evidence
- contributions
- proposition editor
- outcomes
- dissent / support

### Phase 4 — Passport

- Passport overview
- timeline
- achievements
- evidence
- Civic Credits
- reflections
- activity-derived updates

### Phase 5 — Supporting participant modules

- Projects
- Events
- Activities
- Community
- Civic Issues preview

### Phase 6 — Admin views

- Institution dashboard
- participant list
- programmes
- assignment review
- moderation
- analytics

### Phase 7 — Vision modules

- Youth Parliament preview
- Labs previews
- stakeholder preview
- Studio preview
- AI preview
- multilingual preview

### Phase 8 — Polish

- mobile
- accessibility
- transitions
- empty states
- error states
- consistency
- seeded scenario walkthrough
- E2E tests

---

## 18. Manual acceptance criteria

The demo is ready when:

- Every route loads without errors.
- Persona switching works.
- Participant data remains isolated by persona.
- Course progress persists after refresh.
- Assignment submission persists.
- Teacher review updates participant state.
- Assembly contribution persists.
- Proposition finalisation creates a final record.
- Reflection appears in Passport history.
- Credits update through transactions.
- Passport reflects completed activity.
- Admin mock CRUD updates the relevant screens.
- Notifications link to the correct records.
- Reset restores the original seed.
- Desktop and mobile layouts remain usable.
- Preview modules are clearly labelled.
- Simulated AI and external actions are clearly identified as simulated.

---

## 19. What this demo intentionally does not include

- production authentication
- real identity verification
- guardian verification workflows
- real-time multi-user collaboration
- live video
- production moderation infrastructure
- production RBAC / ABAC
- production AI integration
- external stakeholder delivery
- national-scale backend
- legal / compliance automation
- production analytics pipeline
- real participant information

---

## 20. Getting started

```bash
npm ci
npm run dev
```

The deployed demo is a client-rendered React/Vite application. Vercel serves the static build in `dist`; `vercel.json` sends direct links to `index.html` so React Router can handle them. There is no backend or database in this demo. State is stored in each browser's `localStorage`, so progress does not sync between browsers or people. Demo personas do not provide production authentication or access control.

The Vercel project is `lalubooms-projects/jansahabhag2047` and is connected to the public GitHub repository. The production address is `https://jansahabhag2047.vercel.app`; the former address redirects there. Both `main` and `autobuild` contain the published demo. As checked on 17 October 2026, GitHub's default and Vercel's production branch is `autobuild`; a push of `main` alone does not update production. To check a local production build, run `npm run build`.

Recommended scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint ."
  }
}
```

---

## 21. First milestone

The first meaningful release should support this complete flow:

```text
Participant Dashboard
    ↓
Course
    ↓
Lesson
    ↓
Assignment
    ↓
Teacher Review
    ↓
Youth Assembly
    ↓
Proposition
    ↓
Reflection
    ↓
Civic Passport
```

Everything else should be built around this journey rather than before it.

---

## 22. Implementation note

The demo should preserve the product's core ideas even where infrastructure is simulated:

- evidence remains traceable
- dissent remains visible
- Credits are activity records, not civic-worth scores
- private content should not accidentally appear public
- simulated AI should not appear to make consequential decisions
- participant work should remain connected across learning, deliberation, projects, and Passport

The [implementation plan](IMPLEMENTATION_PLAN.md) records the historical browser-demo approach. For further work, begin with the [scope guide](README_01_RULES_REQUIREMENTS_BY_SCOPE.md), [reconciliation](docs/audits/MASTER_PRD_RECONCILIATION.md), [open decisions](docs/decisions.md) and [current connected-demo plan](docs/plans/COMPETITION_DEMO_PRD_PLAN.md); the reservation policy is approved in principle but its operating rules are not yet settled.

---

## 23. License

Original repository code and documentation are released under the [Apache License, Version 2.0](LICENSE). Third-party content, external media, supplied portraits, and untracked reference files remain subject to their respective terms and are not licensed under Apache 2.0.

