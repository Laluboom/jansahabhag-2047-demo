import { describe, it, expect, beforeEach } from 'vitest';
import { LocalDemoRepository } from '../src/services/demoRepository';
import { PersistenceService } from '../src/services/persistence';
import { runMigrations } from '../src/services/migrations';
import { DemoDatabase } from '../src/types/domain';

describe('Civic Passport Demo Credit Model', () => {
  let repository: LocalDemoRepository;

  beforeEach(() => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    repository = new LocalDemoRepository();
  });

  describe('1. Starting Balance for Newly Created and Seeded Participants', () => {
    it('creates a newly onboarded participant with exactly 10 starting credits, 1 ledger transaction, and 1 passport entry', async () => {
      const newParticipant = await repository.createParticipant({
        name: 'Tara Verma',
        email: 'tara.verma@example.edu.in',
        institutionId: 'inst_navchetna_jaipur',
        institutionName: 'Government Senior Secondary School Navchetna, Jaipur',
        age: 18,
        location: 'Jaipur, Rajasthan',
      });

      expect(newParticipant.id).toBeDefined();
      expect(newParticipant.totalCredits).toBe(10);

      // Switch to new participant to inspect private ledger and passport
      await repository.switchUser(newParticipant.id);

      // Ledger check: exactly 1 transaction
      const credits = await repository.getCredits(newParticipant.id);
      expect(credits).toHaveLength(1);
      const initTx = credits[0];
      expect(initTx.amount).toBe(10);
      expect(initTx.dimension).toBe('Contribution');
      expect(initTx.status).toBe('Verified');
      expect(initTx.sourceType).toBe('starting_balance');
      expect(initTx.reason).toBe('Starting balance: 10');

      // Passport check: matching starting balance entry
      const passport = await repository.getPassport(newParticipant.id);
      expect(passport.totalCredits).toBe(10);
      expect(passport.pendingCredits).toBe(0);
      expect(passport.entries).toHaveLength(1);
      const passEntry = passport.entries[0];
      expect(passEntry.creditsAwarded).toBe(10);
      expect(passEntry.sourceReferenceType).toBe('starting_balance');
      expect(passEntry.isVerified).toBe(true);
      expect(passEntry.sourceRoute).toBe('/passport/credits');
    });

    it('seeded participants display 10 starting credits plus their earned activity credits (not forced to 10)', async () => {
      // Aarav: 10 starting + 1 (les_obs_101) + 2 (asg_obs_01) + 1 (les_obs_102) + 2 (proj_navchetna_crosswalk_01) = 16
      const aarav = await repository.getUser('user_aarav');
      expect(aarav?.totalCredits).toBe(16);

      const aaravCredits = await repository.getCredits('user_aarav');
      const aaravVerifiedTotal = aaravCredits
        .filter((c) => c.status === 'Verified')
        .reduce((sum, c) => sum + c.amount, 0);
      expect(aaravVerifiedTotal).toBe(16);

      // Starting balance transaction exists for Aarav
      const aaravInitTx = aaravCredits.find((c) => c.sourceType === 'starting_balance');
      expect(aaravInitTx).toBeDefined();
      expect(aaravInitTx?.amount).toBe(10);
      expect(aaravInitTx?.reason).toBe('Starting balance: 10');

      // Meera has earned credits on top of 10 (18)
      const meera = await repository.getUser('user_meera');
      expect(meera?.totalCredits).toBe(18);

      // Vikram has earned credits on top of 10 (13)
      const vikram = await repository.getUser('user_vikram');
      expect(vikram?.totalCredits).toBe(13);

      // Kabir has earned credits on top of 10 (13)
      const kabir = await repository.getUser('user_kabir');
      expect(kabir?.totalCredits).toBe(13);

      // Diya Patel has no completed activity credits, displays 10
      const diya = await repository.getUser('user_diya');
      expect(diya?.totalCredits).toBe(10);
    });

    it('ensures starting balance transaction is strictly idempotent and never duplicated', async () => {
      const aaravCreditsBefore = await repository.getCredits('user_aarav');
      const initTxsBefore = aaravCreditsBefore.filter((c) => c.sourceType === 'starting_balance');
      expect(initTxsBefore).toHaveLength(1);

      // Running normalization/migration again
      const db = PersistenceService.loadDatabase();
      const migrated = runMigrations(db);
      PersistenceService.saveDatabase(migrated);

      const aaravCreditsAfter = await repository.getCredits('user_aarav');
      const initTxsAfter = aaravCreditsAfter.filter((c) => c.sourceType === 'starting_balance');
      expect(initTxsAfter).toHaveLength(1);
      expect(aaravCreditsAfter.length).toBe(aaravCreditsBefore.length);
    });
  });

  describe('2. Reward Schedule: 1 or 2 Credits for Eligible Activities', () => {
    it('awards exactly 1 Learning credit on completing a lesson', async () => {
      const initialCredits = (await repository.getCredits('user_aarav')).reduce((s, c) => s + c.amount, 0);

      const result = await repository.completeLesson('user_aarav', 'les_obs_103');
      expect(result.creditTransaction?.amount).toBe(1);
      expect(result.creditTransaction?.dimension).toBe('Learning');

      const user = await repository.getUser('user_aarav');
      expect(user?.totalCredits).toBe(initialCredits + 1);

      // Passport entry has 1 credit awarded
      const passport = await repository.getPassport('user_aarav');
      const entry = passport.entries.find((e) => e.sourceReferenceId === 'les_obs_103');
      expect(entry?.creditsAwarded).toBe(1);
      expect(entry?.calculationExplanation).toContain('1 credit per completed Civic Academy lesson');
    });

    it('awards exactly 2 Contribution credits (Pending) on assignment submission', async () => {
      const initialVerified = (await repository.getUser('user_aarav'))?.totalCredits || 0;

      const sub = await repository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Field observations on traffic speed and crossing safety.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });

      // Total verified credits does NOT increase yet
      const user = await repository.getUser('user_aarav');
      expect(user?.totalCredits).toBe(initialVerified);

      // Pending credit transaction created with 2 credits
      const credits = await repository.getCredits('user_aarav');
      const subTx = credits.find((c) => c.sourceType === 'assignment' && c.sourceId === 'asg_obs_03');
      expect(subTx).toBeDefined();
      expect(subTx?.status).toBe('Pending');
      expect(subTx?.amount).toBe(2);
      expect(subTx?.dimension).toBe('Contribution');

      // Passport reflects 2 credits pending
      const passport = await repository.getPassport('user_aarav');
      const passEntry = passport.entries.find((e) => e.sourceReferenceId === sub.id);
      expect(passEntry?.creditsAwarded).toBe(2);
      expect(passEntry?.isVerified).toBe(false);
      expect(passEntry?.reviewState).toBe('pending');
    });

    it('awards exactly 1 Observation credit per verified field evidence upon mentor review', async () => {
      // Create new evidence
      const newEv = await repository.addEvidence({
        ownerId: 'user_aarav',
        ownerName: 'Aarav Sharma',
        type: 'image',
        title: 'Intersection speed table test photo',
        description: 'Evidence photo of the speed table installation.',
        source: 'Field Survey',
        visibility: 'assembly',
        verificationStatus: 'under_review',
        tags: ['Safety', 'Crossing'],
        mediaUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800',
        metadata: { locationName: 'Madhyam Marg Junction, Jaipur' },
      });

      const sub = await repository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Observation report with new evidence.',
        evidenceIds: [newEv.id],
      });

      const initialVerified = (await repository.getUser('user_aarav'))?.totalCredits || 0;

      // Mentor verifies
      await repository.switchUser('user_kavita');
      await repository.reviewSubmission({
        submissionId: sub.id,
        reviewerId: 'user_kavita',
        status: 'verified',
        teacherFeedback: 'Verified with high quality evidence.',
      });

      // User verified credits increase by 3 (+2 submission Contribution, +1 evidence Observation)
      const user = await repository.getUser('user_aarav');
      expect(user?.totalCredits).toBe(initialVerified + 3);

      await repository.switchUser('user_aarav');
      const credits = await repository.getCredits('user_aarav');
      const evTx = credits.find((c) => c.sourceType === 'evidence' && c.sourceId === newEv.id);
      expect(evTx).toBeDefined();
      expect(evTx?.status).toBe('Verified');
      expect(evTx?.amount).toBe(1);
      expect(evTx?.dimension).toBe('Observation');
    });

    it('awards exactly 2 Deliberation credits on joining a youth assembly', async () => {
      const initialCredits = (await repository.getUser('user_aarav'))?.totalCredits || 0;

      const result = await repository.joinAssembly('assembly_jaipur_pedestrian_2026', 'user_aarav');
      expect(result.creditTransaction?.amount).toBe(2);
      expect(result.creditTransaction?.dimension).toBe('Deliberation');

      const user = await repository.getUser('user_aarav');
      expect(user?.totalCredits).toBe(initialCredits + 2);

      const passport = await repository.getPassport('user_aarav');
      const entry = passport.entries.find((e) => e.sourceReferenceId === 'assembly_jaipur_pedestrian_2026');
      expect(entry?.creditsAwarded).toBe(2);
    });

    it('awards exactly 1 Deliberation credit on adding a substantive assembly contribution', async () => {
      await repository.joinAssembly('assembly_jaipur_pedestrian_2026', 'user_aarav');
      const initialCredits = (await repository.getUser('user_aarav'))?.totalCredits || 0;

      const contrib = await repository.addAssemblyContribution({
        assemblyId: 'assembly_jaipur_pedestrian_2026',
        userId: 'user_aarav',
        stage: 'think',
        type: 'question',
        text: 'How will emergency ambulance access be safeguarded during peak pedestrian hours?',
      });

      const user = await repository.getUser('user_aarav');
      expect(user?.totalCredits).toBe(initialCredits + 1);

      const credits = await repository.getCredits('user_aarav');
      const contribTx = credits.find((c) => c.sourceId === contrib.id);
      expect(contribTx?.amount).toBe(1);
      expect(contribTx?.dimension).toBe('Deliberation');
    });

    it('awards exactly 1 Collaboration credit on creating a workspace action', async () => {
      const initialCredits = (await repository.getUser('user_aarav'))?.totalCredits || 0;

      const action = await repository.createWorkspaceAction({
        workspaceId: 'ws_jaipur_school_safety',
        authorId: 'user_aarav',
        actionType: 'task',
        title: 'Conduct secondary gate pedestrian speed survey',
        content: 'Survey pedestrian approach speeds at the secondary school entrance.',
      });

      const user = await repository.getUser('user_aarav');
      expect(user?.totalCredits).toBe(initialCredits + 1);

      const credits = await repository.getCredits('user_aarav');
      const wsTx = credits.find((c) => c.sourceId === action.id);
      expect(wsTx?.amount).toBe(1);
      expect(wsTx?.dimension).toBe('Collaboration');
    });

    it('awards exactly 2 Civic Action credits on completing a project milestone', async () => {
      const initialCredits = (await repository.getUser('user_aarav'))?.totalCredits || 0;

      await repository.completeProjectMilestone(
        'proj_navchetna_crosswalk_01',
        'ms_02_assembly',
        'user_aarav'
      );

      const user = await repository.getUser('user_aarav');
      expect(user?.totalCredits).toBe(initialCredits + 2);

      const credits = await repository.getCredits('user_aarav');
      const msTx = credits.find((c) => c.sourceId === 'ms_02_assembly');
      expect(msTx?.amount).toBe(2);
      expect(msTx?.dimension).toBe('Civic Action');
    });

    it('awards exactly 1 Reflection credit on saving a civic reflection', async () => {
      const initialCredits = (await repository.getUser('user_aarav'))?.totalCredits || 0;

      const refl = await repository.addReflection({
        userId: 'user_aarav',
        contextType: 'assembly',
        contextId: 'assembly_jaipur_pedestrian_2026',
        prompt: 'Reflect on how constructive dissent strengthened the safety proposition.',
        text: 'The dissenting voice on bicycle access helped us adjust the ramp slope safely.',
        valuesHighlighted: ['Respect for Dissent', 'Evidence-First'],
        isPublicInPassport: true,
      });

      const user = await repository.getUser('user_aarav');
      expect(user?.totalCredits).toBe(initialCredits + 1);

      const credits = await repository.getCredits('user_aarav');
      const reflTx = credits.find((c) => c.sourceId === refl.id);
      expect(reflTx?.amount).toBe(1);
      expect(reflTx?.dimension).toBe('Reflection');
    });
  });

  describe('3. No-Credit Activities are Preserved at Zero', () => {
    it('preserves private UHV reflection submissions at 0 credits', async () => {
      await repository.switchUser('user_meera');
      const initialCredits = (await repository.getUser('user_meera'))?.totalCredits || 0;

      const uhvSub = await repository.submitAssignment({
        assignmentId: 'asg_uhv_08',
        userId: 'user_meera',
        content: 'Private personal reflection on gratitude and trust in education.',
      });

      expect(uhvSub.status).toBe('completed');
      expect(uhvSub.isUhvReflection).toBe(true);

      const user = await repository.getUser('user_meera');
      expect(user?.totalCredits).toBe(initialCredits);

      const credits = await repository.getCredits('user_meera');
      const uhvTx = credits.find((c) => c.sourceId === 'asg_uhv_08');
      expect(uhvTx).toBeUndefined();
    });

    it('preserves assembly retained dissent at 0 credits', async () => {
      await repository.switchUser('user_aarav');
      await repository.joinAssembly('assembly_jaipur_pedestrian_2026', 'user_aarav');
      const initialCredits = (await repository.getUser('user_aarav'))?.totalCredits || 0;

      await repository.recordPropositionResponse({
        propositionId: 'prop_jaipur_pedestrian_01',
        userId: 'user_aarav',
        responseState: 'Dissent',
        reasonOrReservations: 'Concerns remain regarding vehicular queue times on emergency corridors.',
      });

      const user = await repository.getUser('user_aarav');
      expect(user?.totalCredits).toBe(initialCredits);

      const passport = await repository.getPassport('user_aarav');
      const dissentEntry = passport.entries.find((e) => e.sourceReferenceType === 'dissent');
      expect(dissentEntry?.creditsAwarded).toBe(0);
    });

    it('preserves private debate room session journals at 0 credits', async () => {
      await repository.switchUser('user_vikram');
      const initialCredits = (await repository.getUser('user_vikram'))?.totalCredits || 0;

      await repository.addReflection({
        userId: 'user_vikram',
        contextType: 'session',
        contextId: 'sess_jaipur_01',
        prompt: 'Private debate session takeaways',
        text: 'Debate reflection: consensus requires transparent evidence.',
        valuesHighlighted: ['Civic Responsibility'],
        isPublicInPassport: false,
      });

      const user = await repository.getUser('user_vikram');
      expect(user?.totalCredits).toBe(initialCredits);
    });
  });

  describe('4. Pending vs. Verified Transitions, Reversals and Repeat Actions', () => {
    it('handles review rejection/revision requested by reverting to Pending and reversing evidence credits', async () => {
      await repository.switchUser('user_aarav');
      const newEv = await repository.addEvidence({
        ownerId: 'user_aarav',
        ownerName: 'Aarav Sharma',
        type: 'image',
        title: 'Initial speed observation photo',
        description: 'Speed photo.',
        source: 'Field Survey',
        visibility: 'assembly',
        verificationStatus: 'under_review',
        tags: ['Safety'],
        mediaUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800',
      });

      const sub = await repository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Report with one photo.',
        evidenceIds: [newEv.id],
      });

      const initialVerified = (await repository.getUser('user_aarav'))?.totalCredits || 0;

      // 1. Mentor verifies: +2 Contribution (Verified), +1 Observation (Verified)
      await repository.switchUser('user_kavita');
      await repository.reviewSubmission({
        submissionId: sub.id,
        reviewerId: 'user_kavita',
        status: 'verified',
        teacherFeedback: 'Initial approval.',
      });

      const userAfterVerify = await repository.getUser('user_aarav');
      expect(userAfterVerify?.totalCredits).toBe(initialVerified + 3);

      // 2. Mentor requests revision upon realizing photo had poor lighting
      await repository.reviewSubmission({
        submissionId: sub.id,
        reviewerId: 'user_kavita',
        status: 'revision_requested',
        teacherFeedback: 'Please retake photo with better illumination.',
      });

      // Total credits should return to initialVerified
      const userAfterRevision = await repository.getUser('user_aarav');
      expect(userAfterRevision?.totalCredits).toBe(initialVerified);

      await repository.switchUser('user_aarav');
      const credits = await repository.getCredits('user_aarav');
      const subTx = credits.find((c) => c.sourceType === 'assignment' && c.sourceId === 'asg_obs_03');
      expect(subTx?.status).toBe('Pending');

      const evTx = credits.find((c) => c.sourceType === 'evidence' && c.sourceId === newEv.id);
      expect(evTx?.status).toBe('Reversed');
      expect(evTx?.auditTrail?.length).toBeGreaterThan(0);
    });

    it('repeat actions are idempotent and do not mint multiple credits', async () => {
      await repository.switchUser('user_aarav');
      const initialCredits = (await repository.getUser('user_aarav'))?.totalCredits || 0;

      // Repeat milestone ms_01_audit (already completed in seed)
      await repository.completeProjectMilestone('proj_navchetna_crosswalk_01', 'ms_01_audit', 'user_aarav');
      const userAfterRepeatMilestone = await repository.getUser('user_aarav');
      expect(userAfterRepeatMilestone?.totalCredits).toBe(initialCredits);

      // Repeat lesson les_obs_101 (already completed in seed)
      await repository.completeLesson('user_aarav', 'les_obs_101');
      const userAfterRepeatLesson = await repository.getUser('user_aarav');
      expect(userAfterRepeatLesson?.totalCredits).toBe(initialCredits);
    });
  });

  describe('5. Legacy Storage Migration and Safety', () => {
    it('safely migrates a legacy browser database missing starting balance without erasing earned history or duplicating balance', () => {
      // Simulate raw legacy storage from older version without starting balance transaction
      const legacyDb: Partial<DemoDatabase> = {
        schemaVersion: 1,
        activeUserId: 'user_test_legacy',
        users: [
          {
            id: 'user_test_legacy',
            name: 'Legacy Participant',
            email: 'legacy@example.edu.in',
            role: 'participant',
            institutionId: 'inst_navchetna_jaipur',
            institutionName: 'Navchetna School',
            programmeIds: ['prog_civic_tech_01'],
            bio: 'Legacy participant bio',
            age: 18,
            location: 'Jaipur, Rajasthan',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            badgeCount: 0,
            totalCredits: 3, // Had earned 3 credits historically
            schemaVersion: 1,
            createdAt: '2026-09-01T00:00:00Z',
            updatedAt: '2026-09-01T00:00:00Z',
          },
        ],
        courses: [],
        lessons: [],
        enrolments: [],
        assignments: [],
        submissions: [],
        evidence: [],
        assemblies: [],
        assemblyRoles: [],
        contributions: [],
        propositions: [],
        projects: [],
        activities: [],
        notifications: [],
        credits: [
          {
            id: 'tx_legacy_01',
            userId: 'user_test_legacy',
            dimension: 'Learning',
            amount: 1,
            sourceType: 'lesson',
            sourceId: 'les_obs_101',
            status: 'Verified',
            reason: 'Completed lesson',
            createdAt: '2026-09-05T00:00:00Z',
            schemaVersion: 1,
          },
          {
            id: 'tx_legacy_02',
            userId: 'user_test_legacy',
            dimension: 'Civic Action',
            amount: 2,
            sourceType: 'project',
            sourceId: 'ms_01',
            status: 'Verified',
            reason: 'Completed milestone',
            createdAt: '2026-09-10T00:00:00Z',
            schemaVersion: 1,
          },
        ],
        passportEntries: [
          {
            id: 'pass_legacy_01',
            userId: 'user_test_legacy',
            category: 'learning',
            title: 'Completed Lesson',
            subtitle: 'Module completion',
            date: '2026-09-05',
            creditsAwarded: 1,
            evidenceIds: [],
            verificationState: 'system_recorded',
            isVerified: true,
            sourceReferenceType: 'lesson',
            sourceReferenceId: 'les_obs_101',
            schemaVersion: 1,
          },
        ],
      };

      // Run migration
      const migrated = runMigrations(legacyDb);

      // Verify user has starting balance added to their earned credits (10 + 1 + 2 = 13)
      const migratedUser = migrated.users.find((u) => u.id === 'user_test_legacy');
      expect(migratedUser?.totalCredits).toBe(13);

      // Starting balance transaction was added
      const startingTx = migrated.credits.find(
        (c) => c.userId === 'user_test_legacy' && c.sourceType === 'starting_balance'
      );
      expect(startingTx).toBeDefined();
      expect(startingTx?.amount).toBe(10);
      expect(startingTx?.reason).toBe('Starting balance: 10');

      // Earned history is preserved intact
      expect(migrated.credits.some((c) => c.id === 'tx_legacy_01')).toBe(true);
      expect(migrated.credits.some((c) => c.id === 'tx_legacy_02')).toBe(true);

      // Idempotence check: run migration again
      const migratedTwice = runMigrations(migrated);
      const startingTxs = migratedTwice.credits.filter(
        (c) => c.userId === 'user_test_legacy' && c.sourceType === 'starting_balance'
      );
      expect(startingTxs).toHaveLength(1);
      const migratedUserTwice = migratedTwice.users.find((u) => u.id === 'user_test_legacy');
      expect(migratedUserTwice?.totalCredits).toBe(13);
    });
  });
});
