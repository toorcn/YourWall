'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface RecipientSelectorProps {
  selectedRecipients: string[];
  onRecipientsChange: (recipients: string[]) => void;
  availableGroups: string[];
}

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
    <div className="relative">
      <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-white/30 backdrop-blur-md border border-white/40 focus-within:border-purple-300 transition-all">
        {selectedRecipients.map((recipient) => (
          <motion.div
            key={recipient}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-purple-400/30 to-pink-400/30 backdrop-blur-sm border border-white/40 text-sm"
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
          placeholder={selectedRecipients.length === 0 ? "To: (e.g., Volunteers, Committees)" : "Add more..."}
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

