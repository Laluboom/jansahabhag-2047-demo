import { test, expect } from '@playwright/test';

test.describe('Package 08C2: Debate Room Point-of-Use Reservation Rulebook, Role Plan UI, Owner Controls & Browser Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Reset local database via demo-login
    await page.goto('/demo-login');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/demo-login');
    await page.waitForLoadState('networkidle');
  });

  test('desktop: point-of-use rulebook, privacy suppression, claim denial, eligible assignment, owner exception, and persistence', async ({ page }) => {
    // 1. Log in as regular participant Aarav Sharma
    await page.getByText('Aarav Sharma').first().click();
    await page.waitForURL('**/dashboard');

    // 2. Navigate to Jaipur Youth Pedestrian Safety Debate Room
    await page.goto('/debate-room');
    await page.waitForURL('**/debate-room');

    // 3. Verify Point-of-Use Reservation Rulebook Banner & Formula Callout
    const rulebookBanner = page.getByTestId('debate-reservation-rulebook-banner');
    await expect(rulebookBanner).toBeVisible();
    await expect(rulebookBanner.getByText(/2026\.1-womens-reservation-33/i)).toBeVisible();
    await expect(rulebookBanner.getByText(/ceil\(0\.33 × planned places\)/i)).toBeVisible();
    await expect(rulebookBanner.getByText(/1-place role requires 1 reserved place/i)).toBeVisible();
    await expect(rulebookBanner.getByText(/open speaking queue is not a fixed named role/i)).toBeVisible();
    await expect(rulebookBanner.getByText(/Unmet reserved places stay vacant by default/i)).toBeVisible();
    await expect(rulebookBanner.getByText(/Fictional Jaipur Prototype: one-browser simulation only/i)).toBeVisible();

    // 4. Open Point-of-Use Rulebook Modal
    await page.getByTestId('open-debate-reservation-rulebook-btn').first().click();
    const rulebookModal = page.getByTestId('debate-reservation-rulebook-modal');
    await expect(rulebookModal).toBeVisible();
    await expect(rulebookModal.getByText(/Debate Room Reservation & Allocation Rulebook/i)).toBeVisible();
    await expect(rulebookModal.getByText(/Rule 1: Independent 33% Allocation Per Formal Named Role/i)).toBeVisible();
    await expect(rulebookModal.getByText(/Rule 2: Singular 1-Place Roles Rounding/i)).toBeVisible();
    await expect(rulebookModal.getByText(/Rule 3: Open Speaking Queue is Open Participation \(Excluded\)/i)).toBeVisible();
    await expect(rulebookModal.getByText(/Rule 4: Unmet Reserved Places Remain Vacant by Default/i)).toBeVisible();
    await expect(rulebookModal.getByText(/Rule 5: Seeded Legacy Appointments & Open Selection Stage/i)).toBeVisible();
    await expect(rulebookModal.getByText(/Rule 6: Small-Cohort Privacy Protection/i)).toBeVisible();
    await expect(rulebookModal.getByText(/Rule 7: Platform Owner Authority Guard & Audited Exceptions/i)).toBeVisible();
    await page.getByTestId('close-debate-reservation-rulebook-btn').click();
    await expect(rulebookModal).not.toBeVisible();

    // 5. Verify Named Role Allocations Grid & Privacy Suppression for Participant View
    const allocationsCard = page.getByTestId('debate-reservation-allocations-card');
    await expect(allocationsCard).toBeVisible();

    // Small cohort role (Facilitator, 1 place <= 3): public status suppressed to protect individual declaration
    const facilitatorCard = page.getByTestId('role-allocation-card-facilitator');
    await expect(facilitatorCard).toBeVisible();
    await expect(facilitatorCard.getByTestId('status-privacy-suppressed')).toBeVisible();
    await expect(facilitatorCard.getByText('Protected')).toBeVisible();
    await expect(facilitatorCard.getByText('Withheld (Privacy)').first()).toBeVisible();

    // Verify non-owner participant cannot see or execute administrative controls
    await expect(facilitatorCard.getByText(/Validation governed by Platform Owner/i)).toBeVisible();
    await expect(page.getByTestId('approve-role-exception-facilitator')).toHaveCount(0);
    await expect(page.getByTestId('finalize-role-facilitator')).toHaveCount(0);
    await expect(page.getByTestId('assign-role-btn-facilitator')).toHaveCount(0);

    // 6. Verify Session Roster dock lists participants without eligibility tags
    const rosterDock = page.getByText(/Session Roster/i);
    await expect(rosterDock).toBeVisible();
    await expect(page.getByText('Rohan Mehta').first()).toBeVisible();
    await expect(page.getByText('Priya Sharma').first()).toBeVisible();

    // 7. Switch to Platform Owner persona (Demo Administrator / user_admin)
    await page.goto('/demo-login');
    await page.getByText('Demo Administrator').first().click();
    await page.waitForURL('**/dashboard');

    await page.goto('/debate-room');
    await page.waitForURL('**/debate-room');

    // 8. Verify Platform Owner unsuppressed view
    const ownerCommVoiceCard = page.getByTestId('role-allocation-card-community-voice');
    await expect(ownerCommVoiceCard).toBeVisible();
    // Platform Owner sees exact metrics without privacy suppression
    await expect(ownerCommVoiceCard.getByTestId('metric-total-community-voice')).toHaveText('1');
    await expect(ownerCommVoiceCard.getByTestId('metric-reserved-community-voice')).toHaveText('1');
    await expect(ownerCommVoiceCard.getByText('Withheld (Privacy)')).toHaveCount(0);

    // 9. Demonstrate Vacancy Claim Denial: Withdraw Kabir Das to create reserved vacancy
    const withdrawBtn = page.getByTestId('withdraw-role-btn-community-voice');
    await expect(withdrawBtn).toBeVisible();
    await withdrawBtn.click();

    // Verify success banner and vacancy status
    const successBanner = page.getByTestId('debate-role-action-success');
    await expect(successBanner).toBeVisible();
    await expect(successBanner.getByText(/vacant by default/i)).toBeVisible();
    await expect(ownerCommVoiceCard.getByText(/Vacant \(Unassigned\)/i)).toBeVisible();

    // 10. Attempt to assign an ineligible candidate (Vikram Malhotra, male) -> Denial
    const assignBtn = page.getByTestId('assign-role-btn-community-voice');
    await assignBtn.click();
    const assignModal = page.getByTestId('debate-assign-modal');
    await expect(assignModal).toBeVisible();

    const candidateSelect = page.getByTestId('assign-user-select');
    await candidateSelect.selectOption('user_vikram');
    await page.getByTestId('submit-debate-assign-btn').click();

    // Assignment rejected by 33% reservation check
    const assignError = page.getByTestId('debate-assign-error');
    await expect(assignError).toBeVisible();
    await expect(assignError.getByText(/reservation policy/i)).toBeVisible();

    // 11. Assign eligible candidate (Ananya Verma, female) -> Succeeded
    await candidateSelect.selectOption('user_ananya');
    await page.getByTestId('submit-debate-assign-btn').click();
    await expect(assignModal).not.toBeVisible();

    await expect(page.getByTestId('debate-role-action-success')).toBeVisible();
    await expect(page.getByTestId('debate-role-action-success').getByText(/User assigned successfully/i)).toBeVisible();
    await expect(ownerCommVoiceCard.getByText('Ananya Verma')).toBeVisible();

    // 12. Finalize compliant role
    const finalizeCommVoiceBtn = page.getByTestId('finalize-role-community-voice');
    await finalizeCommVoiceBtn.click();
    await expect(page.getByTestId('debate-role-action-success')).toBeVisible();
    await expect(ownerCommVoiceCard.getByTestId('status-finalized-compliant')).toBeVisible();
    await expect(ownerCommVoiceCard.getByTestId('status-finalized-compliant')).toHaveText(/Compliant/i);

    // 13. Audited Exception flow on non-compliant role (Facilitator, occupied by Rohan Mehta)
    const ownerFacilitatorCard = page.getByTestId('role-allocation-card-facilitator');
    await expect(ownerFacilitatorCard).toBeVisible();

    // Attempt direct finalization -> blocked because Rohan is unvalidated legacy male
    const finalizeFacilitatorBtn = page.getByTestId('finalize-role-facilitator');
    await finalizeFacilitatorBtn.click();
    const actionError = page.getByTestId('debate-role-action-error');
    await expect(actionError).toBeVisible();
    await expect(actionError.getByText(/33% reservation requirement unmet/i)).toBeVisible();
    await expect(actionError.getByText(/Unmet reserved places stay vacant by default/i)).toBeVisible();

    // Open Exception Approval dialog
    const approveExceptionBtn = page.getByTestId('approve-role-exception-facilitator');
    await approveExceptionBtn.click();
    const exceptionModal = page.getByTestId('debate-exception-modal');
    await expect(exceptionModal).toBeVisible();

    // Try short reason (< 5 characters) -> client validation error
    const reasonInput = page.getByTestId('debate-exception-reason-input');
    await reasonInput.fill('Test');
    await page.getByTestId('submit-debate-exception-btn').click();
    await expect(page.getByTestId('debate-exception-error')).toBeVisible();
    await expect(page.getByTestId('debate-exception-error').getByText(/at least 5 characters/i)).toBeVisible();

    // Submit substantive reasoned exception
    await reasonInput.fill('Fictional Jaipur pilot: Rohan Mehta retained as Facilitator under documented owner exception.');
    await page.getByTestId('submit-debate-exception-btn').click();
    await expect(exceptionModal).not.toBeVisible();

    // Verify Exception Approved state
    await expect(page.getByTestId('debate-role-action-success')).toBeVisible();
    await expect(page.getByTestId('debate-role-action-success').getByText(/Platform Owner exception approved/i)).toBeVisible();
    await expect(ownerFacilitatorCard.getByTestId('status-finalized-exception')).toBeVisible();
    await expect(ownerFacilitatorCard.getByTestId('status-finalized-exception')).toHaveText(/Exception Approved/i);

    // Verify Exception Audit box inside card
    const auditBox = ownerFacilitatorCard.getByTestId('role-exception-audit-box');
    await expect(auditBox).toBeVisible();
    await expect(auditBox.getByText(/Platform Owner Exception Audit/i)).toBeVisible();
    await expect(auditBox.getByText(/Rohan Mehta retained as Facilitator/i)).toBeVisible();
    await expect(auditBox.getByText(/2026\.1-womens-reservation-33/i)).toBeVisible();

    // Open Audit Trail Modal
    const viewAuditsBtn = page.getByTestId('view-role-audits-btn-facilitator');
    await viewAuditsBtn.click();
    const auditsModal = page.getByTestId('debate-audit-trail-modal');
    await expect(auditsModal).toBeVisible();
    await expect(auditsModal.getByText(/Allocation Audit Trail: Facilitator/i)).toBeVisible();
    await expect(auditsModal.getByTestId("audit-trail-entry").first().getByText("Exception Approved", { exact: true })).toBeVisible();
    await page.getByTestId('close-debate-audit-trail-btn').click();
    await expect(auditsModal).not.toBeVisible();

    // 14. Verify Persistence after Page Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    const reloadedFacilitatorCard = page.getByTestId('role-allocation-card-facilitator');
    await expect(reloadedFacilitatorCard.getByTestId('status-finalized-exception')).toBeVisible();
    const reloadedCommVoiceCard = page.getByTestId('role-allocation-card-community-voice');
    await expect(reloadedCommVoiceCard.getByTestId('status-finalized-compliant')).toBeVisible();
    await expect(reloadedCommVoiceCard.getByText('Ananya Verma')).toBeVisible();

    // 15. Verify Persona Switch Hides Owner Data from Participant
    await page.goto('/demo-login');
    await page.getByText('Aarav Sharma').first().click();
    await page.waitForURL('**/dashboard');

    await page.goto('/debate-room');
    await page.waitForURL('**/debate-room');

    const participantFacCard = page.getByTestId('role-allocation-card-facilitator');
    await expect(participantFacCard.getByTestId('status-privacy-suppressed')).toBeVisible();
    await expect(participantFacCard.getByText('Withheld (Privacy)').first()).toBeVisible();
    await expect(page.getByTestId('approve-role-exception-facilitator')).toHaveCount(0);

    // 16. Verify Deliberation and Assembly transition non-disruption
    await expect(page.getByText('Speaking Queue', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /Withdraw Request/i }).click();
    await expect(page.getByText(/speaking turn request has been cancelled/i)).toBeVisible();
    await page.getByRole('button', { name: /Raise Hand \(Request Turn\)/i }).click();
    await expect(page.getByText(/Speaking turn requested/i)).toBeVisible();

    // Assemblies navigation link
    await page.getByRole('link', { name: /All Assemblies/i }).click();
    await page.waitForURL('**/assemblies');
    await expect(page.getByRole('heading', { level: 1, name: /Youth Deliberative Assemblies/i })).toBeVisible();
  });

  test('mobile: responsive point-of-use rulebook and stacked debate role cards', async ({ page }) => {
    // Set mobile viewport (iPhone 12 / pixel width)
    await page.setViewportSize({ width: 375, height: 667 });

    // 1. Log in as Platform Owner
    await page.goto('/demo-login');
    await page.getByText('Demo Administrator').first().click();
    await page.waitForURL('**/dashboard');

    // 2. Navigate to Debate Room
    await page.goto('/debate-room');
    await page.waitForURL('**/debate-room');

    // 3. Verify mobile banner and modal interactions
    const rulebookBanner = page.getByTestId('debate-reservation-rulebook-banner');
    await expect(rulebookBanner).toBeVisible();

    await page.getByTestId('open-debate-reservation-rulebook-btn').first().click();
    const rulebookModal = page.getByTestId('debate-reservation-rulebook-modal');
    await expect(rulebookModal).toBeVisible();
    await expect(rulebookModal.getByText(/Debate Room Reservation & Allocation Rulebook/i)).toBeVisible();

    // Close modal
    await page.getByTestId('close-debate-reservation-rulebook-btn').click();
    await expect(rulebookModal).not.toBeVisible();

    // 4. Verify stacked role allocations grid
    const allocationsGrid = page.getByTestId('debate-role-allocations-grid');
    await expect(allocationsGrid).toBeVisible();

    const facilitatorCard = page.getByTestId('role-allocation-card-facilitator');
    await expect(facilitatorCard).toBeVisible();
    await expect(facilitatorCard.getByTestId('metric-total-facilitator')).toHaveText('1');
    await expect(facilitatorCard.getByTestId('metric-reserved-facilitator')).toHaveText('1');

    // 5. Open exception modal on mobile and verify responsive dialog
    await page.getByTestId('approve-role-exception-facilitator').click();
    const exceptionDialog = page.getByTestId('debate-exception-modal');
    await expect(exceptionDialog).toBeVisible();
    await page.getByTestId('cancel-debate-exception-btn').click();
    await expect(exceptionDialog).not.toBeVisible();
  });
});
