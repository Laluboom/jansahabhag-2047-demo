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
    // 1. Open Demo and Select Ankita Kapri (Participant)
    await page.goto('/demo-login');
    await expect(page.getByRole('heading', { name: /Enter JanSahabhag/i })).toBeVisible();

    // Select participant card
    await page.getByText(/Ankita Kapri|Aarav Sharma/).first().click();

    // Verify Dashboard loads
    await page.waitForURL('**/dashboard');
    await expect(page.getByText(/Viewing as/i).first()).toBeVisible();
    await expect(page.getByText(/Ankita Kapri|Aarav Sharma/).first()).toBeVisible();

    // 2. Learning Journey: Open Course CIV-101 and Complete Next Lesson
    await page.goto('/learn/course_civic_obs_01');
    await expect(page.getByRole('heading', { name: /Civic Observation & Safe Streets/i })).toBeVisible();

    // Open Lesson 4 (les_obs_104)
    await page.goto('/learn/course_civic_obs_01/lesson/les_obs_104');
    await expect(page.getByRole('heading', { name: /Conducting Peer Pedestrian Safety Interviews/i })).toBeVisible();

    // Mark Lesson Complete (deterministic)
    const completeLessonBtn = page.getByRole('button', { name: /Mark Lesson Complete/i });
    await completeLessonBtn.click();
    await expect(page.getByText(/Lesson Completed!|Completed Lesson/i).first()).toBeVisible();

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

    // 4. Switch Persona to Teacher
    await page.getByRole('button', { name: /Viewing as/i }).click();
    await expect(page.getByText('Switch Demo Persona')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: /(Shri Mayur Parmar|Kavita Rao)/i }).click();

    // Verify Teacher perspective in Top Utility Bar
    await expect(page.getByText(/Teacher \/ Mentor/i).first()).toBeVisible();

    // Open Assignment Review Queue
    await page.goto('/assignments');
    await expect(page.getByRole('heading', { name: /Assignment Review Queue/i })).toBeVisible();

    // Open participant submission
    await page.goto('/assignments/asg_obs_03');
    await expect(page.getByText(/Teacher Verification & Assessment Panel/i)).toBeVisible();
    await expect(page.getByText(/Reviewing: (Ankita Kapri|Aarav Sharma)/i)).toBeVisible();

    // Enter teacher feedback and verify
    const feedbackInput = page.getByLabel(/Teacher Feedback/i);
    await feedbackInput.fill('Outstanding peer interviews. The qualitative data clearly demonstrates the urgency of school zone crossing interventions.');
    await page.getByRole('button', { name: /Verify Submission/i }).click();
    await expect(page.getByText(/Mentor Verification & Feedback/i)).toBeVisible();

    // 5. Switch Persona Back to Participant
    await page.getByRole('button', { name: /Viewing as/i }).click();
    await page.getByRole('dialog').getByRole('button', { name: /(Ankita Kapri|Aarav Sharma)/i }).click();
    await expect(page.getByText(/Viewing as Youth Participant/i).first()).toBeVisible();

    // 6. Youth Assembly Deliberation & Role Execution
    await page.goto('/assemblies');
    await expect(page.getByRole('heading', { name: /Youth Deliberative Assemblies/i })).toBeVisible();

    // Open Pedestrian Safety Assembly
    await page.goto('/assemblies/assembly_jaipur_pedestrian_2026');
    await expect(page.getByRole('heading', { name: /(Rajkot|Jaipur) School Zone Pedestrian Safety Youth Assembly 2026/i })).toBeVisible();

    // Join Assembly
    const joinBtn = page.getByRole('button', { name: /Join Youth Assembly|Enter Live Deliberation Workspace/i });
    await joinBtn.click();
    await page.waitForURL('**/assemblies/assembly_jaipur_pedestrian_2026/session*');

    // 7. Deliberation: Add Substantive Contribution
    const contribInput = page.getByPlaceholder(/Enter your substantive inquiry or argument citing evidence/i);
    await contribInput.fill('How will the proposed raised tabletop crossing handle storm water drainage during heavy monsoon rains without pooling near the pedestrian walkway?');
    await page.getByRole('button', { name: /Submit Contribution/i }).click();
    await expect(page.getByText(/Substantive contribution submitted!/i)).toBeVisible();

    // 8. Shape: Submit Proposition Amendment
    await page.getByRole('button', { name: /Stage 5.*Shape/i }).click();
    await expect(page.getByText(/Shapers Lead: Proposition Call & Synthesis/i)).toBeVisible();
    const rationaleInput = page.getByPlaceholder(/Revision rationale/i);
    await rationaleInput.fill('Add mandatory roadside curb drainage flumes to prevent monsoon pooling.');
    await page.getByRole('button', { name: /Submit Amendment/i }).click();
    await expect(page.getByText(/Revision v.*recorded successfully/i)).toBeVisible();

    // 9. Final Assembly: Finalise Proposition Resolution
    await page.getByRole('button', { name: /Stage 6.*Final Assembly/i }).click();
    await expect(page.getByText(/Final Assembly: Deliberation Outcome/i)).toBeVisible();
    await page.getByRole('button', { name: 'QUALIFIED SUPPORT' }).click();
    const finaliseBtn = page.getByRole('button', { name: /Finalise Assembly Resolution/i });
    await finaliseBtn.click();
    await expect(page.getByText(/Resolution finalised and permanently locked/i)).toBeVisible();

    // 10. Reflection: Write Civic Reflection
    await expect(page.getByText(/Civic Reflection & Ethical Values/i)).toBeVisible();
    const reflectionInput = page.getByPlaceholder(/Write your honest reflections/i);
    await reflectionInput.fill('Participating in this assembly reinforced that democratic deliberation requires listening closely to conflicting priorities—such as driver speed versus child pedestrian safety—and finding evidence-backed civic consensus.');
    await page.getByRole('button', { name: /Submit Reflection/i }).click();
    await expect(page.getByText(/Civic Reflection Recorded!/i)).toBeVisible();

    // 11. Open Civic Passport & Confirm All Connected Records & Reflections
    await page.goto('/passport');
    await expect(page.getByRole('heading', { name: /(Ankita Kapri|Aarav Sharma)/i })).toBeVisible();
    await expect(page.getByText(/Civic Passport Portfolio/i)).toBeVisible();

    // Confirm Activity Timeline records from this exact run
    await expect(page.getByText(/Completed: Conducting Peer Pedestrian Safety Interviews/i)).toBeVisible();
    await expect(page.getByText(/Verified: Pedestrian Flow Interview with 5 Peers/i)).toBeVisible();
    await expect(page.getByText(/Appointed Assembly Shaper/i)).toBeVisible();
    await expect(page.getByText(/Substantive Contribution: Question/i)).toBeVisible();
    await expect(page.getByText(/Assembly Resolution: QUALIFIED_SUPPORT/i)).toBeVisible();

    // Confirm Reflection recorded in Passport history
    await expect(page.getByText(/Participating in this assembly reinforced that democratic deliberation/i)).toBeVisible();

    // 12. Check Credit Ledger & Specific Ledger Transactions
    await page.goto('/passport/credits');
    await expect(page.getByRole('heading', { name: /Civic Credit (Points )?Ledger/i })).toBeVisible();
    await expect(page.getByText(/Completed lesson: Conducting Peer Pedestrian Safety Interviews/i)).toBeVisible();
    await expect(page.getByText(/Submitted assignment: Pedestrian Flow Interview with 5 Peers/i)).toBeVisible();
    await expect(page.getByText(/Verified field evidence: Student Commuter Safety Survey Responses/i)).toBeVisible();
    await expect(page.getByText(/Joined Youth Assembly: (Rajkot|Jaipur) School Zone Pedestrian Safety Youth Assembly 2026/i)).toBeVisible();
    await expect(page.getByText(/Added substantive contribution \(question\)/i)).toBeVisible();
    await expect(page.getByText(/Civic reflection: Reflect on how this deliberative process/i)).toBeVisible();
  });
});


