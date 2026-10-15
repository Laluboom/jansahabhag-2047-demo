import { test, expect } from '@playwright/test';

test.describe('Package 08A: Shared Reservation Allocation & Limited Event Places', () => {
  test.beforeEach(async ({ page }) => {
    // Reset local database via demo-login
    await page.goto('/demo-login');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/demo-login');
    await page.waitForLoadState('networkidle');
  });

  test('desktop: displays reservation metrics, rulebook, privacy protection, and denied ordinary path', async ({ page }) => {
    // 1. Login as participant Aarav Sharma
    await page.getByText('Aarav Sharma').first().click();
    await page.waitForURL('**/dashboard');

    // 2. Navigate to small fictional Jaipur event (capacity 3, 2 ordinary enrolled, 1 vacant reserved)
    await page.goto('/events/evt_jaipur_limited_05');
    await page.waitForURL('**/events/evt_jaipur_limited_05');

    // 3. Verify event header & capacity
    await expect(page.getByRole('heading', { level: 1, name: /Jaipur Ward 24 Youth Council/i })).toBeVisible();
    await expect(page.getByTestId('reservation-allocation-card')).toBeVisible();

    // 4. Verify aggregate allocation metrics with privacy withholding for small cohorts
    await expect(page.getByTestId('metric-total-places')).toHaveText('3');
    await expect(page.getByTestId('metric-reserved-minimum')).toHaveText('1');
    await expect(page.getByTestId('metric-ordinary-places')).toHaveText('2');
    await expect(page.getByTestId('metric-ordinary-occupied')).toHaveText('Withheld');
    await expect(page.getByTestId('metric-reserved-occupied')).toHaveText('Withheld');
    await expect(page.getByTestId('metric-vacancies-count')).toHaveText('Withheld');
    await expect(page.getByTestId('status-privacy-suppressed')).toBeVisible();
    await expect(page.getByTestId('small-cohort-privacy-notice')).toBeVisible();

    // Negative assertion: Status chips that reveal eligibility are suppressed for participants
    await expect(page.getByTestId('status-pending')).toHaveCount(0);
    await expect(page.getByTestId('status-finalized-compliant')).toHaveCount(0);
    await expect(page.getByTestId('status-blocked-noncompliant')).toHaveCount(0);
    await expect(page.getByTestId('status-finalized-exception')).toHaveCount(0);

    // 5. Verify privacy protection in participant list: no individual declarations exposed
    const cohortCard = page.getByTestId('registered-cohort-card');
    await expect(cohortCard.getByText('Participants Registered (2)')).toBeVisible();
    await expect(cohortCard.getByText('Vikram Joshi')).toBeVisible();
    await expect(cohortCard.getByText('Rohan Mehta')).toBeVisible();
    // Ensure no gender or reservation tags appear next to participants
    await expect(cohortCard.locator('text=/\\b(eligible|ineligible|female|male|reservation)\\b/i')).toHaveCount(0);

    // 6. Test Point-of-Use Rulebook
    const rulebookToggle = page.getByTestId('toggle-rulebook-btn');
    await expect(rulebookToggle).toBeVisible();
    await rulebookToggle.click();

    const rulebookContent = page.getByTestId('rulebook-content');
    await expect(rulebookContent).toBeVisible();
    await expect(rulebookContent.getByText(/ceil\(0\.33 × allocatedPlaces\)/i)).toBeVisible();
    await expect(rulebookContent.getByText(/vacant by default/i)).toBeVisible();
    await expect(rulebookContent.getByText(/Provisional Ordinary Sign-Ups/i)).toBeVisible();
    await expect(rulebookContent.getByText(/Single-Browser Demonstration Notice/i)).toBeVisible();

    // 7. Verify denied path: Aarav Sharma (ordinary/ineligible participant) attempts to RSVP 'Attending'
    // when ordinary capacity is 2/2 full and 1 reserved place remains vacant
    const attendingBtn = page.getByRole('button', { name: /^Attending$/i });
    await attendingBtn.click();

    // Verify rejection alert is displayed with generalized explanation (no exact category breakdown leaked)
    const alertBox = page.getByRole('alert');
    await expect(alertBox).toBeVisible();
    await expect(alertBox.getByText(/Ordinary capacity reached: general places are fully subscribed/i)).toBeVisible();
    await expect(alertBox.getByText(/\(2\/2\)/)).toHaveCount(0);
    await expect(alertBox.getByText(/Unmet reserved places stay vacant by default/i)).toBeVisible();

    // Verify participant authority is restricted
    await expect(page.getByText(/Authority Restricted:.*Only Platform Owner/i)).toBeVisible();

    // 8. Test compliant eligible path: Switch to eligible participant Meera Singh
    await page.goto('/demo-login');
    await page.getByText('Meera Singh').first().click();
    await page.waitForURL('**/dashboard');

    await page.goto('/events/evt_jaipur_limited_05');
    await page.waitForURL('**/events/evt_jaipur_limited_05');

    // Meera RSVPs Attending to claim the vacant reserved place
    await page.getByRole('button', { name: /^Attending$/i }).click();

    // Verify participant view still withholds counts so observer cannot infer Meera's eligibility from before/after change
    await expect(page.getByTestId('metric-reserved-occupied')).toHaveText('Withheld');
    await expect(page.getByTestId('metric-ordinary-occupied')).toHaveText('Withheld');
    await expect(page.getByTestId('metric-vacancies-count')).toHaveText('Withheld');
    await expect(page.getByTestId('status-privacy-suppressed')).toBeVisible();

    // 9. Switch to Platform Owner (Demo Administrator) to verify exact validation details are retained
    await page.goto('/demo-login');
    await page.getByText('Demo Administrator').first().click();
    await page.waitForURL('**/dashboard');

    await page.goto('/events/evt_jaipur_limited_05');
    await page.waitForURL('**/events/evt_jaipur_limited_05');

    // Owner view retains unredacted exact metrics and validation status
    await expect(page.getByTestId('metric-total-places')).toHaveText('3');
    await expect(page.getByTestId('metric-reserved-minimum')).toHaveText('1');
    await expect(page.getByTestId('metric-ordinary-places')).toHaveText('2');
    await expect(page.getByTestId('metric-reserved-occupied')).toHaveText('1');
    await expect(page.getByTestId('metric-ordinary-occupied')).toHaveText('2');
    await expect(page.getByTestId('metric-vacancies-count')).toHaveText('0');
    await expect(page.getByTestId('status-pending')).toBeVisible();
    await expect(page.getByTestId('status-privacy-suppressed')).toHaveCount(0);
  });

  test('desktop: simulates Platform Owner exception approval with audit record', async ({ page }) => {
    // 1. Login as Platform Admin (Demo Administrator)
    await page.goto('/demo-login');
    await page.getByText('Demo Administrator').first().click();
    await page.waitForURL('**/dashboard');

    // 2. Go to the small fictional Jaipur event
    await page.goto('/events/evt_jaipur_limited_05');
    await page.waitForURL('**/events/evt_jaipur_limited_05');

    // 3. Platform Owner authority panel is enabled
    const approveBtn = page.getByTestId('approve-exception-btn');
    await expect(approveBtn).toBeVisible();
    await expect(approveBtn).toBeEnabled();

    // 4. Click approve exception to open modal
    await approveBtn.click();
    const modal = page.getByTestId('exception-modal');
    await expect(modal).toBeVisible();
    await expect(modal.getByText(/2026\.1-womens-reservation-33/i)).toBeVisible();

    // 5. Enter substantive reason and confirm
    const textarea = page.getByTestId('exception-reason-textarea');
    await textarea.fill('Targeted candidate outreach exhausted across 3 rounds; urgent consultation delivery approved.');

    const confirmBtn = page.getByTestId('confirm-exception-btn');
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();

    // 6. Verify status updates to finalized exception
    await expect(page.getByTestId('status-finalized-exception')).toBeVisible();

    // 7. Verify visible immutable audit record is displayed for Owner
    const auditBox = page.getByTestId('exception-audit-box');
    await expect(auditBox).toBeVisible();
    await expect(auditBox.getByText(/user_admin \(platform_admin\)/i)).toBeVisible();
    await expect(auditBox.getByText(/2026\.1-womens-reservation-33/i)).toBeVisible();
    await expect(auditBox.getByText(/Targeted candidate outreach exhausted/i)).toBeVisible();

    // 8. Negative assertion: Participant view suppresses disclosing status, exact numbers, and audit details
    await page.goto('/demo-login');
    await page.getByText('Aarav Sharma').first().click();
    await page.waitForURL('**/dashboard');

    await page.goto('/events/evt_jaipur_limited_05');
    await page.waitForURL('**/events/evt_jaipur_limited_05');

    await expect(page.getByTestId('status-privacy-suppressed')).toBeVisible();
    await expect(page.getByTestId('status-finalized-exception')).toHaveCount(0);
    await expect(page.getByTestId('metric-reserved-occupied')).toHaveText('Withheld');
    await expect(page.getByTestId('metric-vacancies-count')).toHaveText('Withheld');

    const participantAudit = page.getByTestId('exception-audit-box');
    await expect(participantAudit).toBeVisible();
    await expect(participantAudit.getByText(/user_admin/i)).toHaveCount(0);
    await expect(participantAudit.getByText(/Targeted candidate outreach exhausted/i)).toHaveCount(0);
    await expect(participantAudit.getByText(/\b\d+ vacant\b/i)).toHaveCount(0);
  });

  test('mobile: responsive layout at 375px viewport with no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/demo-login');
    await page.getByText('Aarav Sharma').first().click();
    await page.waitForURL('**/dashboard');

    await page.goto('/events/evt_jaipur_limited_05');
    await page.waitForURL('**/events/evt_jaipur_limited_05');

    // Verify header and reservation allocation card render cleanly
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByTestId('reservation-allocation-card')).toBeVisible();

    // Verify point-of-use rulebook toggle works on mobile
    await page.getByTestId('toggle-rulebook-btn').click();
    await expect(page.getByTestId('rulebook-content')).toBeVisible();

    // Check no horizontal scrollbar / overflow on mobile viewport
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });
});
