'use client';

import { motion } from 'framer-motion';
import { Message } from '@/lib/types';
import { Heart, Clock, Shuffle, ArrowUpDown } from 'lucide-react';

interface FilterBarProps {
  messages: Message[];
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  selectedSort: string;
  onSortChange: (sort: string) => void;
  onRandomCard: () => void;
}

export default function FilterBar({ messages, selectedFilter, onFilterChange, selectedSort, onSortChange, onRandomCard }: FilterBarProps) {
  // Compute groups from actual messages' "to" field
  const recipientCounts = new Map<string, number>();
  
  messages.forEach(message => {
    message.to.forEach(recipient => {
      recipientCounts.set(recipient, (recipientCounts.get(recipient) || 0) + 1);
    });
  });

  // Convert to array and sort by count
  const groups = Array.from(recipientCounts.entries())
    .map(([displayName, messageCount]) => ({
      id: displayName.toLowerCase(),
      displayName,
      messageCount,
    }))
    .sort((a, b) => b.messageCount - a.messageCount);

  const allGroups = [{ id: 'all', displayName: 'All Messages', messageCount: messages.length }, ...groups];

  const sortOptions = [
    { id: 'newest', label: 'Newest', icon: Clock },
    { id: 'oldest', label: 'Oldest', icon: Clock },
    { id: 'most-liked', label: 'Most Liked', icon: Heart },
  ];

  return (
    <div className="mb-8 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-3">Filter by recipient:</h3>
        <div className="flex flex-wrap gap-2">
          {allGroups.map((group, index) => {
            const isSelected = selectedFilter === group.id;
            return (
              <motion.button
                key={group.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onFilterChange(group.id)}
                className={`px-4 py-2 rounded-full backdrop-blur-md border transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-300 to-pink-300 border-white/60 text-white shadow-lg'
                    : 'bg-white/30 border-white/40 text-gray-700 hover:bg-white/50'
                }`}
              >
                <span className="font-medium">{group.displayName}</span>
                <span className={`ml-2 text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                  ({group.messageCount})
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-600">Sort:</span>
        </div>
        <div className="flex items-center gap-1 bg-white/30 backdrop-blur-md border border-white/40 rounded-full p-1">
          {sortOptions.map((option, index) => {
            const Icon = option.icon;
            const isSelected = selectedSort === option.id;
            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSortChange(option.id)}
                className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 text-sm font-medium ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-300 to-pink-300 text-white shadow-md'
                    : 'text-gray-700 hover:bg-white/30'
                }`}
                title={option.label}
              >
                <Icon className={`w-3.5 h-3.5 ${option.id === 'most-liked' && isSelected ? 'fill-white' : ''}`} />
                <span className={isSelected ? 'inline' : 'hidden sm:inline'}>{option.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
      
      <div>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRandomCard}
          className="w-full px-6 py-4 rounded-2xl backdrop-blur-md border-2 transition-all flex items-center justify-center gap-3 bg-transparent border-purple-300 text-purple-500 hover:bg-purple-200/50 hover:text-purple-700 shadow-lg hover:shadow-xl font-semibold text-base sm:text-lg"
        >
          <Shuffle className="w-5 h-5 sm:w-6 sm:h-6" />
          <span>View Random Cards</span>
        </motion.button>
      </div>
    </div>
  );
}

