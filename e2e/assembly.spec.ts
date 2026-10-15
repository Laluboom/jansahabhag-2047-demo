import { test, expect } from '@playwright/test';

test.describe('Package 05: Youth Assembly Procedure, Roles, Stages & Dissent (Desktop & Mobile)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo-login');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
  });

  test('desktop: displays canonical 6 stages, 4 functional role zones, and performs deliberative action', async ({ page }) => {
    // 1. Log in as Aarav Sharma
    await page.goto('/demo-login');
    await page.getByText('Aarav Sharma').first().click();
    await page.waitForURL('**/dashboard');

    // 2. Navigate to Jaipur Youth Assembly
    await page.goto('/assemblies/assembly_jaipur_pedestrian_2026');
    await page.waitForURL('**/assemblies/assembly_jaipur_pedestrian_2026');

    // Verify 6-stage roadmap is present on detail page
    await expect(page.getByText(/Assembly Deliberation Pathway \(6 Stages\)/i)).toBeVisible();

    // Join Assembly if not joined
    const joinBtn = page.getByRole('button', { name: /Join Youth Assembly/i });
    if (await joinBtn.isVisible()) {
      await joinBtn.click();
      await page.waitForURL('**/session');
    } else {
      await page.getByRole('button', { name: /Enter Live Deliberation/i }).click();
      await page.waitForURL('**/session');
    }

    // 3. Verify Session Header and 6 Stages
    await expect(page.getByText(/Youth Chamber in Session/i)).toBeVisible();
    await expect(page.getByText(/Canonical Deliberation Pathway \(6 Stages\)/i)).toBeVisible();

    // Verify all 6 stages are present on the timeline
    await expect(page.getByRole('button', { name: /Stage 1.*Frame/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Stage 2.*Think/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Stage 3.*Enable/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Stage 4.*Troubleshoot/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Stage 5.*Shape/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Stage 6.*Final Assembly/i })).toBeVisible();

    // 4. Verify Desktop 4 Functional Balanced Role Zones
    await expect(page.locator('.font-heading', { hasText: 'Thinker' }).first()).toBeVisible();
    await expect(page.locator('.font-heading', { hasText: 'Enabler' }).first()).toBeVisible();
    await expect(page.locator('.font-heading', { hasText: 'Troubleshooter' }).first()).toBeVisible();
    await expect(page.locator('.font-heading', { hasText: 'Shaper' }).first()).toBeVisible();

    // 5. Point-of-use Rulebook & Roles and Powers Modals
    const rulebookBtn = page.getByRole('button', { name: /Rulebook/i }).first();
    await expect(rulebookBtn).toBeVisible();
    await rulebookBtn.click();
    await expect(page.getByText(/Deliberative Rulebook/i).first()).toBeVisible();
    await page.getByRole('button', { name: /Close Rulebook/i }).click();

    const rolesBtn = page.getByRole('button', { name: /Roles & Powers/i });
    await expect(rolesBtn).toBeVisible();
    await rolesBtn.click();
    await expect(page.getByText(/Four Non-Hierarchical Assembly Functional Roles & Powers/i)).toBeVisible();
    await page.getByRole('button', { name: /Done/i }).click();

    // 6. Perform an actual deliberative assembly action (submit contribution)
    const contribTextarea = page.getByPlaceholder(/Enter your substantive inquiry or argument citing evidence/i);
    await contribTextarea.fill('Verifying pedestrian refuge island safety at Navchetna School intersection.');
    await page.getByRole('button', { name: /Submit Contribution/i }).click();

    // Verify contribution submission notification/confirmation
    await expect(page.getByText(/Substantive contribution submitted!/i)).toBeVisible();

    // 7. Request speaking turn in Speaking Queue
    const speakBtn = page.getByRole('button', { name: /Request Speaking Turn/i });
    await expect(speakBtn).toBeVisible();
    await speakBtn.click();
    await expect(page.getByText(/Aarav Sharma/i).first()).toBeVisible();
  });

  test('mobile: filterable/stacked functional role zones and responsive layout', async ({ page }) => {
    // Set mobile viewport (iPhone 12 / pixel width)
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/demo-login');
    await page.getByText('Aarav Sharma').first().click();
    await page.waitForURL('**/dashboard');

    // Go directly to assembly session
    await page.goto('/assemblies/assembly_jaipur_pedestrian_2026/session');
    await page.waitForURL('**/session');

    // Verify session header loads
    await expect(page.getByText(/Youth Chamber in Session/i)).toBeVisible();

    // Verify mobile role tabs are present
    await expect(page.getByRole('button', { name: 'All 4 Zones' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Thinker' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enabler' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Troubleshooter' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Shaper' })).toBeVisible();

    // Filter to Thinker zone
    await page.getByRole('button', { name: 'Thinker' }).click();
    await expect(page.locator('.font-heading', { hasText: 'Thinker' }).first()).toBeVisible();

    // Switch back to All 4 Zones
    await page.getByRole('button', { name: 'All 4 Zones' }).click();
    await expect(page.locator('.font-heading', { hasText: 'Enabler' }).first()).toBeVisible();

    // Verify 6 stages timeline is scrollable/navigable on mobile
    await expect(page.getByRole('button', { name: /Stage 1.*Frame/i })).toBeVisible();
  });
});
