import { describe, it, expect, beforeEach } from 'vitest';
import { LocalDemoRepository } from '../src/services/demoRepository';
import { PersistenceService } from '../src/services/persistence';
import { CANONICAL_ASSEMBLY_ROLES, CANONICAL_ASSEMBLY_STAGES, ParticipantResponseState } from '../src/types/domain';
import { migrateDatabase } from '../src/services/migrations';

describe('Package 05 - Youth Assembly Procedure, Roles, Stages, Dissent & Boundaries', () => {
  let repository: LocalDemoRepository;

  beforeEach(() => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    repository = new LocalDemoRepository();
  });

  describe('1. Canonical Four Roles & Deterministic Allocation', () => {
    it('guarantees coverage of all four roles when group size is >= 4', async () => {
      // In seed data, assembly_jaipur_pedestrian_2026 has 7 delegates with all 4 roles represented.
      const roles = await repository.getAssemblyRoles('assembly_jaipur_pedestrian_2026');
      const uniqueRoleNames = new Set(roles.map((r) => r.roleName));
      expect(uniqueRoleNames.has('Thinker')).toBe(true);
      expect(uniqueRoleNames.has('Enabler')).toBe(true);
      expect(uniqueRoleNames.has('Troubleshooter')).toBe(true);
      expect(uniqueRoleNames.has('Shaper')).toBe(true);

      // In initial seed: Thinker=2, Enabler=2, Troubleshooter=2, Shaper=1.
      // Deterministic equitable allocation assigns Shaper to Aarav to achieve perfect balance (2 delegates per role).
      const joinResult = await repository.joinAssembly('assembly_jaipur_pedestrian_2026', 'user_aarav');
      expect(joinResult.role.roleName).toBe('Shaper');
      expect(joinResult.role.power).toBe('Proposition Call');
    });

    it('allocates transparent rotating secondary roles in 3-person mini-deliberation mode', async () => {
      const transitRoles = await repository.getAssemblyRoles('assembly_public_transit_2026');
      expect(transitRoles.length).toBe(3);

      // Verify all 4 canonical roles are covered between primary and secondary roles
      const allCoveredRoles = new Set<string>();
      transitRoles.forEach((r) => {
        allCoveredRoles.add(r.roleName);
        if (r.secondaryRoleName) {
          allCoveredRoles.add(r.secondaryRoleName);
        }
      });

      expect(allCoveredRoles.has('Thinker')).toBe(true);
      expect(allCoveredRoles.has('Enabler')).toBe(true);
      expect(allCoveredRoles.has('Troubleshooter')).toBe(true);
      expect(allCoveredRoles.has('Shaper')).toBe(true);
    });

    it('facilitator role override requires mandatory reason and persists audit record', async () => {
      // Rohan is designated Chair / Facilitator
      await expect(
        repository.overrideAssemblyRole(
          'assembly_jaipur_pedestrian_2026',
          'user_rohan',
          'user_vikram',
          'Shaper',
          '' // Empty reason
        )
      ).rejects.toThrow(/reason|justification/i);

      // Non-facilitator/non-chair attempt is rejected
      await expect(
        repository.overrideAssemblyRole(
          'assembly_jaipur_pedestrian_2026',
          'user_kabir', // Kabir is regular delegate
          'user_vikram',
          'Shaper',
          'Balancing the table'
        )
      ).rejects.toThrow(/unauthorized|chair|facilitator/i);

      // Successful override by Facilitator
      const updatedRole = await repository.overrideAssemblyRole(
        'assembly_jaipur_pedestrian_2026',
        'user_rohan',
        'user_vikram',
        'Shaper',
        'Rebalanced to cover Shaper duties during draft phase'
      );

      expect(updatedRole.roleName).toBe('Shaper');
      expect(updatedRole.power).toBe('Proposition Call');

      // Verify audit trail in assembly
      const assembly = await repository.getAssembly('assembly_jaipur_pedestrian_2026');
      expect(assembly?.roleOverrideAudits).toBeDefined();
      const audit = assembly?.roleOverrideAudits?.find((a) => a.userId === 'user_vikram');
      expect(audit).toBeDefined();
      expect(audit?.previousRole).toBe('Enabler');
      expect(audit?.newRole).toBe('Shaper');
      expect(audit?.reason).toContain('Rebalanced to cover Shaper duties');
    });
  });

  describe('2. Canonical Six Stages & Chair Procedural Power Boundary', () => {
    it('persists canonical stages and denies skipping stages', async () => {
      // Current stage is think (index 1)
      const asm = await repository.getAssembly('assembly_jaipur_pedestrian_2026');
      expect(asm?.currentStage).toBe('think');

      // Chair cannot skip directly from think to shape (skipping enable and troubleshoot)
      await expect(
        repository.updateAssemblyStage('assembly_jaipur_pedestrian_2026', 'shape', 'user_rohan')
      ).rejects.toThrow(/cannot skip stages/i);

      // Chair can advance sequentially: think -> enable
      const updated = await repository.updateAssemblyStage('assembly_jaipur_pedestrian_2026', 'enable', 'user_rohan');
      expect(updated.currentStage).toBe('enable');
    });

    it('denies non-chair participants from advancing or changing official stage', async () => {
      // Kabir is a participant, not Chair
      await expect(
        repository.updateAssemblyStage('assembly_jaipur_pedestrian_2026', 'enable', 'user_kabir')
      ).rejects.toThrow(/unauthorized|chair|facilitator/i);
    });

    it('prevents chair from forcing Consensus when unresolved dissent is recorded', async () => {
      // Attempting to finalise with CONSENSUS when dissent exists must fail
      const prop = await repository.getProposition('prop_jaipur_pedestrian_01');
      expect(prop?.dissent.length).toBeGreaterThan(0);

      await expect(
        repository.finaliseProposition({
          propositionId: 'prop_jaipur_pedestrian_01',
          assemblyId: 'assembly_jaipur_pedestrian_2026',
          outcome: 'CONSENSUS',
          updatedBy: 'Rohan Verma (Facilitator)',
        })
      ).rejects.toThrow(/cannot force consensus when unresolved dissent is recorded/i);

      // Finalising with QUALIFIED_SUPPORT succeeds
      const finalised = await repository.finaliseProposition({
        propositionId: 'prop_jaipur_pedestrian_01',
        assemblyId: 'assembly_jaipur_pedestrian_2026',
        outcome: 'QUALIFIED_SUPPORT',
        updatedBy: 'Rohan Verma (Facilitator)',
      });

      expect(finalised.outcome).toBe('QUALIFIED_SUPPORT');

      // Duplicate finalisation must be blocked
      await expect(
        repository.finaliseProposition({
          propositionId: 'prop_jaipur_pedestrian_01',
          assemblyId: 'assembly_jaipur_pedestrian_2026',
          outcome: 'SPLIT_DECISION',
          updatedBy: 'Rohan Verma (Facilitator)',
        })
      ).rejects.toThrow(/already been finalised/i);
    });
  });

  describe('3. Four Participant Response States & Dissent Preservation', () => {
    it('records participant responses across all four canonical states and updates support profile', async () => {
      await repository.joinAssembly('assembly_jaipur_pedestrian_2026', 'user_aarav');

      // Aarav records Support with reservations
      const propWithResp = await repository.recordPropositionResponse({
        propositionId: 'prop_jaipur_pedestrian_01',
        userId: 'user_aarav',
        responseState: 'Support with reservations',
        reasonOrReservations: 'Must ensure 300mm drainage pipe is inspected before monsoon season.',
      });

      const aaravResp = propWithResp.participantResponses.find((r) => r.userId === 'user_aarav');
      expect(aaravResp).toBeDefined();
      expect(aaravResp?.responseState).toBe('Support with reservations');
      expect(aaravResp?.reasonOrReservations).toContain('drainage pipe');

      // Check support profile incremented
      expect(propWithResp.supportProfile.supportWithModifications).toBeGreaterThanOrEqual(1);

      // Changing response state preserves version history
      const updatedResp = await repository.recordPropositionResponse({
        propositionId: 'prop_jaipur_pedestrian_01',
        userId: 'user_aarav',
        responseState: 'Support',
        reasonOrReservations: 'Drainage specification confirmed in revision.',
      });

      const updatedAaravResp = updatedResp.participantResponses.find((r) => r.userId === 'user_aarav');
      expect(updatedAaravResp?.responseState).toBe('Support');
      expect(updatedAaravResp?.history?.length).toBeGreaterThanOrEqual(1);
    });

    it('dissent records survive proposition revisions and cannot be erased by substantive text edits', async () => {
      const propInitial = await repository.getProposition('prop_jaipur_pedestrian_01');
      const initialDissentCount = propInitial?.dissent.length || 0;
      expect(initialDissentCount).toBeGreaterThan(0);

      // Author updates proposition text
      const propUpdated = await repository.updateProposition({
        propositionId: 'prop_jaipur_pedestrian_01',
        updatedBy: 'Siddharth (Shaper)',
        changesSummary: 'Updated ramp slope to 1:15 IRC standards',
        proposition: 'Revised text ensuring tabletop crossing meets all IRC safety parameters.',
      });

      // Dissent records must remain completely intact
      expect(propUpdated.dissent.length).toBe(initialDissentCount);
      expect(propUpdated.dissent[0].reason.length).toBeGreaterThan(10);
      expect(propUpdated.version).toBeGreaterThan(propInitial!.version);
    });
  });

  describe('4. Issue-Advancing Role Powers and Speaking Queue', () => {
    it('executes role-specific powers with response obligations', async () => {
      // Priya is Thinker
      const action = await repository.executeRolePowerAction({
        assemblyId: 'assembly_jaipur_pedestrian_2026',
        userId: 'user_priya',
        power: 'Question Setter',
        title: 'Challenging peak-hour vehicle counts',
        description: 'Does the 42 km/h average speed account for school van queuing at 7:45 AM?',
      });

      expect(action.power).toBe('Question Setter');
      expect(action.status).toBe('pending_response');
      expect(action.responseObligation).toContain('Enablers and Troubleshooters');

      // Peer responds to obligation
      const addressedAction = await repository.respondToRolePowerAction({
        assemblyId: 'assembly_jaipur_pedestrian_2026',
        actionId: action.id,
        userId: 'user_vikram',
        responseNote: 'Traffic count audit ev_aarav_traffic_count_01 confirms van queuing narrows usable width to 6m.',
      });

      expect(addressedAction.status).toBe('addressed');
      expect(addressedAction.respondedBy).toBe('Vikram Joshi');
    });

    it('manages speaking queue with Chair recognition and release', async () => {
      await repository.joinAssembly('assembly_jaipur_pedestrian_2026', 'user_aarav');

      // Aarav requests speaking turn
      const asmWithQueue = await repository.requestAssemblySpeakingTurn(
        'assembly_jaipur_pedestrian_2026',
        'user_aarav'
      );
      const queueEntry = asmWithQueue.speakingQueue?.find((s) => s.userId === 'user_aarav');
      expect(queueEntry).toBeDefined();
      expect(queueEntry?.status).toBe('waiting');

      // Non-chair cannot recognize speaker
      await expect(
        repository.recognizeAssemblySpeaker('assembly_jaipur_pedestrian_2026', 'user_kabir', 'user_aarav')
      ).rejects.toThrow(/unauthorized|chair|facilitator/i);

      // Chair recognizes Aarav
      const asmRecognized = await repository.recognizeAssemblySpeaker(
        'assembly_jaipur_pedestrian_2026',
        'user_rohan',
        'user_aarav'
      );
      expect(asmRecognized.activeSpeakerId).toBe('user_aarav');

      // Chair releases Aarav
      const asmReleased = await repository.releaseAssemblySpeaker(
        'assembly_jaipur_pedestrian_2026',
        'user_rohan'
      );
      expect(asmReleased.activeSpeakerId).toBeNull();
    });
  });

  describe('5. Schema Migration of Legacy Roles and Stages', () => {
    it('normalizes legacy stages and roles into canonical four roles and six stages during migration', () => {
      const legacyDb: any = {
        schemaVersion: 2,
        users: [],
        courses: [],
        assemblies: [
          {
            id: 'legacy_asm_01',
            title: 'Legacy Assembly',
            currentStage: 'deliberation', // legacy stage
            status: 'active',
            participantUserIds: ['user_legacy_01'],
          },
        ],
        assemblyRoles: [
          {
            id: 'role_legacy_01',
            assemblyId: 'legacy_asm_01',
            userId: 'user_legacy_01',
            roleName: 'Synthesizer', // legacy role
            responsibilities: [],
            promptSuggestions: [],
          },
        ],
        propositions: [],
      };

      const migrated = migrateDatabase(legacyDb);
      expect(migrated.schemaVersion).toBe(3);

      // Legacy stage 'deliberation' maps to 'think'
      expect(migrated.assemblies[0].currentStage).toBe('think');

      // Legacy role 'Synthesizer' maps to canonical 'Shaper' with power 'Proposition Call'
      expect(migrated.assemblyRoles[0].roleName).toBe('Shaper');
      expect(migrated.assemblyRoles[0].power).toBe('Proposition Call');
      expect(migrated.assemblies[0].rulebook).toBeDefined();
    });
  });
});
