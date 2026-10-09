import { test, expect } from '@playwright/test';

test.describe('JanSahabhag 2047 — Golden Path Walkthrough', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to demo login and reset localStorage for a deterministic clean run
    await page.goto('/demo-login');
    await page.evaluate(() => {
      localStorage.removeItem('jansahbhag_demo_v1');
    });
    await page.reload();
  });

  test('executes complete end-to-end civic journey from learning to passport', async ({ page }) => {
    // 1. Open Demo and Select Aarav Sharma (Participant)
    await page.goto('/demo-login');
    await expect(page.getByRole('heading', { name: /Enter JanSahabhag/i })).toBeVisible();

    // Select Aarav Sharma card
    await page.getByText('Aarav Sharma').first().click();

    // Verify Dashboard loads
    await page.waitForURL('**/dashboard');
    await expect(page.getByText(/Viewing as/i).first()).toBeVisible();
    await expect(page.getByText('Aarav Sharma').first()).toBeVisible();

    // 2. Learning Journey: Open Course CIV-101 and Complete Next Lesson
    await page.goto('/learn/course_civic_obs_01');
    await expect(page.getByRole('heading', { name: /Civic Observation & Safe Streets/i })).toBeVisible();

    // Open Lesson 4 (les_obs_104)
    await page.goto('/learn/course_civic_obs_01/lesson/les_obs_104');
    await expect(page.getByRole('heading', { name: /Conducting Peer Pedestrian Safety Interviews/i })).toBeVisible();

    // Mark Lesson Complete
    const completeLessonBtn = page.getByRole('button', { name: /Mark Lesson Complete/i });
    if (await completeLessonBtn.isVisible()) {
      await completeLessonBtn.click();
      await expect(page.getByText(/completed/i).first()).toBeVisible();
    }

    // 3. Assignment Workflow: Draft, Attach Mock Evidence, and Submit
    await page.goto('/assignments/asg_obs_03/submit');
    await expect(page.getByRole('heading', { name: /Pedestrian Flow Interview with 5 Peers/i })).toBeVisible();

    // Fill observation notes
    const notesInput = page.getByLabel(/Field Observation Notes & Data Log/i);
    await notesInput.fill('Detailed peer interview audit on Madhyam Marg: interviewed 5 students across morning and afternoon peak hours. Students report severe anxiety at the un-signalised zebra crossing.');

    // Log a new mock evidence record
    await page.getByRole('button', { name: /Log New Mock Evidence/i }).click();
    await page.getByLabel(/Evidence Title/i).fill('Student Commuter Safety Survey Responses');
    await page.getByLabel(/Description & Quantitative Findings/i).fill('Survey of 5 walkers showing 100% agreement that crossing speed and lack of refuge island creates extreme hazard.');
    await page.getByRole('button', { name: /Save & Attach Evidence/i }).click();

    // Save as draft first
    await page.getByRole('button', { name: /Save as Draft/i }).click();
    await page.waitForURL('**/assignments/asg_obs_03');
    await expect(page.getByText(/Draft In Progress/i)).toBeVisible();

    // Resume and Submit for Verification
    await page.getByRole('button', { name: /Resume & Submit/i }).click();
    await page.waitForURL('**/assignments/asg_obs_03/submit');
    await page.getByRole('button', { name: /Submit for/i }).click();
    await page.waitForURL('**/assignments/asg_obs_03');
    await expect(page.getByText(/Under Review/i).first()).toBeVisible();

    // 4. Switch Persona to Teacher Kavita Rao
    await page.getByRole('button', { name: /Viewing as/i }).click();
    await expect(page.getByText('Switch Demo Persona')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: /Kavita Rao/i }).click();

    // Verify Teacher perspective in Top Utility Bar
    await expect(page.getByText(/Teacher \/ Mentor/i).first()).toBeVisible();

    // Open Assignment Review Queue
    await page.goto('/assignments');
    await expect(page.getByRole('heading', { name: /Assignment Review Queue/i })).toBeVisible();

    // Open Aarav's exact submission
    await page.goto('/assignments/asg_obs_03');
    await expect(page.getByText(/Teacher Verification & Assessment Panel/i)).toBeVisible();
    await expect(page.getByText(/Reviewing: Aarav Sharma/i)).toBeVisible();

    // Enter teacher feedback and verify
    const feedbackInput = page.getByLabel(/Teacher Feedback/i);
    await feedbackInput.fill('Outstanding peer interviews Aarav. The qualitative data clearly demonstrates the urgency of school zone crossing interventions.');
    await page.getByRole('button', { name: /Verify Submission/i }).click();
    await expect(page.getByText(/Mentor Verification & Feedback/i)).toBeVisible();

    // 5. Switch Persona Back to Aarav Sharma
    await page.getByRole('button', { name: /Viewing as/i }).click();
    await page.getByRole('dialog').getByRole('button', { name: /Aarav Sharma/i }).click();
    await expect(page.getByText(/Viewing as Youth Participant/i).first()).toBeVisible();

    // 6. Youth Assembly Deliberation & Role Execution
    await page.goto('/assemblies');
    await expect(page.getByRole('heading', { name: /Youth Deliberative Assemblies/i })).toBeVisible();

    // Open Jaipur Pedestrian Safety Assembly
    await page.goto('/assemblies/assembly_jaipur_pedestrian_2026');
    await expect(page.getByRole('heading', { name: /Jaipur School Zone Pedestrian Safety Youth Assembly 2026/i })).toBeVisible();

    // Join Assembly
    const joinBtn = page.getByRole('button', { name: /Join Youth Assembly|Enter Live Deliberation Workspace/i });
    await joinBtn.click();
    await page.waitForURL('**/assemblies/assembly_jaipur_pedestrian_2026/session');

    // 7. Deliberation: Add Substantive Contribution
    await page.getByRole('button', { name: /4\. Deliberation/i }).click();
    await expect(page.getByRole('heading', { name: /Deliberation/i, level: 2 })).toBeVisible();
    const contribInput = page.getByPlaceholder(/Enter your inquiry, argument, or amendment/i);
    await contribInput.fill('How will the proposed raised tabletop crossing handle storm water drainage during heavy monsoon rains without pooling near the pedestrian walkway?');
    await page.getByRole('button', { name: /Submit Contribution/i }).click();
    await expect(page.getByText(/Substantive contribution submitted/i)).toBeVisible();

    // 8. Revisions: Submit Amendment
    await page.getByRole('button', { name: /6\. Revisions & Amendments/i }).click();
    await expect(page.getByRole('heading', { name: /Revisions & Amendments/i, level: 2 })).toBeVisible();
    const summaryInput = page.getByPlaceholder(/e\.g\. Added IRC 1:15 approach ramp gradient/i);
    await summaryInput.fill('Add mandatory roadside curb drainage flumes to prevent monsoon pooling.');
    await page.getByRole('button', { name: /Submit Revision/i }).click();
    await expect(page.getByText(/Add mandatory roadside curb drainage flumes/i)).toBeVisible();

    // 9. Outcome: Finalise Proposition Resolution
    await page.getByRole('button', { name: /8\. Final Outcome/i }).click();
    await expect(page.getByRole('heading', { name: /Final Outcome/i, level: 2 })).toBeVisible();
    const finaliseBtn = page.getByRole('button', { name: /Finalise Chamber Resolution/i });
    if (await finaliseBtn.isVisible()) {
      await finaliseBtn.click();
    }

    // 10. Reflection: Write Civic Reflection
    await page.getByRole('button', { name: /9\. Civic Reflection/i }).click();
    await expect(page.getByRole('heading', { name: /Civic Reflection/i, level: 2 })).toBeVisible();
    const reflectionInput = page.getByPlaceholder(/Write your honest reflections/i);
    await reflectionInput.fill('Participating in this assembly reinforced that democratic deliberation requires listening closely to conflicting priorities—such as driver speed versus child pedestrian safety—and finding evidence-backed civic consensus.');
    await page.getByRole('button', { name: /Submit Reflection/i }).click();
    await expect(page.getByText(/Civic Reflection Recorded!/i)).toBeVisible();

    // 11. Open Civic Passport & Confirm Connected Records & Credits
    await page.goto('/passport');
    await expect(page.getByRole('heading', { name: /Aarav Sharma/i })).toBeVisible();
    await expect(page.getByText(/Verified Civic Passport/i)).toBeVisible();

    // Check Credit Ledger
    await page.goto('/passport/credits');
    await expect(page.getByRole('heading', { name: /Civic Credit Ledger/i })).toBeVisible();
    await expect(page.getByText(/Total Verified/i)).toBeVisible();
  });
});

