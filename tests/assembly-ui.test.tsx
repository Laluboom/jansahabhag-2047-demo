import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '../src/stores/authStore';
import { PersistenceService } from '../src/services/persistence';
import { demoRepository } from '../src/services/demoRepository';
import { AssembliesPage } from '../src/features/assemblies/AssembliesPage';
import { AssemblyDetailPage } from '../src/features/assemblies/AssemblyDetailPage';
import { AssemblySessionPage } from '../src/features/assemblies/AssemblySessionPage';
import { PropositionDetailPage } from '../src/features/propositions/PropositionDetailPage';
import { PropositionRevisionsPage } from '../src/features/propositions/PropositionRevisionsPage';
import { PassportPage } from '../src/features/passport/PassportPage';
import { CreditsPage } from '../src/features/passport/CreditsPage';
import { EvidencePage } from '../src/features/passport/EvidencePage';
import { AchievementsPage } from '../src/features/passport/AchievementsPage';

describe('Youth Assembly & Civic Passport UI Integration Tests', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    await useAuthStore.getState().initialize();
  });

  it('renders AssembliesPage with fresh join state and filter buttons', async () => {
    render(
      <MemoryRouter>
        <AssembliesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Youth Deliberative Assemblies/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Active Deliberations/i })).toBeInTheDocument();
      expect(screen.getByText(/Jaipur School Zone Pedestrian Safety Youth Assembly 2026/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Join Assembly/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders AssemblyDetailPage with 6-stage roadmap and join state', async () => {
    render(
      <MemoryRouter initialEntries={['/assemblies/assembly_jaipur_pedestrian_2026']}>
        <Routes>
          <Route path="/assemblies/:id" element={<AssemblyDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Jaipur School Zone Pedestrian Safety Youth Assembly 2026/i })).toBeInTheDocument();
      expect(screen.getByText(/Assembly Deliberation Pathway \(6 Stages\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Chamber Evidence Pool/i)).toBeInTheDocument();
      expect(screen.getByText(/Chamber Deliberators/i)).toBeInTheDocument();
    });
  });

  it('renders AssemblySessionPage with 6 stages navigation, role briefing, and interactive workspace', async () => {
    // First join assembly
    await demoRepository.joinAssembly('assembly_jaipur_pedestrian_2026', 'user_aarav');

    render(
      <MemoryRouter initialEntries={['/assemblies/assembly_jaipur_pedestrian_2026/session']}>
        <Routes>
          <Route path="/assemblies/:id/session" element={<AssemblySessionPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Youth Chamber in Session/i)).toBeInTheDocument();
      expect(screen.getByText(/Canonical Deliberation Pathway \(6 Stages\)/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Thinker/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Shaper/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Submit Deliberative Contribution/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Submit Contribution/i })).toBeInTheDocument();
    });
  });

  it('renders PropositionDetailPage with structured fields, dissent preservation, and outcome finalisation', async () => {
    render(
      <MemoryRouter initialEntries={['/propositions/prop_jaipur_pedestrian_01']}>
        <Routes>
          <Route path="/propositions/:id" element={<PropositionDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/1. Problem & Verified Ground Reality/i)).toBeInTheDocument();
      expect(screen.getByText(/2. Core Deliberative Insight/i)).toBeInTheDocument();
      expect(screen.getByText(/3. Proposed Action & Engineering Specifications/i)).toBeInTheDocument();
      expect(screen.getByText(/Key Implementation Enablers/i)).toBeInTheDocument();
      expect(screen.getByText(/Identified Risks & Mitigations/i)).toBeInTheDocument();
      expect(screen.getByText(/Preserved Dissent Records/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Edit Proposition/i })).toBeInTheDocument();
    });
  });

  it('renders PropositionRevisionsPage with revision trail', async () => {
    render(
      <MemoryRouter initialEntries={['/propositions/prop_jaipur_pedestrian_01/revisions']}>
        <Routes>
          <Route path="/propositions/:id/revisions" element={<PropositionRevisionsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Proposition Revision History/i })).toBeInTheDocument();
      expect(screen.getByText(/Version 1/i)).toBeInTheDocument();
    });
  });

  it('renders PassportPage with 6 dimensions, verified activity records, and reflection history', async () => {
    render(
      <MemoryRouter>
        <PassportPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Civic Passport Portfolio/i)).toBeInTheDocument();
      expect(screen.getByText(/Civic Credit Dimensions/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Learning/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Observation/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Deliberation/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Reflection/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Contribution/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Civic Action/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Verified Civic Activity Records/i)).toBeInTheDocument();
    });
  });

  it('renders CreditsPage with dimension filter buttons and transparent award rules', async () => {
    render(
      <MemoryRouter>
        <CreditsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Civic Credit Ledger/i })).toBeInTheDocument();
      expect(screen.getByText(/Transparent Activity Award Rules/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /All Dimensions/i })).toBeInTheDocument();
    });
  });

  it('renders EvidencePage with privacy filters and search bar', async () => {
    render(
      <MemoryRouter>
        <EvidencePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Verifiable Evidence Repository/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /All Evidence/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /My Evidence/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Search evidence or ID/i)).toBeInTheDocument();
    });
  });

  it('renders AchievementsPage with badges and unlocked status', async () => {
    render(
      <MemoryRouter>
        <AchievementsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Civic Badges & Institutional Honors/i })).toBeInTheDocument();
      expect(screen.getByText(/Civic Field Auditor/i)).toBeInTheDocument();
      expect(screen.getByText(/Deliberation Delegate/i)).toBeInTheDocument();
    });
  });
});
