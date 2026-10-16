import { test, expect } from '@playwright/test';

test.describe('Youth Parliament Preview Reservation Policy & Delegation Illustration (Package 11)', () => {
  test('desktop: verifies illustrative notice, point-of-use rulebook, formula calculation, and interactive scenarios', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/parliament');

    // 1. Verify Page Heading and Banner
    await expect(page.getByRole('heading', { level: 1, name: /National Youth Parliament 2047/i })).toBeVisible();
    await expect(page.getByText('National Youth Parliament Preview').first()).toBeVisible();

    // 2. Verify Illustrative Notice for 540-Member Plenary Metrics
    const notice = page.locator('[data-testid="parliament-illustrative-notice"]');
    await expect(notice).toBeVisible();
    await expect(notice).toContainText('Notice on 540-Member Plenary Metrics');
    await expect(notice).toContainText('illustrative prototype figures only');
    await expect(notice).toContainText('not been validated or enforced under the 33% Women\'s Reservation Policy');
    await expect(notice).toContainText('production parliamentary enforcement workflows remain unbuilt');

    // 3. Verify Point-of-Use Reservation Rulebook Card
    const rulebook = page.locator('[data-testid="parliament-reservation-rulebook"]');
    await expect(rulebook).toBeVisible();
    await expect(rulebook).toContainText('Youth Parliament Reservation Policy & Point-of-Use Rulebook (§§1–10)');
    await expect(rulebook).toContainText('Policy 2026.1-womens-reservation-33');
    await expect(rulebook).toContainText('ceil(0.33 × 3) = 1');
    await expect(rulebook).toContainText('Reserved Vacancy Default');
    await expect(rulebook).toContainText('Unfilled reserved places remain held vacant by default');
    await expect(rulebook).toContainText('Privacy & Non-Inference');
    await expect(rulebook).toContainText('Never infer eligibility from names, portraits, voices, or proxies');
    await expect(rulebook).toContainText('Prototype Boundary Notice');

    // 4. Verify Fictional Jaipur 3-Seat Delegation Illustration (Default: Scenario A Compliant)
    const illustration = page.locator('[data-testid="parliament-delegation-illustration"]');
    await expect(illustration).toBeVisible();
    await expect(illustration).toContainText('Fictional Jaipur Youth Delegation Allocation (Illustrative 3-Seat Prototype)');

    // Check Metrics Bar
    await expect(page.locator('[data-testid="metric-total-places"]')).toHaveText('3');
    await expect(page.locator('[data-testid="metric-formula"]')).toContainText('ceil(0.33 × 3) = 1');
    await expect(page.locator('[data-testid="metric-reserved-filled"]')).toContainText('1 / 1');
    await expect(page.locator('[data-testid="metric-vacancies"]')).toHaveText('0');

    // Check Validation Status Badge
    await expect(page.locator('[data-testid="validation-status-badge"]')).toHaveText('VALIDATION OUTCOME: COMPLIANT');

    // Check Small-Cohort Privacy Notice
    await expect(page.locator('[data-testid="small-cohort-privacy-notice"]')).toBeVisible();
    await expect(page.locator('[data-testid="small-cohort-privacy-notice"]')).toContainText('Small-Cohort Privacy Notice');

    // Check Anonymous Candidate Seats (No persona names or linked IDs)
    await expect(page.locator('[data-testid="seat-card-1"]')).toContainText('Seat #1 — Fictional Reserved Allocation');
    await expect(page.locator('[data-testid="seat-card-1"]')).toContainText('Reserved Allocation');
    await expect(page.locator('[data-testid="seat-card-1"]')).toContainText('Occupied by Eligible Candidate');
    await expect(page.locator('[data-testid="seat-card-1"]')).not.toContainText('Priya Sharma');

    await expect(page.locator('[data-testid="seat-card-2"]')).toContainText('Seat #2 — Fictional General Allocation');
    await expect(page.locator('[data-testid="seat-card-2"]')).toContainText('General Allocation');
    await expect(page.locator('[data-testid="seat-card-2"]')).toContainText('Occupied by General Candidate');
    await expect(page.locator('[data-testid="seat-card-2"]')).not.toContainText('Aarav Sharma');

    await expect(page.locator('[data-testid="seat-card-3"]')).toContainText('Seat #3 — Fictional General Allocation');
    await expect(page.locator('[data-testid="seat-card-3"]')).toContainText('General Allocation');
    await expect(page.locator('[data-testid="seat-card-3"]')).toContainText('Occupied by General Candidate');
    await expect(page.locator('[data-testid="seat-card-3"]')).not.toContainText('Vikram Malhotra');

    // 5. Switch to Scenario B: Non-Compliant (Reserved Vacancy Default)
    await page.locator('[data-testid="scenario-btn-noncompliant"]').click();

    await expect(page.locator('[data-testid="validation-status-badge"]')).toContainText('UNMET RESERVED MINIMUM (1 VACANCY)');
    await expect(page.locator('[data-testid="metric-reserved-filled"]')).toContainText('0 / 1');
    await expect(page.locator('[data-testid="metric-vacancies"]')).toHaveText('1');

    // Verify Seat 3 is held vacant
    await expect(page.locator('[data-testid="seat-card-3"]')).toContainText('Held Vacant');
    await expect(page.locator('[data-testid="seat-card-3"]')).toContainText('Held Vacant by Default (Reserved)');

    // Verify Service Warning Message
    const outcomeBox = page.locator('[data-testid="service-validation-outcome"]');
    await expect(outcomeBox).toContainText('Unmet reserved minimum: 0 of 1 reserved places filled');
    await expect(outcomeBox).toContainText('1 place(s) remain held vacant by default');

    // 6. Switch to Scenario C: Blocked Ordinary Overbooking Attempt
    await page.locator('[data-testid="scenario-btn-overbooked"]').click();

    await expect(page.locator('[data-testid="validation-status-badge"]')).toHaveText('VALIDATION OUTCOME: BLOCKED NON-COMPLIANT');
    await expect(outcomeBox).toContainText('Ordinary capacity exceeded (3/2)');
    await expect(outcomeBox).toContainText('Reserved places cannot be transferred to ordinary participants without an approved Platform Owner exception');
    await expect(page.locator('[data-testid="seat-card-3"]')).toContainText('Seat #3 — Blocked General Allocation');
    await expect(page.locator('[data-testid="seat-card-3"]')).toContainText('Blocked without Platform Owner Exception');
    await expect(page.locator('[data-testid="seat-card-3"]')).not.toContainText('Rohan Mehta');

    // 7. Verify Disclaimer Footer (No False Claim of Enforcement)
    await expect(illustration).toContainText('Prototype Preview Limitation: Illustrative calculation only. Real member appointment and parliamentary delegation selection remain unbuilt.');
    await expect(illustration).toContainText('Validated via reservationAllocationService.ts');
  });

  test('mobile: responsive rendering at 375px viewport with no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/parliament');

    // Wait for content to render
    await expect(page.getByRole('heading', { level: 1, name: /National Youth Parliament 2047/i })).toBeVisible();
    await expect(page.locator('[data-testid="parliament-illustrative-notice"]')).toBeVisible();
    await expect(page.locator('[data-testid="parliament-reservation-rulebook"]')).toBeVisible();
    await expect(page.locator('[data-testid="parliament-delegation-illustration"]')).toBeVisible();

    // Verify no horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Verify scenario buttons function on mobile
    await page.locator('[data-testid="scenario-btn-noncompliant"]').click();
    await expect(page.locator('[data-testid="validation-status-badge"]')).toContainText('UNMET RESERVED MINIMUM');

    const hasHorizontalOverflowAfterClick = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflowAfterClick).toBe(false);
  });
});
