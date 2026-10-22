import { describe, it, expect, beforeEach } from 'vitest';
import { LocalDemoRepository } from '../src/services/demoRepository';
import { PersistenceService } from '../src/services/persistence';

describe('DemoRepository Domain Service Implementation', () => {
  let repository: LocalDemoRepository;

  beforeEach(() => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    repository = new LocalDemoRepository();
  });

  describe('Lesson Completion & Learning Progress', () => {
    it('completing a lesson calculates progress, awards 1 learning credit, and creates passport entry', async () => {
      const initialCredits = await repository.getCredits('user_aarav');
      const initialTotal = initialCredits.reduce((s, c) => s + c.amount, 0);

      // Complete lesson 3 (les_obs_103) for course CIV-101 (which has 4 lessons; 2 already done)
      const result = await repository.completeLesson('user_aarav', 'les_obs_103');
      expect(result.enrolment.completedLessonIds).toContain('les_obs_103');
      expect(result.enrolment.progressPercent).toBe(75); // 3 of 4 lessons
      expect(result.enrolment.status).toBe('in_progress');

      const updatedCredits = await repository.getCredits('user_aarav');
      const updatedTotal = updatedCredits.reduce((s, c) => s + c.amount, 0);
      expect(updatedTotal).toBe(initialTotal + 1);

      // Check passport entry
      const passport = await repository.getPassport('user_aarav');
      const lessonEntry = passport.entries.find((p) => p.sourceReferenceId === 'les_obs_103');
      expect(lessonEntry).toBeDefined();
      expect(lessonEntry?.category).toBe('learning');
      expect(lessonEntry?.creditsAwarded).toBe(1);

      // Check notification
      const notifs = await repository.getNotifications('user_aarav');
      const notif = notifs.find((n) => n.targetRoute === '/passport/credits');
      expect(notif).toBeDefined();
      expect(notif?.type).toBe('credit');

      // Check dashboard reflection
      const dashboard = await repository.getDashboard('user_aarav');
      expect(dashboard.creditSummary.total).toBe(updatedTotal);
    });

    it('completing all lessons marks course completed and creates course achievement passport entry', async () => {
      // Complete lesson 3 and lesson 4 of CIV-101
      await repository.completeLesson('user_aarav', 'les_obs_103');
      const finalResult = await repository.completeLesson('user_aarav', 'les_obs_104');

      expect(finalResult.enrolment.progressPercent).toBe(100);
      expect(finalResult.enrolment.status).toBe('completed');
      expect(finalResult.enrolment.completedAt).toBeDefined();

      const passport = await repository.getPassport('user_aarav');
      const achievement = passport.entries.find(
        (p) => p.sourceReferenceId === 'course_civic_obs_01' && p.category === 'achievement'
      );
      expect(achievement).toBeDefined();
      expect(achievement?.isVerified).toBe(true);
    });

    it('lesson completion is strictly idempotent (no duplicate credits or duplicate activities on repeated calls)', async () => {
      const initialCredits = await repository.getCredits('user_aarav');
      const initialTotal = initialCredits.reduce((s, c) => s + c.amount, 0);

      // First call
      await repository.completeLesson('user_aarav', 'les_obs_103');
      const creditsAfterFirst = (await repository.getCredits('user_aarav')).reduce((s, c) => s + c.amount, 0);
      expect(creditsAfterFirst).toBe(initialTotal + 1);

      // Duplicate call
      const duplicateResult = await repository.completeLesson('user_aarav', 'les_obs_103');
      expect(duplicateResult.creditTransaction).toBeUndefined();

      const creditsAfterSecond = (await repository.getCredits('user_aarav')).reduce((s, c) => s + c.amount, 0);
      expect(creditsAfterSecond).toBe(creditsAfterFirst);

      // Check activities
      const dashboard = await repository.getDashboard('user_aarav');
      const lessonActivities = dashboard.recentActivities.filter(
        (a) => a.type === 'lesson_completed' && a.referenceId === 'les_obs_103'
      );
      expect(lessonActivities.length).toBe(1);
    });
  });

  describe('Assignment Workflow: Drafts, Submissions, Revisions & Review', () => {
    it('saving an assignment draft does not award credits or notify teacher', async () => {
      const initialCredits = (await repository.getCredits('user_aarav')).reduce((s, c) => s + c.amount, 0);

      const draft = await repository.saveAssignmentDraft({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Draft interview notes with student pedestrians.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });

      expect(draft.status).toBe('draft');
      expect(draft.content).toContain('Draft interview notes');

      // Credits should not change
      const creditsAfterDraft = (await repository.getCredits('user_aarav')).reduce((s, c) => s + c.amount, 0);
      expect(creditsAfterDraft).toBe(initialCredits);

      // Query submissions
      const subs = await repository.getSubmissions('user_aarav', 'asg_obs_03');
      expect(subs.length).toBe(1);
      expect(subs[0].status).toBe('draft');
    });

    it('submitting an assignment awards +2 Contribution credit and notifies teacher', async () => {
      const initialCredits = (await repository.getCredits('user_aarav')).reduce((s, c) => s + c.amount, 0);

      const submission = await repository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Completed 5 peer interviews on Madhyam Marg crossing safety.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });

      expect(submission.status).toBe('submitted');

      // Credits should increase by 2 for assignment submission with Contribution dimension
      const credits = await repository.getCredits('user_aarav');
      const updatedCredits = credits.reduce((s, c) => s + c.amount, 0);
      expect(updatedCredits).toBe(initialCredits + 2);

      const subCredit = credits.find((c) => c.sourceType === 'assignment' && c.sourceId === 'asg_obs_03');
      expect(subCredit).toBeDefined();
      expect(subCredit?.dimension).toBe('Contribution');
      expect(subCredit?.amount).toBe(2);

      // Check dashboard and passport track pending credits before facilitator review (Package 07)
      const dashboard = await repository.getDashboard('user_aarav');
      expect(dashboard.creditSummary.pendingCredits).toBeGreaterThanOrEqual(2);

      const passport = await repository.getPassport('user_aarav');
      expect(passport.pendingCredits).toBeGreaterThanOrEqual(2);

      // Check teacher notification
      const teacherNotifs = await repository.getNotifications('user_kavita');
      const newSubNotif = teacherNotifs.find((n) => n.targetRoute.includes('asg_obs_03'));
      expect(newSubNotif).toBeDefined();
      expect(newSubNotif?.type).toBe('assignment');
    });

    it('resubmission does not award duplicate submission credits', async () => {
      const initialCredits = (await repository.getCredits('user_aarav')).reduce((s, c) => s + c.amount, 0);

      // First submit
      await repository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Initial notes.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });
      const creditsAfterFirst = (await repository.getCredits('user_aarav')).reduce((s, c) => s + c.amount, 0);
      expect(creditsAfterFirst).toBe(initialCredits + 2);

      // Second submit (same assignment)
      await repository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Updated notes with more details.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });
      const creditsAfterSecond = (await repository.getCredits('user_aarav')).reduce((s, c) => s + c.amount, 0);
      expect(creditsAfterSecond).toBe(creditsAfterFirst);
    });

    it('enforces valid repository transitions and prevents invalid mutations', async () => {
      // 1. Participant saves a draft
      const draft = await repository.saveAssignmentDraft({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Draft content for testing transitions.',
      });
      expect(draft.status).toBe('draft');

      // 2. Teacher cannot review a draft submission
      await repository.switchUser('user_kavita');
      await expect(
        repository.reviewSubmission({
          submissionId: draft.id,
          reviewerId: 'user_kavita',
          status: 'verified',
          teacherFeedback: 'Premature review attempt',
        })
      ).rejects.toThrow(/Cannot review a draft submission/i);

      // 3. Participant submits the draft
      await repository.switchUser('user_aarav');
      const submitted = await repository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Submitted content with required fieldwork details.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });
      expect(submitted.status).toBe('submitted');

      // 4. Teacher requests revision
      await repository.switchUser('user_kavita');
      const revised = await repository.reviewSubmission({
        submissionId: submitted.id,
        reviewerId: 'user_kavita',
        status: 'revision_requested',
        teacherFeedback: 'Please expand on junior student responses.',
      });
      expect(revised.status).toBe('revision_requested');

      // 5. Revision requested can be edited back to draft or resubmitted
      await repository.switchUser('user_aarav');
      const redraft = await repository.saveAssignmentDraft({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Editing after revision request into draft.',
      });
      expect(redraft.status).toBe('draft');

      const resubmitted = await repository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Final revised and expanded submission content.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });
      expect(resubmitted.status).toBe('submitted');

      // 6. Teacher verifies the submission
      await repository.switchUser('user_kavita');
      const verified = await repository.reviewSubmission({
        submissionId: submitted.id,
        reviewerId: 'user_kavita',
        status: 'verified',
        teacherFeedback: 'Well done! Fully verified.',
        score: 25,
      });
      expect(verified.status).toBe('verified');

      // 7. Verified submission cannot be mutated by saveAssignmentDraft or submitAssignment
      await repository.switchUser('user_aarav');
      await expect(
        repository.saveAssignmentDraft({
          assignmentId: 'asg_obs_03',
          userId: 'user_aarav',
          content: 'Attempt to modify verified submission into draft',
        })
      ).rejects.toThrow(/Cannot modify submission with status 'verified'/i);

      await expect(
        repository.submitAssignment({
          assignmentId: 'asg_obs_03',
          userId: 'user_aarav',
          content: 'Attempt to resubmit already verified submission',
        })
      ).rejects.toThrow(/Cannot modify submission with status 'verified'/i);

      // 8. Participant cannot self-review or self-reverse a reviewer decision
      await repository.switchUser('user_aarav');
      await expect(
        repository.reviewSubmission({
          submissionId: submitted.id,
          reviewerId: 'user_aarav',
          status: 'revision_requested',
          teacherFeedback: 'Unauthorized participant self-reversal',
        })
      ).rejects.toThrow(/only teachers may review submissions/i);

      // 9. Authorized fictional mentor can move accepted to revision_requested with attributed audit reconciliation
      await repository.switchUser('user_kavita');
      const reversedReview = await repository.reviewSubmission({
        submissionId: submitted.id,
        reviewerId: 'user_kavita',
        status: 'revision_requested',
        teacherFeedback: 'Substantive revision required on ward boundary data',
      });
      expect(reversedReview.status).toBe('revision_requested');

      // 10. Repeated review call with identical state is idempotent
      const duplicateReversal = await repository.reviewSubmission({
        submissionId: submitted.id,
        reviewerId: 'user_kavita',
        status: 'revision_requested',
        teacherFeedback: 'Substantive revision required on ward boundary data',
      });
      expect(duplicateReversal.status).toBe('revision_requested');

      await repository.switchUser('user_aarav');
    });

    it('full revision and verification cycle: submission -> revision request -> resubmit -> verify', async () => {
      // 1. Participant submits assignment with unverified evidence
      const newEv = await repository.addEvidence({
        ownerId: 'user_aarav',
        ownerName: 'Aarav Sharma',
        type: 'interview',
        title: 'Peer Safety Interview Log',
        description: '5 student interviews on walking route hazards.',
        source: 'Field Survey',
        visibility: 'assembly',
        verificationStatus: 'under_review',
        tags: ['Interview', 'Youth'],
      });

      const submission = await repository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Interviewed 5 peers about road crossings.',
        evidenceIds: [newEv.id],
      });
      expect(submission.status).toBe('submitted');

      // 2. Teacher requests revision
      await repository.switchUser('user_kavita');
      const revision = await repository.reviewSubmission({
        submissionId: submission.id,
        reviewerId: 'user_kavita',
        status: 'revision_requested',
        teacherFeedback: 'Please add specific quotes from younger students.',
      });
      expect(revision.status).toBe('revision_requested');
      expect(revision.teacherFeedback).toBe('Please add specific quotes from younger students.');

      // Check participant received revision notification
      const participantNotifs = await repository.getNotifications('user_aarav');
      const revNotif = participantNotifs.find((n) => n.title.includes('Revision Requested'));
      expect(revNotif).toBeDefined();

      // 3. Participant edits and resubmits
      await repository.switchUser('user_aarav');
      const resubmitted = await repository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Interviewed 5 peers with direct quotes from grades 6, 8, and 11 included.',
        evidenceIds: [newEv.id],
      });
      expect(resubmitted.status).toBe('submitted');
      expect(resubmitted.content).toContain('direct quotes');

      const creditsBeforeVerify = (await repository.getCredits('user_aarav')).reduce((s, c) => s + c.amount, 0);

      // 4. Teacher verifies submission
      await repository.switchUser('user_kavita');
      const verified = await repository.reviewSubmission({
        submissionId: submission.id,
        reviewerId: 'user_kavita',
        status: 'verified',
        teacherFeedback: 'Excellent revision! Verified for Civic Credits and Passport.',
        score: 25,
      });
      expect(verified.status).toBe('verified');
      expect(verified.score).toBe(25);

      // Attached evidence is now verified
      const updatedEvidence = await repository.getEvidence(newEv.id);
      expect(updatedEvidence?.verificationStatus).toBe('verified');

      // +1 Observation credit awarded for verified evidence
      const creditsAfterVerify = (await repository.getCredits('user_aarav')).reduce((s, c) => s + c.amount, 0);
      expect(creditsAfterVerify).toBe(creditsBeforeVerify + 1);

      // Passport entry created
      const passport = await repository.getPassport('user_aarav');
      const passportEntry = passport.entries.find((p) => p.sourceReferenceId === submission.id);
      expect(passportEntry).toBeDefined();
      expect(passportEntry?.isVerified).toBe(true);
      expect(passportEntry?.category).toBe('contribution');

      // Check user totalCredits derived from ledger
      const user = await repository.getUser('user_aarav');
      expect(user?.totalCredits).toBe(creditsAfterVerify);

      await repository.switchUser('user_aarav');
    });

    it('cross-persona visibility: teacher sees all student submissions while participant sees only their own', async () => {
      // Participant view for asg_obs_01
      const aaravSubs = await repository.getSubmissions('user_aarav', 'asg_obs_01');
      expect(aaravSubs.length).toBe(1);
      expect(aaravSubs[0].userId).toBe('user_aarav');

      // Teacher view for asg_obs_01 (sees Aarav, Priya, Meera submissions)
      await repository.switchUser('user_kavita');
      const allAsg1Subs = await repository.getSubmissions(undefined, 'asg_obs_01');
      expect(allAsg1Subs.length).toBeGreaterThanOrEqual(3);
      const studentIds = allAsg1Subs.map((s) => s.userId);
      expect(studentIds).toContain('user_aarav');
      expect(studentIds).toContain('user_priya');
      expect(studentIds).toContain('user_meera');

      await repository.switchUser('user_aarav');
    });
  });

  describe('Deliberation & Assemblies', () => {
    it('adding an assembly contribution adds 1 deliberation credit and activity entry', async () => {
      await repository.joinAssembly('assembly_jaipur_pedestrian_2026', 'user_aarav');
      const initialCredits = (await repository.getCredits('user_aarav')).reduce((s, c) => s + c.amount, 0);

      const contrib = await repository.addAssemblyContribution({
        assemblyId: 'assembly_jaipur_pedestrian_2026',
        userId: 'user_aarav',
        stage: 'think',
        type: 'question',
        text: 'How will stormwater drainage be incorporated beneath the tabletop crossing?',
      });

      expect(contrib.id).toBeDefined();
      expect(contrib.isSubstantive).toBe(true);

      const updatedCredits = (await repository.getCredits('user_aarav')).reduce((s, c) => s + c.amount, 0);
      expect(updatedCredits).toBe(initialCredits + 1);
    });
  });

  describe('Dashboard NextStep, Notifications & Demo Reset', () => {
    it('dashboard computes connected next step priority accurately', async () => {
      // 1. Initially Aarav has in-progress course CIV-101 lesson 3 (les_obs_103) as next step
      let dashboard = await repository.getDashboard('user_aarav');
      expect(dashboard.nextStep).toBeDefined();
      expect(dashboard.nextStep?.type).toBe('lesson');
      expect(dashboard.nextStep?.targetRoute).toBe('/learn/course_civic_obs_01/lesson/les_obs_103');

      // 2. If participant saves a draft assignment, nextStep points to draft resume
      await repository.saveAssignmentDraft({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Work in progress draft.',
      });
      dashboard = await repository.getDashboard('user_aarav');
      expect(dashboard.nextStep?.type).toBe('assignment');
      expect(dashboard.nextStep?.title).toContain('Resume Draft');
      expect(dashboard.nextStep?.targetRoute).toBe('/assignments/asg_obs_03/submit');

      // 3. Participant submits, and teacher requests revision -> nextStep elevates to Action Required revision
      await repository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Work in progress draft submitted for review.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });
      const sub = (await repository.getSubmissions('user_aarav', 'asg_obs_03'))[0];
      await repository.switchUser('user_kavita');
      await repository.reviewSubmission({
        submissionId: sub.id,
        reviewerId: 'user_kavita',
        status: 'revision_requested',
        teacherFeedback: 'Need further fieldwork evidence.',
      });
      await repository.switchUser('user_aarav');
      dashboard = await repository.getDashboard('user_aarav');
      expect(dashboard.nextStep?.type).toBe('revision');
      expect(dashboard.nextStep?.title).toContain('Revise:');
      expect(dashboard.nextStep?.badgeText).toBe('Action Required');
    });

    it('marking individual and all notifications as read persists correctly', async () => {
      const notifs = await repository.getNotifications('user_aarav');
      expect(notifs.length).toBeGreaterThan(0);

      const unreadNotif = notifs.find((n) => !n.isRead);
      if (unreadNotif) {
        await repository.markNotificationRead(unreadNotif.id);
        const refetched = (await repository.getNotifications('user_aarav')).find((n) => n.id === unreadNotif.id);
        expect(refetched?.isRead).toBe(true);
      }

      await repository.markAllNotificationsRead('user_aarav');
      const allReadNotifs = await repository.getNotifications('user_aarav');
      const hasUnread = allReadNotifs.some((n) => !n.isRead);
      expect(hasUnread).toBe(false);
    });

    it('resetDemo restores database back to fresh canonical seed data', async () => {
      // Modify data: complete lesson, add new draft
      await repository.completeLesson('user_aarav', 'les_obs_103');
      await repository.saveAssignmentDraft({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Temporary text that should be reset.',
      });

      // Reset
      await repository.resetDemo();

      // Check enrolment is back to 50%
      const enr = await repository.getEnrolment('user_aarav', 'course_civic_obs_01');
      expect(enr?.progressPercent).toBe(50);
      expect(enr?.completedLessonIds).toEqual(['les_obs_101', 'les_obs_102']);

      // Check asg_obs_03 draft is gone
      const subs = await repository.getSubmissions('user_aarav', 'asg_obs_03');
      expect(subs.length).toBe(0);
    });
  });
});


