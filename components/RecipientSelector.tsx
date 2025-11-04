'use client';

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Briefcase, PartyPopper, Globe } from 'lucide-react';

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
  const inputRef = useRef<HTMLInputElement>(null);

  // Compute filtered suggestions using useMemo
  const filteredSuggestions = useMemo(() => {
    if (input.trim()) {
      return availableGroups.filter(
        (group) =>
          group.toLowerCase().includes(input.toLowerCase()) &&
          !selectedRecipients.includes(group)
      );
    } else {
      // When input is empty, show all available groups if focused
      return availableGroups.filter(
        (group) => !selectedRecipients.includes(group)
      );
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

  const handleFocus = () => {
    // Show all available options when focused
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicks on suggestions
    setTimeout(() => {
      if (!input.trim()) {
        setShowSuggestions(false);
      }
    }, 200);
  };

  const handleCreateCustom = () => {
    if (input.trim()) {
      addRecipient(input.trim());
    }
  };

  return (
    <div className="relative">
      {/* Input Field */}
      <div className="relative">
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
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={selectedRecipients.length === 0 ? "To: type here to create a group" : "Add more..."}
          className="flex-1 min-w-[200px] bg-transparent outline-none placeholder:text-gray-500"
        />
        </div>
        {/* Hints around the text box */}
        <div className="flex justify-center gap-3 flex-wrap mt-0.5">
          {QUICK_SELECT_GROUPS.map((group) => {
            const Icon = group.icon;
            const isSelected = selectedRecipients.includes(group.name);
            return (
              <span
                key={group.name}
                className={`text-xs flex items-center gap-1 ${
                  isSelected
                    ? 'text-purple-400 opacity-60'
                    : 'text-gray-500 opacity-70'
                }`}
              >
                <Icon className="w-3 h-3" />
                {group.name}
              </span>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showSuggestions && (filteredSuggestions.length > 0 || input.trim().length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 w-full top-full mt-0 p-2 rounded-2xl bg-white/80 backdrop-blur-md border border-white/60 shadow-lg max-h-64 overflow-y-auto"
          >
            {/* Available Options */}
            {filteredSuggestions.length > 0 && (
              <>
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
              </>
            )}
            
            {/* Create Custom Option */}
            {input.trim().length > 0 && !filteredSuggestions.includes(input.trim()) && (
              <button
                type="button"
                onClick={handleCreateCustom}
                onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                className="w-full text-left px-4 py-2 rounded-xl hover:bg-purple-100/50 transition-colors border-t border-gray-200 mt-2 pt-2 flex items-center gap-2 text-purple-600 font-medium"
              >
                <span>+</span>
                <span>Create &ldquo;{input.trim()}&rdquo;</span>
              </button>
            )}
            
            {/* Show "Create custom" hint when input is empty and focused */}
            {input.trim().length === 0 && filteredSuggestions.length === 0 && (
              <div className="px-4 py-2 text-sm text-gray-500 italic">
                Start typing to create a custom recipient...
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

