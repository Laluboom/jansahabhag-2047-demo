import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { CommunityGroup, CommunityPost } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { PointOfUseRulesButton } from '../../components/ui/PointOfUseRulesButton';
import {
  MessageSquare,
  Users,
  ArrowRight,
  Pin,
  ChevronDown,
  Tag,
  ThumbsUp,
  Send,
  Plus,
  CheckCircle2,
  Lock,
  Globe,
  X,
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';

export const CommunityPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();

  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [postsByGroup, setPostsByGroup] = useState<Record<string, CommunityPost[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPostIds, setExpandedPostIds] = useState<Set<string>>(new Set());

  // New Topic Form State
  const [isNewTopicOpen, setIsNewTopicOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('Field Tips, Peer Discussion');
  const [isPosting, setIsPosting] = useState(false);

  // Reply state
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const groupList = await demoRepository.getCommunityGroups();
        setGroups(groupList);
        if (groupList.length > 0 && !selectedGroupId) {
          setSelectedGroupId(groupList[0].id);
        }

        const postsEntries = await Promise.all(
          groupList.map(async (grp) => {
            const posts = await demoRepository.getCommunityPosts(grp.id);
            return [grp.id, posts] as const;
          })
        );
        const postsMap: Record<string, CommunityPost[]> = {};
        postsEntries.forEach(([grpId, pList]) => {
          postsMap[grpId] = pList;
        });
        setPostsByGroup(postsMap);
      } catch (err) {
        console.error('Failed to load community data', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [refreshKey]);

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

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedGroupId || !newTitle.trim() || !newContent.trim()) return;

    setIsPosting(true);
    try {
      const parsedTags = newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await demoRepository.addCommunityPost({
        groupId: selectedGroupId,
        authorId: currentUser.id,
        title: newTitle.trim(),
        content: newContent.trim(),
        tags: parsedTags.length > 0 ? parsedTags : ['Peer Discussion'],
      });

      setNewTitle('');
      setNewContent('');
      setIsNewTopicOpen(false);
      triggerRefresh();
    } catch (err) {
      console.error('Failed to create topic', err);
    } finally {
      setIsPosting(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  // Derive unique categories from groups
  const categories = Array.from(new Set(groups.map((g) => g.category)));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-civic-indigo-600" />
            <span>Community Circles & Peer Forums</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Local peer coordination spaces for sharing field audit tips, mapping methodology, and cohort reflections.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <PointOfUseRulesButton
            moduleName="Community"
            triggerText="Community Rules"
            modalTitle="Community Circles & Forum Guidelines"
            description="Standards for constructive civic discussion and peer coordination."
            rules={[
              {
                title: 'Constructive Civic Discourse',
                description: 'Discussions are focused on public safety, civic observations, and peer coordination. Disparaging or abusive speech is prohibited.',
              },
              {
                title: 'Non-Anonymous Accountability',
                description: 'Posts are associated with your registered demo persona to foster transparency and mutual trust.',
              },
              {
                title: 'Moderation & Reporting',
                description: 'Community topics are moderated locally. Violations of consent, safety, or respectful conduct may be flagged for moderator action.',
              },
            ]}
            testId="community-rules-btn"
          />
          {currentUser && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsNewTopicOpen((prev) => !prev)}
            >
              {isNewTopicOpen ? (
                <>
                  <X className="w-4 h-4 mr-1" />
                  <span>Close Form</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  <span>New Topic</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* New Topic Form */}
      {isNewTopicOpen && currentUser && (
        <Card className="border-civic-indigo-200 bg-indigo-50/40 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-civic-indigo-950 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-civic-indigo-600" />
              <span>Start a New Community Topic</span>
            </h2>
            <button
              type="button"
              onClick={() => setIsNewTopicOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
              aria-label="Close new topic form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateTopic} className="space-y-3">
            <div>
              <label htmlFor="group-select" className="text-xs font-semibold text-slate-700 block mb-1">
                Select Community Circle
              </label>
              <select
                id="group-select"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-civic-indigo-500"
              >
                {groups.map((grp) => (
                  <option key={grp.id} value={grp.id}>
                    {grp.name} ({grp.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Input
                placeholder="Topic Title (e.g. Tips for speed radar calibration during morning rush)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <Textarea
                placeholder="Share your observation insights, survey methods, or request peer advice..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={3}
                required
              />
            </div>

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

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => setIsNewTopicOpen(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" variant="primary" type="submit" isLoading={isPosting}>
                  <Send className="w-3.5 h-3.5 mr-1" />
                  <span>Publish Topic</span>
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      {/* Category Headings & Title-First Scannable Threads */}
      <div className="space-y-10">
        {categories.map((category) => {
          const categoryGroups = groups.filter((g) => g.category === category);

          return (
            <section key={category} className="space-y-5">
              {/* Category Heading */}
              <h2 className="text-lg sm:text-xl font-bold font-heading text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                <span>{category}</span>
                <span className="text-xs font-normal text-slate-500">
                  {categoryGroups.length} {categoryGroups.length === 1 ? 'circle' : 'circles'}
                </span>
              </h2>

              <div className="space-y-6">
                {categoryGroups.map((grp) => {
                  const isMember = currentUser ? grp.memberUserIds.includes(currentUser.id) : false;
                  const groupPosts = postsByGroup[grp.id] || [];

                  return (
                    <Card key={grp.id} className="p-5 border-slate-200 bg-white shadow-sm space-y-4">
                      {/* Circle Info Summary Banner */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-civic-teal-700 bg-civic-teal-50 px-2 py-0.5 rounded border border-civic-teal-200">
                              {grp.category}
                            </span>
                            {isMember && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Member
                              </span>
                            )}
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              {grp.isPrivate ? (
                                <>
                                  <Lock className="w-3 h-3" /> Private
                                </>
                              ) : (
                                <>
                                  <Globe className="w-3 h-3" /> Open
                                </>
                              )}
                            </span>
                          </div>

                          <CardTitle className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                            {grp.name}
                          </CardTitle>
                          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl line-clamp-2">
                            {grp.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>{grp.memberUserIds.length} Members</span>
                          </span>

                          <Link to={`/community/groups/${grp.id}`}>
                            <Button size="sm" variant="outline" className="text-xs">
                              <span>Open Forum</span>
                              <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>

                      {/* Scannable Thread Titles with One-Line Snippet, Author, Time, and Expand */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <span>Recent Threads ({groupPosts.length})</span>
                          <span>Click thread to reveal full conversation & replies</span>
                        </div>

                        {groupPosts.length === 0 ? (
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-400">
                            No peer threads in this circle yet. Start the first topic!
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {groupPosts.map((post) => {
                              const isExpanded = expandedPostIds.has(post.id);
                              const hasLiked = currentUser ? post.likedByUserIds?.includes(currentUser.id) : false;

                              return (
                                <div
                                  key={post.id}
                                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-2"
                                >
                                  {/* Scannable Title & Snippet Row - Title-First Browsing */}
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandPost(post.id)}
                                    aria-expanded={isExpanded}
                                    aria-controls={`thread-${post.id}`}
                                    className="w-full text-left space-y-1 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500 rounded p-1"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <h3 className="text-sm font-bold text-slate-900 hover:text-civic-indigo-700 transition-colors">
                                        {post.title}
                                      </h3>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {post.isPinned && (
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold flex items-center gap-1">
                                            <Pin className="w-2.5 h-2.5" /> Pinned
                                          </span>
                                        )}
                                        <ChevronDown
                                          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                                            isExpanded ? 'rotate-180 text-civic-indigo-600' : ''
                                          }`}
                                        />
                                      </div>
                                    </div>

                                    {/* One-line snippet */}
                                    <p className="text-xs text-slate-600 line-clamp-1 truncate">
                                      {post.content}
                                    </p>
                                  </button>

                                  {/* Author avatar/initials and time bar */}
                                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1">
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
                                    <div id={`thread-${post.id}`} className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                                      {/* Full Content */}
                                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-white p-3 rounded-lg border border-slate-100">
                                        {post.content}
                                      </p>

                                      {/* Tags & Like Action */}
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

                                        <button
                                          type="button"
                                          onClick={() => handleLikePost(post.id)}
                                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                                            hasLiked
                                              ? 'bg-civic-indigo-50 text-civic-indigo-700 border border-civic-indigo-200'
                                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                          }`}
                                        >
                                          <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-civic-indigo-600' : ''}`} />
                                          <span>{post.likesCount} Helpful</span>
                                        </button>
                                      </div>

                                      {/* Replies List */}
                                      {post.replies.length > 0 && (
                                        <div className="space-y-2 pt-1">
                                          <span className="text-[11px] font-bold text-slate-500 uppercase block">
                                            Replies ({post.replies.length})
                                          </span>
                                          {post.replies.map((rep) => (
                                            <div
                                              key={rep.id}
                                              className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs space-y-1"
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

                                      {/* Inline Reply Input */}
                                      <div className="pt-2 flex items-center gap-2">
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
                                          className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-civic-indigo-500"
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
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
