'use client';

import { useState, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Plus, X } from 'lucide-react';
import { createSpace, validateSpaceCode } from '@/lib/firestore';
import { SpaceFormData } from '@/lib/types';

const DEFAULT_COLORS = {
  primary: '#9333ea', // purple-600
  secondary: '#ec4899', // pink-500
  accent: '#3b82f6', // blue-500
};

const DEFAULT_POPULAR_GROUPS = ['Volunteers', 'Committees', 'Attendees', 'Everyone'];

export default function CreateSpacePage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState<SpaceFormData>({
    code: '',
    title: '',
    description: '',
    colors: { ...DEFAULT_COLORS },
    popularGroups: [...DEFAULT_POPULAR_GROUPS],
  });

  const [newGroup, setNewGroup] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);

  const handleCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().trim();
    setFormData({ ...formData, code: value });
    setCodeError(null);

    // Validate code as user types (debounced)
    if (value.length >= 3) {
      setIsValidatingCode(true);
      try {
        const validation = await validateSpaceCode(value);
        if (!validation.valid || !validation.available) {
          setCodeError(validation.error || 'Invalid code');
        }
      } catch (error) {
        console.error('Error validating code:', error);
      } finally {
        setIsValidatingCode(false);
      }
    }
  };


  const handleAddGroup = () => {
    if (newGroup.trim() && !formData.popularGroups.includes(newGroup.trim())) {
      setFormData({
        ...formData,
        popularGroups: [...formData.popularGroups, newGroup.trim()],
      });
      setNewGroup('');
    }
  };

  const handleRemoveGroup = (groupToRemove: string) => {
    setFormData({
      ...formData,
      popularGroups: formData.popularGroups.filter(g => g !== groupToRemove),
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCodeError(null);

    // Final validation
    if (!formData.code.trim() || !formData.title.trim()) {
      setCodeError('Code and title are required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create space
      await createSpace(formData);

      // Redirect to the new space
      router.push(`/${formData.code.toLowerCase().trim()}`);
    } catch (error) {
      console.error('Error creating space:', error);
      if (error instanceof Error) {
        setCodeError(error.message);
      } else {
        setCodeError('Failed to create space. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" />
      </div>

      {/* Main Content */}
      <div className="relative max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/30 backdrop-blur-md rounded-3xl p-8 border border-white/40 shadow-xl"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent">
              Create New Space
            </h1>
            <p className="text-gray-600">Set up your message wall</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Space Code */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Space Code <span className="text-red-500">*</span>
              </label>
              <input
                id="code"
                type="text"
                value={formData.code}
                onChange={handleCodeChange}
                placeholder="myevent2025"
                className="w-full px-4 py-3 rounded-2xl bg-white/50 backdrop-blur-md border border-white/40 focus:border-purple-300 focus:outline-none transition-all placeholder:text-gray-500"
                required
                pattern="[a-z0-9]{3,20}"
                title="3-20 lowercase letters and numbers only"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                3-20 characters, lowercase letters and numbers only (no spaces or special characters)
              </p>
              {isValidatingCode && (
                <p className="text-xs text-blue-500 mt-1">Checking availability...</p>
              )}
              {codeError && (
                <p className="text-xs text-red-500 mt-1">{codeError}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Space Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="My Event 2025"
                className="w-full px-4 py-3 rounded-2xl bg-white/50 backdrop-blur-md border border-white/40 focus:border-purple-300 focus:outline-none transition-all placeholder:text-gray-500"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Leave a message for each other"
                rows={3}
                className="w-full px-4 py-3 rounded-2xl bg-white/50 backdrop-blur-md border border-white/40 focus:border-purple-300 focus:outline-none transition-all placeholder:text-gray-500 resize-none"
                disabled={isSubmitting}
              />
            </div>

            {/* Colors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colors
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Primary</label>
                  <input
                    type="color"
                    value={formData.colors.primary}
                    onChange={(e) => setFormData({
                      ...formData,
                      colors: { ...formData.colors, primary: e.target.value },
                    })}
                    className="w-full h-10 rounded-lg cursor-pointer"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Secondary</label>
                  <input
                    type="color"
                    value={formData.colors.secondary}
                    onChange={(e) => setFormData({
                      ...formData,
                      colors: { ...formData.colors, secondary: e.target.value },
                    })}
                    className="w-full h-10 rounded-lg cursor-pointer"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Accent</label>
                  <input
                    type="color"
                    value={formData.colors.accent}
                    onChange={(e) => setFormData({
                      ...formData,
                      colors: { ...formData.colors, accent: e.target.value },
                    })}
                    className="w-full h-10 rounded-lg cursor-pointer"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Popular Groups */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Popular Groups
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddGroup();
                    }
                  }}
                  placeholder="Add a group"
                  className="flex-1 px-4 py-2 rounded-xl bg-white/50 backdrop-blur-md border border-white/40 focus:border-purple-300 focus:outline-none transition-all placeholder:text-gray-500"
                  disabled={isSubmitting}
                />
                <motion.button
                  type="button"
                  onClick={handleAddGroup}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 rounded-xl bg-purple-300 text-white hover:bg-purple-400 transition-all"
                  disabled={isSubmitting}
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.popularGroups.map((group) => (
                  <motion.div
                    key={group}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 backdrop-blur-md border border-white/40"
                  >
                    <span className="text-sm text-gray-700">{group}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGroup(group)}
                      className="text-gray-500 hover:text-red-500 transition-colors"
                      disabled={isSubmitting}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSubmitting || !formData.code.trim() || !formData.title.trim() || !!codeError}
              whileHover={!isSubmitting && formData.code.trim() && formData.title.trim() && !codeError ? { scale: 1.02 } : {}}
              whileTap={!isSubmitting && formData.code.trim() && formData.title.trim() && !codeError ? { scale: 0.98 } : {}}
              className={`w-full px-6 py-4 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all ${
                isSubmitting || !formData.code.trim() || !formData.title.trim() || !!codeError
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-300 to-pink-300 text-white shadow-lg hover:shadow-xl'
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
                  Creating...
                </>
              ) : (
                <>
                  Create Space
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-gray-600 hover:text-purple-600 transition-colors"
            >
              ← Back to code entry
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

