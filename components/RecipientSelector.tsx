'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Briefcase, PartyPopper, Globe, Lightbulb } from 'lucide-react';

interface RecipientSelectorProps {
  selectedRecipients: string[];
  onRecipientsChange: (recipients: string[]) => void;
  availableGroups: string[];
}

const QUICK_SELECT_GROUPS = [
  { name: 'Volunteers', icon: Users },
  { name: 'Committees', icon: Briefcase },
  { name: 'Attendees', icon: PartyPopper },
  { name: 'Everyone', icon: Globe },
];

export default function RecipientSelector({
  selectedRecipients,
  onRecipientsChange,
  availableGroups,
}: RecipientSelectorProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (input) {
      const filtered = availableGroups.filter(
        (group) =>
          group.toLowerCase().includes(input.toLowerCase()) &&
          !selectedRecipients.includes(group)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [input, availableGroups, selectedRecipients]);

  const addRecipient = (recipient: string) => {
    if (recipient && !selectedRecipients.includes(recipient)) {
      onRecipientsChange([...selectedRecipients, recipient]);
      setInput('');
      setShowSuggestions(false);
    }
  };

  const removeRecipient = (recipient: string) => {
    onRecipientsChange(selectedRecipients.filter((r) => r !== recipient));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        addRecipient(filteredSuggestions[0]);
      } else if (input.trim()) {
        addRecipient(input.trim());
      }
    } else if (e.key === 'Backspace' && !input && selectedRecipients.length > 0) {
      removeRecipient(selectedRecipients[selectedRecipients.length - 1]);
    }
  };

  return (
    <div className="relative space-y-3">
      {/* Quick Select Buttons */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {QUICK_SELECT_GROUPS.map((group) => {
            const Icon = group.icon;
            const isSelected = selectedRecipients.includes(group.name);
            return (
              <motion.button
                key={group.name}
                type="button"
                onClick={() => !isSelected && addRecipient(group.name)}
                disabled={isSelected}
                whileHover={!isSelected ? { scale: 1.05 } : {}}
                whileTap={!isSelected ? { scale: 0.95 } : {}}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-purple-200/50 text-purple-400 cursor-not-allowed'
                    : 'bg-white/40 backdrop-blur-sm border border-white/60 hover:bg-purple-100/50 hover:border-purple-300 text-gray-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {group.name}
              </motion.button>
            );
          })}
        </div>
        <p className="text-xs text-gray-600 italic flex items-center gap-1">
          <Lightbulb className="w-3 h-3" />
          Tip: You can also type custom group names or people's names below (e.g., "Registration", "Operations", "Hong", etc.)
        </p>
      </div>

      {/* Input Field */}
      <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-white/30 backdrop-blur-md border border-white/40 focus-within:border-purple-300 transition-all">
        {selectedRecipients.map((recipient) => (
          <motion.div
            key={recipient}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-purple-300/25 to-pink-300/25 backdrop-blur-sm border border-white/40 text-sm"
          >
            <span>{recipient}</span>
            <button
              type="button"
              onClick={() => removeRecipient(recipient)}
              className="hover:scale-110 transition-transform"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedRecipients.length === 0 ? "To: (e.g., Guest Relations, Events)" : "Add more..."}
          className="flex-1 min-w-[200px] bg-transparent outline-none placeholder:text-gray-500"
        />
      </div>

      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 w-full mt-2 p-2 rounded-2xl bg-white/80 backdrop-blur-md border border-white/60 shadow-lg"
          >
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addRecipient(suggestion)}
                className="w-full text-left px-4 py-2 rounded-xl hover:bg-purple-100/50 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

