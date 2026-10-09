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

  it('completing a lesson calculates progress and awards 5 learning credits', async () => {
    const initialCredits = await repository.getCredits('user_aarav');
    const initialTotal = initialCredits.reduce((s, c) => s + c.amount, 0);

    // Complete lesson 3 (les_obs_103)
    const result = await repository.completeLesson('user_aarav', 'les_obs_103');
    expect(result.enrolment.completedLessonIds).toContain('les_obs_103');
    expect(result.enrolment.progressPercent).toBe(75); // 3 of 4 lessons

    const updatedCredits = await repository.getCredits('user_aarav');
    const updatedTotal = updatedCredits.reduce((s, c) => s + c.amount, 0);
    expect(updatedTotal).toBe(initialTotal + 5);

    // Check dashboard reflection
    const dashboard = await repository.getDashboard('user_aarav');
    expect(dashboard.creditSummary.total).toBe(updatedTotal);
  });

  it('submitting an assignment updates submission state and creates activity', async () => {
    const submission = await repository.submitAssignment({
      assignmentId: 'asg_obs_03',
      userId: 'user_aarav',
      content: 'Interviewed 5 peers about Madhyam Marg pedestrian delays.',
      evidenceIds: ['ev_aarav_traffic_count_01'],
    });

    expect(submission.status).toBe('submitted');
    expect(submission.content).toContain('Interviewed 5 peers');

    const subs = await repository.getSubmissions('user_aarav', 'asg_obs_03');
    expect(subs.length).toBe(1);
    expect(subs[0].status).toBe('submitted');
  });

  it('reviewing a submission as teacher verifies it, awards credits, and creates passport entry', async () => {
    // First submit assignment
    const submission = await repository.submitAssignment({
      assignmentId: 'asg_obs_03',
      userId: 'user_aarav',
      content: 'Interviewed 5 peers.',
      evidenceIds: [],
    });

    const initialCredits = (await repository.getCredits('user_aarav')).reduce((s, c) => s + c.amount, 0);

    // Teacher reviews and verifies
    const reviewed = await repository.reviewSubmission({
      submissionId: submission.id,
      reviewerId: 'user_kavita',
      status: 'verified',
      teacherFeedback: 'Excellent qualitative field data.',
      score: 25,
    });

    expect(reviewed.status).toBe('verified');
    expect(reviewed.teacherFeedback).toBe('Excellent qualitative field data.');

    const newCredits = (await repository.getCredits('user_aarav')).reduce((s, c) => s + c.amount, 0);
    expect(newCredits).toBe(initialCredits + 10);

    // Check passport
    const passport = await repository.getPassport('user_aarav');
    const entry = passport.entries.find((p) => p.sourceReferenceId === submission.id);
    expect(entry).toBeDefined();
    expect(entry?.isVerified).toBe(true);
  });

  it('adding an assembly contribution adds 5 deliberation credits and activity entry', async () => {
    const initialCredits = (await repository.getCredits('user_aarav')).reduce((s, c) => s + c.amount, 0);

    const contrib = await repository.addAssemblyContribution({
      assemblyId: 'assembly_jaipur_pedestrian_2026',
      userId: 'user_aarav',
      stage: 'deliberation',
      type: 'question',
      text: 'How will stormwater drainage be incorporated beneath the tabletop crossing?',
    });

    expect(contrib.id).toBeDefined();
    expect(contrib.isSubstantive).toBe(true);

    const updatedCredits = (await repository.getCredits('user_aarav')).reduce((s, c) => s + c.amount, 0);
    expect(updatedCredits).toBe(initialCredits + 5);
  });
});
