'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera } from 'lucide-react';
import { Message } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface ShareModalProps {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ message, isOpen, onClose }: ShareModalProps) {
  if (!message) return null;

  const formattedTime = message.timestamp
    ? formatDistanceToNow(message.timestamp.toDate(), { addSuffix: true })
    : 'just now';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute -top-12 right-0 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Shareable Card - Square format for Instagram */}
            <div className="relative aspect-square bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-3xl shadow-2xl overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0">
                <div className="absolute top-10 left-10 w-32 h-32 bg-purple-200/15 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-pink-200/15 rounded-full blur-3xl" />
              </div>

              {/* Content */}
              <div className="relative h-full flex flex-col p-8">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                  <img
                    src="/KiyokoCon_Logo.png"
                    alt="KiyokoCon"
                    className="h-20 w-auto"
                  />
                </div>

                {/* Message Card */}
                <div
                  className="flex-1 flex flex-col justify-center p-6 rounded-2xl backdrop-blur-md border border-white/60 shadow-lg"
                  style={{
                    backgroundColor: message.color ? `${message.color}60` : 'rgba(255, 255, 255, 0.4)',
                  }}
                >
                  {/* Message Header */}
                  <div className="mb-4 pb-4 border-b border-white/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        From: <span className="text-purple-600">{message.from || 'Anonymous'}</span>
                      </span>
                      <span className="text-xs text-gray-500">{formattedTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-medium text-gray-600">To:</span>
                      {message.to.map((recipient, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 text-xs font-medium rounded-full bg-white/60 backdrop-blur-sm border border-white/80 text-gray-700"
                        >
                          {recipient}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Message Content */}
                  <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap break-words text-center font-medium">
                    "{message.content}"
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center">
                  <p className="text-sm font-semibold bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent">
                    KiyokoCon 2025
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Message Wall</p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-4 text-center">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white text-sm flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Screenshot this to share on Instagram!
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

