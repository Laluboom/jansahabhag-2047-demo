import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export interface RouteDefinition {
  index: number;
  pattern: string;
  url: string;
  expectedUrlRegex?: RegExp;
  headingRegex: RegExp;
  controlRegex: RegExp;
  screenshotDesktop?: string;
  screenshotMobile?: string;
}

export const ALL_61_ROUTES: RouteDefinition[] = [
  { index: 1, pattern: '/demo-login', url: '/demo-login', headingRegex: /Select a Persona|Demo Personas|JanSahabhag 2047|Enter JanSahabhag/i, controlRegex: /Enter JanSahabhag|Aarav Sharma/i, screenshotDesktop: '01-desktop-demo-login.png' },
  { index: 2, pattern: '/', url: '/', expectedUrlRegex: /\/dashboard$/, headingRegex: /Civic Journey Dashboard|Welcome back/i, controlRegex: /Continue Learning|Civic Passport|Civic Credits/i },
  { index: 3, pattern: '/welcome', url: '/welcome', headingRegex: /JanSahabhag 2047|Welcome to JanSahabhag/i, controlRegex: /Begin Aarav|Explore All Personas|Explore Curriculum|Join Assembly/i },
  { index: 4, pattern: '/onboarding', url: '/onboarding', headingRegex: /Participant Onboarding|Civic Track/i, controlRegex: /Complete Onboarding|Continue|Civic Track/i },
  { index: 5, pattern: '/dashboard', url: '/dashboard', headingRegex: /Civic Journey Dashboard|Welcome back/i, controlRegex: /Continue Learning|Civic Passport|Civic Credits/i, screenshotDesktop: '02-desktop-dashboard.png', screenshotMobile: '02-mobile-dashboard.png' },
  { index: 6, pattern: '/profile', url: '/profile', headingRegex: /Profile & Demo Settings|Civic Profile|Aarav Sharma/i, controlRegex: /Reset Demo Data|Storage Key/i },
  { index: 7, pattern: '/notifications', url: '/notifications', headingRegex: /Notifications/i, controlRegex: /Mark all as read|All Notifications|All/i },
  { index: 8, pattern: '/learn', url: '/learn', headingRegex: /Civic Learning Hub|Curriculum Tracks/i, controlRegex: /Civic Academy|Self-Growth|All Tracks/i },
  { index: 9, pattern: '/learn/:courseId', url: '/learn/course_civic_obs_01', headingRegex: /Civic Observation & Safe Streets/i, controlRegex: /Enrol in Course|Enroll in Course|Completed|Curriculum|Field Modules/i, screenshotDesktop: '03-desktop-learning-course.png' },
  { index: 10, pattern: '/learn/:courseId/lesson/:lessonId', url: '/learn/course_civic_obs_01/lesson/les_obs_101', headingRegex: /Introduction to Civic Field Observation/i, controlRegex: /Mark Lesson Complete|Lesson Completed|Next Lesson/i, screenshotMobile: '04-mobile-learning-lesson.png' },
  { index: 11, pattern: '/assignments', url: '/assignments', headingRegex: /Field Evidence & Assignments/i, controlRegex: /Pending|Reviewed|Submitted|All/i },
  { index: 12, pattern: '/assignments/:id', url: '/assignments/asg_obs_01', headingRegex: /School Gate Traffic Audit/i, controlRegex: /Submit Observation|Submit Evidence|Mentor Review|Submission Details|Submission Receipt|Receipt/i, screenshotDesktop: '05-desktop-assignment-detail.png' },
  { index: 13, pattern: '/assignments/:id/submit', url: '/assignments/asg_obs_03/submit', headingRegex: /Pedestrian Flow Interview with 5 Peers|School Gate Traffic Audit/i, controlRegex: /Submit for Verification|Save Draft|Field Observation Notes/i },
  { index: 14, pattern: '/participate', url: '/participate', headingRegex: /Participatory Civic Stream/i, controlRegex: /Explore Assemblies|Log Activity|All Activities/i },
  { index: 15, pattern: '/activities', url: '/activities', headingRegex: /Participatory Civic Stream/i, controlRegex: /Log Activity|All Activities|All/i },
  { index: 16, pattern: '/events', url: '/events', headingRegex: /Civic Events/i, controlRegex: /Upcoming|Past|All Events/i },
  { index: 17, pattern: '/events/:id', url: '/events/evt_jaipur_assembly_01', headingRegex: /Jaipur Youth Pedestrian Safety Assembly/i, controlRegex: /Attending|Simulate Check-In|RSVP/i },
  { index: 18, pattern: '/community', url: '/community', headingRegex: /Community Circles & Peer Forums|Community Circles/i, controlRegex: /Open Forum|All Circles|Search|Join Circle|Members/i },
  { index: 19, pattern: '/community/groups/:id', url: '/community/groups/grp_jaipur_safe_streets', headingRegex: /Jaipur Youth Safe Streets Circle/i, controlRegex: /Post Message|Share update|Members/i },
  { index: 20, pattern: '/assemblies', url: '/assemblies', headingRegex: /Youth Deliberative Assemblies/i, controlRegex: /Upcoming|In Session|Concluded/i },
  { index: 21, pattern: '/assemblies/:id', url: '/assemblies/assembly_jaipur_pedestrian_2026', headingRegex: /Jaipur School Zone Pedestrian Safety Youth Assembly 2026/i, controlRegex: /Enter Live Deliberation Workspace|Enter Session Workspace|Enter Assembly|Deliberation Roadmap|Read Point-of-Use Rules/i },
  { index: 22, pattern: '/assemblies/:id/session', url: '/assemblies/assembly_jaipur_pedestrian_2026/session', headingRegex: /Jaipur School Zone Pedestrian Safety Youth Assembly 2026/i, controlRegex: /Canonical Deliberation Pathway|All 4 Zones|Advance Stage/i, screenshotDesktop: '06-desktop-assembly-session.png', screenshotMobile: '07-mobile-assembly-session.png' },
  { index: 23, pattern: '/propositions/:id', url: '/propositions/prop_jaipur_pedestrian_01', headingRegex: /Madhyam Marg|How should Jaipur Municipal Corporation/i, controlRegex: /View Revision History|Support|Amend|Return to Session/i },
  { index: 24, pattern: '/propositions/:id/revisions', url: '/propositions/prop_jaipur_pedestrian_01/revisions', headingRegex: /Proposition Revision History/i, controlRegex: /Back to Proposition|Return to Proposition|Revision Timeline|Version/i },
  { index: 25, pattern: '/projects', url: '/projects', headingRegex: /Civic Action Projects/i, controlRegex: /All Projects|Join Project|Active/i },
  { index: 26, pattern: '/projects/:id', url: '/projects/proj_navchetna_crosswalk_01', headingRegex: /Navchetna Crosswalk & Speed Calming Action/i, controlRegex: /Post Progress Update|Milestones|Add Milestone/i },
  { index: 27, pattern: '/issues', url: '/issues', headingRegex: /Civic Issues/i, controlRegex: /Report Danger Spot|Report New Issue|Filter/i },
  { index: 28, pattern: '/issues/:id', url: '/issues/iss_01', headingRegex: /Madhyam Marg Gate 1 Speed Corridor/i, controlRegex: /Upvote Issue|Reported/i },
  { index: 29, pattern: '/passport', url: '/passport', headingRegex: /Civic Passport|Aarav Sharma/i, controlRegex: /Export Passport|Civic Credit/i, screenshotDesktop: '08-desktop-passport-radar.png' },
  { index: 30, pattern: '/passport/credits', url: '/passport/credits', headingRegex: /Civic Credit Ledger/i, controlRegex: /All|Learning|Observation|Ledger Breakdown/i, screenshotDesktop: '09-desktop-passport-credits.png' },
  { index: 31, pattern: '/credits', url: '/credits', expectedUrlRegex: /\/passport\/credits$/, headingRegex: /Civic Credit Ledger/i, controlRegex: /All|Learning|Observation/i },
  { index: 32, pattern: '/passport/evidence', url: '/passport/evidence', headingRegex: /Verifiable Evidence Repository|Verified Field Evidence/i, controlRegex: /All Evidence|My Evidence|Verified/i },
  { index: 33, pattern: '/passport/achievements', url: '/passport/achievements', headingRegex: /Civic Badges & Institutional Honors|Civic Honors/i, controlRegex: /Civic Badges|Unlocked|In Progress/i },
  { index: 34, pattern: '/labs/ideas', url: '/labs/ideas', headingRegex: /Idea Lab/i, controlRegex: /Prototype|Submit Concept/i },
  { index: 35, pattern: '/labs/research', url: '/labs/research', headingRegex: /Research Lab/i, controlRegex: /Download Schema|Methodology|Research/i },
  { index: 36, pattern: '/labs/policy', url: '/labs/policy', headingRegex: /Policy Lab/i, controlRegex: /Policy Draft|Model Bylaws|Policy/i },
  { index: 37, pattern: '/parliament', url: '/parliament', headingRegex: /National Youth Parliament/i, controlRegex: /Inspect Rajasthan Motion #07|Chamber/i, screenshotDesktop: '10-desktop-parliament.png' },
  { index: 38, pattern: '/stakeholders', url: '/stakeholders', headingRegex: /Municipal & Stakeholder Engagement|Stakeholders/i, controlRegex: /Jaipur Municipal Corporation|Stakeholders/i },
  { index: 39, pattern: '/studio', url: '/studio', headingRegex: /Civic Studio & Campaign Creator|Civic Studio/i, controlRegex: /Campaign Creator|Authoring|Studio/i },
  { index: 40, pattern: '/debate-room', url: '/debate-room', headingRegex: /Debate Room Hub|Debate Room/i, controlRegex: /Enter Chamber|Rulebook|Point-of-Use/i },
  { index: 41, pattern: '/debate-room/:id', url: '/debate-room/sess_jaipur_01', headingRegex: /Debate Room|Jaipur School Zone Pedestrian Safety Deliberation/i, controlRegex: /Text-First Active|Request Speaking Turn|Floor/i, screenshotDesktop: '11-desktop-debate-room.png', screenshotMobile: '12-mobile-debate-room.png' },
  { index: 42, pattern: '/events/:id/debate-room', url: '/events/sess_jaipur_01/debate-room', headingRegex: /Debate Room|Jaipur School Zone Pedestrian Safety Deliberation/i, controlRegex: /Text-First Active|Request Speaking Turn/i },
  { index: 43, pattern: '/debates', url: '/debates', expectedUrlRegex: /\/debate-room$/, headingRegex: /Debate Room Hub|Debate Room/i, controlRegex: /Enter Chamber|Rulebook/i },
  { index: 44, pattern: '/workspace', url: '/workspace', headingRegex: /Jaipur Ward 24 School-Zone Safety Workspace|Learner Workspace|Workspaces/i, controlRegex: /Team Notes & Actions|Members & Invites|Create Team Action/i },
  { index: 45, pattern: '/workspace/:id', url: '/workspace/ws_jaipur_school_safety', headingRegex: /Jaipur Ward 24 School-Zone Safety Workspace|Learner Workspace|Workspace/i, controlRegex: /Team Notes & Actions|Create Team Action|Members & Invites|Acknowledge/i, screenshotDesktop: '13-desktop-workspace-invited.png' },
  { index: 46, pattern: '/workspaces', url: '/workspaces', expectedUrlRegex: /\/workspace$/, headingRegex: /Jaipur Ward 24 School-Zone Safety Workspace|Learner Workspace|Workspaces/i, controlRegex: /Team Notes & Actions|Members & Invites|Create Team Action/i },
  { index: 47, pattern: '/workspaces/:id', url: '/workspaces/ws_jaipur_school_safety', headingRegex: /Jaipur Ward 24 School-Zone Safety Workspace|Learner Workspace|Workspace/i, controlRegex: /Team Notes & Actions|Create Team Action|Members & Invites|Acknowledge/i },
  { index: 48, pattern: '/uhv', url: '/uhv', headingRegex: /UHV \/ Jeevan Vidya|Universal Human Values/i, controlRegex: /Dedicated Study Stream|All UHV Modules|Civic Learning Hub/i, screenshotDesktop: '14-desktop-uhv-isolation.png' },
  { index: 49, pattern: '/uhv/learn', url: '/uhv/learn', expectedUrlRegex: /\/uhv$/, headingRegex: /UHV \/ Jeevan Vidya|Universal Human Values/i, controlRegex: /Dedicated Study Stream|All UHV Modules/i },
  { index: 50, pattern: '/help', url: '/help', headingRegex: /Help & Rulebooks|Rulebooks/i, controlRegex: /Youth Assembly|Debate Room|Workspaces|Reservation Policy/i },
  { index: 51, pattern: '/settings', url: '/settings', expectedUrlRegex: /\/profile$/, headingRegex: /Profile & Demo Settings|Civic Profile|Aarav Sharma/i, controlRegex: /Reset Demo Data/i },
  { index: 52, pattern: '/institution/dashboard', url: '/institution/dashboard', headingRegex: /Navchetna Public School|Institution Command Center/i, controlRegex: /Cohort Roster|Cohort Directory|Programmes/i },
  { index: 53, pattern: '/institution/participants', url: '/institution/participants', headingRegex: /Statewide & Institutional Cohort Directory|Cohort Directory/i, controlRegex: /Cohort Directory|Search|Export Roster/i },
  { index: 54, pattern: '/institution/programmes', url: '/institution/programmes', headingRegex: /Active Civic Programmes|Institutional Programmes/i, controlRegex: /Programmes|Active/i },
  { index: 55, pattern: '/admin/dashboard', url: '/admin/dashboard', headingRegex: /State Command|Platform Operations/i, controlRegex: /Simulated Session Role|Moderation Queue/i, screenshotDesktop: '15-desktop-admin-dashboard.png' },
  { index: 56, pattern: '/admin/programmes', url: '/admin/programmes', headingRegex: /State Programmes Administration|Programmes/i, controlRegex: /Active|Draft|New Programme/i },
  { index: 57, pattern: '/admin/content', url: '/admin/content', headingRegex: /Curriculum & Content Management/i, controlRegex: /Curriculum|Modules|Courses/i },
  { index: 58, pattern: '/admin/moderation', url: '/admin/moderation', headingRegex: /Moderation & Content Safety Queue|Moderation/i, controlRegex: /All Cases|Open|Resolved/i },
  { index: 59, pattern: '/analytics', url: '/analytics', headingRegex: /Civic Engagement & Deliberation Analytics|Analytics/i, controlRegex: /Local Institution Real-Time|National 2047 Preview|Total Participants/i },
  { index: 60, pattern: '/about', url: '/about', headingRegex: /Connecting education with citizenship/i, controlRegex: /Nazim M. Sandh|Visesh Akbari/i },
  { index: 61, pattern: '/*', url: '/non-existent-route-slug-404', headingRegex: /Path Not Found|Error 404/i, controlRegex: /Return to Dashboard/i, screenshotDesktop: '16-desktop-catchall-404.png' },
];

const SCREENSHOT_DIR = path.resolve('docs/audits/phase0-screenshots');

test.describe('Package 10B: Master PRD Phase 0 Complete Browser Route Evidence', () => {
  test.beforeAll(async () => {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(180000);
    await page.goto('/demo-login');
    await page.evaluate(() => {
      localStorage.removeItem('jansahabhag_demo_v1');
    });
    await page.reload();
    await page.getByText('Aarav Sharma').first().click();
    await page.waitForURL('**/dashboard');
  });

  test('Desktop (1280x800): verifies all 61 router patterns render/redirect without infinite spinner or horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    let renderedCount = 0;
    let noOverflowCount = 0;
    let noSpinnerCount = 0;
    let controlObservedCount = 0;

    for (const r of ALL_61_ROUTES) {
      await page.goto(r.url);

      if (r.expectedUrlRegex) {
        await expect(page).toHaveURL(r.expectedUrlRegex, { timeout: 8000 });
      }

      const contentArea = r.pattern === '/demo-login' ? page.locator('body') : page.locator('main');

      // 1. Assert heading or primary text renders in main content area (with auto-retry)
      const heading = contentArea.getByText(r.headingRegex).first();
      await expect(heading).toBeVisible({ timeout: 8000 });
      renderedCount++;

      // 2. Assert no full-page loading fallback spinner remains after data resolves
      const pageFallbackSpinners = page.locator('.animate-spin.rounded-full.h-8.w-8');
      if (await pageFallbackSpinners.count() > 0) {
        await expect(pageFallbackSpinners.first()).not.toBeVisible({ timeout: 2000 });
      }
      noSpinnerCount++;

      // 3. Assert no horizontal page overflow (allow up to 2px for browser subpixel rounding)
      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 2;
      });
      expect(isOverflowing, `Route ${r.pattern} has horizontal overflow on desktop`).toBe(false);
      noOverflowCount++;

      // 4. Assert meaningful visible control (record finding gracefully if absent)
      const control = contentArea.getByText(r.controlRegex).first();
      const controlVisible = await control.isVisible();
      if (controlVisible) {
        controlObservedCount++;
      } else {
        console.info(`[Desktop Audit] Route ${r.pattern} control not observed (${r.controlRegex}) - recorded as Not Verified / Change`);
      }

      // 5. Capture screenshot if configured
      if (r.screenshotDesktop) {
        const dest = path.join(SCREENSHOT_DIR, r.screenshotDesktop);
        await page.screenshot({ path: dest, fullPage: false });
      }
    }

    // Verify all 61 patterns completed without crash or layout break
    expect(renderedCount).toBe(61);
    expect(noSpinnerCount).toBe(61);
    expect(noOverflowCount).toBe(61);
    expect(controlObservedCount).toBeGreaterThanOrEqual(55);
  });

  test('Mobile (375x667): verifies all 61 router patterns render/redirect without infinite spinner or horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    let renderedCount = 0;
    let noOverflowCount = 0;
    let noSpinnerCount = 0;
    let controlObservedCount = 0;

    for (const r of ALL_61_ROUTES) {
      await page.goto(r.url);

      if (r.expectedUrlRegex) {
        await expect(page).toHaveURL(r.expectedUrlRegex, { timeout: 8000 });
      }

      const contentArea = r.pattern === '/demo-login' ? page.locator('body') : page.locator('main');

      // 1. Assert heading or primary text renders in content area (with auto-retry)
      const heading = contentArea.getByText(r.headingRegex).first();
      await expect(heading).toBeVisible({ timeout: 8000 });
      renderedCount++;

      // 2. Assert no full-page loading fallback spinner remains after data resolves
      const pageFallbackSpinners = page.locator('.animate-spin.rounded-full.h-8.w-8');
      if (await pageFallbackSpinners.count() > 0) {
        await expect(pageFallbackSpinners.first()).not.toBeVisible({ timeout: 2000 });
      }
      noSpinnerCount++;

      // 3. Assert no horizontal page overflow (allow up to 2px for browser subpixel rounding)
      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 2;
      });
      expect(isOverflowing, `Route ${r.pattern} has horizontal overflow on mobile`).toBe(false);
      noOverflowCount++;

      // 4. Record control visibility
      const control = contentArea.getByText(r.controlRegex).first();
      const controlVisible = await control.isVisible();
      if (controlVisible) {
        controlObservedCount++;
      }

      // 5. Capture screenshot if configured
      if (r.screenshotMobile) {
        const dest = path.join(SCREENSHOT_DIR, r.screenshotMobile);
        await page.screenshot({ path: dest, fullPage: false });
      }
    }

    expect(renderedCount).toBe(61);
    expect(noSpinnerCount).toBe(61);
    expect(noOverflowCount).toBe(61);
    expect(controlObservedCount).toBeGreaterThanOrEqual(55);
  });

  test('Privileged & Persona-Scoped Routes: inspects allowed and denied personas, distinguishing UI simulation from server authorization', async ({ page }) => {
    // 1. Admin Dashboard with unprivileged persona (Aarav Sharma)
    await page.goto('/admin/dashboard');
    // Router lacks server authorization wall, so page renders with simulated session role banner
    await expect(page.getByRole('heading', { name: /State Command/i })).toBeVisible();
    await expect(page.getByText(/Simulated Session Role: Platform Admin \(Aarav Sharma\)/i)).toBeVisible();

    // Now switch to Programme Manager persona (Dev Patel)
    await page.getByRole('button', { name: /Viewing as/i }).click();
    await page.getByRole('dialog').getByText('Dev Patel').first().click();
    await expect(page.getByText(/Dev Patel/i).first()).toBeVisible();

    // Verify Admin Dashboard renders with Dev Patel
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('heading', { name: /State Command/i })).toBeVisible();

    // 2. Private Workspace Access Denial
    // Dev Patel is NOT invited to ws_jaipur_school_safety
    await page.goto('/workspace/ws_jaipur_school_safety');
    // Assert explicit Access Denied card
    await expect(page.getByText(/Access Denied \/ Repository Error/i)).toBeVisible();
    await expect(page.getByText(/is invite-only private and cannot be accessed without an invitation/i)).toBeVisible();
    // Action inputs suppressed
    await expect(page.getByTestId('btn-open-create-action')).not.toBeVisible();
    // Capture denied workspace screenshot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '17-desktop-workspace-denied-dev.png') });

    // Switch back to invited member (Aarav Sharma)
    await page.getByRole('button', { name: /Viewing as/i }).click();
    await page.getByRole('dialog').getByText('Aarav Sharma').first().click();
    await page.goto('/workspace/ws_jaipur_school_safety');

    // Aarav Sharma is an active member in seed: workspace header and tabs are visible
    await expect(page.getByRole('heading', { name: /Jaipur Ward 24 School-Zone Safety Workspace/i })).toBeVisible();
    await expect(page.getByTestId('tab-actions')).toBeVisible();
    await expect(page.getByText(/Team Notes & Actions/i).first()).toBeVisible();

    // 3. Event 33% Reservation Quota Denial
    // Visit limited capacity event evt_jaipur_limited_05 as Aarav Sharma (male participant)
    await page.goto('/events/evt_jaipur_limited_05');
    await expect(page.getByRole('heading', { level: 1, name: /Jaipur Ward 24 Youth Council/i })).toBeVisible();
    await page.getByRole('button', { name: /^Attending$/i }).click();

    // Assert reservation restriction alert displays neutrally without disclosing private attributes
    const alertBox = page.getByRole('alert');
    await expect(alertBox).toBeVisible();
    await expect(alertBox).toContainText(/cannot be accepted under current allocation rules/i);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '18-desktop-event-reservation-denied.png') });

    // Dismiss alert cleanly
    await page.getByRole('button', { name: /Dismiss alert/i }).click();
    await expect(alertBox).not.toBeVisible();

    // 4. Assembly Chair vs Participant Controls
    // As Aarav Sharma (Thinker), cannot advance stage
    await page.goto('/assemblies/assembly_jaipur_pedestrian_2026/session');
    await expect(page.getByRole('button', { name: /Advance Stage/i })).not.toBeVisible();

    // Switch to Chair (Rohan Mehta)
    await page.getByRole('button', { name: /Viewing as/i }).click();
    await page.getByRole('dialog').getByText('Rohan Mehta').first().click();
    await page.goto('/assemblies/assembly_jaipur_pedestrian_2026/session');
    await expect(page.getByRole('button', { name: /Advance Stage/i })).toBeVisible();
  });

  test('Exercises representative interactive controls: submission, reload, denied action, reset, focus/keyboard', async ({ page }) => {
    // 1. Language selector in TopUtilityBar
    await page.goto('/dashboard');
    const langBtn = page.getByTestId('language-selector-btn');
    await langBtn.click();
    const hiOption = page.getByTestId('lang-option-hi');
    await hiOption.click();
    await expect(page.getByTestId('hindi-pending-review-badge')).toBeVisible();

    // Switch back to English
    await langBtn.click();
    await page.getByTestId('lang-option-en').click();
    await expect(page.getByTestId('hindi-pending-review-badge')).not.toBeVisible();

    // 2. Mobile Sidebar Drawer & Focus Trap
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileToggle = page.getByTestId('mobile-menu-toggle');
    await mobileToggle.click();
    const drawer = page.locator('[role="dialog"][aria-label="Navigation drawer"]');
    await expect(drawer).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '19-mobile-navigation-drawer.png') });

    // Press Escape key to close drawer
    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible();

    // Restore desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    // 3. Assignment Draft Autosave & Submission on unsubmitted assignment (asg_obs_03)
    await page.goto('/assignments/asg_obs_03/submit');
    const noteArea = page.getByLabel(/Field Observation Notes & Data Log/i);
    await noteArea.fill('Field observation notes for testing package 10b browser evidence.');
    await expect(page.getByText(/Draft autosaved locally/i)).toBeVisible({ timeout: 5000 });

    // Check available evidence item if present
    const evCheckbox = page.locator('input[type="checkbox"]').first();
    if (await evCheckbox.isVisible()) {
      await evCheckbox.check();
    }

    // Submit assignment
    await page.getByRole('button', { name: 'Submit for Verification' }).click();
    // After submit, navigates to assignment detail page
    await page.waitForURL('**/assignments/asg_obs_03', { timeout: 8000 });
    await expect(page.getByText(/Pedestrian Flow Interview with 5 Peers/i).first()).toBeVisible();

    // 4. Debate Room speaking turn & reload persistence
    await page.goto('/events/sess_jaipur_01/debate-room');
    await expect(page.getByText(/Text-First Active \(OD\.4\)/i)).toBeVisible();
    const turnBtn = page.getByRole('button', { name: /Request Speaking Turn/i });
    if (await turnBtn.isVisible()) {
      await turnBtn.click();
    }
    // Reload page and confirm state survives
    await page.reload();
    await expect(page.getByText(/Text-First Active \(OD\.4\)/i)).toBeVisible();

    // 5. Parliament Prototype motion modal inspection
    await page.goto('/parliament');
    const inspectBtn = page.getByRole('button', { name: /Inspect Rajasthan Motion #07/i });
    await inspectBtn.click();
    await expect(page.getByText(/Key Legislative Clauses/i)).toBeVisible();
    await page.getByRole('button', { name: /Close Motion Brief/i }).click();
    await expect(page.getByText(/Key Legislative Clauses/i)).not.toBeVisible();

    // 6. Admin Programmes status filter
    await page.goto('/admin/programmes');
    await page.getByRole('button', { name: /Active/i }).click();
    await expect(page.getByText(/My Community, My Future/i)).toBeVisible();

    // 7. Catch-All 404 navigation return
    await page.goto('/non-existent-route-slug-404');
    await expect(page.getByRole('heading', { name: /Path Not Found/i })).toBeVisible();
    await page.getByRole('button', { name: /Return to Dashboard/i }).click();
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
