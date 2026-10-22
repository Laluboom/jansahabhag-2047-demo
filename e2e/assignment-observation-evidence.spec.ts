import { test, expect } from '@playwright/test';

test.describe('Package 03: Jaipur Assignment, Observation & Evidence Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to demo login and reset localStorage for a deterministic clean run
    await page.goto('/demo-login');
    await page.evaluate(() => {
      localStorage.removeItem('jansahbhag_demo_v1');
    });
    await page.reload();
  });

  test('exercises form debounce autosave, reload restoration, keyboard evidence selection, local file upload, receipt persistence, teacher review, and verified credit', async ({ page }) => {
    // 1. Enter demo as Aarav Sharma (Youth Participant)
    await page.goto('/demo-login');
    await expect(page.getByRole('heading', { name: /Enter JanSahabhag/i })).toBeVisible();
    await page.getByText('Aarav Sharma').first().click();
    await page.waitForURL('**/dashboard');
    await expect(page.getByText('Aarav Sharma').first()).toBeVisible();

    // 2. Open Jaipur school-crossing assignment submit form
    await page.goto('/assignments/asg_obs_03/submit');
    await expect(page.getByRole('heading', { name: /Pedestrian Flow Interview with 5 Peers/i })).toBeVisible();

    // 3. Type field notes and observe debounce autosave status
    const notesInput = page.getByLabel(/Field Observation Notes & Data Log/i);
    const observationDraftText = 'Detailed observation of pedestrian flow at Navchetna School crossing: morning rush between 7:45 AM and 8:15 AM shows intense vehicular traffic without zebra crossing yield.';
    await notesInput.fill(observationDraftText);

    // Wait for idle debounce (1200ms) to trigger autosaved indicator
    await expect(page.getByText(/Draft autosaved locally/i)).toBeVisible({ timeout: 5000 });

    // 4. Reload page and verify draft is resumed without filler text
    await page.reload();
    await expect(notesInput).toHaveValue(observationDraftText);

    // 5. Create a distinct observation record and attach a local file using setInputFiles
    await page.getByRole('button', { name: /Log New Mock Evidence/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/Evidence Title/i).fill('Madhyam Marg Crossing Incident & Tally Log');
    await page.getByLabel(/Description & Quantitative Findings/i).fill('Manual tally of 40 pedestrian crossing events during peak morning school influx.');
    await page.getByLabel(/Observation Time Window/i).fill('7:45 AM - 8:15 AM');
    await page.getByLabel(/Location /i).fill('Navchetna School Crossing, Madhyam Marg, Jaipur');

    // Attach local file with content within conservative 250 KB limit
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'crossing_audit.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('time,pedestrians,yield_failure_count\n07:50,15,12\n08:05,25,18\n'),
    });

    // Verify local file name is reflected in the modal
    await expect(page.getByText('crossing_audit.csv')).toBeVisible();

    // Save and attach evidence
    await page.getByRole('button', { name: /Save & Attach Evidence/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 6. Keyboard operation for evidence selection: Focus checkbox and press Space to toggle
    const checkbox = page.getByRole('checkbox', { name: /Attach evidence: Student Commuter Walking Safety Interviews/i });
    await checkbox.focus();
    await page.keyboard.press('Space');
    await expect(checkbox).not.toBeChecked();
    await page.keyboard.press('Space');
    await expect(checkbox).toBeChecked();

    // 7. Submit assignment for verification
    await page.getByRole('button', { name: /Submit for Verification/i }).click();
    await page.waitForURL('**/assignments/asg_obs_03');

    // 8. Confirm Submission Receipt Card & Pending Review status
    await expect(page.getByRole('heading', { name: /Submission Receipt & Provenance Record/i })).toBeVisible();
    await expect(page.getByText(/Receipt #sub_/i).first()).toBeVisible();
    await expect(page.getByText(/Pending Review/i).first()).toBeVisible();
    await expect(page.getByText('crossing_audit.csv').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Download/i }).first()).toBeVisible();

    // Reload page to ensure receipt and review status persist deterministically
    await page.reload();
    await expect(page.getByRole('heading', { name: /Submission Receipt & Provenance Record/i })).toBeVisible();
    await expect(page.getByText(/Pending Review/i).first()).toBeVisible();

    // Verify Credit Ledger shows pending mentor review and not prematurely earned
    await page.goto('/passport/credits');
    await expect(page.getByText('Pending Mentor Review', { exact: true })).toBeVisible();

    // 9. Switch to Teacher Kavita Rao for Mentor Review
    await page.getByRole('button', { name: /Viewing as/i }).click();
    await expect(page.getByText('Switch Demo Persona')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: /Kavita Rao/i }).click();
    await expect(page.getByText(/Teacher \/ Mentor/i).first()).toBeVisible();

    // Open Aarav's exact submission detail
    await page.goto('/assignments/asg_obs_03');
    await expect(page.getByText(/Teacher Verification & Assessment Panel/i)).toBeVisible();
    await expect(page.getByText(/Reviewing: Aarav Sharma/i)).toBeVisible();

    // Enter teacher feedback and verify submission
    const feedbackField = page.getByLabel(/Teacher Feedback/i);
    await feedbackField.fill('Exemplary fieldwork observation with rigorous pedestrian delay data. Evidence verified.');
    await page.getByRole('button', { name: /Verify Submission/i }).click();
    await expect(page.getByText(/Mentor Verification & Feedback/i)).toBeVisible();

    // 10. Switch persona back to Aarav Sharma
    await page.getByRole('button', { name: /Viewing as/i }).click();
    await page.getByRole('dialog').getByRole('button', { name: /Aarav Sharma/i }).click();
    await expect(page.getByText(/Viewing as Youth Participant/i).first()).toBeVisible();

    // Verify mentor feedback on participant detail view
    await page.goto('/assignments/asg_obs_03');
    await expect(page.getByText(/Exemplary fieldwork observation with rigorous pedestrian delay data/i)).toBeVisible();

    // Verify Civic Credit Ledger shows verified credits (+2 pending submission verified by mentor, and +1 verified field evidence)
    await page.goto('/passport/credits');
    await expect(page.getByText(/Submitted assignment: Pedestrian Flow Interview with 5 Peers/i)).toBeVisible();
    await expect(page.getByText(/Verified field evidence: Madhyam Marg Crossing Incident & Tally Log/i)).toBeVisible();
    await expect(page.getByText('Total Verified')).toBeVisible();
    await expect(page.getByText('20 Credits')).toBeVisible();
  });
});
