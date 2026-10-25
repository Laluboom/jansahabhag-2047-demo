import { test, expect } from '@playwright/test';

test.describe('Task 04: Connected Local Debate Room Simulation & Shared Session Engine', () => {
  test.beforeEach(async ({ page }) => {
    // Start at dashboard to ensure database is initialized cleanly
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('verifies debate room route, alias, truthful simulation notices, and rulebook', async ({ page }) => {
    // 1. Verify /debates alias redirects to /debate-room
    await page.goto('/debates');
    await page.waitForURL('**/debate-room');

    // 2. Header and motion verification
    await expect(page.getByRole('heading', { level: 1, name: /Jaipur Youth Pedestrian Safety Debate Room/i })).toBeVisible();
    await expect(page.getByText('Immediate installation of tabletop pedestrian crosswalks')).toBeVisible();

    // 3. Single-browser local simulation notices (no live multi-user network or server authorization)
    await expect(page.getByText(/Single-Browser Local Simulation — Session sess_jaipur_01/i)).toBeVisible();
    await expect(page.getByText(/State is only shared among personas within this browser/i)).toBeVisible();
    await expect(page.getByText(/The persona selector is a local simulation, not security/i)).toBeVisible();

    // 4. Rulebook modal review
    const rulebookBtn = page.getByRole('button', { name: /Rulebook \(v1\.0\)/i });
    await expect(rulebookBtn).toBeVisible();
    await rulebookBtn.click();

    // Modal dialog
    const rulebookModal = page.getByRole('dialog');
    await expect(rulebookModal).toBeVisible();
    await expect(rulebookModal.getByText(/JanSahabhag Debate Room Rules of Procedure/i)).toBeVisible();
    await expect(rulebookModal.getByText(/Structured Motion Focus/i)).toBeVisible();
    await expect(rulebookModal.getByText(/Speaking Queue & Recognition/i)).toBeVisible();

    // Close rulebook
    await page.getByRole('button', { name: /Acknowledge Ground Rules/i }).click();
    await expect(rulebookModal).not.toBeVisible();

    // 5. Dock panels
    await expect(page.getByText(/Evidence & Sources Dock/i)).toBeVisible();
    await expect(page.getByText(/Session Agenda/i)).toBeVisible();
    await expect(page.getByText(/Session Roster/i)).toBeVisible();
  });

  test('executes speaking queue turn request, facilitator recognition, text intervention, and reflection path', async ({ page }) => {
    await page.goto('/debate-room');
    await page.waitForURL('**/debate-room');

    // 1. Participant Aarav is initially waiting in queue from seed
    await expect(page.getByText('Speaking Queue', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Withdraw Request/i })).toBeVisible();

    // Aarav cancels turn
    await page.getByRole('button', { name: /Withdraw Request/i }).click();
    await expect(page.getByText(/Your speaking turn request has been cancelled/i)).toBeVisible();

    // Aarav requests turn again
    await page.getByRole('button', { name: /Raise Hand \(Request Turn\)/i }).click();
    await expect(page.getByText(/Speaking turn requested/i)).toBeVisible();

    // 2. Switch persona to Facilitator via persona switcher in header
    await page.getByRole('button', { name: /Viewing as/i }).click();
    await expect(page.getByText('Switch Demo Persona')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: /(Aroh Mehta|Rohan Mehta)/i }).click();

    // Facilitator controls are now active
    await expect(page.getByText(/Persona: (Aroh Mehta|Rohan Mehta)/i)).toBeVisible();
    const recognizeBtn = page.getByRole('button', { name: 'Recognize' }).first();
    await expect(recognizeBtn).toBeVisible();
    await recognizeBtn.click();
    await expect(page.getByText(/Recognized participant turn/i)).toBeVisible();

    // Spotlight now indicates active speaker
    await expect(page.getByText('Recognized Floor Speaker')).toBeVisible();

    // 3. Switch persona back to Participant
    await page.getByRole('button', { name: /Viewing as/i }).click();
    await expect(page.getByText('Switch Demo Persona')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: /(Ankita Kapri|Aarav Sharma)/i }).click();
    await expect(page.getByText(/Persona: (Ankita Kapri|Aarav Sharma)/i)).toBeVisible();

    // 4. Low-bandwidth text contribution path is now enabled for Aarav
    const textarea = page.getByRole('textbox', { name: /Your Substantive Debate Intervention/i });
    await expect(textarea).toBeVisible();
    await textarea.fill('Field counts outside Navchetna School confirm severe morning congestion. Tabletop ramps are essential.');

    // Select evidence
    const evidenceSelect = page.getByLabel(/Attach Assembly Field Evidence/i);
    await evidenceSelect.selectOption('ev_aarav_traffic_count_01');

    // Submit intervention
    await page.getByRole('button', { name: /Post Intervention/i }).click();
    await expect(page.getByText(/Intervention posted successfully to debate log/i)).toBeVisible();

    // Verify it appears in Debate Contributions Log
    await expect(page.getByText('Field counts outside Navchetna School confirm severe morning congestion')).toBeVisible();

    // 5. Test post-session reflection save and passport path
    const reflInput = page.getByLabel(/Your Personal Reflection/i);
    await expect(reflInput).toBeVisible();
    await reflInput.fill('Hearing community observations proved that physical tabletop ramps are needed rather than mere signage.');
    await page.getByRole('button', { name: /Save Reflection/i }).click();
    await expect(page.getByText(/Private reflection saved locally to this Debate Room journal/i)).toBeVisible();
    await expect(page.getByText(/Hearing community observations proved that physical tabletop ramps are needed/i)).toBeVisible();

    // 6. Persona boundary regression: switch to unacknowledged participant in same mounted page
    await page.getByRole('button', { name: /Viewing as/i }).click();
    await expect(page.getByText('Switch Demo Persona')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: /(Kanha|Vikram)/i }).click();
    await expect(page.getByText(/Persona: (Kanha|Vikram)/i)).toBeVisible();

    // Verify private reflection is NOT visible to other participant
    await expect(page.getByText(/Hearing community observations proved that physical tabletop ramps are needed/i)).not.toBeVisible();

    // Verify unacknowledged rulebook banner IS visible
    await expect(page.getByText(/Debate Room Procedural Rules \(Master PRD §A13, v1\.0\)/i)).toBeVisible();

    // Attempting to request speaking turn without acknowledgement opens rulebook and shows error
    await page.getByRole('button', { name: /Raise Hand \(Request Turn\)/i }).click();
    await expect(page.getByText(/Please review and acknowledge the Debate Ground Rules/i)).toBeVisible();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Acknowledges via rulebook modal
    await modal.getByRole('button', { name: /Acknowledge Ground Rules/i }).click();
    await expect(modal).not.toBeVisible();
    await expect(page.getByText(/Debate Room Procedural Rules \(Master PRD §A13, v1\.0\)/i)).not.toBeVisible();

    // Switch back to primary participant for passport link test
    await page.getByRole('button', { name: /Viewing as/i }).click();
    await expect(page.getByText('Switch Demo Persona')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: /(Ankita Kapri|Aarav Sharma)/i }).click();

    await page.getByRole('button', { name: /Open Civic Passport/i }).click();
    await page.waitForURL('**/passport');
    await expect(page.getByText(/Civic Passport Portfolio/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /(Ankita Kapri|Aarav Sharma)/i })).toBeVisible();

    // Verify debate room reflection is NOT rendered in Passport credentials
    await expect(page.getByText(/Hearing community observations proved that physical tabletop ramps are needed/i)).not.toBeVisible();
  });

  test('survives Debate Room to Youth Assembly mode switch and reciprocal roundtrip without data loss', async ({ page }) => {
    // Switch to Facilitator
    await page.goto('/debate-room');
    await page.getByRole('button', { name: /Viewing as/i }).click();
    await expect(page.getByText('Switch Demo Persona')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: /(Aroh Mehta|Rohan Mehta)/i }).click();

    // Verify "Switch to Youth Assembly" button
    const switchModeBtn = page.getByRole('button', { name: /Switch to Youth Assembly/i });
    await expect(switchModeBtn).toBeVisible();
    await switchModeBtn.click();

    // Interstitial summary modal
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByText(/Mode Transition: Switch to Youth Assembly/i)).toBeVisible();
    await expect(modal.getByText(/Session ID: sess_jaipur_01/i)).toBeVisible();
    await expect(modal.getByText(/Preserved Session Context/i)).toBeVisible();

    // Confirm transition
    await page.getByRole('button', { name: /Confirm & Enter Youth Assembly Chamber/i }).click();

    // Navigates to linked Youth Assembly
    await page.waitForURL('**/assemblies/assembly_jaipur_pedestrian_2026/session');
    await expect(page.getByRole('heading', { name: /(Rajkot|Jaipur) School Zone Pedestrian/i })).toBeVisible();

    // Verify reciprocal session banner
    await expect(page.getByText(/Linked Shared Session: sess_jaipur_01/i)).toBeVisible();
    await expect(page.getByText(/Engine Mode: Youth Assembly/i)).toBeVisible();
    await expect(page.getByText(/State is only shared among personas within this browser/i)).toBeVisible();

    // Click reciprocal link to switch back to Debate Room
    const returnBtn = page.getByRole('button', { name: /Switch to Debate Room/i });
    await expect(returnBtn).toBeVisible();
    await returnBtn.click();

    // Returned to Debate Room with state preserved
    await page.waitForURL('**/debate-room');
    await expect(page.getByRole('heading', { level: 1, name: /Jaipur Youth Pedestrian Safety Debate Room/i })).toBeVisible();
    await expect(page.getByText(/Session ID: sess_jaipur_01/i)).toBeVisible();
    await expect(page.getByText('Speaking Queue', { exact: true })).toBeVisible();
  });
});
