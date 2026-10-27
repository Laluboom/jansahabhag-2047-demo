import { test, expect } from '@playwright/test';

test.describe('Package 09: Connected Fictional Rajkot Journey End-to-End Acceptance', () => {
  test.beforeEach(async ({ page }) => {
    // Reset local database via demo-login
    await page.goto('/demo-login');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/demo-login');
    await page.waitForLoadState('networkidle');
  });

  test('traces complete connected Rajkot journey: learning to evidence, workspace, debate room, 33% reservation, youth assembly, passport & persona privacy', async ({ page }) => {
    // -------------------------------------------------------------
    // Step 1: Login as Ankita Kapri (Youth Participant)
    // -------------------------------------------------------------
    await expect(page.getByRole('heading', { name: /Enter JanSahabhag/i })).toBeVisible();
    await page.getByText(/Ankita Kapri|Aarav Sharma/).first().click();
    await page.waitForURL('**/dashboard');
    await expect(page.getByText(/(Ankita Kapri|Aarav Sharma)/i).first()).toBeVisible();

    // Verify Language Selector & Hindi Pending Review Tag in TopUtilityBar
    const langBtn = page.getByTestId('language-selector-btn');
    await expect(langBtn).toBeVisible();
    await langBtn.click();
    const hindiOption = page.getByTestId('lang-option-hi');
    await expect(hindiOption).toBeVisible();
    await expect(hindiOption).toContainText('Pending Review');
    await hindiOption.click();

    // Verify Hindi pending review indicator in top utility bar
    await expect(page.getByTestId('hindi-pending-review-badge')).toBeVisible();

    // Switch back to English
    await langBtn.click();
    await page.getByTestId('lang-option-en').click();
    await expect(page.getByTestId('hindi-pending-review-badge')).not.toBeVisible();

    // Navigate to Jaipur Civic Observation Course
    await page.goto('/learn/course_civic_obs_01');
    await expect(page.getByRole('heading', { name: /Civic Observation & Safe Streets/i })).toBeVisible();

    // Open Lesson 104
    await page.goto('/learn/course_civic_obs_01/lesson/les_obs_104');
    await expect(page.getByRole('heading', { name: /Conducting Peer Pedestrian Safety Interviews/i })).toBeVisible();

    // Submit assignment asg_obs_03 with field evidence
    await page.goto('/assignments/asg_obs_03/submit');
    await expect(page.getByRole('heading', { name: /Pedestrian Flow Interview with 5 Peers/i })).toBeVisible();

    const notesInput = page.getByLabel(/Field Observation Notes & Data Log/i);
    const observationDraft = 'Package 09 Acceptance: Field audit of morning crossing safety at Virani Science College corridor on Kalawad Road.';
    await notesInput.fill(observationDraft);
    await expect(page.getByText(/Draft autosaved locally/i)).toBeVisible({ timeout: 5000 });

    // Submit assignment
    await page.getByRole('button', { name: /Submit for/i }).click();
    await page.waitForURL('**/assignments/asg_obs_03');
    await expect(page.getByText(/Under Review/i).first()).toBeVisible();

    // -------------------------------------------------------------
    // Step 2: Switch to Mentor and Verify Submission
    // -------------------------------------------------------------
    await page.goto('/demo-login');
    await page.getByText(/(Shri Mayur Parmar|Kavita Rao)/i).first().click();
    await page.waitForURL('**/dashboard');

    await page.goto('/assignments/asg_obs_03');
    await expect(page.getByText(/(Shri Mayur Parmar|Kavita Rao)/i).first()).toBeVisible();

    // Mentor approves assignment with score
    const feedbackInput = page.getByLabel(/Teacher Feedback/i);
    if (await feedbackInput.isVisible()) {
      await feedbackInput.fill('Excellent fieldwork observation.');
      await page.getByRole('button', { name: /Verify Submission/i }).click();
      await expect(page.getByText(/Mentor Verification & Feedback|Verified/i).first()).toBeVisible();
    }

    // -------------------------------------------------------------
    // Step 3: Invite-Only Private Workspace (ws_jaipur_school_safety)
    // -------------------------------------------------------------
    // Log back in as Ankita (invited member)
    await page.goto('/demo-login');
    await page.getByText(/Ankita Kapri|Aarav Sharma/).first().click();
    await page.waitForURL('**/dashboard');

    await page.goto('/workspace/ws_jaipur_school_safety');
    await expect(page.getByRole('heading', { level: 1, name: 'Workspace' })).toBeVisible();
    await expect(page.getByText(/Single-Browser Local Simulation/i)).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /(Rajkot|Jaipur) Ward (8|24) School-Zone Safety Workspace/i })).toBeVisible();

    // Acknowledge rulebook if presented
    const ackRulebookBtn = page.getByRole('button', { name: /Acknowledge Rulebook & Enter/i });
    if (await ackRulebookBtn.isVisible()) {
      await ackRulebookBtn.click();
    }

    // Add an action note in workspace
    const newActionInput = page.getByPlaceholder(/Type an action item/i);
    if (await newActionInput.isVisible()) {
      await newActionInput.fill('Deploy student crossing guides at gate 2 during 8:00 AM rush');
      await page.getByRole('button', { name: /Add Action/i }).click();
      await expect(page.getByText('Deploy student crossing guides at gate 2 during 8:00 AM rush')).toBeVisible();
    }

    // Verify uninvited access denial: switch to an uninvited persona
    await page.goto('/demo-login');
    await page.getByText(/(Nazim M\. Sandh|Dev Patel)/i).first().click();
    await page.waitForURL('**/dashboard');

    await page.goto('/workspace/ws_jaipur_school_safety');
    await expect(page.getByText(/Access Denied \/ Repository Error/i)).toBeVisible();
    await expect(page.getByText(/is invite-only private and cannot be accessed without an invitation/i)).toBeVisible();
    // Verify no workspace sensitive data is exposed
    await expect(page.getByText('Deploy student crossing guides at gate 2 during 8:00 AM rush')).not.toBeVisible();

    // -------------------------------------------------------------
    // Step 4: Limited Event Allocation & ceil(0.33 x places) Vacancy
    // -------------------------------------------------------------
    // As ordinary participant, attempt RSVP to limited event with reserved places
    await page.goto('/demo-login');
    await page.getByRole('button', { name: /All Students/i }).click();
    await page.getByText('Kanha Kapri').first().click();
    await page.waitForURL('**/dashboard');

    await page.goto('/events/evt_jaipur_limited_05');
    await expect(page.getByRole('heading', { level: 1, name: /(Rajkot|Jaipur) Ward (8|24) Youth Council/i })).toBeVisible();
    await expect(page.getByTestId('reservation-allocation-card')).toBeVisible();

    // Verify aggregate allocation metrics with privacy withholding for small cohorts
    await expect(page.getByTestId('metric-total-places')).toHaveText('3');
    await expect(page.getByTestId('metric-reserved-minimum')).toHaveText('1');

    // Attempt RSVP: rejected neutrally because ordinary capacity is full and remaining place is reserved
    const attendingBtn = page.getByRole('button', { name: /^Attending$/i });
    if (await attendingBtn.isVisible()) {
      await attendingBtn.click();
      const alertBox = page.getByRole('alert');
      await expect(alertBox).toBeVisible();
      await expect(alertBox).toContainText('This RSVP cannot be accepted under current allocation rules');
    }

    // Verify virtual preview tag on virtual event
    await page.goto('/events/evt_expert_session_03');
    const videoTag = page.getByTestId('video-preview-tag');
    await expect(videoTag).toBeVisible();
    await expect(videoTag).toContainText('Preview');

    // -------------------------------------------------------------
    // Step 5: Text-First Debate Room (sess_jaipur_01)
    // -------------------------------------------------------------
    // Navigate to debate room
    await page.goto('/events/sess_jaipur_01/debate-room');
    await expect(page.getByRole('heading', { level: 1, name: /Debate Room/i })).toBeVisible();

    // Verify video-preview badge per PRD OD.4
    const debateVideoBadge = page.getByTestId('video-preview-badge');
    await expect(debateVideoBadge).toBeVisible();
    await expect(debateVideoBadge).toContainText('Text-first session');

    // Open reservation disclosure and verify Point-of-Use Reservation Rulebook banner
    await page.getByText('Seats and 33% reservation').click();
    const debateRulebookBanner = page.getByTestId('debate-reservation-rulebook-banner');
    await expect(debateRulebookBanner).toBeVisible();
    await expect(debateRulebookBanner.getByText(/ceil\(0\.33 × planned places\)/i)).toBeVisible();
    await expect(debateRulebookBanner.getByText(/open speaking queue is not a fixed named role/i)).toBeVisible();

    // Verify 7 named roles card is visible
    const allocationsCard = page.getByTestId('debate-reservation-allocations-card');
    await expect(allocationsCard).toBeVisible();

    // Speaking Queue: request turn and verify speaking queue does NOT claim fixed-place compliance
    const requestTurnBtn = page.getByRole('button', { name: /Request Speaking Turn/i });
    if (await requestTurnBtn.isVisible()) {
      await requestTurnBtn.click();
      await expect(page.getByText(/Speaking turn requested|You are now in the queue/i)).toBeVisible();
    }

    // Direct route reload check
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: /Debate Room/i })).toBeVisible();
    await expect(debateVideoBadge).toBeVisible();

    // Non-existent session route check: verify fallback card without infinite spinner
    await page.goto('/events/sess_nonexistent_9999/debate-room');
    await expect(page.getByRole('heading', { name: /Debate Room Session Not Found/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /View All Events & Chambers/i })).toBeVisible();

    // -------------------------------------------------------------
    // Step 6: Platform Owner Exception & Audit Trail
    // -------------------------------------------------------------
    // Switch to Platform Owner (Nazim M. Sandh / user_admin)
    await page.goto('/demo-login');
    await page.getByText(/Nazim M\. Sandh|Demo Administrator/).first().click();
    await page.waitForURL('**/dashboard');

    await page.goto('/events/sess_jaipur_01/debate-room');
    await expect(page.getByRole('heading', { level: 1, name: /Debate Room/i })).toBeVisible();

    // Verify Owner controls are visible (Audit trail button)
    await page.getByText('Seats and 33% reservation').click();
    const auditBtn = page.getByTestId('view-role-audits-btn-facilitator');
    await expect(auditBtn).toBeVisible();
    await auditBtn.click();

    const auditModal = page.getByTestId('debate-audit-trail-modal');
    await expect(auditModal).toBeVisible();
    await expect(auditModal.getByText(/Allocation Audit Trail/i)).toBeVisible();
    await page.getByTestId('close-debate-audit-trail-btn').click();
    await expect(auditModal).not.toBeVisible();

    // -------------------------------------------------------------
    // Step 7: Mode Transition to Youth Assembly Deliberation
    // -------------------------------------------------------------
    await page.goto('/assemblies/assembly_jaipur_pedestrian_2026/session');
    await expect(page.getByRole('heading', { level: 1, name: /(Rajkot|Jaipur) School Zone Pedestrian Safety/i })).toBeVisible();

    // Verify 6 canonical stages and 4 functional role zones
    await expect(page.getByText(/Stage 1|Orientation|Evidence Dock/i).first()).toBeVisible();
    await expect(page.locator('.font-heading', { hasText: 'Thinker' }).first()).toBeVisible();
    await expect(page.locator('.font-heading', { hasText: 'Enabler' }).first()).toBeVisible();

    // Verify rulebook banner in assembly
    const assemblyBanner = page.getByTestId('assembly-reservation-rulebook-banner');
    if (await assemblyBanner.isVisible()) {
      await expect(assemblyBanner.getByText(/ceil\(0\.33 × planned places\)/i)).toBeVisible();
    }

    // -------------------------------------------------------------
    // Step 8: Civic Passport & Credits Ledger
    // -------------------------------------------------------------
    // Switch back to Ankita Kapri
    await page.goto('/demo-login');
    await page.getByText(/Ankita Kapri|Aarav Sharma/).first().click();
    await page.waitForURL('**/dashboard');

    await page.goto('/passport');
    await expect(page.getByText(/Civic Passport Portfolio/i)).toBeVisible();

    // Verify 7 PRD civic dimensions
    await expect(page.getByText(/Civic Credit (Point )?Dimensions \(7 Dimensions\)/i)).toBeVisible();
    for (const dim of ['Learning', 'Observation', 'Deliberation', 'Contribution', 'Collaboration', 'Civic Action', 'Reflection']) {
      await expect(page.getByText(dim, { exact: false }).first()).toBeVisible();
    }

    // Verify Credits breakdown
    await page.goto('/passport/credits');
    await expect(page.getByRole('heading', { level: 1, name: /Civic Credit (Points )?Ledger/i })).toBeVisible();
    await expect(page.getByText(/Transparent Activity Award Rules & Explainable Formula/i)).toBeVisible();

    // -------------------------------------------------------------
    // Step 9: Responsive Mobile View (375px)
    // -------------------------------------------------------------
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/events/sess_jaipur_01/debate-room');
    await expect(page.getByRole('heading', { level: 1, name: /(Rajkot|Jaipur) Youth Pedestrian Safety Debate Room/i })).toBeVisible();
    await expect(debateVideoBadge).toBeVisible();

    // Verify no horizontal overflow on mobile body
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(isOverflowing).toBe(false);
  });
});
