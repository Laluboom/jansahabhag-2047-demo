import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '../src/stores/authStore';
import { PersistenceService } from '../src/services/persistence';
import { demoRepository } from '../src/services/demoRepository';
import { DebateRoomPreviewPage } from '../src/components/layout/DebateRoomPreviewPage';

describe('Debate Room Point-of-Use Reservation UI & Owner Controls (Package 08C2)', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    await useAuthStore.getState().initialize();
  });

  it('renders Point-of-Use Reservation Rulebook Banner and opens 7-rule modal', async () => {
    await useAuthStore.getState().switchPersona('VSC-S-001');

    render(
      <MemoryRouter initialEntries={['/debate-room']}>
        <Routes>
          <Route path="/debate-room" element={<DebateRoomPreviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    // 1. Point-of-Use Banner visible
    await waitFor(() => {
      expect(screen.getByTestId('debate-reservation-rulebook-banner')).toBeInTheDocument();
    });

    const banner = screen.getByTestId('debate-reservation-rulebook-banner');
    expect(banner.textContent).toContain('Policy 2026.1-womens-reservation-33');
    expect(banner.textContent).toContain('ceil(0.33 × planned places)');
    expect(banner.textContent).toContain('1-place role requires 1 reserved place');
    expect(banner.textContent).toContain('open speaking queue is not a fixed named role');
    expect(banner.textContent).toContain('Unmet reserved places stay vacant by default');

    // 2. Open Rulebook Modal
    const openBtn = screen.getAllByTestId('open-debate-reservation-rulebook-btn')[0];
    fireEvent.click(openBtn);

    await waitFor(() => {
      expect(screen.getByTestId('debate-reservation-rulebook-modal')).toBeInTheDocument();
    });

    const modal = screen.getByTestId('debate-reservation-rulebook-modal');
    expect(modal.textContent).toContain('Debate Room Reservation & Allocation Rulebook');
    expect(modal.textContent).toContain('Rule 1: Independent 33% Allocation Per Formal Named Role');
    expect(modal.textContent).toContain('Rule 2: Singular 1-Place Roles Rounding (1 Place = 1 Reserved Place)');
    expect(modal.textContent).toContain('Rule 3: Open Speaking Queue is Open Participation (Excluded)');
    expect(modal.textContent).toContain('Rule 4: Unmet Reserved Places Remain Vacant by Default');
    expect(modal.textContent).toContain('Rule 5: Seeded Legacy Appointments & Open Selection Stage');
    expect(modal.textContent).toContain('Rule 6: Small-Cohort Privacy Protection (≤ 3 Places)');
    expect(modal.textContent).toContain('Rule 7: Platform Owner Authority Guard & Audited Exceptions');

    // 3. Close Modal
    const closeBtn = screen.getByTestId('close-debate-reservation-rulebook-btn');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('debate-reservation-rulebook-modal')).not.toBeInTheDocument();
    });
  });

  it('enforces privacy suppression and no eligibility inference for participant view', async () => {
    // Regular participant Aarav
    await useAuthStore.getState().switchPersona('VSC-S-001');

    render(
      <MemoryRouter initialEntries={['/debate-room']}>
        <Routes>
          <Route path="/debate-room" element={<DebateRoomPreviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('debate-reservation-allocations-card')).toBeInTheDocument();
    });

    // Check plan stage indicator
    const stageBadge = screen.getByTestId('debate-role-plan-stage');
    expect(stageBadge.textContent).toContain('Open Selection');
    expect(stageBadge.textContent).toContain('Not Compliant');

    // Check singular 1-place role (Facilitator)
    const facilitatorCard = screen.getByTestId('role-allocation-card-facilitator');
    expect(facilitatorCard).toBeInTheDocument();

    // Privacy protected badge
    expect(facilitatorCard.querySelector('[data-testid="status-privacy-suppressed"]')).toBeInTheDocument();
    expect(facilitatorCard.textContent).toContain('Protected');

    // Category breakdown counts withheld
    expect(facilitatorCard.textContent).toContain('Withheld (Privacy)');

    // Participant controls note
    expect(facilitatorCard.textContent).toContain('Validation governed by Platform Owner');

    // Privileged buttons must not exist for participant
    expect(screen.queryByTestId('approve-role-exception-facilitator')).not.toBeInTheDocument();
    expect(screen.queryByTestId('assign-role-btn-facilitator')).not.toBeInTheDocument();
    expect(screen.queryByTestId('withdraw-role-btn-facilitator')).not.toBeInTheDocument();

    // Verify roster dock does NOT display personal eligibility markers
    const rosterSection = screen.getByText(/Session Roster/i).closest('.border-slate-200');
    expect(rosterSection?.textContent).not.toContain('Eligible');
    expect(rosterSection?.textContent).not.toContain('Ineligible');
    expect(rosterSection?.textContent).not.toContain('Female');
    expect(rosterSection?.textContent).not.toContain('Male');
  });

  it('renders unsuppressed status and privileged controls for Platform Owner', async () => {
    // Platform Owner Demo Administrator
    await useAuthStore.getState().switchPersona('JS-F-001');

    render(
      <MemoryRouter initialEntries={['/debate-room']}>
        <Routes>
          <Route path="/debate-room" element={<DebateRoomPreviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('debate-reservation-allocations-card')).toBeInTheDocument();
    });

    const activePersonaIndicator = screen.getByTestId('active-persona-role-indicator');
    expect(activePersonaIndicator.textContent).toContain('platform_admin');

    // Facilitator card under Platform Owner
    const facilitatorCard = screen.getByTestId('role-allocation-card-facilitator');
    // Not suppressed
    expect(facilitatorCard.querySelector('[data-testid="status-privacy-suppressed"]')).not.toBeInTheDocument();

    // Exact numbers visible
    expect(screen.getByTestId('metric-total-facilitator').textContent).toBe('1');
    expect(screen.getByTestId('metric-reserved-facilitator').textContent).toBe('1');

    // Initial status is legacy record
    expect(facilitatorCard.querySelector('[data-testid="status-unvalidated-legacy"]')).toBeInTheDocument();

    // Owner controls present
    expect(screen.getByTestId('approve-role-exception-facilitator')).toBeInTheDocument();
    expect(screen.getByTestId('finalize-role-facilitator')).toBeInTheDocument();
    expect(screen.getByTestId('assign-role-btn-facilitator')).toBeInTheDocument();
    expect(screen.getByTestId('withdraw-role-btn-facilitator')).toBeInTheDocument();
    expect(screen.getByTestId('capacity-role-btn-facilitator')).toBeInTheDocument();
    expect(screen.getByTestId('view-role-audits-btn-facilitator')).toBeInTheDocument();
  });

  it('demonstrates non-compliant finalization blockage and owner exception approval flow', async () => {
    await useAuthStore.getState().switchPersona('JS-F-001');

    render(
      <MemoryRouter initialEntries={['/debate-room']}>
        <Routes>
          <Route path="/debate-room" element={<DebateRoomPreviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('finalize-role-civic-advocate')).toBeInTheDocument();
    });

    // 1. Attempt to finalize non-compliant Civic Advocate without exception
    fireEvent.click(screen.getByTestId('finalize-role-civic-advocate'));

    await waitFor(() => {
      expect(screen.getByTestId('debate-role-action-error')).toBeInTheDocument();
    });
    expect(screen.getByTestId('debate-role-action-error').textContent).toContain('33% reservation requirement unmet');

    // 2. Open Exception Modal
    fireEvent.click(screen.getByTestId('approve-role-exception-civic-advocate'));

    await waitFor(() => {
      expect(screen.getByTestId('debate-exception-modal')).toBeInTheDocument();
    });

    // Submitting with short reason fails validation
    const reasonInput = screen.getByTestId('debate-exception-reason-input');
    fireEvent.change(reasonInput, { target: { value: 'test' } });
    fireEvent.click(screen.getByTestId('submit-debate-exception-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('debate-exception-error')).toBeInTheDocument();
    });
    expect(screen.getByTestId('debate-exception-error').textContent).toContain('at least 5 characters');

    // Provide substantive reason and submit
    fireEvent.change(reasonInput, {
      target: { value: 'Pilot demo exception: Yash confirmed as Civic Advocate under documented owner exception.' },
    });
    fireEvent.click(screen.getByTestId('submit-debate-exception-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('debate-role-action-success')).toBeInTheDocument();
    });
    expect(screen.getByTestId('debate-role-action-success').textContent).toContain(
      'Platform Owner exception approved for "Civic Advocate"'
    );

    // Verify role status is now Exception Approved
    const card = screen.getByTestId('role-allocation-card-civic-advocate');
    expect(card.querySelector('[data-testid="status-finalized-exception"]')).toBeInTheDocument();
    expect(card.textContent).toContain('Exception Approved');

    // Verify visible audit box
    expect(card.querySelector('[data-testid="role-exception-audit-box"]')).toBeInTheDocument();
    expect(card.textContent).toContain('Yash confirmed as Civic Advocate');
  });

  it('allows finalization of compliant role allocation (Evidence Analyst with Priya)', async () => {
    await useAuthStore.getState().switchPersona('JS-F-001');

    render(
      <MemoryRouter initialEntries={['/debate-room']}>
        <Routes>
          <Route path="/debate-room" element={<DebateRoomPreviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('finalize-role-evidence-analyst')).toBeInTheDocument();
    });

    // Evidence Analyst is occupied by Priya (eligible woman participant)
    fireEvent.click(screen.getByTestId('finalize-role-evidence-analyst'));

    await waitFor(() => {
      expect(screen.getByTestId('debate-role-action-success')).toBeInTheDocument();
    });
    expect(screen.getByTestId('debate-role-action-success').textContent).toContain(
      'Role allocation for "Evidence Analyst" has been successfully finalized!'
    );

    const eaCard = screen.getByTestId('role-allocation-card-evidence-analyst');
    expect(eaCard.querySelector('[data-testid="status-finalized-compliant"]')).toBeInTheDocument();
    expect(eaCard.textContent).toContain('Compliant');
  });

  it('reloads full session projection on persona switch, hiding owner data from participant', async () => {
    // 1. Start as Platform Owner and approve exception on Facilitator
    await useAuthStore.getState().switchPersona('JS-F-001');
    await demoRepository.approveSessionRoleException(
      'sess_jaipur_01',
      'Facilitator',
      'Pilot exception for Rohan',
      'JS-F-001'
    );

    const { rerender } = render(
      <MemoryRouter initialEntries={['/debate-room']}>
        <Routes>
          <Route path="/debate-room" element={<DebateRoomPreviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const facCard = screen.getByTestId('role-allocation-card-facilitator');
      expect(facCard.textContent).toContain('Exception Approved');
      expect(facCard.textContent).toContain('Pilot exception for Rohan');
    });

    // 2. Switch persona to regular participant Aarav
    await useAuthStore.getState().switchPersona('VSC-S-001');

    rerender(
      <MemoryRouter initialEntries={['/debate-room']}>
        <Routes>
          <Route path="/debate-room" element={<DebateRoomPreviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const facCard = screen.getByTestId('role-allocation-card-facilitator');
      // Under participant projection, status is suppressed to Protected
      expect(facCard.querySelector('[data-testid="status-privacy-suppressed"]')).toBeInTheDocument();
      expect(facCard.textContent).toContain('Protected');
      // Exception reason and audit box are stripped and completely absent
      expect(facCard.textContent).not.toContain('Pilot exception for Rohan');
      expect(facCard.querySelector('[data-testid="role-exception-audit-box"]')).not.toBeInTheDocument();
      // Counts are withheld
      expect(facCard.textContent).toContain('Withheld (Privacy)');
    });
  });

  it('demonstrates vacancy claim denial for ineligible user and eligible assignment', async () => {
    await useAuthStore.getState().switchPersona('JS-F-001');

    render(
      <MemoryRouter initialEntries={['/debate-room']}>
        <Routes>
          <Route path="/debate-room" element={<DebateRoomPreviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('withdraw-role-btn-community-voice')).toBeInTheDocument();
    });

    // 1. Withdraw Kabir to make Community Voice vacant
    fireEvent.click(screen.getByTestId('withdraw-role-btn-community-voice'));

    await waitFor(() => {
      expect(screen.getByTestId('debate-role-action-success')).toBeInTheDocument();
    });
    expect(screen.getByTestId('debate-role-action-success').textContent).toContain('vacant by default');

    // 2. Try to assign ineligible candidate (Vikram)
    fireEvent.click(screen.getByTestId('assign-role-btn-community-voice'));

    await waitFor(() => {
      expect(screen.getByTestId('debate-assign-modal')).toBeInTheDocument();
    });

    const userSelect = screen.getByTestId('assign-user-select');
    // VSC-S-005 is ineligible
    fireEvent.change(userSelect, { target: { value: 'VSC-S-005' } });
    fireEvent.click(screen.getByTestId('submit-debate-assign-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('debate-assign-error')).toBeInTheDocument();
    });
    expect(screen.getByTestId('debate-assign-error').textContent).toContain('reservation policy');

    // 3. Assign eligible candidate (Harshita)
    // VSC-S-003 is eligible
    fireEvent.change(userSelect, { target: { value: 'VSC-S-003' } });
    fireEvent.click(screen.getByTestId('submit-debate-assign-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('debate-role-action-success')).toBeInTheDocument();
    });
    expect(screen.getByTestId('debate-role-action-success').textContent).toContain(
      'User assigned successfully to role "Community Voice"'
    );
  });
});
