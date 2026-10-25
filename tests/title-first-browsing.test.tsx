import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { demoRepository } from '../src/services/demoRepository';
import { PersistenceService } from '../src/services/persistence';
import { useAuthStore } from '../src/stores/authStore';
import { AssignmentsPage } from '../src/features/assignments/AssignmentsPage';
import { CommunityPage } from '../src/features/community/CommunityPage';
import { CommunityGroupDetailPage } from '../src/features/community/CommunityGroupDetailPage';

describe('V2 Section 5 & 14 Title-First Browsing Integration Tests', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    await useAuthStore.getState().initialize();
  });

  describe('AssignmentsPage Title-First Browsing', () => {
    it('groups assignments into 4 plain headings from actual course data with title and status chip first', async () => {
      render(
        <MemoryRouter initialEntries={['/assignments']}>
          <AssignmentsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Field Evidence & Assignments/i })).toBeInTheDocument();
      });

      // 4 plain headings from actual course data
      expect(screen.getByRole('heading', { name: /CIV-101: Civic Observation/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /CIV-201: Deliberative Democracy/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /ACT-102: Participatory Civic Action/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /SAF-101: Pedestrian Infrastructure Mapping/i })).toBeInTheDocument();

      // Title-first: check that card titles and status chips are rendered
      expect(screen.getByText(/School Gate Traffic Audit & Peak Hour Vehicle Count/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Verified/i).length).toBeGreaterThanOrEqual(1);

      // UHV Privacy indicator and path to activities preserved
      expect(screen.getByText(/UHV Stream Separation:/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Explore Activities Stream/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /View UHV Stream/i })).toBeInTheDocument();
    });

    it('displays overdue, pending review, and reveals complete details on activation', async () => {
      render(
        <MemoryRouter initialEntries={['/assignments']}>
          <AssignmentsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Dangerous Crossing Photo-Evidence & Incident Log/i)).toBeInTheDocument();
      });

      // Check overdue and pending review indicators
      expect(screen.getAllByText(/Pending Review/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Overdue/i).length).toBeGreaterThanOrEqual(1);

      // Find reveal button for the first assignment
      const revealButtons = screen.getAllByRole('button', { name: /Reveal Complete Details/i });
      expect(revealButtons.length).toBeGreaterThan(0);

      // Initially prompt details are collapsed
      expect(screen.queryByText(/Assignment Prompt & Instructions:/i)).not.toBeInTheDocument();

      // Click to reveal details on activation
      fireEvent.click(revealButtons[0]);

      // Complete details are now revealed
      expect(screen.getByText(/Assignment Prompt & Instructions:/i)).toBeInTheDocument();
      expect(screen.getByText(/Rubric Evaluation Criteria:/i)).toBeInTheDocument();

      // Click again to hide details
      const hideButton = screen.getByRole('button', { name: /Hide Full Details/i });
      fireEvent.click(hideButton);
      expect(screen.queryByText(/Assignment Prompt & Instructions:/i)).not.toBeInTheDocument();
    });

    it('supports tab filtering and retains routes to detail and submit', async () => {
      render(
        <MemoryRouter initialEntries={['/assignments']}>
          <AssignmentsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Action Required/i })).toBeInTheDocument();
      });

      // Filter to Action Required
      fireEvent.click(screen.getByRole('button', { name: /Action Required/i }));

      await waitFor(() => {
        // Pedestrian Flow Interview is not started
        expect(screen.getByText(/Pedestrian Flow Interview with 5 Peers/i)).toBeInTheDocument();
      });

      // Detail navigation route links exist
      const detailLinks = screen.getAllByRole('link', { name: /View Assignment Detail/i });
      expect(detailLinks.length).toBeGreaterThanOrEqual(1);

      // Submit route link exists
      const submitLinks = screen.getAllByRole('link', { name: /Submit Evidence/i });
      expect(submitLinks.length).toBeGreaterThanOrEqual(1);
    });

    it('renders teacher perspective with course groupings in catalog', async () => {
      await useAuthStore.getState().switchPersona('VSC-T-001');

      render(
        <MemoryRouter initialEntries={['/assignments']}>
          <AssignmentsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Assignment Review Queue/i })).toBeInTheDocument();
      });

      // Switch to Assignment Catalog tab
      const catalogTab = screen.getByRole('button', { name: /Assignment Catalog/i });
      fireEvent.click(catalogTab);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /CIV-101: Civic Observation/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /SAF-101: Pedestrian Infrastructure Mapping/i })).toBeInTheDocument();
      });
    });
  });

  describe('CommunityPage Title-First Browsing', () => {
    it('renders category headings and scannable thread titles with one-line snippets', async () => {
      render(
        <MemoryRouter initialEntries={['/community']}>
          <CommunityPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Community Circles & Peer Forums/i })).toBeInTheDocument();
      });

      // Category headings
      expect(screen.getByRole('heading', { name: /Civic Mobility/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Innovation & Tech/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Self-Growth & Values/i })).toBeInTheDocument();

      // Scannable thread titles and snippets
      expect(
        screen.getByText(/Tips for accurate peak-hour traffic counts on two-lane roads/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/When counting vehicles outside Virani Science College/i)).toBeInTheDocument();

      // Author avatar/name and time
      expect(screen.getAllByText(/Ankita Kapri/i).length).toBeGreaterThanOrEqual(1);

      // Navigation button to group forum
      const openForumButtons = screen.getAllByRole('link', { name: /Open Forum/i });
      expect(openForumButtons.length).toBeGreaterThanOrEqual(3);
    });

    it('reveals full thread details, replies, and supports reply submission on click', async () => {
      render(
        <MemoryRouter initialEntries={['/community']}>
          <CommunityPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Tips for accurate peak-hour traffic counts on two-lane roads/i)
        ).toBeInTheDocument();
      });

      // Click thread to reveal full conversation
      const threadButton = screen.getByText(
        /Tips for accurate peak-hour traffic counts on two-lane roads/i
      ).closest('button');
      expect(threadButton).not.toBeNull();
      fireEvent.click(threadButton!);

      // Full details are visible
      await waitFor(() => {
        expect(screen.getByText(/Replies \(2\)/i)).toBeInTheDocument();
        expect(screen.getByText(/This was super helpful during our Gate 3 audit today Ankita!/i)).toBeInTheDocument();
        expect(screen.getAllByText(/When counting vehicles outside Virani Science College/i).length).toBe(2);
      });

      // Submit a peer reply
      const replyInput = screen.getByPlaceholderText(/Write a peer reply\.\.\./i);
      fireEvent.change(replyInput, { target: { value: 'Great tip, trying this with our group tomorrow.' } });

      const replyButton = screen.getByRole('button', { name: /Reply/i });
      fireEvent.click(replyButton);

      await waitFor(() => {
        expect(screen.getByText(/Great tip, trying this with our group tomorrow\./i)).toBeInTheDocument();
      });
    });

    it('supports New Topic creation with persistence', async () => {
      render(
        <MemoryRouter initialEntries={['/community']}>
          <CommunityPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /New Topic/i })).toBeInTheDocument();
      });

      // Open new topic form
      fireEvent.click(screen.getByRole('button', { name: /New Topic/i }));

      expect(screen.getByText(/Start a New Community Topic/i)).toBeInTheDocument();

      // Fill form
      const titleInput = screen.getByPlaceholderText(/Topic Title/i);
      const contentInput = screen.getByPlaceholderText(/Share your observation insights/i);

      fireEvent.change(titleInput, { target: { value: 'Zebra Crossing Paint Quality Inquiry' } });
      fireEvent.change(contentInput, {
        target: { value: 'We noticed the thermoplastic road marking is worn out near the market entrance.' },
      });

      // Submit topic
      fireEvent.click(screen.getByRole('button', { name: /Publish Topic/i }));

      // Topic immediately appears in the list
      await waitFor(() => {
        expect(screen.getByText(/Zebra Crossing Paint Quality Inquiry/i)).toBeInTheDocument();
        expect(screen.getByText(/We noticed the thermoplastic road marking is worn out/i)).toBeInTheDocument();
      });
    });
  });

  describe('CommunityGroupDetailPage Title-First Browsing', () => {
    it('uses category headings (pinned & discussion threads) and reveals details on click', async () => {
      render(
        <MemoryRouter initialEntries={['/community/groups/grp_jaipur_safe_streets']}>
          <Routes>
            <Route path="/community/groups/:id" element={<CommunityGroupDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Rajkot Youth Safe Streets Circle/i })).toBeInTheDocument();
      });

      // Category headings for threads
      expect(screen.getByRole('heading', { name: /Pinned Guidelines & Key Topics/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Discussion Threads & Field Logs/i })).toBeInTheDocument();

      // Scannable thread titles
      expect(screen.getByText(/Update on Kalawad Road Ward 8 sidewalk survey/i)).toBeInTheDocument();

      // Click to reveal full thread details
      const threadButton = screen.getByText(/Update on Kalawad Road Ward 8 sidewalk survey/i).closest('button');
      expect(threadButton).not.toBeNull();
      fireEvent.click(threadButton!);

      await waitFor(() => {
        expect(screen.getByText(/Replies \(1\)/i)).toBeInTheDocument();
        expect(screen.getByText(/Make sure to link these evidence IDs/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Mapped 1\.8km of Kalawad Road today/i).length).toBe(2);
      });
    });

    it('retains New Topic posting and membership toggle on CommunityGroupDetailPage', async () => {
      render(
        <MemoryRouter initialEntries={['/community/groups/grp_jaipur_safe_streets']}>
          <Routes>
            <Route path="/community/groups/:id" element={<CommunityGroupDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/New Topic: Share a Field Insight or Question/i)).toBeInTheDocument();
      });

      // Post a new topic inside circle
      const titleInput = screen.getByPlaceholderText(/Topic Title/i);
      const contentInput = screen.getByPlaceholderText(/Share your observation insights/i);

      fireEvent.change(titleInput, { target: { value: 'Speed Hump Clearance Measurements' } });
      fireEvent.change(contentInput, {
        target: { value: 'Measured 12cm height at entrance, exceeding the 10cm IRC standard.' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Post to Circle/i }));

      await waitFor(() => {
        expect(screen.getByText(/Speed Hump Clearance Measurements/i)).toBeInTheDocument();
      });

      // Toggle membership button
      const leaveButton = screen.getByRole('button', { name: /Leave Circle/i });
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Join Rajkot Youth Safe Streets Circle/i })).toBeInTheDocument();
      });
    });
  });
});
