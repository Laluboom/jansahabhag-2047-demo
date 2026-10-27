import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { CommunityGroup, CommunityPost } from '../../types/domain';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Textarea, Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { PointOfUseRulesButton } from '../../components/ui/PointOfUseRulesButton';
import { Modal } from '../../components/ui/Modal';
import { StatusChip } from '../../components/ui/StatusChip';
import {
  ArrowLeft,
  MessageSquare,
  ThumbsUp,
  Send,
  Users,
  Pin,
  ShieldCheck,
  UserPlus,
  UserMinus,
  Lock,
  Globe,
  Tag,
  ChevronDown,
  Plus,
  Flag,
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';

export const CommunityGroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();

  const [group, setGroup] = useState<CommunityGroup | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [expandedPostIds, setExpandedPostIds] = useState<Set<string>>(new Set());

  // Report Modal State
  const [reportingPost, setReportingPost] = useState<CommunityPost | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportError, setReportError] = useState<string | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportedPostIds, setReportedPostIds] = useState<Set<string>>(new Set());

  // New Topic Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('Pedestrian Safety, Field Tips');
  const [isPosting, setIsPosting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reply State
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      if (!id) return;
      setIsLoading(true);
      try {
        const [grp, pList] = await Promise.all([
          demoRepository.getCommunityGroup(id),
          demoRepository.getCommunityPosts(id),
        ]);
        setGroup(grp);
        setPosts(pList);
      } catch (err) {
        console.error('Failed to load community forum', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, refreshKey]);

  const isMember = currentUser && group ? group.memberUserIds.includes(currentUser.id) : false;

  const toggleExpandPost = (postId: string) => {
    setExpandedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const handleToggleMembership = async () => {
    if (!id || !currentUser || !group) return;
    setIsJoining(true);
    try {
      if (isMember) {
        await demoRepository.leaveCommunityGroup(id, currentUser.id);
      } else {
        await demoRepository.joinCommunityGroup(id, currentUser.id);
      }
      triggerRefresh();
    } catch (err) {
      console.error('Failed to toggle membership', err);
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser || !newTitle.trim() || !newContent.trim()) return;

    setIsPosting(true);
    try {
      const parsedTags = newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await demoRepository.addCommunityPost({
        groupId: id,
        authorId: currentUser.id,
        title: newTitle.trim(),
        content: newContent.trim(),
        tags: parsedTags.length > 0 ? parsedTags : ['Peer Discussion'],
      });
      setNewTitle('');
      setNewContent('');
      triggerRefresh();
    } catch (err) {
      console.error('Failed to create post', err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleAddReply = async (postId: string) => {
    const text = replyTextMap[postId];
    if (!currentUser || !text?.trim()) return;

    try {
      await demoRepository.addCommunityReply(postId, currentUser.id, text.trim());
      setReplyTextMap((prev) => ({ ...prev, [postId]: '' }));
      triggerRefresh();
    } catch (err) {
      console.error('Failed to add reply', err);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!currentUser) return;
    try {
      await demoRepository.likeCommunityPost(postId, currentUser.id);
      triggerRefresh();
    } catch (err) {
      console.error('Failed to like post', err);
    }
  };

  const handleOpenReportModal = (post: CommunityPost) => {
    setReportingPost(post);
    setReportReason('');
    setReportError(null);
  };

  const handleCloseReportModal = () => {
    setReportingPost(null);
    setReportReason('');
    setReportError(null);
  };

  const handleSubmitReport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser || !reportingPost) return;

    setIsSubmittingReport(true);
    setReportError(null);
    try {
      await demoRepository.reportCommunityPost({
        reporterId: currentUser.id,
        postId: reportingPost.id,
        reason: reportReason,
      });
      setReportedPostIds((prev) => new Set(prev).add(reportingPost.id));
      handleCloseReportModal();
      triggerRefresh();
    } catch (err: any) {
      setReportError(err?.message || 'Failed to submit report');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-label="Loading community circle">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-4">
        <Link
          to="/community"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Community Circles</span>
        </Link>
        <Card className="p-8 text-center space-y-4 border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-heading text-slate-900">Community Circle Not Found</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The requested community group or forum "{id}" could not be found.
          </p>
          <div className="pt-2">
            <Link to="/community">
              <Button size="sm" variant="primary">
                View All Circles
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const pinnedPosts = posts.filter((p) => p.isPinned);
  const unpinnedPosts = posts.filter((p) => !p.isPinned);

  const renderThreadCard = (post: CommunityPost) => {
    const isExpanded = expandedPostIds.has(post.id);
    const hasLiked = currentUser ? post.likedByUserIds?.includes(currentUser.id) : false;
    const isStaff = currentUser?.role === 'platform_admin' || currentUser?.role === 'programme_manager';
    const isWithheld = Boolean(post.isWithheld);
    const showFullContent = !isWithheld || isStaff;
    const isAuthor = currentUser?.id === post.authorId;
    const isSpecialGuest = currentUser?.role === 'special_guest';
    const canReport = currentUser && !isAuthor && !isSpecialGuest;
    const isReported = reportedPostIds.has(post.id);

    return (
      <Card
        key={post.id}
        className="border-slate-200 p-4 sm:p-5 space-y-3 bg-white shadow-sm hover:border-slate-300 transition-all"
      >
        {/* Scannable Thread Title & One-Line Snippet - Title-First Browsing */}
        <button
          type="button"
          onClick={() => toggleExpandPost(post.id)}
          aria-expanded={isExpanded}
          aria-controls={`post-detail-${post.id}`}
          className="w-full text-left space-y-1 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500 rounded p-1"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 hover:text-civic-indigo-700 transition-colors">
              {post.title}
            </h3>

            <div className="flex items-center gap-2 shrink-0">
              {post.isPinned && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold flex items-center gap-1">
                  <Pin className="w-3 h-3" /> Pinned
                </span>
              )}
              {isWithheld && isStaff && (
                <StatusChip status="withheld" className="bg-rose-100 text-rose-800 border-rose-200" />
              )}
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  isExpanded ? 'rotate-180 text-civic-indigo-600' : ''
                }`}
              />
            </div>
          </div>

          {/* One-line snippet */}
          {showFullContent ? (
            <p className="text-xs text-slate-600 line-clamp-1 truncate">
              {post.content}
            </p>
          ) : (
            <p className="text-xs text-slate-500 italic">
              This post was withheld after moderation review.
            </p>
          )}
        </button>

        {/* Inline Confirmation of Report */}
        {isReported && (
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-civic-indigo-600 shrink-0" />
            <span>This post has been sent to the moderation queue and a named human reviews it.</span>
          </div>
        )}

        {/* Author avatar/initials, name, role and relative time */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Avatar alt={post.authorName} size="sm" />
            <span className="font-semibold text-slate-800">{post.authorName}</span>
            <span className="text-[11px] text-slate-400 capitalize">
              ({post.authorRole.replace('_', ' ')}) &bull; {formatRelativeTime(post.createdAt)}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>{post.replies.length} replies</span>
            <span>&bull;</span>
            <span>{post.likesCount} helpful</span>
          </div>
        </div>

        {/* Full Thread Details Revealed on Click */}
        {isExpanded && (
          <div id={`post-detail-${post.id}`} className="mt-3 pt-3 border-t border-slate-200 space-y-3">
            {/* Complete Content */}
            {showFullContent ? (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-100">
                {post.content}
              </p>
            ) : (
              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-900 italic">
                This post was withheld after moderation review.
              </div>
            )}

            {/* Tags & Helpful Reaction & Report Control */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLikePost(post.id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    hasLiked
                      ? 'bg-civic-indigo-50 text-civic-indigo-700 border border-civic-indigo-200'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-civic-indigo-600' : ''}`} />
                  <span>{post.likesCount} Helpful</span>
                </button>

                {canReport && (
                  <button
                    type="button"
                    onClick={() => handleOpenReportModal(post)}
                    aria-label={`Report post: ${post.title}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition-colors"
                  >
                    <Flag className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600" />
                    <span>Report</span>
                  </button>
                )}
              </div>
            </div>

            {/* Replies Thread */}
            {post.replies.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">
                  Replies ({post.replies.length})
                </span>
                {post.replies.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{rep.authorName}</span>
                      <span className="text-[10px] text-slate-400">
                        {formatRelativeTime(rep.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{rep.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Reply Input & Button */}
            <div className="mt-2 pt-2 flex items-center gap-2">
              <input
                type="text"
                placeholder="Write a peer reply..."
                value={replyTextMap[post.id] || ''}
                onChange={(e) =>
                  setReplyTextMap((prev) => ({ ...prev, [post.id]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddReply(post.id);
                  }
                }}
                className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-civic-indigo-500"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleAddReply(post.id)}
                disabled={!replyTextMap[post.id]?.trim()}
              >
                Reply
              </Button>
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        to="/community"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Community Circles</span>
      </Link>

      {/* Group Header Card */}
      <Card className="border-slate-200 p-6 sm:p-8 space-y-4 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-civic-teal-700 bg-civic-teal-50 px-2.5 py-0.5 rounded border border-civic-teal-200">
              {group.category}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              {group.isPrivate ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Private Cohort
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5 text-slate-400" /> Open Peer Circle
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <strong>{group.memberUserIds.length}</strong> Members
            </span>

            <PointOfUseRulesButton
              moduleName="Community Circle"
              triggerText="Rules"
              modalTitle={`${group.name} — Circle Rules`}
              description="Guidelines governing discussion and peer interaction in this circle."
              rules={[
                {
                  title: 'Constructive Civic Discourse',
                  description: 'All comments and replies must support peer learning and constructive community feedback.',
                },
                {
                  title: 'Accountable Identification',
                  description: 'Postings are linked to your demo profile. Anonymous or harassing content is not permitted.',
                },
                {
                  title: 'Circle Moderation',
                  description: 'Topic threads are moderated. Inappropriate content may be reported or removed.',
                },
              ]}
              testId="group-detail-rules-btn"
            />

            <Button
              size="sm"
              variant={isMember ? 'outline' : 'primary'}
              isLoading={isJoining}
              onClick={handleToggleMembership}
            >
              {isMember ? (
                <>
                  <UserMinus className="w-3.5 h-3.5 mr-1" />
                  <span>Leave Circle</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  <span>Join Circle</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            {group.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            {group.description}
          </p>
        </div>

        {/* Local session notice */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-civic-indigo-600 shrink-0" />
          <span>
            Local peer discussion forum. Posts and comments are persisted in your local demo database.
          </span>
        </div>
      </Card>

      {/* New Topic Form / Membership Guard */}
      {isMember ? (
        <Card className="border-slate-200 p-5 space-y-3 bg-white shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-civic-indigo-600" />
            <span>New Topic: Share a Field Insight or Question</span>
          </h2>
          <form onSubmit={handleCreatePost} className="space-y-3">
            <Input
              placeholder="Topic Title (e.g. Tips for speed radar calibration during morning rush)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
            <Textarea
              placeholder="Share your observation insights, survey methods, or request peer advice..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              required
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <Input
                  placeholder="Tags (comma separated, e.g. Speed Calming, Rajkot)"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="text-xs"
                />
              </div>

              <Button size="sm" variant="primary" type="submit" isLoading={isPosting}>
                <Send className="w-3.5 h-3.5 mr-1" />
                <span>Post to Circle</span>
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="p-5 border-slate-200 bg-slate-50 text-center space-y-2">
          <p className="text-xs text-slate-600">
            You are viewing as a guest. Join this Circle to post questions, share field templates, and reply to peers.
          </p>
          <Button size="sm" variant="primary" onClick={handleToggleMembership} isLoading={isJoining}>
            <UserPlus className="w-3.5 h-3.5 mr-1" />
            <span>Join {group.name}</span>
          </Button>
        </Card>
      )}

      {/* Category Headings & Scannable Thread List */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <Card className="p-8 border-slate-200 text-center text-xs text-slate-400">
            No posts in this circle yet. Start the conversation!
          </Card>
        ) : (
          <>
            {/* Pinned Category Heading */}
            {pinnedPosts.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                  <Pin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pinned Guidelines & Key Topics ({pinnedPosts.length})</span>
                </h2>
                <div className="space-y-3">
                  {pinnedPosts.map((post) => renderThreadCard(post))}
                </div>
              </section>
            )}

            {/* Discussions Category Heading */}
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                <MessageSquare className="w-3.5 h-3.5 text-civic-indigo-600" />
                <span>
                  {pinnedPosts.length > 0
                    ? `Discussion Threads & Field Logs (${unpinnedPosts.length})`
                    : `${group.category} Peer Threads (${posts.length})`}
                </span>
              </h2>
              <div className="space-y-3">
                {unpinnedPosts.map((post) => renderThreadCard(post))}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Report Post Modal */}
      {reportingPost && (
        <Modal
          isOpen={!!reportingPost}
          onClose={handleCloseReportModal}
          title="Report Community Post"
          description="Flag inappropriate content, safety violations, or deliberative norm breaches."
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleCloseReportModal}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="button"
                isLoading={isSubmittingReport}
                onClick={handleSubmitReport}
              >
                Submit report
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmitReport} className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="font-semibold text-slate-500 uppercase block text-[10px]">
                Reported Post
              </span>
              <p className="font-bold text-slate-900 mt-0.5">{reportingPost.title}</p>
            </div>

            <div>
              <label
                htmlFor="community-post-report-reason"
                className="block text-xs font-bold text-slate-700 uppercase mb-1"
              >
                Reason for report
              </label>
              <textarea
                id="community-post-report-reason"
                rows={4}
                value={reportReason}
                onChange={(e) => {
                  setReportReason(e.target.value);
                  if (reportError) setReportError(null);
                }}
                placeholder="Explain why this content should be reviewed by a moderator..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                At least 3 characters are required for moderation review.
              </p>
            </div>

            {reportError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                {reportError}
              </div>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
};
