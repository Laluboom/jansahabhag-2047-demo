import { test, expect } from '@playwright/test';

test.describe('JanSahabhag 2047 — Complete Route Smoke & Invariant Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo-login');
    await page.evaluate(() => {
      localStorage.removeItem('jansahbhag_demo_v1');
    });
    await page.reload();
    // Default login as Ankita Kapri
    await page.getByText(/Ankita Kapri|Aarav Sharma/).first().click();
    await page.waitForURL('**/dashboard');
  });

  test('loads all README static and dynamic seeded routes with valid content', async ({ page }) => {
    const routesToTest = [
      // Core Participant Routes
      { path: '/', headingRegex: /JanSahabhag 2047|Welcome to JanSahabhag/i },
      { path: '/welcome', headingRegex: /JanSahabhag 2047|Welcome to JanSahabhag/i },
      { path: '/lok-manch', headingRegex: /The Idea: LOK MANCH-2047/i },
      { path: '/onboarding', headingRegex: /Participant Onboarding|Civic Track/i },
      { path: '/dashboard', headingRegex: /Civic Journey Dashboard|Welcome back, (Ankita Kapri|Aarav Sharma)/i },
      { path: '/profile', headingRegex: /Civic Profile|(Ankita Kapri|Aarav Sharma)/i },
      { path: '/notifications', headingRegex: /Notifications/i },

      // Learning
      { path: '/learn', headingRegex: /Civic Learning Hub|Curriculum Tracks/i },
      { path: '/learn/course_civic_obs_01', headingRegex: /Civic Observation & Safe Streets/i },
      { path: '/learn/course_civic_obs_01/lesson/les_obs_101', headingRegex: /Introduction to Civic Field Observation/i },

      // Assignments
      { path: '/assignments', headingRegex: /Field Evidence & Assignments/i },
      { path: '/assignments/asg_obs_01', headingRegex: /School Gate Traffic Audit/i },
      { path: '/assignments/asg_obs_01/submit', headingRegex: /School Gate Traffic Audit/i },

      // Activities & Events
      { path: '/participate', headingRegex: /Participatory Civic Stream/i },
      { path: '/activities', headingRegex: /Participatory Civic Stream/i },
      { path: '/events', headingRegex: /Civic Events & Deliberation Sessions|Civic Events/i },
      { path: '/events/evt_jaipur_assembly_01', headingRegex: /(Rajkot|Jaipur) Youth Pedestrian Safety Assembly/i },

      // Community
      { path: '/community', headingRegex: /Community Circles & Peer Forums|Community Circles/i },
      { path: '/community/groups/grp_jaipur_safe_streets', headingRegex: /(Rajkot|Jaipur) Youth Safe Streets Circle/i },

      // Deliberative Assemblies & Propositions
      { path: '/assemblies', headingRegex: /Youth Deliberative Assemblies/i },
      { path: '/assemblies/assembly_jaipur_pedestrian_2026', headingRegex: /(Rajkot|Jaipur) School Zone Pedestrian Safety Youth Assembly 2026/i },
      { path: '/assemblies/assembly_jaipur_pedestrian_2026/session', headingRegex: /(Rajkot|Jaipur) School Zone Pedestrian Safety Youth Assembly 2026/i },
      { path: '/propositions/prop_jaipur_pedestrian_01', headingRegex: /How should (Rajkot Municipal Corporation|RMC|Jaipur Municipal Corporation)|(Kalawad Road|Madhyam Marg)/i },
      { path: '/propositions/prop_jaipur_pedestrian_01/revisions', headingRegex: /Proposition Revision History/i },

      // Projects & Issues
      { path: '/projects', headingRegex: /Civic Action Projects/i },
      { path: '/projects/proj_navchetna_crosswalk_01', headingRegex: /(Virani.*College|Navchetna) Crosswalk & Speed Calming Action/i },
      { path: '/issues', headingRegex: /Civic Issues & Danger Spots Map|Civic Issues/i },
      { path: '/issues/iss_01', headingRegex: /(Kalawad Road|Madhyam Marg) Gate 1 Speed Corridor/i },

      // Passport & Credits
      { path: '/passport', headingRegex: /(Ankita Kapri|Aarav Sharma)/i },
      { path: '/passport/credits', headingRegex: /Civic Credit (Points )?Ledger/i },
      { path: '/passport/evidence', headingRegex: /Verifiable Evidence Repository|Verified Field Evidence/i },
      { path: '/passport/achievements', headingRegex: /Civic Badges & Institutional Honors|Civic Honors/i },

      // Vision Previews & Labs
      { path: '/labs/ideas', headingRegex: /Idea Lab: Civic Inventions & Prototypes|Idea Lab/i },
      { path: '/labs/research', headingRegex: /Research Lab: Empirical Studies & Datasets|Research Lab/i },
      { path: '/labs/policy', headingRegex: /Policy Lab: Legislative Drafting & Model Bylaws|Policy Lab/i },
      { path: '/parliament', headingRegex: /National Youth Parliament 2047|National Youth Parliament/i },
      { path: '/stakeholders', headingRegex: /Municipal & Stakeholder Engagement|Stakeholders/i },
      { path: '/studio', headingRegex: /Civic Studio & Campaign Creator|Civic Studio/i },

      // Institution & Admin
      { path: '/institution/dashboard', headingRegex: /(Virani Science College|Shri Manibhai Virani|Navchetna Public School|Institution Command Center)/i },
      { path: '/institution/participants', headingRegex: /Statewide & Institutional Cohort Directory|Cohort Directory/i },
      { path: '/institution/programmes', headingRegex: /Active Civic Programmes|Institutional Programmes/i },
      { path: '/admin/dashboard', headingRegex: /State Command|Platform Operations/i },
      { path: '/admin/programmes', headingRegex: /State Programmes Administration|Programmes/i },
      { path: '/admin/content', headingRegex: /Curriculum & Content Management/i },
      { path: '/admin/moderation', headingRegex: /Moderation & Content Safety Queue|Moderation/i },
      { path: '/analytics', headingRegex: /Civic Engagement & Deliberation Analytics|Analytics/i },
    ];

    for (const route of routesToTest) {
      await page.goto(route.path);
      await expect(page.getByRole('heading', { name: route.headingRegex }).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test('displays graceful missing-record fallback for non-existent dynamic records', async ({ page }) => {
    // 1. Invalid course
    await page.goto('/learn/non_existent_course_404');
    await expect(page.getByText(/Course Not Found/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /View All Courses/i })).toBeVisible();

    // 2. Invalid assignment
    await page.goto('/assignments/non_existent_asg_404');
    await expect(page.getByText(/Assignment Not Found/i)).toBeVisible();

    // 3. Invalid assembly
    await page.goto('/assemblies/non_existent_assembly_404');
    await expect(page.getByText(/Youth Assembly Not Found/i)).toBeVisible();

    // 4. Invalid proposition
    await page.goto('/propositions/non_existent_prop_404');
    await expect(page.getByText(/Proposition Not Found/i)).toBeVisible();

    // 5. Invalid project
    await page.goto('/projects/non_existent_project_404');
    await expect(page.getByText(/Project Not Found/i)).toBeVisible();

    // 6. Invalid issue
    await page.goto('/issues/non_existent_issue_404');
    await expect(page.getByText(/Civic Issue Not Found/i)).toBeVisible();

    // 7. Invalid event
    await page.goto('/events/non_existent_event_404');
    await expect(page.getByText(/Event Not Found/i)).toBeVisible();

    // 8. Invalid community group
    await page.goto('/community/groups/non_existent_group_404');
    await expect(page.getByText(/Community Circle Not Found/i)).toBeVisible();
  });

  test('persists state and actions across full page reloads', async ({ page }) => {
    // Complete lesson in browser
    await page.goto('/learn/course_civic_obs_01/lesson/les_obs_104');
    await page.getByRole('button', { name: /Mark Lesson Complete/i }).click();
    await expect(page.getByText(/Lesson Completed!|Completed Lesson/i).first()).toBeVisible();

    // Full page reload
    await page.reload();

    // Confirm state persisted after browser refresh
    await expect(page.getByText(/Lesson Completed|Completed Lesson/i).first()).toBeVisible();

    // Verify persisted record in Passport after reload
    await page.goto('/passport');
    await expect(page.getByText(/Completed: Conducting Peer Pedestrian Safety Interviews/i)).toBeVisible();
  });

  test('renders dense deliberative chamber and admin screens cleanly on mobile viewports', async ({ page }) => {
    // Set viewport to mobile standard 375x667
    await page.setViewportSize({ width: 375, height: 667 });

    // 1. Assembly Session Workspace on Mobile
    await page.goto('/assemblies/assembly_jaipur_pedestrian_2026/session');
    await expect(page.getByText(/Canonical Deliberation Pathway \(6 Stages\)/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'All 4 Zones' })).toBeVisible();

    const sessionOverflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(sessionOverflow.scrollWidth).toBeLessThanOrEqual(sessionOverflow.clientWidth);

    // 2. Admin Dashboard on Mobile
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('heading', { name: /State Command/i })).toBeVisible();

    // 3. Admin Programmes on Mobile
    await page.goto('/admin/programmes');
    await expect(page.getByRole('heading', { name: /State Programmes Administration|Programmes/i })).toBeVisible();

    // 4. Mobile Bottom Nav is present
    await expect(page.getByRole('navigation', { name: 'Mobile Navigation' })).toBeVisible();
  });

  test('prevents document horizontal overflow at phone viewports (375px and 320px) with interactive controls', async ({ page }) => {
    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 812 });

      // 1. Deliberative Assembly Session Route
      await page.goto('/assemblies/assembly_jaipur_pedestrian_2026/session');
      await expect(page.getByRole('heading', { name: /(Rajkot|Jaipur) School Zone Pedestrian Safety Youth Assembly 2026/i })).toBeVisible();

      const sessionWidths = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(sessionWidths.scrollWidth).toBeLessThanOrEqual(sessionWidths.clientWidth);

      // Verify stage controls are accessible and interactive without causing overflow
      const stageBtn = page.getByRole('button', { name: /Stage 1/i }).first();
      if (await stageBtn.isVisible()) {
        await stageBtn.click();
      }

      const postStageWidths = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(postStageWidths.scrollWidth).toBeLessThanOrEqual(postStageWidths.clientWidth);

      // 2. Verifiable Evidence Repository Route
      await page.goto('/passport/evidence');
      await expect(page.getByRole('heading', { name: /Verifiable Evidence Repository/i })).toBeVisible();

      const evidenceWidths = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(evidenceWidths.scrollWidth).toBeLessThanOrEqual(evidenceWidths.clientWidth);

      // Verify filter controls are accessible and interactive without causing overflow
      const verifiedFilterBtn = page.getByRole('button', { name: 'verified' });
      await expect(verifiedFilterBtn).toBeVisible();
      await verifiedFilterBtn.click();

      const postFilterWidths = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(postFilterWidths.scrollWidth).toBeLessThanOrEqual(postFilterWidths.clientWidth);
    }
  });

  test('manages persona-scoped state, notification links, and deterministic reset', async ({ page }) => {
    // 1. Check notifications
    await page.goto('/notifications');
    await expect(page.getByRole('heading', { name: /Notifications/i })).toBeVisible();

    // Click a notification to test link routing
    const notifLink = page.getByRole('link', { name: /View Details|Review|Go to/i }).first();
    if (await notifLink.isVisible()) {
      await notifLink.click();
      await expect(page).not.toHaveURL('**/notifications');
    }

    // 2. Switch to Platform Admin / Founder Persona
    await page.getByRole('button', { name: /Viewing as/i }).click();
    await page.getByRole('dialog').getByRole('button', { name: /(Nazim M\. Sandh|Dev Patel)/i }).click();
    await expect(page.getByText(/(Nazim M\. Sandh|Dev Patel)/i).first()).toBeVisible();
    await expect(page.getByText(/Viewing as/i).first()).toBeVisible();

    // 3. Admin local change on Programmes
    await page.goto('/admin/programmes');
    await expect(page.getByRole('heading', { name: /State Programmes Administration|Programmes/i })).toBeVisible();
    // Test filter tabs
    await page.getByRole('button', { name: /Active/i }).click();
    await expect(page.getByText(/My Community, My Future/i)).toBeVisible();

    // 4. Test Demo Reset Modal
    await page.getByRole('button', { name: /Reset/i }).click();
    await expect(page.getByText(/Reset Demo Data\?/i)).toBeVisible();
    await page.getByRole('button', { name: /Yes, Restore Initial Seed/i }).click();

    // Verify redirect to dashboard as primary persona after reset
    await page.waitForURL('**/dashboard');
    await expect(page.getByText(/(Ankita Kapri|Aarav Sharma)/i).first()).toBeVisible();
  });
});
