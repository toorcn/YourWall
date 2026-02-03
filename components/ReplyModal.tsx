'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle } from 'lucide-react';
import NextImage from 'next/image';
import { addReply } from '@/lib/firestore';
import { ReplyFormData } from '@/lib/types';

const MAX_CHARACTERS = 300;
const MIN_CHARACTERS = 5;

interface ReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  messageFrom?: string;
}

export default function ReplyModal({ isOpen, onClose, messageId, messageFrom }: ReplyModalProps) {
  const [formData, setFormData] = useState<ReplyFormData>({
    from: '',
    content: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.content.trim() || formData.content.trim().length < MIN_CHARACTERS) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addReply(messageId, formData);

      setFormData({ from: '', content: '' });
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error sending reply:', err);
      setError(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ from: '', content: '' });
      setError(null);
      setShowSuccess(false);
      onClose();
    }
  };

  const charactersRemaining = MAX_CHARACTERS - formData.content.length;
  const contentLength = formData.content.trim().length;
  const isValid = contentLength >= MIN_CHARACTERS && charactersRemaining >= 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/60 hover:bg-white/80 transition-colors z-10"
              aria-label="Close reply modal"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="p-8">
              <AnimatePresence mode="wait">
                {!showSuccess ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <h2 className="text-2xl font-bold text-brand-900 mb-2 pr-8 flex items-center gap-2">
                      Reply to
                      <span className="inline-flex items-center gap-2 text-brand-600">
                        {messageFrom && <NextImage src="/avatar-3d.png" alt="User" width={24} height={24} className="w-6 h-6 object-contain opacity-80" />}
                        {messageFrom || 'this message'}
                      </span>
                    </h2>
                    <p className="text-sm text-brand-900/90 mb-6">
                      Share your thoughts or appreciation
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* From Field */}
                      <div>
                        <label className="block text-sm font-medium text-brand-900/80 mb-3">
                          Your name (Optional)
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-900/40 pointer-events-none">
                            <NextImage
                              src="/avatar-3d.png"
                              alt="User"
                              width={20}
                              height={20}
                              className="w-5 h-5 object-contain opacity-70"
                            />
                          </div>
                          <input
                            type="text"
                            value={formData.from}
                            onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                            placeholder="Your name or stay anonymous"
                            className="w-full pl-12 pr-6 py-4 rounded-2xl bg-surface-50/60 backdrop-blur-sm border border-surface-200 focus:border-brand-300 focus:outline-none transition-all placeholder:text-brand-900/30 text-brand-900"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      {/* Content Field */}
                      <div>
                        <label className="block text-sm font-medium text-brand-900/80 mb-3">
                          Your reply *
                        </label>
                        <textarea
                          value={formData.content}
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          placeholder="Write your reply..."
                          rows={6}
                          className="w-full px-6 py-4 rounded-2xl bg-surface-50/60 backdrop-blur-sm border border-surface-200 focus:border-brand-300 focus:outline-none transition-all placeholder:text-brand-900/30 text-brand-900 resize-none"
                          disabled={isSubmitting}
                        />
                        <div className="flex justify-between items-center text-sm mt-3">
                          <div className={contentLength > 0 && contentLength < MIN_CHARACTERS ? 'text-accent-500' : 'text-brand-900/70'}>
                            {contentLength > 0 && contentLength < MIN_CHARACTERS
                              ? `${MIN_CHARACTERS - contentLength} more characters needed`
                              : contentLength >= MIN_CHARACTERS
                                ? `✓ ${contentLength} characters`
                                : `Minimum ${MIN_CHARACTERS} characters`}
                          </div>
                          <div className={charactersRemaining < 50 ? 'text-accent-500' : 'text-brand-900/70'}>
                            {charactersRemaining} remaining
                          </div>
                        </div>
                      </div>

                      {error && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-red-500"
                        >
                          {error}
                        </motion.p>
                      )}

                      {/* Submit Button */}
                      <motion.button
                        type="submit"
                        disabled={!isValid || isSubmitting}
                        whileHover={isValid ? { scale: 1.02 } : {}}
                        whileTap={isValid ? { scale: 0.98 } : {}}
                        className={`w-full px-6 py-4 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all ${isValid
                          ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-lg hover:shadow-xl'
                          : 'bg-surface-200 text-surface-400 cursor-not-allowed'
                          }`}
                      >
                        {isSubmitting ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                              <Send className="w-5 h-5" />
                            </motion.div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Send Reply
                          </>
                        )}
                      </motion.button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="py-12 px-6 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                      className="mb-6 inline-block"
                    >
                      <CheckCircle className="w-16 h-16 text-green-500" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-brand-900 mb-2">
                      Reply Sent!
                    </h3>
                    <p className="text-brand-900/80">
                      Your reply has been added
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

