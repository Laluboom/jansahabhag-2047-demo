import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '../src/stores/authStore';
import { PersistenceService } from '../src/services/persistence';
import { demoRepository } from '../src/services/demoRepository';
import { RoleAwareAiService, SEEDED_ROLE_SUGGESTIONS } from '../src/services/roleAwareAiService';
import { HelpRulebooksPage } from '../src/components/layout/HelpRulebooksPage';
import { StudioPage } from '../src/features/previews/StudioPage';
import { AnalyticsPage } from '../src/features/analytics/AnalyticsPage';
import { ScopedModeratorGrant } from '../src/types/domain';

describe('Change Plan v2 §15 & Review Additions #5: Role-Aware AI Mock', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    RoleAwareAiService.resetAll();
    await useAuthStore.getState().initialize();
  });

  describe('1. Participant Persona (VSC-S-001) Practice Prompts', () => {
    it('participant receives optional practice prompts and does NOT receive facilitator agendas or moderator report summaries', async () => {
      await useAuthStore.getState().switchPersona('VSC-S-001');

      render(
        <MemoryRouter initialEntries={['/help']}>
          <Routes>
            <Route path="/help" element={<HelpRulebooksPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Verify Role-Aware Assistant Surface is present
      await waitFor(() => {
        expect(screen.getByTestId('role-aware-assistant-surface')).toBeInTheDocument();
      });

      // Active persona badge shows participant
      expect(screen.getByText(/Active Persona:/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Ankita Kapri/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Participant/i).length).toBeGreaterThanOrEqual(1);

      // Core banner and concise notice
      expect(screen.getAllByText(/AI assists, people decide\./i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Demo Suggestion • Not an Active Generative Model/i)).toBeInTheDocument();

      // Non-binding disclaimer
      expect(
        screen.getByText(/never decide credits, evidence verification, speaking queues, moderation, or appeals/i)
      ).toBeInTheDocument();

      // Practice prompts are present
      expect(screen.getByText(/Practice Prompt: Opening Deliberation Statement/i)).toBeInTheDocument();
      expect(screen.getByText(/Practice Prompt: Addressing Stakeholder Trade-offs/i)).toBeInTheDocument();
      expect(screen.getByText(/Practice Prompt: Drafting a Measurable Proposition Clause/i)).toBeInTheDocument();

      // Facilitator and moderator content MUST NOT appear
      expect(screen.queryByText(/Draft Candidate Agenda: Ward (8|24) (Rajkot|Jaipur) Youth Assembly/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Draft Report Summary: Public Field Submissions/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Draft Report Summary: Workspace Conduct & Channels/i)).not.toBeInTheDocument();
    });
  });

  describe('2. Facilitator Persona (VSC-S-009) Draft Agendas', () => {
    it('facilitator receives draft candidate agenda and does NOT receive participant practice prompts or moderator reports', async () => {
      await useAuthStore.getState().switchPersona('VSC-S-009');

      render(
        <MemoryRouter initialEntries={['/help']}>
          <Routes>
            <Route path="/help" element={<HelpRulebooksPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('role-aware-assistant-surface')).toBeInTheDocument();
      });

      // Active persona shows facilitator
      expect(screen.getAllByText(/Aroh Mehta/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Facilitator/i).length).toBeGreaterThanOrEqual(1);

      // Draft agenda items are present
      expect(screen.getByText(/Draft Candidate Agenda: Ward (8|24) (Rajkot|Jaipur) Youth Assembly/i)).toBeInTheDocument();
      expect(screen.getByText(/Draft Candidate Agenda: Rapid Parliamentary Debate Practice/i)).toBeInTheDocument();
      expect(screen.getByText(/Proposed 6-Stage Deliberation Schedule/i)).toBeInTheDocument();

      // Participant prompts and moderator reports MUST NOT appear
      expect(screen.queryByText(/Practice Prompt: Opening Deliberation Statement/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Draft Report Summary: Public Field Submissions/i)).not.toBeInTheDocument();
    });
  });

  describe('3. Scoped Moderator Persona (JS-M-001) Active Scope Synthesis', () => {
    it('scoped moderator receives draft report summaries strictly aligned with active founder grants', async () => {
      await useAuthStore.getState().switchPersona('JS-M-001');

      render(
        <MemoryRouter initialEntries={['/help']}>
          <Routes>
            <Route path="/help" element={<HelpRulebooksPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('role-aware-assistant-surface')).toBeInTheDocument();
      });

      // Persona shows Yashvi Dalsaniya (Moderator)
      expect(screen.getAllByText(/Yashvi Dalsaniya/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Moderator/i).length).toBeGreaterThanOrEqual(1);

      // Active scopes displayed (assignments, memberships, named_session)
      expect(screen.getByText(/Founder-Delegated Scopes:/i)).toBeInTheDocument();
      expect(screen.getAllByText(/assignments/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/memberships/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Session \(sess_jaipur_01\)/i).length).toBeGreaterThanOrEqual(1);

      // Draft report summaries for active scopes are present
      expect(screen.getByText(/Draft Report Summary: Public Field Submissions/i)).toBeInTheDocument();
      expect(screen.getByText(/Draft Report Summary: Workspace Conduct & Channels/i)).toBeInTheDocument();
      expect(screen.getByText(/Draft Report Summary: Session sess_jaipur_01 Decorum/i)).toBeInTheDocument();

      // Participant prompts and facilitator agendas MUST NOT appear
      expect(screen.queryByText(/Practice Prompt: Opening Deliberation Statement/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Draft Candidate Agenda: Ward (8|24) (Rajkot|Jaipur) Youth Assembly/i)).not.toBeInTheDocument();
    });

    it('filters draft report summaries when moderator has only a single active scope', async () => {
      const mockUser = {
        id: 'user_mod_single',
        name: 'Single Scope Mod',
        role: 'moderator' as const,
        email: 'mod.single@test.com',
        username: 'mod.single',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        institutionId: 'inst_navchetna_jaipur',
        institutionName: 'Navchetna School',
        programmeIds: [],
        bio: 'Single scope moderator',
        age: 25,
        location: 'Jaipur',
        badgeCount: 0,
        totalCredits: 0,
        schemaVersion: 1,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      };

      const singleScopeGrant: ScopedModeratorGrant[] = [
        {
          id: 'grant_asg_only',
          granteeId: 'user_mod_single',
          granteeName: 'Single Scope Mod',
          granteeRole: 'moderator',
          grantorId: 'JS-F-001',
          grantorName: 'Admin',
          grantorRole: 'platform_admin',
          scope: { type: 'assignments', description: 'Assignments only' },
          reason: 'Test assignment scope',
          createdAt: '2026-10-01T00:00:00Z',
          expiresAt: '2026-12-01T00:00:00Z',
          status: 'active',
          schemaVersion: 1,
        },
      ];

      const sugs = RoleAwareAiService.getSuggestionsForContext(mockUser, singleScopeGrant);

      // Only assignments report summary is returned
      expect(sugs.length).toBe(1);
      expect(sugs[0].scopeType).toBe('assignments');
      expect(sugs[0].title).toContain('Public Field Submissions');

      // Memberships and named session are excluded
      expect(sugs.some((s) => s.scopeType === 'memberships')).toBe(false);
      expect(sugs.some((s) => s.scopeType === 'named_session')).toBe(false);
    });

    it('displays honest notice when a moderator holds no active founder-delegated grants', async () => {
      const mockUser = {
        id: 'user_mod_none',
        name: 'No Grants Mod',
        role: 'moderator' as const,
        email: 'mod.none@test.com',
        username: 'mod.none',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        institutionId: 'inst_navchetna_jaipur',
        institutionName: 'Navchetna School',
        programmeIds: [],
        bio: 'No grants moderator',
        age: 25,
        location: 'Jaipur',
        badgeCount: 0,
        totalCredits: 0,
        schemaVersion: 1,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      };

      // Empty active grants
      const sugs = RoleAwareAiService.getSuggestionsForContext(mockUser, []);
      expect(sugs).toEqual([]);
    });

    it('regression: excludes session summary when moderator is granted only a different session ID', async () => {
      const mockUser = {
        id: 'user_mod_diff_ses',
        name: 'Different Session Mod',
        role: 'moderator' as const,
        email: 'mod.diff@test.com',
        username: 'mod.diff',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        institutionId: 'inst_rtu_kota',
        institutionName: 'RTU Kota',
        programmeIds: [],
        bio: 'Kota session moderator',
        age: 26,
        location: 'Kota',
        badgeCount: 0,
        totalCredits: 0,
        schemaVersion: 1,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      };

      // Grant is for 'sess_kota_02', NOT 'sess_jaipur_01'
      const differentSessionGrant: ScopedModeratorGrant[] = [
        {
          id: 'grant_mod_kota_01',
          granteeId: 'user_mod_diff_ses',
          granteeName: 'Different Session Mod',
          granteeRole: 'moderator',
          grantorId: 'JS-F-001',
          grantorName: 'Admin',
          grantorRole: 'platform_admin',
          scope: {
            type: 'named_session',
            sessionId: 'sess_kota_02',
            sessionTitle: 'Kota Deliberation Assembly',
            description: 'Queue moderation for sess_kota_02',
          },
          reason: 'Session co-moderation for Kota',
          createdAt: '2026-10-01T00:00:00Z',
          expiresAt: '2026-12-01T00:00:00Z',
          status: 'active',
          schemaVersion: 1,
        },
      ];

      const sugs = RoleAwareAiService.getSuggestionsForContext(mockUser, differentSessionGrant);

      // Must NOT return sess_jaipur_01 summary
      expect(sugs.length).toBe(0);
      expect(sugs.some((s) => s.scopeSessionId === 'sess_jaipur_01')).toBe(false);
      expect(sugs.some((s) => s.title.includes('sess_jaipur_01'))).toBe(false);
    });

    it('regression: excludes grants belonging to another grantee and does not show their scope summaries', async () => {
      const mockUserA = {
        id: 'user_mod_alice',
        name: 'Alice Moderator',
        role: 'moderator' as const,
        email: 'alice@test.com',
        username: 'alice.mod',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        institutionId: 'inst_navchetna_jaipur',
        institutionName: 'Navchetna School',
        programmeIds: [],
        bio: 'Alice',
        age: 27,
        location: 'Jaipur',
        badgeCount: 0,
        totalCredits: 0,
        schemaVersion: 1,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      };

      // Grant belongs to user_mod_bob, NOT user_mod_alice
      const bobGrants: ScopedModeratorGrant[] = [
        {
          id: 'grant_bob_asg',
          granteeId: 'user_mod_bob',
          granteeName: 'Bob Moderator',
          granteeRole: 'moderator',
          grantorId: 'JS-F-001',
          grantorName: 'Admin',
          grantorRole: 'platform_admin',
          scope: { type: 'assignments', description: 'Bob assignment review' },
          reason: 'Grant for Bob only',
          createdAt: '2026-10-01T00:00:00Z',
          expiresAt: '2026-12-01T00:00:00Z',
          status: 'active',
          schemaVersion: 1,
        },
      ];

      const sugs = RoleAwareAiService.getSuggestionsForContext(mockUserA, bobGrants);

      // Must reject bobGrants because granteeId !== mockUserA.id
      expect(sugs).toEqual([]);
    });
  });

  describe('4. Strict Privacy Isolation: No Private Evidence or UHV Reflections', () => {
    it('ensures seeded content contains zero private UHV reflections or restricted evidence', () => {
      for (const sug of SEEDED_ROLE_SUGGESTIONS) {
        expect(RoleAwareAiService.verifyContentExcludesPrivateData(sug.content)).toBe(true);
        expect(RoleAwareAiService.verifyContentExcludesPrivateData(sug.title)).toBe(true);

        // Explicit prohibited phrases check
        const lowerContent = sug.content.toLowerCase();
        expect(lowerContent).not.toContain('harmony in relationships');
        expect(lowerContent).not.toContain('personal notes exploring harmony');
        expect(lowerContent).not.toContain('self-inquiry observations on family harmony');
        expect(lowerContent).not.toContain('unblurred face photo');
        expect(lowerContent).not.toContain('restricted facial media');
      }
    });

    it('ensures moderator summaries explicitly verify that private UHV reflections were not ingested', async () => {
      await useAuthStore.getState().switchPersona('JS-M-001');

      render(
        <MemoryRouter initialEntries={['/help']}>
          <Routes>
            <Route path="/help" element={<HelpRulebooksPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('role-aware-assistant-surface')).toBeInTheDocument();
      });

      // Check explicit exclusion notice in the summary text
      expect(
        screen.getByText(/0 private student vault records and 0 private UHV reflection logs were accessed/i)
      ).toBeInTheDocument();

      // Check privacy invariant footer
      expect(
        screen.getByText(/Privacy Invariant Verified: Zero private UHV reflections or restricted evidence accessed/i)
      ).toBeInTheDocument();
    });
  });

  describe('5. Editable & Dismissible Suggestion Interactions', () => {
    it('allows editing a suggestion in-place, saves the edit, and allows resetting back to seed', async () => {
      await useAuthStore.getState().switchPersona('VSC-S-001');

      render(
        <MemoryRouter initialEntries={['/help']}>
          <Routes>
            <Route path="/help" element={<HelpRulebooksPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('btn-edit-sug_part_prompt_01')).toBeInTheDocument();
      });

      // Click Edit button
      fireEvent.click(screen.getByTestId('btn-edit-sug_part_prompt_01'));

      // Textarea appears with existing content
      const textarea = screen.getByTestId('input-edit-sug_part_prompt_01') as HTMLTextAreaElement;
      expect(textarea).toBeInTheDocument();

      // Modify the text
      fireEvent.change(textarea, {
        target: { value: 'Customized practice statement: Focus on pedestrian crossing at Gate 2.' },
      });

      // Save changes
      fireEvent.click(screen.getByTestId('btn-save-sug_part_prompt_01'));

      // Verify edited text is now displayed with "Edited" badge
      await waitFor(() => {
        expect(
          screen.getByText(/Customized practice statement: Focus on pedestrian crossing at Gate 2\./i)
        ).toBeInTheDocument();
        expect(screen.getAllByText(/Edited/i).length).toBeGreaterThanOrEqual(1);
      });

      // Reset back to original seed
      const resetBtn = screen.getByTestId('btn-reset-sug_part_prompt_01');
      fireEvent.click(resetBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Draft a 60-second opening statement on the Kalawad Road Ward 8 pedestrian-safety proposal/i)
        ).toBeInTheDocument();
      });
    });

    it('allows dismissing a suggestion, shows dismissed count, and restores dismissed suggestions', async () => {
      await useAuthStore.getState().switchPersona('VSC-S-001');

      render(
        <MemoryRouter initialEntries={['/help']}>
          <Routes>
            <Route path="/help" element={<HelpRulebooksPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('btn-dismiss-sug_part_prompt_01')).toBeInTheDocument();
      });

      // Dismiss the first prompt
      fireEvent.click(screen.getByTestId('btn-dismiss-sug_part_prompt_01'));

      await waitFor(() => {
        expect(screen.queryByText(/Practice Prompt: Opening Deliberation Statement/i)).not.toBeInTheDocument();
        expect(screen.getByText(/1 suggestion currently dismissed\./i)).toBeInTheDocument();
      });

      // Restore all
      fireEvent.click(screen.getByTestId('btn-restore-all-suggestions'));

      await waitFor(() => {
        expect(screen.getByText(/Practice Prompt: Opening Deliberation Statement/i)).toBeInTheDocument();
      });
    });
  });

  describe('6. Preserved Existing AI Disclosures & Boundaries', () => {
    it('preserves the original AI Boundaries Policy Panel on HelpRulebooksPage', async () => {
      render(
        <MemoryRouter initialEntries={['/help']}>
          <Routes>
            <Route path="/help" element={<HelpRulebooksPage />} />
          </Routes>
        </MemoryRouter>
      );

      // AI Boundaries: Policy & Principles is preserved
      expect(screen.getByRole('heading', { name: /AI Boundaries: Policy & Principles/i })).toBeInTheDocument();
      expect(screen.getByText(/Where AI may assist \(if built\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Strictly prohibited \(AI must not\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Suggest practice prompts for mock deliberations\./i)).toBeInTheDocument();
      expect(screen.getByText(/Draft candidate agendas for assembly sessions\./i)).toBeInTheDocument();
      expect(screen.getByText(/Access or ingest private UHV reflections\./i)).toBeInTheDocument();
    });

    it('preserves the simulated AI engine disclosure on StudioPage', async () => {
      render(
        <MemoryRouter initialEntries={['/studio']}>
          <Routes>
            <Route path="/studio" element={<StudioPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Civic Studio & Campaign Creator/i)).toBeInTheDocument();
      });

      // Open a tool to check modal disclosure
      const launchBtns = screen.getAllByRole('button', { name: /Launch Creator/i });
      fireEvent.click(launchBtns[0]);

      await waitFor(() => {
        expect(screen.getByText(/Simulated AI Engine:/i)).toBeInTheDocument();
        expect(screen.getByText(/Studio layout templates are generated dynamically/i)).toBeInTheDocument();
      });
    });

    it('preserves the simulated AI civic intelligence synthesis on AnalyticsPage', async () => {
      render(
        <MemoryRouter initialEntries={['/analytics']}>
          <Routes>
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Simulated AI Civic Intelligence Synthesis/i)).toBeInTheDocument();
        expect(screen.getByText(/Simulated AI Disclosure:/i)).toBeInTheDocument();
        expect(screen.getByText(/never make binding statutory, moderation, or democratic policy decisions/i)).toBeInTheDocument();
      });
    });
  });
});
