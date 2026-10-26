# JanSahabhag 2047 — Frontend Demo

A browser-based interactive demo of **JanSahabhag 2047** with a linked single-browser participant journey, fictional sample data, local persistence, and selected administrative views. It covers part of the full product specification. The owner selected the Jaipur pedestrian-safety story for the initial 17 October demo; on 24 October 2026, the owner designated the Rajkot college demo (Shri Manibhai Virani and Smt. Navalben Virani Science College (Autonomous), Rajkot) with Ankita Kapri as main student to supersede Jaipur as the target demo (merged and published on 26 October 2026).

**Live demo:** [jansahabhag2047.vercel.app](https://jansahabhag2047.vercel.app)

**Source:** [Laluboom/jansahabhag-2047-demo](https://github.com/Laluboom/jansahabhag-2047-demo)

This is **not** a production implementation. It intentionally simulates backend, authentication, AI, verification, moderation, and real-time behaviour so the product can be reviewed, demonstrated, and manually tested before production infrastructure is built.

**Product authority:** the [supplied Master PRD archive](docs/reference/JanSahabhag_2047_MASTER_PRD_v3.1_LOSSLESS_ARCHIVE.docx) governs product requirements. The [33% women's reservation supplement](docs/reference/JanSahabhag_2047_Supplementary_PRD_33pct_Womens_Reservation_v2.docx) was approved in principle by the owner. This fictional single-browser demo applies `ceil(0.33 × planned places)` separately to every named role and limited place, leaves unmet reserved places vacant by default, and demonstrates owner-approved exceptions with a local audit record. This does not provide real owner authority or server-side enforcement. The [scope guide](README_01_RULES_REQUIREMENTS_BY_SCOPE.md) explains how to read the sources; the [reconciliation](docs/audits/MASTER_PRD_RECONCILIATION.md) records historical differences; [product decisions](docs/decisions.md) and the [current handoff](docs/HANDOFF_2026-10-26.md) record the accepted demo boundary and remaining decisions.

**Published demo status & updates:**
- **17 October 2026 baseline:** the connected fictional Jaipur demo (Aarav Sharma, Navchetna Public School) was published to GitHub and Vercel.
- **24 October 2026 updates:**
  - The external [About page](src/features/about/AboutPage.tsx) presents Nazim M. Sandh (Founder and Initiator) and credits Visesh Akbari (Developer, with explicit spelling confirmed over the gratitude document's Vishesh) with his portrait and links inside the gratitude list, without a separate developer card. The owner removed the former Managing Partner card, portrait, and biography on 26 October 2026. A dedicated "With gratitude" section credits 9 contributors headed by late guide Shri Dadubhai Sandhar, closing lines for the CVMS Cell at Atmiya University and all unnamed contributors, and the draft gratitude message in Nazim's voice.
  - Civic Credit Points capped at five demo points (0 starting balance, honest NEP community engagement alignment; not university credits or a graduation requirement; private UHV reflections earn 0 points).
  - Target demo transition: the Rajkot college demo roster with Ankita Kapri as the main student supersedes Jaipur as the target demo (`docs/reference/24-10-2026/`). The Rajkot demo was merged into `autobuild`, pushed to GitHub, and deployed on 26 October 2026. Sections headed “Suggested” retain some original planning language and should be read as proposals rather than live feature claims.
- **25 October 2026 updates:**
  - Nazim M. Sandh supplied founder biography: The owner directly supplied a full third-person description for Nazim M. Sandh headed "The Founder", subtitle "Founder and Initiator | Independent Learner", describing his Gir background, microbiology studies, youth awareness, sustainable cultivation, community fitness, cultural engagement, youth development, LOK MANCH-2047 at Viksit Bharat Young Leaders Dialogue 2026, master presentation placed before the Hon'ble Prime Minister of India, and JanSahabhag 2047 as an ongoing civic exploration. Merged into [AboutPage.tsx](src/features/about/AboutPage.tsx), pushed to GitHub, and verified deployed to production at `https://jansahabhag2047.vercel.app`; this supersedes the earlier owner instruction removing extended Nazim biographies. Visesh Akbari's longer biography remains unpublished. The Rajkot demo was subsequently merged and deployed on 26 October 2026.

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
- UHV learning content (original platform wording inspired by the Vadodara Savli youth workshop, material by Ganesh Bagadia; public credit line: "Based on the Vadodara Savli youth workshop, material by Ganesh Bagadia.")
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

The learner sidebar follows the Master PRD's eleven-item order: **Home, Learn, Activities & Assignments, Debate Room, Youth Assembly, Youth Parliament, Workspace, Labs & Projects, Community, Civic Passport, UHV / Jeevan Vidya**. Profile, Notifications, Settings, Help/Rulebooks and About Us are utilities. Administration links appear separately by demo persona. Youth Parliament remains a labelled clickable preview; Debate Room and the invite-only Rajkot Workspace are labelled local simulations, with no server-enforced access.

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

### Target demo: Rajkot college scenario (supersedes Jaipur target demo)

*Current live competition demo since 26 October 2026. The historical 17 October Jaipur demo remains documented below as the initial published baseline.*

- **Target Institution:** **Shri Manibhai Virani and Smt. Navalben Virani Science College (Autonomous), Rajkot**
- **Main student demo persona:** **Ankita Kapri** (Demo ID: `VSC-S-001`)
- **Demo roster size:** 22 named demo people:
  - **15 students** (all aged at least 18; exactly 5 named women meeting the 33% reservation requirement: Ankita Kapri, Niyati Chawda, Harshita Kapri, Jahanvi Sandh, Asmi Soni; Ankita and Harshita must stay in this group; reserve names: Jinal Bhagya, Prensha Jaisalya, Nisha Bhimani)
  - **2 teachers:** Shri Mayur Parmar (reviews submissions, no access to private UHV), Shri Ankit Kalaria (UHV / Jeevan Vidya stream; sees only shared UHV work, never private reflections)
  - **1 principal:** Shri Dr. K. D. Ladwa (institution_admin)
  - **1 special guest:** Shri Param Pujya Tyagvallabh Swamiji (President, Atmiya University; Chairperson of the College; view-only `special_guest` role, holds no seat, outside the 15 student count and 33% calculation)
  - **1 founder:** Nazim M. Sandh (platform_admin)
  - **2 scoped moderators:** Yashvi Dalsaniya (`JS-M-001`, Managing Partner & Moderator) and Dilip Sanghar (`JS-M-002`, Moderator)
- **Data boundaries:** Real names are used for named demo roles; student IDs are fictional (`VSC-S-xxx`, `VSC-T-xxx`, etc.); no invented personal details (roll numbers, private emails, phone numbers) are attributed to named people. Real-person photos are used only where supplied (Ankita Kapri, Dr. K. D. Ladwa, Swamiji, Nazim M. Sandh, Yashvi Dalsaniya); all others show initials.

---

### Historical demo scenario: Jaipur (17 October 2026 baseline, superseded)

*Historical reference for the initial published demo:*

### Main participant (Historical)

- **Aarav Sharma**
- Age: 18
- Institution: **Navchetna Public School, Jaipur**
- Programme: **My Community, My Future**

Aarav and all demo records are fictional. This browser demo does not provide the age, consent or safeguarding controls needed to enrol real minors.

### Civic theme (Historical)

**Improving pedestrian safety near schools**

### Primary journey (Historical)

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

### Current demo personas: Rajkot (24 October 2026 decision, published 26 October)

The 24 October 2026 owner decision transitions demo personas to 22 named people for Shri Manibhai Virani and Smt. Navalben Virani Science College (Autonomous), Rajkot (see `docs/reference/24-10-2026/JanSahabhag 2047 — Demo Personas.docx`). *Merged into `autobuild` and deployed on 26 October 2026.*

- **Main demo participant:** Ankita Kapri (`VSC-S-001`, main demo student, photo supplied)
- **15 students (all 18+, exactly 5 named women meeting 33% rule):**
  - Reserved-seat group (women): Ankita Kapri (`VSC-S-001`), Niyati Chawda (`VSC-S-002`), Harshita Kapri (`VSC-S-003`), Jahanvi Sandh (`VSC-S-004`), Asmi Soni (`VSC-S-015`)
  - Other students: Yash Rathod (`VSC-S-005`), Kanha Kapri (`VSC-S-006`), Hriday Trivedi (`VSC-S-007`), Maharshi Bhardwaj (`VSC-S-008`), Aroh Mehta (`VSC-S-009`), Ajit Sanghar (`VSC-S-010`), Aslan Sandh (`VSC-S-011`), Piyush Kanjaria (`VSC-S-012`), Jigar Sanghar (`VSC-S-013`), Dhruv Patel (`VSC-S-014`)
  - Reserve student names: Jinal Bhagya, Prensha Jaisalya, Nisha Bhimani (kept aside to preserve exact 33% women ratio)
- **Staff & guests (outside student 15 count and 33% calculation):**
  - Shri Mayur Parmar (`VSC-T-001`, Teacher and Professor)
  - Shri Ankit Kalaria (`VSC-T-002`, Teacher and Professor, UHV Jeevan Vidya)
  - Shri Dr. K. D. Ladwa (`VSC-P-001`, Principal, photo supplied)
  - Shri Param Pujya Tyagvallabh Swamiji (`VSC-G-001`, Special Guest, view-only `special_guest` role, photo supplied)
  - Nazim M. Sandh (`JS-F-001`, Founder and Organiser, platform_admin, photo supplied)
  - Yashvi Dalsaniya (`JS-M-001`, Moderator, photo supplied)
  - Dilip Sanghar (`JS-M-002`, Moderator)

### Historical demo personas: Jaipur (17 October 2026 baseline, superseded)

The initial demo was seeded with the following fictional accounts:

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

Approved schedule (OD 24 Oct 2026 supersedes earlier 10 initial and 1–2 unbounded model with 0 initial and maximum 5 Civic Credit Points in demo):

```text
Starting balance             0
Demo maximum                 5 Civic Credit Points per student
Private UHV / dissent        0 (No points)
```

The 5 demo Civic Credit Points connect honestly to the National Education Policy (NEP) community engagement idea; they are an illustrative demo metric and are not university credits or a universal NEP graduation requirement ([official UGC source](https://www.ugc.gov.in/KeyInitiative?ID=VQnigtvLvoA0UAhQPVdzTA%3D%3D)). Historical 21/22 October schedule awarded +10 starting balance and +1/+2 per task; the 24 October owner decision caps student earning to max 5 demo Civic Credit Points with zero starting balance.

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

The [implementation plan](IMPLEMENTATION_PLAN.md) records the historical browser-demo approach. For further work, begin with the [scope guide](README_01_RULES_REQUIREMENTS_BY_SCOPE.md), [reconciliation](docs/audits/MASTER_PRD_RECONCILIATION.md), [open decisions](docs/decisions.md) and [current connected-demo plan](docs/plans/COMPETITION_DEMO_PRD_PLAN.md); while the reservation policy is approved in principle and its fictional-demo formula, scope, and exception rules are approved, production operating rules remain open (see [docs/decisions.md](docs/decisions.md)).

---

## 23. License

Original project code is released under the [Apache License, Version 2.0](LICENSE). Third-party content, external media, supplied portraits, and untracked reference files remain subject to their respective terms and are not licensed under Apache 2.0.
