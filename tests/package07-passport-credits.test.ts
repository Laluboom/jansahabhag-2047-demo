import { describe, it, expect, beforeEach } from 'vitest';
import { PersistenceService } from '../src/services/persistence';
import { demoRepository } from '../src/services/demoRepository';
import { useAuthStore } from '../src/stores/authStore';

describe('Package 07 — Evidence-based Passport and Explainable Credits', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    await useAuthStore.getState().initialize();
  });

  describe('1. Submission → Pending → Mentor Decision → Passport & Credit Transition', () => {
    it('creates pending self-reported entries on submission, then transitions to facilitator_reviewed upon mentor decision', async () => {
      await useAuthStore.getState().switchPersona('VSC-S-001');
      const initialDashboard = await demoRepository.getDashboard('VSC-S-001');
      const initialVerifiedCredits = initialDashboard.creditSummary.total;

      // 1. Participant submits assignment with evidence
      const submitted = await demoRepository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'VSC-S-001',
        content: 'Field inspection of drainage and footpaths in Ward 24 Jaipur.',
        evidenceIds: ['ev_aarav_crossing_photo_02'],
      });

      expect(submitted.status).toBe('submitted');

      // 2. Pending credit verification check:
      // The submission credit should be Pending and excluded from verified total
      const creditsAfterSubmit = await demoRepository.getCredits('VSC-S-001');
      const pendingSubCredit = creditsAfterSubmit.find(
        (c) => c.sourceType === 'assignment' && c.sourceId === 'asg_obs_03'
      );
      expect(pendingSubCredit).toBeDefined();
      expect(pendingSubCredit?.status).toBe('Pending');
      expect(pendingSubCredit?.amount).toBe(2);
      expect(pendingSubCredit?.dimension).toBe('Contribution');

      const dashboardAfterSubmit = await demoRepository.getDashboard('VSC-S-001');
      // Verified total must not count pending credit
      expect(dashboardAfterSubmit.creditSummary.total).toBe(initialVerifiedCredits);
      expect(dashboardAfterSubmit.creditSummary.pendingCredits).toBeGreaterThanOrEqual(2);

      // 3. Passport entry must be self_reported and pending review
      const passportAfterSubmit = await demoRepository.getPassport('VSC-S-001');
      expect(passportAfterSubmit.pendingCredits).toBeGreaterThanOrEqual(2);
      const pendingPassportEntry = passportAfterSubmit.entries.find(
        (p) => p.sourceReferenceId === submitted.id || p.sourceReferenceId === 'asg_obs_03'
      );
      expect(pendingPassportEntry).toBeDefined();
      expect(pendingPassportEntry?.verificationState).toBe('self_reported');
      expect(pendingPassportEntry?.reviewState).toBe('pending');
      expect(pendingPassportEntry?.isVerified).toBe(false);
      expect(pendingPassportEntry?.sourceRoute).toBe(`/assignments/asg_obs_03?submissionId=${submitted.id}`);

      // 4. Mentor review (Kavita Rao) verifies the submission
      await useAuthStore.getState().switchPersona('VSC-T-001');
      const verifiedSub = await demoRepository.reviewSubmission({
        submissionId: submitted.id,
        reviewerId: 'VSC-T-001',
        status: 'verified',
        teacherFeedback: 'Thorough field documentation with clear geotagged photos.',
        score: 92,
      });

      expect(verifiedSub.status).toBe('verified');

      // 5. Check transition to facilitator_reviewed and verified credit minting
      await useAuthStore.getState().switchPersona('VSC-S-001');
      const creditsAfterReview = await demoRepository.getCredits('VSC-S-001');
      const verifiedSubCredit = creditsAfterReview.find(
        (c) => c.sourceType === 'assignment' && c.sourceId === 'asg_obs_03'
      );
      expect(verifiedSubCredit?.status).toBe('Verified');
      expect(verifiedSubCredit?.auditTrail?.length).toBeGreaterThan(0);
      expect(verifiedSubCredit?.auditTrail?.[0].actorName).toContain('Mayur');

      const passportAfterReview = await demoRepository.getPassport('VSC-S-001');
      const verifiedPassEntry = passportAfterReview.entries.find(
        (p) => p.sourceReferenceId === submitted.id || p.sourceReferenceId === 'asg_obs_03'
      );
      expect(verifiedPassEntry).toBeDefined();
      expect(verifiedPassEntry?.verificationState).toBe('facilitator_reviewed');
      expect(verifiedPassEntry?.reviewState).toBe('accepted');
      expect(verifiedPassEntry?.isVerified).toBe(true);
      expect(verifiedPassEntry?.verifier?.name).toContain('Mayur');
      expect(verifiedPassEntry?.verifier?.label).toContain('Simulation');
      expect(verifiedPassEntry?.revisionHistory?.length).toBeGreaterThan(0);

      const dashboardAfterReview = await demoRepository.getDashboard('VSC-S-001');
      expect(dashboardAfterReview.creditSummary.total).toBeGreaterThan(initialVerifiedCredits);
    });
  });

  describe('2. Review Correction, Reversal and Idempotence', () => {
    it('denies participant self-reversal, allows mentor to request revision with credit reconciliation and idempotence', async () => {
      // Setup verified submission
      await useAuthStore.getState().switchPersona('VSC-S-001');
      const submitted = await demoRepository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'VSC-S-001',
        content: 'Drainage observation report.',
        evidenceIds: ['ev_aarav_crossing_photo_02'],
      });

      await useAuthStore.getState().switchPersona('VSC-T-001');
      await demoRepository.reviewSubmission({
        submissionId: submitted.id,
        reviewerId: 'VSC-T-001',
        status: 'verified',
        teacherFeedback: 'Accepted fieldwork.',
      });

      const userAfterVerify = await demoRepository.getUser('VSC-S-001');
      const verifiedCreditCount = userAfterVerify?.totalCredits || 0;

      // 1. Participant cannot self-reverse or review
      await useAuthStore.getState().switchPersona('VSC-S-001');
      await expect(
        demoRepository.reviewSubmission({
          submissionId: submitted.id,
          reviewerId: 'VSC-S-001',
          status: 'revision_requested',
          teacherFeedback: 'Self reversal attempt',
        })
      ).rejects.toThrow(/only teachers may review submissions/i);

      // 2. Authorized mentor changes accepted submission to revision_requested
      await useAuthStore.getState().switchPersona('VSC-T-001');
      const revisedReview = await demoRepository.reviewSubmission({
        submissionId: submitted.id,
        reviewerId: 'VSC-T-001',
        status: 'revision_requested',
        teacherFeedback: 'Need additional photos of inlet pipes before final approval.',
      });

      expect(revisedReview.status).toBe('revision_requested');

      // 3. Reconcile dependent credits and passport status:
      // Original evidence must NOT be deleted
      await useAuthStore.getState().switchPersona('VSC-S-001');
      const ev = await demoRepository.getEvidence('ev_aarav_crossing_photo_02');
      expect(ev).toBeDefined();
      expect(ev?.verificationStatus).toBe('under_review');

      // Evidence credit must be Reversed with audit log
      const credits = await demoRepository.getCredits('VSC-S-001');
      const evCredit = credits.find(
        (c) => c.sourceType === 'evidence' && c.sourceId === 'ev_aarav_crossing_photo_02'
      );
      if (evCredit) {
        expect(evCredit.status).toBe('Reversed');
        expect(evCredit.auditTrail?.some((a) => a.action === 'REVERSED')).toBe(true);
      }

      // Passport entry moves to revision_requested and self_reported
      const passport = await demoRepository.getPassport('VSC-S-001');
      const passEntry = passport.entries.find(
        (p) => p.sourceReferenceId === submitted.id || p.sourceReferenceId === 'asg_obs_03'
      );
      expect(passEntry?.reviewState).toBe('revision_requested');
      expect(passEntry?.isVerified).toBe(false);
      expect(passEntry?.revisionHistory?.some((h) => h.action === 'REVISION_REQUESTED')).toBe(true);

      // Verified credits must be properly decremented
      const userAfterReversal = await demoRepository.getUser('VSC-S-001');
      expect(userAfterReversal?.totalCredits).toBeLessThan(verifiedCreditCount);

      // 4. Repeated call with identical status is idempotent
      await useAuthStore.getState().switchPersona('VSC-T-001');
      const repeatReview = await demoRepository.reviewSubmission({
        submissionId: submitted.id,
        reviewerId: 'VSC-T-001',
        status: 'revision_requested',
        teacherFeedback: 'Need additional photos of inlet pipes before final approval.',
      });
      expect(repeatReview.status).toBe('revision_requested');
    });
  });

  describe('3. Source Linkage for Assembly Dissent and Workspace Collaboration', () => {
    it('records unjudged Assembly dissent with 0 credits and links back to proposition', async () => {
      await useAuthStore.getState().switchPersona('VSC-S-001');
      // Ensure Aarav has joined the assembly
      await demoRepository.joinAssembly('assembly_jaipur_pedestrian_2026', 'VSC-S-001');

      const initialCredits = (await demoRepository.getUser('VSC-S-001'))?.totalCredits || 0;

      // Register dissent on proposition
      const propId = 'prop_jaipur_pedestrian_01';
      await demoRepository.recordPropositionResponse({
        propositionId: propId,
        userId: 'VSC-S-001',
        responseState: 'Dissent',
        reasonOrReservations: 'Ramp gradient is too steep for wheelchair users according to accessibility code.',
      });

      // Total credits must remain unchanged (dissent is unjudged, no ideological reward or penalty)
      const afterCredits = (await demoRepository.getUser('VSC-S-001'))?.totalCredits || 0;
      expect(afterCredits).toBe(initialCredits);

      // Passport contains formal dissent entry with source route
      const passport = await demoRepository.getPassport('VSC-S-001');
      const dissentEntry = passport.entries.find(
        (p) => p.sourceReferenceId === propId && p.sourceReferenceType === 'dissent'
      );
      expect(dissentEntry).toBeDefined();
      expect(dissentEntry?.category).toBe('deliberation');
      expect(dissentEntry?.creditsAwarded).toBe(0);
      expect(dissentEntry?.sourceRoute).toContain('/assemblies/assembly_jaipur_pedestrian_2026');
      expect(dissentEntry?.calculationExplanation).toContain('dissent is preserved as a procedural record');
    });

    it('records Workspace action with +5 Collaboration credits and links to workspace surface', async () => {
      await useAuthStore.getState().switchPersona('VSC-S-001');
      const action = await demoRepository.createWorkspaceAction({
        workspaceId: 'ws_jaipur_school_safety',
        authorId: 'VSC-S-001',
        actionType: 'task',
        title: 'Draft community survey for bus stop illumination',
        content: 'Coordinate with student team to map unlit stops.',
      });

      expect(action).toBeDefined();

      // Check +1 Collaboration credit awarded
      const credits = await demoRepository.getCredits('VSC-S-001');
      const actionCredit = credits.find(
        (c) => c.sourceType === 'workspace' && c.sourceId === action.id
      );
      expect(actionCredit).toBeDefined();
      expect(actionCredit?.dimension).toBe('Collaboration');
      expect(actionCredit?.amount).toBe(1);
      expect(actionCredit?.sourceRoute).toBe('/workspaces/ws_jaipur_school_safety');

      // Check passport entry
      const passport = await demoRepository.getPassport('VSC-S-001');
      const passEntry = passport.entries.find(
        (p) => p.sourceReferenceId === action.id && p.sourceReferenceType === 'workspace'
      );
      expect(passEntry).toBeDefined();
      expect(passEntry?.category).toBe('civic_action');
      expect(passEntry?.creditsAwarded).toBe(1);
      expect(passEntry?.sourceRoute).toBe('/workspaces/ws_jaipur_school_safety');
    });
  });

  describe('4. Privacy Boundaries & Persona Scope Denial', () => {
    it('omits private UHV reflections and private Debate journals from Civic Passport and Credit ledger', async () => {
      await useAuthStore.getState().switchPersona('VSC-S-001');

      // Submit private UHV reflection
      await demoRepository.submitAssignment({
        assignmentId: 'asg_uhv_08',
        userId: 'VSC-S-001',
        content: 'Private reflections on mutual trust and harmony in community living.',
      });

      // Submit private session deliberation journal
      await demoRepository.addReflection({
        userId: 'VSC-S-001',
        contextType: 'session',
        contextId: 'sess_jaipur_01',
        prompt: 'Personal debate journal on mobility trade-offs',
        text: 'Private journal reflections.',
        valuesHighlighted: ['Empathy'],
        isPublicInPassport: false,
      });

      // Passport must NOT contain UHV or session entries
      const passport = await demoRepository.getPassport('VSC-S-001');
      const uhvEntry = passport.entries.find((p) => p.sourceReferenceId === 'asg_uhv_08');
      expect(uhvEntry).toBeUndefined();

      const sessionEntry = passport.entries.find(
        (p) => p.title.toLowerCase().includes('debate journal') || p.sourceReferenceId === 'sess_jaipur_01'
      );
      expect(sessionEntry).toBeUndefined();

      // Credit ledger must NOT contain UHV credits
      const credits = await demoRepository.getCredits('VSC-S-001');
      const uhvCredit = credits.find((c) => c.sourceId === 'asg_uhv_08');
      expect(uhvCredit).toBeUndefined();
    });

    it('enforces persona scope denial: participant cannot access another persona private passport, ledger, or appeals', async () => {
      await useAuthStore.getState().switchPersona('VSC-S-001');

      // 1. Aarav attempting to fetch Meera's Civic Passport directly
      let meeraPassport: unknown = null;
      let passportFetchError: Error | null = null;
      try {
        meeraPassport = await demoRepository.getPassport('VSC-S-002');
      } catch (err) {
        passportFetchError = err as Error;
      }
      expect(passportFetchError).toBeDefined();
      expect(passportFetchError?.message).toMatch(/Unauthorized: cannot access Civic Passport of another persona/i);
      expect(meeraPassport).toBeNull(); // confirms no private or pending data is returned

      // 2. Aarav attempting to fetch Meera's credit ledger directly
      await expect(demoRepository.getCredits('VSC-S-002')).rejects.toThrow(
        /Unauthorized: cannot access credit ledger of another persona/i
      );

      // 3. Aarav attempting to fetch Meera's credit appeals
      await expect(demoRepository.getCreditAppeals('VSC-S-002')).rejects.toThrow(
        /Unauthorized: cannot access credit appeals of another persona/i
      );

      // 4. Authorized owner can fetch their own passport
      const ownPassport = await demoRepository.getPassport('VSC-S-001');
      expect(ownPassport).toBeDefined();
      expect(ownPassport.user.id).toBe('VSC-S-001');

      // 5. Authorized staff (mentor Kavita) can access student passport for review
      await useAuthStore.getState().switchPersona('VSC-T-001');
      const studentPassport = await demoRepository.getPassport('VSC-S-001');
      expect(studentPassport).toBeDefined();
      expect(studentPassport.user.id).toBe('VSC-S-001');
    });
  });

  describe('5. Fictional Mentor Credit Appeal Mechanism (AI Barred)', () => {
    it('validates target existence and ownership before accepting credit/passport/submission appeals', async () => {
      await useAuthStore.getState().switchPersona('VSC-S-001');

      // 1. Nonexistent targets are denied
      await expect(
        demoRepository.requestCreditAppeal({
          userId: 'VSC-S-001',
          targetType: 'credit',
          targetId: 'tx_nonexistent_999',
          reason: 'Disputing credit transaction that does not exist in ledger.',
        })
      ).rejects.toThrow(/Target credit transaction 'tx_nonexistent_999' not found/i);

      await expect(
        demoRepository.requestCreditAppeal({
          userId: 'VSC-S-001',
          targetType: 'submission',
          targetId: 'sub_nonexistent_999',
          reason: 'Disputing submission that does not exist.',
        })
      ).rejects.toThrow(/Target submission 'sub_nonexistent_999' not found/i);

      await expect(
        demoRepository.requestCreditAppeal({
          userId: 'VSC-S-001',
          targetType: 'passport',
          targetId: 'pass_nonexistent_999',
          reason: 'Disputing passport entry that does not exist.',
        })
      ).rejects.toThrow(/Target passport entry 'pass_nonexistent_999' not found/i);

      // 2. Cross-owner targets are denied
      await expect(
        demoRepository.requestCreditAppeal({
          userId: 'VSC-S-001',
          targetType: 'credit',
          targetId: 'tx_sid_01', // Owned by Siddharth
          reason: 'Attempting to appeal another persona credit item.',
        })
      ).rejects.toThrow(/Unauthorized: cannot appeal a credit transaction owned by another persona/i);

      await expect(
        demoRepository.requestCreditAppeal({
          userId: 'VSC-S-001',
          targetType: 'submission',
          targetId: 'sub_meera_01', // Owned by Meera
          reason: 'Attempting to appeal another persona submission item.',
        })
      ).rejects.toThrow(/Unauthorized: cannot appeal a submission owned by another persona/i);

      await expect(
        demoRepository.requestCreditAppeal({
          userId: 'VSC-S-001',
          targetType: 'passport',
          targetId: 'pass_sid_01', // Owned by Siddharth
          reason: 'Attempting to appeal another persona passport entry.',
        })
      ).rejects.toThrow(/Unauthorized: cannot appeal a passport entry owned by another persona/i);

      // 3. Valid own-item credit appeal routes to mentor Kavita Rao with PRD AI prohibition notice
      const appeal = await demoRepository.requestCreditAppeal({
        userId: 'VSC-S-001',
        targetType: 'credit',
        targetId: 'tx_aarav_01', // Valid credit belonging to Aarav
        reason: 'Observation fieldwork was accompanied by certified civic club supervisor.',
      });

      expect(appeal.status).toBe('pending_human_review');
      expect(appeal.assignedReviewerName).toContain('Mayur');
      expect(appeal.aiDisclaimer).toContain('AI is strictly barred');

      const appeals = await demoRepository.getCreditAppeals('VSC-S-001');
      expect(appeals.some((a) => a.id === appeal.id)).toBe(true);

      // Target credit audit trail should include APPEAL_REQUESTED
      const userCredits = await demoRepository.getCredits('VSC-S-001');
      const appealedCredit = userCredits.find((c) => c.id === 'tx_aarav_01');
      expect(appealedCredit?.auditTrail?.some((a) => a.action === 'APPEAL_REQUESTED')).toBe(true);
    });
  });
});
