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
      const initialCredits = await repository.getCredits('VSC-S-001');
      const initialTotal = initialCredits.reduce((s, c) => s + c.amount, 0);

      // Complete lesson 3 (les_obs_103) for course CIV-101 (which has 4 lessons; 2 already done)
      const result = await repository.completeLesson('VSC-S-001', 'les_obs_103');
      expect(result.enrolment.completedLessonIds).toContain('les_obs_103');
      expect(result.enrolment.progressPercent).toBe(75); // 3 of 4 lessons
      expect(result.enrolment.status).toBe('in_progress');

      const updatedCredits = await repository.getCredits('VSC-S-001');
      const updatedTotal = updatedCredits.reduce((s, c) => s + c.amount, 0);
      expect(updatedTotal).toBe(initialTotal + 1);

      // Check passport entry
      const passport = await repository.getPassport('VSC-S-001');
      const lessonEntry = passport.entries.find((p) => p.sourceReferenceId === 'les_obs_103');
      expect(lessonEntry).toBeDefined();
      expect(lessonEntry?.category).toBe('learning');
      expect(lessonEntry?.creditsAwarded).toBe(1);

      // Check notification
      const notifs = await repository.getNotifications('VSC-S-001');
      const notif = notifs.find((n) => n.targetRoute === '/passport/credits');
      expect(notif).toBeDefined();
      expect(notif?.type).toBe('credit');

      // Check dashboard reflection
      const dashboard = await repository.getDashboard('VSC-S-001');
      expect(dashboard.creditSummary.total).toBe(updatedTotal);
    });

    it('completing all lessons marks course completed and creates course achievement passport entry', async () => {
      // Complete lesson 3 and lesson 4 of CIV-101
      await repository.completeLesson('VSC-S-001', 'les_obs_103');
      const finalResult = await repository.completeLesson('VSC-S-001', 'les_obs_104');

      expect(finalResult.enrolment.progressPercent).toBe(100);
      expect(finalResult.enrolment.status).toBe('completed');
      expect(finalResult.enrolment.completedAt).toBeDefined();

      const passport = await repository.getPassport('VSC-S-001');
      const achievement = passport.entries.find(
        (p) => p.sourceReferenceId === 'course_civic_obs_01' && p.category === 'achievement'
      );
      expect(achievement).toBeDefined();
      expect(achievement?.isVerified).toBe(true);
    });

    it('lesson completion is strictly idempotent (no duplicate credits or duplicate activities on repeated calls)', async () => {
      const initialCredits = await repository.getCredits('VSC-S-001');
      const initialTotal = initialCredits.reduce((s, c) => s + c.amount, 0);

      // First call
      await repository.completeLesson('VSC-S-001', 'les_obs_103');
      const creditsAfterFirst = (await repository.getCredits('VSC-S-001')).reduce((s, c) => s + c.amount, 0);
      expect(creditsAfterFirst).toBe(initialTotal + 1);

      // Duplicate call
      const duplicateResult = await repository.completeLesson('VSC-S-001', 'les_obs_103');
      expect(duplicateResult.creditTransaction).toBeUndefined();

      const creditsAfterSecond = (await repository.getCredits('VSC-S-001')).reduce((s, c) => s + c.amount, 0);
      expect(creditsAfterSecond).toBe(creditsAfterFirst);

      // Check activities
      const dashboard = await repository.getDashboard('VSC-S-001');
      const lessonActivities = dashboard.recentActivities.filter(
        (a) => a.type === 'lesson_completed' && a.referenceId === 'les_obs_103'
      );
      expect(lessonActivities.length).toBe(1);
    });
  });

  describe('Assignment Workflow: Drafts, Submissions, Revisions & Review', () => {
    it('saving an assignment draft does not award credits or notify teacher', async () => {
      const initialCredits = (await repository.getCredits('VSC-S-001')).reduce((s, c) => s + c.amount, 0);

      const draft = await repository.saveAssignmentDraft({
        assignmentId: 'asg_obs_03',
        userId: 'VSC-S-001',
        content: 'Draft interview notes with student pedestrians.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });

      expect(draft.status).toBe('draft');
      expect(draft.content).toContain('Draft interview notes');

      // Credits should not change
      const creditsAfterDraft = (await repository.getCredits('VSC-S-001')).reduce((s, c) => s + c.amount, 0);
      expect(creditsAfterDraft).toBe(initialCredits);

      // Query submissions
      const subs = await repository.getSubmissions('VSC-S-001', 'asg_obs_03');
      expect(subs.length).toBe(1);
      expect(subs[0].status).toBe('draft');
    });

    it('submitting an assignment awards +2 Contribution credit and notifies teacher', async () => {
      const initialCredits = (await repository.getCredits('VSC-S-001')).reduce((s, c) => s + c.amount, 0);

      const submission = await repository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'VSC-S-001',
        content: 'Completed 5 peer interviews on Madhyam Marg crossing safety.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });

      expect(submission.status).toBe('submitted');

      // Credits should increase by 2 for assignment submission with Contribution dimension
      const credits = await repository.getCredits('VSC-S-001');
      const updatedCredits = credits.reduce((s, c) => s + c.amount, 0);
      expect(updatedCredits).toBe(initialCredits + 2);

      const subCredit = credits.find((c) => c.sourceType === 'assignment' && c.sourceId === 'asg_obs_03');
      expect(subCredit).toBeDefined();
      expect(subCredit?.dimension).toBe('Contribution');
      expect(subCredit?.amount).toBe(2);

      // Check dashboard and passport track pending credits before facilitator review (Package 07)
      const dashboard = await repository.getDashboard('VSC-S-001');
      expect(dashboard.creditSummary.pendingCredits).toBeGreaterThanOrEqual(2);

      const passport = await repository.getPassport('VSC-S-001');
      expect(passport.pendingCredits).toBeGreaterThanOrEqual(2);

      // Check teacher notification
      const teacherNotifs = await repository.getNotifications('VSC-T-001');
      const newSubNotif = teacherNotifs.find((n) => n.targetRoute.includes('asg_obs_03'));
      expect(newSubNotif).toBeDefined();
      expect(newSubNotif?.type).toBe('assignment');
    });

    it('resubmission does not award duplicate submission credits', async () => {
      const initialCredits = (await repository.getCredits('VSC-S-001')).reduce((s, c) => s + c.amount, 0);

      // First submit
      await repository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'VSC-S-001',
        content: 'Initial notes.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });
      const creditsAfterFirst = (await repository.getCredits('VSC-S-001')).reduce((s, c) => s + c.amount, 0);
      expect(creditsAfterFirst).toBe(initialCredits + 2);

      // Second submit (same assignment)
      await repository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'VSC-S-001',
        content: 'Updated notes with more details.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });
      const creditsAfterSecond = (await repository.getCredits('VSC-S-001')).reduce((s, c) => s + c.amount, 0);
      expect(creditsAfterSecond).toBe(creditsAfterFirst);
    });

    it('enforces valid repository transitions and prevents invalid mutations', async () => {
      // 1. Participant saves a draft
      const draft = await repository.saveAssignmentDraft({
        assignmentId: 'asg_obs_03',
        userId: 'VSC-S-001',
        content: 'Draft content for testing transitions.',
      });
      expect(draft.status).toBe('draft');

      // 2. Teacher cannot review a draft submission
      await repository.switchUser('VSC-T-001');
      await expect(
        repository.reviewSubmission({
          submissionId: draft.id,
          reviewerId: 'VSC-T-001',
          status: 'verified',
          teacherFeedback: 'Premature review attempt',
        })
      ).rejects.toThrow(/Cannot review a draft submission/i);

      // 3. Participant submits the draft
      await repository.switchUser('VSC-S-001');
      const submitted = await repository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'VSC-S-001',
        content: 'Submitted content with required fieldwork details.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });
      expect(submitted.status).toBe('submitted');

      // 4. Teacher requests revision
      await repository.switchUser('VSC-T-001');
      const revised = await repository.reviewSubmission({
        submissionId: submitted.id,
        reviewerId: 'VSC-T-001',
        status: 'revision_requested',
        teacherFeedback: 'Please expand on junior student responses.',
      });
      expect(revised.status).toBe('revision_requested');

      // 5. Revision requested can be edited back to draft or resubmitted
      await repository.switchUser('VSC-S-001');
      const redraft = await repository.saveAssignmentDraft({
        assignmentId: 'asg_obs_03',
        userId: 'VSC-S-001',
        content: 'Editing after revision request into draft.',
      });
      expect(redraft.status).toBe('draft');

      const resubmitted = await repository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'VSC-S-001',
        content: 'Final revised and expanded submission content.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });
      expect(resubmitted.status).toBe('submitted');

      // 6. Teacher verifies the submission
      await repository.switchUser('VSC-T-001');
      const verified = await repository.reviewSubmission({
        submissionId: submitted.id,
        reviewerId: 'VSC-T-001',
        status: 'verified',
        teacherFeedback: 'Well done! Fully verified.',
        score: 25,
      });
      expect(verified.status).toBe('verified');

      // 7. Verified submission cannot be mutated by saveAssignmentDraft or submitAssignment
      await repository.switchUser('VSC-S-001');
      await expect(
        repository.saveAssignmentDraft({
          assignmentId: 'asg_obs_03',
          userId: 'VSC-S-001',
          content: 'Attempt to modify verified submission into draft',
        })
      ).rejects.toThrow(/Cannot modify submission with status 'verified'/i);

      await expect(
        repository.submitAssignment({
          assignmentId: 'asg_obs_03',
          userId: 'VSC-S-001',
          content: 'Attempt to resubmit already verified submission',
        })
      ).rejects.toThrow(/Cannot modify submission with status 'verified'/i);

      // 8. Participant cannot self-review or self-reverse a reviewer decision
      await repository.switchUser('VSC-S-001');
      await expect(
        repository.reviewSubmission({
          submissionId: submitted.id,
          reviewerId: 'VSC-S-001',
          status: 'revision_requested',
          teacherFeedback: 'Unauthorized participant self-reversal',
        })
      ).rejects.toThrow(/only teachers may review submissions/i);

      // 9. Authorized fictional mentor can move accepted to revision_requested with attributed audit reconciliation
      await repository.switchUser('VSC-T-001');
      const reversedReview = await repository.reviewSubmission({
        submissionId: submitted.id,
        reviewerId: 'VSC-T-001',
        status: 'revision_requested',
        teacherFeedback: 'Substantive revision required on ward boundary data',
      });
      expect(reversedReview.status).toBe('revision_requested');

      // 10. Repeated review call with identical state is idempotent
      const duplicateReversal = await repository.reviewSubmission({
        submissionId: submitted.id,
        reviewerId: 'VSC-T-001',
        status: 'revision_requested',
        teacherFeedback: 'Substantive revision required on ward boundary data',
      });
      expect(duplicateReversal.status).toBe('revision_requested');

      await repository.switchUser('VSC-S-001');
    });

    it('full revision and verification cycle: submission -> revision request -> resubmit -> verify', async () => {
      // 1. Participant submits assignment with unverified evidence
      const newEv = await repository.addEvidence({
        ownerId: 'VSC-S-001',
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
        userId: 'VSC-S-001',
        content: 'Interviewed 5 peers about road crossings.',
        evidenceIds: [newEv.id],
      });
      expect(submission.status).toBe('submitted');

      // 2. Teacher requests revision
      await repository.switchUser('VSC-T-001');
      const revision = await repository.reviewSubmission({
        submissionId: submission.id,
        reviewerId: 'VSC-T-001',
        status: 'revision_requested',
        teacherFeedback: 'Please add specific quotes from younger students.',
      });
      expect(revision.status).toBe('revision_requested');
      expect(revision.teacherFeedback).toBe('Please add specific quotes from younger students.');

      // Check participant received revision notification
      const participantNotifs = await repository.getNotifications('VSC-S-001');
      const revNotif = participantNotifs.find((n) => n.title.includes('Revision Requested'));
      expect(revNotif).toBeDefined();

      // 3. Participant edits and resubmits
      await repository.switchUser('VSC-S-001');
      const resubmitted = await repository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'VSC-S-001',
        content: 'Interviewed 5 peers with direct quotes from grades 6, 8, and 11 included.',
        evidenceIds: [newEv.id],
      });
      expect(resubmitted.status).toBe('submitted');
      expect(resubmitted.content).toContain('direct quotes');

      const creditsBeforeVerify = (await repository.getCredits('VSC-S-001')).reduce((s, c) => s + c.amount, 0);

      // 4. Teacher verifies submission
      await repository.switchUser('VSC-T-001');
      const verified = await repository.reviewSubmission({
        submissionId: submission.id,
        reviewerId: 'VSC-T-001',
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
      const creditsAfterVerify = (await repository.getCredits('VSC-S-001')).reduce((s, c) => s + c.amount, 0);
      expect(creditsAfterVerify).toBe(creditsBeforeVerify + 1);

      // Passport entry created
      const passport = await repository.getPassport('VSC-S-001');
      const passportEntry = passport.entries.find((p) => p.sourceReferenceId === submission.id);
      expect(passportEntry).toBeDefined();
      expect(passportEntry?.isVerified).toBe(true);
      expect(passportEntry?.category).toBe('contribution');

      // Check user totalCredits derived from ledger
      const user = await repository.getUser('VSC-S-001');
      expect(user?.totalCredits).toBe(creditsAfterVerify);

      await repository.switchUser('VSC-S-001');
    });

    it('cross-persona visibility: teacher sees all student submissions while participant sees only their own', async () => {
      // Participant view for asg_obs_01
      const aaravSubs = await repository.getSubmissions('VSC-S-001', 'asg_obs_01');
      expect(aaravSubs.length).toBe(1);
      expect(aaravSubs[0].userId).toBe('VSC-S-001');

      // Teacher view for asg_obs_01 (sees Aarav, Priya, Meera submissions)
      await repository.switchUser('VSC-T-001');
      const allAsg1Subs = await repository.getSubmissions(undefined, 'asg_obs_01');
      expect(allAsg1Subs.length).toBeGreaterThanOrEqual(3);
      const studentIds = allAsg1Subs.map((s) => s.userId);
      expect(studentIds).toContain('VSC-S-001');
      expect(studentIds).toContain('VSC-S-002');
      expect(studentIds).toContain('VSC-S-003');

      await repository.switchUser('VSC-S-001');
    });
  });

  describe('Deliberation & Assemblies', () => {
    it('adding an assembly contribution adds 1 deliberation credit and activity entry', async () => {
      await repository.joinAssembly('assembly_jaipur_pedestrian_2026', 'VSC-S-001');
      const initialCredits = (await repository.getCredits('VSC-S-001')).reduce((s, c) => s + c.amount, 0);

      const contrib = await repository.addAssemblyContribution({
        assemblyId: 'assembly_jaipur_pedestrian_2026',
        userId: 'VSC-S-001',
        stage: 'think',
        type: 'question',
        text: 'How will stormwater drainage be incorporated beneath the tabletop crossing?',
      });

      expect(contrib.id).toBeDefined();
      expect(contrib.isSubstantive).toBe(true);

      const updatedCredits = (await repository.getCredits('VSC-S-001')).reduce((s, c) => s + c.amount, 0);
      expect(updatedCredits).toBe(initialCredits + 1);
    });
  });

  describe('Dashboard NextStep, Notifications & Demo Reset', () => {
    it('dashboard computes connected next step priority accurately', async () => {
      // 1. Initially Aarav has in-progress course CIV-101 lesson 3 (les_obs_103) as next step
      let dashboard = await repository.getDashboard('VSC-S-001');
      expect(dashboard.nextStep).toBeDefined();
      expect(dashboard.nextStep?.type).toBe('lesson');
      expect(dashboard.nextStep?.targetRoute).toBe('/learn/course_civic_obs_01/lesson/les_obs_103');

      // 2. If participant saves a draft assignment, nextStep points to draft resume
      await repository.saveAssignmentDraft({
        assignmentId: 'asg_obs_03',
        userId: 'VSC-S-001',
        content: 'Work in progress draft.',
      });
      dashboard = await repository.getDashboard('VSC-S-001');
      expect(dashboard.nextStep?.type).toBe('assignment');
      expect(dashboard.nextStep?.title).toContain('Resume Draft');
      expect(dashboard.nextStep?.targetRoute).toBe('/assignments/asg_obs_03/submit');

      // 3. Participant submits, and teacher requests revision -> nextStep elevates to Action Required revision
      await repository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'VSC-S-001',
        content: 'Work in progress draft submitted for review.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });
      const sub = (await repository.getSubmissions('VSC-S-001', 'asg_obs_03'))[0];
      await repository.switchUser('VSC-T-001');
      await repository.reviewSubmission({
        submissionId: sub.id,
        reviewerId: 'VSC-T-001',
        status: 'revision_requested',
        teacherFeedback: 'Need further fieldwork evidence.',
      });
      await repository.switchUser('VSC-S-001');
      dashboard = await repository.getDashboard('VSC-S-001');
      expect(dashboard.nextStep?.type).toBe('revision');
      expect(dashboard.nextStep?.title).toContain('Revise:');
      expect(dashboard.nextStep?.badgeText).toBe('Action Required');
    });

    it('marking individual and all notifications as read persists correctly', async () => {
      const notifs = await repository.getNotifications('VSC-S-001');
      expect(notifs.length).toBeGreaterThan(0);

      const unreadNotif = notifs.find((n) => !n.isRead);
      if (unreadNotif) {
        await repository.markNotificationRead(unreadNotif.id);
        const refetched = (await repository.getNotifications('VSC-S-001')).find((n) => n.id === unreadNotif.id);
        expect(refetched?.isRead).toBe(true);
      }

      await repository.markAllNotificationsRead('VSC-S-001');
      const allReadNotifs = await repository.getNotifications('VSC-S-001');
      const hasUnread = allReadNotifs.some((n) => !n.isRead);
      expect(hasUnread).toBe(false);
    });

    it('resetDemo restores database back to fresh canonical seed data', async () => {
      // Modify data: complete lesson, add new draft
      await repository.completeLesson('VSC-S-001', 'les_obs_103');
      await repository.saveAssignmentDraft({
        assignmentId: 'asg_obs_03',
        userId: 'VSC-S-001',
        content: 'Temporary text that should be reset.',
      });

      // Reset
      await repository.resetDemo();

      // Check enrolment is back to 50%
      const enr = await repository.getEnrolment('VSC-S-001', 'course_civic_obs_01');
      expect(enr?.progressPercent).toBe(50);
      expect(enr?.completedLessonIds).toEqual(['les_obs_101', 'les_obs_102']);

      // Check asg_obs_03 draft is gone
      const subs = await repository.getSubmissions('VSC-S-001', 'asg_obs_03');
      expect(subs.length).toBe(0);
    });
  });

  describe('Seat Override Permissions & Special Guest View-Only Boundaries', () => {
    it('rejects participant seat override attempts by unprivileged student or user_rohan bypass and requires actual authorized actor', async () => {
      const assemblyId = 'assembly_jaipur_pedestrian_2026';

      // 1. Participant Yash Rathod (VSC-S-005) attempts to override another participant's role -> Rejected
      await expect(
        repository.overrideAssemblyRole(
          assemblyId,
          'VSC-S-005',
          'VSC-S-004',
          'thinker',
          'Procedural role override attempt by unprivileged participant'
        )
      ).rejects.toThrow(/Unauthorized/i);

      // 2. Old user_rohan identifier attempt -> Rejected (bypass completely removed)
      await expect(
        repository.overrideAssemblyRole(
          assemblyId,
          'user_rohan',
          'VSC-S-004',
          'thinker',
          'Procedural role override attempt via old rohan bypass'
        )
      ).rejects.toThrow(/Unauthorized/i);

      // 3. Authorized actor: Teacher (VSC-T-001) or Platform Admin (JS-F-001) -> Succeeds
      const updatedRole = await repository.overrideAssemblyRole(
        assemblyId,
        'VSC-T-001',
        'VSC-S-004',
        'thinker',
        'Designated teacher reassignment'
      );
      expect(updatedRole).toBeDefined();
      expect(updatedRole.roleName.toLowerCase()).toBe('thinker');
    });

    it('enforces that Special Guest (VSC-G-001) is view-only across all mutation paths and cannot claim seats or mutate state', async () => {
      const specialGuestId = 'VSC-G-001';
      const assemblyId = 'assembly_jaipur_pedestrian_2026';

      // 1. Cannot override roles or mutate assembly
      await expect(
        repository.overrideAssemblyRole(
          assemblyId,
          specialGuestId,
          'VSC-S-002',
          'enabler',
          'Special guest attempt'
        )
      ).rejects.toThrow(/special_guest is a view-only role and cannot mutate state/i);

      // 2. Cannot be allocated or assigned a seat
      await expect(
        repository.overrideAssemblyRole(
          assemblyId,
          'VSC-T-001',
          specialGuestId,
          'enabler',
          'Attempt to seat special guest'
        )
      ).rejects.toThrow(/special_guest is a view-only role and cannot claim seats/i);

      // 3. Cannot reserve event seat via rsvpEvent
      await expect(
        repository.rsvpEvent('evt_jaipur_assembly_01', specialGuestId)
      ).rejects.toThrow(/special_guest is a view-only role and cannot claim seats/i);

      // 4. Cannot join assembly
      await expect(
        repository.joinAssembly(assemblyId, specialGuestId)
      ).rejects.toThrow(/special_guest is a view-only role and cannot claim seats/i);

      // 5. Cannot cast vote on proposition
      await expect(
        repository.recordPropositionResponse({
          propositionId: 'prop_jaipur_pedestrian_01',
          userId: specialGuestId,
          responseState: 'Support',
        })
      ).rejects.toThrow(/special_guest is a view-only role and cannot mutate state/i);

      // 6. Cannot create workspace post/action
      await expect(
        repository.createWorkspaceAction({
          workspaceId: 'ws_jaipur_school_safety',
          authorId: specialGuestId,
          actionType: 'team_note',
          title: 'Guest Note',
          content: 'Observational note',
        })
      ).rejects.toThrow(/special_guest is a view-only role and cannot mutate state/i);

      // 7. Cannot submit assignment
      await repository.switchUser(specialGuestId);
      await expect(
        repository.submitAssignment({
          assignmentId: 'asg_obs_01',
          userId: specialGuestId,
          content: 'Guest submission attempt',
        })
      ).rejects.toThrow(/special_guest is a view-only role and cannot mutate state/i);

      // 8. Cannot request credit appeal
      await expect(
        repository.requestCreditAppeal({
          userId: specialGuestId,
          targetType: 'credit',
          targetId: 'cr_01',
          reason: 'Substantive inquiry from guest regarding zero credits',
        })
      ).rejects.toThrow(/special_guest is a view-only role and cannot mutate state/i);
    });
  });
});


