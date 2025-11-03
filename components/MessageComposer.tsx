'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { addMessage } from '@/lib/firestore';
import { MessageFormData } from '@/lib/types';
import RecipientSelector from './RecipientSelector';

const MAX_CHARACTERS = 500;

interface MessageComposerProps {
  availableGroups: string[];
}

export default function MessageComposer({ availableGroups }: MessageComposerProps) {
  const [formData, setFormData] = useState<MessageFormData>({
    from: '',
    to: [],
    content: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.to.length === 0 || !formData.content.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addMessage(formData);
      setFormData({ from: '', to: [], content: '' });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const charactersRemaining = MAX_CHARACTERS - formData.content.length;
  const isValid = formData.to.length > 0 && formData.content.trim().length > 0 && charactersRemaining >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* From Field */}
        <div>
          <input
            type="text"
            value={formData.from}
            onChange={(e) => setFormData({ ...formData, from: e.target.value })}
            placeholder="From: (optional, leave blank for anonymous)"
            className="w-full px-4 py-3 rounded-2xl bg-white/30 backdrop-blur-md border border-white/40 focus:border-purple-300 focus:outline-none transition-all placeholder:text-gray-500"
          />
        </div>

        {/* To Field */}
        <RecipientSelector
          selectedRecipients={formData.to}
          onRecipientsChange={(recipients) => setFormData({ ...formData, to: recipients })}
          availableGroups={availableGroups}
        />

        {/* Message Content */}
        <div className="relative">
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Write your message..."
            rows={4}
            className="w-full px-4 py-3 rounded-2xl bg-white/30 backdrop-blur-md border border-white/40 focus:border-purple-300 focus:outline-none transition-all placeholder:text-gray-500 resize-none"
          />
          <div className={`text-sm mt-1 text-right ${charactersRemaining < 50 ? 'text-red-500' : 'text-gray-500'}`}>
            {charactersRemaining} characters remaining
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={!isValid || isSubmitting}
          whileHover={isValid ? { scale: 1.02 } : {}}
          whileTap={isValid ? { scale: 0.98 } : {}}
          className={`w-full px-6 py-3 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all ${
            isValid
              ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            'Sending...'
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Message
            </>
          )}
        </motion.button>
      </form>

      {/* Success Message */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute -bottom-12 left-0 right-0 text-center text-green-600 font-medium"
        >
          ✨ Message sent successfully!
        </motion.div>
      )}
    </motion.div>
  );
}

