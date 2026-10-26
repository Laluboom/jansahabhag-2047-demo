import { test, expect } from '@playwright/test';

test.describe('Package 08B: Youth Assembly Named Role Reservation & Platform Owner Audited Exceptions', () => {
  test.beforeEach(async ({ page }) => {
    // Reset local database via demo-login
    await page.goto('/demo-login');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/demo-login');
    await page.waitForLoadState('networkidle');
  });

  test('desktop: displays point-of-use rulebook, privacy suppression, denied finalization route, and authorized platform owner exception', async ({ page }) => {
    // 1. Log in as regular participant Ankita Kapri
    await page.getByText(/Ankita Kapri|Aarav Sharma/).first().click();
    await page.waitForURL('**/dashboard');

    // 2. Navigate to Youth Assembly detail page
    await page.goto('/assemblies/assembly_jaipur_pedestrian_2026');
    await page.waitForURL('**/assemblies/assembly_jaipur_pedestrian_2026');

    // 3. Verify Point-of-Use Reservation Rulebook Banner & Formula Callout
    const rulebookBanner = page.getByTestId('assembly-reservation-rulebook-banner');
    await expect(rulebookBanner).toBeVisible();
    await expect(rulebookBanner.getByText(/2026\.1-womens-reservation-33/i)).toBeVisible();
    await expect(rulebookBanner.getByText(/ceil\(0\.33 × allocatedPlaces\)/i)).toBeVisible();
    await expect(rulebookBanner.getByText(/Fictional (Rajkot|Jaipur) Prototype: one-browser simulation only/i)).toBeVisible();

    // 4. Open Point-of-Use Rulebook Modal
    await page.getByTestId('open-assembly-rulebook-btn').click();
    const rulebookModal = page.getByTestId('assembly-rulebook-modal');
    await expect(rulebookModal).toBeVisible();
    await expect(rulebookModal.getByText(/Youth Assembly Reservation & Allocation Rulebook/i)).toBeVisible();
    await expect(rulebookModal.getByText(/Independent 33% Quota Per Named Role/i)).toBeVisible();
    await expect(rulebookModal.getByText(/remain vacant by default/i)).toBeVisible();
    await page.getByTestId('close-assembly-rulebook-btn').click();
    await expect(rulebookModal).not.toBeVisible();

    // 5. Verify Named Role Allocations Grid & Privacy Suppression for Participant View
    const allocationsCard = page.getByTestId('assembly-reservation-allocations-card');
    await expect(allocationsCard).toBeVisible();

    // Small cohort role (Chair, 1 place <= 3): public status suppressed to protect individual declaration
    const chairCard = page.getByTestId('role-allocation-card-chair');
    await expect(chairCard).toBeVisible();
    await expect(chairCard.getByTestId('status-privacy-suppressed')).toBeVisible();
    await expect(chairCard.getByText('Protected')).toBeVisible();
    await expect(chairCard.getByText('Withheld (Privacy)').first()).toBeVisible();

    // Verify non-owner participant cannot see or execute administrative controls
    await expect(chairCard.getByText(/Validation governed by Platform Owner/i)).toBeVisible();
    await expect(page.getByTestId('approve-role-exception-chair')).toHaveCount(0);
    await expect(page.getByTestId('finalize-role-chair')).toHaveCount(0);

    // 6. Switch to Platform Owner persona
    await page.goto('/demo-login');
    await page.getByText(/Nazim M\. Sandh|Demo Administrator/).first().click();
    await page.waitForURL('**/dashboard');

    await page.goto('/assemblies/assembly_jaipur_pedestrian_2026');
    await page.waitForURL('**/assemblies/assembly_jaipur_pedestrian_2026');

    // 7. Verify Platform Owner unsuppressed view
    const ownerChairCard = page.getByTestId('role-allocation-card-chair');
    await expect(ownerChairCard).toBeVisible();
    // Platform Owner sees exact metrics without privacy suppression
    await expect(ownerChairCard.getByTestId('metric-total-chair')).toHaveText('1');
    await expect(ownerChairCard.getByTestId('metric-reserved-chair')).toHaveText('1');
    await expect(ownerChairCard.getByText('Withheld (Privacy)')).toHaveCount(0);

    // Platform Owner sees exception approval and finalization buttons
    const finalizeChairBtn = page.getByTestId('finalize-role-chair');
    const approveExceptionBtn = page.getByTestId('approve-role-exception-chair');
    await expect(finalizeChairBtn).toBeVisible();
    await expect(approveExceptionBtn).toBeVisible();

    // 8. Test Denied Route: Attempting to finalize non-compliant Chair allocation without exception
    await finalizeChairBtn.click();

    // Verify error banner is displayed
    const actionErrorBanner = page.getByTestId('assembly-role-action-error');
    await expect(actionErrorBanner).toBeVisible();
    await expect(actionErrorBanner.getByText(/33% reservation requirement unmet/i)).toBeVisible();
    await expect(actionErrorBanner.getByText(/Unmet reserved places stay vacant by default/i)).toBeVisible();

    // 9. Test Exception Route: Platform Owner approves audited exception
    await approveExceptionBtn.click();
    const exceptionDialog = page.getByTestId('assembly-exception-modal');
    await expect(exceptionDialog).toBeVisible();

    // Try submitting with invalid short reason (< 5 characters)
    const reasonInput = page.getByTestId('assembly-exception-reason-input');
    await reasonInput.fill('Demo');
    await page.getByTestId('submit-assembly-exception-btn').click();
    await expect(page.getByTestId('assembly-exception-error')).toBeVisible();
    await expect(page.getByTestId('assembly-exception-error').getByText(/at least 5 characters/i)).toBeVisible();

    // Provide substantive valid reason and submit
    await reasonInput.fill('Fictional Jaipur pilot: Rohan Mehta retained as Chair under documented owner exception.');
    await page.getByTestId('submit-assembly-exception-btn').click();

    // 10. Verify Exception Approved State
    await expect(page.getByTestId('assembly-role-action-success')).toBeVisible();
    await expect(page.getByTestId('assembly-role-action-success').getByText(/Platform Owner exception approved/i)).toBeVisible();

    // Chair card now visibly displays "Exception Approved" status badge
    await expect(ownerChairCard.getByTestId('status-finalized-exception')).toBeVisible();
    await expect(ownerChairCard.getByTestId('status-finalized-exception')).toHaveText(/Exception Approved/i);

    // Verify Exception Audit Record Box is rendered with full auditable details
    const auditBox = ownerChairCard.getByTestId('role-exception-audit-box');
    await expect(auditBox).toBeVisible();
    await expect(auditBox.getByText(/Platform Owner Exception Audit/i)).toBeVisible();
    await expect(auditBox.getByText(/Rohan Mehta retained as Chair/i)).toBeVisible();
    await expect(auditBox.getByText(/2026\.1-womens-reservation-33/i)).toBeVisible();
  });

  test('mobile: responsive point-of-use rulebook and stacked role allocation cards', async ({ page }) => {
    // Set mobile viewport (iPhone 12 / pixel width)
    await page.setViewportSize({ width: 375, height: 667 });

    // 1. Log in as Platform Owner
    await page.goto('/demo-login');
    await page.getByText(/Nazim M\. Sandh|Demo Administrator/).first().click();
    await page.waitForURL('**/dashboard');

    // 2. Navigate to Jaipur Youth Assembly
    await page.goto('/assemblies/assembly_jaipur_pedestrian_2026');
    await page.waitForURL('**/assemblies/assembly_jaipur_pedestrian_2026');

    // 3. Verify mobile banner and modal interactions
    const rulebookBanner = page.getByTestId('assembly-reservation-rulebook-banner');
    await expect(rulebookBanner).toBeVisible();

    await page.getByTestId('open-assembly-rulebook-btn').click();
    const rulebookModal = page.getByTestId('assembly-rulebook-modal');
    await expect(rulebookModal).toBeVisible();
    await expect(rulebookModal.getByText(/Youth Assembly Reservation & Allocation Rulebook/i)).toBeVisible();
    await expect(rulebookModal.getByText(/Independent 33% Quota Per Named Role/i)).toBeVisible();

    // Close modal
    await page.getByTestId('close-assembly-rulebook-btn').click();
    await expect(rulebookModal).not.toBeVisible();

    // 4. Verify stacked role allocations grid
    const allocationsGrid = page.getByTestId('assembly-role-allocations-grid');
    await expect(allocationsGrid).toBeVisible();

    const chairCard = page.getByTestId('role-allocation-card-chair');
    await expect(chairCard).toBeVisible();
    await expect(chairCard.getByTestId('metric-total-chair')).toHaveText('1');
    await expect(chairCard.getByTestId('metric-reserved-chair')).toHaveText('1');

    // 5. Open exception modal on mobile and verify responsive dialog
    await page.getByTestId('approve-role-exception-chair').click();
    const exceptionDialog = page.getByTestId('assembly-exception-modal');
    await expect(exceptionDialog).toBeVisible();
    await page.getByTestId('cancel-assembly-exception-btn').click();
    await expect(exceptionDialog).not.toBeVisible();
  });
});
