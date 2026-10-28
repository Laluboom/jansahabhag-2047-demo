import { describe, it, expect, beforeEach } from 'vitest';
import { demoRepository } from '../src/services/demoRepository';
import { PersistenceService } from '../src/services/persistence';

describe('Community Post Reporting Repository Tests', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    await demoRepository.switchUser('VSC-S-001');
  });

  it('creates exactly one case with targetType: community_post, targetId equal to the post id and status open', async () => {
    const post = (await demoRepository.getCommunityPosts('grp_jaipur_safe_streets')).find(
      (p) => p.authorId !== 'VSC-S-001'
    )!;

    const modCase = await demoRepository.reportCommunityPost({
      reporterId: 'VSC-S-001',
      postId: post.id,
      reason: 'Inappropriate or harmful statement in observation thread.',
      severity: 'medium',
    });

    expect(modCase).toBeDefined();
    expect(modCase.targetType).toBe('community_post');
    expect(modCase.targetId).toBe(post.id);
    expect(modCase.status).toBe('open');
    expect(modCase.reporterId).toBe('VSC-S-001');

    const allCases = await demoRepository.getModerationCases();
    const matches = allCases.filter(
      (c) => c.targetType === 'community_post' && c.targetId === post.id
    );
    expect(matches).toHaveLength(1);
  });

  it('throws if reporterId is not the active persona', async () => {
    const post = (await demoRepository.getCommunityPosts('grp_jaipur_safe_streets')).find(
      (p) => p.authorId !== 'VSC-S-001'
    )!;

    await expect(
      demoRepository.reportCommunityPost({
        reporterId: 'VSC-S-002',
        postId: post.id,
        reason: 'Valid reason here',
      })
    ).rejects.toThrow(/Unauthorized/i);
  });

  it('throws if a special_guest persona attempts to report', async () => {
    await demoRepository.switchUser('VSC-G-001');
    const post = (await demoRepository.getCommunityPosts('grp_jaipur_safe_streets'))[0];

    await expect(
      demoRepository.reportCommunityPost({
        reporterId: 'VSC-G-001',
        postId: post.id,
        reason: 'Report by special guest',
      })
    ).rejects.toThrow(/special_guest/i);
  });

  it('throws if reason has fewer than 3 characters after trimming', async () => {
    const post = (await demoRepository.getCommunityPosts('grp_jaipur_safe_streets')).find(
      (p) => p.authorId !== 'VSC-S-001'
    )!;

    await expect(
      demoRepository.reportCommunityPost({
        reporterId: 'VSC-S-001',
        postId: post.id,
        reason: '  ab  ',
      })
    ).rejects.toThrow(/at least 3 characters/i);
  });

  it('throws if reporting your own post', async () => {
    // VSC-S-001 is author of post_01
    await expect(
      demoRepository.reportCommunityPost({
        reporterId: 'VSC-S-001',
        postId: 'post_01',
        reason: 'Reporting my own post',
      })
    ).rejects.toThrow(/own post/i);
  });

  it('throws if reporting the same post twice while the first case is open, and only one case exists afterwards', async () => {
    const post = (await demoRepository.getCommunityPosts('grp_jaipur_safe_streets')).find(
      (p) => p.authorId !== 'VSC-S-001'
    )!;

    await demoRepository.reportCommunityPost({
      reporterId: 'VSC-S-001',
      postId: post.id,
      reason: 'First report for guideline violation.',
    });

    await expect(
      demoRepository.reportCommunityPost({
        reporterId: 'VSC-S-001',
        postId: post.id,
        reason: 'Second duplicate report.',
      })
    ).rejects.toThrow(/already reported/i);

    const allCases = await demoRepository.getModerationCases();
    const matchingCases = allCases.filter(
      (c) => c.targetType === 'community_post' && c.targetId === post.id
    );
    expect(matchingCases).toHaveLength(1);
  });

  it('resolving case as actioned sets isWithheld on post; resolving as no_action clears it', async () => {
    const post = (await demoRepository.getCommunityPosts('grp_jaipur_safe_streets')).find(
      (p) => p.authorId !== 'VSC-S-001'
    )!;

    const modCase = await demoRepository.reportCommunityPost({
      reporterId: 'VSC-S-001',
      postId: post.id,
      reason: 'Flagged for moderation action test.',
    });

    // Switch to platform admin to update moderation case
    await demoRepository.switchUser('JS-F-001');

    await demoRepository.updateModerationCase(modCase.id, {
      status: 'actioned',
      resolutionDetails: 'Violating content withheld.',
    });

    const withheldPost = await demoRepository.getCommunityPost(post.id);
    expect(withheldPost?.isWithheld).toBe(true);

    // Resolve as no_action clears isWithheld
    await demoRepository.updateModerationCase(modCase.id, {
      status: 'no_action',
      resolutionDetails: 'Reviewed and reinstated.',
    });

    const clearedPost = await demoRepository.getCommunityPost(post.id);
    expect(clearedPost?.isWithheld).toBe(false);
  });

  it('workspace report produces targetType: post, and community report does not change or match it', async () => {
    // Create workspace report
    await demoRepository.reportWorkspaceContent({
      workspaceId: 'ws_jaipur_school_safety',
      reporterId: 'VSC-S-001',
      reason: 'Questionable task card edit in workspace',
    });

    const post = (await demoRepository.getCommunityPosts('grp_jaipur_safe_streets')).find(
      (p) => p.authorId !== 'VSC-S-001'
    )!;

    const commCase = await demoRepository.reportCommunityPost({
      reporterId: 'VSC-S-001',
      postId: post.id,
      reason: 'Community post flagged for safety review',
    });

    await demoRepository.switchUser('JS-F-001');
    const allCases = await demoRepository.getModerationCases();

    const wsCases = allCases.filter((c) => c.targetType === 'post');
    const commCases = allCases.filter((c) => c.targetType === 'community_post');

    expect(wsCases.length).toBeGreaterThanOrEqual(1);
    expect(commCases.some((c) => c.id === commCase.id)).toBe(true);
    expect(wsCases.every((c) => c.targetType === 'post')).toBe(true);
    expect(commCases.every((c) => c.targetType === 'community_post')).toBe(true);
  });

  it('recomputes isWithheld across all cases for a post: actioning first keeps it withheld even if second is dismissed', async () => {
    const post = (await demoRepository.getCommunityPosts('grp_jaipur_safe_streets')).find(
      (p) => p.authorId !== 'VSC-S-001' && p.authorId !== 'VSC-S-002'
    )!;

    // Reporter A (VSC-S-001) reports
    const caseA = await demoRepository.reportCommunityPost({
      reporterId: 'VSC-S-001',
      postId: post.id,
      reason: 'Report from reporter A',
    });

    // Reporter B (VSC-S-002) reports
    await demoRepository.switchUser('VSC-S-002');
    const caseB = await demoRepository.reportCommunityPost({
      reporterId: 'VSC-S-002',
      postId: post.id,
      reason: 'Report from reporter B',
    });

    // Switch to platform admin
    await demoRepository.switchUser('JS-F-001');

    // Action case A
    await demoRepository.updateModerationCase(caseA.id, {
      status: 'actioned',
      resolutionDetails: 'Action taken on report A',
    });

    let storedPost = await demoRepository.getCommunityPost(post.id);
    expect(storedPost?.isWithheld).toBe(true);

    // Dismiss case B (no_action)
    await demoRepository.updateModerationCase(caseB.id, {
      status: 'no_action',
      resolutionDetails: 'Dismissed report B as duplicate/no separate action needed',
    });

    // Post must STILL be withheld because case A is actioned
    storedPost = await demoRepository.getCommunityPost(post.id);
    expect(storedPost?.isWithheld).toBe(true);

    // Dismiss case A as well
    await demoRepository.updateModerationCase(caseA.id, {
      status: 'no_action',
      resolutionDetails: 'Reversed case A upon appeal',
    });

    // Now neither case is actioned, so post must no longer be withheld
    storedPost = await demoRepository.getCommunityPost(post.id);
    expect(storedPost?.isWithheld).toBe(false);
  });

  it('blanks content of a withheld post for participant persona and returns full content for programme_manager', async () => {
    // Read original post content as programme_manager
    const db = PersistenceService.loadDatabase();
    const pmUser = db.users.find((u) => u.id === 'VSC-T-001');
    if (pmUser) {
      pmUser.role = 'programme_manager';
      PersistenceService.saveDatabase(db);
    }

    const originalPost = (await demoRepository.getCommunityPosts('grp_jaipur_safe_streets')).find(
      (p) => p.authorId !== 'VSC-S-001'
    )!;
    expect(originalPost.content.length).toBeGreaterThan(0);

    const modCase = await demoRepository.reportCommunityPost({
      reporterId: 'VSC-S-001',
      postId: originalPost.id,
      reason: 'Safety and privacy complaint',
    });

    // Action case as admin
    await demoRepository.switchUser('JS-F-001');
    await demoRepository.updateModerationCase(modCase.id, {
      status: 'actioned',
      resolutionDetails: 'Withheld',
    });

    // 1. Participant persona (VSC-S-001) reads posts
    await demoRepository.switchUser('VSC-S-001');
    const participantPosts = await demoRepository.getCommunityPosts(originalPost.groupId);
    const participantPost = participantPosts.find((p) => p.id === originalPost.id);
    expect(participantPost?.isWithheld).toBe(true);
    expect(participantPost?.content).toBe('');

    const participantSinglePost = await demoRepository.getCommunityPost(originalPost.id);
    expect(participantSinglePost?.content).toBe('');

    // 2. Programme manager persona reads posts
    await demoRepository.switchUser('VSC-T-001');

    const pmPosts = await demoRepository.getCommunityPosts(originalPost.groupId);
    const pmPost = pmPosts.find((p) => p.id === originalPost.id);
    expect(pmPost?.isWithheld).toBe(true);
    expect(pmPost?.content).toBe(originalPost.content);

    const pmSinglePost = await demoRepository.getCommunityPost(originalPost.id);
    expect(pmSinglePost?.content).toBe(originalPost.content);
  });

  it('getCommunityPostContext returns post with null group when group is missing', async () => {
    const db = PersistenceService.loadDatabase();
    const orphanPost = {
      id: 'post_orphan_01',
      groupId: 'grp_non_existent',
      authorId: 'VSC-S-001',
      authorName: 'Ankita Kapri',
      authorRole: 'participant',
      title: 'Orphan Post Title',
      content: 'Orphan content',
      tags: [],
      likesCount: 0,
      replies: [],
      isPinned: false,
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
    };
    db.communityPosts.push(orphanPost);
    PersistenceService.saveDatabase(db);

    const ctx = await demoRepository.getCommunityPostContext('post_orphan_01');
    expect(ctx).not.toBeNull();
    expect(ctx?.post.id).toBe('post_orphan_01');
    expect(ctx?.group).toBeNull();
  });
});
