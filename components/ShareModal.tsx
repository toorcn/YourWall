'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import { Message } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import html2canvas from 'html2canvas';

interface ShareModalProps {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ message, isOpen, onClose }: ShareModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!message) return null;

  const handleDownload = async () => {
    if (!cardRef.current || isDownloading) return;

    try {
      setIsDownloading(true);

      // Wait for fonts and animations to load/complete
      try {
        await Promise.race([
          document.fonts.ready,
          new Promise(resolve => setTimeout(resolve, 1000)) // Timeout after 1s
        ]);
      } catch {
        // Ignore font loading errors
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));

      // Capture the card element as a canvas with error handling
      let canvas;
      try {
        console.log('Starting html2canvas capture...');
        canvas = await html2canvas(cardRef.current, {
          scale: 2, // Higher quality
          useCORS: false, // Disable CORS to avoid cross-origin issues
          allowTaint: true, // Allow tainted canvas
          backgroundColor: '#ffffff',
          logging: true, // Enable logging to debug
          windowWidth: cardRef.current.scrollWidth,
          windowHeight: cardRef.current.scrollHeight,
          imageTimeout: 0, // Don't timeout
          removeContainer: true,
          foreignObjectRendering: false, // Disable foreign object for better compatibility
          onclone: (clonedDoc) => {
            console.log('Cloning document...');
            // Ensure the cloned element is visible and properly styled
            const clonedCard = clonedDoc.querySelector('[data-card-content]') as HTMLElement;
            if (clonedCard) {
              clonedCard.style.transform = 'none';
              clonedCard.style.opacity = '1';
              console.log('Cloned card styled');
            }
            
            // Remove backdrop-filter which can cause issues
            const elementsWithBackdrop = clonedDoc.querySelectorAll('[style*="backdrop"]');
            elementsWithBackdrop.forEach((el) => {
              const htmlEl = el as HTMLElement;
              htmlEl.style.backdropFilter = 'none';
              htmlEl.style.webkitBackdropFilter = 'none';
            });
            console.log('Removed backdrop filters from', elementsWithBackdrop.length, 'elements');
          },
        });
        console.log('Canvas created successfully:', canvas);
      } catch (canvasError) {
        console.error('Canvas generation error details:', canvasError);
        throw canvasError; // Throw the actual error instead of a generic one
      }

      if (!canvas) {
        throw new Error('Canvas generation failed');
      }

      // Convert canvas to blob with error handling
      await new Promise<void>((resolve, reject) => {
        try {
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to create image blob'));
              return;
            }

            try {
              // Create download link
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              const fileName = `kiyokocon-message-${message.from || 'anonymous'}-${Date.now()}.png`;
              link.download = fileName;
              link.href = url;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              // Cleanup
              setTimeout(() => URL.revokeObjectURL(url), 100);
              resolve();
            } catch (downloadError) {
              reject(downloadError);
            }
          }, 'image/png', 0.95);
        } catch (blobError) {
          reject(blobError);
        }
      });

    } catch (error) {
      console.error('Error downloading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download image. Please try again.';
      alert(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

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
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl my-auto"
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
              data-card-content
              className="relative aspect-[3/4] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
              style={{
                backgroundImage: 'url(/kiyokocon-card.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              {/* Overlay for text readability */}
              <div 
                className="absolute inset-0"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(4px)',
                }}
              />

              {/* Content */}
              <div className="relative h-full flex flex-col p-6 sm:p-10 md:p-12 overflow-y-auto">
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
                  className="flex-1 flex flex-col justify-center p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl backdrop-blur-md border-2 border-white/60 shadow-xl overflow-hidden relative"
                  style={{
                    backgroundImage: 'url(/kiyokocon-card.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                >
                  {/* Overlay for inner card */}
                  <div 
                    className="absolute inset-0 -z-10"
                    style={{
                      backgroundColor: message.color ? `${message.color}70` : 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(8px)',
                    }}
                  />
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
                  <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-2 space-y-4 sm:space-y-6">
                    <p className="text-gray-900 text-xl sm:text-2xl md:text-3xl leading-relaxed whitespace-pre-wrap break-words text-center font-semibold max-w-full">
                      &ldquo;{message.content}&rdquo;
                    </p>
                    
                    {/* Image Attachment */}
                    {message.imageUrl && (
                      <div className="w-full max-w-md rounded-xl sm:rounded-2xl overflow-hidden border-2 border-white/60 shadow-lg">
                        <img
                          src={message.imageUrl}
                          alt="Message attachment"
                          className="w-full h-auto object-contain bg-white/50"
                          crossOrigin="anonymous"
                        />
                      </div>
                    )}
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

