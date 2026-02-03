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
  spaceTitle?: string;
}

export default function ShareModal({ message, isOpen, onClose, spaceTitle }: ShareModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when modal is open (mobile-friendly)
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Apply styles to prevent scrolling
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      // For iOS Safari
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.position = 'fixed';
      document.documentElement.style.width = '100%';

      return () => {
        // Restore scroll position
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

  if (!message) return null;

  // Debug: Log message data
  console.log('ShareModal message:', {
    from: message.from,
    to: message.to,
    content: message.content
  });

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

      // Convert all external images to data URLs to avoid CORS issues
      // This MUST complete before html2canvas runs, otherwise we get tainted canvas error
      const images = cardRef.current.querySelectorAll('img');
      const imagePromises = Array.from(images).map(async (img) => {
        const htmlImg = img as HTMLImageElement;

        // Skip if already a data URL
        if (htmlImg.src.startsWith('data:')) {
          return Promise.resolve();
        }

        try {
          console.log('Converting image to data URL:', htmlImg.src);

          // Use our API proxy to fetch the image (bypasses CORS)
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(htmlImg.src)}`;

          const response = await fetch(proxyUrl);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const blob = await response.blob();

          return new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const dataUrl = reader.result as string;
              if (!dataUrl) {
                reject(new Error('FileReader returned empty result'));
                return;
              }
              htmlImg.setAttribute('data-original-src', htmlImg.src);
              htmlImg.src = dataUrl;
              console.log('Image converted to data URL via proxy');
              resolve();
            };
            reader.onerror = () => {
              reject(new Error('FileReader failed'));
            };
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          console.error('Failed to convert image to data URL:', err);
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          throw new Error(`Failed to load image: ${errorMessage}`);
        }
      });

      // Wait for ALL images to be converted
      await Promise.all(imagePromises);

      // Verify all images are now data URLs
      const allImages = cardRef.current.querySelectorAll('img');
      const nonDataUrlImages = Array.from(allImages).filter((img) => {
        const htmlImg = img as HTMLImageElement;
        return !htmlImg.src.startsWith('data:');
      });

      if (nonDataUrlImages.length > 0) {
        throw new Error(`${nonDataUrlImages.length} image(s) could not be converted to data URLs. Please check Firebase Storage CORS configuration.`);
      }

      // Wait for images to render with new data URLs
      await new Promise(resolve => setTimeout(resolve, 300));

      // Capture the card element as a canvas with error handling
      let canvas;
      try {
        console.log('Starting html2canvas capture...');
        canvas = await html2canvas(cardRef.current, {
          scale: 2, // Higher quality
          useCORS: false, // All images are now data URLs, no CORS needed
          allowTaint: false, // MUST be false - we've converted all images to data URLs
          backgroundColor: '#ffffff', // White background for clean download
          logging: false, // Disable logging to avoid console spam
          windowWidth: cardRef.current.scrollWidth,
          windowHeight: cardRef.current.scrollHeight,
          imageTimeout: 0, // Don't timeout
          removeContainer: true,
          foreignObjectRendering: false, // Disable foreign object for better compatibility
          onclone: (clonedDoc) => {
            // Remove all external stylesheets that might contain oklab
            const linkTags = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
            linkTags.forEach((tag) => tag.remove());

            // Remove style tags with oklab
            const styleTags = clonedDoc.querySelectorAll('style');
            styleTags.forEach((tag) => {
              if (tag.textContent && tag.textContent.includes('oklab')) {
                tag.remove();
              }
            });

            // Remove backdrop-filter which can cause issues
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach((el) => {
              const htmlEl = el as HTMLElement;
              if (htmlEl.style.backdropFilter) {
                htmlEl.style.backdropFilter = 'none';
              }
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if ((htmlEl.style as any).webkitBackdropFilter) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (htmlEl.style as any).webkitBackdropFilter = 'none';
              }
            });

            // Remove white overlay divs that create yellow hue
            // Find all divs with white/transparent backgrounds
            const allDivs = clonedDoc.querySelectorAll('div');
            allDivs.forEach((div) => {
              const htmlDiv = div as HTMLElement;
              const inlineBg = htmlDiv.style.backgroundColor || '';
              const classes = htmlDiv.classList.toString();

              // Check if it's an overlay (positioned absolutely with inset-0 or has white bg)
              const isOverlay = classes.includes('inset-0') ||
                htmlDiv.style.position === 'absolute' ||
                htmlDiv.style.position === 'fixed';

              // Remove white overlays with opacity that create yellow tint
              if (inlineBg.includes('rgba(255, 255, 255') ||
                inlineBg.includes('rgb(255, 255, 255')) {
                if (isOverlay) {
                  // Remove the overlay completely
                  htmlDiv.style.display = 'none';
                } else {
                  // For non-overlay divs, make background fully transparent
                  htmlDiv.style.backgroundColor = 'transparent';
                }
              }

              // Also check for any white rgba backgrounds (with any opacity)
              if (inlineBg.includes('rgba') && inlineBg.includes('255') && inlineBg.includes('255')) {
                if (isOverlay) {
                  htmlDiv.style.display = 'none';
                } else {
                  htmlDiv.style.backgroundColor = 'transparent';
                }
              }
            });

            // Ensure images have no background color tint
            const images = clonedDoc.querySelectorAll('img');
            images.forEach((img) => {
              const htmlImg = img as HTMLImageElement;
              htmlImg.style.backgroundColor = 'transparent';
              // Remove any filters that might add color cast
              htmlImg.style.filter = 'none';
            });
          },
        });
        console.log('Canvas created successfully');
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
              const fileName = `yourwall-message-${message.from || 'anonymous'}-${Date.now()}.png`;
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

      // Restore original image sources
      if (cardRef.current) {
        const images = cardRef.current.querySelectorAll('img[data-original-src]');
        images.forEach((img) => {
          const htmlImg = img as HTMLImageElement;
          const originalSrc = htmlImg.getAttribute('data-original-src');
          if (originalSrc) {
            htmlImg.src = originalSrc;
            htmlImg.removeAttribute('data-original-src');
          }
        });
      }

    } catch (error) {
      console.error('Error downloading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download image. Please try again.';
      alert(errorMessage);

      // Restore original image sources even on error
      if (cardRef.current) {
        const images = cardRef.current.querySelectorAll('img[data-original-src]');
        images.forEach((img) => {
          const htmlImg = img as HTMLImageElement;
          const originalSrc = htmlImg.getAttribute('data-original-src');
          if (originalSrc) {
            htmlImg.src = originalSrc;
            htmlImg.removeAttribute('data-original-src');
          }
        });
      }
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
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-2 md:p-4 bg-black/70 backdrop-blur-md overflow-y-auto touch-pan-y"
          onClick={onClose}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl my-0 sm:my-auto min-h-screen sm:min-h-0"
            style={{ touchAction: 'pan-y' }}
          >
            {/* Close Button - Mobile-friendly positioning */}
            <button
              onClick={onClose}
              className="fixed sm:absolute top-4 right-4 sm:-top-12 p-3 sm:p-2 bg-black/50 sm:bg-transparent hover:bg-white/20 sm:hover:bg-white/10 rounded-full transition-colors z-20 touch-manipulation"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Shareable Card - Mobile-optimized sizing */}
            <div
              ref={cardRef}
              data-card-content
              className="relative w-full sm:aspect-[3/4] min-h-screen sm:min-h-0 rounded-none sm:rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden"
              style={{
                backgroundImage: 'url(/yourwall-card.png)',
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

              {/* Content - Single scrollable container for mobile */}
              <div className="relative h-full min-h-screen sm:min-h-0 flex flex-col p-6 sm:p-10 md:p-12">
                {/* Header Logo/Name */}
                <div className="flex items-center justify-center gap-4 mb-6 sm:mb-8">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 relative">
                    <img
                      src="/icon-transparent.svg"
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-brand-800 via-brand-600 to-brand-800 bg-clip-text text-transparent drop-shadow-sm tracking-tight text-center leading-tight">
                    {spaceTitle || 'YourWall'}
                  </h1>
                </div>

                {/* Message Card */}
                <div
                  className="flex-1 flex flex-col justify-start sm:justify-center p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl backdrop-blur-md border-2 border-white/60 shadow-xl overflow-y-auto sm:overflow-hidden relative"
                  style={{
                    backgroundImage: 'url(/yourwall-card.png)',
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

                  {/* Message Content - Removed nested scroll for mobile */}
                  <div className="flex-1 flex flex-col items-center justify-start sm:justify-center px-2 space-y-4 sm:space-y-6 py-4">
                    <p className="text-gray-900 text-lg sm:text-2xl md:text-3xl leading-relaxed whitespace-pre-wrap break-words text-center font-semibold max-w-full">
                      &ldquo;{message.content}&rdquo;
                    </p>

                  </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-6 sm:pt-8 text-center">
                  <div className="inline-flex items-center gap-2.5 bg-white/40 backdrop-blur-md py-2.5 px-6 rounded-full border border-white/50 shadow-sm transition-all hover:bg-white/60">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 relative">
                      <img
                        src="/icon-transparent.svg"
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-sm sm:text-base text-brand-900 font-bold tracking-tight">
                      {typeof window !== 'undefined' ? window.location.host : 'yourwall.com'}/{message.spaceCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Download Button - Mobile-friendly with safe area padding */}
            <div className="mt-4 sm:mt-6 pb-4 sm:pb-0 text-center">
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownload}
                disabled={isDownloading}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
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

