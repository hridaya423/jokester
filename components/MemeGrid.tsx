'use client';

import { useState, useRef, useCallback } from 'react';
import { Meme, MemeTemplate, TabType } from '@/types';
import MemeCard from './MemeCard';
import CreateMemeModal from './createMemeModal';

interface MemeGridProps {
  initialMemes: Meme[];
  templates: MemeTemplate[];
}

export default function MemeGrid({ initialMemes, templates }: MemeGridProps) {
  const [activeTab, setActiveTab] = useState<TabType>('trending');
  const [memes, setMemes] = useState<Meme[]>(Array.isArray(initialMemes) ? initialMemes : []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastMemeRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    
    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreMemes();
      }
    });

    if (node) {
      observer.current.observe(node);
    }
  }, [loading, hasMore]);

  const loadMoreMemes = async () => {
    if (loading || !hasMore || activeTab === 'templates') return;

    setLoading(true);
    try {
      const res = await fetch(`/api/memes${after ? `?after=${after}` : ''}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!res.ok) throw new Error('Failed to fetch memes');
      
      const data = await res.json();
      
      if (!data.memes || !Array.isArray(data.memes)) {
        throw new Error('Invalid response format');
      }
      
      if (data.memes.length > 0) {
        setMemes(prev => [...prev, ...data.memes]);
        setAfter(data.after);
        setHasMore(Boolean(data.after));
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching memes:', err);
      setError('Failed to load more memes');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    
    if (tab === 'trending') {
      setMemes(initialMemes);
      setAfter(null);
      setHasMore(true);
      setError(null);
    }
  };

  const handleTemplateClick = (template: MemeTemplate) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTemplate(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex gap-6 mb-6 text-lg border-b border-gray-800 sticky top-16 bg-black z-10 pb-2">
        {['trending', 'templates'].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab as TabType)}
            className={`capitalize px-2 ${
              activeTab === tab 
                ? 'text-[#c2f970] border-b-2 border-[#c2f970]' 
                : 'text-gray-400 hover:text-gray-300'
            } transition-colors`}
          >
            {tab}
          </button>
        ))}

        <button
          onClick={() => setIsModalOpen(true)}
          className="ml-auto text-[#c2f970] hover:text-[#d4ff99] transition-colors"
        >
          Create Meme
        </button>
      </div>
      <div className="pb-20">
        {activeTab === 'templates' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div 
                key={template.id}
                className="aspect-square rounded-lg overflow-hidden bg-gray-900 cursor-pointer hover:ring-2 hover:ring-[#c2f970] transition-all"
                onClick={() => handleTemplateClick(template)}
              >
                <img 
                  src={template.url} 
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {Array.isArray(memes) && memes.map((meme, index) => (
              <div 
                key={`${meme.id}-${index}`}
                ref={index === memes.length - 1 ? lastMemeRef : undefined}
                className="snap-start"
              >
                <MemeCard meme={meme} />
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#c2f970] border-t-transparent" />
              </div>
            )}
            
            {error && (
              <div className="text-center py-4">
                <p className="text-red-400 mb-2">{error}</p>
                <button 
                  onClick={() => loadMoreMemes()}
                  className="text-[#c2f970] hover:text-[#d4ff99] transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {!hasMore && !loading && memes.length > 0 && (
              <div className="text-center py-4 text-gray-400">
                You&apos;ve reached the end!
              </div>
            )}
          </div>
        )}
      </div>

      <CreateMemeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        templates={templates}
        initialTemplate={selectedTemplate}
      />
    </div>
  );
}