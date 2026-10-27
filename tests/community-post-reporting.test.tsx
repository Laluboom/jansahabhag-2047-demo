import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { demoRepository } from '../src/services/demoRepository';
import { PersistenceService } from '../src/services/persistence';
import { useAuthStore } from '../src/stores/authStore';
import { CommunityGroupDetailPage } from '../src/features/community/CommunityGroupDetailPage';
import { CommunityPage } from '../src/features/community/CommunityPage';
import { AdminModerationPage } from '../src/features/moderation/AdminModerationPage';

describe('Community Post Reporting UI Tests', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    await demoRepository.switchUser('VSC-S-001');
    await useAuthStore.getState().initialize();
  });

  it('offers a Report control on a post card for another author that is reachable by keyboard', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/community/groups/grp_jaipur_safe_streets']}>
        <Routes>
          <Route path="/community/groups/:id" element={<CommunityGroupDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for posts to load
    await waitFor(() => {
      expect(
        screen.getByText(/Update on Kalawad Road Ward 8 sidewalk survey/i)
      ).toBeInTheDocument();
    });

    // Expand the post authored by Yash Rathod (VSC-S-005)
    const threadToggle = screen
      .getByText(/Update on Kalawad Road Ward 8 sidewalk survey/i)
      .closest('button');
    expect(threadToggle).not.toBeNull();
    await user.click(threadToggle!);

    // Find the Report control by accessible name
    const reportButton = screen.getByRole('button', {
      name: /Report post: Update on Kalawad Road Ward 8 sidewalk survey/i,
    });
    expect(reportButton).toBeInTheDocument();

    // Verify keyboard reachability by focusing
    reportButton.focus();
    expect(reportButton).toHaveFocus();
  });

  it('submitting a reason closes the modal and leaves the post reported', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/community/groups/grp_jaipur_safe_streets']}>
        <Routes>
          <Route path="/community/groups/:id" element={<CommunityGroupDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Update on Kalawad Road Ward 8 sidewalk survey/i)
      ).toBeInTheDocument();
    });

    const threadToggle = screen
      .getByText(/Update on Kalawad Road Ward 8 sidewalk survey/i)
      .closest('button');
    await user.click(threadToggle!);

    const reportButton = screen.getByRole('button', {
      name: /Report post: Update on Kalawad Road Ward 8 sidewalk survey/i,
    });
    await user.click(reportButton);

    // Modal opens with context and reason textarea
    expect(
      screen.getByRole('heading', { name: /Report Community Post/i })
    ).toBeInTheDocument();

    const textarea = screen.getByLabelText(/Reason for report/i);
    await user.type(textarea, 'Misleading survey data without required permissions.');

    const submitBtn = screen.getByRole('button', { name: /Submit report/i });
    await user.click(submitBtn);

    // Modal closes
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Report Community Post/i })).not.toBeInTheDocument();
    });

    // Database has the report recorded
    const cases = await demoRepository.getModerationCases();
    const reported = cases.find(
      (c) => c.targetType === 'community_post' && c.targetId === 'post_02'
    );
    expect(reported).toBeDefined();
    expect(reported?.status).toBe('open');

    // Inline confirmation appears on the card
    await waitFor(() => {
      expect(screen.getByText(/moderation queue/i)).toBeInTheDocument();
    });
  });

  it('renders no Report control on the active persona\'s own post', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/community/groups/grp_jaipur_safe_streets']}>
        <Routes>
          <Route path="/community/groups/:id" element={<CommunityGroupDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Tips for accurate peak-hour traffic counts on two-lane roads/i)
      ).toBeInTheDocument();
    });

    // post_01 is authored by VSC-S-001 (Ankita Kapri, currently logged in)
    const threadToggle = screen
      .getByText(/Tips for accurate peak-hour traffic counts on two-lane roads/i)
      .closest('button');
    await user.click(threadToggle!);

    expect(
      screen.queryByRole('button', {
        name: /Report post: Tips for accurate peak-hour traffic counts on two-lane roads/i,
      })
    ).not.toBeInTheDocument();
  });

  it('hides body text of a withheld post from a participant persona, while showing it to staff', async () => {
    const user = userEvent.setup();

    // Mark post_02 as withheld
    const db = PersistenceService.loadDatabase();
    const post = db.communityPosts.find((p) => p.id === 'post_02');
    if (post) {
      post.isWithheld = true;
      PersistenceService.saveDatabase(db);
    }

    // Render as participant (VSC-S-001)
    const { unmount } = render(
      <MemoryRouter initialEntries={['/community/groups/grp_jaipur_safe_streets']}>
        <Routes>
          <Route path="/community/groups/:id" element={<CommunityGroupDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Update on Kalawad Road Ward 8 sidewalk survey/i)
      ).toBeInTheDocument();
    });

    // Title and author are visible
    expect(screen.getByText(/Yash Rathod/i)).toBeInTheDocument();

    // Body content must be hidden from participant
    expect(
      screen.queryByText(/Mapped 1\.8km of Kalawad Road today/i)
    ).not.toBeInTheDocument();

    // Plain notice that post was withheld is present
    expect(
      screen.getAllByText(/withheld after moderation review/i).length
    ).toBeGreaterThanOrEqual(1);

    unmount();

    // Switch to platform admin persona
    await demoRepository.switchUser('JS-F-001');
    await useAuthStore.getState().initialize();

    render(
      <MemoryRouter initialEntries={['/community/groups/grp_jaipur_safe_streets']}>
        <Routes>
          <Route path="/community/groups/:id" element={<CommunityGroupDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Update on Kalawad Road Ward 8 sidewalk survey/i)
      ).toBeInTheDocument();
    });

    // Platform admin still sees the full content
    expect(
      screen.getByText(/Mapped 1\.8km of Kalawad Road today/i)
    ).toBeInTheDocument();

    // Admin sees the Withheld status chip
    expect(screen.getByText(/withheld/i)).toBeInTheDocument();
  });

  it('moderation page lists the community post case with its post title', async () => {
    // Report a community post
    const modCase = await demoRepository.reportCommunityPost({
      reporterId: 'VSC-S-001',
      postId: 'post_02',
      reason: 'Safety concern reported on sidewalk measurements.',
    });

    // Switch to platform admin to review moderation queue
    await demoRepository.switchUser('JS-F-001');
    await useAuthStore.getState().initialize();

    render(
      <MemoryRouter>
        <AdminModerationPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(modCase.id)).toBeInTheDocument();
    });

    // Plain words "Community post", not raw union value
    expect(
      screen.getByText(new RegExp(`Community post \\(${modCase.targetId}\\)`, 'i'))
    ).toBeInTheDocument();
    expect(screen.queryByText('community_post')).not.toBeInTheDocument();

    // Lists the post title
    expect(
      screen.getByText(/Update on Kalawad Road Ward 8 sidewalk survey/i)
    ).toBeInTheDocument();

    // Does not show reporter's name on the card
    expect(screen.queryByText(/Ankita Kapri/i)).not.toBeInTheDocument();
  });

  it('CommunityPage offers Report control on post previews and hides withheld content from participants', async () => {
    const user = userEvent.setup();

    // Mark post_02 as withheld
    const db = PersistenceService.loadDatabase();
    const post = db.communityPosts.find((p) => p.id === 'post_02');
    if (post) {
      post.isWithheld = true;
      PersistenceService.saveDatabase(db);
    }

    render(
      <MemoryRouter>
        <CommunityPage />
      </MemoryRouter>
    );

    // Wait for groups and posts to load
    await waitFor(() => {
      expect(
        screen.getByText(/Tips for accurate peak-hour traffic counts on two-lane roads/i)
      ).toBeInTheDocument();
    });

    // Expand Yash's post (post_02)
    const yashThreadToggle = screen
      .getByText(/Update on Kalawad Road Ward 8 sidewalk survey/i)
      .closest('button');
    expect(yashThreadToggle).not.toBeNull();
    await user.click(yashThreadToggle!);

    // Verify post_02 content is not leaked to participant persona
    expect(screen.queryByText(/Mapped 1\.8km of Kalawad Road today/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/withheld after moderation review/i).length).toBeGreaterThanOrEqual(1);

    // Expand another post that is NOT withheld (e.g., post_03 if available, or unwithhold post_01)
    // post_01 is authored by VSC-S-001 (active user)
    const ownThreadToggle = screen
      .getByText(/Tips for accurate peak-hour traffic counts on two-lane roads/i)
      .closest('button');
    expect(ownThreadToggle).not.toBeNull();
    await user.click(ownThreadToggle!);

    // Own post should NOT have Report control
    expect(
      screen.queryByRole('button', {
        name: /Report post: Tips for accurate peak-hour traffic counts on two-lane roads/i,
      })
    ).not.toBeInTheDocument();

    // Other author's post (post_02) DOES have Report control
    const reportBtn = screen.getByRole('button', {
      name: /Report post: Update on Kalawad Road Ward 8 sidewalk survey/i,
    });
    expect(reportBtn).toBeInTheDocument();
  });

  it('AdminModerationPage renders plainly when group is missing', async () => {
    const db = PersistenceService.loadDatabase();
    const orphanPost = {
      id: 'post_orphan_ui_01',
      groupId: 'grp_missing',
      authorId: 'VSC-S-005',
      authorName: 'Yash Rathod',
      authorRole: 'participant',
      title: 'Post With Missing Group',
      content: 'Some content',
      tags: [],
      likesCount: 0,
      replies: [],
      isPinned: false,
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
    };
    db.communityPosts.push(orphanPost);
    db.moderationCases.push({
      id: 'mod_orphan_01',
      reporterId: 'VSC-S-001',
      targetType: 'community_post',
      targetId: 'post_orphan_ui_01',
      reason: 'Flagged orphan post',
      severity: 'low',
      status: 'open',
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    PersistenceService.saveDatabase(db);

    await demoRepository.switchUser('JS-F-001');
    await useAuthStore.getState().initialize();

    render(
      <MemoryRouter>
        <AdminModerationPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('mod_orphan_01')).toBeInTheDocument();
    });

    expect(screen.getByText('Post With Missing Group')).toBeInTheDocument();
    // Missing group is rendered plainly without crash or fabricated name
    expect(screen.queryByText(/Unknown Circle/i)).not.toBeInTheDocument();
    expect(screen.getByText(/No group assigned/i)).toBeInTheDocument();
  });
});
