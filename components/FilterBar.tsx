'use client';

import { motion } from 'framer-motion';
import { Group } from '@/lib/types';

interface FilterBarProps {
  groups: Group[];
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

export default function FilterBar({ groups, selectedFilter, onFilterChange }: FilterBarProps) {
  // Only show groups that have messages
  const groupsWithMessages = groups.filter(group => group.messageCount > 0);
  const allGroups = [{ id: 'all', displayName: 'All Messages', messageCount: 0 }, ...groupsWithMessages];

  return (
    <div className="mb-8">
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
              {group.messageCount > 0 && (
                <span className={`ml-2 text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                  ({group.messageCount})
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

