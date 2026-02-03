'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import NextImage from 'next/image';
import { getSpaceByCode } from '@/lib/firestore';

export default function Home() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError('Please enter a space code');
      return;
    }

    setIsLoading(true);

    try {
      const normalizedCode = code.toLowerCase().trim();
      const space = await getSpaceByCode(normalizedCode);

      if (!space) {
        setError('Space not found. Please check your code and try again.');
        setIsLoading(false);
        return;
      }

      // Redirect to the space page
      router.push(`/${normalizedCode}`);
    } catch (err) {
      console.error('Error checking space:', err);
      setError('Failed to verify space code. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Modern Background */}
      <div className="fixed inset-0 -z-10">
        {/* Animated geometric shapes */}
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 opacity-10"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-600 rounded-full"></div>
        </motion.div>

        <motion.div
          className="absolute top-40 right-20 w-96 h-96 opacity-8"
          animate={{
            rotate: [360, 0],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            rotate: { duration: 25, repeat: Infinity, ease: "linear" },
            x: { duration: 8, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <div className="w-full h-full bg-gradient-to-br from-pink-400 to-red-500 rounded-full blur-2xl"></div>
        </motion.div>

        <motion.div
          className="absolute bottom-32 left-1/4 w-80 h-80 opacity-6"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            scale: { duration: 10, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 30, repeat: Infinity, ease: "linear" }
          }}
        >
          <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full blur-3xl"></div>
        </motion.div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(102, 126, 234, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(102, 126, 234, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <div className="text-center mb-16">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center mb-8"
            >
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl pulse-glow overflow-hidden relative">
                  <NextImage
                    src="/brand-icon.webp"
                    alt="YourWall Logo"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center z-10"
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </motion.div>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl sm:text-6xl font-bold mb-6 gradient-text"
            >
              YourWall
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-600 font-medium mb-2"
            >
              Enter your space code to continue
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-gray-500"
            >
              Join the conversation in your dedicated space
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
            className="card-modern max-w-lg mx-auto p-10"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Space Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toLowerCase().trim());
                    setError(null);
                  }}
                  placeholder="your-space-code"
                  className="w-full px-6 py-4 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 placeholder:text-gray-400 text-center text-lg font-medium focus-modern"
                  autoFocus
                  disabled={isLoading}
                  pattern="[a-z0-9]{3,20}"
                  title="3-20 lowercase letters and numbers only"
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Enter the unique code for your message space
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center font-medium"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={isLoading || !code.trim()}
                whileHover={!isLoading && code.trim() ? { scale: 1.02 } : {}}
                whileTap={!isLoading && code.trim() ? { scale: 0.98 } : {}}
                className={`w-full px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-300 btn-modern ${isLoading || !code.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl hover:shadow-2xl'
                  }`}
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                    Checking...
                  </>
                ) : (
                  <>
                    Enter Space
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-10 pt-8 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600 mb-6">
                Don't have a space code yet?
              </p>
              <motion.a
                href="/create"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="block w-full px-6 py-4 rounded-xl font-medium text-center bg-white border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 text-gray-700 hover:text-blue-600 shadow-sm hover:shadow-md"
              >
                Create New Space
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
