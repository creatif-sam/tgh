'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Post, PostReaction, PostComment, Profile } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Heart,
  MessageSquare,
  Send,
  MoreVertical,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type PostWithProfile = Post & { profiles: Profile };

interface PostCardProps {
  post: PostWithProfile;
  currentUserId: string;
  onUpdate?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
}

export default function PostCard({ post, currentUserId, onUpdate, onDelete }: PostCardProps) {
  const [reactions, setReactions] = useState<PostReaction[]>([]);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [userReaction, setUserReaction] = useState<PostReaction | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReactions();
    fetchComments();
  }, [post.id]);

  const fetchReactions = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('post_reactions')
      .select('*')
      .eq('post_id', post.id);

    setReactions(data || []);

    // Check if current user has reacted
    const userReact = data?.find(r => r.user_id === currentUserId);
    setUserReaction(userReact || null);
  };

  const fetchComments = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('post_comments')
      .select(`
        *,
        profiles:author_id (name, avatar_url)
      `)
      .eq('post_id', post.id)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: true });

    if (data) {
      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        data.map(async (comment) => {
          const { data: replies } = await supabase
            .from('post_comments')
            .select(`
              *,
              profiles:author_id (name, avatar_url)
            `)
            .eq('parent_comment_id', comment.id)
            .order('created_at', { ascending: true });

          return {
            ...comment,
            replies: replies || []
          };
        })
      );
      setComments(commentsWithReplies);
    }
  };

  const handleReaction = async () => {
    if (loading) return;
    setLoading(true);

    const supabase = createClient();

    if (userReaction) {
      // Remove reaction
      await supabase
        .from('post_reactions')
        .delete()
        .eq('id', userReaction.id);

      setReactions(prev => prev.filter(r => r.id !== userReaction.id));
      setUserReaction(null);
    } else {
      // Add reaction
      const { data } = await supabase
        .from('post_reactions')
        .insert({
          post_id: post.id,
          user_id: currentUserId,
          reaction: 'like'
        })
        .select()
        .single();

      if (data) {
        setReactions(prev => [...prev, data]);
        setUserReaction(data);
      }
    }

    setLoading(false);
  };

  const handleComment = async () => {
    if (!newComment.trim() || loading) {
      return;
    }
    setLoading(true);

    const supabase = createClient();

    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: post.id,
        author_id: currentUserId,
        content: newComment
      })
      .select(`
        *,
        profiles:author_id (name, avatar_url)
      `)
      .single();

    if (data) {
      setComments(prev => [...prev, { ...data, replies: [] }]);
      setNewComment('');
    } else {
      console.error('Failed to add comment:', error);
    }

    setLoading(false);
  };

  const handleReply = async (parentCommentId: string, replyContent: string) => {
    if (!replyContent.trim() || loading) return;
    setLoading(true);

    const supabase = createClient();
    const { data } = await supabase
      .from('post_comments')
      .insert({
        post_id: post.id,
        author_id: currentUserId,
        parent_comment_id: parentCommentId,
        content: replyContent
      })
      .select(`
        *,
        profiles:author_id (name, avatar_url)
      `)
      .single();

    if (data) {
      setComments(prev =>
        prev.map(comment =>
          comment.id === parentCommentId
            ? { ...comment, replies: [...(comment.replies || []), data] }
            : comment
        )
      );
    }

    setLoading(false);
  };

  const handleEditComment = async (commentId: string) => {
    if (!editCommentContent.trim() || loading) return;
    setLoading(true);

    const supabase = createClient();
    await supabase
      .from('post_comments')
      .update({ content: editCommentContent })
      .eq('id', commentId);

    setComments(prev =>
      prev.map(comment =>
        comment.id === commentId
          ? { ...comment, content: editCommentContent }
          : comment
      )
    );

    setEditingComment(null);
    setEditCommentContent('');
    setLoading(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    const supabase = createClient();
    await supabase
      .from('post_comments')
      .delete()
      .eq('id', commentId);

    setComments(prev => prev.filter(comment => comment.id !== commentId));
  };

  const likeCount = reactions.length;
  const commentCount = comments.reduce((acc, comment) => acc + 1 + (comment.replies?.length || 0), 0);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.profiles?.avatar_url} alt={post.profiles?.name || 'User'} />
              <AvatarFallback>
                {post.profiles?.name ? post.profiles.name.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{post.profiles?.name || 'Anonymous'}</p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {post.visibility === 'shared' && (
              <Badge variant="secondary" className="text-xs">Shared</Badge>
            )}
            {currentUserId === post.author_id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onUpdate?.(post.id, post.content)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete?.(post.id)} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm mb-4 whitespace-pre-wrap">{post.content}</p>

        {/* Reaction and Comment Buttons */}
        <div className="flex items-center space-x-4 mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReaction}
            disabled={loading}
            className={`flex items-center space-x-1 ${userReaction ? 'text-red-500' : 'text-gray-500'}`}
          >
            <Heart className={`h-4 w-4 ${userReaction ? 'fill-current' : ''}`} />
            <span className="text-xs">{likeCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1 text-gray-500"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs">{commentCount}</span>
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="border-t pt-3 space-y-3">
            {/* Add Comment */}
            <div className="flex space-x-2">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 text-sm"
                rows={2}
              />
              <Button
                size="sm"
                onClick={() => {
                  handleComment();
                }}
                disabled={!newComment.trim() || loading}
                className="self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  onReply={handleReply}
                  onEdit={handleEditComment}
                  onDelete={handleDeleteComment}
                  editingComment={editingComment}
                  setEditingComment={setEditingComment}
                  editCommentContent={editCommentContent}
                  setEditCommentContent={setEditCommentContent}
                  loading={loading}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CommentItemProps {
  comment: PostComment;
  currentUserId: string;
  onReply: (parentId: string, content: string) => void;
  onEdit: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  editingComment: string | null;
  setEditingComment: (id: string | null) => void;
  editCommentContent: string;
  setEditCommentContent: (content: string) => void;
  loading: boolean;
}

function CommentItem({
  comment,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  editingComment,
  setEditingComment,
  editCommentContent,
  setEditCommentContent,
  loading
}: CommentItemProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleReplySubmit = () => {
    if (replyContent.trim()) {
      onReply(comment.id, replyContent);
      setReplyContent('');
      setShowReply(false);
    }
  };

  const isEditing = editingComment === comment.id;
  const canEdit = comment.author_id === currentUserId;

  return (
    <div className="border-l-2 border-gray-200 pl-3 space-y-2">
      <div className="flex items-start space-x-2">
        <Avatar className="h-6 w-6">
          <AvatarImage src={comment.profiles?.avatar_url} />
          <AvatarFallback className="text-xs">
            {comment.profiles?.name?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-xs">{comment.profiles?.name || 'Anonymous'}</span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>

          {isEditing ? (
            <div className="flex space-x-2 mt-1">
              <Textarea
                value={editCommentContent}
                onChange={(e) => setEditCommentContent(e.target.value)}
                className="flex-1 text-sm"
                rows={2}
              />
              <div className="flex flex-col space-y-1">
                <Button size="sm" onClick={() => onEdit(comment.id)} disabled={loading}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingComment(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm mt-1">{comment.content}</p>
          )}

          {!isEditing && (
            <div className="flex items-center space-x-2 mt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReply(!showReply)}
                className="text-xs h-6 px-2"
              >
                Reply
              </Button>
              {canEdit && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingComment(comment.id);
                      setEditCommentContent(comment.content);
                    }}
                    className="text-xs h-6 px-2"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(comment.id)}
                    className="text-xs h-6 px-2 text-red-500"
                  >
                    Delete
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reply Input */}
      {showReply && (
        <div className="flex space-x-2 ml-8">
          <Textarea
            placeholder="Write a reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="flex-1 text-sm"
            rows={2}
          />
          <div className="flex flex-col space-y-1">
            <Button size="sm" onClick={handleReplySubmit} disabled={!replyContent.trim() || loading}>
              Reply
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowReply(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 space-y-2">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="border-l-2 border-gray-100 pl-3">
              <div className="flex items-start space-x-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={reply.profiles?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {reply.profiles?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-xs">{reply.profiles?.name || 'Anonymous'}</span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{reply.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}