# JanSahabhag 2047 — Implementation Plan

This document explains **how the frontend demo will be implemented**, how the pieces connect, what will be real versus simulated, and in what order the work should be completed.

The implementation is intentionally frontend-first. The objective is to create a believable, testable product experience without spending time on production backend infrastructure before the user experience has been validated.

---

## 1. Implementation strategy

The application will be built as if it already had a backend, but the backend contract will be implemented locally.

The core rule is:

> **Screens should depend on domain services, not directly on mock JSON or localStorage.**

This creates a clean upgrade path.

### Demo architecture

```text
UI Components
      ↓
Feature Screens
      ↓
State / Feature Actions
      ↓
Repository Interface
      ↓
Demo Repository
      ↓
Local Persistence
```

Later:

```text
UI Components
      ↓
Feature Screens
      ↓
State / Feature Actions
      ↓
Repository Interface
      ↓
API Repository
      ↓
Production Backend
```

The UI should not care which repository is active.

---

## 2. Why this approach

A static mock-up would be faster initially, but it would fail to demonstrate the most important product behaviour:

- progress changing
- submissions moving through states
- an Assembly creating a proposition
- Credits changing after activity
- Passport records accumulating
- different personas seeing different information
- data surviving refresh

Using a lightweight repository and local database gives the demo real product behaviour without requiring:

- servers
- authentication infrastructure
- database hosting
- API deployment
- DevOps
- real-time infrastructure

---

## 3. Application shell

The application shell will be built first.

It will include:

- responsive sidebar
- mobile bottom navigation
- top utility bar
- current persona indicator
- notification button
- language selector
- profile menu
- admin workspace switch where applicable

Navigation will be role-aware.

### Participant primary navigation

```text
Home
Learn
Participate
Deliberate
Act
Passport
```

### Secondary navigation

```text
Community
Events
Notifications
Profile
```

### Admin navigation

```text
Dashboard
Participants
Programmes
Learning
Assemblies
Moderation
Analytics
Configuration
```

---

## 4. Demo authentication

There will be no real authentication.

The `/demo-login` screen will show persona cards.

Example:

```text
Continue as Aarav
Participant

Continue as Kavita
Teacher

Continue as Rohan
Facilitator

Continue as Ananya
Institution Admin
```

Selecting a persona updates:

```ts
activeUserId
```

The current user is then resolved from the local demo database.

Role switching should be available from the profile menu so reviewers can move between perspectives without restarting the demo.

---

## 5. Seed database

The application ships with a canonical seed object.

Example structure:

```ts
export const seedDatabase: DemoDatabase = {
  schemaVersion: 1,
  activeUserId: "user_aarav",

  users: [],
  institutions: [],
  programmes: [],
  courses: [],
  lessons: [],
  enrolments: [],
  assignments: [],
  submissions: [],
  evidence: [],
  activities: [],
  events: [],
  assemblies: [],
  assemblyRoles: [],
  contributions: [],
  propositions: [],
  projects: [],
  reflections: [],
  credits: [],
  passportEntries: [],
  notifications: [],
  communityGroups: [],
  communityPosts: [],
  moderationCases: []
};
```

On startup:

```text
Does local demo data exist?
        ↓
      No
        ↓
Clone seed data
        ↓
Save to localStorage
        ↓
Open application
```

If data exists, it is loaded instead.

---

## 6. Persistence layer

The persistence service will contain only generic storage behaviour.

Example responsibilities:

```ts
loadDatabase()
saveDatabase(database)
resetDatabase()
getSchemaVersion()
```

No course, Assembly, or Passport logic belongs here.

Recommended storage key:

```text
jansahbhag_demo_v1
```

Use deep cloning when resetting so the seed object itself is never mutated.

---

## 7. Repository layer

The repository owns domain actions.

For example:

```ts
completeLesson(userId, lessonId)
```

should:

1. find the enrolment
2. mark the lesson complete
3. recalculate course progress
4. create an activity record if needed
5. create a Credit transaction if applicable
6. create a notification if applicable
7. persist the new database
8. return the updated result

The UI only calls the repository method.

This ensures one user action updates all related screens consistently.

---

## 8. Derived data

Avoid storing every dashboard number independently.

For example:

```text
Passport Credit total
```

should be derived from:

```text
CreditTransaction[]
```

Course progress should be derived from lesson completion.

Dashboard counts should be derived from:

- enrolments
- assignments
- events
- Assemblies
- notifications
- Passport entries

This reduces contradictions between screens.

---

## 9. Core domain implementation

### Learning

The learning domain consists of:

```text
Programme
   ↓
Course
   ↓
Module
   ↓
Lesson
   ↓
Assignment
```

A participant enrolment stores progress.

When a lesson is completed:

```text
Lesson status changes
        ↓
Enrolment progress recalculates
        ↓
Dashboard updates
        ↓
Optional Credit transaction created
        ↓
Passport learning history updates
```

---

## 10. Assignment flow

Use a simple state machine:

```text
DRAFT
  ↓
SUBMITTED
  ↓
UNDER_REVIEW
  ↓
VERIFIED
```

Optional branch:

```text
UNDER_REVIEW
  ↓
REVISION_REQUESTED
  ↓
SUBMITTED
```

Teacher review uses the same underlying record seen by the participant.

This is important: do not maintain separate teacher and participant mock copies.

---

## 11. Evidence

Evidence should be a reusable object.

Example:

```ts
interface Evidence {
  id: string;
  ownerId: string;
  type: "document" | "image" | "observation" | "attendance" | "link";
  title: string;
  description?: string;
  source?: string;
  visibility: Visibility;
  verificationStatus: VerificationStatus;
  createdAt: string;
}
```

Assignments, Assemblies, projects, and Passport records should reference Evidence IDs.

This makes it possible for the demo to show one evidence item appearing across multiple connected experiences.

---

## 12. Youth Assembly implementation

The Assembly is the most important simulated workflow after Learning.

The demo should not attempt real multi-user deliberation.

Instead, it should combine:

- scripted participants
- scripted contributions
- user-generated local contributions
- predefined Assembly stages
- predefined role allocation
- editable proposition state

### Assembly stages

```text
1. Orientation
2. Question
3. Evidence Review
4. Deliberation
5. Proposition Draft
6. Revision
7. Support / Dissent
8. Outcome
9. Reflection
```

The user should always see the current stage.

### Assembly layout

Recommended desktop structure:

```text
------------------------------------------------
| Header: Assembly / Stage / Time / Status     |
------------------------------------------------
| Left       | Main workspace      | Right     |
|------------|---------------------|-----------|
| Agenda     | Discussion / Draft  | Evidence  |
| Roles      |                     | People    |
| Stages     |                     | Context   |
------------------------------------------------
```

On mobile, side panels become drawers.

---

## 13. Assembly role simulation

Roles are predefined in seed data.

Example:

```ts
{
  assemblyId: "assembly_001",
  userId: "user_aarav",
  role: "Questioner"
}
```

The app should still display:

- role description
- role responsibilities
- role badge
- role-specific prompts

The allocation algorithm itself is not implemented.

---

## 14. Proposition implementation

A proposition is a structured object rather than plain text.

Recommended model:

```ts
interface Proposition {
  id: string;
  assemblyId: string;

  question: string;
  problem: string;
  insight: string;
  proposition: string;

  enablers: string[];
  risks: string[];
  nextStep: string;

  unresolvedQuestions: string[];
  dissent: DissentRecord[];
  supportProfile: SupportProfile;

  evidenceIds: string[];

  outcome:
    | "CONSENSUS"
    | "QUALIFIED_SUPPORT"
    | "SPLIT_DECISION"
    | "INSUFFICIENT_BASIS";

  version: number;
  revisions: PropositionRevision[];
}
```

The proposition editor should allow the participant to experience revision even though the rest of the group is simulated.

---

## 15. Civic Credits

Credits should behave like a transparent ledger.

Do not store only:

```ts
totalCredits: 120
```

Store:

```ts
CreditTransaction[]
```

Example:

```ts
{
  id: "credit_017",
  userId: "user_aarav",
  dimension: "Deliberation",
  amount: 10,
  sourceType: "assembly",
  sourceId: "assembly_001",
  status: "Verified",
  reason: "Participated in Youth Assembly",
  createdAt: "2026-10-08T10:00:00Z"
}
```

Totals are calculated from transactions.

### Demo rules

Keep the formula deliberately simple and visible.

The point is to demonstrate the product concept, not to simulate the production scoring model.

---

## 16. Civic Passport

The Passport should be treated as a view over trusted activity.

Where possible, do not duplicate records.

Example:

```text
Course completion
        ↓
Passport learning item

Verified assignment
        ↓
Passport contribution item

Assembly participation
        ↓
Passport deliberation item

Project milestone
        ↓
Passport civic-action item
```

A small `PassportEntry` record may store display metadata and references, but the underlying source should remain traceable.

### Passport screens

```text
Overview
Timeline
Achievements
Evidence
Credits
Projects
Assemblies
Learning
```

---

## 17. Notifications

Notifications are local records created by actions.

Examples:

- Assignment submitted
- Teacher feedback received
- Assembly starting soon
- Proposition finalised
- Passport updated
- Project milestone completed

Each notification contains a route so clicking it opens the relevant feature.

---

## 18. Community

The Community experience will be local only.

Users can:

- view groups
- view seeded posts
- add a post
- comment
- add a local message where allowed

Messages are not delivered outside the browser.

Seed content should be realistic and linked to programmes and Assemblies.

---

## 19. Projects

Projects should demonstrate civic action without becoming a full project-management application.

A Project contains:

- title
- civic objective
- team
- milestones
- evidence
- status
- outcomes
- reflections

Interactions:

- mark milestone complete
- add note
- add mock evidence
- view progress
- generate Passport activity

---

## 20. Events and sessions

Events should support:

- list
- calendar
- event detail
- RSVP
- attendance status
- join-session action

A simulated session page can show:

- agenda
- participants
- resources
- session notes

No live video is required.

---

## 21. Administration

Administrative screens should reuse the same database.

For example, when a Teacher verifies a submission, the Participant must immediately see the changed status after switching personas.

### Institution Admin

Can view:

- institution overview
- participants
- programmes
- completion
- events
- engagement
- basic analytics

### Programme Manager

Can view:

- programme overview
- enrolments
- courses
- assignments
- Assemblies
- projects
- outcomes

### Platform Admin

Can view:

- platform metrics
- institutions
- programmes
- moderation queue
- configuration preview

---

## 22. Moderation demo

Moderation should be a simple workflow.

Example:

```text
OPEN
  ↓
UNDER_REVIEW
  ↓
ACTIONED
```

Alternative:

```text
UNDER_REVIEW
  ↓
NO_ACTION
```

Each mock case can include:

- severity
- report reason
- target content
- reporter
- reviewer
- decision
- notes

This is only a UI demonstration.

---

## 23. Analytics

Use two data sources:

### Calculated

Derived from local records:

- course completion
- submission counts
- Assembly participation
- Passport items
- Credit totals
- active projects

### Seeded

Used where realistic calculation would require more data:

- retention
- institution health
- deliberation distribution
- national participation
- inclusion trends

Seeded values should be clearly plausible and consistent.

---

## 24. AI simulation

No production AI integration is needed.

Use one of two approaches:

### Static

Prewritten responses matched to demo scenarios.

### Deterministic

Simple templates based on known data.

Example:

```ts
function generateDemoAssemblySummary(assembly: Assembly) {
  return `Participants discussed ${assembly.question} and identified...`;
}
```

Every AI surface should include a small indication such as:

```text
Simulated AI suggestion
```

The demo should never imply that a live model is making governance or moderation decisions.

---

## 25. Future-module previews

Preview modules should still have complete page design.

For example, Research Lab can show:

- active studies
- research categories
- sample research project
- participants
- consent status
- findings
- publication state

But buttons that require unimplemented logic should either:

- navigate to another preview
- open a demo explanation
- be disabled with `Demo Preview`

Avoid dead controls that appear broken.

---

## 26. Responsive implementation

Build desktop-first, but do not postpone mobile structure until the end.

### Breakpoints

Use Tailwind responsive breakpoints.

Desktop:

```text
sidebar + main + optional right context
```

Tablet:

```text
collapsible sidebar + main
```

Mobile:

```text
header + content + bottom navigation
```

Assembly and admin screens require special responsive testing because of their information density.

---

## 27. State management

Use Zustand only for application-level state such as:

- current user
- database-loaded state
- UI preferences
- active language
- current demo scenario

Domain records should be loaded and updated through repositories.

Do not put the entire application database into dozens of unrelated component states.

---

## 28. Error handling

Even though the demo is local, screens should support:

- record not found
- invalid route
- validation error
- empty state
- storage failure
- reset confirmation

This makes the prototype feel like a real application.

---

## 29. Demo reset

A Reset Demo control is mandatory.

Recommended location:

```text
Profile → Demo Settings → Reset Demo Data
```

Flow:

```text
Reset Demo
   ↓
Confirmation dialog
   ↓
Delete local database
   ↓
Clone seed database
   ↓
Set default participant
   ↓
Return to dashboard
```

Optionally also expose:

```text
Load Participant Scenario
Load Teacher Scenario
Load Admin Scenario
```

for rapid demonstrations.

---

## 30. Testing strategy

### Unit tests

Test:

- credit calculations
- progress calculations
- repository state transitions
- Passport derivation
- persistence
- reset logic

### Component tests

Test:

- course cards
- assignment forms
- role badges
- proposition sections
- notification behaviour

### End-to-end

The most important Playwright test is:

```text
Open demo
→ Continue as Aarav
→ Open course
→ Complete lesson
→ Submit assignment
→ Switch to Teacher
→ Verify submission
→ Switch to Aarav
→ Join Assembly
→ Add contribution
→ Finalise proposition
→ Add reflection
→ Open Passport
→ Confirm activity appears
```

This is the product's golden-path test.

---

## 31. Build order in detail

### Sprint 1 — Foundation

Deliver:

- repo setup
- design tokens
- router
- app shell
- persona switcher
- type definitions
- seed database
- persistence
- repository abstraction
- reset demo

Do not start complex feature screens until this is stable.

---

### Sprint 2 — Learning journey

Deliver:

- participant dashboard
- course catalogue
- course detail
- lesson
- progress
- assignments
- submission flow

This creates the first usable participant experience.

---

### Sprint 3 — Review and state transitions

Deliver:

- Teacher dashboard
- review queue
- feedback
- revision request
- verification
- notifications

Now role switching demonstrates shared state.

---

### Sprint 4 — Youth Assembly

Deliver:

- Assembly list
- Assembly overview
- role display
- stage navigation
- evidence
- scripted discussion
- local contribution
- proposition editor
- support / dissent
- final outcome

This is the main differentiating product experience.

---

### Sprint 5 — Passport and Credits

Deliver:

- Passport overview
- activity timeline
- evidence
- achievements
- Credits
- reflections
- cross-module updates

At this point the full primary journey exists.

---

### Sprint 6 — Supporting participant experience

Deliver:

- projects
- events
- activities
- community
- notifications polish
- Civic Issues preview

---

### Sprint 7 — Administration

Deliver:

- Institution dashboard
- Programme Manager dashboard
- participants
- programmes
- moderation
- analytics
- basic local CRUD

---

### Sprint 8 — Full product visibility

Deliver previews for:

- Parliament
- Labs
- stakeholders
- Studio
- AI
- advanced analytics
- multilingual tools

---

### Sprint 9 — Polish and demo hardening

Deliver:

- responsive refinement
- accessibility
- visual consistency
- transitions
- loading states
- empty states
- demo labels
- data consistency checks
- full E2E run
- deployment

---

## 32. What we should not optimise early

Do not spend early effort on:

- generic workflow engines
- production permissions frameworks
- WebSockets
- video
- complex maps
- production AI
- backend microservices
- real file uploads
- enterprise authentication
- national-scale analytics

They do not materially improve the first demo.

---

## 33. Upgrade path to a real backend

When the demo is validated, the migration path should be:

### Step 1

Introduce an HTTP API while keeping the same repository interface.

```text
DemoRepository
        ↓ replace with
ApiRepository
```

### Step 2

Move authentication to the backend.

### Step 3

Move domain state transitions to backend services.

### Step 4

Replace simulated verification, notifications, messaging, AI, and moderation with real services.

### Step 5

Introduce production permissions and auditing.

The frontend feature screens should require relatively little change if the repository boundary has been respected.

---

## 34. Definition of implementation success

The demo implementation is successful when a reviewer can understand the product without reading the PRD first.

A reviewer should be able to see:

1. how a participant learns
2. how learning becomes contribution
3. how evidence is attached
4. how contribution enters deliberation
5. how deliberation creates a proposition
6. how disagreement is preserved
7. how activity becomes Credits
8. how the participant's history accumulates in the Civic Passport
9. how institutions and administrators see the same ecosystem from a different perspective

That connected experience is more important than the number of screens implemented.
