'use client';

import { ThumbsUp, MessageCircle } from 'lucide-react';
import { Meme } from '@/types';

interface MemeCardProps {
  meme: Meme;
}

export default function MemeCard({ meme }: MemeCardProps) {
  const { url, title, likes, comments } = meme;

  return (
    <div className="relative w-full max-w-2xl mx-auto px-4">
      <div className="relative rounded-xl overflow-hidden bg-gray-900">
        <img 
          src={url} 
          alt={title}
          className="w-full max-h-[calc(100vh-16rem)] object-contain bg-gray-800"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-gray-900 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="text-lg font-medium mb-4 line-clamp-2">{title}</h3>
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 hover:text-[#c2f970] transition-colors">
              <ThumbsUp className="w-6 h-6" />
              <span className="text-sm">{likes?.toLocaleString() || '0'}</span>
            </button>
            <button className="flex items-center gap-2 hover:text-[#c2f970] transition-colors">
              <MessageCircle className="w-6 h-6" />
              <span className="text-sm">{comments?.toLocaleString() || '0'}</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}