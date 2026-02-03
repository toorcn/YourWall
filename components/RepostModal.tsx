'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle, Repeat2 } from 'lucide-react';
import { addMessage, getMessage } from '@/lib/firestore';
import { Message, RepostFormData } from '@/lib/types';
import RecipientSelector from './RecipientSelector';

const MAX_COMMENT_CHARACTERS = 200;

// Helper function to resolve to the original message (handles nested reposts)
const resolveOriginalMessage = async (messageId: string, spaceCode: string): Promise<{ message: Message; originalId: string }> => {
  const message = await getMessage(messageId, spaceCode);
  if (!message) {
    throw new Error('Message not found');
  }

  // If this message is a repost, recursively resolve to the original
  if (message.repostedFrom) {
    return resolveOriginalMessage(message.repostedFrom, spaceCode);
  }

  // This is the original message
  return { message, originalId: message.id };
};

interface RepostModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  originalMessage?: Message;
  availableGroups: string[];
  spaceCode: string;
}

export default function RepostModal({
  isOpen,
  onClose,
  messageId,
  originalMessage,
  availableGroups,
  spaceCode
}: RepostModalProps) {
  const [formData, setFormData] = useState<RepostFormData>({
    from: '',
    to: [],
    repostComment: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<Message | null>(originalMessage || null);
  const [originalMessageId, setOriginalMessageId] = useState<string>(messageId);

  // Fetch original message if not provided
  useEffect(() => {
    if (isOpen && messageId) {
      // Always fetch the message to ensure we have the latest data
      // If originalMessage is provided, use it initially but still fetch to verify
      if (originalMessage) {
        setMessage(originalMessage);
      }

      getMessage(messageId, spaceCode).then((msg) => {
        if (msg) {
          // Resolve to the original message (handles nested reposts)
          resolveOriginalMessage(messageId, spaceCode).then(({ message: originalMsg, originalId }) => {
            setMessage(originalMsg);
            setOriginalMessageId(originalId);
          }).catch((err) => {
            console.error('Error resolving original message:', err);
            // Fallback to the message we fetched
            setMessage(msg);
            setOriginalMessageId(messageId);
          });
        }
      }).catch((err) => {
        console.error('Error fetching message:', err);
        // Keep originalMessage if fetch fails
        if (originalMessage) {
          setMessage(originalMessage);
          setOriginalMessageId(originalMessage.repostedFrom || originalMessage.id || messageId);
        } else {
          setOriginalMessageId(messageId);
        }
      });
    } else if (!isOpen) {
      // Reset message when modal closes
      setMessage(null);
      setOriginalMessageId(messageId);
    }
  }, [isOpen, messageId, originalMessage, spaceCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.to.length === 0) {
      setError('Please select at least one recipient');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Use the resolved original message ID
      await addMessage({
        from: formData.from,
        to: formData.to,
        content: '', // Will be filled from original message
        repostedFrom: originalMessageId,
        repostComment: formData.repostComment || undefined,
      }, spaceCode);

      setFormData({ from: '', to: [], repostComment: '' });
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error reposting message:', err);
      setError(err instanceof Error ? err.message : 'Failed to repost message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ from: '', to: [], repostComment: '' });
      setError(null);
      setShowSuccess(false);
      setMessage(null); // Reset message state
      setOriginalMessageId(messageId); // Reset to initial messageId
      onClose();
    }
  };

  const commentLength = formData.repostComment?.length || 0;
  const isValid = formData.to.length > 0 && commentLength <= MAX_COMMENT_CHARACTERS;

  if (!message) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full h-full bg-white/95 backdrop-blur-md overflow-hidden flex flex-col"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 sm:p-3 rounded-full bg-white/60 hover:bg-white/80 transition-colors z-10"
              aria-label="Close repost modal"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </button>

            <div className="p-6 sm:p-8 lg:p-10 overflow-y-auto flex-1">
              <div className="max-w-3xl mx-auto h-full flex flex-col">
                <AnimatePresence mode="wait">
                  {!showSuccess ? (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4 sm:space-y-6 flex-1 flex flex-col"
                    >
                      <div className="flex items-center gap-2 mb-2 pr-8 sm:pr-12">
                        <Repeat2 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
                          Repost Message
                        </h2>
                      </div>
                      <p className="text-sm sm:text-base text-gray-600">
                        Share this message with others and optionally add your own comment
                      </p>

                      {/* Original Message Preview */}
                      <div className="p-4 sm:p-6 lg:p-8 rounded-2xl bg-gray-50/80 border border-gray-200">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <span className="text-xs sm:text-sm font-medium text-gray-600">
                            Original message
                          </span>
                          <span className="text-xs sm:text-sm text-gray-500">
                            From: {message.from || 'Anonymous'}
                          </span>
                        </div>
                        <p className="text-sm sm:text-base lg:text-lg text-gray-700 whitespace-pre-wrap line-clamp-3">
                          {message.content}
                        </p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-8">
                        {/* From Field */}
                        <div>
                          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-4">
                            Your name (Optional)
                          </label>
                          <input
                            type="text"
                            value={formData.from}
                            onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                            placeholder="Your name or stay anonymous"
                            className="w-full px-5 sm:px-7 py-4 sm:py-5 text-sm sm:text-base rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200 focus:border-purple-300 focus:outline-none transition-all placeholder:text-gray-400"
                            disabled={isSubmitting}
                          />
                        </div>

                        {/* Recipients Field */}
                        <div>
                          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-4">
                            Share with *
                          </label>
                          <RecipientSelector
                            selectedRecipients={formData.to}
                            onRecipientsChange={(recipients) => setFormData({ ...formData, to: recipients })}
                            availableGroups={availableGroups}
                          />
                        </div>

                        {/* Comment Field */}
                        <div>
                          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-4">
                            Add a comment (Optional)
                          </label>
                          <textarea
                            value={formData.repostComment || ''}
                            onChange={(e) => setFormData({ ...formData, repostComment: e.target.value })}
                            placeholder="Add your thoughts about this message..."
                            rows={6}
                            className="w-full px-5 sm:px-7 py-4 sm:py-5 text-sm sm:text-base rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200 focus:border-purple-300 focus:outline-none transition-all placeholder:text-gray-400 resize-none"
                            disabled={isSubmitting}
                          />
                          <div className="flex justify-end items-center text-sm sm:text-base mt-2">
                            <div className={commentLength > MAX_COMMENT_CHARACTERS ? 'text-red-500' : 'text-gray-500'}>
                              {commentLength} / {MAX_COMMENT_CHARACTERS}
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
                          className={`w-full px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg rounded-2xl font-medium flex items-center justify-center gap-2 transition-all ${isValid
                            ? 'bg-gradient-to-r from-purple-300 to-pink-300 text-white shadow-lg hover:shadow-xl'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                          {isSubmitting ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              >
                                <Repeat2 className="w-5 h-5 sm:w-6 sm:h-6" />
                              </motion.div>
                              Reposting...
                            </>
                          ) : (
                            <>
                              <Repeat2 className="w-5 h-5 sm:w-6 sm:h-6" />
                              Repost Message
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
                      className="py-12 sm:py-16 lg:py-20 px-6 text-center flex flex-col items-center justify-center flex-1"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                        className="mb-6 sm:mb-8 inline-block"
                      >
                        <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-green-500" />
                      </motion.div>
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
                        Reposted!
                      </h3>
                      <p className="text-base sm:text-lg text-gray-600">
                        Your repost has been shared
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

