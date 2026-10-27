import { test, expect } from '@playwright/test';

test.describe('Master PRD Learner Navigation & Product Identity E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo-login');
    await page.evaluate(() => {
      localStorage.removeItem('jansahbhag_demo_v1');
    });
    await page.reload();
    await page.getByText(/Ankita Kapri|Aarav Sharma/).first().click();
    await page.waitForURL('**/dashboard');
  });

  const EXPECTED_ELEVEN_LABELS = [
    'Home',
    'Learn',
    'Activities & Assignments',
    'Debate Room',
    'Youth Assembly',
    'Youth Parliament',
    'Workspace',
    'Labs & Projects',
    'Community',
    'Civic Passport',
    'UHV / Jeevan Vidya',
  ];

  test('desktop displays exact eleven canonical learner entries in order and truthful preview destinations', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const learnerNav = page.locator('nav[aria-label="Learner Navigation"]');
    await expect(learnerNav).toBeVisible();

    const links = learnerNav.locator('a');
    await expect(links).toHaveCount(11);

    for (let i = 0; i < EXPECTED_ELEVEN_LABELS.length; i++) {
      await expect(links.nth(i)).toContainText(EXPECTED_ELEVEN_LABELS[i]);
    }

    // 1. Debate Room (item 4): interactive local simulation
    await links.nth(3).click();
    await page.waitForURL('**/debate-room');
    await expect(page.getByRole('heading', { level: 1, name: /Debate Room/i })).toBeVisible();
    await expect(page.getByText('Single-Browser Local Simulation')).toBeVisible();

    // 2. Youth Parliament (item 6): clearly labelled prototype
    await page.goto('/dashboard');
    await links.nth(5).click();
    await page.waitForURL('**/parliament');
    await expect(page.getByRole('heading', { level: 1, name: /Youth Parliament/i })).toBeVisible();
    await expect(page.getByText(/National Youth Parliament Preview/i).first()).toBeVisible();

    // 3. Workspace (item 7): interactive local simulation linked to proposition
    await page.goto('/dashboard');
    await links.nth(6).click();
    await page.waitForURL('**/workspace');
    await expect(page.getByRole('heading', { level: 1, name: 'Workspace' })).toBeVisible();
    await expect(page.getByText(/Single-Browser Local Simulation/i)).toBeVisible();
    await expect(page.getByText(/(Rajkot|Jaipur) Ward (8|24) School-Zone Safety Workspace/i)).toBeVisible();

    // 4. UHV / Jeevan Vidya (item 11): dedicated stream with disclaimer
    await page.goto('/dashboard');
    await links.nth(10).click();
    await page.waitForURL('**/uhv');
    await expect(page.getByRole('heading', { level: 1, name: 'UHV / Jeevan Vidya' })).toBeVisible();
    await expect(page.getByText(/Fictional Demo Material • Curriculum Rights Awaiting Owner Review/i)).toBeVisible();
    await expect(page.getByText(/Universal Human Values: Self-Exploration & Civic Ethics/i)).toBeVisible();
  });

  test('mobile navigation reveals the same eleven ordered entries in drawer, closes on selection and Escape', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify 5-item bottom quick access exists
    const bottomNav = page.locator('nav[aria-label="Mobile Navigation"]');
    await expect(bottomNav).toBeVisible();

    // Drawer is closed initially
    const drawer = page.locator('[role="dialog"][aria-label="Navigation drawer"]');
    await expect(drawer).not.toBeVisible();

    // Open mobile menu toggle
    const toggle = page.locator('button[data-testid="mobile-menu-toggle"]');
    await toggle.click();
    await expect(drawer).toBeVisible();

    // Verify all 11 ordered entries are inside drawer
    const drawerLearnerNav = drawer.locator('nav[aria-label="Learner Navigation"]');
    const drawerLinks = drawerLearnerNav.locator('a');
    await expect(drawerLinks).toHaveCount(11);

    for (let i = 0; i < EXPECTED_ELEVEN_LABELS.length; i++) {
      await expect(drawerLinks.nth(i)).toContainText(EXPECTED_ELEVEN_LABELS[i]);
    }

    // Click item 5: Youth Assembly, should navigate and close drawer
    await drawerLinks.nth(4).click();
    await page.waitForURL('**/assemblies');
    await expect(drawer).not.toBeVisible();

    // Reopen drawer and test Escape key to close
    await toggle.click();
    await expect(drawer).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible();
  });

  test('no horizontal overflow across 320, 375, 768, and 1024 px viewports', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 },
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
    ];

    const testRoutes = ['/dashboard', '/learn', '/uhv', '/debate-room', '/workspace', '/assignments', '/projects'];

    for (const vp of viewports) {
      await page.setViewportSize(vp);

      for (const route of testRoutes) {
        await page.goto(route);
        await page.waitForLoadState('domcontentloaded');

        const isOverflowing = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });

        expect(isOverflowing).toBe(false);
      }

      // Check mobile drawer at width 320 and 375
      if (vp.width <= 768) {
        await page.goto('/dashboard');
        const toggle = page.locator('button[data-testid="mobile-menu-toggle"]');
        await toggle.click();
        const drawer = page.locator('[role="dialog"][aria-label="Navigation drawer"]');
        await expect(drawer).toBeVisible();

        const isDrawerOverflowing = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(isDrawerOverflowing).toBe(false);

        await page.keyboard.press('Escape');
      }
    }
  });

  test('verifies visible paths between activities, assignments, and lab previews', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Activities & Assignments: from /assignments to /activities
    await page.goto('/assignments');
    await expect(page.getByRole('heading', { name: 'Field Evidence & Assignments' })).toBeVisible();
    const toActivitiesBtn = page.getByRole('button', { name: /Explore Activities Stream/i });
    await expect(toActivitiesBtn).toBeVisible();
    await toActivitiesBtn.click();
    await page.waitForURL('**/activities');
    await expect(page.getByRole('heading', { name: /Participatory Civic Stream/i })).toBeVisible();

    // 2. Labs & Projects: from /projects to /labs/ideas, /labs/research, /labs/policy
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: /Youth Civic Action Projects/i })).toBeVisible();

    const ideaLabLink = page.getByRole('link', { name: /Idea Lab/i });
    await expect(ideaLabLink).toBeVisible();
    await ideaLabLink.click();
    await page.waitForURL('**/labs/ideas');
    await expect(page.getByRole('heading', { name: /Idea Lab/i })).toBeVisible();

    await page.goto('/projects');
    const researchLabLink = page.getByRole('link', { name: /Research Lab/i });
    await expect(researchLabLink).toBeVisible();
    await researchLabLink.click();
    await page.waitForURL('**/labs/research');
    await expect(page.getByRole('heading', { name: /Research Lab/i })).toBeVisible();

    await page.goto('/projects');
    const policyLabLink = page.getByRole('link', { name: /Policy Lab/i });
    await expect(policyLabLink).toBeVisible();
    await policyLabLink.click();
    await page.waitForURL('**/labs/policy');
    await expect(page.getByRole('heading', { name: /Policy Lab/i })).toBeVisible();
  });

  test('mobile drawer is focus safe: focuses close control on open, keeps Tab within drawer, restores focus on close, aria-controls present', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    const toggle = page.locator('button[data-testid="mobile-menu-toggle"]');
    await expect(toggle).toHaveAttribute('aria-controls', 'mobile-navigation-drawer');

    // Click toggle to open drawer
    await toggle.click();

    const drawer = page.locator('#mobile-navigation-drawer');
    await expect(drawer).toBeVisible();

    // Verify close control is focused on open
    const closeBtn = drawer.locator('button[aria-label="Close navigation menu"]');
    await expect(closeBtn).toBeFocused();

    // Press Shift+Tab and Tab, verify focus remains inside drawer
    await page.keyboard.press('Shift+Tab');
    const isInside1 = await page.evaluate(() => {
      const drawerEl = document.getElementById('mobile-navigation-drawer');
      return drawerEl ? drawerEl.contains(document.activeElement) : false;
    });
    expect(isInside1).toBe(true);

    await page.keyboard.press('Tab');
    const isInside2 = await page.evaluate(() => {
      const drawerEl = document.getElementById('mobile-navigation-drawer');
      return drawerEl ? drawerEl.contains(document.activeElement) : false;
    });
    expect(isInside2).toBe(true);

    // Close drawer via Escape key
    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible();

    // Focus restored to the toggle button
    await expect(toggle).toBeFocused();
  });
});
