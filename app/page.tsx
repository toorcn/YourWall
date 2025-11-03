'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import MessageComposer from '@/components/MessageComposer';
import MessageCard from '@/components/MessageCard';
import FilterBar from '@/components/FilterBar';
import FloatingParticles from '@/components/FloatingParticles';
import { subscribeToMessages, subscribeToGroups, initializePopularGroups } from '@/lib/firestore';
import { Message, Group } from '@/lib/types';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize popular groups
    initializePopularGroups();

    // Subscribe to messages
    const unsubscribeMessages = subscribeToMessages(
      (newMessages) => {
        setMessages(newMessages);
        setIsLoading(false);
      },
      selectedFilter === 'all' ? undefined : selectedFilter
    );

    // Subscribe to groups
    const unsubscribeGroups = subscribeToGroups((newGroups) => {
      setGroups(newGroups);
    });

    return () => {
      unsubscribeMessages();
      unsubscribeGroups();
    };
  }, [selectedFilter]);

  const availableGroups = groups.map((g) => g.displayName);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Particles */}
      <FloatingParticles />
      
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100" />
        
        {/* Floating orbs */}
        <motion.div
          className="absolute top-20 left-20 w-64 h-64 bg-purple-300/30 rounded-full blur-3xl"
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
          className="absolute top-40 right-20 w-96 h-96 bg-pink-300/30 rounded-full blur-3xl"
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
          className="absolute bottom-20 left-1/3 w-80 h-80 bg-blue-300/30 rounded-full blur-3xl"
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
          <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            KiyokoCon 2025
          </h1>
          <p className="text-xl text-gray-600 font-light">
            Leave a message for our amazing community ✨
          </p>
        </motion.div>

        {/* Message Composer */}
        <div className="mb-12 max-w-2xl mx-auto">
          <MessageComposer availableGroups={availableGroups} />
        </div>

        {/* Filter Bar */}
        {groups.length > 0 && (
          <FilterBar
            groups={groups}
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
          />
        )}

        {/* Messages Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-block w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full"
            />
            <p className="mt-4 text-gray-600">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-500 text-lg">
              {selectedFilter === 'all'
                ? 'No messages yet. Be the first to leave one! 💌'
                : `No messages for ${groups.find((g) => g.id === selectedFilter)?.displayName || selectedFilter} yet.`}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {messages.map((message, index) => (
              <MessageCard key={message.id} message={message} index={index} />
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
        <p>Made with 💜 for KiyokoCon 2025</p>
      </motion.footer>
    </div>
  );
}
