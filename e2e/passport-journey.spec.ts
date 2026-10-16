import { test, expect } from '@playwright/test';

test.describe('Package 07 — Evidence-based Passport and Explainable Credits E2E Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo-login');
    await page.evaluate(() => {
      localStorage.removeItem('jansahbhag_demo_v1');
    });
    await page.reload();
  });

  test('desktop: complete cross-record Jaipur journey from assignment submission to Passport, source linking, and explainable credits', async ({ page }) => {
    // 1. Login as Aarav Sharma (Jaipur participant)
    await page.goto('/demo-login');
    await expect(page.getByRole('heading', { name: /Enter JanSahabhag/i })).toBeVisible();
    await page.getByText('Aarav Sharma').first().click();
    await page.waitForURL('**/dashboard');

    // 2. Submit an assignment with field observation evidence
    await page.goto('/assignments/asg_obs_03/submit');
    await expect(page.getByRole('heading', { name: /Pedestrian Flow Interview with 5 Peers/i })).toBeVisible();

    const notesInput = page.getByLabel(/Field Observation Notes & Data Log/i);
    await notesInput.fill('Comprehensive audit of student crossing times and pedestrian delays outside Navchetna School Gate 1.');

    // Log new distinct mock evidence
    await page.getByRole('button', { name: /Log New Mock Evidence/i }).click();
    await page.getByLabel(/Evidence Title/i).fill('Student Commuter Safety Survey Responses');
    await page.getByLabel(/Description & Quantitative Findings/i).fill('Survey of 5 walkers showing crossing hazards.');
    await page.getByRole('button', { name: /Save & Attach Evidence/i }).click();

    // Submit for Verification
    await page.getByRole('button', { name: /Submit for Verification/i }).click();

    // Confirm submission succeeded
    await page.waitForURL('**/assignments/asg_obs_03**');
    await expect(page.getByText(/Under Review|Submitted/i).first()).toBeVisible();

    // 3. Open Civic Passport Portfolio
    await page.goto('/passport');
    await expect(page.getByText(/Civic Passport Portfolio \(Demo Simulation\)/i)).toBeVisible();
    await expect(page.getByText(/Portfolio of evidence, not a score of moral worth/i)).toBeVisible();

    // 4. Verify 7 PRD Dimensions Grid
    for (const dim of ['Learning', 'Observation', 'Deliberation', 'Contribution', 'Collaboration', 'Civic Action', 'Reflection']) {
      await expect(page.getByText(dim, { exact: false }).first()).toBeVisible();
    }

    // 5. Verify Pending Review Section exists and is clearly separated
    const pendingSection = page.getByText(/Pending Review & Self-Reported Items/i);
    await expect(pendingSection).toBeVisible();
    await expect(page.getByText(/Uncounted in verified balance/i)).toBeVisible();

    // Verify pending entry does NOT have green verified badge
    await expect(page.getByText('Self-Reported • Pending Review').first()).toBeVisible();

    // 6. Follow source link from Passport back to assignment submission review surface
    const viewSourceLink = page.getByRole('link', { name: /View Source/i }).first();
    await expect(viewSourceLink).toBeVisible();
    await viewSourceLink.click();

    // Verify navigation to assignment detail with submissionId
    await page.waitForURL(/.*\/assignments\/asg_obs_03.*/);
    await expect(page.getByRole('heading', { name: /Pedestrian Flow Interview/i })).toBeVisible();

    // 7. Return to Passport and verify verified entries link to their sources
    await page.goto('/passport');
    const verifiedSection = page.getByText(/Verified Civic Activity Records/i);
    await expect(verifiedSection).toBeVisible();

    // Look for a verified entry with a source link
    const sourceLinks = page.locator('a:has-text("View Source")');
    const sourceCount = await sourceLinks.count();
    expect(sourceCount).toBeGreaterThan(0);

    // 8. Navigate to Credit Ledger and verify explainable formula
    await page.goto('/passport/credits');
    await expect(page.getByRole('heading', { name: /Civic Credit Ledger/i })).toBeVisible();
    await expect(page.getByText(/Transparent Activity Award Rules & Explainable Formula/i)).toBeVisible();
    await expect(page.getByText(/7 PRD Dimensions/i)).toBeVisible();

    // Check pending credits callout
    await expect(page.getByText(/Pending Mentor Review/i).first()).toBeVisible();

    // 9. Open Credit Appeal Modal (routed to mentor Kavita Rao, strictly barring AI)
    const appealBtn = page.getByRole('button', { name: /Appeal Review|Appeal/i }).first();
    await expect(appealBtn).toBeVisible();
    await appealBtn.click();

    await expect(page.getByText(/Dispute Review \/ Credit Adjustment/i)).toBeVisible();
    await expect(page.getByText(/Kavita Rao/i).first()).toBeVisible();
    await expect(page.getByText(/Automated AI algorithms are strictly barred/i)).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: /Cancel/i }).click();
    await expect(page.getByText(/Dispute Review \/ Credit Adjustment/i)).not.toBeVisible();
  });

  test('mobile & keyboard: verified responsive layout and keyboard accessibility for source linking', async ({ page }) => {
    // Set mobile viewport (iPhone standard)
    await page.setViewportSize({ width: 375, height: 667 });

    // Login as Aarav Sharma
    await page.goto('/demo-login');
    await page.getByText('Aarav Sharma').first().click();
    await page.waitForURL('**/dashboard');

    // Navigate to Passport
    await page.goto('/passport');
    await expect(page.getByText(/Civic Passport Portfolio \(Demo Simulation\)/i)).toBeVisible();

    // Check mobile dimension cards render
    await expect(page.getByText('Learning').first()).toBeVisible();
    await expect(page.getByText('Deliberation').first()).toBeVisible();

    // Verify source link is keyboard focusable and navigates properly
    const firstSourceLink = page.locator('a:has-text("View Source")').first();
    await expect(firstSourceLink).toBeVisible();
    await firstSourceLink.focus();
    await page.keyboard.press('Enter');

    // Confirm navigation occurred without error
    await expect(page).not.toHaveURL(/\/passport$/);
  });
});
