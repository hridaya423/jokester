'use client';

import { useState, useRef, useCallback } from 'react';
import { Meme, MemeTemplate, TabType } from '@/types';
import MemeCard from './MemeCard';
import CreateMemeModal from './createMemeModal';

interface MemeGridProps {
  initialMemes: Meme[];
  templates: MemeTemplate[];
  initialAfter?: string | null;
}

export default function MemeGrid({ initialMemes, templates, initialAfter }: MemeGridProps) {
  const [activeTab, setActiveTab] = useState<TabType>('trending');
  const [memes, setMemes] = useState<Meme[]>(Array.isArray(initialMemes) ? initialMemes : []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(initialAfter || null);
  const [hasMore, setHasMore] = useState(true); 
  const [retryCount, setRetryCount] = useState(0);

  const observer = useRef<IntersectionObserver | null>(null);
  
  const loadMoreMemes = useCallback(async () => {
    if (loading || !hasMore || activeTab === 'templates') return;

    setLoading(true);
    setError(null);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); 
      
      const res = await fetch(`/api/memes${after ? `?after=${after}` : ''}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to fetch memes`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data.memes || !Array.isArray(data.memes)) {
        throw new Error('Invalid response format');
      }
      
      
      setRetryCount(0);
      
      
      if (data.memes.length > 0) {
        setMemes(prev => [...prev, ...data.memes]);
        setAfter(data.after);
        
        setHasMore(true);
      } else {
        
        setHasMore(true);
      }
    } catch (err) {
      console.error('Error fetching memes:', err);
      
      const currentRetryCount = retryCount + 1;
      setRetryCount(currentRetryCount);
      
      if (err instanceof Error && err.name === 'AbortError') {
        setError(`Request timed out. ${currentRetryCount < 3 ? 'Retrying...' : 'Please wait, generating content...'}`);
      } else {
        setError(`Failed to load more memes. ${currentRetryCount < 3 ? 'Retrying...' : 'Please wait, generating content...'}`);
      }
      
      
      if (currentRetryCount < 3) {
        setTimeout(() => {
          setError(null);
          loadMoreMemes();
        }, Math.min(1000 * Math.pow(2, currentRetryCount - 1), 5000)); 
      } else {
        
        setTimeout(() => {
          setError(null);
          setRetryCount(0);
          setAfter('cycle-0-0'); 
          loadMoreMemes();
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, activeTab, after, retryCount]);

  const lastMemeRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    
    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreMemes();
      }
    }, {
      rootMargin: '100px' 
    });

    if (node) {
      observer.current.observe(node);
    }
  }, [loading, hasMore, loadMoreMemes]);

  const handleTabChange = (tab: TabType) => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    
    if (tab === 'trending') {
      setMemes(initialMemes);
      setAfter(initialAfter || null);
      setHasMore(true); 
      setError(null);
      setRetryCount(0);
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

  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    setHasMore(true);
    loadMoreMemes();
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
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#c2f970] border-t-transparent" />
                  <span className="text-gray-400 text-sm">Loading more memes...</span>
                </div>
              </div>
            )}
            
            {error && (
              <div className="text-center py-4">
                <p className="text-red-400 mb-2 text-sm">{error}</p>
                {retryCount >= 3 && (
                  <button 
                    onClick={handleRetry}
                    className="px-4 py-2 bg-[#c2f970] text-black rounded-lg hover:bg-opacity-90 transition-colors text-sm"
                  >
                    Continue Scrolling
                  </button>
                )}
              </div>
            )}

            {memes.length === 0 && !loading && (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">No memes to display</p>
                <button 
                  onClick={handleRetry}
                  className="px-4 py-2 bg-[#c2f970] text-black rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  Start Loading
                </button>
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