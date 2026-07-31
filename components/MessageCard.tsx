'use client';

import { motion } from 'framer-motion';
import NextImage from 'next/image';
import { Message, Reply } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Share2, Heart, MessageSquare, Repeat2 } from 'lucide-react';
import { getMessage, hasLikedMessage, likeMessage, subscribeToReplies, unlikeMessage } from '@/lib/firestore';
import { useState, useEffect } from 'react';
import ReplyModal from './ReplyModal';
import RepostModal from './RepostModal';

interface MessageCardProps {
  message: Message;
  index: number;
  onClick: () => void;
  scrollable?: boolean; // Enable scrollable content with fixed header
  availableGroups?: string[]; // Available groups for reposting
  spaceCode: string; // Space code for scoping operations
  onShare?: () => void; // New prop for custom sharing behavior
  isCopied?: boolean; // New prop for showing copied state
}

export default function MessageCard({
  message,
  index,
  onClick,
  scrollable = false,
  availableGroups = [],
  spaceCode,
  onShare,
  isCopied
}: MessageCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [originalMessage, setOriginalMessage] = useState<Message | null>(null);

  const formattedTime = message.timestamp
    ? formatDistanceToNow(message.timestamp.toDate(), { addSuffix: true })
    : 'just now';

  // Fetch original message if this is a repost
  useEffect(() => {
    if (message.repostedFrom) {
      getMessage(message.repostedFrom, spaceCode).then((msg) => {
        if (msg) setOriginalMessage(msg);
      });
    }
  }, [message.repostedFrom, spaceCode]);

  // The per-user like document is the source of truth. It prevents a single
  // anonymous account from incrementing the same message repeatedly.
  useEffect(() => {
    let cancelled = false;
    hasLikedMessage(message.id)
      .then((liked) => {
        if (!cancelled) setHasLiked(liked);
      })
      .catch((error) => console.error('Error checking like status:', error));

    return () => {
      cancelled = true;
    };
  }, [message.id]);

  // Subscribe to replies for this message
  useEffect(() => {
    const unsubscribe = subscribeToReplies(message.id, (repliesData) => {
      setReplies(repliesData);
    });

    return () => unsubscribe();
  }, [message.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening share modal
    if (isLiking) return; // Prevent multiple clicks while processing

    setIsLiking(true);
    try {
      if (hasLiked) {
        // Unlike the message
        await unlikeMessage(message.id, spaceCode);
        setHasLiked(false);
      } else {
        // Like the message
        await likeMessage(message.id, spaceCode);
        setHasLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setTimeout(() => setIsLiking(false), 500); // Reset after animation
    }
  };

  const handleReply = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening share modal
    setShowReplyModal(true);
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening share modal
    setShowRepostModal(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={scrollable ? {} : { scale: 1.02, y: -5 }}
      className="group cursor-pointer"
      onClick={onClick}
      id={`message-${message.id}`}
    >
      <div
        className={`${scrollable ? 'h-full max-h-[calc(90vh-120px)] flex flex-col' : 'h-full'} p-6 sm:p-8 rounded-2xl card-modern relative overflow-hidden`}
      >
        {/* Subtle color accent */}
        <div
          className="absolute top-0 left-0 w-full h-1 rounded-t-2xl"
          style={{
            background: `linear-gradient(90deg, ${message.color || '#6366f1'}, ${message.color ? message.color.replace(')', ', 0.6)') : '#4f46e5'})`,
          }}
        />
        {/* Share Icon Hint */}
        {!scrollable && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="p-2 rounded-full bg-surface-50/60 backdrop-blur-sm">
              <Share2 className="w-4 h-4 text-brand-600" />
            </div>
          </div>
        )}
        {/* Header - Fixed when scrollable */}
        <div className={`flex items-start justify-between ${scrollable ? 'mb-3 shrink-0' : 'mb-3'}`}>
          <div className="flex-1">
            {message.repostedFrom && (
              <div className="flex items-center gap-1.5 mb-2">
                <Repeat2 className="w-3 h-3 text-brand-600" />
                <span className="text-xs text-brand-900/80 italic flex items-center gap-1">
                  Reposted by
                  <span className="inline-flex items-center gap-1">
                    <NextImage src="/avatar-3d.png" alt="User" width={16} height={16} className="w-4 h-4 object-contain opacity-80" />
                    <span className="text-brand-600 font-medium">{message.from || 'Anonymous'}</span>
                  </span>
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {!message.repostedFrom && (
                <span className="text-sm font-medium text-brand-900 flex items-center gap-1.5">
                  <span>From:</span>
                  <span className="inline-flex items-center gap-1.5">
                    <NextImage src="/avatar-3d.png" alt="User" width={20} height={20} className="w-5 h-5 object-contain opacity-80" />
                    <span className="text-brand-600">{message.from || 'Anonymous'}</span>
                  </span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-brand-900/70">To:</span>
              {message.to.map((recipient, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-xs rounded-full bg-surface-50/50 backdrop-blur-sm border border-surface-200/60 text-brand-900/80"
                >
                  {recipient}
                </span>
              ))}
            </div>
          </div>
          <span className="text-xs text-brand-900/70 whitespace-nowrap ml-2">
            {formattedTime}
          </span>
        </div>

        {/* Scrollable Content Area */}
        <div className={scrollable ? 'flex-1 overflow-y-auto card-scrollbar' : ''}>
          {/* If repost: Show repost comment first, then original message */}
          {message.repostedFrom && originalMessage ? (
            <div className="mb-3">
              {/* Repost Comment */}
              {message.repostComment && (
                <p className="text-brand-900 leading-relaxed whitespace-pre-wrap wrap-break-word mb-3">
                  {message.repostComment}
                </p>
              )}

              {/* Nested Original Message Reference */}
              <div className={`p-3 sm:p-4 rounded-xl bg-surface-50/80 backdrop-blur-sm border border-surface-200/60 shadow-sm ${message.repostComment ? 'ml-2 sm:ml-4' : ''}`}>
                {/* Original Message Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-medium text-brand-900 flex items-center gap-1">
                        <NextImage src="/avatar-3d.png" alt="User" width={16} height={16} className="w-4 h-4 object-contain opacity-80" />
                        {originalMessage.from || 'Anonymous'}
                      </span>
                      {originalMessage.timestamp && (
                        <span className="text-xs text-brand-900/70">
                          {formatDistanceToNow(originalMessage.timestamp.toDate(), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs text-brand-900/70">To:</span>
                      {originalMessage.to.map((recipient, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 text-xs rounded-full bg-surface-100/60 border border-surface-200/60 text-surface-600"
                        >
                          {recipient}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Original Message Content */}
                <p className="text-sm text-brand-900 leading-relaxed whitespace-pre-wrap wrap-break-word">
                  {originalMessage.content}
                </p>

              </div>
            </div>
          ) : (
            <>
              {/* Regular Message Content */}
              <p className="text-brand-900 leading-relaxed whitespace-pre-wrap wrap-break-word">
                {message.content}
              </p>

            </>
          )}

          {/* Replies Section */}
          {replies.length > 0 && (
            <div className="mt-4 pt-4 border-t border-surface-200/40">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-brand-600" />
                <span className="text-sm font-medium text-brand-900">
                  {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
                </span>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto card-scrollbar">
                {replies.map((reply) => (
                  <motion.div
                    key={reply.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-surface-50/40 backdrop-blur-sm border border-surface-100/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-brand-600 flex items-center gap-1.5">
                        <NextImage src="/avatar-3d.png" alt="User" width={16} height={16} className="w-4 h-4 object-contain opacity-80" />
                        {reply.from || 'Anonymous'}
                      </span>
                      <span className="text-xs text-brand-900/70">
                        {reply.timestamp ? formatDistanceToNow(reply.timestamp.toDate(), { addSuffix: true }) : 'just now'}
                      </span>
                    </div>
                    <p className="text-sm text-brand-900 whitespace-pre-wrap">
                      {reply.content}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <motion.button
                onClick={handleReply}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-sm border bg-surface-50/60 border-surface-50/60 hover:bg-surface-100/80 hover:border-brand-300 cursor-pointer transition-all duration-200"
                whileTap={{ scale: 0.9 }}
                title="Reply to this message"
              >
                <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
                <span className="text-xs font-medium text-brand-900/80 hidden sm:inline">
                  Reply
                </span>
              </motion.button>
              <motion.button
                onClick={handleRepost}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-sm border bg-surface-50/60 border-surface-50/60 hover:bg-surface-100/80 hover:border-brand-300 cursor-pointer transition-all duration-200"
                whileTap={{ scale: 0.9 }}
                title="Repost this message"
              >
                <Repeat2 className="w-3.5 h-3.5 text-brand-600" />
                <span className="text-xs font-medium text-brand-900/80 hidden sm:inline">
                  Repost
                </span>
              </motion.button>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onShare) {
                    onShare();
                  } else {
                    onClick();
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-sm border transition-all duration-200 ${isCopied
                  ? 'bg-brand-100 border-brand-300 text-brand-700'
                  : 'bg-surface-50/60 border-surface-50/60 hover:bg-surface-100/80 hover:border-brand-300'
                  }`}
                whileTap={{ scale: 0.9 }}
                title="Share this message"
              >
                <Share2 className="w-3.5 h-3.5 text-brand-600" />
                <span className="text-xs font-medium text-brand-900/80 hidden sm:inline">
                  {isCopied ? 'Copied!' : 'Share'}
                </span>
              </motion.button>
            </div>
            <motion.button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-sm border transition-all duration-200 ${hasLiked
                ? 'bg-accent-100/80 border-accent-300 hover:bg-accent-100/90 hover:border-accent-400 cursor-pointer'
                : 'bg-surface-50/60 border-surface-50/60 hover:bg-surface-100/80 hover:border-accent-300 cursor-pointer disabled:opacity-50'
                }`}
              whileTap={{ scale: 0.9 }}
              title={hasLiked ? 'Unlike this message' : 'Like this message'}
            >
              <motion.div
                animate={isLiking ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart
                  className={`w-3.5 h-3.5 transition-colors ${hasLiked || (message.likes || 0) > 0
                    ? 'text-accent-500 fill-accent-500'
                    : 'text-brand-900/60'
                    }`}
                />
              </motion.div>
              <span className={`text-xs font-medium ${hasLiked ? 'text-accent-600' : 'text-brand-900/80'}`}>
                {message.likes || 0}
              </span>
            </motion.button>
          </div>

          {/* Decorative element on hover */}
          {!scrollable && (
            <div className="mt-4 h-0.5 bg-gradient-to-r from-brand-200/0 via-brand-200/40 to-brand-200/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>

      {/* Reply Modal */}
      <ReplyModal
        isOpen={showReplyModal}
        onClose={() => setShowReplyModal(false)}
        messageId={message.id}
        messageFrom={message.from}
      />

      {/* Repost Modal */}
      <RepostModal
        isOpen={showRepostModal}
        onClose={() => setShowRepostModal(false)}
        messageId={message.repostedFrom || message.id}
        originalMessage={message.repostedFrom ? originalMessage || undefined : message}
        availableGroups={availableGroups}
        spaceCode={spaceCode}
      />
    </motion.div>
  );
}
