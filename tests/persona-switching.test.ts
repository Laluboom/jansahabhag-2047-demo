import { describe, it, expect, beforeEach } from 'vitest';
import { demoRepository } from '../src/services/demoRepository';
import { PersistenceService } from '../src/services/persistence';
import { useAuthStore } from '../src/stores/authStore';

describe('Persona Switching & Shared State Isolation', () => {
  beforeEach(() => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
  });

  it('switches persona successfully and resolves updated active user', async () => {
    const user1 = await demoRepository.getCurrentUser();
    expect(user1.id).toBe('user_aarav');
    expect(user1.role).toBe('participant');

    const switched = await demoRepository.switchUser('user_kavita');
    expect(switched.id).toBe('user_kavita');
    expect(switched.role).toBe('teacher');

    const current = await demoRepository.getCurrentUser();
    expect(current.id).toBe('user_kavita');
  });

  it('preserves data mutations across persona transitions', async () => {
    // Participant Aarav submits an assignment
    await demoRepository.submitAssignment({
      assignmentId: 'asg_obs_03',
      userId: 'user_aarav',
      content: 'Aarav field observation notes.',
      evidenceIds: [],
    });

    // Switch to Teacher Kavita
    await demoRepository.switchUser('user_kavita');
    const teacherSubs = await demoRepository.getSubmissions(undefined, 'asg_obs_03');
    const aaravSub = teacherSubs.find((s) => s.userId === 'user_aarav');
    expect(aaravSub).toBeDefined();
    expect(aaravSub?.content).toBe('Aarav field observation notes.');

    // Teacher verifies submission
    await demoRepository.reviewSubmission({
      submissionId: aaravSub!.id,
      reviewerId: 'user_kavita',
      status: 'verified',
      teacherFeedback: 'Verified by Kavita.',
    });

    // Switch back to Aarav and verify status is reflected immediately
    await demoRepository.switchUser('user_aarav');
    const studentSubs = await demoRepository.getSubmissions('user_aarav', 'asg_obs_03');
    expect(studentSubs[0].status).toBe('verified');
    expect(studentSubs[0].teacherFeedback).toBe('Verified by Kavita.');
  });
});
