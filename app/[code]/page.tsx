'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Heart, Mail, Share2, PlusCircle, ArrowRight } from 'lucide-react';
import NextImage from 'next/image';
import MessageComposer from '@/components/MessageComposer';
import MessageCard from '@/components/MessageCard';
import FilterBar from '@/components/FilterBar';
import FloatingParticles from '@/components/FloatingParticles';
import ShareModal from '@/components/ShareModal';
import RandomCardViewer from '@/components/RandomCardViewer';
import { getSpaceByCode, subscribeToMessages } from '@/lib/firestore';
import { Message, Space } from '@/lib/types';

export default function SpacePage() {
  const params = useParams();
  const router = useRouter();
  const spaceCode = (params.code as string)?.toLowerCase().trim() || '';

  const [space, setSpace] = useState<Space | null>(null);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [isLoadingSpace, setIsLoadingSpace] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isRandomViewerOpen, setIsRandomViewerOpen] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [copiedState, setCopiedState] = useState<'space' | string | null>(null);

  // Load space configuration
  useEffect(() => {
    if (!spaceCode) {
      router.push('/');
      return;
    }

    const loadSpace = async () => {
      try {
        const spaceData = await getSpaceByCode(spaceCode);
        if (!spaceData) {
          router.push('/');
          return;
        }
        setSpace(spaceData);
        setIsLoadingSpace(false);
        // Set document title to space name in full caps
        if (spaceData.title) {
          document.title = `${spaceData.title.toUpperCase()} | YourWall`;
        }
      } catch (error) {
        console.error('Error loading space:', error);
        router.push('/');
      }
    };

    loadSpace();
  }, [spaceCode, router]);

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    setIsShareModalOpen(true);
  };

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false);
    setTimeout(() => setSelectedMessage(null), 300);
  };

  const handleShareSpace = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href.split('#')[0]);
      setCopiedState('space');
      setTimeout(() => setCopiedState(null), 2000);
    } catch (err) {
      console.error('Error copying link:', err);
    }
  };

  const handleShareMessage = async (messageId: string) => {
    try {
      const url = `${window.location.href.split('#')[0]}#message-${messageId}`;
      await navigator.clipboard.writeText(url);
      setCopiedState(messageId);
      setTimeout(() => setCopiedState(null), 2000);
    } catch (err) {
      console.error('Error copying message link:', err);
    }
  };

  // Check if user has submitted a message
  useEffect(() => {
    if (!spaceCode) return;

    const checkSubmissionStatus = () => {
      const hasSubmittedMessage = localStorage.getItem(`hasSubmittedMessage_${spaceCode}`) === 'true';
      setHasSubmitted(hasSubmittedMessage);
    };

    checkSubmissionStatus();

    const handleMessageSubmitted = () => {
      setHasSubmitted(true);
    };

    window.addEventListener('messageSubmitted', handleMessageSubmitted);

    return () => {
      window.removeEventListener('messageSubmitted', handleMessageSubmitted);
    };
  }, [spaceCode]);

  // Subscribe to all messages (no server-side filtering)
  useEffect(() => {
    if (!spaceCode) return;

    const unsubscribeMessages = subscribeToMessages(
      spaceCode,
      (newMessages) => {
        setAllMessages(newMessages);
        setMessagesError(null);
        setIsLoading(false);
      },
      undefined, // No filter - get all messages
      () => {
        setMessagesError('Messages could not be loaded. Please refresh and try again.');
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribeMessages();
    };
  }, [spaceCode]);

  // Filter and sort messages client-side based on selected filter and sort
  const filteredMessages = useMemo(() => {
    let filtered = allMessages;

    // Apply recipient filter
    if (selectedFilter !== 'all') {
      const recipientsInMessages = new Set<string>();
      allMessages.forEach(msg => msg.to.forEach(r => recipientsInMessages.add(r)));

      const matchingRecipient = Array.from(recipientsInMessages).find(
        r => r.toLowerCase() === selectedFilter
      );

      if (matchingRecipient) {
        filtered = allMessages.filter(msg => msg.to.includes(matchingRecipient));
      } else {
        return [];
      }
    }

    // A just-sent message has a pending serverTimestamp, so its `timestamp` is
    // null in the local snapshot until the server acknowledges it. Treat those
    // as "now" so they sort as the newest message.
    const timeOf = (message: Message) => message.timestamp?.toMillis() ?? Date.now();

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (selectedSort) {
        case 'most-liked':
          const aLikes = a.likes || 0;
          const bLikes = b.likes || 0;
          if (bLikes !== aLikes) {
            return bLikes - aLikes;
          }
          return timeOf(b) - timeOf(a);
        case 'oldest':
          return timeOf(a) - timeOf(b);
        case 'newest':
        default:
          return timeOf(b) - timeOf(a);
      }
    });

    return sorted;
  }, [selectedFilter, selectedSort, allMessages]);

  // Handle auto-scroll to deep-linked message
  useEffect(() => {
    if (!isLoading && window.location.hash) {
      const id = window.location.hash.slice(1); // remove #
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-4', 'ring-brand-400/50', 'ring-offset-4', 'rounded-2xl');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-brand-400/50', 'ring-offset-4');
          }, 3000);
        }, 500);
      }
    }
  }, [isLoading]);

  const handleRandomCard = useCallback(() => {
    if (filteredMessages.length === 0) return;
    setIsRandomViewerOpen(true);
  }, [filteredMessages]);

  // Group suggestions are derived from trusted space configuration and public
  // messages, so clients no longer need permission to mutate a counters table.
  const availableGroups = useMemo(
    () => Array.from(new Set([
      ...(space?.popularGroups || []),
      ...allMessages.flatMap((message) => message.to),
    ])),
    [allMessages, space?.popularGroups]
  );

  // Get colors from space config or use defaults
  const primaryColor = space?.colors?.primary || '#9333ea'; // purple-600
  const secondaryColor = space?.colors?.secondary || '#ec4899'; // pink-500
  const accentColor = space?.colors?.accent || '#3b82f6'; // blue-500

  // Convert hex to RGB for opacity
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
      : null;
  };

  const primaryRgb = hexToRgb(primaryColor) || { r: 147, g: 51, b: 234 };
  const secondaryRgb = hexToRgb(secondaryColor) || { r: 236, g: 72, b: 153 };
  const accentRgb = hexToRgb(accentColor) || { r: 59, g: 130, b: 246 };

  if (isLoadingSpace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!space) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Modern Background with space colors */}
      <div className="fixed inset-0 -z-10">
        {/* Dynamic gradient background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `linear-gradient(135deg,
              rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.15) 0%,
              rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, 0.15) 50%,
              rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.15) 100%)`,
          }}
        />

        {/* Animated geometric shapes */}
        <motion.div
          className="absolute top-16 left-16 w-80 h-80 opacity-10"
          animate={{
            rotate: [0, 90, 180, 270, 360],
            scale: [1, 1.2, 0.8, 1.1, 1],
            x: [0, 20, -10, 15, 0],
            y: [0, -15, 20, -5, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div
            className="w-full h-full rounded-3xl"
            style={{ backgroundColor: primaryColor }}
          ></div>
        </motion.div>

        <motion.div
          className="absolute top-32 right-24 w-96 h-96 opacity-8"
          animate={{
            rotate: [360, 270, 180, 90, 0],
            scale: [0.8, 1.3, 1, 0.9, 0.8],
            x: [0, -30, 20, -15, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div
            className="w-full h-full rounded-full blur-2xl"
            style={{ backgroundColor: secondaryColor }}
          ></div>
        </motion.div>

        <motion.div
          className="absolute bottom-24 left-1/3 w-72 h-72 opacity-12"
          animate={{
            rotate: [0, 120, 240, 360],
            scale: [1.1, 0.7, 1.4, 1.1],
            y: [0, 25, -15, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div
            className="w-full h-full rounded-full blur-xl"
            style={{ backgroundColor: accentColor }}
          ></div>
        </motion.div>

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px'
            }}
          ></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Modern Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="text-center mb-16"
        >
          <motion.h1
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-5xl sm:text-7xl font-bold mb-6 uppercase"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor}, ${accentColor})`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundSize: '200% 200%',
              animation: 'gradient-shift 4s ease infinite',
            }}
          >
            {space.title}
          </motion.h1>

          <div className="flex justify-center mb-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShareSpace}
              className="px-4 py-1.5 rounded-full glass border border-white/40 text-brand-900/70 text-sm font-medium flex items-center gap-1.5 hover:bg-white/40 transition-all shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copiedState === 'space' ? 'Link Copied!' : 'Share This Space'}
            </motion.button>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-brand-900/80 font-medium mb-4 max-w-2xl mx-auto whitespace-pre-wrap wrap-break-word"
          >
            {space.description || 'Share your thoughts and connect with others'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-2 text-sm text-brand-900/70"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live conversation space</span>
            <Sparkles className="w-4 h-4" style={{ color: primaryColor }} />
          </motion.div>
        </motion.div>

        {/* Modern Message Composer */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
          className="mb-16 max-w-3xl mx-auto"
        >
          <MessageComposer
            availableGroups={availableGroups}
            spaceCode={spaceCode}
            imagesEnabled={space.imagesEnabled === true}
          />
        </motion.div>

        {/* Filter Bar - Only show if user has submitted */}
        {hasSubmitted && allMessages.length > 0 && (
          <FilterBar
            messages={allMessages}
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
            selectedSort={selectedSort}
            onSortChange={setSelectedSort}
            onRandomCard={handleRandomCard}
          />
        )}

        {/* Messages Grid or Prompt */}
        {!hasSubmitted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center py-16 px-6"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="inline-block mb-6"
            >
              <Mail className="w-24 h-24" style={{ color: primaryColor }} />
            </motion.div>
            <h2 className="text-3xl font-bold text-brand-900 mb-4">
              Share Your Thoughts First! 💌
            </h2>
            <p className="text-lg text-brand-900/80 mb-2 max-w-2xl mx-auto">
              To see what others have written, you need to contribute to the message wall first.
            </p>
            <p className="text-md text-brand-900/60 max-w-2xl mx-auto">
              Write a message above to unlock the full wall of messages from our community!
            </p>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
              className="mt-8 inline-flex items-center gap-2 font-medium"
              style={{ color: primaryColor }}
            >
              <Sparkles className="w-5 h-5" />
              Let&apos;s get started!
              <Sparkles className="w-5 h-5" />
            </motion.div>

            {/* Inconspicuous browse button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={() => setHasSubmitted(true)}
              className="mt-8 text-xs text-gray-400 hover:text-gray-600 underline-offset-2 hover:underline transition-colors"
            >
              or just browse
            </motion.button>
          </motion.div>
        ) : isLoading ? (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-block w-8 h-8 border-4 border-t-transparent rounded-full"
              style={{ borderColor: primaryColor, borderTopColor: 'transparent' }}
            />
            <p className="mt-4 text-brand-900/80">Loading messages...</p>
          </div>
        ) : messagesError ? (
          <div className="text-center py-12 px-6" role="alert">
            <p className="text-red-700 font-medium">{messagesError}</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-500 text-lg flex flex-col items-center justify-center gap-4">
              {selectedFilter === 'all' ? (
                <>
                  <span className="flex items-center gap-2">
                    No messages yet. Be the first to leave one!
                    <Mail className="w-5 h-5" style={{ color: secondaryColor }} />
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/create')}
                    className="text-sm font-medium text-brand-600 hover:text-brand-700 underline underline-offset-4"
                  >
                    Or start your own wall →
                  </motion.button>
                </>
              ) : (
                <>No messages for this recipient yet.</>
              )}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, staggerChildren: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredMessages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
              >
                <MessageCard
                  message={message}
                  index={index}
                  onClick={() => handleMessageClick(message)}
                  onShare={() => handleShareMessage(message.id)}
                  isCopied={copiedState === message.id}
                  availableGroups={availableGroups}
                  spaceCode={spaceCode}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Modern Footer */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 100 }}
        className="relative text-center py-12"
      >
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="py-8 rounded-2xl relative overflow-hidden group border-t border-surface-200/40"
          >
            <h3 className="text-lg font-semibold text-brand-900/80 mb-2">Create Your Own Wall</h3>
            <p className="text-sm text-brand-900/60 mb-5 max-w-sm mx-auto">
              Create a beautiful message wall for your own event in seconds.
            </p>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/create')}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-brand-200 text-brand-700 text-sm font-medium hover:bg-brand-50 hover:border-brand-300 transition-all"
            >
              Get Started for Free
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </motion.div>

          <p className="text-sm text-brand-900/70">
            A space for <span className="uppercase">{space.title}</span>
          </p>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <NextImage
                src="/icon-transparent.svg"
                alt="YourWall Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <span className="text-brand-900/80 font-semibold tracking-tight">Powered by YourWall</span>
          </div>
        </div>
      </motion.footer>

      {/* Share Modal */}
      <ShareModal
        message={selectedMessage}
        isOpen={isShareModalOpen}
        onClose={handleCloseShareModal}
        spaceTitle={space.title}
      />

      {/* Random Card Viewer */}
      <RandomCardViewer
        messages={filteredMessages}
        isOpen={isRandomViewerOpen}
        onClose={() => setIsRandomViewerOpen(false)}
        availableGroups={availableGroups}
        spaceCode={spaceCode}
      />
    </div>
  );
}
