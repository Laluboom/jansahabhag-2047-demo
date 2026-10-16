import { describe, it, expect, beforeEach } from 'vitest';
import { LocalDemoRepository } from '../src/services/demoRepository';
import { PersistenceService } from '../src/services/persistence';

describe('Task 03 - Youth Assembly Deliberation, Proposition, Reflection & Civic Passport', () => {
  let repository: LocalDemoRepository;

  beforeEach(() => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    repository = new LocalDemoRepository();
  });

  describe('Fresh Assembly State & Join Action', () => {
    it('initial seed state offers a fresh join state for Aarav on active assemblies', async () => {
      const assembly = await repository.getAssembly('assembly_jaipur_pedestrian_2026');
      expect(assembly).toBeDefined();
      expect(assembly?.participantUserIds).not.toContain('user_aarav');
    });

    it('joining an assembly adds user to participants, allocates role, awards +10 Deliberation credits, and creates Passport entry', async () => {
      const initialCredits = (await repository.getCredits('user_aarav')).reduce((s, c) => s + c.amount, 0);

      const result = await repository.joinAssembly('assembly_jaipur_pedestrian_2026', 'user_aarav');
      expect(result.assembly.participantUserIds).toContain('user_aarav');
      expect(result.role.roleName).toBe('Shaper');
      expect(result.role.responsibilities.length).toBeGreaterThan(0);
      expect(result.role.promptSuggestions.length).toBeGreaterThan(0);

      // Verify +10 Deliberation Credits
      const updatedCredits = await repository.getCredits('user_aarav');
      const updatedTotal = updatedCredits.reduce((s, c) => s + c.amount, 0);
      expect(updatedTotal).toBe(initialCredits + 10);

      const joinCredit = updatedCredits.find(
        (c) => c.sourceType === 'assembly' && c.sourceId === 'assembly_jaipur_pedestrian_2026'
      );
      expect(joinCredit).toBeDefined();
      expect(joinCredit?.dimension).toBe('Deliberation');
      expect(joinCredit?.amount).toBe(10);

      // Verify Passport Entry
      const passport = await repository.getPassport('user_aarav');
      const passportEntry = passport.entries.find(
        (p) => p.sourceReferenceId === 'assembly_jaipur_pedestrian_2026' && p.category === 'deliberation'
      );
      expect(passportEntry).toBeDefined();
      expect(passportEntry?.title).toContain('Shaper');
      expect(passportEntry?.creditsAwarded).toBe(10);
      expect(passportEntry?.isVerified).toBe(true);

      // Verify Notification
      const notifs = await repository.getNotifications('user_aarav');
      const joinNotif = notifs.find((n) => n.targetRoute.includes('assembly_jaipur_pedestrian_2026'));
      expect(joinNotif).toBeDefined();
      expect(joinNotif?.type).toBe('assembly');

      // Verify User totalCredits
      const user = await repository.getUser('user_aarav');
      expect(user?.totalCredits).toBe(updatedTotal);
    });

    it('joinAssembly is strictly idempotent and does not award duplicate credits on repeated calls', async () => {
      const initialCredits = (await repository.getCredits('user_aarav')).reduce((s, c) => s + c.amount, 0);

      // First Join
      await repository.joinAssembly('assembly_jaipur_pedestrian_2026', 'user_aarav');
      const creditsAfterFirst = (await repository.getCredits('user_aarav')).reduce((s, c) => s + c.amount, 0);
      expect(creditsAfterFirst).toBe(initialCredits + 10);

      // Duplicate Join
      await repository.joinAssembly('assembly_jaipur_pedestrian_2026', 'user_aarav');
      const creditsAfterSecond = (await repository.getCredits('user_aarav')).reduce((s, c) => s + c.amount, 0);
      expect(creditsAfterSecond).toBe(creditsAfterFirst);
    });
  });

  describe('Assembly Contributions & Validation', () => {
    beforeEach(async () => {
      await repository.joinAssembly('assembly_jaipur_pedestrian_2026', 'user_aarav');
    });

    it('substantive contribution validates minimum content length', async () => {
      await expect(
        repository.addAssemblyContribution({
          assemblyId: 'assembly_jaipur_pedestrian_2026',
          userId: 'user_aarav',
          stage: 'think',
          type: 'question',
          text: '   ',
        })
      ).rejects.toThrow(/at least 5 characters/i);
    });

    it('adding a substantive contribution awards +5 Deliberation credit, creates activity and Passport entry with traceable source', async () => {
      const initialCredits = (await repository.getCredits('user_aarav')).reduce((s, c) => s + c.amount, 0);

      const contrib = await repository.addAssemblyContribution({
        assemblyId: 'assembly_jaipur_pedestrian_2026',
        userId: 'user_aarav',
        stage: 'think',
        type: 'question',
        text: 'How will stormwater drainage be incorporated beneath the tabletop crossing on Madhyam Marg?',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });

      expect(contrib.id).toBeDefined();
      expect(contrib.isSubstantive).toBe(true);
      expect(contrib.evidenceIds).toContain('ev_aarav_traffic_count_01');

      // Verify +5 Deliberation Credit
      const credits = await repository.getCredits('user_aarav');
      const updatedTotal = credits.reduce((s, c) => s + c.amount, 0);
      expect(updatedTotal).toBe(initialCredits + 5);

      const contribCredit = credits.find((c) => c.sourceType === 'contribution' && c.sourceId === contrib.id);
      expect(contribCredit).toBeDefined();
      expect(contribCredit?.dimension).toBe('Deliberation');
      expect(contribCredit?.amount).toBe(5);

      // Verify Activity Record
      const dashboard = await repository.getDashboard('user_aarav');
      const activity = dashboard.recentActivities.find(
        (a) => a.type === 'contribution_added' && a.referenceId === contrib.id
      );
      expect(activity).toBeDefined();

      // Verify Passport Entry
      const passport = await repository.getPassport('user_aarav');
      const passportEntry = passport.entries.find((p) => p.sourceReferenceId === contrib.id);
      expect(passportEntry).toBeDefined();
      expect(passportEntry?.category).toBe('deliberation');
      expect(passportEntry?.creditsAwarded).toBe(5);
    });
  });

  describe('Structured Proposition Editor, Revisions & Dissent Preservation', () => {
    it('updates structured proposition fields, increments version and appends to revision history', async () => {
      const prop = await repository.getProposition('prop_jaipur_pedestrian_01');
      expect(prop).toBeDefined();
      const initialVersion = prop!.version;
      const initialRevisionsCount = prop!.revisions.length;

      const updated = await repository.updateProposition({
        propositionId: 'prop_jaipur_pedestrian_01',
        updatedBy: 'Aarav Sharma',
        changesSummary: 'Added IRC 1:15 approach ramp gradient and monsoon cross-drainage pipe',
        proposition: '1. Constructed 150mm raised tabletop pedestrian crossing with 1:15 slope gradient.\n2. Sub-surface RCC cross-drainage pipe.',
        enablers: [...prop!.enablers, 'Co-financed via Ward 24 corporator development budget'],
        risks: [...prop!.risks, 'Monsoon overflow during intense cloudbursts'],
        nextStep: 'Present revised engineering drawings to PWD Executive Engineer',
      });

      expect(updated.version).toBe(initialVersion + 1);
      expect(updated.revisions.length).toBe(initialRevisionsCount + 1);
      expect(updated.enablers).toContain('Co-financed via Ward 24 corporator development budget');
      expect(updated.risks).toContain('Monsoon overflow during intense cloudbursts');
      expect(updated.nextStep).toBe('Present revised engineering drawings to PWD Executive Engineer');

      const latestRevision = updated.revisions[updated.revisions.length - 1];
      expect(latestRevision.version).toBe(updated.version);
      expect(latestRevision.updatedBy).toBe('Aarav Sharma');
      expect(latestRevision.changesSummary).toContain('IRC 1:15 approach ramp gradient');
    });

    it('preserves formal dissent records visibly in the proposition', async () => {
      const prop = await repository.getProposition('prop_jaipur_pedestrian_01');
      const initialDissentCount = prop!.dissent.length;

      const newDissent = {
        id: 'dis_aarav_01',
        userId: 'user_aarav',
        userName: 'Aarav Sharma',
        reason: 'Raised tabletop ramp slope may impede high-speed ambulances.',
        suggestedAmendment: 'Reduce ramp elevation from 150mm to 100mm with gradual 1:20 transition.',
      };

      const updated = await repository.updateProposition({
        propositionId: 'prop_jaipur_pedestrian_01',
        updatedBy: 'Aarav Sharma',
        changesSummary: 'Recorded formal ambulance passage dissent',
        dissent: [...prop!.dissent, newDissent],
      });

      expect(updated.dissent.length).toBe(initialDissentCount + 1);
      const savedDissent = updated.dissent.find((d) => d.id === 'dis_aarav_01');
      expect(savedDissent).toBeDefined();
      expect(savedDissent?.userName).toBe('Aarav Sharma');
      expect(savedDissent?.suggestedAmendment).toContain('1:20 transition');
    });
  });

  describe('Outcome Finalisation & Duplicate Prevention', () => {
    beforeEach(async () => {
      await repository.joinAssembly('assembly_jaipur_pedestrian_2026', 'user_aarav');
    });

    it('finalises proposition outcome union, sets assembly status to concluded and stage to outcome', async () => {
      const finalised = await repository.finaliseProposition({
        propositionId: 'prop_jaipur_pedestrian_01',
        assemblyId: 'assembly_jaipur_pedestrian_2026',
        outcome: 'QUALIFIED_SUPPORT',
        updatedBy: 'Rohan Joshi',
        changesSummary: 'Deliberation concluded with qualified support and preserved dissent',
      });

      expect(finalised.outcome).toBe('QUALIFIED_SUPPORT');

      // Verify assembly state
      const assembly = await repository.getAssembly('assembly_jaipur_pedestrian_2026');
      expect(assembly?.status).toBe('concluded');
      expect(assembly?.currentStage).toBe('final_assembly');

      // Verify notifications sent to participants
      const notifs = await repository.getNotifications('user_aarav');
      const outcomeNotif = notifs.find((n) => n.title.includes('Assembly Proposition Finalised'));
      expect(outcomeNotif).toBeDefined();
      expect(outcomeNotif?.message).toContain('QUALIFIED_SUPPORT');

      // Verify Passport Entry created for participants
      const passport = await repository.getPassport('user_aarav');
      const resolutionEntry = passport.entries.find(
        (p) => p.title.includes('Assembly Resolution') && p.category === 'deliberation'
      );
      expect(resolutionEntry).toBeDefined();
      expect(resolutionEntry?.isVerified).toBe(true);
    });

    it('strictly prevents duplicate outcome finalisation', async () => {
      // First Finalise
      await repository.finaliseProposition({
        propositionId: 'prop_jaipur_pedestrian_01',
        assemblyId: 'assembly_jaipur_pedestrian_2026',
        outcome: 'QUALIFIED_SUPPORT',
        updatedBy: 'Rohan Joshi',
        changesSummary: 'Final qualified support outcome declared',
      });

      // Attempt second finalisation on same proposition / concluded assembly
      await expect(
        repository.finaliseProposition({
          propositionId: 'prop_jaipur_pedestrian_01',
          assemblyId: 'assembly_jaipur_pedestrian_2026',
          outcome: 'SPLIT_DECISION',
          updatedBy: 'Rohan Joshi',
          changesSummary: 'Duplicate finalisation attempt',
        })
      ).rejects.toThrow(/already been finalised/i);
    });
  });

  describe('Post-Outcome Reflection & Civic Credits Ledger', () => {
    it('submitting a reflection awards +5 Reflection credit, creates activity and Passport entry with highlighted values', async () => {
      const initialCredits = (await repository.getCredits('user_aarav')).reduce((s, c) => s + c.amount, 0);

      const reflection = await repository.addReflection({
        userId: 'user_aarav',
        contextType: 'assembly',
        contextId: 'assembly_jaipur_pedestrian_2026',
        prompt: 'How did this deliberative process balance differing stakeholder perspectives?',
        text: 'Listening to commercial driver concerns helped us adjust the ramp gradient without compromising pedestrian safety. Mutual respect led to genuine consensus.',
        valuesHighlighted: ['Trust (Vishwas)', 'Empathy (Samvedana)', 'Evidence-First'],
        isPublicInPassport: true,
      });

      expect(reflection.id).toBeDefined();
      expect(reflection.valuesHighlighted).toContain('Trust (Vishwas)');

      // Verify +5 Reflection Credits
      const credits = await repository.getCredits('user_aarav');
      const updatedTotal = credits.reduce((s, c) => s + c.amount, 0);
      expect(updatedTotal).toBe(initialCredits + 5);

      const reflCredit = credits.find((c) => c.sourceType === 'reflection' && c.sourceId === reflection.id);
      expect(reflCredit).toBeDefined();
      expect(reflCredit?.dimension).toBe('Reflection');
      expect(reflCredit?.amount).toBe(5);

      // Verify Passport Entry
      const passport = await repository.getPassport('user_aarav');
      const reflEntry = passport.entries.find((p) => p.sourceReferenceId === reflection.id);
      expect(reflEntry).toBeDefined();
      expect(reflEntry?.category).toBe('reflection');
      expect(reflEntry?.creditsAwarded).toBe(5);

      // Query reflections by user
      const userReflections = await repository.getReflections('user_aarav');
      expect(userReflections.some((r) => r.id === reflection.id)).toBe(true);
    });

    it('passport view computes exact 6-dimension credit breakdown and maintains ledger integrity', async () => {
      // Complete full workflow: join assembly (+10 Deliberation), contribute (+5 Deliberation), reflect (+5 Reflection)
      await repository.joinAssembly('assembly_jaipur_pedestrian_2026', 'user_aarav');
      await repository.addAssemblyContribution({
        assemblyId: 'assembly_jaipur_pedestrian_2026',
        userId: 'user_aarav',
        stage: 'think',
        type: 'question',
        text: 'Testing ledger total calculation.',
      });
      await repository.addReflection({
        userId: 'user_aarav',
        contextType: 'assembly',
        contextId: 'assembly_jaipur_pedestrian_2026',
        prompt: 'Testing prompt.',
        text: 'Testing reflection text.',
        valuesHighlighted: ['Empathy (Samvedana)'],
        isPublicInPassport: true,
      });

      const passport = await repository.getPassport('user_aarav');
      const credits = await repository.getCredits('user_aarav');

      const sumOfLedger = credits.reduce((sum, c) => sum + c.amount, 0);
      expect(passport.totalCredits).toBe(sumOfLedger);

      const sumOfDimensions = Object.values(passport.creditsByDimension).reduce((sum, val) => sum + val, 0);
      expect(sumOfDimensions).toBe(sumOfLedger);

      // Check all 6 dimensions exist
      expect(passport.creditsByDimension).toHaveProperty('Learning');
      expect(passport.creditsByDimension).toHaveProperty('Observation');
      expect(passport.creditsByDimension).toHaveProperty('Deliberation');
      expect(passport.creditsByDimension).toHaveProperty('Reflection');
      expect(passport.creditsByDimension).toHaveProperty('Contribution');
      expect(passport.creditsByDimension).toHaveProperty('Civic Action');
    });
  });
});
