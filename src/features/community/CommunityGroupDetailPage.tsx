import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { CommunityGroup, CommunityPost } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Textarea, Input } from '../../components/ui/Input';
import {
  ArrowLeft,
  MessageSquare,
  ThumbsUp,
  Send,
  Users,
  Pin,
  Sparkles,
  ShieldCheck,
  UserPlus,
  UserMinus,
  Lock,
  Globe,
  Tag,
} from 'lucide-react';
import { formatRelativeTime, formatDate } from '../../utils/formatters';

export const CommunityGroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();

  const [group, setGroup] = useState<CommunityGroup | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('Pedestrian Safety, Field Tips');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [isPosting, setIsPosting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading || !group) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

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

      {/* New Post Form / Membership Guard */}
      {isMember ? (
        <Card className="border-slate-200 p-5 space-y-3 bg-white shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-civic-indigo-600" />
            <span>Share a Field Insight or Question</span>
          </h2>
          <form onSubmit={handleCreatePost} className="space-y-3">
            <Input
              placeholder="Post Title (e.g. Tips for speed radar calibration during morning rush)"
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
                  placeholder="Tags (comma separated, e.g. Speed Calming, Jaipur)"
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

      {/* Posts List */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card className="p-8 border-slate-200 text-center text-xs text-slate-400">
            No posts in this circle yet. Start the conversation!
          </Card>
        ) : (
          posts.map((post) => {
            const hasLiked = currentUser ? post.likedByUserIds?.includes(currentUser.id) : false;

            return (
              <Card
                key={post.id}
                className="border-slate-200 p-5 space-y-3 bg-white shadow-sm hover:border-slate-300 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 font-heading">
                        {post.authorName}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize">
                        ({post.authorRole.replace('_', ' ')}) &bull; {formatRelativeTime(post.createdAt)}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {post.title}
                    </h3>
                  </div>

                  {post.isPinned && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold flex items-center gap-1 shrink-0">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                {/* Tags & Likes */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
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
                </div>

                {/* Replies Thread */}
                {post.replies.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
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

                {/* Add Reply Input */}
                <div className="mt-3 pt-2 flex items-center gap-2">
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
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
