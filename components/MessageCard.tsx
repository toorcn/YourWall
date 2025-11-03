'use client';

import { motion } from 'framer-motion';
import { Message } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface MessageCardProps {
  message: Message;
  index: number;
}

export default function MessageCard({ message, index }: MessageCardProps) {
  const formattedTime = message.timestamp
    ? formatDistanceToNow(message.timestamp.toDate(), { addSuffix: true })
    : 'just now';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="group"
    >
      <div
        className="h-full p-6 rounded-3xl backdrop-blur-md border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300"
        style={{
          backgroundColor: message.color ? `${message.color}40` : 'rgba(255, 255, 255, 0.3)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-medium text-gray-700">
                From: <span className="text-purple-600">{message.from || 'Anonymous'}</span>
              </span>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-gray-500">To:</span>
              {message.to.map((recipient, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-xs rounded-full bg-white/50 backdrop-blur-sm border border-white/60 text-gray-700"
                >
                  {recipient}
                </span>
              ))}
            </div>
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
            {formattedTime}
          </span>
        </div>

        {/* Message Content */}
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>

        {/* Decorative element on hover */}
        <div className="mt-4 h-0.5 bg-gradient-to-r from-purple-300/0 via-purple-300/50 to-purple-300/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.div>
  );
}

