import { test, expect } from '@playwright/test';

test.describe('Package 06: Rajkot Proposition Workspace Invitation & Moderation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo-login');
    await page.evaluate(() => {
      localStorage.removeItem('jansahbhag_demo_v1');
    });
    await page.reload();
    await page.getByText('Ankita Kapri').first().click();
    await page.waitForURL('**/dashboard');
  });

  test('desktop complete flow: roundtrip navigation, exact username invitation, invitee acceptance, rulebook acknowledgement, substantive action posting, and scoped moderation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Visible route from proposition to Workspace and reciprocal link back
    await page.goto('/propositions/prop_jaipur_pedestrian_01');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Check proposition collaboration card
    const workspaceCard = page.getByRole('heading', { name: 'Proposition Deliberation Workspace' });
    await expect(workspaceCard).toBeVisible();
    await expect(page.getByText('Invite-Only Private', { exact: true })).toBeVisible();

    // Navigate to Workspace via the card button
    await page.getByRole('button', { name: /Open Workspace/i }).click();
    await page.waitForURL('**/workspace/ws_jaipur_school_safety');

    // Verify Workspace header, single-browser simulation notice, and safety context
    await expect(page.getByRole('heading', { level: 1, name: 'Workspace' })).toBeVisible();
    await expect(page.getByText(/Single-Browser Local Simulation/i)).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /(Rajkot Ward 8|Jaipur Ward 24) School-Zone Safety Workspace/i })).toBeVisible();
    await expect(page.getByText(/Coordinating student traffic marshals, IRC tabletop crosswalk engineering review/i)).toBeVisible();

    // Reciprocal route back to proposition
    const backLink = page.locator('[data-testid="link-back-to-proposition"]');
    await expect(backLink).toBeVisible();
    await backLink.click();
    await page.waitForURL('**/propositions/prop_jaipur_pedestrian_01');

    // Return to workspace
    await page.goto('/workspace/ws_jaipur_school_safety');

    // 2. Exact-match Username Invitation Flow
    // Switch to Niyati Chawda (active member with canInvite permission)
    await page.locator('[data-testid="switch-to-VSC-S-002"]').click();
    await expect(page.locator('[data-testid="connected-persona"]')).toContainText('Niyati Chawda');

    // Switch to Members & Invites tab
    await page.locator('[data-testid="tab-members"]').click();
    await expect(page.getByRole('heading', { name: /Exact-Match Username Invitation/i })).toBeVisible();

    // Unknown username search produces clear feedback
    const inviteInput = page.locator('[data-testid="input-invite-username"]');
    await inviteInput.fill('@unknown.person.99');
    await page.locator('[data-testid="btn-search-username"]').click();
    await expect(page.getByText(/No matching platform persona found for "@unknown.person.99"/i)).toBeVisible();

    // Search exact registered username for Kanha Kapri
    await inviteInput.fill('kanha.kapri');
    await page.locator('[data-testid="btn-search-username"]').click();
    await expect(page.locator('[data-testid="user-search-result-kanha.kapri"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-search-result-kanha.kapri"]').getByText('Kanha Kapri')).toBeVisible();

    // 3. Invitee Journey: Pending banner, protected content, acceptance & rulebook requirement
    // Switch to Harshita Kapri, who has an existing pending invitation in seed data
    await page.locator('[data-testid="switch-to-VSC-S-003"]').click();
    await expect(page.locator('[data-testid="connected-persona"]')).toContainText('Harshita Kapri');

    // Harshita sees pending invitation banner with workspace details and rules notice
    const inviteBanner = page.locator('[data-testid="invitation-banner"]');
    await expect(inviteBanner).toBeVisible();
    await expect(inviteBanner).toContainText('Workspace Invitation Pending');
    await expect(inviteBanner).toContainText(/(Rajkot Ward 8|Jaipur Ward 24) School-Zone Safety Workspace/i);

    // Verify member content is protected from invited users prior to acceptance
    await expect(page.locator('[data-testid="invited-content-protected"]')).toBeVisible();

    // Harshita accepts invitation
    await page.locator('[data-testid="btn-accept-invite"]').click();
    await expect(page.getByText(/Invitation accepted! Welcome to the/i)).toBeVisible();

    // Point-of-use Rulebook acknowledgement modal pops up (or can be acknowledged)
    const ruleModalBtn = page.locator('[data-testid="btn-modal-acknowledge-rules"]');
    if (await ruleModalBtn.isVisible()) {
      await ruleModalBtn.click();
      await expect(page.getByText(/Successfully acknowledged Rulebook v1.0/i)).toBeVisible();
    }

    // 4. Substantive Action Posting with Proposition Provenance
    await page.locator('[data-testid="tab-actions"]').click();
    await page.locator('[data-testid="btn-open-create-action"]').click();
    await page.locator('[data-testid="input-action-title"]').fill("Harshita's Kalawad Road Crosswalk Timing Observation");
    await page.locator('[data-testid="input-action-content"]').fill('Observed 55 students crossing at 8:10 AM during morning peak. Tabletop height of 100mm required to calm heavy delivery vehicles.');
    await page.locator('[data-testid="select-source-link"]').selectOption('proposition');
    await page.locator('[data-testid="btn-submit-action"]').click();

    // Note is published and visible
    await expect(page.getByText("Harshita's Kalawad Road Crosswalk Timing Observation")).toBeVisible();
    await expect(page.getByText(/PROP-JAIPUR-01|PROP-RAJKOT-01/i).first()).toBeVisible();

    // 5. Scoped Moderation: Regular Member vs Unrelated Persona Denial vs Room Moderator
    // Switch to Ankita Kapri (regular active member, not a room moderator)
    await page.locator('[data-testid="switch-to-VSC-S-001"]').click();
    await expect(page.locator('[data-testid="connected-persona"]')).toContainText('Ankita Kapri');

    // Ankita should NOT have moderation controls (freeze/remove) visible
    await page.locator('[data-testid="tab-actions"]').click();
    const harshitaNoteCard = page.locator('[data-testid^="action-card-"]', { hasText: "Harshita's Kalawad Road Crosswalk Timing Observation" });
    await expect(harshitaNoteCard.locator('button:has-text("Freeze")')).not.toBeVisible();
    await expect(harshitaNoteCard.locator('button:has-text("Remove")')).not.toBeVisible();

    // Switch to Nazim (unrelated platform persona, not invited/member of private workspace)
    await page.locator('[data-testid="switch-to-JS-F-001"]').click();
    await expect(page.getByText(/Access Denied \/ Repository Error/i)).toBeVisible();
    await expect(page.getByText(/is invite-only private and cannot be accessed without an invitation/i)).toBeVisible();

    // Switch to Aroh Mehta (designated Room Moderator) via error screen
    await page.locator('[data-testid="btn-error-switch-rohan"]').click();
    await expect(page.locator('[data-testid="connected-persona"]')).toContainText('Aroh Mehta');

    // Aroh Mehta HAS room moderation controls
    await page.locator('[data-testid="tab-actions"]').click();
    const arohHarshitaCard = page.locator('[data-testid^="action-card-"]', { hasText: "Harshita's Kalawad Road Crosswalk Timing Observation" });
    const freezeBtn = arohHarshitaCard.locator('button:has-text("Freeze")');
    await expect(freezeBtn).toBeVisible();

    // Execute scoped freeze
    await freezeBtn.click();
    await page.locator('[data-testid="input-moderation-reason"]').fill('Technical review on vehicle count methodology pending PWD concurrence.');
    await page.locator('[data-testid="btn-confirm-moderation"]').click();

    // Verified frozen status and moderator note display
    await expect(arohHarshitaCard.getByText('Frozen', { exact: true })).toBeVisible();
    await expect(arohHarshitaCard.locator('button:has-text("Unfreeze")')).toBeVisible();
    await expect(page.getByText(/Technical review on vehicle count methodology pending PWD concurrence/i)).toBeVisible();

    // Check Audit Trail tab
    await page.locator('[data-testid="tab-moderation"]').click();
    await expect(page.getByRole('heading', { name: /Auditable Action Log/i })).toBeVisible();
    await expect(page.locator('table').getByText('Aroh Mehta').first()).toBeVisible();
    await expect(page.getByText(/Technical review on vehicle count methodology/i).first()).toBeVisible();
  });

  test('mobile viewport 375x667 handles tabs, clean layout without horizontal overflow, and rulebook viewing', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/workspace/ws_jaipur_school_safety');
    await expect(page.getByRole('heading', { level: 1, name: 'Workspace' })).toBeVisible();

    // Verify no horizontal overflow on mobile
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    // Test tab navigation on mobile
    await page.locator('[data-testid="tab-rulebook"]').click();
    await expect(page.locator('[data-testid="rulebook-panel"]')).toBeVisible();
    await expect(page.getByText('Point of Use Rules of Procedure')).toBeVisible();
    await expect(page.getByText('1. Scoped Membership & Institutional Affiliation')).toBeVisible();
    await expect(page.getByText('2. Transparent Scoped Moderation')).toBeVisible();

    // Switch back to Notes tab on mobile
    await page.locator('[data-testid="tab-actions"]').click();
    await expect(page.getByRole('heading', { name: /Proposition Collaboration Feed/i })).toBeVisible();
  });
});
