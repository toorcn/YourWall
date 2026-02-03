'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Message } from '@/lib/types';
import MessageCard from './MessageCard';

interface RandomCardViewerProps {
  messages: Message[];
  isOpen: boolean;
  onClose: () => void;
  availableGroups?: string[];
  spaceCode: string;
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function RandomCardViewer({ messages, isOpen, onClose, availableGroups = [], spaceCode }: RandomCardViewerProps) {
  const [shuffledMessages, setShuffledMessages] = useState<Message[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 for next, -1 for previous
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  // Shuffle messages when modal opens or messages change
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      const shuffled = shuffleArray(messages);
      setShuffledMessages(shuffled);
      setCurrentIndex(0);
    }
  }, [isOpen, messages]);

  const handlePrevious = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? shuffledMessages.length - 1 : prev - 1));
  }, [shuffledMessages.length]);

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev === shuffledMessages.length - 1 ? 0 : prev + 1));
  }, [shuffledMessages.length]);

  const handleMessageClick = () => {
    // Do nothing - prevent opening share modal when clicking card in viewer
  };

  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    const deltaX = Math.abs(currentX - touchStart.x);
    const deltaY = Math.abs(currentY - touchStart.y);
    
    // If horizontal movement is clearly dominant, prevent vertical scrolling
    if (deltaX > 10 && deltaX > deltaY * 1.5) {
      e.preventDefault();
    }
    
    setTouchEnd({
      x: currentX,
      y: currentY,
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const absDistanceX = Math.abs(distanceX);
    const absDistanceY = Math.abs(distanceY);

    // Only trigger swipe if horizontal movement is greater than vertical (prevents conflict with scrolling)
    if (absDistanceX > absDistanceY && absDistanceX > minSwipeDistance) {
      if (distanceX > 0) {
        // Swiped left - next card
        handleNext();
      } else {
        // Swiped right - previous card
        handlePrevious();
      }
    }

    // Reset touch positions
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Prevent body scroll when modal is open (mobile-friendly)
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.position = 'fixed';
      document.documentElement.style.width = '100%';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        document.documentElement.style.position = '';
        document.documentElement.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, shuffledMessages.length, handlePrevious, handleNext, onClose]);

  if (!isOpen || shuffledMessages.length === 0) return null;

  const currentMessage = shuffledMessages[currentIndex];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-white/20 rounded-full transition-colors z-20"
            aria-label="Close viewer"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Card Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl px-1 sm:px-0 max-h-[90vh] flex flex-col items-center"
          >
            {/* Previous Button */}
            {shuffledMessages.length > 1 && (
              <button
                onClick={handlePrevious}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 sm:-translate-x-16 p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full transition-all z-10 hover:scale-110 active:scale-95"
                aria-label="Previous card"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </button>
            )}

            {/* Card Area */}
            <div 
              className="flex flex-col items-center w-full max-h-[calc(90vh-120px)] touch-pan-y"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  <MessageCard
                    message={currentMessage}
                    index={0}
                    onClick={handleMessageClick}
                    scrollable={true}
                    availableGroups={availableGroups}
                    spaceCode={spaceCode}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Card Counter */}
            {shuffledMessages.length > 1 && (
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium shrink-0"
              >
                {currentIndex + 1} of {shuffledMessages.length}
              </motion.div>
            )}

            {/* Next Button */}
            {shuffledMessages.length > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 sm:translate-x-16 p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full transition-all z-10 hover:scale-110 active:scale-95"
                aria-label="Next card"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </button>
            )}
          </motion.div>

          {/* Instructions */}
          {shuffledMessages.length > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 text-white/70 text-xs sm:text-sm text-center px-4"
            >
              <p className="hidden sm:block">Use arrow keys or buttons to navigate</p>
              <p className="sm:hidden">Swipe or use buttons to navigate</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

