'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Heart, Mail } from 'lucide-react';
import MessageComposer from '@/components/MessageComposer';
import MessageCard from '@/components/MessageCard';
import FilterBar from '@/components/FilterBar';
import FloatingParticles from '@/components/FloatingParticles';
import ShareModal from '@/components/ShareModal';
import RandomCardViewer from '@/components/RandomCardViewer';
import { subscribeToMessages, subscribeToGroups, initializePopularGroups } from '@/lib/firestore';
import { Message, Group } from '@/lib/types';

export default function Home() {
  const [allMessages, setAllMessages] = useState<Message[]>([]); // All messages for computing filters
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isRandomViewerOpen, setIsRandomViewerOpen] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    setIsShareModalOpen(true);
  };

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false);
    setTimeout(() => setSelectedMessage(null), 300);
  };

  // Check if user has submitted a message
  useEffect(() => {
    const checkSubmissionStatus = () => {
      const hasSubmittedMessage = localStorage.getItem('hasSubmittedMessage') === 'true';
      setHasSubmitted(hasSubmittedMessage);
    };

    checkSubmissionStatus();

    // Listen for message submission events
    const handleMessageSubmitted = () => {
      setHasSubmitted(true);
    };

    window.addEventListener('messageSubmitted', handleMessageSubmitted);
    
    return () => {
      window.removeEventListener('messageSubmitted', handleMessageSubmitted);
    };
  }, []);

  // Initialize groups and subscribe to group changes (runs once)
  useEffect(() => {
    initializePopularGroups();

    const unsubscribeGroups = subscribeToGroups((newGroups) => {
      setGroups(newGroups);
    });

    return () => {
      unsubscribeGroups();
    };
  }, []);

  // Subscribe to all messages (no server-side filtering)
  useEffect(() => {
    const unsubscribeMessages = subscribeToMessages(
      (newMessages) => {
        setAllMessages(newMessages);
        setIsLoading(false);
      },
      undefined // No filter - get all messages
    );

    return () => {
      unsubscribeMessages();
    };
  }, []);

  // Filter and sort messages client-side based on selected filter and sort
  const filteredMessages = useMemo(() => {
    let filtered = allMessages;
    
    // Apply recipient filter
    if (selectedFilter !== 'all') {
      // Find the display name from the actual messages' recipients
      const recipientsInMessages = new Set<string>();
      allMessages.forEach(msg => msg.to.forEach(r => recipientsInMessages.add(r)));
      
      // Find matching display name (case-insensitive match)
      const matchingRecipient = Array.from(recipientsInMessages).find(
        r => r.toLowerCase() === selectedFilter
      );
      
      if (matchingRecipient) {
        filtered = allMessages.filter(msg => msg.to.includes(matchingRecipient));
      } else {
        return [];
      }
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (selectedSort) {
        case 'most-liked':
          const aLikes = a.likes || 0;
          const bLikes = b.likes || 0;
          if (bLikes !== aLikes) {
            return bLikes - aLikes;
          }
          // If likes are equal, fall back to newest
          return b.timestamp.toMillis() - a.timestamp.toMillis();
        case 'oldest':
          return a.timestamp.toMillis() - b.timestamp.toMillis();
        case 'newest':
        default:
          return b.timestamp.toMillis() - a.timestamp.toMillis();
      }
    });
    
    return sorted;
  }, [selectedFilter, selectedSort, allMessages]);

  const handleRandomCard = useCallback(() => {
    if (filteredMessages.length === 0) return;
    setIsRandomViewerOpen(true);
  }, [filteredMessages]);

  const availableGroups = groups.map((g) => g.displayName);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Particles */}
      <FloatingParticles />
      
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" />
        
        {/* Floating orbs */}
        <motion.div
          className="absolute top-20 left-20 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 left-1/3 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"
          animate={{
            x: [0, 40, 0],
            y: [0, -40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <motion.img
              src="/KiyokoCon_Logo.png"
              alt="KiyokoCon Logo"
              className="h-32 sm:h-40 w-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-4 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent">
            KiyokoCon 2025
          </h1>
          <p className="text-xl text-gray-600 font-light flex items-center justify-center gap-2">
            Leave a message for each other
            <Sparkles className="w-5 h-5 text-purple-500" />
          </p>
        </motion.div>

        {/* Message Composer */}
        <div className="mb-12 max-w-2xl mx-auto">
          <MessageComposer availableGroups={availableGroups} />
        </div>

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
              <Mail className="w-24 h-24 text-purple-300" />
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Share Your Thoughts First! 💌
            </h2>
            <p className="text-lg text-gray-600 mb-2 max-w-2xl mx-auto">
              To see what others have written, you need to contribute to the message wall first.
            </p>
            <p className="text-md text-gray-500 max-w-2xl mx-auto">
              Write a message above to unlock the full wall of messages from our community!
            </p>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
              className="mt-8 inline-flex items-center gap-2 text-purple-500 font-medium"
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
              className="inline-block w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full"
            />
            <p className="mt-4 text-gray-600">Loading messages...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-500 text-lg flex items-center justify-center gap-2">
              {selectedFilter === 'all' ? (
                <>
                  No messages yet. Be the first to leave one!
                  <Mail className="w-5 h-5 text-pink-400" />
                </>
              ) : (
                <>No messages for this recipient yet.</>
              )}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMessages.map((message, index) => (
              <MessageCard 
                key={message.id} 
                message={message} 
                index={index}
                onClick={() => handleMessageClick(message)}
                availableGroups={availableGroups}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="relative text-center py-8 text-gray-500 text-sm"
      >
        <p className="flex items-center justify-center gap-1.5">
          Made with
          <Heart className="w-4 h-4 text-purple-500 fill-purple-500" />
          for KiyokoCon 2025
        </p>
      </motion.footer>

      {/* Share Modal */}
      <ShareModal
        message={selectedMessage}
        isOpen={isShareModalOpen}
        onClose={handleCloseShareModal}
      />

      {/* Random Card Viewer */}
      <RandomCardViewer
        messages={filteredMessages}
        isOpen={isRandomViewerOpen}
        onClose={() => setIsRandomViewerOpen(false)}
        availableGroups={availableGroups}
      />
    </div>
  );
}
