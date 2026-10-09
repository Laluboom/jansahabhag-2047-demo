import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { CommunityGroup, CommunityPost } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Textarea, Input } from '../../components/ui/Input';
import { ArrowLeft, MessageSquare, ThumbsUp, Send, Users, Pin } from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';

export const CommunityGroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();

  const [group, setGroup] = useState<CommunityGroup | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [isPosting, setIsPosting] = useState(false);
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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser || !newTitle.trim() || !newContent.trim()) return;

    setIsPosting(true);
    try {
      await demoRepository.addCommunityPost({
        groupId: id,
        authorId: currentUser.id,
        title: newTitle.trim(),
        content: newContent.trim(),
        tags: ['Civic Discussion'],
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

  if (isLoading || !group) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/community" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Community Groups</span>
      </Link>

      <Card className="border-slate-200 p-6 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-civic-teal-700 bg-civic-teal-50 px-2.5 py-0.5 rounded border border-civic-teal-200">
            {group.category}
          </span>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {group.memberUserIds.length} Members
          </span>
        </div>
        <h1 className="text-2xl font-bold font-heading text-slate-900">
          {group.name}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">{group.description}</p>
      </Card>

      {/* New Post Form */}
      <Card className="border-slate-200 p-5 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Share a Post or Field Question
        </h2>
        <form onSubmit={handleCreatePost} className="space-y-3">
          <Input
            placeholder="Post Title (e.g. Tips for observation timing)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
          <Textarea
            placeholder="Write your observation thoughts, survey ideas, or peer question..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={3}
            required
          />
          <div className="flex justify-end">
            <Button size="sm" variant="primary" type="submit" isLoading={isPosting}>
              <Send className="w-3.5 h-3.5 mr-1" />
              <span>Post to Circle</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="border-slate-200 p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 font-heading">
                    {post.authorName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    &bull; {formatRelativeTime(post.createdAt)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {post.title}
                </h3>
              </div>
              {post.isPinned && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold flex items-center gap-1">
                  <Pin className="w-3 h-3" /> Pinned
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {post.content}
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {post.tags.map((tag, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Replies */}
            {post.replies.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  Replies ({post.replies.length})
                </span>
                {post.replies.map((rep) => (
                  <div key={rep.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{rep.authorName}</span>
                      <span className="text-[10px] text-slate-400">{formatRelativeTime(rep.createdAt)}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{rep.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Reply Input */}
            <div className="mt-3 pt-2 flex items-center gap-2">
              <input
                type="text"
                placeholder="Write a reply..."
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
                className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white"
              />
              <Button size="sm" variant="secondary" onClick={() => handleAddReply(post.id)}>
                Reply
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
