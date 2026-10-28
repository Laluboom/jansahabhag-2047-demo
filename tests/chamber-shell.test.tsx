import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  SeatModel,
  SeatItem,
  ChamberHeader,
  ChamberControlBar,
  StageTrack,
  StageTrackStep,
} from '../src/components/session';
import { Disclosure } from '../src/components/ui/Disclosure';

describe('Shared Chamber Shell Components', () => {
  const baseSeat: SeatModel = {
    id: 'seat-test-1',
    name: 'Aroh Mehta',
    role: 'Facilitator',
    sideOrBench: 'Moderator',
    status: 'active',
  };

  describe('1. SeatItem Indicator & Aria-label Enhancements', () => {
    it('renders all three indicators and names them in aria-label when isMuted, isCameraOff, and hasRaisedHand are true', () => {
      const activeStateSeat: SeatModel = {
        ...baseSeat,
        isMuted: true,
        isCameraOff: true,
        hasRaisedHand: true,
      };

      render(<SeatItem seat={activeStateSeat} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      // Aria-label must contain the three new clauses in exact specified order:
      // ", Hand raised, Microphone off, Camera off"
      const ariaLabel = button.getAttribute('aria-label') || '';
      expect(ariaLabel).toContain(', Hand raised, Microphone off, Camera off');
      expect(ariaLabel).toBe(
        'Aroh Mehta, Role: Facilitator, Side or Zone: Moderator, Status: Active Delegate, Hand raised, Microphone off, Camera off'
      );

      // Indicators rendered
      expect(screen.getByTestId('seat-indicator-hand-seat-test-1')).toBeInTheDocument();
      expect(screen.getByTestId('seat-indicator-mic-seat-test-1')).toBeInTheDocument();
      expect(screen.getByTestId('seat-indicator-camera-seat-test-1')).toBeInTheDocument();
    });

    it('still renders mic and camera icons when none of the new indicators are set, and aria-label has none of the three clauses', () => {
      const defaultStateSeat: SeatModel = {
        ...baseSeat,
        isMuted: false,
        isCameraOff: false,
        hasRaisedHand: false,
      };

      render(<SeatItem seat={defaultStateSeat} />);

      const button = screen.getByRole('button');
      const ariaLabel = button.getAttribute('aria-label') || '';

      // Must NOT contain the 3 clauses
      expect(ariaLabel).not.toContain('Hand raised');
      expect(ariaLabel).not.toContain('Microphone off');
      expect(ariaLabel).not.toContain('Camera off');
      expect(ariaLabel).toBe(
        'Aroh Mehta, Role: Facilitator, Side or Zone: Moderator, Status: Active Delegate'
      );

      // Mic and camera icons must STILL be rendered (stable row)
      expect(screen.getByTestId('seat-indicator-mic-seat-test-1')).toBeInTheDocument();
      expect(screen.getByTestId('seat-indicator-camera-seat-test-1')).toBeInTheDocument();

      // Hand icon should not be rendered
      expect(
        screen.queryByTestId('seat-indicator-hand-seat-test-1')
      ).not.toBeInTheDocument();
    });

    it('supports compact prop by dropping the role line', () => {
      const { rerender } = render(<SeatItem seat={baseSeat} compact={false} />);
      expect(screen.getByText('Facilitator')).toBeInTheDocument();

      rerender(<SeatItem seat={baseSeat} compact={true} />);
      expect(screen.queryByText('Facilitator')).not.toBeInTheDocument();
      expect(screen.getByText('Aroh Mehta')).toBeInTheDocument();
    });
  });

  describe('2. ChamberControlBar Simulated Controls & Badge', () => {
    it('marks a control with no handler as aria-disabled="true" with disclaimer title', () => {
      render(
        <ChamberControlBar
          participantCount={12}
          onToggleMute={vi.fn()} // Mute has handler
          // Camera has no handler
          // RaiseHand has no handler
          // Chat has no handler
          // Participants has no handler
          // Leave has no handler
        />
      );

      const muteBtn = screen.getByRole('button', { name: /mute microphone/i });
      expect(muteBtn).not.toHaveAttribute('aria-disabled', 'true');

      const cameraBtn = screen.getByRole('button', { name: /turn off camera|start camera/i });
      expect(cameraBtn).toHaveAttribute('aria-disabled', 'true');
      expect(cameraBtn).toHaveAttribute(
        'title',
        'Simulated control — this demo has no audio or video'
      );

      const moreBtn = screen.getByRole('button', { name: /more options/i });
      expect(moreBtn).toHaveAttribute('aria-disabled', 'true');
      expect(moreBtn).toHaveAttribute(
        'title',
        'Simulated control — this demo has no audio or video'
      );
    });

    it('renders exactly one simulated-controls badge', () => {
      render(<ChamberControlBar participantCount={8} />);

      // Exactly one badge with text 'Simulated controls'
      const badges = screen.getAllByText('Simulated controls');
      expect(badges).toHaveLength(1);
    });

    it('sets aria-pressed on Raise Hand toggle control', () => {
      const { rerender } = render(
        <ChamberControlBar participantCount={5} hasRaisedHand={false} onToggleHand={vi.fn()} />
      );

      const handBtn = screen.getByRole('button', { name: /raise hand/i });
      expect(handBtn).toHaveAttribute('aria-pressed', 'false');

      rerender(
        <ChamberControlBar participantCount={5} hasRaisedHand={true} onToggleHand={vi.fn()} />
      );

      const lowerHandBtn = screen.getByRole('button', { name: /lower hand/i });
      expect(lowerHandBtn).toHaveAttribute('aria-pressed', 'true');
    });

    it('renders participantCount above the label', () => {
      render(<ChamberControlBar participantCount={24} />);
      expect(screen.getByText('24')).toBeInTheDocument();
      expect(screen.getByText('Participants')).toBeInTheDocument();
    });
  });

  describe('3. ChamberHeader Component', () => {
    it('renders chamber title, tagline, timer, rulesSlot, statusSlot, and rose Leave button', () => {
      const onLeave = vi.fn();
      render(
        <ChamberHeader
          title="Constitutional Debate Chamber"
          tagline="Deliberative session on Article 21 rights"
          timer="00:45:00"
          timerLabel="Remaining"
          statusSlot={<span data-testid="live-chip">LIVE</span>}
          rulesSlot={<button data-testid="mock-rules-btn">Rules</button>}
          onLeave={onLeave}
          leaveLabel="Exit Chamber"
        />
      );

      expect(screen.getByText('Constitutional Debate Chamber')).toBeInTheDocument();
      expect(screen.getByText('Deliberative session on Article 21 rights')).toBeInTheDocument();
      expect(screen.getByTestId('live-chip')).toBeInTheDocument();
      expect(screen.getByTestId('mock-rules-btn')).toBeInTheDocument();
      expect(screen.getByTestId('chamber-header-timer')).toHaveTextContent('00:45:00');
      expect(screen.getByTestId('chamber-header-timer')).toHaveTextContent('Remaining:');

      const leaveBtn = screen.getByTestId('chamber-leave-btn');
      expect(leaveBtn).toHaveTextContent('Exit Chamber');
      fireEvent.click(leaveBtn);
      expect(onLeave).toHaveBeenCalledTimes(1);
    });
  });

  describe('4. StageTrack Component', () => {
    const steps: StageTrackStep[] = [
      { id: 'frame', label: 'Frame', description: 'Set the question' },
      { id: 'deliberate', label: 'Deliberate', description: 'Exchange evidence' },
      { id: 'resolve', label: 'Resolve', description: 'Vote or consensus' },
    ];

    it('puts aria-current="step" on the current step and on no other', () => {
      render(<StageTrack steps={steps} currentStepId="deliberate" />);

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);

      expect(items[0]).not.toHaveAttribute('aria-current');
      expect(items[1]).toHaveAttribute('aria-current', 'step');
      expect(items[2]).not.toHaveAttribute('aria-current');

      // Step 1 completed reading
      expect(items[0]).toHaveTextContent('Frame');
      expect(items[0]).toHaveTextContent('(Completed)');

      // Step 2 current
      expect(items[1]).toHaveTextContent('Deliberate');
      expect(items[1]).toHaveTextContent('(Current Step)');

      // Step 3 upcoming
      expect(items[2]).toHaveTextContent('Resolve');
    });
  });

  describe('5. Disclosure Component', () => {
    it('renders closed by default and open with defaultOpen', () => {
      const { unmount } = render(
        <Disclosure summary="Procedural Guidance" testId="disc-closed">
          <p>Hidden deliberation rules</p>
        </Disclosure>
      );

      const closedDetails = screen.getByTestId('disc-closed') as HTMLDetailsElement;
      expect(closedDetails.open).toBe(false);
      expect(closedDetails).not.toHaveAttribute('open');

      unmount();

      render(
        <Disclosure summary="Procedural Guidance" defaultOpen={true} testId="disc-open">
          <p>Visible deliberation rules</p>
        </Disclosure>
      );

      const openDetails = screen.getByTestId('disc-open') as HTMLDetailsElement;
      expect(openDetails.open).toBe(true);
      expect(openDetails).toHaveAttribute('open');
    });

    it('toggles open state when summary is clicked', () => {
      render(
        <Disclosure summary="Toggle Summary" testId="disc-toggle">
          <p>Content to reveal</p>
        </Disclosure>
      );

      const details = screen.getByTestId('disc-toggle') as HTMLDetailsElement;
      const summary = screen.getByText('Toggle Summary');

      expect(details.open).toBe(false);
      fireEvent.click(summary);
      expect(details.open).toBe(true);
      fireEvent.click(summary);
      expect(details.open).toBe(false);
    });
  });
});
