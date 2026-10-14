import { describe, it, expect, beforeEach } from 'vitest';
import { LocalDemoRepository } from '../src/services/demoRepository';
import { PersistenceService } from '../src/services/persistence';
import { normalizeSessionRecords } from '../src/services/migrations';
import { DEBATE_PHASES, Session } from '../src/types/domain';

describe('Debate Room & Shared Live Session Repository Operations', () => {
  let repository: LocalDemoRepository;

  beforeEach(() => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    repository = new LocalDemoRepository();
  });

  describe('1. Session Context & Seed Normalization', () => {
    it('loads seeded sess_jaipur_01 with typed mode, facilitator, roster, and debate data', async () => {
      const session = await repository.getSession('sess_jaipur_01');
      expect(session).not.toBeNull();
      expect(session?.id).toBe('sess_jaipur_01');
      expect(session?.currentMode).toBe('debate_room');
      expect(session?.facilitatorId).toBe('user_rohan');
      expect(session?.assemblyId).toBe('assembly_jaipur_pedestrian_2026');
      expect(session?.roster.length).toBeGreaterThanOrEqual(7);
      expect(session?.modeTransitions.length).toBeGreaterThanOrEqual(1);
      expect(session?.debateData).toBeDefined();
      expect(session?.debateData?.motion).toContain('tabletop pedestrian crosswalks');
      expect(session?.debateData?.currentPhase).toBe('DISCUSSION');
      expect(session?.debateData?.rulebook.version).toBe('v1.0');
    });

    it('normalizes legacy stored sessions in place without losing user records', () => {
      const db = PersistenceService.loadDatabase();
      // Simulate legacy session without debateData or roster
      db.sessions = [
        {
          id: 'sess_jaipur_01',
          eventId: 'evt_jaipur_assembly_01',
          assemblyId: 'assembly_jaipur_pedestrian_2026',
          title: 'Legacy Deliberation Session',
          agenda: [{ time: '10:00 AM', topic: 'Welcome', presenter: 'Rohan Mehta' }],
          resources: [],
          schemaVersion: 1,
          createdAt: '2026-10-01T00:00:00Z',
          updatedAt: '2026-10-01T00:00:00Z',
        } as unknown as Session,
      ];

      const normalized = normalizeSessionRecords(db);
      const session = normalized.sessions.find((s) => s.id === 'sess_jaipur_01');
      expect(session?.currentMode).toBe('debate_room');
      expect(session?.facilitatorId).toBe('user_rohan');
      expect(session?.roster.length).toBeGreaterThan(0);
      expect(session?.debateData).toBeDefined();
      expect(session?.debateData?.motion).toBeDefined();
      expect(session?.debateData?.speakingQueue).toBeDefined();
    });
  });

  describe('2. Speaking Queue Operations & Security Boundary', () => {
    it('allows a roster participant to request and cancel a speaking turn', async () => {
      // user_vikram is in roster
      const updated = await repository.requestSpeakingTurn('sess_jaipur_01', 'user_vikram');
      const vikramEntry = updated.debateData?.speakingQueue.find((q) => q.userId === 'user_vikram');
      expect(vikramEntry).toBeDefined();
      expect(vikramEntry?.status).toBe('waiting');

      // Cancel turn
      const cancelled = await repository.cancelSpeakingTurn('sess_jaipur_01', 'user_vikram');
      const cancelledEntry = cancelled.debateData?.speakingQueue.find(
        (q) => q.userId === 'user_vikram' && q.status === 'cancelled'
      );
      expect(cancelledEntry).toBeDefined();
    });

    it('rejects duplicate speaking turn requests from the same user', async () => {
      // user_aarav is already waiting in seed queue
      await expect(
        repository.requestSpeakingTurn('sess_jaipur_01', 'user_aarav')
      ).rejects.toThrow(/Duplicate queue entry/);
    });

    it('rejects speaking turn requests from unknown participants outside roster', async () => {
      await expect(
        repository.requestSpeakingTurn('sess_jaipur_01', 'user_unknown_actor')
      ).rejects.toThrow(/Unknown participant/);
    });

    it('rejects speaker recognition by non-facilitators', async () => {
      // user_priya is not the facilitator (user_rohan is)
      await expect(
        repository.recognizeSpeakingTurn('sess_jaipur_01', 'user_priya', 'user_aarav')
      ).rejects.toThrow(/Unauthorized actor action/);
    });

    it('allows facilitator to recognize a waiting speaker and advance turns', async () => {
      // Rohan recognizes Aarav
      const session = await repository.recognizeSpeakingTurn('sess_jaipur_01', 'user_rohan', 'user_aarav');
      expect(session.debateData?.activeSpeakerId).toBe('user_aarav');
      const aaravQueue = session.debateData?.speakingQueue.find((q) => q.userId === 'user_aarav');
      expect(aaravQueue?.status).toBe('speaking');
      expect(aaravQueue?.recognizedAt).toBeDefined();

      // Facilitator advances speaking turn
      const advanced = await repository.advanceSpeakingTurn('sess_jaipur_01', 'user_rohan');
      const aaravCompleted = advanced.debateData?.speakingQueue.find((q) => q.userId === 'user_aarav');
      expect(aaravCompleted?.status).toBe('completed');
    });

    it('rejects recognizing a participant who is not waiting in the queue', async () => {
      await expect(
        repository.recognizeSpeakingTurn('sess_jaipur_01', 'user_rohan', 'user_siddharth')
      ).rejects.toThrow(/Target participant .* is not waiting/);
    });
  });

  describe('3. Text Contribution Rules & Active Debate Phases', () => {
    it('rejects contributions from participants who do not have the recognized floor', async () => {
      // user_vikram is not the active speaker
      await expect(
        repository.postDebateContribution({
          sessionId: 'sess_jaipur_01',
          userId: 'user_vikram',
          text: 'Unrecognized intervention attempt',
        })
      ).rejects.toThrow(/Unauthorized: only the recognized participant/);
    });

    it('allows recognized speaker to post text contribution during active phase', async () => {
      // Recognize Aarav
      await repository.recognizeSpeakingTurn('sess_jaipur_01', 'user_rohan', 'user_aarav');

      const updated = await repository.postDebateContribution({
        sessionId: 'sess_jaipur_01',
        userId: 'user_aarav',
        text: 'Field observations confirm that pedestrian counts exceed 200 students during morning peak.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });

      const lastContrib = updated.debateData?.contributions.slice(-1)[0];
      expect(lastContrib).toBeDefined();
      expect(lastContrib?.userId).toBe('user_aarav');
      expect(lastContrib?.userName).toBe('Aarav Sharma');
      expect(lastContrib?.phase).toBe('DISCUSSION');
      expect(lastContrib?.evidenceIds).toContain('ev_aarav_traffic_count_01');
    });

    it('rejects empty contribution text', async () => {
      await repository.recognizeSpeakingTurn('sess_jaipur_01', 'user_rohan', 'user_aarav');

      await expect(
        repository.postDebateContribution({
          sessionId: 'sess_jaipur_01',
          userId: 'user_aarav',
          text: '   ',
        })
      ).rejects.toThrow(/Contribution text cannot be empty/);
    });
  });

  describe('4. Phase Transitions & Closed Session Enforcement', () => {
    it('rejects phase transitions initiated by non-facilitators', async () => {
      await expect(
        repository.advanceDebatePhase('sess_jaipur_01', 'user_aarav', 'REBUTTAL_OR_QUESTIONS')
      ).rejects.toThrow(/Unauthorized actor action/);
    });

    it('rejects invalid or backward phase transitions', async () => {
      // Current phase is DISCUSSION; jumping backward to OPENING_STATEMENTS is invalid
      await expect(
        repository.advanceDebatePhase('sess_jaipur_01', 'user_rohan', 'OPENING_STATEMENTS')
      ).rejects.toThrow(/cannot skip phases/);
    });

    it('rejects skipping phases (non-sequential phase advancement)', async () => {
      // Current phase is DISCUSSION; attempting to jump directly to CLOSING_STATEMENTS
      await expect(
        repository.advanceDebatePhase('sess_jaipur_01', 'user_rohan', 'CLOSING_STATEMENTS')
      ).rejects.toThrow(/cannot skip phases/);
    });

    it('rejects debate queue/recognition/contribution writes when currentMode is not debate_room', async () => {
      // Switch mode to youth_assembly
      await repository.switchSessionMode('sess_jaipur_01', 'user_rohan', 'youth_assembly');

      await expect(
        repository.requestSpeakingTurn('sess_jaipur_01', 'user_vikram')
      ).rejects.toThrow(/only permitted in debate_room mode/);

      await expect(
        repository.recognizeSpeakingTurn('sess_jaipur_01', 'user_rohan', 'user_aarav')
      ).rejects.toThrow(/only permitted in debate_room mode/);

      await expect(
        repository.postDebateContribution({
          sessionId: 'sess_jaipur_01',
          userId: 'user_aarav',
          text: 'Intervention attempt during assembly mode',
        })
      ).rejects.toThrow(/only permitted in debate_room mode/);

      await expect(
        repository.advanceDebatePhase('sess_jaipur_01', 'user_rohan', 'REBUTTAL_OR_QUESTIONS')
      ).rejects.toThrow(/only permitted in debate_room mode/);
    });

    it('rejects contributions attaching nonexistent or unattached evidence IDs', async () => {
      await repository.recognizeSpeakingTurn('sess_jaipur_01', 'user_rohan', 'user_aarav');

      await expect(
        repository.postDebateContribution({
          sessionId: 'sess_jaipur_01',
          userId: 'user_aarav',
          text: 'Intervention with fake evidence',
          evidenceIds: ['ev_nonexistent_evidence_999'],
        })
      ).rejects.toThrow(/does not exist in repository/);

      // ev_aryan_sensor_01 belongs to assembly_green_canopy_2026, not pedestrian safety assembly
      await expect(
        repository.postDebateContribution({
          sessionId: 'sess_jaipur_01',
          userId: 'user_aarav',
          text: 'Intervention with foreign evidence',
          evidenceIds: ['ev_aryan_sensor_01'],
        })
      ).rejects.toThrow(/not attached to this session's assembly/);
    });

    it('allows sequential phase progression up to CLOSED and rejects writes to closed session', async () => {
      // DISCUSSION -> REBUTTAL_OR_QUESTIONS -> CLOSING_STATEMENTS -> REFLECTION -> CLOSED
      await repository.advanceDebatePhase('sess_jaipur_01', 'user_rohan', 'REBUTTAL_OR_QUESTIONS');
      await repository.advanceDebatePhase('sess_jaipur_01', 'user_rohan', 'CLOSING_STATEMENTS');
      await repository.advanceDebatePhase('sess_jaipur_01', 'user_rohan', 'REFLECTION');
      const closed = await repository.advanceDebatePhase('sess_jaipur_01', 'user_rohan', 'CLOSED');
      expect(closed.debateData?.currentPhase).toBe('CLOSED');

      // Writing to closed session is rejected
      await expect(
        repository.requestSpeakingTurn('sess_jaipur_01', 'user_vikram')
      ).rejects.toThrow(/Session is closed/);

      await expect(
        repository.postDebateContribution({
          sessionId: 'sess_jaipur_01',
          userId: 'user_aarav',
          text: 'Late speech',
        })
      ).rejects.toThrow(/Session is closed/);
    });
  });

  describe('5. Post-Session Reflection & Rulebook Acknowledgement', () => {
    it('saves and reads post-session reflections for the persona with no automatic credit/verification claim', async () => {
      const userBefore = await repository.getUser('user_aarav');
      const creditsBefore = userBefore?.totalCredits || 0;

      const reflection = await repository.addReflection({
        userId: 'user_aarav',
        contextType: 'session',
        contextId: 'sess_jaipur_01',
        prompt: 'How did the debate discussion shape your perspective?',
        text: 'Hearing community feedback reinforced that physical traffic calming is more reliable than paint alone.',
        valuesHighlighted: ['Evidence-based Reasoning', 'Civic Responsibility'],
        isPublicInPassport: true,
      });

      expect(reflection.id).toBeDefined();
      expect(reflection.contextType).toBe('session');
      expect(reflection.contextId).toBe('sess_jaipur_01');
      // Enforces private reflection even if caller passed isPublicInPassport: true
      expect(reflection.isPublicInPassport).toBe(false);

      // Verify no automatic credits awarded for self-reflection
      const userAfter = await repository.getUser('user_aarav');
      expect(userAfter?.totalCredits).toBe(creditsBefore);

      // Verify readable via getSessionReflections for active persona (Aarav)
      const sessionRefls = await repository.getSessionReflections('sess_jaipur_01');
      expect(sessionRefls.some((r) => r.id === reflection.id)).toBe(true);

      const aaravRefls = await repository.getSessionReflections('sess_jaipur_01', 'user_aarav');
      expect(aaravRefls.length).toBeGreaterThanOrEqual(1);
      expect(aaravRefls[0].text).toContain('physical traffic calming');

      // Test persona boundary: Switch to user_vikram
      repository.switchUser('user_vikram');

      // Vikram must NOT see Aarav's private session reflection
      const vikramSessionRefls = await repository.getSessionReflections('sess_jaipur_01');
      expect(vikramSessionRefls.some((r) => r.id === reflection.id)).toBe(false);

      const allVikramRefls = await repository.getReflections();
      expect(allVikramRefls.some((r) => r.id === reflection.id)).toBe(false);

      const singleRefl = await repository.getReflection(reflection.id);
      expect(singleRefl).toBeNull();

      // Switch back to Aarav
      repository.switchUser('user_aarav');
    });

    it('rejects post-session reflection if user is not active persona or not in session roster', async () => {
      // Active user is Aarav; attempting to submit as Vikram
      await expect(
        repository.addReflection({
          userId: 'user_vikram',
          contextType: 'session',
          contextId: 'sess_jaipur_01',
          prompt: 'Prompt',
          text: 'Reflection text',
          valuesHighlighted: [],
          isPublicInPassport: false,
        })
      ).rejects.toThrow(/can only save reflection as the currently active persona/);

      // Switch to an active user not in the session roster
      // user_meera is not in sess_jaipur_01 roster
      repository.switchUser('user_meera');
      await expect(
        repository.addReflection({
          userId: 'user_meera',
          contextType: 'session',
          contextId: 'sess_jaipur_01',
          prompt: 'Prompt',
          text: 'Reflection text',
          valuesHighlighted: [],
          isPublicInPassport: false,
        })
      ).rejects.toThrow(/is not in session .* roster/);

      repository.switchUser('user_aarav');
    });

    it('records and persists rulebook acknowledgement for participants', async () => {
      const updated = await repository.acknowledgeRulebook('sess_jaipur_01', 'user_vikram');
      expect(updated.debateData?.acknowledgedUserIds).toContain('user_vikram');

      // Reject unknown participant
      await expect(
        repository.acknowledgeRulebook('sess_jaipur_01', 'user_unknown_person')
      ).rejects.toThrow(/Unknown participant/);
    });
  });

  describe('6. Mode Switching & Context Preservation', () => {
    it('facilitator switches between Debate Room and Youth Assembly preserving roster, agenda, and debate data', async () => {
      // First post a contribution in debate room
      await repository.recognizeSpeakingTurn('sess_jaipur_01', 'user_rohan', 'user_aarav');
      await repository.postDebateContribution({
        sessionId: 'sess_jaipur_01',
        userId: 'user_aarav',
        text: 'Initial debate intervention before mode switch',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });

      // Switch to Youth Assembly
      const switchedToAssembly = await repository.switchSessionMode(
        'sess_jaipur_01',
        'user_rohan',
        'youth_assembly',
        'Facilitator convened full assembly chamber'
      );

      expect(switchedToAssembly.currentMode).toBe('youth_assembly');
      expect(switchedToAssembly.id).toBe('sess_jaipur_01');
      expect(switchedToAssembly.roster.length).toBeGreaterThanOrEqual(7);
      expect(switchedToAssembly.agenda.length).toBeGreaterThanOrEqual(5);
      expect(switchedToAssembly.modeTransitions.length).toBeGreaterThanOrEqual(2);

      // Verify linked assembly stage & proposition are preserved without overwrite
      const assembly = await repository.getAssembly('assembly_jaipur_pedestrian_2026');
      expect(assembly?.currentStage).toBe('deliberation');
      const proposition = await repository.getProposition('prop_jaipur_pedestrian_01');
      expect(proposition?.question).toContain('Jaipur Municipal Corporation');

      // Switch back to Debate Room
      const switchedBack = await repository.switchSessionMode(
        'sess_jaipur_01',
        'user_rohan',
        'debate_room',
        'Returning to structured debate'
      );

      expect(switchedBack.currentMode).toBe('debate_room');
      // All debate contributions and queue survive
      const lastContrib = switchedBack.debateData?.contributions.slice(-1)[0];
      expect(lastContrib?.text).toBe('Initial debate intervention before mode switch');
    });

    it('rejects mode switching to unsupported modes or by non-facilitators', async () => {
      // Non-facilitator
      await expect(
        repository.switchSessionMode('sess_jaipur_01', 'user_aarav', 'youth_assembly')
      ).rejects.toThrow(/Unauthorized actor action/);

      // Unsupported mode
      await expect(
        repository.switchSessionMode(
          'sess_jaipur_01',
          'user_rohan',
          'youth_parliament'
        )
      ).rejects.toThrow(/Unsupported session mode "youth_parliament"/);

      await expect(
        repository.switchSessionMode(
          'sess_jaipur_01',
          'user_rohan',
          'workshop'
        )
      ).rejects.toThrow(/Unsupported session mode "workshop"/);
    });

    it('persists session updates across localStorage reload', async () => {
      await repository.requestSpeakingTurn('sess_jaipur_01', 'user_vikram');

      // Reload fresh repository instance reading from persisted storage
      const reloadedRepo = new LocalDemoRepository();
      const loaded = await reloadedRepo.getSession('sess_jaipur_01');
      const entry = loaded?.debateData?.speakingQueue.find((q) => q.userId === 'user_vikram');
      expect(entry).toBeDefined();
      expect(entry?.status).toBe('waiting');
    });
  });
});
