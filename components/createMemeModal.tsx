/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';

import { useState, useEffect } from 'react';
import { X, Download, Copy, Settings } from 'lucide-react';
import { MemeTemplate, TextCustomization, TextBox, TEMPLATE_TEXT_POSITIONS, getDefaultTextPositions } from '@/types';
import { generateMeme } from '@/lib/api';
import { analyzeImageWithCanvas, getCrowdsourcedPositions } from '@/lib/textPositionDetector';

interface CreateMemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: MemeTemplate[];
  initialTemplate: MemeTemplate | null;
}

const FONTS = [
  { name: 'Impact', value: 'Impact, "Arial Black", sans-serif' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Comic Sans', value: '"Comic Sans MS", cursive' },
  { name: 'Times', value: 'Times, "Times New Roman", serif' },
  { name: 'Courier', value: '"Courier New", monospace' },
  { name: 'Helvetica', value: 'Helvetica, Arial, sans-serif' }
];

const COLORS = [
  '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#A52A2A', '#808080', '#90EE90', '#FFB6C1'
];

const defaultTextStyle: TextCustomization = {
  text: '',
  color: '#FFFFFF',
  fontSize: 24,
  fontFamily: 'Impact, "Arial Black", sans-serif',
  bold: true,
  italic: false,
  strokeColor: '#000000',
  strokeWidth: 2,
  backgroundColor: 'transparent',
  padding: 4
};

const getTextBoxLabel = (templateId: string, boxIndex: number): string => {
  
  if (templateId === '181913649') { 
    return boxIndex === 0 ? 'No (top)' : 'Yes (bottom)';
  } else if (templateId === '87743020') { 
    return ['Left Button', 'Right Button', 'Person'][boxIndex] || `Text ${boxIndex + 1}`;
  } else if (templateId === '112126428') { 
    return ['Girlfriend', 'Boyfriend', 'Other Woman'][boxIndex] || `Text ${boxIndex + 1}`;
  } else if (templateId === '93895088') { 
    return [`Brain Level ${boxIndex + 1}`][0] || `Text ${boxIndex + 1}`;
  } else if (templateId === '131940431') { 
    return [`Step ${boxIndex + 1}`][0] || `Text ${boxIndex + 1}`;
  } else if (templateId === '131087935') { 
    return ['Person', 'Balloon 1', 'Balloon 2', 'Balloon 3', 'Bottom'][boxIndex] || `Text ${boxIndex + 1}`;
  } else if (templateId === '1035805') { 
    return ['Presenter', 'Person 1', 'Person 2', 'Person 3'][boxIndex] || `Text ${boxIndex + 1}`;
  }
  
  
  if (boxIndex === 0) return 'Top Text';
  if (boxIndex === 1) return 'Bottom Text';
  return `Text ${boxIndex + 1}`;
};

export default function CreateMemeModal({ 
  isOpen, 
  onClose, 
  templates,
  initialTemplate 
}: CreateMemeModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate | null>(null);
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMemeUrl, setGeneratedMemeUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTextEditor, setActiveTextEditor] = useState<number>(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isDetectingPositions, setIsDetectingPositions] = useState(false);
  const [detectedPositions, setDetectedPositions] = useState<Array<{
    x: number; y: number; width: number; height: number; score: number; reason: string;
  }>>([]);

  useEffect(() => {
    if (isOpen && initialTemplate) {
      setSelectedTemplate(initialTemplate);
      initializeTextBoxes(initialTemplate);
    }
  }, [isOpen, initialTemplate]);

  useEffect(() => {
    if (selectedTemplate) {
      initializeTextBoxes(selectedTemplate);
    }
  }, [selectedTemplate]);

  const initializeTextBoxes = (template: MemeTemplate) => {
    const positions = TEMPLATE_TEXT_POSITIONS[template.id] || getDefaultTextPositions(template.box_count);
    const newTextBoxes = positions.map(pos => ({
      ...pos,
      style: { ...defaultTextStyle }
    }));
    setTextBoxes(newTextBoxes);
    setActiveTextEditor(0);
  };

  const detectOptimalPositions = async () => {
    if (!selectedTemplate) return;
    
    setIsDetectingPositions(true);
    setError(null);
    
    try {
      
      const crowdsourcedPositions = await getCrowdsourcedPositions(selectedTemplate.id);
      if (crowdsourcedPositions.length > 0) {
        setDetectedPositions(crowdsourcedPositions);
        applyDetectedPositions(crowdsourcedPositions);
        setIsDetectingPositions(false);
        return;
      }

      
      const cvPositions = await analyzeImageWithCanvas(selectedTemplate.url);
      if (cvPositions.length > 0) {
        setDetectedPositions(cvPositions);
        applyDetectedPositions(cvPositions);
      } else {
        setError('Could not detect optimal text positions. Using default positions.');
      }
    } catch (error) {
      console.error('Position detection error:', error);
      setError('Position detection failed. Using default positions.');
    } finally {
      setIsDetectingPositions(false);
    }
  };

  const applyDetectedPositions = (positions: Array<{
    x: number; y: number; width: number; height: number; score: number; reason: string;
  }>) => {
    const newTextBoxes = positions.map((pos, index) => ({
      id: index,
      text: '',
      style: { ...defaultTextStyle },
      position: { x: pos.x, y: pos.y }
    }));
    setTextBoxes(newTextBoxes);
    setActiveTextEditor(0);
  };

  if (!isOpen) return null;

  const handleGenerateMeme = async () => {
    if (!selectedTemplate) return;
    
    setIsGenerating(true);
    setError(null);
    setGeneratedMemeUrl(null);
    
    try {
      const result = await generateMeme(selectedTemplate.id, textBoxes);
      
      if (result?.url) {
        const img = new Image();
        img.onload = () => {
          setGeneratedMemeUrl(result.url);
        };
        img.onerror = () => {
          setError('Generated meme could not be loaded. Please try again.');
        };
        img.src = result.url;
      } else {
        setError('Failed to generate meme. The service may be temporarily unavailable.');
      }
    } catch (error) {
      console.error('Meme generation error:', error);
      setError('Something went wrong. Please check your internet connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedMemeUrl) return;
    
    try {
      const response = await fetch(generatedMemeUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meme-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();    
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to download meme. Please try right-clicking and saving the image.');
    }
  };

  const handleCopyLink = async () => {
    if (!generatedMemeUrl) return;
    
    try {
      await navigator.clipboard.writeText(generatedMemeUrl);
      const originalError = error;
      setError('Link copied to clipboard!');
      setTimeout(() => setError(originalError), 2000);
    } catch (error) {
      setError('Failed to copy link. Please select and copy the URL manually.');
    }
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    setTextBoxes([]);
    setGeneratedMemeUrl(null);
    setError(null);
    setShowAdvanced(false);
    onClose();
  };

  const updateTextBox = (index: number, updates: Partial<TextBox>) => {
    setTextBoxes(prev => prev.map((box, i) => 
      i === index ? { ...box, ...updates } : box
    ));
  };

  const updateTextStyle = (index: number, updates: Partial<TextCustomization>) => {
    updateTextBox(index, { 
      style: { ...textBoxes[index]?.style, ...updates }
    });
  };

  const getCurrentTextBox = () => {
    return textBoxes[activeTextEditor];
  };

  const ColorPicker = ({ value, onChange }: { value: string; onChange: (color: string) => void }) => (
    <div className="flex flex-wrap gap-2">
      {COLORS.map(color => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className={`w-8 h-8 rounded border-2 ${value === color ? 'border-[#c2f970]' : 'border-gray-600'}`}
          style={{ backgroundColor: color }}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded border-2 border-gray-600 cursor-pointer"
      />
    </div>
  );

  const hasText = textBoxes.some(box => box.text.trim().length > 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#c2f970]">Create Meme</h2>
          <button onClick={handleClose} className="hover:text-[#c2f970] transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className={`mb-4 p-3 border rounded-lg ${
            error.includes('copied') ? 'bg-green-900/50 border-green-500 text-green-200' : 'bg-red-900/50 border-red-500 text-red-200'
          }`}>
            {error}
          </div>
        )}

        {!selectedTemplate ? (
          <div>
            <h3 className="text-lg font-semibold mb-4">Choose a Template</h3>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
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
                  <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-75 p-2">
                    <p className="text-xs text-white truncate">{template.name}</p>
                    <p className="text-xs text-gray-400">{template.box_count} text box{template.box_count !== 1 ? 'es' : ''}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Preview</h3>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                {isGenerating ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#c2f970] border-t-transparent mx-auto mb-4" />
                      <p className="text-gray-400">Generating your meme...</p>
                    </div>
                  </div>
                ) : generatedMemeUrl ? (
                  <img 
                    src={generatedMemeUrl} 
                    alt="Generated meme"
                    className="w-full h-full object-contain"
                    onError={() => setError('Failed to load generated meme. Please try again.')}
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <img 
                      src={selectedTemplate.url} 
                      alt={selectedTemplate.name}
                      className="w-full h-full object-contain"
                    />
                    
                    {textBoxes.map((box, index) => (
                      box.text && (
                        <div 
                          key={index}
                          className="absolute text-center pointer-events-none"
                          style={{
                            left: `${box.position.x}%`,
                            top: `${box.position.y}%`,
                            transform: 'translate(-50%, -50%)',
                            fontFamily: box.style.fontFamily,
                            fontSize: `${Math.min(box.style.fontSize, 20)}px`, 
                            color: box.style.color,
                            fontWeight: box.style.bold ? 'bold' : 'normal',
                            fontStyle: box.style.italic ? 'italic' : 'normal',
                            textShadow: `1px 1px 0 ${box.style.strokeColor}, -1px -1px 0 ${box.style.strokeColor}, 1px -1px 0 ${box.style.strokeColor}, -1px 1px 0 ${box.style.strokeColor}`,
                            backgroundColor: box.style.backgroundColor !== 'transparent' ? box.style.backgroundColor : undefined,
                            padding: box.style.backgroundColor !== 'transparent' ? `${box.style.padding}px` : undefined,
                            borderRadius: box.style.backgroundColor !== 'transparent' ? '4px' : undefined,
                            maxWidth: '80%',
                            lineHeight: '1.2'
                          }}
                        >
                          {box.text.toUpperCase()}
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
              
              {generatedMemeUrl && (
                <div className="flex gap-4">
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
                </div>
              )}
            </div>

            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Edit Text ({textBoxes.length} box{textBoxes.length !== 1 ? 'es' : ''})</h3>
                <div className="flex gap-2">
                  <button
                    onClick={detectOptimalPositions}
                    disabled={isDetectingPositions}
                    className="flex items-center gap-2 px-3 py-1 rounded-lg border border-blue-600 text-blue-400 hover:border-blue-500 hover:text-blue-300 transition-colors disabled:opacity-50"
                  >
                    {isDetectingPositions ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent" />
                    ) : (
                      <Settings className="w-4 h-4" />
                    )}
                    {isDetectingPositions ? 'Detecting...' : 'Smart Positions'}
                  </button>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 px-3 py-1 rounded-lg border border-gray-600 hover:border-[#c2f970] transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    {showAdvanced ? 'Basic' : 'Advanced'}
                  </button>
                </div>
              </div>

              
              {detectedPositions.length > 0 && (
                <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">Smart Positions Applied!</h4>
                  <div className="text-xs text-blue-300 space-y-1">
                    {detectedPositions.slice(0, 3).map((pos, index) => (
                      <div key={index}>• {pos.reason} (Score: {Math.round(pos.score * 100)}%)</div>
                    ))}
                    {detectedPositions.length > 3 && (
                      <div>... and {detectedPositions.length - 3} more positions</div>
                    )}
                  </div>
                </div>
              )}

              
              {textBoxes.length > 1 && (
                <div className="flex gap-1 flex-wrap">
                  {textBoxes.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveTextEditor(index)}
                      className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                        activeTextEditor === index 
                          ? 'bg-[#c2f970] text-black' 
                          : 'border border-gray-600 hover:border-[#c2f970]'
                      }`}
                    >
                      {getTextBoxLabel(selectedTemplate.id, index)}
                    </button>
                  ))}
                </div>
              )}

              
              {getCurrentTextBox() && (
                <input
                  type="text"
                  placeholder={`Enter ${getTextBoxLabel(selectedTemplate.id, activeTextEditor).toLowerCase()}`}
                  value={getCurrentTextBox().text}
                  onChange={(e) => updateTextBox(activeTextEditor, { text: e.target.value })}
                  className="w-full bg-gray-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#c2f970] outline-none"
                  maxLength={100}
                />
              )}

              {showAdvanced && getCurrentTextBox() && (
                <div className="space-y-4 p-4 bg-gray-800 rounded-lg">
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Font</label>
                    <select
                      value={getCurrentTextBox().style.fontFamily}
                      onChange={(e) => updateTextStyle(activeTextEditor, { fontFamily: e.target.value })}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#c2f970] outline-none"
                    >
                      {FONTS.map(font => (
                        <option key={font.name} value={font.value}>{font.name}</option>
                      ))}
                    </select>
                  </div>

                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Size: {getCurrentTextBox().style.fontSize}px</label>
                    <input
                      type="range"
                      min="12"
                      max="48"
                      value={getCurrentTextBox().style.fontSize}
                      onChange={(e) => updateTextStyle(activeTextEditor, { fontSize: parseInt(e.target.value) })}
                      className="w-full accent-[#c2f970]"
                    />
                  </div>

                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Text Color</label>
                    <ColorPicker
                      value={getCurrentTextBox().style.color}
                      onChange={(color) => updateTextStyle(activeTextEditor, { color })}
                    />
                  </div>

                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Outline Color</label>
                    <ColorPicker
                      value={getCurrentTextBox().style.strokeColor}
                      onChange={(color) => updateTextStyle(activeTextEditor, { strokeColor: color })}
                    />
                  </div>

                  
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={getCurrentTextBox().style.bold}
                        onChange={(e) => updateTextStyle(activeTextEditor, { bold: e.target.checked })}
                        className="accent-[#c2f970]"
                      />
                      <span className="text-sm">Bold</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={getCurrentTextBox().style.italic}
                        onChange={(e) => updateTextStyle(activeTextEditor, { italic: e.target.checked })}
                        className="accent-[#c2f970]"
                      />
                      <span className="text-sm">Italic</span>
                    </label>
                  </div>
                </div>
              )}

              {!generatedMemeUrl && (
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setSelectedTemplate(null)}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-600 hover:border-[#c2f970] transition-colors"
                  >
                    Change Template
                  </button>
                  <button 
                    onClick={handleGenerateMeme}
                    disabled={isGenerating || !hasText}
                    className="flex-1 bg-[#c2f970] text-black px-4 py-2 rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Meme'}
                  </button>
                </div>
              )}

              {generatedMemeUrl && (
                <button 
                  onClick={() => {
                    setGeneratedMemeUrl(null);
                    setError(null);
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-[#c2f970] text-[#c2f970] hover:bg-[#c2f970] hover:text-black transition-colors"
                >
                  Create Another Meme
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}