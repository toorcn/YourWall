'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import { Message } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';

interface ShareModalProps {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ message, isOpen, onClose }: ShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!message) return null;

  const formattedTime = message.timestamp
    ? formatDistanceToNow(message.timestamp.toDate(), { addSuffix: true })
    : 'just now';

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `kiyokocon-message-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error downloading image:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl my-auto"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute -top-10 sm:-top-12 right-0 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Shareable Card - Larger format optimized for sharing */}
            <div 
              ref={cardRef}
              className="relative aspect-square bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0">
                <div className="absolute top-10 left-10 w-40 h-40 sm:w-64 sm:h-64 bg-purple-200/20 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-10 w-48 h-48 sm:w-72 sm:h-72 bg-pink-200/20 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 sm:w-80 sm:h-80 bg-blue-200/15 rounded-full blur-3xl" />
              </div>

              {/* Content */}
              <div className="relative h-full flex flex-col p-6 sm:p-10 md:p-12">
                {/* Logo */}
                <div className="flex justify-center mb-6 sm:mb-8">
                  <img
                    src="/KiyokoCon_Logo.png"
                    alt="KiyokoCon"
                    className="h-16 sm:h-24 md:h-28 w-auto"
                  />
                </div>

                {/* Message Card */}
                <div
                  className="flex-1 flex flex-col justify-center p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl backdrop-blur-md border-2 border-white/60 shadow-xl"
                  style={{
                    backgroundColor: message.color ? `${message.color}50` : 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {/* Message Header */}
                  <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b-2 border-white/50">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <span className="text-base sm:text-lg md:text-xl font-bold text-gray-800">
                        From: <span className="text-purple-600">{message.from || 'Anonymous'}</span>
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500">{formattedTime}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-semibold text-gray-700">To:</span>
                      {message.to.map((recipient, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full bg-white/70 backdrop-blur-sm border-2 border-white/90 text-gray-800"
                        >
                          {recipient}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-900 text-xl sm:text-2xl md:text-3xl leading-relaxed whitespace-pre-wrap break-words text-center font-semibold">
                      "{message.content}"
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 sm:mt-8 text-center">
                  <p className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-1">
                    KiyokoCon 2025
                  </p>
                  <p className="text-sm sm:text-base text-gray-700 font-medium">Message Wall</p>
                </div>
              </div>
            </div>

            {/* Download Button */}
            <div className="mt-4 sm:mt-6 text-center">
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownload}
                disabled={isDownloading}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                {isDownloading ? 'Downloading...' : 'Download Image'}
              </motion.button>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/80 text-xs sm:text-sm mt-3"
              >
                Share it with the world!
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

