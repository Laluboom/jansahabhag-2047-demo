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
    // 1. Login as ordinary participant
    await page.getByRole('button', { name: /All Students/i }).click();
    await page.getByText(/Kanha Kapri|Aarav Sharma/).first().click();
    await page.waitForURL('**/dashboard');

    // 2. Navigate to small fictional event (capacity 3, 2 ordinary enrolled, 1 vacant reserved)
    await page.goto('/events/evt_jaipur_limited_05');
    await page.waitForURL('**/events/evt_jaipur_limited_05');

    // 3. Verify event header & capacity
    await expect(page.getByRole('heading', { level: 1, name: /(Rajkot|Jaipur) Ward 24 Youth Council/i })).toBeVisible();
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

    // 5. Verify privacy protection in participant list: no individual declarations exposed, other attendee identities redacted
    const cohortCard = page.getByTestId('registered-cohort-card');
    await expect(cohortCard.getByText('Participants Registered (2)')).toBeVisible();
    await expect(page.getByTestId('roster-protected-notice')).toBeVisible();
    await expect(page.getByText(/Roster Protected for Allocation Privacy/i)).toBeVisible();
    // Negative assertions: other attendees' names must NOT be exposed to non-owner participant
    await expect(cohortCard.getByText(/(Yash Rathod|Vikram Joshi)/i)).toHaveCount(0);
    await expect(cohortCard.getByText(/(Aroh Mehta|Rohan Mehta)/i)).toHaveCount(0);
    await expect(page.getByText(/(Yash Rathod|Vikram Joshi)/i)).toHaveCount(0);
    await expect(page.getByText(/(Aroh Mehta|Rohan Mehta)/i)).toHaveCount(0);
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

    // Verify rejection alert is displayed with state-neutral explanation (no category breakdown or state clues leaked)
    const alertBox = page.getByRole('alert');
    await expect(alertBox).toBeVisible();
    await expect(alertBox.getByText(/This RSVP cannot be accepted under current allocation rules/i)).toBeVisible();
    await expect(alertBox.getByText(/Reserved places are not automatically reassigned/i)).toBeVisible();
    // Negative assertions: state-specific clues must NOT be present
    await expect(alertBox.getByText(/remain held/i)).toHaveCount(0);
    await expect(alertBox.getByText(/unmet/i)).toHaveCount(0);
    await expect(alertBox.getByText(/vacan/i)).toHaveCount(0);
    await expect(alertBox.getByText(/ordinary/i)).toHaveCount(0);
    await expect(alertBox.getByText(/\(2\/2\)/)).toHaveCount(0);
    await expect(alertBox.getByText(/\b\d+\/\d+\b/)).toHaveCount(0);
    await expect(alertBox.getByText(/fully subscribed/i)).toHaveCount(0);
    await expect(alertBox.getByText(/capacity reached/i)).toHaveCount(0);

    // After denial: attendee names still cannot be derived by participant
    await expect(page.getByText(/(Yash Rathod|Vikram Joshi)/i)).toHaveCount(0);
    await expect(page.getByText(/(Aroh Mehta|Rohan Mehta)/i)).toHaveCount(0);

    // Verify participant authority is restricted
    await expect(page.getByText(/Authority Restricted:.*Only Platform Owner/i)).toBeVisible();

    // 8. Test reload on the named two-attendee event before persona switch:
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('metric-reserved-occupied')).toHaveText('Withheld');
    await expect(page.getByTestId('metric-ordinary-occupied')).toHaveText('Withheld');
    await expect(page.getByTestId('metric-vacancies-count')).toHaveText('Withheld');
    // Attendee names remain unexposed after reload
    await expect(page.getByText(/(Yash Rathod|Vikram Joshi)/i)).toHaveCount(0);
    await expect(page.getByText(/(Aroh Mehta|Rohan Mehta)/i)).toHaveCount(0);

    await page.getByRole('button', { name: /^Attending$/i }).click();
    const alertBoxReload = page.getByRole('alert');
    await expect(alertBoxReload).toBeVisible();
    await expect(alertBoxReload.getByText(/This RSVP cannot be accepted under current allocation rules/i)).toBeVisible();
    await expect(alertBoxReload.getByText(/Reserved places are not automatically reassigned/i)).toBeVisible();
    await expect(alertBoxReload.getByText(/remain held/i)).toHaveCount(0);
    await expect(alertBoxReload.getByText(/unmet/i)).toHaveCount(0);
    await expect(alertBoxReload.getByText(/vacan/i)).toHaveCount(0);
    await expect(alertBoxReload.getByText(/ordinary/i)).toHaveCount(0);
    await expect(alertBoxReload.getByText(/\(2\/2\)/)).toHaveCount(0);

    // Test organizer persona: Organizer also CANNOT derive identities from UI
    await page.goto('/demo-login');
    await page.getByText(/(Shri Dr\. K\. D\. Ladwa|Dev Patel)/i).first().click();
    await page.waitForURL('**/dashboard');
    await page.goto('/events/evt_jaipur_limited_05');
    await page.waitForURL('**/events/evt_jaipur_limited_05');
    await expect(page.getByTestId('roster-protected-notice')).toBeVisible();
    await expect(page.getByText(/(Yash Rathod|Vikram Joshi)/i)).toHaveCount(0);
    await expect(page.getByText(/(Aroh Mehta|Rohan Mehta)/i)).toHaveCount(0);

    // 9. Persona switch to Platform Owner (Demo Administrator) on the 2-attendee event: Owner MUST see precise detail and full attendee roster
    await page.goto('/demo-login');
    await page.getByText(/Nazim M\. Sandh|Demo Administrator/).first().click();
    await page.waitForURL('**/dashboard');

    await page.goto('/events/evt_jaipur_limited_05');
    await page.waitForURL('**/events/evt_jaipur_limited_05');

    // Owner view retains unredacted exact metrics and validation status on the 2-attendee event
    await expect(page.getByTestId('metric-total-places')).toHaveText('3');
    await expect(page.getByTestId('metric-reserved-minimum')).toHaveText('1');
    await expect(page.getByTestId('metric-ordinary-places')).toHaveText('2');
    await expect(page.getByTestId('metric-reserved-occupied')).toHaveText('0');
    await expect(page.getByTestId('metric-ordinary-occupied')).toHaveText('2');
    await expect(page.getByTestId('metric-vacancies-count')).toHaveText('1');
    await expect(page.getByTestId('status-pending')).toBeVisible();
    await expect(page.getByTestId('status-privacy-suppressed')).toHaveCount(0);

    // Platform Owner receives full attendee list
    const ownerCohortCard = page.getByTestId('registered-cohort-card');
    await expect(ownerCohortCard.getByText('Participants Registered (2)')).toBeVisible();
    await expect(ownerCohortCard.getByText(/(Yash Rathod|Vikram Joshi)/i)).toBeVisible();
    await expect(ownerCohortCard.getByText(/(Aroh Mehta|Rohan Mehta)/i)).toBeVisible();

    // Verify owner view after reload retains precise details
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('metric-reserved-occupied')).toHaveText('0');
    await expect(page.getByTestId('metric-ordinary-occupied')).toHaveText('2');
    await expect(page.getByTestId('metric-vacancies-count')).toHaveText('1');
    await expect(page.getByTestId('registered-cohort-card').getByText(/(Yash Rathod|Vikram Joshi)/i)).toBeVisible();
    await expect(page.getByTestId('registered-cohort-card').getByText(/(Aroh Mehta|Rohan Mehta)/i)).toBeVisible();

    // 10. Test compliant eligible path: Switch to eligible participant Ankita Kapri
    await page.goto('/demo-login');
    await page.getByText(/(Ankita Kapri|Meera Singh)/i).first().click();
    await page.waitForURL('**/dashboard');

    await page.goto('/events/evt_jaipur_limited_05');
    await page.waitForURL('**/events/evt_jaipur_limited_05');

    // Ankita RSVPs Attending to claim the vacant reserved place
    await page.getByRole('button', { name: /^Attending$/i }).click();

    // Verify participant view still withholds counts so observer cannot infer eligibility from before/after change
    await expect(page.getByTestId('metric-reserved-occupied')).toHaveText('Withheld');
    await expect(page.getByTestId('metric-ordinary-occupied')).toHaveText('Withheld');
    await expect(page.getByTestId('metric-vacancies-count')).toHaveText('Withheld');
    await expect(page.getByTestId('status-privacy-suppressed')).toBeVisible();
    // Confirmed status seen, while others remain protected
    await expect(page.getByTestId('roster-protected-notice')).toBeVisible();
    await expect(page.getByText(/You \((Ankita Kapri|Meera Singh)\)/i)).toBeVisible();
    await expect(page.getByText(/(Yash Rathod|Vikram Joshi)/i)).toHaveCount(0);
    await expect(page.getByText(/(Aroh Mehta|Rohan Mehta)/i)).toHaveCount(0);

    // 11. Switch back to Platform Owner (Demo Administrator) to verify exact validation details updated
    await page.goto('/demo-login');
    await page.getByText(/Nazim M\. Sandh|Demo Administrator/).first().click();
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

    // Owner sees all 3 attendees
    const ownerCohortAfterMeera = page.getByTestId('registered-cohort-card');
    await expect(ownerCohortAfterMeera.getByText('Participants Registered (3)')).toBeVisible();
    await expect(ownerCohortAfterMeera.getByText(/(Yash Rathod|Vikram Joshi)/i)).toBeVisible();
    await expect(ownerCohortAfterMeera.getByText(/(Aroh Mehta|Rohan Mehta)/i)).toBeVisible();
    await expect(ownerCohortAfterMeera.getByText(/(Ankita Kapri|Meera Singh)/i)).toBeVisible();
  });

  test('desktop: simulates Platform Owner exception approval with audit record', async ({ page }) => {
    // 1. Login as Platform Admin (Demo Administrator)
    await page.goto('/demo-login');
    await page.getByText(/Nazim M\. Sandh|Demo Administrator/).first().click();
    await page.waitForURL('**/dashboard');

    // 2. Go to the small fictional event
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
    await expect(auditBox.getByText(/(JS-F-001|user_admin).*(platform_admin)/i)).toBeVisible();
    await expect(auditBox.getByText(/2026\.1-womens-reservation-33/i)).toBeVisible();
    await expect(auditBox.getByText(/Targeted candidate outreach exhausted/i)).toBeVisible();

    // 8. Negative assertion: Participant view suppresses disclosing status, exact numbers, and audit details
    await page.goto('/demo-login');
    await page.getByText(/Ankita Kapri|Aarav Sharma/).first().click();
    await page.waitForURL('**/dashboard');

    await page.goto('/events/evt_jaipur_limited_05');
    await page.waitForURL('**/events/evt_jaipur_limited_05');

    await expect(page.getByTestId('status-privacy-suppressed')).toBeVisible();
    await expect(page.getByTestId('status-finalized-exception')).toHaveCount(0);
    await expect(page.getByTestId('metric-reserved-occupied')).toHaveText('Withheld');
    await expect(page.getByTestId('metric-vacancies-count')).toHaveText('Withheld');

    // Exception audit box is completely suppressed for non-owner participants
    await expect(page.getByTestId('exception-audit-box')).toHaveCount(0);

    // 9. Negative assertion: Page reload simulation preserves suppression for participant
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('status-privacy-suppressed')).toBeVisible();
    await expect(page.getByTestId('status-finalized-exception')).toHaveCount(0);
    await expect(page.getByTestId('exception-audit-box')).toHaveCount(0);

    // 10. Negative assertion: Persona switch to another participant also suppresses exception state
    await page.goto('/demo-login');
    await page.getByText(/(Ankita Kapri|Meera Singh)/i).first().click();
    await page.waitForURL('**/dashboard');
    await page.goto('/events/evt_jaipur_limited_05');
    await page.waitForURL('**/events/evt_jaipur_limited_05');
    await expect(page.getByTestId('status-privacy-suppressed')).toBeVisible();
    await expect(page.getByTestId('status-finalized-exception')).toHaveCount(0);
    await expect(page.getByTestId('exception-audit-box')).toHaveCount(0);

    // 11. Persona switch back to Platform Owner retains full audit and exception status
    await page.goto('/demo-login');
    await page.getByText(/Nazim M\. Sandh|Demo Administrator/).first().click();
    await page.waitForURL('**/dashboard');
    await page.goto('/events/evt_jaipur_limited_05');
    await page.waitForURL('**/events/evt_jaipur_limited_05');
    await expect(page.getByTestId('status-finalized-exception')).toBeVisible();
    await expect(page.getByTestId('exception-audit-box')).toBeVisible();
  });

  test('mobile: responsive layout at 375px viewport with no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/demo-login');
    await page.getByText(/Ankita Kapri|Aarav Sharma/).first().click();
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
