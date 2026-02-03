'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Plus, X, RefreshCw } from 'lucide-react';
import { createSpace, validateSpaceCode, getUniqueSpaceCode } from '@/lib/firestore';
import { SpaceFormData } from '@/lib/types';

const DEFAULT_COLORS = {
  primary: '#6366f1', // brand-500 (Indigo)
  secondary: '#f43f5e', // accent-500 (Rose)
  accent: '#a855f7', // brand-400 (Purple-ish)
};

const DEFAULT_POPULAR_GROUPS = ['General', 'Shoutouts', 'Q&A'];

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
  const [isManualCode, setIsManualCode] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.host + '/');
    }
  }, []);

  // Auto-generate space code from title
  useEffect(() => {
    if (isManualCode || !formData.title.trim()) return;

    const generateCode = async () => {
      setIsValidatingCode(true);
      const baseCode = formData.title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric except hyphens
        .replace(/-+/g, '-') // Collapse multiple hyphens
        .replace(/^-+|-+$/g, ''); // Trim hyphens

      if (baseCode.length >= 3) {
        const uniqueCode = await getUniqueSpaceCode(baseCode.replace(/-/g, ''));
        setFormData(prev => ({ ...prev, code: uniqueCode }));
        setCodeError(null);
      }
      setIsValidatingCode(false);
    };

    // Debounce to avoid too many Firestore lookups
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(generateCode, 500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [formData.title, isManualCode]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    const baseSlug = newTitle
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '');

    setFormData(prev => ({
      ...prev,
      title: newTitle,
      code: isManualCode ? prev.code : baseSlug.substring(0, 20)
    }));

    if (!isManualCode) {
      setCodeError(null);
    }
  };

  const handleCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    setFormData({ ...formData, code: value });
    setIsManualCode(true);
    setCodeError(null);

    // Validate code as user types (debounced)
    if (value.length >= 3) {
      setIsValidatingCode(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(async () => {
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
      }, 500);
    }
  };

  const handleResetCode = () => {
    setIsManualCode(false);
    const baseSlug = formData.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '');
    setFormData(prev => ({ ...prev, code: baseSlug.substring(0, 20) }));
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
        <div className="absolute inset-0 bg-surface-50" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50/50 via-surface-50 to-accent-50/50" />
      </div>

      {/* Main Content */}
      <div className="relative max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-50/30 backdrop-blur-md rounded-3xl p-8 border border-surface-100/40 shadow-xl"
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 relative">
                <img src="/icon-transparent.svg" alt="YourWall Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-2 bg-gradient-to-r from-brand-500 via-accent-500 to-brand-500 bg-clip-text text-transparent">
              Create New Space
            </h1>
            <p className="text-brand-900/90">Set up your message wall</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-brand-900 mb-2">
                Event Name <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={handleTitleChange}
                placeholder="e.g. My Wedding, Tech Conference 2025"
                className="w-full px-4 py-3 rounded-2xl bg-surface-50/50 backdrop-blur-md border border-surface-100/40 focus:border-brand-300 focus:outline-none transition-all placeholder:text-brand-900/30 text-brand-900 font-medium"
                required
                disabled={isSubmitting}
                autoFocus
              />
              <p className="text-xs text-brand-900/80 mt-1">
                This will be displayed as the main heading of your space
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-brand-900 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Leave a message for the happy couple!"
                rows={2}
                className="w-full px-4 py-3 rounded-2xl bg-surface-50/50 backdrop-blur-md border border-surface-100/40 focus:border-brand-300 focus:outline-none transition-all placeholder:text-brand-900/30 text-brand-900 resize-none"
                disabled={isSubmitting}
              />
            </div>

            {/* Colors */}
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Theme Colors
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-brand-900/80 mb-1">Primary</label>
                  <input
                    type="color"
                    value={formData.colors.primary}
                    onChange={(e) => setFormData({
                      ...formData,
                      colors: { ...formData.colors, primary: e.target.value },
                    })}
                    className="w-full h-10 rounded-lg cursor-pointer border border-surface-200"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-xs text-brand-900/80 mb-1">Secondary</label>
                  <input
                    type="color"
                    value={formData.colors.secondary}
                    onChange={(e) => setFormData({
                      ...formData,
                      colors: { ...formData.colors, secondary: e.target.value },
                    })}
                    className="w-full h-10 rounded-lg cursor-pointer border border-surface-200"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-xs text-brand-900/80 mb-1">Accent</label>
                  <input
                    type="color"
                    value={formData.colors.accent}
                    onChange={(e) => setFormData({
                      ...formData,
                      colors: { ...formData.colors, accent: e.target.value },
                    })}
                    className="w-full h-10 rounded-lg cursor-pointer border border-surface-200"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Popular Groups */}
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Predefined Filter Groups
              </label>
              <p className="text-xs text-brand-900/80 mb-3">
                Common recipients people can quickly select when writing a message
              </p>
              <div className="flex gap-2 mb-3">
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
                  placeholder="e.g. VIPs, Organizers"
                  className="flex-1 px-4 py-2 rounded-xl bg-surface-50/50 backdrop-blur-md border border-surface-100/40 focus:border-brand-300 focus:outline-none transition-all placeholder:text-brand-900/30 text-brand-900"
                  disabled={isSubmitting}
                />
                <motion.button
                  type="button"
                  onClick={handleAddGroup}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-all font-medium"
                  disabled={isSubmitting || !newGroup.trim()}
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
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-50/50 backdrop-blur-md border border-surface-100/40 shadow-sm"
                  >
                    <span className="text-sm text-brand-900/80 font-medium">{group}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGroup(group)}
                      className="text-brand-900/40 hover:text-red-500 transition-colors"
                      disabled={isSubmitting}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Space Code - Moved to bottom */}
            <div className="pt-6 border-t border-surface-100/60">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="code" className="block text-sm font-medium text-brand-900">
                  Space URL Code <span className="text-red-500">*</span>
                </label>
                {isManualCode && (
                  <button
                    type="button"
                    onClick={handleResetCode}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Auto-generate
                  </button>
                )}
              </div>
              <div className={`flex items-center px-4 py-3 rounded-2xl bg-white transition-all shadow-inner border ${codeError ? 'border-red-300 ring-4 ring-red-50' : 'border-surface-100 focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-500/10'
                }`}>
                <span className="text-brand-900/40 font-medium select-none whitespace-nowrap mr-0.5">
                  {baseUrl || 'yourwall.app/'}
                </span>
                <input
                  id="code"
                  type="text"
                  value={formData.code}
                  onChange={handleCodeChange}
                  placeholder="unique-code"
                  className="w-full bg-transparent focus:outline-none text-brand-900 font-bold placeholder:text-brand-900/20"
                  required
                  pattern="[a-z0-9]{3,20}"
                  title="3-20 lowercase letters and numbers only"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex justify-between items-start mt-2">
                <div>
                  <p className="text-xs text-brand-900/80">
                    This is your unique link. Must be 3-20 alphanumeric characters.
                  </p>
                  {isValidatingCode && (
                    <p className="text-xs text-brand-500 mt-1 animate-pulse">Verifying availability...</p>
                  )}
                  {codeError && (
                    <p className="text-xs text-red-500 mt-1 font-medium">{codeError}</p>
                  )}
                  {!codeError && formData.code.length >= 3 && !isValidatingCode && (
                    <p className="text-xs text-green-600 mt-1 font-medium italic">✓ Looks good!</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSubmitting || !formData.code.trim() || !formData.title.trim() || !!codeError}
              whileHover={!isSubmitting && formData.code.trim() && formData.title.trim() && !codeError ? { scale: 1.02 } : {}}
              whileTap={!isSubmitting && formData.code.trim() && formData.title.trim() && !codeError ? { scale: 0.98 } : {}}
              className={`w-full px-6 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-2xl ${isSubmitting || !formData.code.trim() || !formData.title.trim() || !!codeError
                ? 'bg-surface-200 text-surface-400 cursor-not-allowed transform-none'
                : 'bg-gradient-to-r from-brand-500 to-accent-500 text-white'
                }`}
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <RefreshCw className="w-5 h-5" />
                  </motion.div>
                  Creating Space...
                </>
              ) : (
                <>
                  Launch My Wall
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <a
              href="/"
              className="text-sm text-brand-900/80 hover:text-brand-600 transition-colors font-medium"
            >
              ← Back to homepage
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
