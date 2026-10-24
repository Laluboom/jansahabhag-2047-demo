import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '../src/stores/authStore';
import { getFreshSeedDatabase } from '../src/data/seed';
import { PointOfUseRulesButton } from '../src/components/ui/PointOfUseRulesButton';
import { ParticipantDashboardPage } from '../src/features/dashboard/ParticipantDashboardPage';
import { CoursesPage } from '../src/features/learning/CoursesPage';
import { AssignmentsPage } from '../src/features/assignments/AssignmentsPage';
import { AssembliesPage } from '../src/features/assemblies/AssembliesPage';
import { ProjectsPage } from '../src/features/projects/ProjectsPage';
import { CommunityPage } from '../src/features/community/CommunityPage';
import { PassportPage } from '../src/features/passport/PassportPage';
import { ParliamentPage } from '../src/features/previews/ParliamentPage';

describe('Point-of-Use Rules Controls Across Platform Modules', () => {
  beforeEach(() => {
    window.localStorage.clear();
    const db = getFreshSeedDatabase();
    useAuthStore.setState({
      currentUser: db.users[0], // user_aarav
      isLoading: false,
    });
  });

  describe('1. Reusable PointOfUseRulesButton Behavior & Accessibility', () => {
    it('renders trigger button with accessible aria attributes and opens modal on click', () => {
      render(
        <MemoryRouter>
          <PointOfUseRulesButton
            moduleName="Test Module"
            rules={[
              { title: 'Test Rule 1', description: 'Description of rule 1' },
              { title: 'Test Rule 2', description: 'Description of rule 2' },
            ]}
            testId="test-rules-btn"
          />
        </MemoryRouter>
      );

      const btn = screen.getByTestId('test-rules-btn');
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveAttribute('aria-haspopup', 'dialog');
      expect(btn).toHaveAttribute('aria-expanded', 'false');

      // Click to open modal
      fireEvent.click(btn);
      expect(btn).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Module Rules')).toBeInTheDocument();
      expect(screen.getByText('Test Rule 1')).toBeInTheDocument();
      expect(screen.getByText('Description of rule 1')).toBeInTheDocument();

      // Full rulebook link must exist
      const fullLink = screen.getByTestId('link-to-full-rulebook');
      expect(fullLink).toBeInTheDocument();
      expect(fullLink).toHaveAttribute('href', '/help');

      // Closes on close button click
      const closeBtn = screen.getByTestId('close-rules-modal-btn');
      fireEvent.click(closeBtn);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes modal on Escape key press (keyboard accessible)', () => {
      render(
        <MemoryRouter>
          <PointOfUseRulesButton
            moduleName="Keyboard Test"
            rules={[{ title: 'Rule A', description: 'Detail A' }]}
            testId="test-escape-btn"
          />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('test-escape-btn'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Press Escape
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders 33% platform policy section ONLY when hasSeatQuotaRule is true', () => {
      const { rerender } = render(
        <MemoryRouter>
          <PointOfUseRulesButton
            moduleName="No Quota Module"
            rules={[{ title: 'Open Rule', description: 'Unlimited access' }]}
            hasSeatQuotaRule={false}
            testId="no-quota-btn"
          />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('no-quota-btn'));
      expect(screen.queryByTestId('rules-seat-quota-section')).not.toBeInTheDocument();

      // Rerender with hasSeatQuotaRule=true
      rerender(
        <MemoryRouter>
          <PointOfUseRulesButton
            moduleName="Quota Module"
            rules={[{ title: 'Deliberation Rule', description: 'Named roles allocated' }]}
            hasSeatQuotaRule={true}
            quotaContext="Named Deliberative Roles"
            testId="quota-btn"
          />
        </MemoryRouter>
      );

      const quotaSection = screen.getByTestId('rules-seat-quota-section');
      expect(quotaSection).toBeInTheDocument();
      expect(quotaSection.textContent).toMatch(/33% platform representation rule/i);
      expect(quotaSection.textContent).toMatch(/ceil\(0\.33\s*×\s*places\)/);
      expect(quotaSection.textContent).toMatch(/vacant by default/i);
      expect(quotaSection.textContent).toMatch(/audited exception/i);
      expect(quotaSection.textContent).toMatch(/platform policy rather than statutory legislation/i);
    });
  });

  describe('2. Dashboard (Home) Point-of-Use Rules Control', () => {
    it('renders Platform Rules control on ParticipantDashboardPage linking to full rulebook', async () => {
      render(
        <MemoryRouter>
          <ParticipantDashboardPage />
        </MemoryRouter>
      );

      const rulesBtn = await screen.findByTestId('dashboard-rules-btn');
      expect(rulesBtn).toBeInTheDocument();
      expect(rulesBtn.textContent).toContain('Platform Rules');

      fireEvent.click(rulesBtn);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Participant Eligibility & Policy')).toBeInTheDocument();
      expect(screen.getByText(/every demo participant must be 18 or older/i)).toBeInTheDocument();
      expect(screen.getByTestId('link-to-full-rulebook')).toHaveAttribute('href', '/help');
    });
  });

  describe('3. Learn & UHV Point-of-Use Rules Controls', () => {
    it('renders Learning Rules control on /learn without 33% quota rule', async () => {
      render(
        <MemoryRouter initialEntries={['/learn']}>
          <Routes>
            <Route path="/learn" element={<CoursesPage />} />
          </Routes>
        </MemoryRouter>
      );

      const learnRulesBtn = await screen.findByTestId('learn-rules-btn');
      expect(learnRulesBtn).toBeInTheDocument();
      expect(learnRulesBtn.textContent).toContain('Learning Rules');

      fireEvent.click(learnRulesBtn);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Civic Academy Learning Guidelines')).toBeInTheDocument();
      expect(screen.getByText(/Learning Credit Award \(\+1 Credit\)/i)).toBeInTheDocument();
      // Must NOT include seat quota rule
      expect(screen.queryByTestId('rules-seat-quota-section')).not.toBeInTheDocument();
      expect(screen.getByTestId('link-to-full-rulebook')).toHaveAttribute('href', '/help');
    });

    it('renders UHV Study Rules control on /uhv with zero-credit and non-graded reflection rules', async () => {
      render(
        <MemoryRouter initialEntries={['/uhv']}>
          <Routes>
            <Route path="/uhv" element={<CoursesPage />} />
          </Routes>
        </MemoryRouter>
      );

      const uhvRulesBtn = await screen.findByTestId('uhv-rules-btn');
      expect(uhvRulesBtn).toBeInTheDocument();
      expect(uhvRulesBtn.textContent).toContain('UHV Study Rules');

      fireEvent.click(uhvRulesBtn);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('UHV / Jeevan Vidya Study Charter')).toBeInTheDocument();
      expect(screen.getByText(/Zero Civic Credit Policy/i)).toBeInTheDocument();
      expect(screen.getByText(/Voluntary Inquiry & Non-Graded Reflection/i)).toBeInTheDocument();
      // Must NOT include seat quota rule
      expect(screen.queryByTestId('rules-seat-quota-section')).not.toBeInTheDocument();
      expect(screen.getByTestId('link-to-full-rulebook')).toHaveAttribute('href', '/help');
    });
  });

  describe('4. Assignments Point-of-Use Rules Control', () => {
    it('renders Evidence Rules control on AssignmentsPage with consent and file limits', async () => {
      render(
        <MemoryRouter>
          <AssignmentsPage />
        </MemoryRouter>
      );

      const asgRulesBtn = await screen.findByTestId('assignments-rules-btn');
      expect(asgRulesBtn).toBeInTheDocument();

      fireEvent.click(asgRulesBtn);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Field Evidence & Assignment Rules')).toBeInTheDocument();
      expect(screen.getByText(/Consent & Privacy Protections/i)).toBeInTheDocument();
      expect(screen.getByText(/250 KB/i)).toBeInTheDocument();
      expect(screen.queryByTestId('rules-seat-quota-section')).not.toBeInTheDocument();
      expect(screen.getByTestId('link-to-full-rulebook')).toHaveAttribute('href', '/help');
    });
  });

  describe('5. Assemblies Point-of-Use Rules Control', () => {
    it('renders Assembly Rules on AssembliesPage with 33% role quota policy and ceil formula', async () => {
      render(
        <MemoryRouter>
          <AssembliesPage />
        </MemoryRouter>
      );

      const asmRulesBtn = await screen.findByTestId('assemblies-rules-btn');
      expect(asmRulesBtn).toBeInTheDocument();

      fireEvent.click(asmRulesBtn);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Youth Assembly Procedural & Representation Rules')).toBeInTheDocument();

      // MUST render 33% platform representation section
      const quotaSection = screen.getByTestId('rules-seat-quota-section');
      expect(quotaSection).toBeInTheDocument();
      expect(quotaSection.textContent).toMatch(/ceil\(0\.33\s*×\s*places\)/);
      expect(quotaSection.textContent).toMatch(/vacant by default/i);
      expect(quotaSection.textContent).toMatch(/platform policy rather than statutory legislation/i);

      // Procedural rules
      expect(screen.getByText(/Canonical Six Stages/i)).toBeInTheDocument();
      expect(screen.getByText(/Dissent Retention & Transparency/i)).toBeInTheDocument();
      expect(screen.getByTestId('link-to-full-rulebook')).toHaveAttribute('href', '/help');
    });
  });

  describe('6. Projects Point-of-Use Rules Control', () => {
    it('renders Project Rules on ProjectsPage with milestone credit awards without 33% seat quota', async () => {
      render(
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      );

      const projRulesBtn = await screen.findByTestId('projects-rules-btn');
      expect(projRulesBtn).toBeInTheDocument();

      fireEvent.click(projRulesBtn);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Civic Action Projects & Milestones Rules')).toBeInTheDocument();
      expect(screen.getByText(/Milestone Verification & Credit Awards \(\+2 Credits\)/i)).toBeInTheDocument();
      expect(screen.queryByTestId('rules-seat-quota-section')).not.toBeInTheDocument();
      expect(screen.getByTestId('link-to-full-rulebook')).toHaveAttribute('href', '/help');
    });
  });

  describe('7. Community Point-of-Use Rules Control', () => {
    it('renders Community Rules on CommunityPage with constructive discourse and reporting standards', async () => {
      render(
        <MemoryRouter>
          <CommunityPage />
        </MemoryRouter>
      );

      const commRulesBtn = await screen.findByTestId('community-rules-btn');
      expect(commRulesBtn).toBeInTheDocument();

      fireEvent.click(commRulesBtn);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Community Circles & Forum Guidelines')).toBeInTheDocument();
      expect(screen.getByText(/Constructive Civic Discourse/i)).toBeInTheDocument();
      expect(screen.getByText(/Non-Anonymous Accountability/i)).toBeInTheDocument();
      expect(screen.queryByTestId('rules-seat-quota-section')).not.toBeInTheDocument();
      expect(screen.getByTestId('link-to-full-rulebook')).toHaveAttribute('href', '/help');
    });
  });

  describe('8. Passport Point-of-Use Rules Control & Full Rulebook Link', () => {
    it('renders Passport Rules on PassportPage and direct link to full rulebook', async () => {
      render(
        <MemoryRouter>
          <PassportPage />
        </MemoryRouter>
      );

      const passRulesBtn = await screen.findByTestId('passport-rules-btn');
      expect(passRulesBtn).toBeInTheDocument();

      fireEvent.click(passRulesBtn);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Civic Passport Portfolio & Credit Rules')).toBeInTheDocument();
      expect(screen.getByText(/Evidence-Based Portfolio \(Not a Moral Score\)/i)).toBeInTheDocument();
      expect(screen.getByTestId('link-to-full-rulebook')).toHaveAttribute('href', '/help');

      // Also verify full rulebook link in passport callout card
      const calloutLink = screen.getByTestId('passport-full-rulebook-link');
      expect(calloutLink).toHaveAttribute('href', '/help');
    });
  });

  describe('9. Parliament Page Full Rulebook Link', () => {
    it('includes direct link to full rulebook index in Parliament reservation policy card', async () => {
      render(
        <MemoryRouter>
          <ParliamentPage />
        </MemoryRouter>
      );

      const parlRulebookCard = await screen.findByTestId('parliament-reservation-rulebook');
      expect(parlRulebookCard).toBeInTheDocument();

      const fullLink = screen.getByTestId('parliament-full-rulebook-link');
      expect(fullLink).toBeInTheDocument();
      expect(fullLink).toHaveAttribute('href', '/help');
    });
  });
});
