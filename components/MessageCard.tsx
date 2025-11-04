'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Message, Reply } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Share2, Heart, MessageSquare, Repeat2 } from 'lucide-react';
import { likeMessage, unlikeMessage, subscribeToReplies, getMessage } from '@/lib/firestore';
import { useState, useEffect } from 'react';
import ReplyModal from './ReplyModal';
import RepostModal from './RepostModal';

interface MessageCardProps {
  message: Message;
  index: number;
  onClick: () => void;
  scrollable?: boolean; // Enable scrollable content with fixed header
  availableGroups?: string[]; // Available groups for reposting
}

const LIKED_MESSAGES_KEY = 'kiyokocon_liked_messages';

// Get liked messages from localStorage
const getLikedMessages = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  const stored = localStorage.getItem(LIKED_MESSAGES_KEY);
  return stored ? new Set(JSON.parse(stored)) : new Set();
};

// Save a liked message to localStorage
const saveLikedMessage = (messageId: string): void => {
  if (typeof window === 'undefined') return;
  const liked = getLikedMessages();
  liked.add(messageId);
  localStorage.setItem(LIKED_MESSAGES_KEY, JSON.stringify([...liked]));
};

// Remove a liked message from localStorage
const removeLikedMessage = (messageId: string): void => {
  if (typeof window === 'undefined') return;
  const liked = getLikedMessages();
  liked.delete(messageId);
  localStorage.setItem(LIKED_MESSAGES_KEY, JSON.stringify([...liked]));
};

export default function MessageCard({ message, index, onClick, scrollable = false, availableGroups = [] }: MessageCardProps) {
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
      getMessage(message.repostedFrom).then((msg) => {
        if (msg) setOriginalMessage(msg);
      });
    }
  }, [message.repostedFrom]);

  // Check if this message has been liked on mount
  useEffect(() => {
    const likedMessages = getLikedMessages();
    setHasLiked(likedMessages.has(message.id));
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
        await unlikeMessage(message.id);
        removeLikedMessage(message.id);
        setHasLiked(false);
      } else {
        // Like the message
        await likeMessage(message.id);
        saveLikedMessage(message.id);
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
    >
      <div
        className={`${scrollable ? 'h-full max-h-[calc(90vh-120px)] flex flex-col' : 'h-full'} p-4 sm:p-6 rounded-3xl backdrop-blur-md border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden`}
        style={{
          backgroundImage: 'url(/kiyokocon-card.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Overlay for text readability */}
        <div 
          className="absolute inset-0 rounded-3xl -z-10"
          style={{
            backgroundColor: message.color ? `${message.color}60` : 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(8px)',
          }}
        />
        {/* Share Icon Hint */}
        {!scrollable && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="p-2 rounded-full bg-white/60 backdrop-blur-sm">
              <Share2 className="w-4 h-4 text-purple-600" />
            </div>
          </div>
        )}
        {/* Header - Fixed when scrollable */}
        <div className={`flex items-start justify-between ${scrollable ? 'mb-3 shrink-0' : 'mb-3'}`}>
          <div className="flex-1">
            {message.repostedFrom && (
              <div className="flex items-center gap-1.5 mb-2">
                <Repeat2 className="w-3 h-3 text-purple-600" />
                <span className="text-xs text-gray-600 italic">
                  Reposted by <span className="text-purple-600 font-medium">{message.from || 'Anonymous'}</span>
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {!message.repostedFrom && (
                <span className="text-sm font-medium text-gray-700">
                  From: <span className="text-purple-600">{message.from || 'Anonymous'}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-gray-500">To:</span>
              {message.to.map((recipient, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-xs rounded-full bg-white/50 backdrop-blur-sm border border-white/60 text-gray-700"
                >
                  {recipient}
                </span>
              ))}
            </div>
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
            {formattedTime}
          </span>
        </div>

        {/* Scrollable Content Area */}
        <div className={scrollable ? 'flex-1 overflow-y-auto card-scrollbar' : ''}>
          {/* Repost Comment */}
          {message.repostComment && (
            <div className="mb-3 p-3 rounded-xl bg-purple-50/60 backdrop-blur-sm border border-purple-200/50">
              <p className="text-sm text-gray-700 whitespace-pre-wrap italic">
                "{message.repostComment}"
              </p>
            </div>
          )}

          {/* Original Message Info (if repost) */}
          {message.repostedFrom && originalMessage && (
            <div className="mb-3 p-3 rounded-xl bg-gray-50/60 backdrop-blur-sm border border-gray-200/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500">Original message from:</span>
                <span className="text-xs font-medium text-purple-600">
                  {originalMessage.from || 'Anonymous'}
                </span>
              </div>
            </div>
          )}

          {/* Message Content */}
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap wrap-break-word">
            {message.content}
          </p>

          {/* Image Attachment */}
          {message.imageUrl && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 rounded-2xl overflow-hidden border border-white/60 shadow-md relative"
            >
              <div className="relative w-full" style={{ minHeight: '200px' }}>
                <Image
                  src={message.imageUrl}
                  alt="Message attachment"
                  width={600}
                  height={400}
                  className="w-full max-h-96 object-contain bg-white/50"
                  style={{ width: '100%', height: 'auto' }}
                />
              </div>
            </motion.div>
          )}

          {/* Replies Section */}
          {replies.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/40">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">
                  {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
                </span>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto card-scrollbar">
                {replies.map((reply) => (
                  <motion.div
                    key={reply.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-white/40 backdrop-blur-sm border border-white/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-purple-600">
                        {reply.from || 'Anonymous'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {reply.timestamp ? formatDistanceToNow(reply.timestamp.toDate(), { addSuffix: true }) : 'just now'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm border bg-white/60 border-white/60 hover:bg-white/80 hover:border-purple-300 cursor-pointer transition-all duration-200"
                whileTap={{ scale: 0.9 }}
                title="Reply to this message"
              >
                <MessageSquare className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  Reply
                </span>
              </motion.button>
              <motion.button
                onClick={handleRepost}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm border bg-white/60 border-white/60 hover:bg-white/80 hover:border-purple-300 cursor-pointer transition-all duration-200"
                whileTap={{ scale: 0.9 }}
                title="Repost this message"
              >
                <Repeat2 className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  Repost
                </span>
              </motion.button>
            </div>
            <motion.button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm border transition-all duration-200 ${
                hasLiked
                  ? 'bg-pink-100/80 border-pink-300 hover:bg-pink-100/90 hover:border-pink-400 cursor-pointer'
                  : 'bg-white/60 border-white/60 hover:bg-white/80 hover:border-pink-300 cursor-pointer disabled:opacity-50'
              }`}
              whileTap={{ scale: 0.9 }}
              title={hasLiked ? 'Unlike this message' : 'Like this message'}
            >
              <motion.div
                animate={isLiking ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart 
                  className={`w-4 h-4 transition-colors ${
                    hasLiked || (message.likes || 0) > 0 
                      ? 'text-pink-500 fill-pink-500' 
                      : 'text-gray-500'
                  }`}
                />
              </motion.div>
              <span className={`text-sm font-medium ${hasLiked ? 'text-pink-600' : 'text-gray-700'}`}>
                {message.likes || 0}
              </span>
            </motion.button>
          </div>

          {/* Decorative element on hover */}
          {!scrollable && (
            <div className="mt-4 h-0.5 bg-linear-to-r from-purple-200/0 via-purple-200/40 to-purple-200/0 opacity-0 group-hover:opacity-100 transition-opacity" />
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
      />
    </motion.div>
  );
}

