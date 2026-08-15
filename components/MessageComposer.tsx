'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, Sparkles, Heart, ArrowRight, User, MessageSquare, Share2 } from 'lucide-react';
import NextImage from 'next/image';
import { addMessage } from '@/lib/firestore';
import { MessageFormData } from '@/lib/types';
import RecipientSelector from './RecipientSelector';

const MAX_CHARACTERS = 500;
const MIN_CHARACTERS = 10;

interface MessageComposerProps {
  availableGroups: string[];
  spaceCode: string;
}

export default function MessageComposer({ availableGroups, spaceCode }: MessageComposerProps) {
  const [formData, setFormData] = useState<MessageFormData>({
    from: '',
    to: [],
    content: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // Start at step 1
  const [step1Skipped, setStep1Skipped] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const stepRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  // Auto-reveal next step when current step is completed
  useEffect(() => {
    if (showSuccess) return;

    // Step 1 -> Step 2: when from field has value or is skipped
    if (currentStep === 1 && (formData.from.trim() || step1Skipped)) {
      const timer = setTimeout(() => setCurrentStep(2), 300);
      return () => clearTimeout(timer);
    }

    // Step 2 -> Step 3: when recipients are selected
    if (currentStep === 2 && formData.to.length > 0) {
      const timer = setTimeout(() => setCurrentStep(3), 300);
      return () => clearTimeout(timer);
    }
  }, [formData.from, formData.to, step1Skipped, currentStep, showSuccess]);

  // Auto-scroll to the current field
  useEffect(() => {
    if (currentStep > 0 && currentStep <= 3 && stepRefs[currentStep - 1]?.current) {
      stepRefs[currentStep - 1].current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentStep]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.to.length === 0 || !formData.content.trim() || formData.content.trim().length < MIN_CHARACTERS) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addMessage(formData, spaceCode);

      // Mark that the user has submitted a message
      if (typeof window !== 'undefined') {
        localStorage.setItem(`hasSubmittedMessage_${spaceCode}`, 'true');
        // Trigger a storage event for the same page
        window.dispatchEvent(new Event('messageSubmitted'));
      }

      setFormData({ from: '', to: [], content: '' });
      setShowSuccess(true);
      setCurrentStep(1);
      setStep1Skipped(false);
      setTimeout(() => {
        setShowSuccess(false);
      }, 4000);
    } catch (error) {
      console.error('Error sending message:', error);
      // Error handling could be added here with a toast notification
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipStep1 = () => {
    setStep1Skipped(true);
  };

  const charactersRemaining = MAX_CHARACTERS - formData.content.length;
  const contentLength = formData.content.trim().length;
  const isValid = formData.to.length > 0 && contentLength >= MIN_CHARACTERS && charactersRemaining >= 0;

  return (
    <div ref={formRef} className="relative">
      <AnimatePresence mode="wait">
        {!showSuccess ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
            className="card-modern p-6 md:p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* From Field */}
              <AnimatePresence>
                {currentStep >= 1 && (
                  <motion.div
                    ref={stepRefs[0]}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                  >
                    <label className="block text-sm font-medium text-brand-900 mb-4">
                      Step 1: Who are you? (Optional)
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-900/40 pointer-events-none">
                          <NextImage
                            src="/avatar-3d.png"
                            alt="User"
                            width={24}
                            height={24}
                            className="w-6 h-6 object-contain opacity-70"
                          />
                        </div>
                        <input
                          type="text"
                          value={formData.from}
                          onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                          maxLength={80}
                          placeholder="Your name, department, role, or stay anonymous"
                          className="w-full pl-12 pr-6 py-5 rounded-xl bg-surface-50 border-2 border-surface-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 focus:outline-none transition-all duration-300 placeholder:text-brand-900/50 disabled:opacity-50 disabled:cursor-not-allowed focus-modern text-brand-900"
                          autoFocus
                          disabled={step1Skipped}
                        />
                      </div>
                      {!formData.from && !step1Skipped && currentStep === 1 && (
                        <motion.button
                          type="button"
                          onClick={handleSkipStep1}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-3 rounded-2xl bg-surface-50/40 backdrop-blur-md border border-surface-50/40 hover:border-brand-300 transition-all text-brand-900/80 font-medium flex items-center gap-2"
                        >
                          Skip <ArrowRight className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>
                    {step1Skipped && (
                      <p className="text-xs text-brand-900/70 mt-1 italic">Continuing as Anonymous</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* To Field */}
              <AnimatePresence>
                {currentStep >= 2 && (
                  <motion.div
                    ref={stepRefs[1]}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                  >
                    <label className="block text-sm font-medium text-brand-900 mb-4">
                      Step 2: Who is this message for? *
                    </label>
                    <RecipientSelector
                      selectedRecipients={formData.to}
                      onRecipientsChange={(recipients) => setFormData({ ...formData, to: recipients })}
                      availableGroups={availableGroups}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Message Content */}
              <AnimatePresence>
                {currentStep >= 3 && (
                  <motion.div
                    ref={stepRefs[2]}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    className="relative space-y-4"
                  >
                    <label className="block text-sm font-medium text-brand-900 mb-4">
                      Step 3: Write your message *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      maxLength={MAX_CHARACTERS}
                      placeholder="Share your thoughts, appreciation, or encouragement..."
                      rows={12}
                      className="w-full px-6 py-5 rounded-xl bg-surface-50 border-2 border-surface-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 focus:outline-none transition-all duration-300 placeholder:text-brand-900/50 resize-none overflow-y-auto focus-modern text-brand-900"
                    />
                    <div className="flex justify-between items-center text-sm mt-3 px-2">
                      <div className={contentLength > 0 && contentLength < MIN_CHARACTERS ? 'text-accent-500' : 'text-brand-900/70'}>
                        {contentLength > 0 && contentLength < MIN_CHARACTERS
                          ? `${MIN_CHARACTERS - contentLength} more characters needed (min ${MIN_CHARACTERS})`
                          : contentLength >= MIN_CHARACTERS
                            ? `✓ ${contentLength} characters`
                            : `Minimum ${MIN_CHARACTERS} characters`}
                      </div>
                      <div className={charactersRemaining < 50 ? 'text-accent-500' : 'text-brand-900/70'}>
                        {charactersRemaining} remaining
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <AnimatePresence>
                {currentStep >= 3 && (
                  <motion.button
                    type="submit"
                    disabled={!isValid || isSubmitting}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    whileHover={isValid ? { scale: 1.02 } : {}}
                    whileTap={isValid ? { scale: 0.98 } : {}}
                    className={`w-full px-8 py-5 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-300 btn-modern ${isValid
                      ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-xl hover:shadow-2xl'
                      : 'bg-surface-200 text-surface-600 cursor-not-allowed'
                      }`}
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Sparkles className="w-5 h-5" />
                        </motion.div>
                        Sending your message...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', damping: 15, stiffness: 100 }}
            className="py-12 px-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.1 }}
              className="mb-6 inline-block"
            >
              <div className="relative">
                <CheckCircle className="w-20 h-20 text-green-500" />
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="absolute inset-0 rounded-full bg-green-500/20"
                />
              </div>
            </motion.div>

            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-brand-900 mb-2"
            >
              Message Sent!
            </motion.h3>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-brand-900/80 mb-6"
            >
              Your message has been added to the wall
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="flex justify-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: 0 }}
                    animate={{ y: [-10, 0, -10] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: 'easeInOut'
                    }}
                  >
                    <Heart className="w-6 h-6 text-pink-400 fill-pink-400" />
                  </motion.div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'YourWall',
                      text: 'Check out this message wall!',
                      url: window.location.href
                    }).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }
                }}
                className="px-6 py-2 rounded-full glass border border-brand-200 text-brand-700 font-medium flex items-center gap-2 hover:bg-brand-50 transition-all"
              >
                <Share2 className="w-4 h-4" />
                Share this wall
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
