import { describe, it, expect, beforeEach } from 'vitest';
import { demoRepository } from '../src/services/demoRepository';
import { PersistenceService } from '../src/services/persistence';

describe('Persona Switching & Shared State Isolation', () => {
  beforeEach(() => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
  });

  it('switches persona successfully and resolves updated active user', async () => {
    const user1 = await demoRepository.getCurrentUser();
    expect(user1.id).toBe('VSC-S-001');
    expect(user1.role).toBe('participant');

    const switched = await demoRepository.switchUser('VSC-T-001');
    expect(switched.id).toBe('VSC-T-001');
    expect(switched.role).toBe('teacher');

    const current = await demoRepository.getCurrentUser();
    expect(current.id).toBe('VSC-T-001');
  });

  it('preserves data mutations across persona transitions', async () => {
    // Participant Ankita submits an assignment
    await demoRepository.submitAssignment({
      assignmentId: 'asg_obs_03',
      userId: 'VSC-S-001',
      content: 'Ankita field observation notes.',
      evidenceIds: ['ev_aarav_interview_05'],
    });

    // Switch to Teacher Mayur
    await demoRepository.switchUser('VSC-T-001');
    const teacherSubs = await demoRepository.getSubmissions(undefined, 'asg_obs_03');
    const ankitaSub = teacherSubs.find((s) => s.userId === 'VSC-S-001');
    expect(ankitaSub).toBeDefined();
    expect(ankitaSub?.content).toBe('Ankita field observation notes.');

    // Teacher verifies submission
    await demoRepository.reviewSubmission({
      submissionId: ankitaSub!.id,
      reviewerId: 'VSC-T-001',
      status: 'verified',
      teacherFeedback: 'Verified by Mayur.',
    });

    // Switch back to Ankita and verify status is reflected immediately
    await demoRepository.switchUser('VSC-S-001');
    const studentSubs = await demoRepository.getSubmissions('VSC-S-001', 'asg_obs_03');
    expect(studentSubs[0].status).toBe('verified');
    expect(studentSubs[0].teacherFeedback).toBe('Verified by Mayur.');
  });
});
