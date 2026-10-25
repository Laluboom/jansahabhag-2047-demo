import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LocalDemoRepository } from '../src/services/demoRepository';
import { PersistenceService } from '../src/services/persistence';
import { runMigrations } from '../src/services/migrations';
import { DemoDatabase } from '../src/types/domain';
import { PassportPage } from '../src/features/passport/PassportPage';
import { CreditsPage } from '../src/features/passport/CreditsPage';
import { AchievementsPage } from '../src/features/passport/AchievementsPage';
import { useAuthStore } from '../src/stores/authStore';

describe('Civic Passport Demo Credit Model (5-Point Ceiling & 0 Starting Balance)', () => {
  let repository: LocalDemoRepository;

  beforeEach(() => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    repository = new LocalDemoRepository();
  });

  describe('1. Zero Starting Points for Newly Created and Seeded Participants', () => {
    it('creates a newly onboarded participant with exactly 0 starting points, no starting balance transactions, and no starting balance passport entries', async () => {
      const newParticipant = await repository.createParticipant({
        name: 'Tara Verma',
        email: 'tara.verma@example.edu.in',
        institutionId: 'inst_navchetna_jaipur',
        institutionName: 'Government Senior Secondary School Navchetna, Jaipur',
        age: 18,
        location: 'Jaipur, Rajasthan',
      });

      expect(newParticipant.id).toBeDefined();
      expect(newParticipant.totalCredits).toBe(0);

      // Switch to new participant to inspect private ledger and passport
      await repository.switchUser(newParticipant.id);

      // Ledger check: 0 starting balance transactions
      const credits = await repository.getCredits(newParticipant.id);
      expect(credits).toHaveLength(0);

      // Passport check: 0 starting balance entry, totalCredits: 0
      const passport = await repository.getPassport(newParticipant.id);
      expect(passport.totalCredits).toBe(0);
      expect(passport.pendingCredits).toBe(0);
      expect(passport.entries).toHaveLength(0);
    });

    it('seeded participants display zero starting balance and verified activity totals capped at 5', async () => {
      // Aarav: 2 points in seed (1 les_obs_101 + 1 les_obs_102)
      const aarav = await repository.getUser('VSC-S-001');
      expect(aarav?.totalCredits).toBe(2);

      const aaravCredits = await repository.getCredits('VSC-S-001');
      const aaravVerifiedTotal = aaravCredits
        .filter((c) => c.status === 'Verified')
        .reduce((sum, c) => sum + c.amount, 0);
      expect(aaravVerifiedTotal).toBe(2);

      // No starting balance transaction for Aarav
      const aaravInitTx = aaravCredits.find((c) => c.sourceType === 'starting_balance');
      expect(aaravInitTx).toBeUndefined();

      // Meera is capped at exactly 5
      const meera = await repository.getUser('VSC-S-002');
      expect(meera?.totalCredits).toBe(5);

      // Vikram is at 3
      const vikram = await repository.getUser('VSC-S-005');
      expect(vikram?.totalCredits).toBe(3);

      // Kabir is at 3
      const kabir = await repository.getUser('VSC-S-006');
      expect(kabir?.totalCredits).toBe(3);

      // Diya Patel has no activity credits and has 0 points
      const diya = await repository.getUser('VSC-S-008');
      expect(diya?.totalCredits).toBe(0);

      // Priya, Aryan, Neha capped at 5
      const priya = await repository.getUser('VSC-S-003');
      expect(priya?.totalCredits).toBe(5);
      const aryan = await repository.getUser('VSC-S-010');
      expect(aryan?.totalCredits).toBe(5);
      const neha = await repository.getUser('VSC-S-015');
      expect(neha?.totalCredits).toBe(5);
    });

    it('ensures starting balance transactions are completely removed and never injected on migration', async () => {
      const aaravCreditsBefore = await repository.getCredits('VSC-S-001');
      const initTxsBefore = aaravCreditsBefore.filter((c) => c.sourceType === 'starting_balance');
      expect(initTxsBefore).toHaveLength(0);

      // Running normalization/migration again
      const db = PersistenceService.loadDatabase();
      const migrated = runMigrations(db);
      PersistenceService.saveDatabase(migrated);

      const aaravCreditsAfter = await repository.getCredits('VSC-S-001');
      const initTxsAfter = aaravCreditsAfter.filter((c) => c.sourceType === 'starting_balance');
      expect(initTxsAfter).toHaveLength(0);
      expect(aaravCreditsAfter.length).toBe(aaravCreditsBefore.length);
    });
  });

  describe('2. Hard Maximum of 5 Verified Civic Credit Points and Reward Schedule', () => {
    it('awards exactly 1 Learning point on completing a lesson when headroom is available', async () => {
      const initialCredits = (await repository.getUser('VSC-S-001'))?.totalCredits || 0;
      expect(initialCredits).toBe(2);

      const result = await repository.completeLesson('VSC-S-001', 'les_obs_103');
      expect(result.creditTransaction?.amount).toBe(1);
      expect(result.creditTransaction?.dimension).toBe('Learning');

      const user = await repository.getUser('VSC-S-001');
      expect(user?.totalCredits).toBe(initialCredits + 1); // 3

      // Passport entry has 1 credit point awarded
      const passport = await repository.getPassport('VSC-S-001');
      const entry = passport.entries.find((e) => e.sourceReferenceId === 'les_obs_103');
      expect(entry?.creditsAwarded).toBe(1);
      expect(entry?.calculationExplanation).toContain('1 Civic Credit Point');
    });

    it('awards 2 Contribution points (Pending) on assignment submission without prematurely affecting total', async () => {
      const initialVerified = (await repository.getUser('VSC-S-001'))?.totalCredits || 0;

      const sub = await repository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'VSC-S-001',
        content: 'Field observations on traffic speed and crossing safety.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });

      // Total verified credits does NOT increase yet
      const user = await repository.getUser('VSC-S-001');
      expect(user?.totalCredits).toBe(initialVerified);

      // Pending credit transaction created with 2 points
      const credits = await repository.getCredits('VSC-S-001');
      const subTx = credits.find((c) => c.sourceType === 'assignment' && c.sourceId === 'asg_obs_03');
      expect(subTx).toBeDefined();
      expect(subTx?.status).toBe('Pending');
      expect(subTx?.amount).toBe(2);
      expect(subTx?.dimension).toBe('Contribution');

      // Passport reflects 2 points pending
      const passport = await repository.getPassport('VSC-S-001');
      const passEntry = passport.entries.find((e) => e.sourceReferenceId === sub.id);
      expect(passEntry?.creditsAwarded).toBe(2);
      expect(passEntry?.isVerified).toBe(false);
      expect(passEntry?.reviewState).toBe('pending');
    });

    it('enforces the 5-point hard ceiling when multiple actions occur', async () => {
      // Aarav starts at 2 points. Headroom = 3.
      const initial = (await repository.getUser('VSC-S-001'))?.totalCredits || 0;
      expect(initial).toBe(2);

      // Action 1: Milestone completion (+2 points). 2 + 2 = 4 points.
      await repository.completeProjectMilestone(
        'proj_navchetna_crosswalk_01',
        'ms_02_assembly',
        'VSC-S-001'
      );
      const afterMilestone = await repository.getUser('VSC-S-001');
      expect(afterMilestone?.totalCredits).toBe(4);

      // Action 2: Join assembly (+2 points rule, but headroom is only 1).
      // Headroom = 5 - 4 = 1.
      const joinResult = await repository.joinAssembly('assembly_jaipur_pedestrian_2026', 'VSC-S-001');
      expect(joinResult.creditTransaction?.amount).toBe(1);

      const afterJoin = await repository.getUser('VSC-S-001');
      expect(afterJoin?.totalCredits).toBe(5);

      // Action 3: Further action when at 5 points cap (Headroom = 0).
      // Completing lesson les_obs_103 should award 0 points and explain ceiling.
      const lessonResult = await repository.completeLesson('VSC-S-001', 'les_obs_103');
      expect(lessonResult.creditTransaction?.amount).toBe(0);
      expect(lessonResult.creditTransaction?.calculationExplanation).toContain('Demo ceiling reached: Maximum 5 verified Civic Credit Points');

      const afterLesson = await repository.getUser('VSC-S-001');
      expect(afterLesson?.totalCredits).toBe(5);
    });

    it('persona already at 5 points (Meera) receives 0 additional points for any new action', async () => {
      await repository.switchUser('VSC-S-002');
      const meeraBefore = await repository.getUser('VSC-S-002');
      expect(meeraBefore?.totalCredits).toBe(5);

      // Meera adds a civic reflection
      const refl = await repository.addReflection({
        userId: 'VSC-S-002',
        contextType: 'assembly',
        contextId: 'assembly_jaipur_pedestrian_2026',
        prompt: 'Reflection on civic consensus',
        text: 'Consensus requires genuine mutual listening.',
        valuesHighlighted: ['Deliberation'],
        isPublicInPassport: true,
      });

      const meeraAfter = await repository.getUser('VSC-S-002');
      expect(meeraAfter?.totalCredits).toBe(5);

      const credits = await repository.getCredits('VSC-S-002');
      const reflTx = credits.find((c) => c.sourceId === refl.id);
      expect(reflTx?.amount).toBe(0);
      expect(reflTx?.calculationExplanation).toContain('Demo ceiling reached');
    });

    it('awards 1 Collaboration point on creating a workspace action until cap', async () => {
      const initialCredits = (await repository.getUser('VSC-S-001'))?.totalCredits || 0;
      expect(initialCredits).toBe(2);

      const action = await repository.createWorkspaceAction({
        workspaceId: 'ws_jaipur_school_safety',
        authorId: 'VSC-S-001',
        actionType: 'task',
        title: 'Conduct secondary gate pedestrian speed survey',
        content: 'Survey pedestrian approach speeds at the secondary school entrance.',
      });

      const user = await repository.getUser('VSC-S-001');
      expect(user?.totalCredits).toBe(initialCredits + 1);

      const credits = await repository.getCredits('VSC-S-001');
      const wsTx = credits.find((c) => c.sourceId === action.id);
      expect(wsTx?.amount).toBe(1);
      expect(wsTx?.dimension).toBe('Collaboration');
    });
  });

  describe('3. No-Credit Activities are Preserved at Zero', () => {
    it('preserves private UHV reflection submissions at 0 points', async () => {
      await repository.switchUser('VSC-S-002');
      const initialCredits = (await repository.getUser('VSC-S-002'))?.totalCredits || 0;

      const uhvSub = await repository.submitAssignment({
        assignmentId: 'asg_uhv_08',
        userId: 'VSC-S-002',
        content: 'Private personal reflection on gratitude and trust in education.',
      });

      expect(uhvSub.status).toBe('completed');
      expect(uhvSub.isUhvReflection).toBe(true);

      const user = await repository.getUser('VSC-S-002');
      expect(user?.totalCredits).toBe(initialCredits);

      const credits = await repository.getCredits('VSC-S-002');
      const uhvTx = credits.find((c) => c.sourceId === 'asg_uhv_08');
      expect(uhvTx).toBeUndefined();
    });

    it('preserves assembly retained dissent at 0 points', async () => {
      await repository.switchUser('VSC-S-001');
      await repository.joinAssembly('assembly_jaipur_pedestrian_2026', 'VSC-S-001');
      const initialCredits = (await repository.getUser('VSC-S-001'))?.totalCredits || 0;

      await repository.recordPropositionResponse({
        propositionId: 'prop_jaipur_pedestrian_01',
        userId: 'VSC-S-001',
        responseState: 'Dissent',
        reasonOrReservations: 'Concerns remain regarding vehicular queue times on emergency corridors.',
      });

      const user = await repository.getUser('VSC-S-001');
      expect(user?.totalCredits).toBe(initialCredits);

      const passport = await repository.getPassport('VSC-S-001');
      const dissentEntry = passport.entries.find((e) => e.sourceReferenceType === 'dissent');
      expect(dissentEntry?.creditsAwarded).toBe(0);
    });

    it('preserves private debate room session journals at 0 points', async () => {
      await repository.switchUser('VSC-S-005');
      const initialCredits = (await repository.getUser('VSC-S-005'))?.totalCredits || 0;

      await repository.addReflection({
        userId: 'VSC-S-005',
        contextType: 'session',
        contextId: 'sess_jaipur_01',
        prompt: 'Private debate session takeaways',
        text: 'Debate reflection: consensus requires transparent evidence.',
        valuesHighlighted: ['Civic Responsibility'],
        isPublicInPassport: false,
      });

      const user = await repository.getUser('VSC-S-005');
      expect(user?.totalCredits).toBe(initialCredits);
    });
  });

  describe('4. Pending vs. Verified Transitions, Reversals and Idempotency', () => {
    it('handles review rejection/revision requested by reverting to Pending and restoring headroom', async () => {
      await repository.switchUser('VSC-S-001');
      const newEv = await repository.addEvidence({
        ownerId: 'VSC-S-001',
        ownerName: 'Ankita Kapri',
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
        userId: 'VSC-S-001',
        content: 'Report with one photo.',
        evidenceIds: [newEv.id],
      });

      const initialVerified = (await repository.getUser('VSC-S-001'))?.totalCredits || 0;
      expect(initialVerified).toBe(2);

      // 1. Mentor verifies: +2 Contribution (Verified), +1 Observation (Verified) = +3 points (2 + 3 = 5 max)
      await repository.switchUser('VSC-T-001');
      await repository.reviewSubmission({
        submissionId: sub.id,
        reviewerId: 'VSC-T-001',
        status: 'verified',
        teacherFeedback: 'Initial approval.',
      });

      const userAfterVerify = await repository.getUser('VSC-S-001');
      expect(userAfterVerify?.totalCredits).toBe(5);

      // 2. Mentor requests revision: reverts to Pending and reverses evidence credit
      await repository.reviewSubmission({
        submissionId: sub.id,
        reviewerId: 'VSC-T-001',
        status: 'revision_requested',
        teacherFeedback: 'Please retake photo with better illumination.',
      });

      // Total credits should return to initialVerified (2)
      const userAfterRevision = await repository.getUser('VSC-S-001');
      expect(userAfterRevision?.totalCredits).toBe(initialVerified);

      await repository.switchUser('VSC-S-001');
      const credits = await repository.getCredits('VSC-S-001');
      const subTx = credits.find((c) => c.sourceType === 'assignment' && c.sourceId === 'asg_obs_03');
      expect(subTx?.status).toBe('Pending');

      const evTx = credits.find((c) => c.sourceType === 'evidence' && c.sourceId === newEv.id);
      expect(evTx?.status).toBe('Reversed');
      expect(evTx?.auditTrail?.length).toBeGreaterThan(0);
    });

    it('repeat actions are strictly idempotent and do not mint duplicate points', async () => {
      await repository.switchUser('VSC-S-001');
      const initialCredits = (await repository.getUser('VSC-S-001'))?.totalCredits || 0;

      // Repeat lesson les_obs_101 (already completed in seed)
      await repository.completeLesson('VSC-S-001', 'les_obs_101');
      const userAfterRepeatLesson = await repository.getUser('VSC-S-001');
      expect(userAfterRepeatLesson?.totalCredits).toBe(initialCredits);
    });
  });

  describe('5. Legacy Storage Migration and 5-Point Cap Invariant', () => {
    it('safely migrates a legacy browser database with starting balance and >5 points without losing evidence or exceeding 5 points', () => {
      // Simulate raw legacy storage from older version with 10 starting balance and excess points
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
            totalCredits: 16, // Old 10 starting + 6 earned
            schemaVersion: 1,
            createdAt: '2026-09-01T00:00:00Z',
            updatedAt: '2026-09-01T00:00:00Z',
          },
        ],
        courses: [],
        lessons: [],
        enrolments: [],
        assignments: [],
        submissions: [
          {
            id: 'sub_legacy_01',
            assignmentId: 'asg_obs_01',
            userId: 'user_test_legacy',
            status: 'verified',
            content: 'User-created evidence text that must not be corrupted',
            evidenceIds: ['ev_legacy_01'],
            schemaVersion: 1,
            createdAt: '2026-09-02T00:00:00Z',
            updatedAt: '2026-09-02T00:00:00Z',
          },
        ],
        evidence: [
          {
            id: 'ev_legacy_01',
            ownerId: 'user_test_legacy',
            ownerName: 'Legacy Participant',
            type: 'image',
            title: 'Critical field photo',
            description: 'Preserved user evidence description',
            source: 'Field audit',
            visibility: 'public',
            verificationStatus: 'verified',
            tags: ['Preserved'],
            schemaVersion: 1,
            createdAt: '2026-09-02T00:00:00Z',
            updatedAt: '2026-09-02T00:00:00Z',
          },
        ],
        assemblies: [],
        assemblyRoles: [],
        contributions: [],
        propositions: [],
        projects: [],
        activities: [],
        notifications: [],
        credits: [
          {
            id: 'tx_legacy_init',
            userId: 'user_test_legacy',
            dimension: 'Contribution',
            amount: 10,
            sourceType: 'starting_balance',
            sourceId: 'starting_balance',
            status: 'Verified',
            reason: 'Starting balance: 10',
            createdAt: '2026-09-01T00:00:00Z',
            schemaVersion: 1,
          },
          {
            id: 'tx_legacy_01',
            userId: 'user_test_legacy',
            dimension: 'Learning',
            amount: 2,
            sourceType: 'lesson',
            sourceId: 'les_obs_101',
            status: 'Verified',
            reason: 'Completed lesson 1',
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
          {
            id: 'tx_legacy_03',
            userId: 'user_test_legacy',
            dimension: 'Observation',
            amount: 2,
            sourceType: 'evidence',
            sourceId: 'ev_legacy_01',
            status: 'Verified',
            reason: 'Field evidence verified',
            createdAt: '2026-09-15T00:00:00Z',
            schemaVersion: 1,
          },
        ],
        passportEntries: [
          {
            id: 'pass_legacy_init',
            userId: 'user_test_legacy',
            category: 'achievement',
            title: 'Starting Balance Allocation',
            subtitle: 'Onboarding Civic Passport Credential (+10 Credits)',
            date: '2026-09-01',
            creditsAwarded: 10,
            evidenceIds: [],
            verificationState: 'system_recorded',
            isVerified: true,
            sourceReferenceType: 'starting_balance',
            sourceReferenceId: 'starting_balance',
            schemaVersion: 1,
          },
          {
            id: 'pass_legacy_01',
            userId: 'user_test_legacy',
            category: 'learning',
            title: 'Completed Lesson',
            subtitle: 'Module completion',
            date: '2026-09-05',
            creditsAwarded: 2,
            evidenceIds: [],
            verificationState: 'system_recorded',
            isVerified: true,
            sourceReferenceType: 'lesson',
            sourceReferenceId: 'les_obs_101',
            schemaVersion: 1,
          },
          {
            id: 'pass_legacy_02',
            userId: 'user_test_legacy',
            category: 'civic_action',
            title: 'Completed Milestone',
            subtitle: 'Milestone',
            date: '2026-09-10',
            creditsAwarded: 2,
            evidenceIds: [],
            verificationState: 'system_recorded',
            isVerified: true,
            sourceReferenceType: 'project_milestone',
            sourceReferenceId: 'ms_01',
            schemaVersion: 1,
          },
          {
            id: 'pass_legacy_03',
            userId: 'user_test_legacy',
            category: 'contribution',
            title: 'Verified Field Evidence',
            subtitle: 'Photo log',
            date: '2026-09-15',
            creditsAwarded: 2,
            evidenceIds: ['ev_legacy_01'],
            verificationState: 'system_recorded',
            isVerified: true,
            sourceReferenceType: 'evidence',
            sourceReferenceId: 'ev_legacy_01',
            schemaVersion: 1,
          },
        ],
      };

      // Run migration
      const migrated = runMigrations(legacyDb);

      // Verify user totalCredits is capped at exactly 5
      const migratedUser = migrated.users.find((u) => u.id === 'user_test_legacy');
      expect(migratedUser?.totalCredits).toBe(5);

      // Starting balance transaction was completely removed
      const startingTx = migrated.credits.find(
        (c) => c.userId === 'user_test_legacy' && c.sourceType === 'starting_balance'
      );
      expect(startingTx).toBeUndefined();

      // Starting balance passport entry was completely removed
      const startingPass = migrated.passportEntries.find(
        (p) => p.userId === 'user_test_legacy' && p.sourceReferenceType === 'starting_balance'
      );
      expect(startingPass).toBeUndefined();

      // Verified credits sum never exceeds 5
      const verifiedSum = migrated.credits
        .filter((c) => c.userId === 'user_test_legacy' && (c.status === 'Verified' || c.status === 'Audited'))
        .reduce((s, c) => s + c.amount, 0);
      expect(verifiedSum).toBe(5);

      // User-created evidence and submissions are completely preserved without corruption
      const userEvidence = migrated.evidence.find((e) => e.id === 'ev_legacy_01');
      expect(userEvidence).toBeDefined();
      expect(userEvidence?.title).toBe('Critical field photo');
      expect(userEvidence?.description).toBe('Preserved user evidence description');

      const userSubmission = migrated.submissions.find((s) => s.id === 'sub_legacy_01');
      expect(userSubmission).toBeDefined();
      expect(userSubmission?.content).toBe('User-created evidence text that must not be corrupted');

      // Idempotence check: run migration a second time
      const migratedTwice = runMigrations(migrated);
      const migratedUserTwice = migratedTwice.users.find((u) => u.id === 'user_test_legacy');
      expect(migratedUserTwice?.totalCredits).toBe(5);
      const startingTxTwice = migratedTwice.credits.find(
        (c) => c.userId === 'user_test_legacy' && c.sourceType === 'starting_balance'
      );
      expect(startingTxTwice).toBeUndefined();
    });
  });

  describe('6. Achievements Badges, Truthful NEP UGC Disclosures, and Visible Naming', () => {
    it('removes unreachable 20-point badge and unlocks 5-point milestone badge for capped personas', async () => {
      // Meera has 5 points (capped)
      await useAuthStore.getState().switchPersona('VSC-S-002');

      render(
        <MemoryRouter initialEntries={['/passport/achievements']}>
          <Routes>
            <Route path="/passport/achievements" element={<AchievementsPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Civic Credit Milestone Champion')).toBeInTheDocument();
      });

      // 20-point badge description must NOT exist
      expect(screen.queryByText(/20\+ verified/i)).not.toBeInTheDocument();

      // 5-point milestone badge description is present and unlocked for Meera
      const milestoneBadgeCard = screen.getByText('Civic Credit Milestone Champion').closest('.border-slate-200');
      expect(milestoneBadgeCard?.textContent).toContain('Reached the maximum 5 verified Civic Credit Points ceiling');
      expect(milestoneBadgeCard?.textContent).toContain('Unlocked');
    });

    it('renders truthful NEP UGC link and disclaimer on PassportPage', async () => {
      await useAuthStore.getState().switchPersona('VSC-S-001');

      render(
        <MemoryRouter initialEntries={['/passport']}>
          <Routes>
            <Route path="/passport" element={<PassportPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/National Education Policy & UGC Context:/i)).toBeInTheDocument();
      });

      // Truthful disclaimer present
      expect(
        screen.getByText(/UGC recognizes community engagement in learning, but these five demo points are not academic credits and do not count toward graduation\./i)
      ).toBeInTheDocument();

      // Official UGC source link present with correct URL
      const ugcLink = screen.getByRole('link', { name: /Official UGC Source/i });
      expect(ugcLink).toHaveAttribute(
        'href',
        'https://www.ugc.gov.in/KeyInitiative?ID=VQnigtvLvoA0UAhQPVdzTA%3D%3D'
      );
    });

    it('renders truthful NEP UGC link and disclaimer on CreditsPage', async () => {
      await useAuthStore.getState().switchPersona('VSC-S-001');

      render(
        <MemoryRouter initialEntries={['/passport/credits']}>
          <Routes>
            <Route path="/passport/credits" element={<CreditsPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/National Education Policy & UGC Context:/i)).toBeInTheDocument();
      });

      expect(
        screen.getByText(/UGC recognizes community engagement in learning, but these five demo points are not academic credits and do not count toward graduation\./i)
      ).toBeInTheDocument();

      const ugcLink = screen.getByRole('link', { name: /Official UGC Source/i });
      expect(ugcLink).toHaveAttribute(
        'href',
        'https://www.ugc.gov.in/KeyInitiative?ID=VQnigtvLvoA0UAhQPVdzTA%3D%3D'
      );

      // Ledger title reflects Civic Credit Points Ledger
      expect(screen.getByText('Civic Credit Points Ledger')).toBeInTheDocument();
    });
  });
});
