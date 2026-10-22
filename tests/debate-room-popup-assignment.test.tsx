import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LocalDemoRepository, demoRepository } from '../src/services/demoRepository';
import { PersistenceService } from '../src/services/persistence';
import { useAuthStore } from '../src/stores/authStore';
import { DebateRoomPreviewPage } from '../src/components/layout/DebateRoomPreviewPage';
import { AssignmentDetailPage } from '../src/features/assignments/AssignmentDetailPage';

describe('Change Plan v2 #13: Debate Room Controls & Facilitator Popup Assignment', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    await useAuthStore.getState().initialize();
  });

  describe('1. Repository Boundary & Publication Authorization', () => {
    it('allows facilitator to publish a popup assignment using the civic assignment model', async () => {
      // Rohan is the room facilitator
      await useAuthStore.getState().switchPersona('user_rohan');

      const { session, assignment } = await demoRepository.pushDebatePopupAssignment({
        sessionId: 'sess_jaipur_01',
        actorId: 'user_rohan',
        title: 'Speed Radar Analysis Prompt',
        instruction: 'State one immediate infrastructure fix based on speed radar logs.',
        timeLimitMinutes: 10,
      });

      expect(assignment.id).toBeDefined();
      expect(assignment.title).toBe('Speed Radar Analysis Prompt');
      expect(assignment.prompt).toBe('State one immediate infrastructure fix based on speed radar logs.');
      expect(assignment.assignmentType).toBe('civic_assignment');
      expect(assignment.status).toBe('active');
      expect(assignment.creditsReward).toBe(2);

      // Verify session linked popup state
      expect(session.debateData?.activePopupAssignmentId).toBe(assignment.id);
      expect(session.debateData?.popupAssignment?.assignmentId).toBe(assignment.id);
      expect(session.debateData?.popupAssignment?.pushedBy).toBe('user_rohan');
      expect(session.debateData?.popupAssignment?.timeLimitMinutes).toBe(10);
      expect(session.debateData?.popupAssignment?.isClosed).toBe(false);

      // Verify assignment exists in general repository assignments
      const fetchedAsg = await demoRepository.getAssignment(assignment.id);
      expect(fetchedAsg).not.toBeNull();
      expect(fetchedAsg?.title).toBe('Speed Radar Analysis Prompt');
    });

    it('rejects non-facilitator publication attempts at repository boundary', async () => {
      // Aarav is a participant (Questioner), not facilitator
      await useAuthStore.getState().switchPersona('user_aarav');

      await expect(
        demoRepository.pushDebatePopupAssignment({
          sessionId: 'sess_jaipur_01',
          actorId: 'user_aarav',
          title: 'Unauthorized Task',
          instruction: 'Should fail immediately',
          timeLimitMinutes: 5,
        })
      ).rejects.toThrow(/Unauthorized: only the room facilitator can publish a popup assignment/);
    });

    it('rejects publication when actorId does not match active persona', async () => {
      // Active user is Aarav, attempting to claim Rohan's identity
      await useAuthStore.getState().switchPersona('user_aarav');

      await expect(
        demoRepository.pushDebatePopupAssignment({
          sessionId: 'sess_jaipur_01',
          actorId: 'user_rohan',
          title: 'Spoofed Task',
          instruction: 'Should fail spoof guard',
          timeLimitMinutes: 5,
        })
      ).rejects.toThrow(/Unauthorized: actor "user_rohan" does not match active persona "user_aarav"/);
    });
  });

  describe('2. Participant Submission, Evidence Attachment & Privacy Behavior', () => {
    it('allows participant to submit text response with optional evidence, awards pending credits, and preserves privacy', async () => {
      // 1. Facilitator pushes popup task
      await useAuthStore.getState().switchPersona('user_rohan');
      const { assignment } = await demoRepository.pushDebatePopupAssignment({
        sessionId: 'sess_jaipur_01',
        actorId: 'user_rohan',
        title: 'Corridor Safety Rapid Response',
        instruction: 'Identify which crossing requires speed tables first.',
        timeLimitMinutes: 5,
      });

      // 2. Participant Aarav submits response with one of his evidence items
      await useAuthStore.getState().switchPersona('user_aarav');
      const initialCredits = (await demoRepository.getCredits('user_aarav')).filter((c) => c.status === 'Pending').length;

      const submission = await demoRepository.submitAssignment({
        assignmentId: assignment.id,
        userId: 'user_aarav',
        content: 'Madhyam Marg intersection urgently needs tabletop crosswalk tables based on the 420 vph speed radar count.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });

      expect(submission.status).toBe('submitted');
      expect(submission.content).toContain('Madhyam Marg intersection');
      expect(submission.evidenceIds).toContain('ev_aarav_traffic_count_01');

      // Verify pending credit awarded (+2 Contribution)
      const afterCredits = await demoRepository.getCredits('user_aarav');
      const pendingAsgCredits = afterCredits.filter(
        (c) => c.sourceType === 'assignment' && c.sourceId === assignment.id && c.status === 'Pending'
      );
      expect(pendingAsgCredits.length).toBe(1);
      expect(pendingAsgCredits[0].amount).toBe(2);
      expect(pendingAsgCredits[0].dimension).toBe('Contribution');

      // 3. Privacy Boundary: Another participant (Priya) cannot view or mutate Aarav's submission
      await useAuthStore.getState().switchPersona('user_priya');
      const priyaSubs = await demoRepository.getSubmissions('user_aarav', assignment.id);
      // Non-teachers/non-facilitators cannot query another participant's submission
      expect(priyaSubs.length).toBe(0);

      // Attempting to submit on Aarav's behalf fails
      await expect(
        demoRepository.submitAssignment({
          assignmentId: assignment.id,
          userId: 'user_aarav',
          content: 'Malicious modification',
        })
      ).rejects.toThrow(/Unauthorized: cannot submit assignment for another persona/);

      // Facilitator Rohan CAN see the room's submissions
      await useAuthStore.getState().switchPersona('user_rohan');
      const facilitatorSubs = await demoRepository.getSubmissions(undefined, assignment.id);
      expect(facilitatorSubs.length).toBe(1);
      expect(facilitatorSubs[0].userId).toBe('user_aarav');
    });

    it('allows text-only submission when participant has no evidence attached', async () => {
      // Facilitator publishes
      await useAuthStore.getState().switchPersona('user_rohan');
      const { assignment } = await demoRepository.pushDebatePopupAssignment({
        sessionId: 'sess_jaipur_01',
        actorId: 'user_rohan',
        title: 'Text-Only Civic Inquiry',
        instruction: 'What should be the signage distance before the crosswalk?',
        timeLimitMinutes: 5,
      });

      // Participant Kabir submits text only (no evidence)
      await useAuthStore.getState().switchPersona('user_kabir');
      const sub = await demoRepository.submitAssignment({
        assignmentId: assignment.id,
        userId: 'user_kabir',
        content: 'Signage should be posted at 50 meters and 100 meters prior to the tabletop ramp.',
        evidenceIds: [],
      });

      expect(sub.status).toBe('submitted');
      expect(sub.evidenceIds.length).toBe(0);
    });
  });

  describe('3. Close & Expiry States', () => {
    it('facilitator can close popup assignment early, locking submissions', async () => {
      // Facilitator publishes
      await useAuthStore.getState().switchPersona('user_rohan');
      const { session, assignment } = await demoRepository.pushDebatePopupAssignment({
        sessionId: 'sess_jaipur_01',
        actorId: 'user_rohan',
        title: 'Speed Limit Deliberation',
        instruction: 'Propose an IRC speed limit.',
        timeLimitMinutes: 10,
      });

      expect(session.debateData?.popupAssignment?.isClosed).toBe(false);

      // Facilitator closes early
      const closedSession = await demoRepository.closeDebatePopupAssignment('sess_jaipur_01', 'user_rohan');
      expect(closedSession.debateData?.popupAssignment?.isClosed).toBe(true);

      // Verify assignment status became archived
      const asg = await demoRepository.getAssignment(assignment.id);
      expect(asg?.status).toBe('archived');

      // Participant attempting to submit to archived/closed assignment is rejected
      await useAuthStore.getState().switchPersona('user_aarav');
      await expect(
        demoRepository.submitAssignment({
          assignmentId: assignment.id,
          userId: 'user_aarav',
          content: 'Too late submission',
        })
      ).rejects.toThrow(/Cannot submit for inactive assignment/);
    });

    it('non-facilitator cannot close popup assignment', async () => {
      await useAuthStore.getState().switchPersona('user_rohan');
      await demoRepository.pushDebatePopupAssignment({
        sessionId: 'sess_jaipur_01',
        actorId: 'user_rohan',
        title: 'Closing Test',
        instruction: 'Test instruction',
        timeLimitMinutes: 10,
      });

      await useAuthStore.getState().switchPersona('user_aarav');
      await expect(
        demoRepository.closeDebatePopupAssignment('sess_jaipur_01', 'user_aarav')
      ).rejects.toThrow(/Unauthorized: only the room facilitator can close a popup assignment/);
    });
  });

  describe('4. Reload Persistence Across Storage', () => {
    it('persists popup assignment, participant submissions, and chamber votes across reload', async () => {
      // Facilitator pushes popup assignment
      await useAuthStore.getState().switchPersona('user_rohan');
      const { assignment } = await demoRepository.pushDebatePopupAssignment({
        sessionId: 'sess_jaipur_01',
        actorId: 'user_rohan',
        title: 'Persistent Deliberation Task',
        instruction: 'Evaluate pedestrian flow.',
        timeLimitMinutes: 15,
      });

      // Participant votes and submits
      await useAuthStore.getState().switchPersona('user_aarav');
      await demoRepository.castDebateVote('sess_jaipur_01', 'user_aarav', 'for');
      await demoRepository.submitAssignment({
        assignmentId: assignment.id,
        userId: 'user_aarav',
        content: 'Persistent observation notes by Aarav.',
      });

      // Reload brand new repository instance reading from persisted storage
      const reloadedRepo = new LocalDemoRepository();
      const loadedSession = await reloadedRepo.getSession('sess_jaipur_01');

      expect(loadedSession?.debateData?.popupAssignment).toBeDefined();
      expect(loadedSession?.debateData?.popupAssignment?.assignmentId).toBe(assignment.id);
      expect(loadedSession?.debateData?.popupAssignment?.title).toBe('Persistent Deliberation Task');
      expect(loadedSession?.debateData?.votes?.['user_aarav']).toBe('for');

      const loadedAsg = await reloadedRepo.getAssignment(assignment.id);
      expect(loadedAsg).not.toBeNull();
      expect(loadedAsg?.title).toBe('Persistent Deliberation Task');

      const loadedSubs = await reloadedRepo.getSubmissions('user_aarav', assignment.id);
      expect(loadedSubs.length).toBe(1);
      expect(loadedSubs[0].content).toContain('Persistent observation notes');
    });
  });

  describe('5. UI Flow: Facilitator Push, Room Popup, Submission, and Navigation', () => {
    it('facilitator pushes popup assignment from UI, participant fills response, views receipt, and can navigate to submitted assignment', async () => {
      // Step A: Facilitator pushes popup assignment from UI
      await useAuthStore.getState().switchPersona('user_rohan');

      const { rerender } = render(
        <MemoryRouter initialEntries={['/debate-room']}>
          <Routes>
            <Route path="/debate-room" element={<DebateRoomPreviewPage />} />
            <Route path="/assignments/:id" element={<AssignmentDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Verify Facilitator sees Push Popup Assignment button
      await waitFor(() => {
        expect(screen.getByTestId('push-popup-assignment-btn')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('push-popup-assignment-btn'));

      // Fill in popup assignment form
      await waitFor(() => {
        expect(screen.getByTestId('popup-title-input')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId('popup-title-input'), {
        target: { value: 'Zebra Crossing Visibility Audit' },
      });
      fireEvent.change(screen.getByTestId('popup-instruction-input'), {
        target: { value: 'Explain why thermoplastic reflective paint is needed at night.' },
      });
      fireEvent.change(screen.getByTestId('popup-timelimit-input'), {
        target: { value: '10' },
      });

      fireEvent.click(screen.getByTestId('confirm-push-popup-btn'));

      // Verify modal opens with published assignment
      await waitFor(() => {
        expect(screen.getByTestId('debate-popup-assignment-modal')).toBeInTheDocument();
        expect(screen.getByText('Zebra Crossing Visibility Audit')).toBeInTheDocument();
      });

      // Close modal as facilitator
      fireEvent.click(screen.getByTestId('close-popup-modal-btn'));

      // Verify persistent banner remains visible
      await waitFor(() => {
        expect(screen.getByTestId('active-chamber-task-banner')).toBeInTheDocument();
        expect(screen.getByTestId('active-chamber-task-banner').textContent).toContain('Zebra Crossing Visibility Audit');
      });

      // Step B: Switch to Participant Aarav
      await useAuthStore.getState().switchPersona('user_aarav');

      rerender(
        <MemoryRouter initialEntries={['/debate-room']}>
          <Routes>
            <Route path="/debate-room" element={<DebateRoomPreviewPage />} />
            <Route path="/assignments/:id" element={<AssignmentDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Aarav should NOT see facilitator push button
      await waitFor(() => {
        expect(screen.queryByTestId('push-popup-assignment-btn')).not.toBeInTheDocument();
        expect(screen.getByTestId('active-chamber-task-banner')).toBeInTheDocument();
      });

      // Open task modal from persistent banner
      fireEvent.click(screen.getByTestId('open-chamber-task-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('debate-popup-assignment-modal')).toBeInTheDocument();
        expect(screen.getByTestId('popup-instruction-text')).toHaveTextContent(
          'Explain why thermoplastic reflective paint is needed at night.'
        );
      });

      // Fill and submit response
      fireEvent.change(screen.getByTestId('popup-submission-content'), {
        target: {
          value: 'Thermoplastic retro-reflective paint improves driver reaction time under weak streetlighting.',
        },
      });

      fireEvent.click(screen.getByTestId('submit-popup-assignment-btn'));

      // Verify submission receipt appears inside modal
      await waitFor(() => {
        expect(screen.getByTestId('popup-submitted-state')).toBeInTheDocument();
        expect(screen.getByText(/Assignment Submitted Successfully/i)).toBeInTheDocument();
        expect(screen.getByTestId('nav-to-submitted-asg-link')).toBeInTheDocument();
      });

      // Step C: Navigation to submitted assignment
      fireEvent.click(screen.getByTestId('nav-to-submitted-asg-link'));

      await waitFor(() => {
        expect(screen.getByText('Zebra Crossing Visibility Audit')).toBeInTheDocument();
        expect(screen.getByText(/Thermoplastic retro-reflective paint/)).toBeInTheDocument();
      });
    });

    it('renders motion and For/Against counter with no inferred stances and allows participant to vote and raise hand', async () => {
      await useAuthStore.getState().switchPersona('user_aarav');

      render(
        <MemoryRouter initialEntries={['/debate-room']}>
          <Routes>
            <Route path="/debate-room" element={<DebateRoomPreviewPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Verify visible motion is rendered
      await waitFor(() => {
        expect(screen.getByText(/Formal Motion Before The Chamber/i)).toBeInTheDocument();
        expect(screen.getByTestId('for-against-counter')).toBeInTheDocument();
      });

      // Verify initial vote counts
      expect(screen.getByTestId('vote-for-count').textContent).toContain('For: 0');
      expect(screen.getByTestId('vote-against-count').textContent).toContain('Against: 0');

      // Cast explicit "For" vote
      fireEvent.click(screen.getByTestId('vote-for-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('vote-for-count').textContent).toContain('For: 1');
        expect(screen.getByTestId('vote-for-btn').textContent).toContain('Voted For');
      });

      // Switch vote to "Against"
      fireEvent.click(screen.getByTestId('vote-against-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('vote-for-count').textContent).toContain('For: 0');
        expect(screen.getByTestId('vote-against-count').textContent).toContain('Against: 1');
        expect(screen.getByTestId('vote-against-btn').textContent).toContain('Voted Against');
      });

      // Verify speaking queue controls: Aarav is initially waiting in the queue so Withdraw is shown
      expect(screen.getByTestId('cancel-turn-btn')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-turn-btn').textContent).toContain('Withdraw Request');

      // Aarav withdraws request
      fireEvent.click(screen.getByTestId('cancel-turn-btn'));

      // Now Raise Hand (Request Turn) button is present
      await waitFor(() => {
        expect(screen.getByTestId('raise-hand-btn')).toBeInTheDocument();
      });
      expect(screen.getByTestId('raise-hand-btn').textContent).toContain('Raise Hand');
    });

    it('renders speaking timer, Start speech and End speech for recognized floor speaker', async () => {
      // Facilitator recognizes Aarav who is in the speaking queue
      await useAuthStore.getState().switchPersona('user_rohan');
      await demoRepository.recognizeSpeakingTurn('sess_jaipur_01', 'user_rohan', 'user_aarav');

      // Switch to recognized speaker Aarav
      await useAuthStore.getState().switchPersona('user_aarav');

      render(
        <MemoryRouter initialEntries={['/debate-room']}>
          <Routes>
            <Route path="/debate-room" element={<DebateRoomPreviewPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('speaking-timer-display')).toBeInTheDocument();
        expect(screen.getByTestId('start-speech-btn')).toBeInTheDocument();
        expect(screen.getByTestId('end-speech-btn')).toBeInTheDocument();
      });

      // Start speech
      fireEvent.click(screen.getByTestId('start-speech-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('pause-speech-btn')).toBeInTheDocument();
      });

      // End speech
      fireEvent.click(screen.getByTestId('end-speech-btn'));

      await waitFor(() => {
        expect(screen.getByText(/Floor is Open/i)).toBeInTheDocument();
      });
    });

    it('renders expired/closed state when time limit has expired and allows clean modal close without focus trap', async () => {
      // Facilitator pushes task with expired date in the past
      await useAuthStore.getState().switchPersona('user_rohan');
      const { session } = await demoRepository.pushDebatePopupAssignment({
        sessionId: 'sess_jaipur_01',
        actorId: 'user_rohan',
        title: 'Past Time Limit Task',
        instruction: 'This task was pushed earlier.',
        timeLimitMinutes: 1,
      });

      // Force expiresAt into the past to simulate expiry
      const db = PersistenceService.loadDatabase();
      const sess = db.sessions.find((s) => s.id === 'sess_jaipur_01');
      if (sess?.debateData?.popupAssignment) {
        sess.debateData.popupAssignment.expiresAt = new Date(Date.now() - 10000).toISOString();
      }
      PersistenceService.saveDatabase(db);

      // Participant Aarav opens room
      await useAuthStore.getState().switchPersona('user_aarav');

      render(
        <MemoryRouter initialEntries={['/debate-room']}>
          <Routes>
            <Route path="/debate-room" element={<DebateRoomPreviewPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('active-chamber-task-banner')).toBeInTheDocument();
      });

      // Open task modal
      fireEvent.click(screen.getByTestId('open-chamber-task-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('debate-popup-assignment-modal')).toBeInTheDocument();
        expect(screen.getByTestId('popup-closed-state')).toBeInTheDocument();
        expect(screen.getByText(/Task Time Limit Has Expired/i)).toBeInTheDocument();
      });

      // Close modal via labelled Close button
      const closeBtn = screen.getByTestId('close-popup-modal-btn');
      expect(closeBtn).toBeInTheDocument();
      fireEvent.click(closeBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('debate-popup-assignment-modal')).not.toBeInTheDocument();
      });
    });
  });
});
