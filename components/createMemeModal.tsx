/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect } from 'react';
import { X, Download, Copy } from 'lucide-react';
import { MemeTemplate } from '@/types';
import { generateMeme } from '@/lib/api';

interface CreateMemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: MemeTemplate[];
  initialTemplate: MemeTemplate | null;
}

export default function CreateMemeModal({ 
  isOpen, 
  onClose, 
  templates,
  initialTemplate 
}: CreateMemeModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate | null>(null);
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMemeUrl, setGeneratedMemeUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialTemplate) {
      setSelectedTemplate(initialTemplate);
    }
  }, [isOpen, initialTemplate]);

  if (!isOpen) return null;

  const handleGenerateMeme = async () => {
    if (!selectedTemplate) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const result = await generateMeme(
        selectedTemplate.id,
        topText,
        bottomText
      );
      
      if (result?.url) {
        setGeneratedMemeUrl(result.url);
      } else {
        setError('Failed to generate meme. Please try again.');
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedMemeUrl) return;
    
    try {
      const response = await fetch(generatedMemeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'meme.jpg';
      document.body.appendChild(a);
      a.click();    
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to download meme. Please try again.');
    }
  };

  const handleCopyLink = async () => {
    if (!generatedMemeUrl) return;
    
    try {
      await navigator.clipboard.writeText(generatedMemeUrl);
    } catch (error) {
      setError('Failed to copy link. Please try again.');
    }
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    setTopText('');
    setBottomText('');
    setGeneratedMemeUrl(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#c2f970]">Create Meme</h2>
          <button onClick={handleClose} className="hover:text-[#c2f970] transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {!selectedTemplate ? (
          <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {templates?.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-[#c2f970] transition-all"
              >
                <img 
                  src={template.url} 
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
              {generatedMemeUrl ? (
                <img 
                  src={generatedMemeUrl} 
                  alt="Generated meme"
                  className="w-full h-full object-contain"
                />
              ) : (
                <img 
                  src={selectedTemplate.url} 
                  alt={selectedTemplate.name}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            
            {!generatedMemeUrl && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Top text"
                  value={topText}
                  onChange={(e) => setTopText(e.target.value)}
                  className="w-full bg-gray-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#c2f970] outline-none"
                />
                <input
                  type="text"
                  placeholder="Bottom text"
                  value={bottomText}
                  onChange={(e) => setBottomText(e.target.value)}
                  className="w-full bg-gray-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#c2f970] outline-none"
                />
              </div>
            )}

            <div className="flex gap-4">
              {generatedMemeUrl ? (
                <>
                  <button 
                    onClick={handleDownload}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#c2f970] text-black px-4 py-2 rounded-lg font-semibold hover:bg-opacity-90"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </button>
                  <button 
                    onClick={handleCopyLink}
                    className="flex-1 flex items-center justify-center gap-2 border border-[#c2f970] text-[#c2f970] px-4 py-2 rounded-lg font-semibold hover:bg-[#c2f970] hover:text-black transition-colors"
                  >
                    <Copy className="w-5 h-5" />
                    Copy Link
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setSelectedTemplate(null)}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-600 hover:border-[#c2f970] transition-colors"
                  >
                    Change Template
                  </button>
                  <button 
                    onClick={handleGenerateMeme}
                    disabled={isGenerating || !topText || !bottomText}
                    className="flex-1 bg-[#c2f970] text-black px-4 py-2 rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Meme'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}