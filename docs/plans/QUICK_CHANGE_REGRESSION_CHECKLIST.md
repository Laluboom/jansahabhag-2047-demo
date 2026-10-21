# Quick-Change Regression Checklist: Fictional Jaipur Demo

**Boundary:** JanSahabhag 2047 single-browser local simulation using fictional data and the Jaipur pedestrian-safety path.
**Purpose:** Do-not-break checklist for fast edits, listing observable demo behavior, existing test files, runnable test commands, and generic future server-side acceptance needs.

---

## 1. Do-Not-Break Areas

### 1.1 Assembly: Four Roles and Dissent Preservation
- **Observable Behavior:** Four non-hierarchical functional roles (Thinker, Enabler, Troubleshooter, Shaper). Deliberation stages record submitted minority views and unadopted amendments in proposition revision records rather than discarding them.
- **Current Tests:**
  - `tests/assembly-deliberation.test.ts`
  - `tests/package05-assembly-deliberation.test.ts`
  - `tests/assembly-ui.test.tsx`
  - `e2e/assembly.spec.ts`
- **Future Acceptance Needs:** Server-backed multi-user deliberation sync and shared persistent revision history.

### 1.2 Evidence: Pending to Mentor-Verified with Feedback
- **Observable Behavior:** Student assignment submissions start in a pending review status. Switching to mentor persona permits review submission with feedback text, moving the item to verified status.
- **Current Tests:**
  - `tests/learning-assignment.test.tsx`
  - `tests/assignment-evidence-package03.test.tsx`
  - `e2e/assignment-observation-evidence.spec.ts`
  - `e2e/connected-jaipur-journey.spec.ts`
- **Future Acceptance Needs:** Server-authorized review assignment, multi-reviewer workflows, and backend evidence verification.

### 1.3 Passport Appeals: AI Barred from Decisions
- **Observable Behavior:** Credit appeal modal displays the PRD notice barring automated AI from deciding credit appeals or sanctions. In the demo, appeals route to mentor review in local data. Cross-persona appeal inspection is rejected.
- **Current Tests:**
  - `tests/package07-passport-credits.test.ts`
- **Future Acceptance Needs:** Server-enforced appellate routing, escalation handling, and tamper-resistant audit logs.

### 1.4 UHV Reflection: Private, No Credits, Teacher Isolation
- **Observable Behavior:** Universal Human Values / Jeevan Vidya reflections award zero civic credits and generate no passport activity cards. UHV reflections are excluded from teacher review queues and are inaccessible to other personas.
- **Current Tests:**
  - `tests/uhv-reflection-boundary.test.tsx`
  - `tests/package07-passport-credits.test.ts`
  - `tests/navigation-prd.test.tsx`
- **Future Acceptance Needs:** Server-side access control isolating private personal journals across accounts.

### 1.5 33% Women's Reservation: `ceil(0.33 × places)`
- **Observable Behavior:** Calculated as `ceil(0.33 * places)` separately per named role and limited place cohort without cross-role pooling (including single-place roles where `ceil(0.33 * 1) = 1`). Unmet reserved places remain vacant by default. Departures require an explicit audited platform owner exception. In small cohorts (1–3 places), individual reservation breakdown is suppressed from public view.
- **Current Tests:**
  - `tests/reservation-allocation-policy.test.ts`
  - `tests/assembly-reservation-allocation.test.ts`
  - `tests/debate-reservation-allocation.test.ts`
  - `tests/event-reservation-repository.test.ts`
  - `tests/parliament-reservation-preview.test.tsx`
  - `tests/debate-room-reservation-ui.test.tsx`
  - `e2e/assembly-reservation-allocation.spec.ts`
  - `e2e/debate-room-reservation-allocation.spec.ts`
  - `e2e/event-reservation-allocation.spec.ts`
  - `e2e/parliament-preview-reservation.spec.ts`
- **Future Acceptance Needs:** Server-side quota validation and secure demographic eligibility verification.

### 1.6 Truthful Labelling: Simulation and Preview Badges
- **Observable Behavior:** Pages and modals carry visible notices identifying the client as a single-browser local simulation. Modules not fully implemented (e.g., Parliament Preview, video preview badges, Hindi language review tag) carry prototype/preview labels.
- **Current Tests:**
  - `tests/parliament-reservation-preview.test.tsx`
  - `tests/debate-room-credential-boundary.test.tsx`
  - `e2e/smoke-routes.spec.ts`
  - `e2e/phase0-browser-route-evidence.spec.ts`
- **Future Acceptance Needs:** Production status indicators and live service availability disclosures.

### 1.7 Connected Jaipur Path
- **Observable Behavior:** End-to-end flow connects Jaipur Ward 24 observation, assignment submission, mentor verification, invite-only workspace, debate room reservation checks, youth assembly deliberation, and passport view.
- **Current Tests:**
  - `e2e/connected-jaipur-journey.spec.ts`
  - `tests/workspace-repository.test.ts`
  - `tests/debate-room-repository.test.ts`
- **Future Acceptance Needs:** Real-time multi-device collaboration across remote participants.

---

## 2. Test and Build Commands

Commands cite actual project files and scripts:

### Build
```bash
npm run build
```

### Unit and Integration Tests
```bash
# Run all unit/integration tests
npm run test:run

# Focused runs on specific files
npx vitest run tests/reservation-allocation-policy.test.ts
npx vitest run tests/assembly-deliberation.test.ts tests/assembly-ui.test.tsx
npx vitest run tests/package07-passport-credits.test.ts
npx vitest run tests/uhv-reflection-boundary.test.tsx
npx vitest run tests/learning-assignment.test.tsx tests/assignment-evidence-package03.test.tsx
```

### Focused Playwright E2E Tests
```bash
npx playwright test e2e/connected-jaipur-journey.spec.ts
npx playwright test e2e/assembly-reservation-allocation.spec.ts
npx playwright test e2e/debate-room-reservation-allocation.spec.ts
npx playwright test e2e/parliament-preview-reservation.spec.ts
```

---

## 3. Current Verification vs. Future Acceptance

| Feature Area | Current Tests Present | Future Acceptance Needs |
|---|---|---|
| Assembly Roles & Dissent | Local proposition revision trail checked in Vitest & Playwright | Server-side multi-party sync and persistent history |
| Evidence & Feedback | Single-browser persona switch & verification checked | Backend review queue and multi-mentor authorization |
| Passport Appeals | AI disclaimer banner and mentor routing checked | Server-side ticket management and appellate audit |
| UHV Reflection Isolation | 0 credits, teacher queue exclusion, persona isolation tested | Server-side authorization and private account isolation |
| 33% Reservation Quota | Per-allocation formula, vacancy, and owner exception tested | Server-side quota enforcement and demographic privacy |
| Simulation Labelling | Prototype and simulation labels verified | Deployed system notices and live service status |
| Connected Jaipur Flow | End-to-end journey in single browser verified | Multi-browser cross-network synchronization |
